'use strict';
const express = require('express');
const router = express.Router();
const serviceManager = require('./service-management.service');
const { authenticate, optionalAuthenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');
const authorize = requirePermission;

// ── ADMIN & PRIVILEGED SERVICE MANAGEMENT ROUTES ──────────────────────────

// 1. Overview & Stats
router.get(
  '/stats',
  authenticate,
  authorize('services.read'),
  async (req, res) => {
    const stats = await serviceManager.getServiceStats();
    res.json({ success: true, data: stats });
  }
);

// 2. Performance Analytics
router.get(
  '/performance',
  authenticate,
  authorize('services.view_performance'),
  async (req, res) => {
    const data = await serviceManager.getServicePerformance(req.query);
    res.json({ success: true, data });
  }
);

// 3. Featured Services List & Campaigns
router.get(
  '/featured',
  authenticate,
  authorize('services.read'),
  async (req, res) => {
    const data = await serviceManager.listFeaturedServices(req.query);
    res.json({ success: true, data });
  }
);

// 4. Service Packages Directory
router.get(
  '/packages',
  authenticate,
  authorize('services.read'),
  async (req, res) => {
    const data = await serviceManager.listAllPackages(req.query);
    res.json({ success: true, data });
  }
);

// 5. Price Calculator
router.post(
  '/calculate-price',
  authenticate,
  async (req, res) => {
    const { serviceId, packageId, addonIds, isExpress } = req.body;
    const data = await serviceManager.calculateServicePrice(serviceId, packageId, addonIds, isExpress);
    res.json({ success: true, data });
  }
);

// 6. Pricing Rules
router.get(
  '/pricing-rules',
  authenticate,
  authorize('services.manage_pricing'),
  async (req, res) => {
    const data = await serviceManager.listPricingRules();
    res.json({ success: true, data });
  }
);

router.post(
  '/pricing-rules',
  authenticate,
  authorize('services.manage_pricing'),
  async (req, res) => {
    const data = await serviceManager.savePricingRule(req.body, req.user, req);
    res.status(201).json({ success: true, data });
  }
);

// 7. Categories
router.get(
  '/categories',
  authenticate,
  authorize('services.read'),
  async (req, res) => {
    const data = await serviceManager.listCategories();
    res.json({ success: true, data });
  }
);

router.post(
  '/categories',
  authenticate,
  authorize('services.manage_categories'),
  async (req, res) => {
    const data = await serviceManager.createCategory(req.body, req.user, req);
    res.status(201).json({ success: true, data });
  }
);

router.put(
  '/categories/:id',
  authenticate,
  authorize('services.manage_categories'),
  async (req, res) => {
    const data = await serviceManager.updateCategory(req.params.id, req.body, req.user, req);
    res.json({ success: true, data });
  }
);

router.delete(
  '/categories/:id',
  authenticate,
  authorize('services.manage_categories'),
  async (req, res) => {
    const data = await serviceManager.deleteCategory(req.params.id, req.user, req);
    res.json(data);
  }
);

// 8. Attributes
router.get(
  '/attributes',
  authenticate,
  authorize('services.read'),
  async (req, res) => {
    const data = await serviceManager.listAttributes(req.query.categoryId);
    res.json({ success: true, data });
  }
);

router.post(
  '/attributes',
  authenticate,
  authorize('services.manage_attributes'),
  async (req, res) => {
    const data = await serviceManager.createAttribute(req.body, req.user, req);
    res.status(201).json({ success: true, data });
  }
);

router.put(
  '/attributes/:id',
  authenticate,
  authorize('services.manage_attributes'),
  async (req, res) => {
    const data = await serviceManager.updateAttribute(req.params.id, req.body, req.user, req);
    res.json({ success: true, data });
  }
);

router.delete(
  '/attributes/:id',
  authenticate,
  authorize('services.manage_attributes'),
  async (req, res) => {
    const data = await serviceManager.deleteAttribute(req.params.id, req.user, req);
    res.json(data);
  }
);

// 9. Tags
router.get(
  '/tags',
  authenticate,
  authorize('services.read'),
  async (req, res) => {
    const data = await serviceManager.listTags(req.query.search, req.query.activeOnly === 'true');
    res.json({ success: true, data });
  }
);

router.post(
  '/tags',
  authenticate,
  authorize('services.manage_tags'),
  async (req, res) => {
    const data = await serviceManager.createTag(req.body, req.user, req);
    res.status(201).json({ success: true, data });
  }
);

router.put(
  '/tags/:id',
  authenticate,
  authorize('services.manage_tags'),
  async (req, res) => {
    const data = await serviceManager.updateTag(req.params.id, req.body, req.user, req);
    res.json({ success: true, data });
  }
);

router.delete(
  '/tags/:id',
  authenticate,
  authorize('services.manage_tags'),
  async (req, res) => {
    const data = await serviceManager.deleteTag(req.params.id, req.user, req);
    res.json(data);
  }
);

// 10. Moderation Reports
router.get(
  '/reports',
  authenticate,
  authorize('services.manage_reports'),
  async (req, res) => {
    const data = await serviceManager.listReports(req.query);
    res.json({ success: true, data });
  }
);

router.patch(
  '/reports/:id',
  authenticate,
  authorize('services.manage_reports'),
  async (req, res) => {
    const data = await serviceManager.updateReport(req.params.id, req.body, req.user, req);
    res.json({ success: true, data });
  }
);

// 11. Custom Requests & Quotations
router.get(
  '/custom-requests',
  authenticate,
  authorize('services.manage_custom_requests'),
  async (req, res) => {
    const data = await serviceManager.listCustomRequests(req.query, req.user);
    res.json({ success: true, data });
  }
);

router.get(
  '/custom-requests/:id',
  authenticate,
  authorize('services.manage_custom_requests'),
  async (req, res) => {
    const data = await serviceManager.getCustomRequestById(req.params.id);
    res.json({ success: true, data });
  }
);

router.post(
  '/custom-requests',
  authenticate,
  async (req, res) => {
    const data = await serviceManager.createCustomRequest(req.body, req.user, req);
    res.status(201).json({ success: true, data });
  }
);

router.post(
  '/custom-requests/:id/quote',
  authenticate,
  async (req, res) => {
    const data = await serviceManager.submitQuote(req.params.id, req.body, req.user, req);
    res.status(201).json({ success: true, data });
  }
);

router.patch(
  '/custom-requests/:id/status',
  authenticate,
  authorize('services.manage_custom_requests'),
  async (req, res) => {
    const { status, assignedSellerId, adminNotes } = req.body;
    const data = await serviceManager.updateCustomRequestStatus(req.params.id, status, assignedSellerId, adminNotes, req.user, req);
    res.json({ success: true, data });
  }
);

// 12. Availability Schedules
router.get(
  '/availability/:sellerId',
  authenticate,
  async (req, res) => {
    const data = await serviceManager.getSellerAvailability(req.params.sellerId);
    res.json({ success: true, data });
  }
);

router.put(
  '/availability/:sellerId',
  authenticate,
  authorize('services.manage_availability'),
  async (req, res) => {
    const data = await serviceManager.updateSellerAvailability(req.params.sellerId, req.body, req.user, req);
    res.json({ success: true, data });
  }
);

// 13. Bulk Operations
router.post(
  '/bulk-action',
  authenticate,
  authorize('services.update'),
  async (req, res) => {
    const { serviceIds, action, options } = req.body;
    const results = await serviceManager.bulkUpdateStatus(serviceIds, action, req.user, options || {}, req);
    res.json({ success: true, data: results });
  }
);

// 14. List All Services (Admin View with full filters)
router.get(
  '/',
  authenticate,
  authorize('services.read'),
  async (req, res) => {
    const data = await serviceManager.listServices(req.query, req.user);
    res.json({ success: true, data });
  }
);

// 15. Create New Service
router.post(
  '/',
  authenticate,
  authorize('services.create'),
  async (req, res) => {
    const data = await serviceManager.createService(req.body, req.user, req);
    res.status(201).json({ success: true, data });
  }
);

// 16. Service Detail By ID
router.get(
  '/:id',
  authenticate,
  authorize('services.read'),
  async (req, res) => {
    const data = await serviceManager.getServiceById(req.params.id, req.user);
    res.json({ success: true, data });
  }
);

// 17. Update Service
router.put(
  '/:id',
  authenticate,
  authorize('services.update'),
  async (req, res) => {
    const data = await serviceManager.updateService(req.params.id, req.body, req.user, req);
    res.json({ success: true, data });
  }
);

// 18. Duplicate Service
router.post(
  '/:id/duplicate',
  authenticate,
  authorize('services.duplicate'),
  async (req, res) => {
    const data = await serviceManager.duplicateService(req.params.id, req.user, req);
    res.status(201).json({ success: true, data });
  }
);

// 19. Delete Service
router.delete(
  '/:id',
  authenticate,
  authorize('services.delete'),
  async (req, res) => {
    const data = await serviceManager.deleteService(req.params.id, req.user, req);
    res.json(data);
  }
);

// 20. Lifecycle State Actions
router.post(
  '/:id/submit',
  authenticate,
  authorize('services.submit'),
  async (req, res) => {
    const data = await serviceManager.submitService(req.params.id, req.user, req);
    res.json({ success: true, data });
  }
);

router.post(
  '/:id/approve',
  authenticate,
  authorize('services.approve'),
  async (req, res) => {
    const { notes, autoPublish } = req.body;
    const data = await serviceManager.approveService(req.params.id, req.user, notes, autoPublish, req);
    res.json({ success: true, data });
  }
);

router.post(
  '/:id/reject',
  authenticate,
  authorize('services.reject'),
  async (req, res) => {
    const { reason, notes } = req.body;
    const data = await serviceManager.rejectService(req.params.id, req.user, reason, notes, req);
    res.json({ success: true, data });
  }
);

router.post(
  '/:id/request-changes',
  authenticate,
  authorize('services.request_changes'),
  async (req, res) => {
    const { feedback, notes } = req.body;
    const data = await serviceManager.requestChanges(req.params.id, req.user, feedback, notes, req);
    res.json({ success: true, data });
  }
);

router.post(
  '/:id/publish',
  authenticate,
  authorize('services.publish'),
  async (req, res) => {
    const data = await serviceManager.publishService(req.params.id, req.user, req);
    res.json({ success: true, data });
  }
);

router.post(
  '/:id/unpublish',
  authenticate,
  authorize('services.unpublish'),
  async (req, res) => {
    const { reason } = req.body;
    const data = await serviceManager.unpublishService(req.params.id, req.user, reason, req);
    res.json({ success: true, data });
  }
);

router.post(
  '/:id/suspend',
  authenticate,
  authorize('services.suspend'),
  async (req, res) => {
    const { reason, notes } = req.body;
    const data = await serviceManager.suspendService(req.params.id, req.user, reason, notes, req);
    res.json({ success: true, data });
  }
);

router.post(
  '/:id/restore',
  authenticate,
  authorize('services.restore'),
  async (req, res) => {
    const { notes } = req.body;
    const data = await serviceManager.restoreService(req.params.id, req.user, notes, req);
    res.json({ success: true, data });
  }
);

router.post(
  '/:id/feature',
  authenticate,
  authorize('services.feature'),
  async (req, res) => {
    const { isFeatured = true, priority = 10, days = 30, placement = 'homepage_hero' } = req.body;
    const data = await serviceManager.setFeatured(req.params.id, isFeatured, priority, days, placement, req.user, req);
    res.json({ success: true, data });
  }
);

router.delete(
  '/:id/feature',
  authenticate,
  authorize('services.feature'),
  async (req, res) => {
    const data = await serviceManager.setFeatured(req.params.id, false, 0, null, null, req.user, req);
    res.json({ success: true, data });
  }
);

module.exports = router;
