'use strict';

const router = require('express').Router();
const svc = require('./security.service');
const { authenticate } = require('../../middleware/auth');
const { requireAnyPermission } = require('../../middleware/authorize');
const { successResponse, paginatedResponse } = require('../../shared/utils');

// Require authentication for all security routes
router.use(authenticate);

// =============================================================================
// 1. OVERVIEW & METRICS
// =============================================================================
router.get(
  '/overview',
  requireAnyPermission('security.read', 'security.manage', 'audit.read', 'audit.view', 'admin.read'),
  async (req, res) => {
    const data = await svc.getSecurityOverview(req.query);
    successResponse(res, data, 200, { message: 'Security overview metrics retrieved successfully.' });
  }
);

// Alias for metrics
router.get(
  '/metrics',
  requireAnyPermission('security.read', 'security.manage', 'audit.read'),
  async (req, res) => {
    const data = await svc.getSecurityOverview(req.query);
    successResponse(res, data, 200, { message: 'Security metrics retrieved.' });
  }
);

// =============================================================================
// 2. LOGIN HISTORY
// =============================================================================
router.get(
  '/login-history',
  requireAnyPermission('security.read', 'security.login_history', 'audit.read'),
  async (req, res) => {
    const data = await svc.getLoginHistory(req.query);
    paginatedResponse(res, data.history, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

router.get(
  '/login-history/:id',
  requireAnyPermission('security.read', 'security.login_history', 'audit.read'),
  async (req, res) => {
    const item = await svc.getLoginHistoryById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Login history entry not found' });
    }
    successResponse(res, item);
  }
);

// =============================================================================
// 3. ACTIVE SESSIONS & REVOCATION
// =============================================================================
router.get(
  '/sessions',
  requireAnyPermission('security.read', 'security.sessions_read', 'security.manage'),
  async (req, res) => {
    const data = await svc.getActiveSessions(req.query);
    paginatedResponse(res, data.sessions, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

router.delete(
  '/sessions/:id',
  requireAnyPermission('security.manage', 'security.sessions_revoke'),
  async (req, res) => {
    const revoked = await svc.revokeSession(req.params.id, req.user);
    if (!revoked) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    successResponse(res, revoked, 200, { message: 'Session revoked successfully.' });
  }
);

router.post(
  '/sessions/revoke-user',
  requireAnyPermission('security.manage', 'security.sessions_revoke'),
  async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const result = await svc.revokeAllUserSessions(userId, req.user);
    successResponse(res, result, 200, { message: 'All active sessions for user revoked.' });
  }
);

// =============================================================================
// 4. FAILED LOGIN ATTEMPTS
// =============================================================================
router.get(
  '/failed-attempts',
  requireAnyPermission('security.read', 'security.events_read', 'audit.read'),
  async (req, res) => {
    const data = await svc.getFailedAttempts(req.query);
    paginatedResponse(res, data.attempts, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

// =============================================================================
// 5. SECURITY EVENTS & TRIAGE
// =============================================================================
router.get(
  '/events',
  requireAnyPermission('security.read', 'security.events_read', 'audit.read'),
  async (req, res) => {
    const data = await svc.getSecurityEvents(req.query);
    paginatedResponse(res, data.events, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

router.patch(
  '/events/:id/status',
  requireAnyPermission('security.manage', 'security.events_read'),
  async (req, res) => {
    const updated = await svc.updateSecurityEventStatus(req.params.id, req.body, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Security event not found' });
    }
    successResponse(res, updated, 200, { message: 'Security event status updated successfully.' });
  }
);

// =============================================================================
// 6. AUDIT LOGS & INTEGRITY VERIFICATION
// =============================================================================
router.get(
  '/audit-logs',
  requireAnyPermission('audit.read', 'audit.view', 'security.read'),
  async (req, res) => {
    const data = await svc.getAuditLogs(req.query);
    paginatedResponse(res, data.logs, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

router.get(
  '/audit-logs/:id',
  requireAnyPermission('audit.read', 'audit.view', 'security.read'),
  async (req, res) => {
    const log = await svc.getAuditLogById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }
    successResponse(res, log);
  }
);

// =============================================================================
// 7. ADMINISTRATIVE ACTIONS
// =============================================================================
router.get(
  '/admin-actions',
  requireAnyPermission('audit.admin_activity', 'audit.read', 'security.read'),
  async (req, res) => {
    const data = await svc.getAdministrativeActions(req.query);
    paginatedResponse(res, data.actions, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

// =============================================================================
// 8. API ACCESS TELEMETRY
// =============================================================================
router.get(
  '/api-logs',
  requireAnyPermission('security.read', 'audit.read', 'security.manage'),
  async (req, res) => {
    const data = await svc.getApiLogs(req.query);
    paginatedResponse(res, data.logs, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

// =============================================================================
// 9. IP RESTRICTIONS & RULES
// =============================================================================
router.get(
  '/ip-rules',
  requireAnyPermission('security.read', 'security.ip_restrictions', 'security.manage'),
  async (req, res) => {
    const data = await svc.getIpRules(req.query);
    paginatedResponse(res, data.rules, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

router.post(
  '/ip-rules',
  requireAnyPermission('security.manage', 'security.ip_restrictions'),
  async (req, res) => {
    const rule = await svc.createIpRule(req.body, req.user);
    successResponse(res, rule, 201, { message: 'IP rule created successfully.' });
  }
);

router.patch(
  '/ip-rules/:id',
  requireAnyPermission('security.manage', 'security.ip_restrictions'),
  async (req, res) => {
    const rule = await svc.updateIpRule(req.params.id, req.body, req.user);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'IP rule not found' });
    }
    successResponse(res, rule, 200, { message: 'IP rule updated successfully.' });
  }
);

router.put(
  '/ip-rules/:id',
  requireAnyPermission('security.manage', 'security.ip_restrictions'),
  async (req, res) => {
    const rule = await svc.updateIpRule(req.params.id, req.body, req.user);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'IP rule not found' });
    }
    successResponse(res, rule, 200, { message: 'IP rule updated successfully.' });
  }
);

router.delete(
  '/ip-rules/:id',
  requireAnyPermission('security.manage', 'security.ip_restrictions'),
  async (req, res) => {
    const deleted = await svc.deleteIpRule(req.params.id, req.user);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'IP rule not found' });
    }
    successResponse(res, deleted, 200, { message: 'IP rule removed successfully.' });
  }
);

// Blocked IPs convenience endpoints (maps to type: 'deny')
router.get(
  '/blocked-ips',
  requireAnyPermission('security.read', 'security.ip_restrictions', 'security.manage'),
  async (req, res) => {
    const query = { ...req.query, type: 'deny' };
    const data = await svc.getIpRules(query);
    paginatedResponse(res, data.rules, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

router.post(
  '/blocked-ips',
  requireAnyPermission('security.manage', 'security.ip_restrictions'),
  async (req, res) => {
    const rule = await svc.createIpRule({ ...req.body, type: 'deny' }, req.user);
    successResponse(res, rule, 201, { message: 'IP address blocked successfully.' });
  }
);

router.delete(
  '/blocked-ips/:id',
  requireAnyPermission('security.manage', 'security.ip_restrictions'),
  async (req, res) => {
    const deleted = await svc.deleteIpRule(req.params.id, req.user);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Blocked IP rule not found' });
    }
    successResponse(res, deleted, 200, { message: 'IP unblocked successfully.' });
  }
);

// =============================================================================
// 10. AUTHENTICATION & PASSWORD POLICIES
// =============================================================================
router.get(
  '/auth-settings',
  requireAnyPermission('security.read', 'security.configure', 'security.manage'),
  async (req, res) => {
    const settings = await svc.getAuthSettings();
    successResponse(res, settings);
  }
);

router.patch(
  '/auth-settings',
  requireAnyPermission('security.configure', 'security.manage'),
  async (req, res) => {
    const settings = await svc.updateAuthSettings(req.body, req.user);
    successResponse(res, settings, 200, { message: 'Authentication settings updated successfully.' });
  }
);

router.put(
  '/auth-settings',
  requireAnyPermission('security.configure', 'security.manage'),
  async (req, res) => {
    const settings = await svc.updateAuthSettings(req.body, req.user);
    successResponse(res, settings, 200, { message: 'Authentication settings updated successfully.' });
  }
);

router.get(
  '/password-policies',
  requireAnyPermission('security.read', 'security.password_policy', 'security.configure'),
  async (req, res) => {
    const settings = await svc.getAuthSettings();
    successResponse(res, settings);
  }
);

router.patch(
  '/password-policies',
  requireAnyPermission('security.password_policy', 'security.configure', 'security.manage'),
  async (req, res) => {
    const settings = await svc.updateAuthSettings(req.body, req.user);
    successResponse(res, settings, 200, { message: 'Password policies updated successfully.' });
  }
);

// =============================================================================
// 11. TWO-FACTOR AUTHENTICATION (MFA)
// =============================================================================
router.get(
  '/mfa',
  requireAnyPermission('security.read', 'security.mfa_configure', 'security.manage'),
  async (req, res) => {
    const mfaData = await svc.getMfaAdmins();
    successResponse(res, mfaData);
  }
);

router.get(
  '/mfa/admins',
  requireAnyPermission('security.read', 'security.mfa_configure', 'security.manage'),
  async (req, res) => {
    const mfaData = await svc.getMfaAdmins();
    successResponse(res, mfaData);
  }
);

// =============================================================================
// 12. ACCOUNT LOCKOUTS
// =============================================================================
router.get(
  '/lockouts',
  requireAnyPermission('security.read', 'security.lockouts', 'security.manage'),
  async (req, res) => {
    const data = await svc.getAccountLockouts(req.query);
    paginatedResponse(res, data.lockouts, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

router.post(
  '/lockouts/:id/release',
  requireAnyPermission('security.manage', 'security.lockouts'),
  async (req, res) => {
    const released = await svc.releaseLockout(req.params.id, req.user);
    if (!released) {
      return res.status(404).json({ success: false, message: 'Lockout record not found' });
    }
    successResponse(res, released, 200, { message: 'Account lockout released successfully.' });
  }
);

router.post(
  '/lockouts/:id/unlock',
  requireAnyPermission('security.manage', 'security.lockouts'),
  async (req, res) => {
    const released = await svc.releaseLockout(req.params.id, req.user);
    if (!released) {
      return res.status(404).json({ success: false, message: 'Lockout record not found' });
    }
    successResponse(res, released, 200, { message: 'Account unlocked successfully.' });
  }
);

// =============================================================================
// 13. SECURITY ALERTS
// =============================================================================
router.get(
  '/alerts',
  requireAnyPermission('security.read', 'security.events_read', 'audit.read'),
  async (req, res) => {
    const data = await svc.getSecurityAlerts(req.query);
    successResponse(res, data);
  }
);

router.patch(
  '/alerts/:id',
  requireAnyPermission('security.manage', 'security.events_read'),
  async (req, res) => {
    const alert = await svc.updateSecurityAlert(req.params.id, req.body, req.user);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Security alert not found' });
    }
    successResponse(res, alert, 200, { message: 'Security alert updated successfully.' });
  }
);

// =============================================================================
// 14. SECURITY INVESTIGATIONS
// =============================================================================
router.get(
  '/investigations',
  requireAnyPermission('security.read', 'security.manage', 'audit.read'),
  async (req, res) => {
    const data = await svc.getInvestigations(req.query);
    successResponse(res, data);
  }
);

router.post(
  '/investigations',
  requireAnyPermission('security.manage', 'security.read'),
  async (req, res) => {
    const created = await svc.createInvestigation(req.body, req.user);
    successResponse(res, created, 201, { message: 'Investigation created successfully.' });
  }
);

router.get(
  '/investigations/:id',
  requireAnyPermission('security.read', 'security.manage', 'audit.read'),
  async (req, res) => {
    const inv = await svc.getInvestigationById(req.params.id);
    if (!inv) {
      return res.status(404).json({ success: false, message: 'Investigation not found' });
    }
    successResponse(res, inv);
  }
);

router.patch(
  '/investigations/:id',
  requireAnyPermission('security.manage', 'security.read'),
  async (req, res) => {
    const updated = await svc.updateInvestigation(req.params.id, req.body, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Investigation not found' });
    }
    successResponse(res, updated, 200, { message: 'Investigation updated successfully.' });
  }
);

// =============================================================================
// 15. DATA ACCESS LOGS
// =============================================================================
router.get(
  '/data-access-logs',
  requireAnyPermission('audit.read', 'audit.compliance', 'security.read'),
  async (req, res) => {
    const data = await svc.getDataAccessLogs(req.query);
    paginatedResponse(res, data.logs, data.pagination.total, data.pagination.page, data.pagination.limit);
  }
);

// =============================================================================
// 16. DEVICE MANAGEMENT
// =============================================================================
router.get(
  '/devices',
  requireAnyPermission('security.read', 'security.manage'),
  async (req, res) => {
    const data = await svc.getDevices(req.query);
    successResponse(res, data);
  }
);

router.post(
  '/devices/:id/revoke-trust',
  requireAnyPermission('security.manage'),
  async (req, res) => {
    const revoked = await svc.revokeDeviceTrust(req.params.id, req.user);
    if (!revoked) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    successResponse(res, revoked, 200, { message: 'Device trust revoked successfully.' });
  }
);

// =============================================================================
// 17. COMPLIANCE REPORTS & EXPORTS
// =============================================================================
router.get(
  '/compliance/reports',
  requireAnyPermission('audit.compliance', 'audit.export', 'security.read'),
  async (req, res) => {
    const data = await svc.getComplianceReports();
    successResponse(res, data);
  }
);

router.post(
  '/compliance/exports',
  requireAnyPermission('audit.export', 'audit.compliance', 'security.manage'),
  async (req, res) => {
    const exportRecord = await svc.createComplianceExport(req.body, req.user);
    successResponse(res, exportRecord, 201, { message: 'Compliance export initiated successfully.' });
  }
);

module.exports = router;
