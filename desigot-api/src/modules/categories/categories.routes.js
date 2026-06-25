'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const svc    = require('./categories.service');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { successResponse } = require('../../shared/utils');

router.get  ('/',              async (req, res) => successResponse(res, await svc.listCategories(req.query.parent_id)));
router.get  ('/tree',          async (req, res) => successResponse(res, await svc.getCategoryTree()));
router.get  ('/:slug',         async (req, res) => successResponse(res, await svc.getCategoryBySlug(req.params.slug)));

router.post ('/', authenticate, requireAdmin,
  body('name').notEmpty().isLength({ max: 100 }),
  body('depth').optional().isInt({ min: 0, max: 2 }),
  validate,
  async (req, res) => successResponse(res, await svc.createCategory(req.body), 201)
);

router.patch('/:id', authenticate, requireAdmin,
  async (req, res) => successResponse(res, await svc.updateCategory(req.params.id, req.body))
);

router.delete('/:id', authenticate, requireAdmin,
  async (req, res) => successResponse(res, await svc.deleteCategory(req.params.id))
);

module.exports = router;
