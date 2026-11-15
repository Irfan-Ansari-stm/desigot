'use strict';
const router = require('express').Router();
const svc = require('./dashboard-analytics.service');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');
const { successResponse } = require('../../shared/utils');

// Standard metadata wrapper helper
function sendDashboardResponse(res, data, meta = {}) {
  return res.json({
    success: true,
    data,
    meta: {
      generatedAt: new Date().toISOString(),
      currency: 'USD',
      timezone: 'UTC',
      ...meta,
    },
  });
}

// =============================================================================
// OVERVIEW
// =============================================================================
router.get(
  '/overview',
  authenticate,
  requirePermission('dashboard.overview.read'),
  async (req, res) => {
    const data = await svc.getOverview(req.query);
    return sendDashboardResponse(res, data);
  }
);

// =============================================================================
// REVENUE ANALYTICS
// =============================================================================
router.get(
  '/revenue',
  authenticate,
  requirePermission('dashboard.revenue.read'),
  async (req, res) => {
    const data = await svc.getRevenueAnalytics(req.query);
    return sendDashboardResponse(res, data);
  }
);

router.get(
  '/revenue/trends',
  authenticate,
  requirePermission('dashboard.revenue.read'),
  async (req, res) => {
    const data = await svc.getRevenueAnalytics(req.query);
    return sendDashboardResponse(res, { trends: data.trends });
  }
);

router.get(
  '/revenue/breakdown',
  authenticate,
  requirePermission('dashboard.revenue.read'),
  async (req, res) => {
    const data = await svc.getRevenueAnalytics(req.query);
    return sendDashboardResponse(res, { breakdown: data.breakdown });
  }
);

// =============================================================================
// MARKETPLACE ANALYTICS
// =============================================================================
router.get(
  '/marketplace',
  authenticate,
  requirePermission('dashboard.marketplace.read'),
  async (req, res) => {
    const data = await svc.getMarketplaceAnalytics(req.query);
    return sendDashboardResponse(res, data);
  }
);

router.get(
  '/marketplace/categories',
  authenticate,
  requirePermission('dashboard.marketplace.read'),
  async (req, res) => {
    const data = await svc.getMarketplaceAnalytics(req.query);
    return sendDashboardResponse(res, { categoryPerformance: data.categoryPerformance });
  }
);

router.get(
  '/marketplace/growth',
  authenticate,
  requirePermission('dashboard.marketplace.read'),
  async (req, res) => {
    const data = await svc.getMarketplaceAnalytics(req.query);
    return sendDashboardResponse(res, { userGrowth: data.userGrowth });
  }
);

router.get(
  '/marketplace/search',
  authenticate,
  requirePermission('dashboard.marketplace.read'),
  async (req, res) => {
    const data = await svc.getMarketplaceAnalytics(req.query);
    return sendDashboardResponse(res, { topSearches: data.topSearches });
  }
);

// =============================================================================
// SALES ANALYTICS
// =============================================================================
router.get(
  '/sales',
  authenticate,
  requirePermission('dashboard.sales.read'),
  async (req, res) => {
    const data = await svc.getSalesAnalytics(req.query);
    return sendDashboardResponse(res, data);
  }
);

router.get(
  '/sales/trends',
  authenticate,
  requirePermission('dashboard.sales.read'),
  async (req, res) => {
    const data = await svc.getSalesAnalytics(req.query);
    return sendDashboardResponse(res, { trends: data.trends });
  }
);

router.get(
  '/sales/funnel',
  authenticate,
  requirePermission('dashboard.sales.read'),
  async (req, res) => {
    const data = await svc.getSalesAnalytics(req.query);
    return sendDashboardResponse(res, { funnel: data.funnel });
  }
);

router.get(
  '/sales/top-items',
  authenticate,
  requirePermission('dashboard.sales.read'),
  async (req, res) => {
    const data = await svc.getSalesAnalytics(req.query);
    return sendDashboardResponse(res, { products: data.products, services: data.services });
  }
);

// =============================================================================
// SERVICE ANALYTICS
// =============================================================================
router.get(
  '/services',
  authenticate,
  requirePermission('dashboard.services.read'),
  async (req, res) => {
    const data = await svc.getServiceAnalytics(req.query);
    return sendDashboardResponse(res, data);
  }
);

router.get(
  '/services/performance',
  authenticate,
  requirePermission('dashboard.services.read'),
  async (req, res) => {
    const data = await svc.getServiceAnalytics(req.query);
    return sendDashboardResponse(res, { topServices: data.topServices });
  }
);

router.get(
  '/services/categories',
  authenticate,
  requirePermission('dashboard.services.read'),
  async (req, res) => {
    const data = await svc.getServiceAnalytics(req.query);
    return sendDashboardResponse(res, { categories: data.categories });
  }
);

// =============================================================================
// SELLER ANALYTICS
// =============================================================================
router.get(
  '/sellers',
  authenticate,
  requirePermission('dashboard.sellers.read'),
  async (req, res) => {
    const data = await svc.getSellerAnalytics(req.query);
    return sendDashboardResponse(res, data);
  }
);

router.get(
  '/sellers/growth',
  authenticate,
  requirePermission('dashboard.sellers.read'),
  async (req, res) => {
    const data = await svc.getSellerAnalytics(req.query);
    return sendDashboardResponse(res, { growth: data.growth });
  }
);

router.get(
  '/sellers/top-performers',
  authenticate,
  requirePermission('dashboard.sellers.read'),
  async (req, res) => {
    const data = await svc.getSellerAnalytics(req.query);
    return sendDashboardResponse(res, { topSellers: data.topSellers });
  }
);

// =============================================================================
// CUSTOMER ANALYTICS
// =============================================================================
router.get(
  '/customers',
  authenticate,
  requirePermission('dashboard.customers.read'),
  async (req, res) => {
    const data = await svc.getCustomerAnalytics(req.query);
    return sendDashboardResponse(res, data);
  }
);

router.get(
  '/customers/growth',
  authenticate,
  requirePermission('dashboard.customers.read'),
  async (req, res) => {
    const data = await svc.getCustomerAnalytics(req.query);
    return sendDashboardResponse(res, { growth: data.growth });
  }
);

router.get(
  '/customers/segments',
  authenticate,
  requirePermission('dashboard.customers.read'),
  async (req, res) => {
    const data = await svc.getCustomerAnalytics(req.query);
    return sendDashboardResponse(res, { segments: data.segments });
  }
);

// =============================================================================
// ACTIVITIES
// =============================================================================
router.get(
  '/activities',
  authenticate,
  requirePermission('dashboard.activities.read'),
  async (req, res) => {
    const data = await svc.getActivities(req.query);
    return sendDashboardResponse(res, data);
  }
);

router.get(
  '/activities/:id',
  authenticate,
  requirePermission('dashboard.activities.read'),
  async (req, res) => {
    const item = await svc.getActivityById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Activity log not found' });
    }
    return sendDashboardResponse(res, item);
  }
);

// =============================================================================
// SYSTEM HEALTH
// =============================================================================
router.get(
  '/system/health',
  authenticate,
  requirePermission('dashboard.system_health.read'),
  async (req, res) => {
    const data = await svc.getSystemHealth();
    return sendDashboardResponse(res, data);
  }
);

router.get(
  '/system/health/alerts',
  authenticate,
  requirePermission('dashboard.system_health.read'),
  async (req, res) => {
    const data = await svc.getSystemHealth();
    return sendDashboardResponse(res, { alerts: data.alerts });
  }
);

router.get(
  '/system/integrations',
  authenticate,
  requirePermission('dashboard.system_health.read'),
  async (req, res) => {
    const data = await svc.getSystemHealth();
    return sendDashboardResponse(res, { integrations: data.integrations });
  }
);

// =============================================================================
// EXPORTS
// =============================================================================
router.get(
  '/export',
  authenticate,
  requirePermission('dashboard.export'),
  async (req, res) => {
    const result = await svc.exportData(req.query);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    if (result.csv) {
      return res.send(result.csv);
    }
    return res.json(result.data);
  }
);

module.exports = router;
