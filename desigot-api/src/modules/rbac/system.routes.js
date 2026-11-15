'use strict';
const router = require('express').Router();
const ctrl = require('./rbac.controller');
const { authenticate } = require('../../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../../middleware/authorize');
const { query } = require('../../db/pool');

router.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ success: false, status: 'unhealthy', error: err.message });
  }
});

router.use(authenticate);

router.get('/settings',           requireAnyPermission('settings.read'), ctrl.getSystemSettings);
router.put('/settings/:key',      requirePermission('settings.update'), ctrl.updateSystemSetting);
router.get('/analytics',          requireAnyPermission('reports.read'), ctrl.getSuperAdminDashboard);

module.exports = router;
