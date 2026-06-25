'use strict';
const router = require('express').Router();
const svc    = require('./analytics.service');
const { authenticate, requireAdmin, requireSeller } = require('../../middleware/auth');
const { successResponse } = require('../../shared/utils');

// ── Seller analytics ──────────────────────────────────────────────────────────
router.get('/seller/overview',    authenticate, requireSeller,
  async (req, res) => successResponse(res, await svc.getSellerOverview(req.user.id, req.query.days))
);
router.get('/seller/top-listings', authenticate, requireSeller,
  async (req, res) => successResponse(res, await svc.getTopListings(req.user.id, parseInt(req.query.limit) || 10))
);
router.get('/seller/conversion',  authenticate, requireSeller,
  async (req, res) => successResponse(res, await svc.getConversionFunnel(req.user.id, req.query.days))
);
router.get('/seller/by-license',  authenticate, requireSeller,
  async (req, res) => successResponse(res, await svc.getRevenueByLicense(req.user.id, req.query.days))
);

// ── Platform analytics (admin) ─────────────────────────────────────────────────
router.get('/platform/revenue',   authenticate, requireAdmin,
  async (req, res) => successResponse(res, await svc.getPlatformRevenueTrend(req.query.days))
);
router.get('/platform/top-sellers', authenticate, requireAdmin,
  async (req, res) => successResponse(res, await svc.getTopSellers(parseInt(req.query.limit) || 20))
);
router.get('/platform/categories', authenticate, requireAdmin,
  async (req, res) => successResponse(res, await svc.getCategoryBreakdown())
);
router.get('/platform/user-growth', authenticate, requireAdmin,
  async (req, res) => successResponse(res, await svc.getUserGrowth(req.query.days))
);

module.exports = router;
