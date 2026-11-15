'use strict';
const router = require('express').Router();
const ctrl = require('./rbac.controller');
const { authenticate } = require('../../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../../middleware/authorize');

router.use(authenticate);

router.get('/',                 requireAnyPermission('roles.read', 'roles.view'), ctrl.getRoles);
router.post('/',                requirePermission('roles.create'),                ctrl.createRole);
router.get('/:id',             requireAnyPermission('roles.read', 'roles.view'), ctrl.getRoleById);
router.put('/:id',             requirePermission('roles.update'),                ctrl.updateRole);
router.delete('/:id',          requirePermission('roles.delete'),                ctrl.deleteRole);
router.post('/:id/duplicate',  requirePermission('roles.create'),                ctrl.duplicateRole);

module.exports = router;
