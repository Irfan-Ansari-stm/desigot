'use strict';
const router = require('express').Router();
const ctrl = require('./rbac.controller');
const { authenticate } = require('../../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../../middleware/authorize');

router.use(authenticate);

router.get('/',        requireAnyPermission('permissions.read', 'permissions.view'), ctrl.getPermissions);
router.post('/',       requirePermission('permissions.create'),                      ctrl.createPermission);
router.put('/:id',    requirePermission('permissions.update'),                      ctrl.updatePermission);
router.delete('/:id', requirePermission('permissions.delete'),                      ctrl.deletePermission);

module.exports = router;
