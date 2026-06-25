'use strict';
const logger = require('../config/logger');
const { AppError } = require('../shared/errors/AppError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Validation errors from express-validator (passed via next(err))
  if (err.type === 'validation') {
    return res.status(422).json({ success: false, code: 'VALIDATION_ERROR', message: err.message, details: err.details });
  }

  // Known operational errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, path: req.path });
    }
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // PostgreSQL unique-violation
  if (err.code === '23505') {
    return res.status(409).json({ success: false, code: 'CONFLICT', message: 'Duplicate entry — resource already exists.' });
  }

  // PostgreSQL foreign-key violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, code: 'REFERENCE_ERROR', message: 'Referenced resource does not exist.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Token expired.' });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, code: 'FILE_TOO_LARGE', message: 'File exceeds the allowed size limit.' });
  }

  // Unknown error — don't leak internals
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });
  return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' });
};

module.exports = errorHandler;
