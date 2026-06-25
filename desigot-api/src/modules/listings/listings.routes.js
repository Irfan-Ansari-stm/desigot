'use strict';
const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl   = require('./listings.controller');
const { authenticate, requireAdmin, requireSeller, optionalAuthenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { uploadLimiter } = require('../../middleware/rateLimiter');
const { imageUpload, fileUpload } = require('../../middleware/upload');
const { uuidParam, paginationQuery } = require('../../shared/validators/common');

// ── Public browse ──────────────────────────────────────────────────────────────
router.get('/',              optionalAuthenticate, ctrl.browse);
router.get('/collections',   ctrl.getCollections);
router.get('/collections/:slug', ctrl.getCollection);
router.get('/facets',        ctrl.getFacets);

// ── Seller ─────────────────────────────────────────────────────────────────────
router.get('/me/listings',   authenticate, requireSeller, ctrl.myListings);

router.post('/',
  authenticate, requireSeller,
  body('title').trim().isLength({ min: 5, max: 200 }),
  body('description').isLength({ min: 50 }),
  body('category_id').isUUID(),
  body('listing_type').optional().isIn(['asset', 'service']),
  body('price_personal').optional().isInt({ min: 100 }),
  body('price_commercial').optional().isInt({ min: 100 }),
  body('price_extended').optional().isInt({ min: 100 }),
  body('tags').optional().isArray(),
  validate,
  ctrl.create
);

router.patch('/:id',          authenticate, requireSeller, uuidParam(), validate, ctrl.update);
router.delete('/:id',         authenticate, uuidParam(), validate, ctrl.remove);
router.post('/:id/submit',    authenticate, requireSeller, uuidParam(), validate, ctrl.submitReview);
router.post('/:id/pause',     authenticate, requireSeller, uuidParam(), validate, ctrl.pause);
router.post('/:id/unpause',   authenticate, requireSeller, uuidParam(), validate, ctrl.unpause);

// ── Media upload ───────────────────────────────────────────────────────────────
router.post('/:id/media',
  authenticate, requireSeller, uploadLimiter,
  fileUpload.single('file'),
  body('media_type').optional().isIn(['preview_image', 'delivery_file', 'video', 'portfolio_item']),
  validate,
  ctrl.uploadMedia
);
router.delete('/:id/media/:mediaId', authenticate, uuidParam(), uuidParam('mediaId'), validate, ctrl.deleteMedia);
router.patch('/:id/media/reorder',   authenticate, requireSeller, ctrl.reorderMedia);

// ── Admin ──────────────────────────────────────────────────────────────────────
router.get('/admin/pending',     authenticate, requireAdmin, ctrl.pendingQueue);
router.post('/:id/review',
  authenticate, requireAdmin,
  body('action').isIn(['approve', 'reject']),
  body('reason').optional().isString(),
  validate,
  ctrl.reviewListing
);
router.post('/:id/quality-score', authenticate, requireAdmin,
  body('scores.overall').isFloat({ min: 0, max: 5 }),
  body('model_version').notEmpty(),
  validate,
  ctrl.setQuality
);

// ── Collections (admin) ────────────────────────────────────────────────────────
router.post('/collections',         authenticate, requireAdmin, body('name').notEmpty(), validate, ctrl.createCollection);
router.post('/collections/:collectionId/listings',    authenticate, requireAdmin, body('listing_id').isUUID(), validate, ctrl.addToCollection);
router.delete('/collections/:collectionId/listings/:listingId', authenticate, requireAdmin, ctrl.removeFromCollection);

router.get('/:id/media',     ctrl.listMedia);
router.get('/:id/quality',   authenticate, requireAdmin, ctrl.getQuality);
router.get('/:id/versions',  authenticate, ctrl.getVersions);
router.get('/:idOrSlug',     optionalAuthenticate, ctrl.getOne);

module.exports = router;
