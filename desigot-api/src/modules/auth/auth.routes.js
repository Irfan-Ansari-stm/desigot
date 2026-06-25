'use strict';
const router     = require('express').Router();
const { body }   = require('express-validator');
const ctrl       = require('./auth.controller');
const validate   = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authLimiter }  = require('../../middleware/rateLimiter');

router.post('/register',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  body('display_name').trim().isLength({ min: 2, max: 100 }),
  body('role').optional().isIn(['buyer', 'seller']),
  validate,
  ctrl.register
);

router.post('/login',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  ctrl.login
);

router.post('/refresh',   ctrl.refresh);
router.post('/logout',    ctrl.logout);
router.post('/logout-all', authenticate, ctrl.logoutAll);
router.post('/verify-email', authenticate, ctrl.verifyEmail);

router.post('/2fa/setup',   authenticate, ctrl.setup2FA);
router.post('/2fa/confirm', authenticate, body('totp_code').isLength({ min: 6, max: 6 }), validate, ctrl.confirm2FA);
router.post('/2fa/disable', authenticate, body('password').notEmpty(), validate, ctrl.disable2FA);

router.post('/change-password',
  authenticate,
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  validate,
  ctrl.changePassword
);

router.post('/oauth/callback',
  authLimiter,
  body('provider').isIn(['google', 'github', 'linkedin']),
  body('providerUserId').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('displayName').notEmpty(),
  validate,
  ctrl.oauthCallback
);

module.exports = router;
