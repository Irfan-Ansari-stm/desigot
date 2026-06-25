'use strict';
const { body, param, query } = require('express-validator');

const uuidParam = (name = 'id') =>
  param(name).isUUID(4).withMessage(`${name} must be a valid UUID`);

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
];

const emailBody = (field = 'email') =>
  body(field).isEmail().normalizeEmail().withMessage('Valid email required');

const passwordBody = (field = 'password') =>
  body(field)
    .isLength({ min: 8 })
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number');

module.exports = { uuidParam, paginationQuery, emailBody, passwordBody };
