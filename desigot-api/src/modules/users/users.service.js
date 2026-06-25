'use strict';
const { query, queryRead, withTransaction } = require('../../db/pool');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../shared/errors/AppError');
const { buildSetClause, paginate } = require('../../shared/utils');

// ── Profile ───────────────────────────────────────────────────────────────────
const getProfile = async (userId) => {
  const { rows } = await queryRead(
    `SELECT id, email, email_verified_at, display_name, username, avatar_url, bio,
            timezone, locale, role, account_status, seller_verified, seller_type,
            response_rate, total_sales, avg_seller_rating, seller_review_count,
            marketing_consent, created_at, last_seen_at
       FROM users WHERE id=$1 AND deleted_at IS NULL`,
    [userId]
  );
  if (!rows.length) throw new NotFoundError('User');
  return rows[0];
};

const getPublicProfile = async (username) => {
  const { rows } = await queryRead(
    `SELECT id, display_name, username, avatar_url, bio, seller_verified, seller_type,
            total_sales, avg_seller_rating, seller_review_count, response_rate, created_at
       FROM users WHERE username=$1 AND deleted_at IS NULL AND account_status='active'`,
    [username]
  );
  if (!rows.length) throw new NotFoundError('User');
  return rows[0];
};

const updateProfile = async (userId, updates) => {
  const allowed = ['display_name', 'username', 'bio', 'timezone', 'locale', 'marketing_consent', 'seller_type'];
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(filtered).length) return getProfile(userId);

  if (filtered.username) {
    const { rows } = await query('SELECT id FROM users WHERE username=$1 AND id<>$2', [filtered.username, userId]);
    if (rows.length) throw new ConflictError('Username already taken');
  }

  const { clause, values, nextIdx } = buildSetClause(filtered);
  const { rows } = await query(
    `UPDATE users SET ${clause}, updated_at=NOW() WHERE id=$${nextIdx} AND deleted_at IS NULL RETURNING *`,
    [...values, userId]
  );
  if (!rows.length) throw new NotFoundError('User');
  return rows[0];
};

const softDeleteUser = async (userId) => {
  // Anonymise PII before soft delete (GDPR Article 17)
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE users
         SET email='deleted_${userId}@desigot.invalid',
             display_name='Deleted User',
             username=NULL, bio=NULL, avatar_url=NULL,
             password_hash=NULL, totp_secret=NULL,
             deleted_at=NOW(), updated_at=NOW()
       WHERE id=$1`,
      [userId]
    );
    await client.query(`UPDATE user_sessions SET revoked_at=NOW() WHERE user_id=$1`, [userId]);
  });
};

// ── KYC ──────────────────────────────────────────────────────────────────────
const submitKYC = async (userId, method, documentKey) => {
  const { rows } = await query(
    `INSERT INTO user_kyc_verifications (user_id, method, document_key, status)
     VALUES ($1,$2,$3,'pending') RETURNING *`,
    [userId, method, documentKey]
  );
  return rows[0];
};

const listKYC = async (filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const status = filters.status || null;
  const { rows } = await queryRead(
    `SELECT k.*, u.email, u.display_name FROM user_kyc_verifications k
       JOIN users u ON u.id = k.user_id
      WHERE ($1::TEXT IS NULL OR k.status=$1)
      ORDER BY k.submitted_at DESC LIMIT $2 OFFSET $3`,
    [status, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM user_kyc_verifications WHERE ($1::TEXT IS NULL OR status=$1)`, [status]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

const reviewKYC = async (kycId, reviewerId, status, notes) => {
  const { rows } = await query(
    `UPDATE user_kyc_verifications
        SET status=$1, reviewer_id=$2, reviewer_notes=$3, reviewed_at=NOW(), updated_at=NOW()
      WHERE id=$4 RETURNING *`,
    [status, reviewerId, notes, kycId]
  );
  if (!rows.length) throw new NotFoundError('KYC record');
  if (status === 'approved') {
    await query(`UPDATE users SET seller_verified=TRUE WHERE id=$1`, [rows[0].user_id]);
  }
  return rows[0];
};

// ── Sessions ──────────────────────────────────────────────────────────────────
const listSessions = async (userId) => {
  const { rows } = await queryRead(
    `SELECT id, device_info, ip_address, created_at, last_used_at, expires_at
       FROM user_sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY last_used_at DESC`,
    [userId]
  );
  return rows;
};

const revokeSession = async (userId, sessionId) => {
  const { rows } = await query(
    `UPDATE user_sessions SET revoked_at=NOW()
      WHERE id=$1 AND user_id=$2 RETURNING id`,
    [sessionId, userId]
  );
  if (!rows.length) throw new NotFoundError('Session');
  return { message: 'Session revoked' };
};

// ── Backup codes ──────────────────────────────────────────────────────────────
const generateBackupCodes = async (userId) => {
  const bcrypt = require('bcryptjs');
  const codes = Array.from({ length: 10 }, () =>
    require('crypto').randomBytes(4).toString('hex').toUpperCase()
  );
  await query(`DELETE FROM user_2fa_backup_codes WHERE user_id=$1`, [userId]);
  for (const code of codes) {
    const hash = await bcrypt.hash(code, 10);
    await query(`INSERT INTO user_2fa_backup_codes (user_id, code_hash) VALUES ($1,$2)`, [userId, hash]);
  }
  return { codes }; // Plain codes shown once
};

// ── Admin: list users ─────────────────────────────────────────────────────────
const listUsers = async (filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { role, status, search } = filters;
  const { rows } = await queryRead(
    `SELECT id, email, display_name, username, role, account_status, seller_verified,
            total_sales, avg_seller_rating, created_at, last_seen_at
       FROM users
      WHERE deleted_at IS NULL
        AND ($1::TEXT IS NULL OR role=$1)
        AND ($2::TEXT IS NULL OR account_status=$2)
        AND ($3::TEXT IS NULL OR display_name ILIKE '%'||$3||'%' OR email ILIKE '%'||$3||'%')
      ORDER BY created_at DESC LIMIT $4 OFFSET $5`,
    [role || null, status || null, search || null, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL
       AND ($1::TEXT IS NULL OR role=$1) AND ($2::TEXT IS NULL OR account_status=$2)
       AND ($3::TEXT IS NULL OR display_name ILIKE '%'||$3||'%' OR email ILIKE '%'||$3||'%')`,
    [role || null, status || null, search || null]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

const updateUserStatus = async (adminId, userId, status, reason) => {
  const { rows } = await query(
    `UPDATE users SET account_status=$1, updated_at=NOW() WHERE id=$2 AND deleted_at IS NULL RETURNING id, email, account_status`,
    [status, userId]
  );
  if (!rows.length) throw new NotFoundError('User');
  return rows[0];
};

// ── Seller health score ───────────────────────────────────────────────────────
const getSellerHealth = async (sellerId) => {
  const { rows } = await queryRead(
    `SELECT * FROM seller_health_scores WHERE seller_id=$1`, [sellerId]
  );
  return rows[0] || null;
};

// ── Seller balance ────────────────────────────────────────────────────────────
const getSellerBalance = async (sellerId) => {
  const { rows } = await queryRead(
    `SELECT * FROM seller_balances WHERE seller_id=$1`, [sellerId]
  );
  return rows[0] || { seller_id: sellerId, available_cents: 0, pending_escrow_cents: 0, lifetime_earned_cents: 0 };
};

module.exports = {
  getProfile, getPublicProfile, updateProfile, softDeleteUser,
  submitKYC, listKYC, reviewKYC,
  listSessions, revokeSession,
  generateBackupCodes,
  listUsers, updateUserStatus,
  getSellerHealth, getSellerBalance,
};
