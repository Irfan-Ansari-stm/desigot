'use strict';

const router = require('express').Router();
const svc = require('./reviews-moderation.service');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');
const { successResponse, paginatedResponse } = require('../../shared/utils');

// ── 1. Stats Summary & KPI Metrics ──────────────────────────────────────────
router.get('/stats/summary', authenticate, requirePermission('reviews.read'), async (req, res) => {
  const stats = await svc.getStatsSummary();
  successResponse(res, stats);
});

// ── 2. All Reviews ───────────────────────────────────────────────────────────
router.get('/', authenticate, requirePermission('reviews.read'), async (req, res) => {
  const result = await svc.getReviews(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

// ── 3. Pending Queue ─────────────────────────────────────────────────────────
router.get('/pending', authenticate, requirePermission('reviews.pending.read'), async (req, res) => {
  const result = await svc.getPendingReviews(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.post('/pending/:id/approve', authenticate, requirePermission('reviews.pending.approve'), async (req, res) => {
  const updated = await svc.approveReview(req.params.id, req.user.id, req.body.note);
  successResponse(res, updated, 200, { message: 'Review approved successfully.' });
});

router.post('/pending/:id/reject', authenticate, requirePermission('reviews.pending.reject'), async (req, res) => {
  const updated = await svc.rejectReview(req.params.id, req.user.id, req.body.reason, req.body.note);
  successResponse(res, updated, 200, { message: 'Review rejected successfully.' });
});

router.post('/pending/batch-approve', authenticate, requirePermission('reviews.pending.approve'), async (req, res) => {
  const results = await svc.batchApprove(req.body.ids, req.user.id, req.body.note);
  successResponse(res, results, 200, { message: 'Batch approved reviews.' });
});

router.post('/pending/batch-reject', authenticate, requirePermission('reviews.pending.reject'), async (req, res) => {
  const results = await svc.batchReject(req.body.ids, req.user.id, req.body.reason, req.body.note);
  successResponse(res, results, 200, { message: 'Batch rejected reviews.' });
});

// ── 4. Approved Reviews ───────────────────────────────────────────────────────
router.get('/approved', authenticate, requirePermission('reviews.approved.read'), async (req, res) => {
  const result = await svc.getReviews({ ...req.query, status: 'approved' });
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.post('/approved/:id/hide', authenticate, requirePermission('reviews.approved.hide'), async (req, res) => {
  const updated = await svc.hideReview(req.params.id, req.user.id, req.body.reason);
  successResponse(res, updated, 200, { message: 'Review hidden successfully.' });
});

router.post('/approved/:id/restore', authenticate, requirePermission('reviews.approved.restore'), async (req, res) => {
  const updated = await svc.restoreReview(req.params.id, req.user.id, req.body.reason);
  successResponse(res, updated, 200, { message: 'Review restored successfully.' });
});

// ── 5. Rejected Reviews ───────────────────────────────────────────────────────
router.get('/rejected', authenticate, requirePermission('reviews.rejected.read'), async (req, res) => {
  const result = await svc.getReviews({ ...req.query, status: 'rejected' });
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.post('/rejected/:id/restore', authenticate, requirePermission('reviews.rejected.restore'), async (req, res) => {
  const updated = await svc.restoreReview(req.params.id, req.user.id, req.body.reason);
  successResponse(res, updated, 200, { message: 'Review reconsidered and restored to approved.' });
});

router.delete('/rejected/:id', authenticate, requirePermission('reviews.rejected.delete'), async (req, res) => {
  const updated = await svc.hideReview(req.params.id, req.user.id, 'Permanently removed rejected review.');
  successResponse(res, updated, 200, { message: 'Review removed successfully.' });
});

// ── 6. Reported Reviews & Flags Queue ─────────────────────────────────────────
router.get('/reports', authenticate, requirePermission('reviews.reported.read'), async (req, res) => {
  const result = await svc.getReportedReviews(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.post('/reports/:id/investigate', authenticate, requirePermission('reviews.reported.investigate'), async (req, res) => {
  const result = await svc.investigateReport(req.params.id, req.user.id, req.body.notes);
  successResponse(res, result, 200, { message: 'Investigation opened successfully.' });
});

router.post('/reports/:id/dismiss', authenticate, requirePermission('reviews.reported.dismiss'), async (req, res) => {
  const result = await svc.dismissReport(req.params.id, req.user.id, req.body.notes);
  successResponse(res, result, 200, { message: 'Report dismissed.' });
});

router.post('/reports/:id/remove-review', authenticate, requirePermission('reviews.reported.remove'), async (req, res) => {
  const result = await svc.removeReportedReview(req.params.id, req.user.id, req.body.reason);
  successResponse(res, result, 200, { message: 'Review removed due to substantiated violation.' });
});

router.post('/reports/:id/escalate', authenticate, requirePermission('reviews.reported.escalate'), async (req, res) => {
  const result = await svc.escalateReport(req.params.id, req.user.id, req.body.notes);
  successResponse(res, result, 200, { message: 'Report escalated to Legal & Trust team.' });
});

// ── 7. Seller Responses Queue ────────────────────────────────────────────────
router.get('/responses', authenticate, requirePermission('reviews.responses.read'), async (req, res) => {
  const result = await svc.getSellerResponses(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.post('/responses/:id/approve', authenticate, requirePermission('reviews.responses.approve'), async (req, res) => {
  const result = await svc.approveSellerResponse(req.params.id, req.user.id, req.body.note);
  successResponse(res, result, 200, { message: 'Seller response approved.' });
});

router.post('/responses/:id/reject', authenticate, requirePermission('reviews.responses.reject'), async (req, res) => {
  const result = await svc.rejectSellerResponse(req.params.id, req.user.id, req.body.reason, req.body.note);
  successResponse(res, result, 200, { message: 'Seller response rejected.' });
});

// ── 8. Review Moderation Rules & Audit Trail ──────────────────────────────────
router.get('/moderation/rules', authenticate, requirePermission('reviews.moderation.rules.manage'), async (req, res) => {
  const rules = await svc.getModerationRules();
  successResponse(res, rules);
});

router.post('/moderation/rules', authenticate, requirePermission('reviews.moderation.rules.manage'), async (req, res) => {
  const created = await svc.createModerationRule(req.body, req.user.id);
  successResponse(res, created, 201, { message: 'Moderation rule created.' });
});

router.put('/moderation/rules/:id', authenticate, requirePermission('reviews.moderation.rules.manage'), async (req, res) => {
  const updated = await svc.updateModerationRule(req.params.id, req.body, req.user.id);
  successResponse(res, updated, 200, { message: 'Moderation rule updated.' });
});

router.patch('/moderation/rules/:id/toggle', authenticate, requirePermission('reviews.moderation.rules.manage'), async (req, res) => {
  const updated = await svc.toggleModerationRule(req.params.id, req.user.id);
  successResponse(res, updated, 200, { message: 'Moderation rule status toggled.' });
});

router.delete('/moderation/rules/:id', authenticate, requirePermission('reviews.moderation.rules.manage'), async (req, res) => {
  const deleted = await svc.deleteModerationRule(req.params.id, req.user.id);
  successResponse(res, deleted, 200, { message: 'Moderation rule deleted.' });
});

router.get('/moderation/audit-trail', authenticate, requirePermission('reviews.moderation.audit.read'), async (req, res) => {
  const result = await svc.getModerationAuditTrail(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/moderation/settings', authenticate, requirePermission('reviews.moderation.manage'), async (req, res) => {
  const settings = await svc.getReviewSettings();
  successResponse(res, settings);
});

router.put('/moderation/settings', authenticate, requirePermission('reviews.moderation.manage'), async (req, res) => {
  const updated = await svc.updateReviewSettings(req.body, req.user.id);
  successResponse(res, updated, 200, { message: 'Settings saved successfully.' });
});

// ── 9. Product Ratings & Analytics ───────────────────────────────────────────
router.get('/products/ratings', authenticate, requirePermission('reviews.product_ratings.read'), async (req, res) => {
  const result = await svc.getProductRatings(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.post('/products/:id/recalculate', authenticate, requirePermission('reviews.product_ratings.read'), async (req, res) => {
  const result = await svc.recalculateEntityRating('product', req.params.id);
  successResponse(res, result, 200, { message: 'Product ratings recalculated.' });
});

// ── 10. Service Ratings & Analytics ──────────────────────────────────────────
router.get('/services/ratings', authenticate, requirePermission('reviews.service_ratings.read'), async (req, res) => {
  const result = await svc.getServiceRatings(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.post('/services/:id/recalculate', authenticate, requirePermission('reviews.service_ratings.read'), async (req, res) => {
  const result = await svc.recalculateEntityRating('service', req.params.id);
  successResponse(res, result, 200, { message: 'Service ratings recalculated.' });
});

// ── 11. Review Detail & Universal Actions ─────────────────────────────────────
router.get('/:id', authenticate, requirePermission('reviews.view_details'), async (req, res) => {
  const review = await svc.getReviewById(req.params.id);
  successResponse(res, review);
});

router.post('/:id/approve', authenticate, requirePermission('reviews.pending.approve'), async (req, res) => {
  const updated = await svc.approveReview(req.params.id, req.user.id, req.body.note);
  successResponse(res, updated, 200, { message: 'Review approved.' });
});

router.post('/:id/reject', authenticate, requirePermission('reviews.pending.reject'), async (req, res) => {
  const updated = await svc.rejectReview(req.params.id, req.user.id, req.body.reason, req.body.note);
  successResponse(res, updated, 200, { message: 'Review rejected.' });
});

router.post('/:id/hide', authenticate, requirePermission('reviews.approved.hide'), async (req, res) => {
  const updated = await svc.hideReview(req.params.id, req.user.id, req.body.reason);
  successResponse(res, updated, 200, { message: 'Review hidden.' });
});

router.post('/:id/restore', authenticate, requirePermission('reviews.approved.restore'), async (req, res) => {
  const updated = await svc.restoreReview(req.params.id, req.user.id, req.body.reason);
  successResponse(res, updated, 200, { message: 'Review restored.' });
});

// ── 12. Customer / Seller User-Facing Review Endpoints ──────────────────────
router.post('/submit', authenticate, async (req, res) => {
  const review = await svc.submitReview(req.user.id, req.body);
  successResponse(res, review, 201, { message: 'Review submitted successfully.' });
});

router.post('/:id/respond', authenticate, async (req, res) => {
  const response = await svc.submitSellerResponse(req.user.id, req.params.id, req.body.response_text);
  successResponse(res, response, 201, { message: 'Seller response recorded.' });
});

module.exports = router;
