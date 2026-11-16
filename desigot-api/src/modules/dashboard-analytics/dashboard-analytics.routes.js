'use strict';
const router = require('express').Router();
const svc = require('./dashboard-analytics.service');
const biSvc = require('./analytics-bi.service');
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
// OVERVIEW (Unified 12 KPIs + 10 Charts)
// =============================================================================
router.get(
  '/overview',
  authenticate,
  requirePermission('dashboard.overview.read'),
  async (req, res) => {
    const [legacyData, biData] = await Promise.all([
      svc.getOverview(req.query).catch(() => ({})),
      biSvc.getUnifiedOverview(req.query)
    ]);
    return sendDashboardResponse(res, {
      ...legacyData,
      ...biData,
      kpis: biData.kpis,
      charts: biData.charts
    });
  }
);

// =============================================================================
// REVENUE ANALYTICS & REPORTS
// =============================================================================
router.get(
  '/revenue',
  authenticate,
  requirePermission('dashboard.revenue.read'),
  async (req, res) => {
    const data = await biSvc.getRevenueReport(req.query);
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
// SALES ANALYTICS & REPORTS
// =============================================================================
router.get(
  '/sales',
  authenticate,
  requirePermission('dashboard.sales.read'),
  async (req, res) => {
    const data = await biSvc.getSalesReport(req.query);
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
// SERVICE ANALYTICS & REPORTS
// =============================================================================
router.get(
  '/services',
  authenticate,
  requirePermission('dashboard.services.read'),
  async (req, res) => {
    const data = await biSvc.getServiceReport(req.query);
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
// PRODUCT ANALYTICS & REPORTS
// =============================================================================
router.get(
  '/products',
  authenticate,
  requirePermission('dashboard.services.read'),
  async (req, res) => {
    const data = await biSvc.getProductReport(req.query);
    return sendDashboardResponse(res, data);
  }
);

// =============================================================================
// SELLER ANALYTICS & REPORTS
// =============================================================================
router.get(
  '/sellers',
  authenticate,
  requirePermission('dashboard.sellers.read'),
  async (req, res) => {
    const data = await biSvc.getSellerReport(req.query);
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
// CUSTOMER ANALYTICS & REPORTS
// =============================================================================
router.get(
  '/customers',
  authenticate,
  requirePermission('dashboard.customers.read'),
  async (req, res) => {
    const data = await biSvc.getCustomerReport(req.query);
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

// =============================================================================
// COMMISSION ANALYTICS & REPORTS
// =============================================================================
router.get(
  '/commissions',
  authenticate,
  requirePermission('dashboard.revenue.read'),
  async (req, res) => {
    const data = await biSvc.getCommissionReport(req.query);
    return sendDashboardResponse(res, data);
  }
);

// =============================================================================
// CONVERSION ANALYTICS & 7-STAGE FUNNEL
// =============================================================================
router.get(
  '/conversion',
  authenticate,
  requirePermission('dashboard.sales.read'),
  async (req, res) => {
    const data = await biSvc.getConversionReport(req.query);
    return sendDashboardResponse(res, data);
  }
);

// =============================================================================
// POPULAR CATEGORIES REPORT
// =============================================================================
router.get(
  '/categories',
  authenticate,
  requirePermission('dashboard.marketplace.read'),
  async (req, res) => {
    const data = await biSvc.getCategoriesReport(req.query);
    return sendDashboardResponse(res, data);
  }
);

// =============================================================================
// POPULAR SERVICES REPORT
// =============================================================================
router.get(
  '/popular-services',
  authenticate,
  requirePermission('dashboard.services.read'),
  async (req, res) => {
    const data = await biSvc.getPopularServicesReport(req.query);
    return sendDashboardResponse(res, data);
  }
);

// =============================================================================
// POPULAR PRODUCTS REPORT
// =============================================================================
router.get(
  '/popular-products',
  authenticate,
  requirePermission('dashboard.services.read'),
  async (req, res) => {
    const data = await biSvc.getPopularProductsReport(req.query);
    return sendDashboardResponse(res, data);
  }
);

// =============================================================================
// EXPORTS REPORT JOBS & DOWNLOADS
// =============================================================================
router.get(
  '/exports',
  authenticate,
  requirePermission('dashboard.export'),
  async (req, res) => {
    const data = await biSvc.getExportReports(req.query);
    return sendDashboardResponse(res, data);
  }
);

router.post(
  '/exports',
  authenticate,
  requirePermission('dashboard.export'),
  async (req, res) => {
    const data = await biSvc.createExportReport(req.body, req.user);
    return res.status(201).json({ success: true, data });
  }
);

router.get(
  '/exports/:id/download',
  authenticate,
  requirePermission('dashboard.export'),
  async (req, res) => {
    const result = await biSvc.downloadExportReport(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Export report not found' });
    }
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.content);
  }
);

// =============================================================================
// EVENT TRACKING INGESTION
// =============================================================================
router.post(
  '/events',
  async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const event = await biSvc.trackAnalyticsEvent(req.body, userId);
    return res.status(201).json({ success: true, data: event });
  }
);

module.exports = router;
