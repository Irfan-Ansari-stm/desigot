'use strict';
const router = require('express').Router();
const ctrl = require('./rbac.controller');
const { authenticate } = require('../../middleware/auth');
const { requireAnyPermission } = require('../../middleware/authorize');

router.use(authenticate);

router.get('/',    requireAnyPermission('audit.read', 'audit.view'), ctrl.getAuditLogs);
router.get('/:id', requireAnyPermission('audit.read', 'audit.view'), ctrl.getAuditLogById);

module.exports = router;
