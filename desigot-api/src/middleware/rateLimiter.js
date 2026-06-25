'use strict';
const rateLimit = require('express-rate-limit');
const config = require('../config');

const createLimiter = (options = {}) =>
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' },
    ...options,
  });

const globalLimiter   = createLimiter();
const authLimiter     = createLimiter({ windowMs: 15 * 60_000, max: 20 });  // 20 per 15 min
const uploadLimiter   = createLimiter({ windowMs: 60_000, max: 10 });
const searchLimiter   = createLimiter({ windowMs: 60_000, max: 60 });
const webhookLimiter  = createLimiter({ windowMs: 60_000, max: 200 });

module.exports = { globalLimiter, authLimiter, uploadLimiter, searchLimiter, webhookLimiter };
