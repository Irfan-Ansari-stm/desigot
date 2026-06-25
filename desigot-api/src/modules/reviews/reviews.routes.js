'use strict';
const router = require('express').Router();
const { body, param } = require('express-validator');
const svc    = require('./reviews.service');
const { authenticate, requireAdmin, optionalAuthenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { uuidParam, paginationQuery } = require('../../shared/validators/common');
const { successResponse, paginatedResponse } = require('../../shared/utils');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/listing/:listingId', uuidParam('listingId'), validate, async (req, res) => {
  const r = await svc.getListingReviews(req.params.listingId, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.get('/seller/:sellerId', uuidParam('sellerId'), validate, async (req, res) => {
  const r = await svc.getSellerReviews(req.params.sellerId, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.get('/:id', uuidParam(), validate, async (req, res) => {
  successResponse(res, await svc.getReview(req.params.id));
});

// ── Authenticated ──────────────────────────────────────────────────────────────
router.get('/me/reviews', authenticate, async (req, res) => {
  const r = await svc.getMyReviews(req.user.id, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.post('/',
  authenticate,
  body('order_id').isUUID(),
  body('rating_overall').isInt({ min: 1, max: 5 }),
  body('rating_quality').optional().isInt({ min: 1, max: 5 }),
  body('rating_communication').optional().isInt({ min: 1, max: 5 }),
  body('rating_value').optional().isInt({ min: 1, max: 5 }),
  body('rating_delivery').optional().isInt({ min: 1, max: 5 }),
  body('review_text').isLength({ min: 30 }),
  validate,
  async (req, res) => successResponse(res, await svc.createReview(req.user.id, req.body), 201)
);

router.post('/:id/respond',
  authenticate,
  uuidParam(),
  body('response_text').isLength({ min: 10 }),
  validate,
  async (req, res) => successResponse(res, await svc.respondToReview(req.params.id, req.user.id, req.body.response_text), 201)
);

router.patch('/responses/:responseId',
  authenticate,
  uuidParam('responseId'),
  body('response_text').isLength({ min: 10 }),
  validate,
  async (req, res) => successResponse(res, await svc.updateResponse(req.params.responseId, req.user.id, req.body.response_text))
);

router.post('/:id/flag',
  authenticate,
  uuidParam(),
  body('reason').isIn(['spam', 'offensive', 'fake', 'off_topic', 'other']),
  validate,
  async (req, res) => successResponse(res, await svc.flagReview(req.params.id, req.user.id, req.body.reason, req.body.notes), 201)
);

// ── Admin ──────────────────────────────────────────────────────────────────────
router.get('/admin/pending', authenticate, requireAdmin, async (req, res) => {
  const r = await svc.getPendingReviews(req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.post('/admin/:id/moderate',
  authenticate, requireAdmin,
  uuidParam(),
  body('action').isIn(['approve', 'reject', 'hide']),
  validate,
  async (req, res) => successResponse(res, await svc.moderateReview(req.params.id, req.user.id, req.body.action, req.body.note))
);

router.get('/admin/flags', authenticate, requireAdmin, async (req, res) => {
  const r = await svc.getFlaggedReviews(req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.post('/admin/flags/:flagId/resolve',
  authenticate, requireAdmin,
  uuidParam('flagId'),
  body('action').isIn(['action', 'dismiss']),
  validate,
  async (req, res) => successResponse(res, await svc.resolveFlaggedReview(req.params.flagId, req.user.id, req.body.action, req.body.note))
);

module.exports = router;
