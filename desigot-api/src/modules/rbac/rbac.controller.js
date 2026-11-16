'use strict';
const rbacService = require('./rbac.service');
const { successResponse } = require('../../shared/utils');

// ── Roles Controller ─────────────────────────────────────────────────────────
const getRoles = async (req, res) => {
  const result = await rbacService.getRoles(req.query);
  return successResponse(res, result.roles, 200, result.pagination);
};

const getRoleById = async (req, res) => {
  const role = await rbacService.getRoleById(req.params.id);
  return successResponse(res, role);
};

const createRole = async (req, res) => {
  const role = await rbacService.createRole(req.body, req.user.id);
  return successResponse(res, role, 201);
};

const updateRole = async (req, res) => {
  const role = await rbacService.updateRole(req.params.id, req.body, req.user.id);
  return successResponse(res, role);
};

const deleteRole = async (req, res) => {
  const result = await rbacService.deleteRole(req.params.id, req.user.id);
  return successResponse(res, result);
};

const duplicateRole = async (req, res) => {
  const role = await rbacService.duplicateRole(req.params.id, req.body.name, req.user.id);
  return successResponse(res, role, 201);
};

// ── Permissions Controller ───────────────────────────────────────────────────
const getPermissions = async (req, res) => {
  const permissions = await rbacService.getPermissions(req.query);
  return successResponse(res, permissions);
};

const createPermission = async (req, res) => {
  const permission = await rbacService.createPermission(req.body, req.user.id);
  return successResponse(res, permission, 201);
};

const updatePermission = async (req, res) => {
  const permission = await rbacService.updatePermission(req.params.id, req.body, req.user.id);
  return successResponse(res, permission);
};

const deletePermission = async (req, res) => {
  const result = await rbacService.deletePermission(req.params.id, req.user.id);
  return successResponse(res, result);
};

// ── Access Control & Matrix Controller ────────────────────────────────────────
const getPermissionMatrix = async (req, res) => {
  const matrix = await rbacService.getPermissionMatrix();
  return successResponse(res, matrix);
};

const updatePermissionMatrix = async (req, res) => {
  const result = await rbacService.updatePermissionMatrix(req.body.updates, req.user.id);
  return successResponse(res, result);
};

const checkAccess = async (req, res) => {
  const { resource, action, permission } = req.body;
  const permSlug = permission || `${resource}.${action?.toLowerCase()}`;
  const effective = await rbacService.getUserEffectivePermissions(req.user.id);
  const allowed = effective.isSuperAdmin || effective.permissions.includes('*') || effective.permissions.includes(permSlug);
  return successResponse(res, { allowed, permission: permSlug, isSuperAdmin: effective.isSuperAdmin });
};

const getMyPermissions = async (req, res) => {
  const effective = await rbacService.getUserEffectivePermissions(req.user.id);
  return successResponse(res, effective);
};

const getAccessPolicies = async (req, res) => {
  const policies = await rbacService.getAccessPolicies();
  return successResponse(res, policies);
};

const createAccessPolicy = async (req, res) => {
  const policy = await rbacService.createAccessPolicy(req.body, req.user.id);
  return successResponse(res, policy, 201);
};

const deleteAccessPolicy = async (req, res) => {
  const result = await rbacService.deleteAccessPolicy(req.params.id, req.user.id);
  return successResponse(res, result);
};

// ── Users Controller ──────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  const result = await rbacService.getUsers(req.query);
  return successResponse(res, result.users, 200, result.pagination);
};

const getUserById = async (req, res) => {
  const user = await rbacService.getUserById(req.params.id);
  return successResponse(res, user);
};

const createUser = async (req, res) => {
  const user = await rbacService.createUser(req.body, req.user);
  return successResponse(res, user, 201);
};

const updateUser = async (req, res) => {
  const user = await rbacService.updateUser(req.params.id, req.body, req.user);
  return successResponse(res, user);
};

const deleteUser = async (req, res) => {
  const result = await rbacService.deleteUser(req.params.id, req.user);
  return successResponse(res, result);
};

const bulkDeleteUsers = async (req, res) => {
  const result = await rbacService.bulkDeleteUsers(req.body.userIds, req.user);
  return successResponse(res, result);
};

const setUserStatus = async (req, res) => {
  const result = await rbacService.setUserStatus(req.params.id, req.body.status, req.body.reason, req.user);
  return successResponse(res, result);
};

const resetUserPassword = async (req, res) => {
  const result = await rbacService.resetUserPassword(req.params.id, req.body.new_password, req.user);
  return successResponse(res, result);
};

const forceLogoutUser = async (req, res) => {
  const result = await rbacService.forceLogoutUser(req.params.id, req.user);
  return successResponse(res, result);
};

// ── Organization Controller ───────────────────────────────────────────────────
const getDepartments = async (req, res) => {
  const departments = await rbacService.getDepartments();
  return successResponse(res, departments);
};

const createDepartment = async (req, res) => {
  const dept = await rbacService.createDepartment(req.body, req.user.id);
  return successResponse(res, dept, 201);
};

const updateDepartment = async (req, res) => {
  const dept = await rbacService.updateDepartment(req.params.id, req.body, req.user.id);
  return successResponse(res, dept);
};

const deleteDepartment = async (req, res) => {
  const result = await rbacService.deleteDepartment(req.params.id, req.user.id);
  return successResponse(res, result);
};

const getTeams = async (req, res) => {
  const teams = await rbacService.getTeams(req.query.departmentId);
  return successResponse(res, teams);
};

const createTeam = async (req, res) => {
  const team = await rbacService.createTeam(req.body, req.user.id);
  return successResponse(res, team, 201);
};

const getDesignations = async (req, res) => {
  const designations = await rbacService.getDesignations();
  return successResponse(res, designations);
};

const createDesignation = async (req, res) => {
  const designation = await rbacService.createDesignation(req.body, req.user.id);
  return successResponse(res, designation, 201);
};

// ── Security Controller ───────────────────────────────────────────────────────
const getLoginHistory = async (req, res) => {
  const result = await rbacService.getLoginHistory(req.query);
  return successResponse(res, result.logs, 200, result.pagination);
};

const getActiveSessions = async (req, res) => {
  const result = await rbacService.getActiveSessions(req.query);
  return successResponse(res, result.sessions, 200, result.pagination);
};

const revokeSession = async (req, res) => {
  const result = await rbacService.revokeSession(req.params.id, req.user.id);
  return successResponse(res, result);
};

const getSecurityEvents = async (req, res) => {
  const events = await rbacService.getSecurityEvents();
  return successResponse(res, events);
};

const getIpRestrictions = async (req, res) => {
  const restrictions = await rbacService.getIpRestrictions();
  return successResponse(res, restrictions);
};

const createIpRestriction = async (req, res) => {
  const restriction = await rbacService.createIpRestriction(req.body, req.user.id);
  return successResponse(res, restriction, 201);
};

const deleteIpRestriction = async (req, res) => {
  const result = await rbacService.deleteIpRestriction(req.params.id, req.user.id);
  return successResponse(res, result);
};

// ── Audit Logs Controller ─────────────────────────────────────────────────────
const getAuditLogs = async (req, res) => {
  const result = await rbacService.getAuditLogs(req.query);
  return successResponse(res, result.logs, 200, result.pagination);
};

const getAuditLogById = async (req, res) => {
  const log = await rbacService.getAuditLogById(req.params.id);
  return successResponse(res, log);
};

// ── System Configuration & Features Controller ────────────────────────────────
const getSystemSettings = async (req, res) => {
  const settings = await rbacService.getSystemSettings(req.query.category);
  return successResponse(res, settings);
};

const updateSystemSetting = async (req, res) => {
  const setting = await rbacService.updateSystemSetting(req.params.key, req.body.value, req.user.id);
  return successResponse(res, setting);
};

const getFeatureFlags = async (req, res) => {
  const flags = await rbacService.getFeatureFlags();
  return successResponse(res, flags);
};

const updateFeatureFlag = async (req, res) => {
  const flag = await rbacService.updateFeatureFlag(req.params.key, req.body.is_enabled, req.user.id);
  return successResponse(res, flag);
};

// ── Super Admin Controller ────────────────────────────────────────────────────
const getSuperAdminDashboard = async (req, res) => {
  const dashboard = await rbacService.getSuperAdminDashboard();
  return successResponse(res, dashboard);
};

const toggleMaintenanceMode = async (req, res) => {
  const result = await rbacService.toggleMaintenanceMode(req.body.enabled, req.body.reason, req.user.id);
  return successResponse(res, result);
};

// ── API Management Controller ─────────────────────────────────────────────────
const getApiKeys = async (req, res) => {
  const keys = await rbacService.getApiKeys();
  return successResponse(res, keys);
};

const createApiKey = async (req, res) => {
  const key = await rbacService.createApiKey(req.body, req.user.id);
  return successResponse(res, key, 201);
};

const revokeApiKey = async (req, res) => {
  const result = await rbacService.revokeApiKey(req.params.id, req.user.id);
  return successResponse(res, result);
};

// ── Email Templates Controller ────────────────────────────────────────────────
const getEmailTemplates = async (req, res) => {
  const templates = await rbacService.getEmailTemplates();
  return successResponse(res, templates);
};

const updateEmailTemplate = async (req, res) => {
  const template = await rbacService.updateEmailTemplate(req.params.id, req.body, req.user.id);
  return successResponse(res, template);
};

// ── Module Access Controllers ─────────────────────────────────────────────────
const getModuleAccess = async (req, res) => {
  const data = await rbacService.getModuleAccess();
  return successResponse(res, data);
};

const updateModuleAccess = async (req, res) => {
  const result = await rbacService.updateModuleAccess(req.body.updates || req.body, req.user.id);
  return successResponse(res, result);
};

// ── API Permissions Controllers ───────────────────────────────────────────────
const getApiPermissions = async (req, res) => {
  const data = await rbacService.getApiPermissions(req.query);
  return successResponse(res, data);
};

const createApiPermission = async (req, res) => {
  const data = await rbacService.createApiPermission(req.body, req.user.id);
  return successResponse(res, data, 201);
};

const updateApiPermission = async (req, res) => {
  const data = await rbacService.updateApiPermission(req.params.id, req.body, req.user.id);
  return successResponse(res, data);
};

const deleteApiPermission = async (req, res) => {
  const result = await rbacService.deleteApiPermission(req.params.id, req.user.id);
  return successResponse(res, result);
};

// ── Admin Activity Controllers ────────────────────────────────────────────────
const getAdminActivityLogs = async (req, res) => {
  const data = await rbacService.getAdminActivityLogs(req.query);
  return successResponse(res, data.activity, 200, data.pagination);
};

// ── Security Settings Controllers ─────────────────────────────────────────────
const getSecuritySettings = async (req, res) => {
  const data = await rbacService.getSecuritySettings();
  return successResponse(res, data);
};

const updateSecuritySettings = async (req, res) => {
  const result = await rbacService.updateSecuritySettings(req.body, req.user.id);
  return successResponse(res, result);
};

// ── Role Assignments Controllers ──────────────────────────────────────────────
const getUserRoleAssignments = async (req, res) => {
  const data = await rbacService.getUserRoleAssignments(req.query);
  return successResponse(res, data.assignments, 200, data.pagination);
};

const assignRolesToUser = async (req, res) => {
  const { userId, roleIds, isPrimary, expiresAt } = req.body;
  const result = await rbacService.assignRolesToUser(userId, roleIds, req.user.id, isPrimary, expiresAt);
  return successResponse(res, result);
};

const removeRoleFromUser = async (req, res) => {
  const { userId, roleId } = req.params;
  const result = await rbacService.removeRoleFromUser(userId, roleId, req.user.id);
  return successResponse(res, result);
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  duplicateRole,
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionMatrix,
  updatePermissionMatrix,
  checkAccess,
  getMyPermissions,
  getAccessPolicies,
  createAccessPolicy,
  deleteAccessPolicy,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  setUserStatus,
  resetUserPassword,
  forceLogoutUser,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getTeams,
  createTeam,
  getDesignations,
  createDesignation,
  getLoginHistory,
  getActiveSessions,
  revokeSession,
  getSecurityEvents,
  getIpRestrictions,
  createIpRestriction,
  deleteIpRestriction,
  getAuditLogs,
  getAuditLogById,
  getSystemSettings,
  updateSystemSetting,
  getFeatureFlags,
  updateFeatureFlag,
  getSuperAdminDashboard,
  toggleMaintenanceMode,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getEmailTemplates,
  updateEmailTemplate,
  getModuleAccess,
  updateModuleAccess,
  getApiPermissions,
  createApiPermission,
  updateApiPermission,
  deleteApiPermission,
  getAdminActivityLogs,
  getSecuritySettings,
  updateSecuritySettings,
  getUserRoleAssignments,
  assignRolesToUser,
  removeRoleFromUser,
};
