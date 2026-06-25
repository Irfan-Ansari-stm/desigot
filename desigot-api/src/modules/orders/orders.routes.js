'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const svc    = require('./orders.service');
const { authenticate, requireAdmin, requireSeller } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { uuidParam } = require('../../shared/validators/common');
const { successResponse, paginatedResponse } = require('../../shared/utils');

router.post('/',
  authenticate,
  body('listing_id').isUUID(),
  body('license_type').isIn(['personal', 'commercial', 'extended']),
  body('promo_code').optional().isString(),
  validate,
  async (req, res) => successResponse(res, await svc.createOrder(req.user.id, req.body), 201)
);

router.get('/me',  authenticate, async (req, res) => {
  const role = req.query.role === 'seller' ? 'seller' : 'buyer';
  const r = await svc.listOrders(req.user.id, role, req.query, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.get('/me/licenses', authenticate, async (req, res) => {
  const r = await svc.listLicenses(req.user.id, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.get('/licenses/:key', authenticate, async (req, res) => successResponse(res, await svc.getLicense(req.params.key, req.user.id)));

// Admin
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  const r = await svc.adminListOrders(req.query, req.query);
  paginatedResponse(res, r.data, r.total, r.page, r.limit);
});

router.get('/:id',         authenticate, uuidParam(), validate, async (req, res) => successResponse(res, await svc.getOrder(req.params.id, req.user.id, req.user.role === 'admin')));
router.get('/:id/download',authenticate, uuidParam(), validate, async (req, res) => successResponse(res, await svc.getDownloadUrl(req.params.id, req.user.id)));
router.post('/:id/cancel', authenticate, uuidParam(), validate, async (req, res) => successResponse(res, await svc.cancelOrder(req.params.id, req.user.id, req.body.reason)));

module.exports = router;
