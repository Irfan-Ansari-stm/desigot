'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError, ForbiddenError } = require('../shared/errors/AppError');
const { query } = require('../db/pool');

/**
 * Verify the Bearer access token and attach req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, config.jwt.accessSecret);

    // Load fresh user from DB to catch suspensions / bans applied after token issue
    const { rows } = await query(
      `SELECT id, email, role, account_status, seller_verified
         FROM users
        WHERE id = $1 AND deleted_at IS NULL`,
      [payload.sub]
    );

    if (!rows.length) throw new UnauthorizedError('User not found');
    const user = rows[0];
    if (user.account_status === 'suspended' || user.account_status === 'banned') {
      throw new ForbiddenError(`Account is ${user.account_status}`);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional authenticate — sets req.user if token present, continues if not.
 */
const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  return authenticate(req, res, next);
};

/**
 * Role guard factory. Pass one or more allowed roles.
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new UnauthorizedError());
  if (!roles.includes(req.user.role)) {
    return next(new ForbiddenError(`Requires role: ${roles.join(' | ')}`));
  }
  return next();
};

const requireAdmin    = requireRole('admin', 'superadmin');
const requireSeller   = requireRole('seller', 'admin', 'superadmin');
const requireVerifiedSeller = (req, res, next) => {
  if (!req.user) return next(new UnauthorizedError());
  if (!['seller', 'admin', 'superadmin'].includes(req.user.role)) {
    return next(new ForbiddenError('Seller account required'));
  }
  if (!req.user.seller_verified && req.user.role === 'seller') {
    return next(new ForbiddenError('Seller account not yet verified'));
  }
  return next();
};

/**
 * Validate an API key from the X-API-Key header (for public API access).
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) throw new UnauthorizedError('API key required');

    const prefix = apiKey.slice(0, 12);
    const { rows } = await query(
      `SELECT ak.id, ak.user_id, ak.scopes, ak.rate_limit_rpm, u.role, u.account_status
         FROM api_keys ak
         JOIN users u ON u.id = ak.user_id
        WHERE ak.key_prefix = $1
          AND ak.is_active = TRUE
          AND ak.revoked_at IS NULL
          AND (ak.expires_at IS NULL OR ak.expires_at > NOW())`,
      [prefix]
    );

    if (!rows.length) throw new UnauthorizedError('Invalid API key');

    // Update last_used_at asynchronously
    query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [rows[0].id]).catch(() => {});

    req.apiKey = rows[0];
    req.user   = { id: rows[0].user_id, role: rows[0].role, account_status: rows[0].account_status };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, optionalAuthenticate, requireRole, requireAdmin, requireSeller, requireVerifiedSeller, authenticateApiKey };
