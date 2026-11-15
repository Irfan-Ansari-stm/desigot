'use strict';
const router = require('express').Router();
const ctrl = require('./rbac.controller');
const { authenticate } = require('../../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../../middleware/authorize');

router.use(authenticate);

router.get('/matrix',         requireAnyPermission('permissions.read', 'permissions.manage'), ctrl.getPermissionMatrix);
router.post('/matrix',        requirePermission('permissions.manage'),                        ctrl.updatePermissionMatrix);
router.post('/check',         ctrl.checkAccess);
router.get('/my-permissions', ctrl.getMyPermissions);
router.get('/policies',       requireAnyPermission('access_control.read'),  ctrl.getAccessPolicies);
router.post('/policies',      requirePermission('access_control.configure'), ctrl.createAccessPolicy);
router.delete('/policies/:id',requirePermission('access_control.configure'), ctrl.deleteAccessPolicy);

module.exports = router;
