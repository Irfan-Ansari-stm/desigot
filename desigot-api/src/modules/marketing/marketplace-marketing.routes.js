'use strict';

const router = require('express').Router();
const svc = require('./marketing-promotions.service');
const { successResponse } = require('../../shared/utils');

// 1. Homepage & Marketplace Banners
router.get('/banners', async (req, res) => {
  const placement = req.query.placement || 'hero';
  const banners = await svc.getMarketplaceBanners(placement);
  successResponse(res, banners);
});

// 2. Promotional Homepage Sections
router.get('/sections', async (req, res) => {
  const sections = await svc.getMarketplaceSections();
  successResponse(res, sections);
});

// 3. Featured Products
router.get('/featured-products', async (req, res) => {
  const placement = req.query.placement || 'homepage';
  const products = await svc.getMarketplaceFeaturedProducts(placement);
  successResponse(res, products);
});

// 4. Featured Services
router.get('/featured-services', async (req, res) => {
  const placement = req.query.placement || 'homepage';
  const services = await svc.getMarketplaceFeaturedServices(placement);
  successResponse(res, services);
});

// 5. Customer Coupon Checkout Validation Engine
router.post('/coupons/validate', async (req, res) => {
  const result = await svc.validateCoupon({
    code: req.body.code,
    customerId: req.body.customerId || req.body.customer_id,
    items: req.body.items || [],
    orderAmountCents: req.body.orderAmountCents || req.body.order_amount_cents || 0
  });
  successResponse(res, result, 200, { message: 'Coupon applied successfully.' });
});

// 6. Public Newsletter Subscribe
router.post('/newsletters/subscribe', async (req, res) => {
  const result = await svc.subscribeNewsletter(req.body.email, req.body.source);
  successResponse(res, result, 200, { message: 'Thank you for subscribing to Desigot!' });
});

// 7. Affiliate Click Attribution Tracker
router.post('/affiliates/track-click', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';
  const result = await svc.trackAffiliateClick({
    affiliateCode: req.body.affiliateCode || req.body.affiliate_code,
    landingPage: req.body.landingPage || req.body.landing_page,
    referrerUrl: req.body.referrerUrl || req.body.referrer_url,
    ipAddress: ip,
    userAgent
  });
  successResponse(res, result);
});

// 8. Sponsored Ad Click Tracker
router.post('/ads/:id/click', async (req, res) => {
  const result = await svc.recordAdClick(req.params.id);
  successResponse(res, result);
});

module.exports = router;
