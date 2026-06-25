'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const svc    = require('./wishlists.service');
const { authenticate, optionalAuthenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { uuidParam } = require('../../shared/validators/common');
const { successResponse } = require('../../shared/utils');

router.get('/me',     authenticate, async (req, res) => successResponse(res, await svc.listMyWishlists(req.user.id)));
router.get('/share/:token', optionalAuthenticate, async (req, res) => successResponse(res, await svc.getWishlistByShareToken(req.params.token)));
router.get('/:id',    authenticate, uuidParam(), validate, async (req, res) => successResponse(res, await svc.getWishlist(req.params.id, req.user.id)));

router.post('/',
  authenticate,
  body('name').optional().isLength({ max: 100 }),
  body('is_shared').optional().isBoolean(),
  validate,
  async (req, res) => successResponse(res, await svc.createWishlist(req.user.id, req.body.name, req.body.is_shared), 201)
);

router.patch('/:id', authenticate, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.updateWishlist(req.params.id, req.user.id, req.body))
);

router.delete('/:id', authenticate, uuidParam(), validate,
  async (req, res) => successResponse(res, await svc.deleteWishlist(req.params.id, req.user.id))
);

router.post('/:id/items',
  authenticate, uuidParam(),
  body('listing_id').isUUID(), validate,
  async (req, res) => successResponse(res, await svc.addItem(req.params.id, req.user.id, req.body.listing_id), 201)
);

router.delete('/:id/items/:listingId',
  authenticate, uuidParam(), uuidParam('listingId'), validate,
  async (req, res) => successResponse(res, await svc.removeItem(req.params.id, req.user.id, req.params.listingId))
);

module.exports = router;
