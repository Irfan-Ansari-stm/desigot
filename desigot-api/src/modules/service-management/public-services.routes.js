'use strict';
const express = require('express');
const router = express.Router();
const serviceManager = require('./service-management.service');
const { optionalAuthenticate } = require('../../middleware/auth');

// Public Marketplace Service Listing
router.get('/', optionalAuthenticate, async (req, res) => {
  const query = {
    ...req.query,
    status: 'published', // Always enforce published only for public catalog
  };
  const result = await serviceManager.listServices(query, req.user);
  res.json({
    success: true,
    data: result.services || result.data || [],
    services: result.services || [],
    pagination: result.pagination || { total: (result.services || []).length, page: 1, limit: 12 }
  });
});

// Public Service Categories
router.get('/categories', async (req, res) => {
  const data = await serviceManager.listCategories();
  const active = data.filter((c) => c.is_active);
  res.json({ success: true, data: active });
});

// Public Service Tags
router.get('/tags', async (req, res) => {
  const data = await serviceManager.listTags(req.query.search, true);
  res.json({ success: true, data });
});

// Public Service Detail
router.get('/:idOrSlug', optionalAuthenticate, async (req, res) => {
  const data = await serviceManager.getServiceById(req.params.idOrSlug, req.user);
  res.json({ success: true, data });
});

module.exports = router;
