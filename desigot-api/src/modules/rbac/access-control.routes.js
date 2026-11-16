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

// Module Access
router.get('/modules',        requireAnyPermission('permissions.read', 'access_control.read'), ctrl.getModuleAccess);
router.put('/modules',        requirePermission('permissions.manage'), ctrl.updateModuleAccess);
router.post('/modules',       requirePermission('permissions.manage'), ctrl.updateModuleAccess);

// API Route Permissions
router.get('/api-permissions',requireAnyPermission('api.read', 'access_control.read'), ctrl.getApiPermissions);
router.post('/api-permissions',requirePermission('api.create'), ctrl.createApiPermission);
router.put('/api-permissions/:id',requirePermission('api.update'), ctrl.updateApiPermission);
router.delete('/api-permissions/:id',requirePermission('api.delete'), ctrl.deleteApiPermission);

// Role Assignments
router.get('/assignments',    requireAnyPermission('roles.read', 'users.read'), ctrl.getUserRoleAssignments);
router.post('/assignments',   requirePermission('users.assign_role'), ctrl.assignRolesToUser);
router.delete('/assignments/:userId/:roleId',requirePermission('users.assign_role'), ctrl.removeRoleFromUser);

module.exports = router;
