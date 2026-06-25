'use strict';
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode    = require('qrcode');
const crypto    = require('crypto');
const config    = require('../../config');
const { query, withTransaction } = require('../../db/pool');
const { sha256, randomToken }    = require('../../shared/utils');
const {
  ConflictError, UnauthorizedError, NotFoundError, ForbiddenError, ValidationError,
} = require('../../shared/errors/AppError');

// ── Token helpers ────────────────────────────────────────────────────────────
const signAccess  = (userId, role) =>
  jwt.sign({ sub: userId, role }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });

const signRefresh = (userId) =>
  jwt.sign({ sub: userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

// ── Register ─────────────────────────────────────────────────────────────────
const register = async ({ email, password, display_name, role = 'buyer' }) => {
  const { rows: exists } = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.length) throw new ConflictError('Email already registered');

  const hash = await bcrypt.hash(password, config.bcrypt.rounds);

  const { rows } = await query(
    `INSERT INTO users (email, password_hash, display_name, role, account_status, gdpr_consent_at)
     VALUES ($1, $2, $3, $4, 'pending_verification', NOW())
     RETURNING id, email, display_name, role, account_status, created_at`,
    [email, hash, display_name, role]
  );

  const user = rows[0];
  const accessToken  = signAccess(user.id, user.role);
  const refreshToken = signRefresh(user.id);
  await _storeRefreshToken(user.id, refreshToken, null, null);

  return { user, accessToken, refreshToken };
};

// ── Login ────────────────────────────────────────────────────────────────────
const login = async ({ email, password, totp_code, ip, userAgent }) => {
  const { rows } = await query(
    `SELECT id, email, password_hash, role, account_status, failed_login_count,
            locked_until, totp_enabled, totp_secret, seller_verified
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  );
  if (!rows.length) throw new UnauthorizedError('Invalid credentials');

  const user = rows[0];
  if (user.account_status === 'banned') throw new ForbiddenError('Account banned');
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new ForbiddenError(`Account locked until ${user.locked_until}`);
  }

  const valid = await bcrypt.compare(password, user.password_hash || '');
  if (!valid) {
    const newCount = user.failed_login_count + 1;
    const lockUntil = newCount >= 5 ? new Date(Date.now() + 30 * 60_000) : null;
    await query(
      `UPDATE users SET failed_login_count=$1, locked_until=$2 WHERE id=$3`,
      [newCount, lockUntil, user.id]
    );
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.totp_enabled) {
    if (!totp_code) throw new ValidationError('2FA code required', [{ field: 'totp_code', message: '2FA code required' }]);
    const valid2fa = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: totp_code,
      window: 1,
    });
    if (!valid2fa) throw new UnauthorizedError('Invalid 2FA code');
  }

  // Reset failed login counter
  await query(`UPDATE users SET failed_login_count=0, locked_until=NULL, last_seen_at=NOW() WHERE id=$1`, [user.id]);

  const accessToken  = signAccess(user.id, user.role);
  const refreshToken = signRefresh(user.id);
  await _storeRefreshToken(user.id, refreshToken, ip, userAgent);

  const { password_hash, totp_secret, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
};

// ── Refresh ──────────────────────────────────────────────────────────────────
const refreshTokens = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const tokenHash = sha256(refreshToken);
  const { rows } = await query(
    `SELECT s.id, u.id AS uid, u.role
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.refresh_token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()`,
    [tokenHash]
  );
  if (!rows.length) throw new UnauthorizedError('Session expired or revoked');

  const { uid, role, id: sessionId } = rows[0];
  // Rotate: revoke old, issue new
  await query(`UPDATE user_sessions SET revoked_at=NOW() WHERE id=$1`, [sessionId]);
  const newRefresh = signRefresh(uid);
  const newAccess  = signAccess(uid, role);
  await _storeRefreshToken(uid, newRefresh, null, null);

  return { accessToken: newAccess, refreshToken: newRefresh };
};

// ── Logout ───────────────────────────────────────────────────────────────────
const logout = async (refreshToken) => {
  if (!refreshToken) return;
  const hash = sha256(refreshToken);
  await query(`UPDATE user_sessions SET revoked_at=NOW() WHERE refresh_token_hash=$1`, [hash]);
};

// ── Logout all devices ───────────────────────────────────────────────────────
const logoutAll = async (userId) => {
  await query(`UPDATE user_sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL`, [userId]);
};

// ── Verify email (token-based) ───────────────────────────────────────────────
const verifyEmail = async (userId) => {
  await query(
    `UPDATE users SET email_verified_at=NOW(), account_status='active' WHERE id=$1 AND email_verified_at IS NULL`,
    [userId]
  );
};

// ── 2FA setup ────────────────────────────────────────────────────────────────
const setup2FA = async (userId) => {
  const { rows } = await query('SELECT email FROM users WHERE id=$1', [userId]);
  if (!rows.length) throw new NotFoundError('User');
  const secret = speakeasy.generateSecret({ name: `Desigot (${rows[0].email})`, length: 20 });
  // Store temp secret (not enabled yet)
  await query(`UPDATE users SET totp_secret=$1 WHERE id=$2`, [secret.base32, userId]);
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
  return { secret: secret.base32, qrCodeUrl };
};

const confirm2FA = async (userId, totpCode) => {
  const { rows } = await query('SELECT totp_secret FROM users WHERE id=$1', [userId]);
  if (!rows.length) throw new NotFoundError('User');
  const valid = speakeasy.totp.verify({ secret: rows[0].totp_secret, encoding: 'base32', token: totpCode, window: 1 });
  if (!valid) throw new ValidationError('Invalid 2FA code');
  await query(`UPDATE users SET totp_enabled=TRUE WHERE id=$1`, [userId]);
  return { message: '2FA enabled successfully' };
};

const disable2FA = async (userId, password) => {
  const { rows } = await query('SELECT password_hash FROM users WHERE id=$1', [userId]);
  if (!rows.length) throw new NotFoundError('User');
  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) throw new UnauthorizedError('Invalid password');
  await query(`UPDATE users SET totp_enabled=FALSE, totp_secret=NULL WHERE id=$1`, [userId]);
  return { message: '2FA disabled' };
};

// ── Change password ───────────────────────────────────────────────────────────
const changePassword = async (userId, currentPassword, newPassword) => {
  const { rows } = await query('SELECT password_hash FROM users WHERE id=$1', [userId]);
  if (!rows.length) throw new NotFoundError('User');
  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');
  const hash = await bcrypt.hash(newPassword, config.bcrypt.rounds);
  await query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, userId]);
  await logoutAll(userId);
  return { message: 'Password changed. All sessions revoked.' };
};

// ── OAuth upsert ─────────────────────────────────────────────────────────────
const oauthUpsert = async ({ provider, providerUserId, email, displayName, avatarUrl, ip, userAgent }) => {
  return withTransaction(async (client) => {
    // Find existing OAuth link
    let { rows } = await client.query(
      `SELECT u.id, u.role, u.account_status FROM user_oauth_accounts oa
         JOIN users u ON u.id = oa.user_id
        WHERE oa.provider=$1 AND oa.provider_user_id=$2`,
      [provider, providerUserId]
    );

    let userId, role;
    if (rows.length) {
      ({ id: userId, role } = rows[0]);
      await client.query(`UPDATE users SET last_seen_at=NOW() WHERE id=$1`, [userId]);
    } else {
      // Find or create user by email
      let userRows = (await client.query('SELECT id, role FROM users WHERE email=$1', [email])).rows;
      if (!userRows.length) {
        userRows = (await client.query(
          `INSERT INTO users (email, display_name, avatar_url, account_status, email_verified_at, gdpr_consent_at)
           VALUES ($1,$2,$3,'active',NOW(),NOW()) RETURNING id, role`,
          [email, displayName, avatarUrl]
        )).rows;
      }
      userId = userRows[0].id;
      role   = userRows[0].role;
      await client.query(
        `INSERT INTO user_oauth_accounts (user_id, provider, provider_user_id, provider_email)
         VALUES ($1,$2,$3,$4) ON CONFLICT (provider, provider_user_id) DO NOTHING`,
        [userId, provider, providerUserId, email]
      );
    }

    const accessToken  = signAccess(userId, role);
    const refreshToken = signRefresh(userId);
    await _storeRefreshToken(userId, refreshToken, ip, userAgent);
    return { userId, role, accessToken, refreshToken };
  });
};

// ── Private helpers ───────────────────────────────────────────────────────────
const _storeRefreshToken = async (userId, token, ip, userAgent) => {
  const hash = sha256(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO user_sessions (user_id, refresh_token_hash, ip_address, device_info, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [userId, hash, ip, userAgent, expiresAt]
  );
};

module.exports = {
  register, login, refreshTokens, logout, logoutAll,
  verifyEmail, setup2FA, confirm2FA, disable2FA, changePassword, oauthUpsert,
};
