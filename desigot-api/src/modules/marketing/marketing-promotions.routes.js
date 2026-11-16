'use strict';

const router = require('express').Router();
const svc = require('./marketing-promotions.service');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');
const { successResponse, paginatedResponse } = require('../../shared/utils');

// ============================================================================
// 0. KPI & SUMMARY
// ============================================================================
router.get('/stats/summary', authenticate, requirePermission('marketing.analytics.read'), async (req, res) => {
  const stats = await svc.getStatsSummary();
  successResponse(res, stats);
});

// ============================================================================
// 1. COUPONS
// ============================================================================
router.get('/coupons', authenticate, requirePermission('marketing.coupons.read'), async (req, res) => {
  const result = await svc.getCoupons(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/coupons/export', authenticate, requirePermission('marketing.coupons.export'), async (req, res) => {
  const result = await svc.getCoupons({ limit: 1000, page: 1 });
  successResponse(res, result.data, 200, { message: 'Exported coupons successfully.' });
});

router.get('/coupons/:id', authenticate, requirePermission('marketing.coupons.read'), async (req, res) => {
  const coupon = await svc.getCouponById(req.params.id);
  successResponse(res, coupon);
});

router.post('/coupons', authenticate, requirePermission('marketing.coupons.create'), async (req, res) => {
  const coupon = await svc.createCoupon(req.body, req.user.id);
  successResponse(res, coupon, 201, { message: 'Coupon created successfully.' });
});

router.put('/coupons/:id', authenticate, requirePermission('marketing.coupons.update'), async (req, res) => {
  const coupon = await svc.updateCoupon(req.params.id, req.body, req.user.id);
  successResponse(res, coupon, 200, { message: 'Coupon updated successfully.' });
});

router.patch('/coupons/:id/toggle-status', authenticate, requirePermission('marketing.coupons.activate'), async (req, res) => {
  const coupon = await svc.toggleCouponStatus(req.params.id, req.user.id);
  successResponse(res, coupon, 200, { message: `Coupon is now ${coupon.status}.` });
});

router.delete('/coupons/:id', authenticate, requirePermission('marketing.coupons.delete'), async (req, res) => {
  const result = await svc.deleteCoupon(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 2. DISCOUNT CAMPAIGNS
// ============================================================================
router.get('/campaigns', authenticate, requirePermission('marketing.campaigns.read'), async (req, res) => {
  const result = await svc.getCampaigns(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/campaigns/:id', authenticate, requirePermission('marketing.campaigns.read'), async (req, res) => {
  const campaign = await svc.getCampaignById(req.params.id);
  successResponse(res, campaign);
});

router.post('/campaigns', authenticate, requirePermission('marketing.campaigns.create'), async (req, res) => {
  const campaign = await svc.createCampaign(req.body, req.user.id);
  successResponse(res, campaign, 201, { message: 'Campaign created successfully.' });
});

router.put('/campaigns/:id', authenticate, requirePermission('marketing.campaigns.update'), async (req, res) => {
  const campaign = await svc.updateCampaign(req.params.id, req.body, req.user.id);
  successResponse(res, campaign, 200, { message: 'Campaign updated successfully.' });
});

router.patch('/campaigns/:id/status', authenticate, requirePermission('marketing.campaigns.publish'), async (req, res) => {
  const campaign = await svc.updateCampaignStatus(req.params.id, req.body.status, req.user.id);
  successResponse(res, campaign, 200, { message: `Campaign status updated to ${campaign.status}.` });
});

router.delete('/campaigns/:id', authenticate, requirePermission('marketing.campaigns.delete'), async (req, res) => {
  const result = await svc.deleteCampaign(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 3. FEATURED SERVICES
// ============================================================================
router.get('/featured-services', authenticate, requirePermission('marketing.featured_services.read'), async (req, res) => {
  const result = await svc.getFeaturedServices(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.post('/featured-services', authenticate, requirePermission('marketing.featured_services.create'), async (req, res) => {
  const featured = await svc.featureService(req.body, req.user.id);
  successResponse(res, featured, 201, { message: 'Service featured successfully.' });
});

router.put('/featured-services/:id', authenticate, requirePermission('marketing.featured_services.update'), async (req, res) => {
  const updated = await svc.updateFeaturedService(req.params.id, req.body, req.user.id);
  successResponse(res, updated, 200, { message: 'Featured service updated.' });
});

router.delete('/featured-services/:id', authenticate, requirePermission('marketing.featured_services.delete'), async (req, res) => {
  const result = await svc.unfeatureService(req.params.id, req.user.id);
  successResponse(res, result);
});

router.post('/featured-services/reorder', authenticate, requirePermission('marketing.featured_services.reorder'), async (req, res) => {
  const result = await svc.reorderFeaturedServices(req.body.items, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 4. FEATURED PRODUCTS
// ============================================================================
router.get('/featured-products', authenticate, requirePermission('marketing.featured_products.read'), async (req, res) => {
  const result = await svc.getFeaturedProducts(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.post('/featured-products', authenticate, requirePermission('marketing.featured_products.create'), async (req, res) => {
  const featured = await svc.featureProduct(req.body, req.user.id);
  successResponse(res, featured, 201, { message: 'Product featured successfully.' });
});

router.put('/featured-products/:id', authenticate, requirePermission('marketing.featured_products.update'), async (req, res) => {
  const updated = await svc.updateFeaturedProduct(req.params.id, req.body, req.user.id);
  successResponse(res, updated, 200, { message: 'Featured product updated.' });
});

router.delete('/featured-products/:id', authenticate, requirePermission('marketing.featured_products.delete'), async (req, res) => {
  const result = await svc.unfeatureProduct(req.params.id, req.user.id);
  successResponse(res, result);
});

router.post('/featured-products/reorder', authenticate, requirePermission('marketing.featured_products.reorder'), async (req, res) => {
  const result = await svc.reorderFeaturedProducts(req.body.items, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 5. HOMEPAGE BANNERS
// ============================================================================
router.get('/banners', authenticate, requirePermission('marketing.banners.read'), async (req, res) => {
  const result = await svc.getBanners(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/banners/:id', authenticate, requirePermission('marketing.banners.read'), async (req, res) => {
  const banner = await svc.getBannerById(req.params.id);
  successResponse(res, banner);
});

router.post('/banners', authenticate, requirePermission('marketing.banners.create'), async (req, res) => {
  const banner = await svc.createBanner(req.body, req.user.id);
  successResponse(res, banner, 201, { message: 'Banner created successfully.' });
});

router.put('/banners/:id', authenticate, requirePermission('marketing.banners.update'), async (req, res) => {
  const banner = await svc.updateBanner(req.params.id, req.body, req.user.id);
  successResponse(res, banner, 200, { message: 'Banner updated successfully.' });
});

router.patch('/banners/:id/toggle-status', authenticate, requirePermission('marketing.banners.publish'), async (req, res) => {
  const banner = await svc.toggleBannerStatus(req.params.id, req.user.id);
  successResponse(res, banner, 200, { message: `Banner is now ${banner.is_active ? 'active' : 'inactive'}.` });
});

router.delete('/banners/:id', authenticate, requirePermission('marketing.banners.delete'), async (req, res) => {
  const result = await svc.deleteBanner(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 6. PROMOTIONAL SECTIONS
// ============================================================================
router.get('/sections', authenticate, requirePermission('marketing.sections.read'), async (req, res) => {
  const result = await svc.getSections(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/sections/:id', authenticate, requirePermission('marketing.sections.read'), async (req, res) => {
  const section = await svc.getSectionById(req.params.id);
  successResponse(res, section);
});

router.post('/sections', authenticate, requirePermission('marketing.sections.create'), async (req, res) => {
  const section = await svc.createSection(req.body, req.user.id);
  successResponse(res, section, 201, { message: 'Promotional section created.' });
});

router.put('/sections/:id', authenticate, requirePermission('marketing.sections.update'), async (req, res) => {
  const section = await svc.updateSection(req.params.id, req.body, req.user.id);
  successResponse(res, section, 200, { message: 'Promotional section updated.' });
});

router.delete('/sections/:id', authenticate, requirePermission('marketing.sections.delete'), async (req, res) => {
  const result = await svc.deleteSection(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 7. NEWSLETTER CAMPAIGNS & SUBSCRIBERS
// ============================================================================
router.get('/newsletters', authenticate, requirePermission('marketing.newsletters.read'), async (req, res) => {
  const result = await svc.getNewsletters(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/newsletters/subscribers', authenticate, requirePermission('marketing.newsletters.read'), async (req, res) => {
  const result = await svc.getNewsletterSubscribers(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.patch('/newsletters/subscribers/:id/status', authenticate, requirePermission('marketing.newsletters.update'), async (req, res) => {
  const sub = await svc.updateSubscriberStatus(req.params.id, req.body.status, req.user.id);
  successResponse(res, sub, 200, { message: 'Subscriber status updated.' });
});

router.get('/newsletters/:id', authenticate, requirePermission('marketing.newsletters.read'), async (req, res) => {
  const newsletter = await svc.getNewsletterById(req.params.id);
  successResponse(res, newsletter);
});

router.post('/newsletters', authenticate, requirePermission('marketing.newsletters.create'), async (req, res) => {
  const newsletter = await svc.createNewsletter(req.body, req.user.id);
  successResponse(res, newsletter, 201, { message: 'Newsletter campaign created.' });
});

router.put('/newsletters/:id', authenticate, requirePermission('marketing.newsletters.update'), async (req, res) => {
  const newsletter = await svc.updateNewsletter(req.params.id, req.body, req.user.id);
  successResponse(res, newsletter, 200, { message: 'Newsletter campaign updated.' });
});

router.post('/newsletters/:id/send', authenticate, requirePermission('marketing.newsletters.send'), async (req, res) => {
  const result = await svc.sendNewsletterSimulation(req.params.id, req.user.id);
  successResponse(res, result, 200, { message: 'Newsletter sent successfully to all active subscribers.' });
});

router.delete('/newsletters/:id', authenticate, requirePermission('marketing.newsletters.delete'), async (req, res) => {
  const result = await svc.deleteNewsletter(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 8. AFFILIATES
// ============================================================================
router.get('/affiliates', authenticate, requirePermission('marketing.affiliates.read'), async (req, res) => {
  const result = await svc.getAffiliates(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/affiliates/:id', authenticate, requirePermission('marketing.affiliates.read'), async (req, res) => {
  const aff = await svc.getAffiliateById(req.params.id);
  successResponse(res, aff);
});

router.post('/affiliates', authenticate, requirePermission('marketing.affiliates.create'), async (req, res) => {
  const aff = await svc.createAffiliate(req.body, req.user.id);
  successResponse(res, aff, 201, { message: 'Affiliate onboarded successfully.' });
});

router.patch('/affiliates/:id/status', authenticate, requirePermission('marketing.affiliates.approve'), async (req, res) => {
  const aff = await svc.updateAffiliateStatus(req.params.id, req.body.status, req.user.id);
  successResponse(res, aff, 200, { message: `Affiliate status updated to ${aff.status}.` });
});

router.post('/affiliates/:id/payouts', authenticate, requirePermission('marketing.affiliates.payout'), async (req, res) => {
  const payout = await svc.processAffiliatePayout({
    affiliateId: req.params.id,
    amountCents: req.body.amount_cents,
    payoutMethod: req.body.payout_method,
    notes: req.body.notes
  }, req.user.id);
  successResponse(res, payout, 201, { message: 'Affiliate payout processed successfully.' });
});

// ============================================================================
// 9. REFERRAL PROGRAMS
// ============================================================================
router.get('/referrals', authenticate, requirePermission('marketing.referrals.read'), async (req, res) => {
  const result = await svc.getReferralPrograms(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/referrals/:id', authenticate, requirePermission('marketing.referrals.read'), async (req, res) => {
  const prog = await svc.getReferralProgramById(req.params.id);
  successResponse(res, prog);
});

router.post('/referrals', authenticate, requirePermission('marketing.referrals.create'), async (req, res) => {
  const prog = await svc.createReferralProgram(req.body, req.user.id);
  successResponse(res, prog, 201, { message: 'Referral program created successfully.' });
});

router.put('/referrals/:id', authenticate, requirePermission('marketing.referrals.update'), async (req, res) => {
  const prog = await svc.updateReferralProgram(req.params.id, req.body, req.user.id);
  successResponse(res, prog, 200, { message: 'Referral program updated.' });
});

router.post('/referrals/conversions/:id/approve', authenticate, requirePermission('marketing.referrals.approve'), async (req, res) => {
  const conv = await svc.approveReferralConversion(req.params.id, req.user.id);
  successResponse(res, conv, 200, { message: 'Referral conversion reward approved.' });
});

// ============================================================================
// 10. ADVERTISEMENT MANAGEMENT
// ============================================================================
router.get('/ads', authenticate, requirePermission('marketing.ads.read'), async (req, res) => {
  const result = await svc.getAdvertisements(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/ads/:id', authenticate, requirePermission('marketing.ads.read'), async (req, res) => {
  const ad = await svc.getAdvertisementById(req.params.id);
  successResponse(res, ad);
});

router.post('/ads', authenticate, requirePermission('marketing.ads.create'), async (req, res) => {
  const ad = await svc.createAdvertisement(req.body, req.user.id);
  successResponse(res, ad, 201, { message: 'Advertisement campaign created.' });
});

router.patch('/ads/:id/status', authenticate, requirePermission('marketing.ads.approve'), async (req, res) => {
  const ad = await svc.updateAdvertisementStatus(req.params.id, {
    status: req.body.status,
    rejectionReason: req.body.rejection_reason
  }, req.user.id);
  successResponse(res, ad, 200, { message: `Ad campaign status updated to ${ad.status}.` });
});

// ============================================================================
// 11. AUDIT LOGS & SETTINGS
// ============================================================================
router.get('/audit-logs', authenticate, requirePermission('marketing.audit.read'), async (req, res) => {
  const result = await svc.getAuditLogs(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/settings', authenticate, requirePermission('marketing.settings.read'), async (req, res) => {
  const settings = await svc.getSettings();
  successResponse(res, settings);
});

router.put('/settings', authenticate, requirePermission('marketing.settings.update'), async (req, res) => {
  const settings = await svc.updateSettings(req.body, req.user.id);
  successResponse(res, settings, 200, { message: 'Marketing settings updated successfully.' });
});

module.exports = router;
