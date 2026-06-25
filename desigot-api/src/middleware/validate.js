'use strict';
const { validationResult } = require('express-validator');
const { ValidationError } = require('../shared/errors/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new ValidationError('Validation failed', details));
  }
  return next();
};

module.exports = validate;
