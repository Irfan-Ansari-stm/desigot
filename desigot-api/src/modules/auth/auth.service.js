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
    `SELECT u.id, u.email, u.password_hash, u.username, u.display_name, u.first_name, u.last_name, u.phone,
            u.role, u.is_super_admin, u.account_status, u.failed_login_count,
            u.locked_until, u.totp_enabled, u.totp_secret, u.seller_verified,
            u.department_id, u.designation_id, d.name AS department_name, des.title AS designation_title
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN designations des ON des.id = u.designation_id
      WHERE u.email = $1 AND u.deleted_at IS NULL`,
    [email]
  );
  if (!rows.length) {
    await query(
      `INSERT INTO login_history (email, ip_address, user_agent, status, failure_reason)
       VALUES ($1, $2, $3, 'failed', 'User not found')`,
      [email, ip, userAgent]
    ).catch(() => {});
    throw new UnauthorizedError('Invalid credentials');
  }

  const user = rows[0];
  if (user.account_status === 'banned') {
    await query(
      `INSERT INTO login_history (user_id, email, ip_address, user_agent, status, failure_reason)
       VALUES ($1, $2, $3, $4, 'blocked', 'Account banned')`,
      [user.id, email, ip, userAgent]
    ).catch(() => {});
    throw new ForbiddenError('Account is banned');
  }
  if (user.account_status === 'suspended') {
    await query(
      `INSERT INTO login_history (user_id, email, ip_address, user_agent, status, failure_reason)
       VALUES ($1, $2, $3, $4, 'blocked', 'Account suspended')`,
      [user.id, email, ip, userAgent]
    ).catch(() => {});
    throw new ForbiddenError('Account is currently suspended');
  }
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    await query(
      `INSERT INTO login_history (user_id, email, ip_address, user_agent, status, failure_reason)
       VALUES ($1, $2, $3, $4, 'blocked', 'Account locked')`,
      [user.id, email, ip, userAgent]
    ).catch(() => {});
    throw new ForbiddenError(`Account locked until ${user.locked_until}`);
  }

  const valid = await bcrypt.compare(password, user.password_hash || '');
  if (!valid) {
    const newCount = user.failed_login_count + 1;
    const lockUntil = newCount >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
    await query(
      `UPDATE users SET failed_login_count=$1, locked_until=$2 WHERE id=$3`,
      [newCount, lockUntil, user.id]
    );
    await query(
      `INSERT INTO login_history (user_id, email, ip_address, user_agent, status, failure_reason)
       VALUES ($1, $2, $3, $4, 'failed', 'Invalid password')`,
      [user.id, email, ip, userAgent]
    ).catch(() => {});
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
    if (!valid2fa) {
      await query(
        `INSERT INTO login_history (user_id, email, ip_address, user_agent, status, failure_reason)
         VALUES ($1, $2, $3, $4, 'failed', 'Invalid 2FA code')`,
        [user.id, email, ip, userAgent]
      ).catch(() => {});
      throw new UnauthorizedError('Invalid 2FA code');
    }
  }

  // Reset failed login counter and record last_login_at
  await query(
    `UPDATE users SET failed_login_count=0, locked_until=NULL, last_seen_at=NOW(), last_login_at=NOW() WHERE id=$1`,
    [user.id]
  );

  // Record successful login in history
  await query(
    `INSERT INTO login_history (user_id, email, ip_address, user_agent, status)
     VALUES ($1, $2, $3, $4, 'success')`,
    [user.id, email, ip, userAgent]
  ).catch(() => {});

  const accessToken  = signAccess(user.id, user.role);
  const refreshToken = signRefresh(user.id);
  await _storeRefreshToken(user.id, refreshToken, ip, userAgent);

  // Resolve RBAC permissions
  const rbacService = require('../rbac/rbac.service');
  const effective = await rbacService.getUserEffectivePermissions(user.id);

  const { password_hash, totp_secret, ...safeUser } = user;
  safeUser.is_super_admin = effective.isSuperAdmin || user.is_super_admin || user.role === 'superadmin';
  safeUser.roles = effective.roles;
  safeUser.permissions = effective.permissions;
  safeUser.hierarchyLevel = effective.hierarchyLevel;

  return { user: safeUser, accessToken, refreshToken };
};

// ── Get Current Authenticated User (ME) ───────────────────────────────────────
const getMe = async (userId) => {
  const { rows } = await query(
    `SELECT u.id, u.email, u.username, u.display_name, u.first_name, u.last_name, u.phone,
            u.role, u.is_super_admin, u.account_status, u.avatar_url, u.bio,
            u.totp_enabled, u.seller_verified, u.department_id, u.designation_id,
            u.last_seen_at, u.last_login_at, u.created_at,
            d.name AS department_name, des.title AS designation_title
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN designations des ON des.id = u.designation_id
      WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [userId]
  );
  if (!rows.length) throw new NotFoundError('User');
  const user = rows[0];

  const rbacService = require('../rbac/rbac.service');
  const effective = await rbacService.getUserEffectivePermissions(user.id);
  user.is_super_admin = effective.isSuperAdmin || user.is_super_admin || user.role === 'superadmin';
  user.roles = effective.roles;
  user.permissions = effective.permissions;
  user.hierarchyLevel = effective.hierarchyLevel;

  return user;
};

// ── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  const { rows } = await query('SELECT id, email, display_name FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  if (!rows.length) {
    // Return generic message to prevent email enumeration
    return { message: 'If an account exists with that email, a password reset link has been dispatched.' };
  }

  const user = rows[0];
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  return {
    message: 'If an account exists with that email, a password reset link has been dispatched.',
    // In dev environment, return the reset token for ease of testing
    resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
  };
};

// ── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (token, newPassword) => {
  const tokenHash = sha256(token);
  const { rows } = await query(
    `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()`,
    [tokenHash]
  );
  if (!rows.length) throw new BadRequestError('Invalid or expired password reset token');

  const { id: tokenId, user_id: userId } = rows[0];
  const hash = await bcrypt.hash(newPassword, config.bcrypt.rounds);

  await withTransaction(async (client) => {
    await client.query(`UPDATE users SET password_hash = $1, failed_login_count = 0, locked_until = NULL, updated_at = NOW() WHERE id = $2`, [hash, userId]);
    await client.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [tokenId]);
    await client.query(`UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1`, [userId]);
  });

  return { message: 'Password has been reset successfully. Please log in with your new credentials.' };
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
  register, login, getMe, refreshTokens, logout, logoutAll,
  verifyEmail, setup2FA, confirm2FA, disable2FA, changePassword, oauthUpsert,
  forgotPassword, resetPassword,
};
