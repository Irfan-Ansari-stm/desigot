'use strict';
const router = require('express').Router();
const ctrl = require('./rbac.controller');
const { authenticate } = require('../../middleware/auth');
const {
  requirePermission,
  requireAnyPermission,
  requireSuperAdmin,
} = require('../../middleware/authorize');

// All RBAC routes require authentication
router.use(authenticate);

// ── ROLES ─────────────────────────────────────────────────────────────────────
router.get('/roles',                 requireAnyPermission('roles.read', 'roles.view'), ctrl.getRoles);
router.post('/roles',                requirePermission('roles.create'),                ctrl.createRole);
router.get('/roles/:id',             requireAnyPermission('roles.read', 'roles.view'), ctrl.getRoleById);
router.put('/roles/:id',             requirePermission('roles.update'),                ctrl.updateRole);
router.delete('/roles/:id',          requirePermission('roles.delete'),                ctrl.deleteRole);
router.post('/roles/:id/duplicate',  requirePermission('roles.create'),                ctrl.duplicateRole);

// ── PERMISSIONS ───────────────────────────────────────────────────────────────
router.get('/permissions',           requireAnyPermission('permissions.read', 'permissions.view'), ctrl.getPermissions);
router.post('/permissions',          requirePermission('permissions.create'),                      ctrl.createPermission);
router.put('/permissions/:id',       requirePermission('permissions.update'),                      ctrl.updatePermission);
router.delete('/permissions/:id',    requirePermission('permissions.delete'),                      ctrl.deletePermission);

// ── PERMISSION MATRIX & ACCESS CONTROL ────────────────────────────────────────
router.get('/access-control/matrix',         requireAnyPermission('permissions.read', 'permissions.manage'), ctrl.getPermissionMatrix);
router.post('/access-control/matrix',        requirePermission('permissions.manage'),                        ctrl.updatePermissionMatrix);
router.post('/access-control/check',         ctrl.checkAccess); // Self checking permitted
router.get('/access-control/my-permissions', ctrl.getMyPermissions); // Self permissions
router.get('/access-control/policies',       requireAnyPermission('access_control.read'),  ctrl.getAccessPolicies);
router.post('/access-control/policies',      requirePermission('access_control.configure'), ctrl.createAccessPolicy);
router.delete('/access-control/policies/:id',requirePermission('access_control.configure'), ctrl.deleteAccessPolicy);

// ── MODULE ACCESS ────────────────────────────────────────────────────────────
router.get('/modules/access',                requireAnyPermission('permissions.read', 'access_control.read'), ctrl.getModuleAccess);
router.put('/modules/access',                requirePermission('permissions.manage'), ctrl.updateModuleAccess);
router.post('/modules/access',               requirePermission('permissions.manage'), ctrl.updateModuleAccess);

// ── API PERMISSIONS REGISTRY ──────────────────────────────────────────────────
router.get('/api-permissions',               requireAnyPermission('api.read', 'access_control.read'), ctrl.getApiPermissions);
router.post('/api-permissions',              requirePermission('api.create'), ctrl.createApiPermission);
router.put('/api-permissions/:id',           requirePermission('api.update'), ctrl.updateApiPermission);
router.delete('/api-permissions/:id',        requirePermission('api.delete'), ctrl.deleteApiPermission);

// ── ROLE ASSIGNMENTS ─────────────────────────────────────────────────────────
router.get('/assignments',                   requireAnyPermission('roles.read', 'users.read'), ctrl.getUserRoleAssignments);
router.post('/assignments',                  requirePermission('users.assign_role'), ctrl.assignRolesToUser);
router.delete('/assignments/:userId/:roleId',requirePermission('users.assign_role'), ctrl.removeRoleFromUser);

// ── ADMIN ACTIVITY LOGS ──────────────────────────────────────────────────────
router.get('/activity',                      requireAnyPermission('audit.read', 'audit.view'), ctrl.getAdminActivityLogs);

// ── USER MANAGEMENT (RBAC) ────────────────────────────────────────────────────
router.get('/users',                         requireAnyPermission('users.read', 'users.view'), ctrl.getUsers);
router.post('/users',                        requirePermission('users.create'),                ctrl.createUser);
router.get('/users/:id',                     requireAnyPermission('users.read', 'users.view'), ctrl.getUserById);
router.put('/users/:id',                     requirePermission('users.update'),                ctrl.updateUser);
router.delete('/users/:id',                  requirePermission('users.delete'),                ctrl.deleteUser);
router.post('/users/bulk-delete',            requirePermission('users.delete'),                ctrl.bulkDeleteUsers);
router.patch('/users/:id/status',            requirePermission('users.manage'),                ctrl.setUserStatus);
router.post('/users/:id/reset-password',     requirePermission('users.manage'),                ctrl.resetUserPassword);
router.post('/users/:id/force-logout',       requirePermission('users.manage'),                ctrl.forceLogoutUser);

// ── ORGANIZATION ──────────────────────────────────────────────────────────────
router.get('/departments',                   requireAnyPermission('organization.read', 'organization.view'), ctrl.getDepartments);
router.post('/departments',                  requirePermission('organization.create'),                       ctrl.createDepartment);
router.put('/departments/:id',              requirePermission('organization.update'),                       ctrl.updateDepartment);
router.delete('/departments/:id',           requirePermission('organization.delete'),                       ctrl.deleteDepartment);
router.get('/teams',                         requireAnyPermission('organization.read', 'organization.view'), ctrl.getTeams);
router.post('/teams',                        requirePermission('organization.create'),                       ctrl.createTeam);
router.get('/designations',                  requireAnyPermission('organization.read', 'organization.view'), ctrl.getDesignations);
router.post('/designations',                 requirePermission('organization.create'),                       ctrl.createDesignation);

// ── SECURITY & SESSIONS ───────────────────────────────────────────────────────
router.get('/security/login-history',        requireAnyPermission('security.read', 'audit.read'), ctrl.getLoginHistory);
router.get('/security/sessions',             requireAnyPermission('security.read', 'security.manage'), ctrl.getActiveSessions);
router.delete('/security/sessions/:id',      requirePermission('security.manage'), ctrl.revokeSession);
router.get('/security/settings',             requireAnyPermission('security.read', 'settings.read'), ctrl.getSecuritySettings);
router.put('/security/settings',             requirePermission('security.configure'), ctrl.updateSecuritySettings);
router.get('/security/events',               requireAnyPermission('security.read'), ctrl.getSecurityEvents);
router.get('/security/ip-restrictions',      requireAnyPermission('security.read'), ctrl.getIpRestrictions);
router.post('/security/ip-restrictions',     requirePermission('security.configure'), ctrl.createIpRestriction);
router.delete('/security/ip-restrictions/:id',requirePermission('security.configure'), ctrl.deleteIpRestriction);

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────
router.get('/audit-logs',                    requireAnyPermission('audit.read', 'audit.view'), ctrl.getAuditLogs);
router.get('/audit-logs/:id',                requireAnyPermission('audit.read', 'audit.view'), ctrl.getAuditLogById);

// ── SYSTEM CONFIGURATION & FEATURE FLAGS ──────────────────────────────────────
router.get('/system/settings',               requireAnyPermission('settings.read'),      ctrl.getSystemSettings);
router.put('/system/settings/:key',          requirePermission('settings.update'),       ctrl.updateSystemSetting);
router.get('/system/feature-flags',          requireAnyPermission('settings.read'),      ctrl.getFeatureFlags);
router.put('/system/feature-flags/:key',     requirePermission('settings.configure'),   ctrl.updateFeatureFlag);

// ── SUPER ADMIN ONLY (UNRESTRICTED CONTROL CENTER) ────────────────────────────
// Dedicated protected router requiring Super Admin privileges strictly
router.get('/super-admin/dashboard',         requireSuperAdmin, ctrl.getSuperAdminDashboard);
router.post('/super-admin/maintenance',      requireSuperAdmin, ctrl.toggleMaintenanceMode);

// ── API MANAGEMENT ────────────────────────────────────────────────────────────
router.get('/api-keys',                      requireAnyPermission('api.read'),      ctrl.getApiKeys);
router.post('/api-keys',                     requirePermission('api.create'),       ctrl.createApiKey);
router.delete('/api-keys/:id',               requirePermission('api.delete'),       ctrl.revokeApiKey);

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────
router.get('/email-templates',               requireAnyPermission('notifications.read'),   ctrl.getEmailTemplates);
router.put('/email-templates/:id',           requirePermission('notifications.manage'), ctrl.updateEmailTemplate);

module.exports = router;
