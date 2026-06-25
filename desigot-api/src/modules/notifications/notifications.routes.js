'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const svc    = require('./notifications.service');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { uuidParam } = require('../../shared/validators/common');
const { successResponse, paginatedResponse } = require('../../shared/utils');

router.get('/', authenticate, async (req, res) => {
  const r = await svc.getNotifications(req.user.id, req.query, req.query);
  res.json({ success: true, data: r.data, pagination: { total: r.total, unread_count: r.unread_count, page: r.page, limit: r.limit } });
});

router.patch('/:id/read', authenticate, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.markAsRead(req.user.id, req.params.id))
);

router.post('/read-all', authenticate,
  async (req, res) => successResponse(res, await svc.markAllAsRead(req.user.id))
);

router.delete('/:id', authenticate, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.deleteNotification(req.user.id, req.params.id))
);

// Preferences
router.get('/preferences', authenticate,
  async (req, res) => successResponse(res, await svc.getPreferences(req.user.id))
);

router.put('/preferences', authenticate,
  body('preferences').isArray({ min: 1 }),
  body('preferences.*.event_type').notEmpty(),
  validate,
  async (req, res) => successResponse(res, await svc.updatePreferences(req.user.id, req.body.preferences))
);

// Push subscriptions
router.post('/push/subscribe', authenticate,
  body('endpoint').isURL(),
  body('p256dh_key').notEmpty(),
  body('auth_key').notEmpty(),
  validate,
  async (req, res) => successResponse(res, await svc.registerPushSubscription(req.user.id, req.body), 201)
);

router.post('/push/unsubscribe', authenticate,
  body('endpoint').isURL(), validate,
  async (req, res) => successResponse(res, await svc.unregisterPushSubscription(req.user.id, req.body.endpoint))
);

// Admin: email logs
router.get('/admin/email-logs', authenticate, requireAdmin, async (req, res) => {
  const r = await svc.getEmailLogs(req.query, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

module.exports = router;
