'use strict';
const slugify = require('slugify');
const crypto = require('crypto');

/**
 * Build a URL-safe slug, appending a short random suffix to avoid collisions.
 */
const makeSlug = (text, suffix = true) => {
  const base = slugify(text, { lower: true, strict: true, trim: true });
  if (!suffix) return base;
  const rand = crypto.randomBytes(3).toString('hex');
  return `${base}-${rand}`;
};

/**
 * Strip undefined keys from an object (useful for PATCH updates).
 */
const stripUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/**
 * Build a parameterised SET clause for dynamic UPDATE queries.
 * Returns { clause: 'col1=$1, col2=$2', values: [...], nextIdx }
 */
const buildSetClause = (fields, startIdx = 1) => {
  const keys = Object.keys(fields);
  const clause = keys.map((k, i) => `"${k}" = $${startIdx + i}`).join(', ');
  const values = Object.values(fields);
  return { clause, values, nextIdx: startIdx + keys.length };
};

/**
 * Paginate helper — returns { limit, offset, page } from query params.
 */
const paginate = (query) => {
  const page   = Math.max(1, parseInt(query.page, 10)  || 1);
  const limit  = Math.min(100, parseInt(query.limit, 10) || 20);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Standard success response shape.
 */
const successResponse = (res, data, statusCode = 200, meta = {}) =>
  res.status(statusCode).json({ success: true, data, ...meta });

/**
 * Standard paginated response shape.
 */
const paginatedResponse = (res, data, total, page, limit) =>
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });

/**
 * Hash a plain string with SHA-256 (for idempotency keys, token hashes).
 */
const sha256 = (str) => crypto.createHash('sha256').update(str).digest('hex');

/**
 * Generate a cryptographically secure random token.
 */
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

/**
 * Convert cents to decimal string  e.g. 2999 → "29.99"
 */
const centsToDecimal = (cents) => (cents / 100).toFixed(2);

/**
 * Convert decimal to cents  e.g. 29.99 → 2999
 */
const decimalToCents = (amount) => Math.round(parseFloat(amount) * 100);

module.exports = {
  makeSlug,
  stripUndefined,
  buildSetClause,
  paginate,
  successResponse,
  paginatedResponse,
  sha256,
  randomToken,
  centsToDecimal,
  decimalToCents,
};
