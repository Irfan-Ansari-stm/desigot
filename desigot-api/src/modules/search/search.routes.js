'use strict';
const router = require('express').Router();
const { body, query: qv } = require('express-validator');
const svc    = require('./search.service');
const { authenticate, requireAdmin, optionalAuthenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { searchLimiter } = require('../../middleware/rateLimiter');
const { successResponse, paginatedResponse } = require('../../shared/utils');

router.get('/', searchLimiter, optionalAuthenticate,
  qv('q').optional().isString().isLength({ max: 200 }),
  validate,
  async (req, res) => {
    const r = await svc.search(req.query.q, req.query, req.query, req.user?.id);
    paginatedResponse(res, r.data, r.total, r.page, r.limit);
  }
);

router.get('/autocomplete', searchLimiter,
  qv('q').notEmpty().isLength({ min: 2, max: 100 }), validate,
  async (req, res) => successResponse(res, await svc.autocomplete(req.query.q, parseInt(req.query.limit) || 10))
);

router.get('/trending',
  async (req, res) => successResponse(res, await svc.getTrendingSearches(parseInt(req.query.limit) || 10))
);

router.get('/recommendations', optionalAuthenticate,
  async (req, res) => successResponse(res, await svc.getRecommendations(req.user?.id, req.query.context))
);

router.post('/events', optionalAuthenticate,
  body('listing_id').isUUID(),
  body('event_type').isIn(['impression', 'click', 'purchase', 'wishlist']),
  validate,
  async (req, res) => {
    await svc.logRecommendationEvent(req.user?.id, req.body.listing_id, req.body.event_type, req.body.context, req.body.model_version);
    successResponse(res, { logged: true });
  }
);

// Admin
router.get('/admin/analytics', authenticate, requireAdmin, async (req, res) => {
  const r = await svc.getSearchAnalytics(req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

module.exports = router;
