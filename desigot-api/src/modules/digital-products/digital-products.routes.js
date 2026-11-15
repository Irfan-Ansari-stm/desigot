'use strict';
const express = require('express');
const router = express.Router();
const digitalProductsService = require('./digital-products.service');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');

// 1. Stats
router.get(
  '/stats',
  authenticate,
  requirePermission('products.read'),
  async (req, res, next) => {
    try {
      const stats = await digitalProductsService.getProductStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Files List
router.get(
  '/files',
  authenticate,
  requirePermission('products.read'),
  async (req, res, next) => {
    try {
      const data = await digitalProductsService.listAllFiles(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/files',
  authenticate,
  requirePermission('products.update'),
  async (req, res, next) => {
    try {
      const file = await digitalProductsService.addFile(req.body.product_id, req.body, req.user?.id, req);
      res.status(201).json({ success: true, data: file });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/files/:id',
  authenticate,
  requirePermission('products.delete'),
  async (req, res, next) => {
    try {
      const result = await digitalProductsService.deleteFile(req.params.id, req.user?.id, req);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// 3. Licenses
router.get(
  '/licenses',
  authenticate,
  requirePermission('products.read'),
  async (req, res, next) => {
    try {
      const licenses = await digitalProductsService.listLicenses();
      res.json({ success: true, data: licenses });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/licenses',
  authenticate,
  requirePermission('products.update'),
  async (req, res, next) => {
    try {
      const lic = await digitalProductsService.createLicense(req.body, req.user?.id, req);
      res.status(201).json({ success: true, data: lic });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/licenses/:id',
  authenticate,
  requirePermission('products.update'),
  async (req, res, next) => {
    try {
      const lic = await digitalProductsService.updateLicense(req.params.id, req.body, req.user?.id, req);
      res.json({ success: true, data: lic });
    } catch (err) {
      next(err);
    }
  }
);

// 4. Versions
router.get(
  '/versions',
  authenticate,
  requirePermission('products.read'),
  async (req, res, next) => {
    try {
      const data = await digitalProductsService.listAllVersions(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/versions',
  authenticate,
  requirePermission('products.update'),
  async (req, res, next) => {
    try {
      const version = await digitalProductsService.createVersion(req.body.product_id, req.body, req.user?.id, req);
      res.status(201).json({ success: true, data: version });
    } catch (err) {
      next(err);
    }
  }
);

// 5. Downloads
router.get(
  '/downloads',
  authenticate,
  requirePermission('products.read'),
  async (req, res, next) => {
    try {
      const data = await digitalProductsService.listDownloads(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/downloads/signed-url',
  authenticate,
  requirePermission('products.read'),
  async (req, res, next) => {
    try {
      const result = await digitalProductsService.generateSignedDownloadUrl(
        req.body.productId,
        req.body.fileId,
        req.user?.id,
        req
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 6. Sales
router.get(
  '/sales',
  authenticate,
  requirePermission('products.read'),
  async (req, res, next) => {
    try {
      const data = await digitalProductsService.listSales(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// 7. Refunds
router.get(
  '/refunds',
  authenticate,
  requirePermission('products.read'),
  async (req, res, next) => {
    try {
      const data = await digitalProductsService.listRefunds(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/refunds/:id/resolve',
  authenticate,
  requirePermission('products.update'),
  async (req, res, next) => {
    try {
      const result = await digitalProductsService.resolveRefund(
        req.params.id,
        req.body.resolution,
        req.user?.id,
        req.body.notes,
        req
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 8. Products List & Create
router.get(
  '/',
  authenticate,
  requirePermission('products.read'),
  async (req, res, next) => {
    try {
      const data = await digitalProductsService.listProducts(req.query);
      res.json({ success: true, data, ...data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('products.create'),
  async (req, res, next) => {
    try {
      const product = await digitalProductsService.createProduct(req.body, req.user?.id, req);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

// 9. Single Product Operations
router.get(
  '/:id',
  authenticate,
  requirePermission('products.read'),
  async (req, res, next) => {
    try {
      const product = await digitalProductsService.getProductById(req.params.id);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  authenticate,
  requirePermission('products.update'),
  async (req, res, next) => {
    try {
      const product = await digitalProductsService.updateProduct(req.params.id, req.body, req.user?.id, req);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('products.delete'),
  async (req, res, next) => {
    try {
      const result = await digitalProductsService.deleteProduct(req.params.id, req.user?.id, req);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/duplicate',
  authenticate,
  requirePermission('products.create'),
  async (req, res, next) => {
    try {
      const product = await digitalProductsService.duplicateProduct(req.params.id, req.user?.id, req);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

// 10. Moderation actions
router.post(
  '/:id/approve',
  authenticate,
  requirePermission('products.approve'),
  async (req, res, next) => {
    try {
      const product = await digitalProductsService.approveProduct(req.params.id, req.user?.id, req.body.notes, req);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/reject',
  authenticate,
  requirePermission('products.reject'),
  async (req, res, next) => {
    try {
      const product = await digitalProductsService.rejectProduct(req.params.id, req.user?.id, req.body.reason, req.body.notes, req);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/publish',
  authenticate,
  requirePermission('products.publish'),
  async (req, res, next) => {
    try {
      const product = await digitalProductsService.publishProduct(req.params.id, req.user?.id, req);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/unpublish',
  authenticate,
  requirePermission('products.unpublish'),
  async (req, res, next) => {
    try {
      const product = await digitalProductsService.unpublishProduct(req.params.id, req.user?.id, req);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/suspend',
  authenticate,
  requirePermission('products.update'),
  async (req, res, next) => {
    try {
      const product = await digitalProductsService.suspendProduct(req.params.id, req.user?.id, req.body.reason, req);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/feature',
  authenticate,
  requirePermission('products.feature'),
  async (req, res, next) => {
    try {
      const product = await digitalProductsService.toggleFeatured(
        req.params.id,
        req.body.is_featured,
        req.body.position,
        req.body.featured_type,
        req.user?.id,
        req
      );
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
