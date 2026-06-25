'use strict';
const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('./users.controller');
const { authenticate, requireAdmin, requireSeller } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { uuidParam, paginationQuery } = require('../../shared/validators/common');

// ── Me ────────────────────────────────────────────────────────────────────────
router.get   ('/me',                 authenticate, ctrl.getMe);
router.patch ('/me',                 authenticate, ctrl.updateMe);
router.delete('/me',                 authenticate, ctrl.deleteMe);
router.get   ('/me/sessions',        authenticate, ctrl.listSessions);
router.delete('/me/sessions/:sessionId', authenticate, uuidParam('sessionId'), validate, ctrl.revokeSession);
router.post  ('/me/backup-codes',    authenticate, ctrl.generateBackupCodes);
router.get   ('/me/seller-health',   authenticate, requireSeller, ctrl.getSellerHealth);
router.get   ('/me/balance',         authenticate, requireSeller, ctrl.getSellerBalance);

// ── KYC ───────────────────────────────────────────────────────────────────────
router.post('/me/kyc',
  authenticate,
  body('method').isIn(['government_id', 'linkedin_oauth', 'manual_review']),
  body('document_key').optional().isString(),
  validate,
  ctrl.submitKYC
);

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/profile/:username', ctrl.getPublicProfile);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get   ('/admin/users',           authenticate, requireAdmin, ...paginationQuery, ctrl.listUsers);
router.get   ('/admin/users/:id',       authenticate, requireAdmin, uuidParam(), validate, ctrl.getUserById);
router.patch ('/admin/users/:id/status',authenticate, requireAdmin,
  uuidParam(), body('status').isIn(['active','suspended','banned','pending_verification']), validate,
  ctrl.updateStatus
);
router.get   ('/admin/kyc',             authenticate, requireAdmin, ctrl.listKYC);
router.patch ('/admin/kyc/:kycId',      authenticate, requireAdmin,
  uuidParam('kycId'), body('status').isIn(['approved','rejected']), validate,
  ctrl.reviewKYC
);

module.exports = router;
