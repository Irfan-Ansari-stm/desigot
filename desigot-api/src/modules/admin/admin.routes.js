'use strict';
const router  = require('express').Router();
const { body } = require('express-validator');
const crypto  = require('crypto');
const svc     = require('./admin.service');
const { authenticate, requireAdmin, requireSeller } = require('../../middleware/auth');
const validate  = require('../../middleware/validate');
const { uuidParam } = require('../../shared/validators/common');
const { successResponse, paginatedResponse } = require('../../shared/utils');

// ── Dashboard metrics ──────────────────────────────────────────────────────────
router.get('/metrics', authenticate, requireAdmin,
  async (req, res) => successResponse(res, await svc.getPlatformMetrics())
);

// ── Audit logs ─────────────────────────────────────────────────────────────────
router.get('/audit-logs', authenticate, requireAdmin, async (req, res) => {
  const r = await svc.getAuditLogs(req.query, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

// ── Platform config ────────────────────────────────────────────────────────────
router.get('/config', authenticate, requireAdmin,
  async (req, res) => successResponse(res, await svc.getConfig())
);
router.put('/config/:key', authenticate, requireAdmin,
  body('value').exists(),
  validate,
  async (req, res) => successResponse(res, await svc.updateConfig(req.user.id, req.params.key, req.body.value, req.body.description))
);

// ── Feature flags ──────────────────────────────────────────────────────────────
router.get('/feature-flags', authenticate, requireAdmin,
  async (req, res) => successResponse(res, await svc.getFeatureFlags())
);
router.put('/feature-flags/:key', authenticate, requireAdmin,
  body('is_enabled').isBoolean(),
  body('rollout_percentage').optional().isInt({ min: 0, max: 100 }),
  validate,
  async (req, res) => successResponse(res, await svc.updateFeatureFlag(req.user.id, req.params.key, req.body))
);

// ── Seller health ──────────────────────────────────────────────────────────────
router.post('/seller-health/:sellerId', authenticate, requireAdmin, uuidParam('sellerId'), validate,
  async (req, res) => successResponse(res, await svc.computeSellerHealth(req.params.sellerId))
);
router.get('/seller-earnings/:sellerId', authenticate, requireAdmin, uuidParam('sellerId'), validate,
  async (req, res) => successResponse(res, await svc.getSellerEarnings(req.params.sellerId))
);

// ── Maintenance jobs ───────────────────────────────────────────────────────────
router.post('/jobs/:job', authenticate, requireAdmin,
  async (req, res) => successResponse(res, await svc.runMaintenanceJob(req.params.job))
);

// ── API keys ───────────────────────────────────────────────────────────────────
router.get('/api-keys', authenticate, requireAdmin, async (req, res) => {
  const r = await svc.listApiKeys(req.query, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});
router.delete('/api-keys/:id', authenticate, requireAdmin, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.revokeApiKey(req.params.id))
);

// ── Webhooks (seller self-service) ─────────────────────────────────────────────
router.get('/webhooks', authenticate, requireSeller,
  async (req, res) => successResponse(res, await svc.listWebhooks(req.user.id))
);
router.post('/webhooks', authenticate, requireSeller,
  body('url').isURL({ require_protocol: true, protocols: ['https'] }),
  body('events').isArray({ min: 1 }),
  validate,
  async (req, res) => {
    const secretHash = crypto.createHmac('sha256', crypto.randomBytes(32)).digest('hex');
    const wh = await svc.createWebhook(req.user.id, req.body.url, req.body.events, secretHash);
    successResponse(res, { ...wh, secret: secretHash }, 201); // secret shown once
  }
);
router.delete('/webhooks/:id', authenticate, requireSeller, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.deleteWebhook(req.params.id, req.user.id))
);
router.get('/webhooks/:id/deliveries', authenticate, requireSeller, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.getWebhookDeliveries(req.params.id, req.user.id, req.query))
);

module.exports = router;
