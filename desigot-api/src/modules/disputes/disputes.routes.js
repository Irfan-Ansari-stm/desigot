'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const svc    = require('./disputes.service');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { uuidParam } = require('../../shared/validators/common');
const { successResponse, paginatedResponse } = require('../../shared/utils');

router.post('/',
  authenticate,
  body('order_id').isUUID(),
  body('reason').isIn(['not_as_described','non_delivery','quality_issue','unauthorized','other']),
  body('description').isLength({ min: 20 }),
  validate,
  async (req, res) => successResponse(res, await svc.openDispute(req.user.id, req.body), 201)
);

router.get('/me', authenticate, async (req, res) => {
  const role = req.query.role === 'seller' ? 'seller' : 'buyer';
  const r = await svc.listDisputes(req.user.id, role, req.query, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.get('/:id',  authenticate, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.getDispute(req.params.id, req.user.id, req.user.role === 'admin'))
);

router.post('/:id/evidence',
  authenticate, uuidParam(), body('evidence_key').notEmpty(), validate,
  async (req, res) => successResponse(res, await svc.addEvidence(req.params.id, req.user.id, req.body.evidence_key))
);

router.post('/:id/cancel',
  authenticate, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.cancelDispute(req.params.id, req.user.id))
);

// Admin
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  const r = await svc.adminListDisputes(req.query, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.post('/admin/:id/review', authenticate, requireAdmin, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.reviewDispute(req.params.id, req.user.id))
);

router.post('/admin/:id/resolve',
  authenticate, requireAdmin, uuidParam(),
  body('outcome').isIn(['full_refund', 'partial_refund', 'no_refund']),
  body('refund_amount_cents').optional().isInt({ min: 0 }),
  validate,
  async (req, res) => successResponse(res, await svc.resolveDispute(
    req.params.id, req.user.id, req.body.outcome, req.body.refund_amount_cents, req.body.notes
  ))
);

module.exports = router;
