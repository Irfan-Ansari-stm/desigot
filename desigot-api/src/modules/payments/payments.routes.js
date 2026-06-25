'use strict';
const router  = require('express').Router();
const express = require('express');
const { body } = require('express-validator');
const svc     = require('./payments.service');
const { authenticate, requireAdmin, requireSeller } = require('../../middleware/auth');
const validate  = require('../../middleware/validate');
const { uuidParam } = require('../../shared/validators/common');
const { successResponse, paginatedResponse } = require('../../shared/utils');
const { webhookLimiter } = require('../../middleware/rateLimiter');

// ── Payment intents ────────────────────────────────────────────────────────────
router.post('/intents',
  authenticate,
  body('order_id').isUUID(),
  validate,
  async (req, res) => successResponse(res, await svc.createPaymentIntent(req.body.order_id, req.user.id))
);

// Dev-only: simulate successful payment
router.post('/simulate/:orderId', authenticate, uuidParam('orderId'), validate,
  async (req, res) => successResponse(res, await svc.simulatePayment(req.params.orderId, req.user.id))
);

// ── Stripe webhook (raw body required before json middleware) ─────────────────
router.post(
  '/webhook/stripe',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const result = await svc.handleStripeWebhook(req.body, sig);
    res.json(result);
  }
);

// ── Escrow ────────────────────────────────────────────────────────────────────
router.get('/escrow/:orderId',         authenticate, uuidParam('orderId'), validate, async (req, res) => successResponse(res, await svc.getEscrow(req.params.orderId, req.user.id, req.user.role === 'admin')));
router.post('/escrow/:orderId/release',authenticate, requireAdmin, uuidParam('orderId'), validate, async (req, res) => successResponse(res, await svc.releaseEscrowManual(req.params.orderId, req.user.id, req.body.reason)));

// ── Payout methods ─────────────────────────────────────────────────────────────
router.get   ('/payout-methods', authenticate, requireSeller, async (req, res) => successResponse(res, await svc.listPayoutMethods(req.user.id)));
router.post  ('/payout-methods', authenticate, requireSeller,
  body('method_type').isIn(['stripe_connect', 'paypal', 'bank_transfer']),
  body('display_name').notEmpty(),
  validate,
  async (req, res) => successResponse(res, await svc.addPayoutMethod(req.user.id, req.body), 201)
);
router.delete('/payout-methods/:id', authenticate, requireSeller, uuidParam(), validate, async (req, res) => successResponse(res, await svc.deletePayoutMethod(req.user.id, req.params.id)));

// ── Payouts ────────────────────────────────────────────────────────────────────
router.post('/payouts', authenticate, requireSeller,
  body('method_id').isUUID(), body('amount_cents').isInt({ min: 5000 }), validate,
  async (req, res) => successResponse(res, await svc.requestPayout(req.user.id, req.body.method_id, req.body.amount_cents), 201)
);
router.get('/payouts', authenticate, requireSeller, async (req, res) => {
  const r = await svc.listPayouts(req.user.id, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

// ── Commission ledger ──────────────────────────────────────────────────────────
router.get('/ledger', authenticate, requireSeller, async (req, res) => {
  const r = await svc.getCommissionLedger(req.user.id, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

// ── Subscription plans ─────────────────────────────────────────────────────────
router.get ('/plans',          async (req, res) => successResponse(res, await svc.listPlans()));
router.get ('/subscription',   authenticate, requireSeller, async (req, res) => successResponse(res, await svc.getMySubscription(req.user.id)));
router.post('/subscription',   authenticate, requireSeller,
  body('plan_id').isUUID(), body('billing_cycle').isIn(['monthly', 'yearly']), validate,
  async (req, res) => successResponse(res, await svc.subscribeToPlan(req.user.id, req.body.plan_id, req.body.billing_cycle))
);
router.delete('/subscription', authenticate, requireSeller, async (req, res) => successResponse(res, await svc.cancelSubscription(req.user.id)));

// ── Promo codes ────────────────────────────────────────────────────────────────
router.get ('/promo-codes', authenticate, requireAdmin, async (req, res) => {
  const r = await svc.listPromoCodes(req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});
router.post('/promo-codes', authenticate, requireAdmin,
  body('code').isAlphanumeric().isLength({ min: 3, max: 50 }),
  body('discount_type').isIn(['percent', 'fixed_cents']),
  body('discount_value').isInt({ min: 1 }),
  validate,
  async (req, res) => successResponse(res, await svc.createPromoCode(req.user.id, req.body), 201)
);

module.exports = router;
