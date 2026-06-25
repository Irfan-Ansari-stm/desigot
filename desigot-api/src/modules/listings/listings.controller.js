'use strict';
const svc       = require('./listings.service');
const mediaSvc  = require('./listings.media.service');
const { successResponse, paginatedResponse } = require('../../shared/utils');

// ── Listings CRUD ─────────────────────────────────────────────────────────────
const create       = async (req, res) => successResponse(res, await svc.createListing(req.user.id, req.body), 201);
const browse       = async (req, res) => { const r = await svc.browseListings(req.query, req.query); return paginatedResponse(res, r.data, r.total, r.page, r.limit); };
const getOne       = async (req, res) => successResponse(res, await svc.getListing(req.params.idOrSlug, req.user?.id));
const update       = async (req, res) => successResponse(res, await svc.updateListing(req.params.id, req.user.id, req.body, req.user.role === 'admin'));
const remove       = async (req, res) => successResponse(res, await svc.deleteListing(req.params.id, req.user.id, req.user.role === 'admin'));
const submitReview = async (req, res) => successResponse(res, await svc.submitForReview(req.params.id, req.user.id));
const pause        = async (req, res) => successResponse(res, await svc.pauseListing(req.params.id, req.user.id));
const unpause      = async (req, res) => successResponse(res, await svc.unpauseListing(req.params.id, req.user.id));
const getVersions  = async (req, res) => successResponse(res, await svc.getListingVersions(req.params.id, req.user.id, req.user.role === 'admin'));
const getQuality   = async (req, res) => successResponse(res, await svc.getQualityScore(req.params.id));
const myListings   = async (req, res) => { const r = await svc.getMyListings(req.user.id, req.query, req.query); return paginatedResponse(res, r.data, r.total, r.page, r.limit); };
const getFacets    = async (req, res) => successResponse(res, await svc.getListingFacets());

// ── Admin ─────────────────────────────────────────────────────────────────────
const pendingQueue  = async (req, res) => { const r = await svc.getPendingListings(req.query); return paginatedResponse(res, r.data, r.total, r.page, r.limit); };
const reviewListing = async (req, res) => successResponse(res, await svc.reviewListing(req.params.id, req.user.id, req.body.action, req.body.reason));
const setQuality    = async (req, res) => successResponse(res, await svc.setQualityScore(req.params.id, req.body.scores, req.body.model_version));

// ── Collections ───────────────────────────────────────────────────────────────
const getCollections     = async (req, res) => successResponse(res, await svc.listCollections());
const getCollection      = async (req, res) => successResponse(res, await svc.getCollection(req.params.slug));
const createCollection   = async (req, res) => successResponse(res, await svc.createCollection(req.body, req.user.id), 201);
const addToCollection    = async (req, res) => successResponse(res, await svc.addToCollection(req.params.collectionId, req.body.listing_id, req.user.id, req.body.sort_order));
const removeFromCollection = async (req, res) => successResponse(res, await svc.removeFromCollection(req.params.collectionId, req.params.listingId));

// ── Media ─────────────────────────────────────────────────────────────────────
const uploadMedia  = async (req, res) => successResponse(res, await mediaSvc.addMedia(req.params.id, req.user.id, req.file, req.body.media_type || 'preview_image', parseInt(req.body.sort_order) || 0), 201);
const listMedia    = async (req, res) => successResponse(res, await mediaSvc.listMedia(req.params.id));
const deleteMedia  = async (req, res) => successResponse(res, await mediaSvc.deleteMedia(req.params.mediaId, req.user.id, req.user.role === 'admin'));
const reorderMedia = async (req, res) => successResponse(res, await mediaSvc.reorderMedia(req.params.id, req.user.id, req.body.order));

module.exports = {
  create, browse, getOne, update, remove, submitReview, pause, unpause,
  getVersions, getQuality, myListings, getFacets, pendingQueue, reviewListing, setQuality,
  getCollections, getCollection, createCollection, addToCollection, removeFromCollection,
  uploadMedia, listMedia, deleteMedia, reorderMedia,
};
