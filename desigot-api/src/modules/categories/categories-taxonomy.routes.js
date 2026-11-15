'use strict';

const router = require('express').Router();
const svc = require('./categories-taxonomy.service');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');
const { successResponse } = require('../../shared/utils');

// ── KPI Stats Overview
router.get('/stats', authenticate, requirePermission('categories.read'), async (req, res, next) => {
  try {
    const stats = await svc.getStats();
    return successResponse(res, stats);
  } catch (err) {
    next(err);
  }
});

// ── Export CSV
router.get('/export', authenticate, requirePermission('categories.export'), async (req, res, next) => {
  try {
    const csv = await svc.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="desigot_categories.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
});

// ── Tree hierarchy
router.get('/tree', authenticate, requirePermission('categories.hierarchy.read'), async (req, res, next) => {
  try {
    const tree = await svc.getTree(req.query.type);
    return successResponse(res, { tree });
  } catch (err) {
    next(err);
  }
});

// ── Main categories
router.get('/main', authenticate, requirePermission('categories.read'), async (req, res, next) => {
  try {
    const data = await svc.listCategories({ ...req.query, depth: 0, parent_id: 'root' });
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
});

// ── Subcategories
router.get('/subcategories', authenticate, requirePermission('categories.read'), async (req, res, next) => {
  try {
    const data = await svc.listCategories({ ...req.query, depth: 1 });
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
});

// ── Service categories
router.get('/services', authenticate, requirePermission('service_categories.read'), async (req, res, next) => {
  try {
    const data = await svc.listCategories({ ...req.query, category_type: 'service' });
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
});

// ── Product categories
router.get('/products', authenticate, requirePermission('product_categories.read'), async (req, res, next) => {
  try {
    const data = await svc.listCategories({ ...req.query, category_type: 'product' });
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
});

// ── Dynamic Attributes
router.get('/attributes', authenticate, requirePermission('category_attributes.read'), async (req, res, next) => {
  try {
    const attributes = await svc.listAttributes(req.query.category_id);
    return successResponse(res, { attributes });
  } catch (err) {
    next(err);
  }
});

router.post('/attributes', authenticate, requirePermission('category_attributes.create'), async (req, res, next) => {
  try {
    const attribute = await svc.createAttribute(req.body, req.user?.id);
    return successResponse(res, attribute, 201);
  } catch (err) {
    next(err);
  }
});

router.delete('/attributes/:id', authenticate, requirePermission('category_attributes.delete'), async (req, res, next) => {
  try {
    const result = await svc.deleteAttribute(req.params.id, req.user?.id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

// ── Icons Library
router.get('/icons', authenticate, requirePermission('category_icons.read'), async (req, res, next) => {
  try {
    const icons = await svc.listIcons();
    return successResponse(res, { icons });
  } catch (err) {
    next(err);
  }
});

router.post('/icons', authenticate, requirePermission('category_icons.upload'), async (req, res, next) => {
  try {
    const icon = await svc.createIcon(req.body, req.user?.id);
    return successResponse(res, icon, 201);
  } catch (err) {
    next(err);
  }
});

// ── Banners Management
router.get('/banners', authenticate, requirePermission('category_banners.read'), async (req, res, next) => {
  try {
    const banners = await svc.listBanners(req.query.category_id);
    return successResponse(res, { banners });
  } catch (err) {
    next(err);
  }
});

router.post('/banners', authenticate, requirePermission('category_banners.upload'), async (req, res, next) => {
  try {
    const banner = await svc.createBanner(req.body, req.user?.id);
    return successResponse(res, banner, 201);
  } catch (err) {
    next(err);
  }
});

router.delete('/banners/:id', authenticate, requirePermission('category_banners.delete'), async (req, res, next) => {
  try {
    const result = await svc.deleteBanner(req.params.id, req.user?.id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

// ── Redirects
router.get('/redirects', authenticate, requirePermission('category_seo.manage_redirects'), async (req, res, next) => {
  try {
    const redirects = await svc.listRedirects();
    return successResponse(res, { redirects });
  } catch (err) {
    next(err);
  }
});

// ── Reorder sequence
router.post('/reorder', authenticate, requirePermission('categories.hierarchy.reorder'), async (req, res, next) => {
  try {
    const result = await svc.reorderCategories(req.body.ordered_ids || req.body.orderedIds, req.user?.id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

// ── Master Directory & CRUD
router.get('/', authenticate, requirePermission('categories.read'), async (req, res, next) => {
  try {
    const data = await svc.listCategories(req.query);
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requirePermission('categories.create'), async (req, res, next) => {
  try {
    const category = await svc.createCategory(req.body, req.user?.id);
    return successResponse(res, category, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, requirePermission('categories.read'), async (req, res, next) => {
  try {
    const data = await svc.getCategoryById(req.params.id);
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, requirePermission('categories.update'), async (req, res, next) => {
  try {
    const updated = await svc.updateCategory(req.params.id, req.body, req.user?.id);
    return successResponse(res, updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requirePermission('categories.delete'), async (req, res, next) => {
  try {
    const result = await svc.deleteCategory(req.params.id, req.user?.id);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/restore', authenticate, requirePermission('categories.restore'), async (req, res, next) => {
  try {
    const restored = await svc.restoreCategory(req.params.id, req.user?.id);
    return successResponse(res, restored);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/publish', authenticate, requirePermission('categories.publish'), async (req, res, next) => {
  try {
    const published = await svc.updateCategory(req.params.id, { status: 'published' }, req.user?.id);
    return successResponse(res, published);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', authenticate, requirePermission('categories.archive'), async (req, res, next) => {
  try {
    const archived = await svc.updateCategory(req.params.id, { status: 'archived' }, req.user?.id);
    return successResponse(res, archived);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
