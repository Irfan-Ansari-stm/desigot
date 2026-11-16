'use strict';
require('dotenv').config();
const assert = require('assert');
const { query } = require('../src/db/pool');
const secSvc = require('../src/modules/security/security.service');

async function runSecurityAuditTests() {
  console.log('========================================================');
  console.log('RUNNING MODULE 15: SECURITY & AUDIT COMPREHENSIVE TESTS');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // 1. DATE RANGE PARSER
  test('parseDateFilter accurately computes timeframes', () => {
    const d30 = secSvc.parseDateFilter({ period: '30d' });
    assert(d30.start instanceof Date, 'start must be Date');
    assert(d30.end instanceof Date, 'end must be Date');
    assert(d30.start < d30.end, 'start must be before end');

    const d7 = secSvc.parseDateFilter({ period: '7d' });
    assert(d7.start < d7.end, '7d start must be before end');

    const dCustom = secSvc.parseDateFilter({ startDate: '2026-01-01', endDate: '2026-02-01' });
    assert.strictEqual(dCustom.start.toISOString().slice(0, 10), '2026-01-01');
    assert.strictEqual(dCustom.end.toISOString().slice(0, 10), '2026-02-01');
  });

  // 2. SECURITY OVERVIEW KPIS & TRENDS
  await asyncTest('getSecurityOverview returns 12 KPI cards, health status, and trend charts', async () => {
    const data = await secSvc.getSecurityOverview({ period: '30d' });
    assert(data.kpis, 'kpis object must exist');
    assert(typeof data.kpis.activeSessions.value === 'number', 'activeSessions.value must be a number');
    assert(typeof data.kpis.totalLoginAttempts.value === 'number', 'totalLoginAttempts.value must be a number');
    assert(typeof data.kpis.successfulLogins.value === 'number', 'successfulLogins.value must be a number');
    assert(typeof data.kpis.failedLoginAttempts.value === 'number', 'failedLoginAttempts.value must be a number');
    assert(typeof data.kpis.suspiciousActivities.value === 'number', 'suspiciousActivities.value must be a number');
    assert(typeof data.kpis.securityEvents.value === 'number', 'securityEvents.value must be a number');
    assert(typeof data.kpis.lockedAccounts.value === 'number', 'lockedAccounts.value must be a number');
    assert(typeof data.kpis.blockedIpAddresses.value === 'number', 'blockedIpAddresses.value must be a number');
    assert(typeof data.kpis.activeAdministrators.value === 'number', 'activeAdministrators.value must be a number');
    assert(typeof data.kpis.criticalSecurityAlerts.value === 'number', 'criticalSecurityAlerts.value must be a number');
    assert(typeof data.kpis.apiRequests.value === 'number', 'apiRequests.value must be a number');
    assert(typeof data.kpis.administrativeActions.value === 'number', 'administrativeActions.value must be a number');

    assert(data.health, 'health object must exist');
    assert(data.health.overallStatus, 'overallStatus must exist');
    assert(data.health.authenticationHealth, 'authenticationHealth must exist');
    assert(typeof data.health.twoFactorAdoptionPct === 'number', 'twoFactorAdoptionPct must be numeric');

    assert(data.charts, 'charts object must exist');
    assert(Array.isArray(data.charts.loginActivity), 'loginActivity chart must be array');
    assert(Array.isArray(data.charts.failedLogins), 'failedLogins chart must be array');
    assert(Array.isArray(data.charts.eventsBySeverity), 'eventsBySeverity chart must be array');
    assert(Array.isArray(data.charts.apiTraffic), 'apiTraffic chart must be array');
    assert(Array.isArray(data.charts.adminActivity), 'adminActivity chart must be array');
    assert(Array.isArray(data.charts.lockoutTrends), 'lockoutTrends chart must be array');
  });

  // 3. LOGIN HISTORY
  let sampleLoginId = null;
  await asyncTest('getLoginHistory returns paginated login events with device, OS, IP metadata', async () => {
    const res = await secSvc.getLoginHistory({ page: 1, limit: 10 });
    assert(Array.isArray(res.history), 'history must be array');
    assert(res.history.length > 0, 'history should not be empty');
    assert(res.pagination.total >= res.history.length, 'pagination total should be accurate');

    const entry = res.history.find(h => h.browser || h.operating_system || h.device_type) || res.history[0];
    sampleLoginId = entry.id;
    assert(entry.ip_address, 'ip_address must exist');
    assert(entry.status, 'status must exist');
    assert(entry.browser || entry.operating_system || entry.device_type, 'device/browser metadata must exist');
  });

  await asyncTest('getLoginHistoryById returns a single detailed entry', async () => {
    assert(sampleLoginId, 'sampleLoginId should be defined');
    const entry = await secSvc.getLoginHistoryById(sampleLoginId);
    assert(entry, 'entry must be found');
    assert.strictEqual(entry.id, sampleLoginId, 'ID must match');
  });

  // 4. ACTIVE SESSIONS & SERVER-SIDE REVOCATION
  let testSessionId = null;
  await asyncTest('getActiveSessions returns active/revoked sessions with user metadata', async () => {
    const res = await secSvc.getActiveSessions({ page: 1, limit: 10 });
    assert(Array.isArray(res.sessions), 'sessions must be array');
    assert(res.sessions.length > 0, 'sessions should exist');

    const activeOne = res.sessions.find(s => !s.is_revoked) || res.sessions[0];
    testSessionId = activeOne.id;
  });

  await asyncTest('revokeSession marks session as revoked server-side', async () => {
    assert(testSessionId, 'testSessionId should be defined');
    const adminUser = { id: null, display_name: 'Test Super Admin', email: 'owner@desigot.com' };
    const revoked = await secSvc.revokeSession(testSessionId, adminUser);
    assert(revoked, 'revoked session should return object');
    assert.strictEqual(revoked.is_revoked, true, 'is_revoked must be true');
  });

  // 5. FAILED LOGIN ATTEMPTS
  await asyncTest('getFailedAttempts retrieves categorised failed logins with risk level', async () => {
    const res = await secSvc.getFailedAttempts({ page: 1, limit: 10 });
    assert(Array.isArray(res.attempts), 'attempts must be array');
    assert(res.attempts.length > 0, 'attempts should be seeded');

    const sample = res.attempts[0];
    assert(sample.account_identifier || sample.attempted_identifier, 'identifier must exist');
    assert(sample.failure_category || sample.failure_reason, 'failure category/reason must exist');
    assert(['low', 'medium', 'high', 'critical'].includes(sample.risk_level), 'risk level must be valid');
  });

  // 6. SECURITY EVENTS & TRIAGE
  let sampleEventId = null;
  await asyncTest('getSecurityEvents retrieves security events across severities', async () => {
    const res = await secSvc.getSecurityEvents({ page: 1, limit: 10 });
    assert(Array.isArray(res.events), 'events must be array');
    assert(res.events.length > 0, 'security events should exist');

    sampleEventId = res.events[0].id;
    assert(['informational', 'low', 'medium', 'high', 'critical'].includes(res.events[0].severity), 'severity must be valid');
  });

  await asyncTest('updateSecurityEventStatus updates triage status and resolution details', async () => {
    assert(sampleEventId, 'sampleEventId should be defined');
    const adminUser = { id: null, display_name: 'Test Sec Analyst', email: 'sec@desigot.com' };
    const updated = await secSvc.updateSecurityEventStatus(
      sampleEventId,
      { status: 'resolved', notes: 'Automated test verified benign' },
      adminUser
    );
    assert(updated, 'updated event should exist');
    assert.strictEqual(updated.investigation_status, 'resolved', 'status should be updated');
    assert(updated.resolved_at, 'resolved_at should be populated');
  });

  // 7. AUDIT LOGS & INTEGRITY HASHING
  await asyncTest('getAuditLogs retrieves audit entries with valid SHA-256 integrity hash', async () => {
    const res = await secSvc.getAuditLogs({ page: 1, limit: 10 });
    assert(Array.isArray(res.logs), 'logs must be array');
    assert(res.logs.length > 0, 'audit logs must exist');

    const sample = res.logs.find(l => l.integrity_hash) || res.logs[0];
    assert(sample.integrity_hash, 'integrity_hash must exist');
    assert.strictEqual(sample.integrity_hash.length, 64, 'SHA-256 hash must be 64 hex characters');
  });

  // 8. ADMINISTRATIVE ACTIONS
  await asyncTest('getAdministrativeActions returns actions performed by admins with diff payloads', async () => {
    const res = await secSvc.getAdministrativeActions({ page: 1, limit: 10 });
    assert(Array.isArray(res.actions), 'actions must be array');
    assert(res.actions.length > 0, 'admin actions must exist');

    const sample = res.actions[0];
    assert(sample.action_type, 'action_type must exist');
    assert(sample.target_resource, 'target_resource must exist');
  });

  // 9. API ACCESS LOGS TELEMETRY
  await asyncTest('getApiLogs retrieves API access logs with latency and status code breakdown', async () => {
    const res = await secSvc.getApiLogs({ page: 1, limit: 10 });
    assert(Array.isArray(res.logs), 'logs must be array');
    assert(res.logs.length > 0, 'api logs must exist');

    const sample = res.logs[0];
    assert(sample.endpoint, 'endpoint must exist');
    assert(sample.method, 'method must exist');
    assert(typeof (sample.status_code ?? sample.response_status) === 'number', 'status_code must be numeric');
    assert(typeof (sample.duration_ms ?? sample.response_time_ms) === 'number', 'duration_ms must be numeric');
  });

  // 10. IP RESTRICTIONS & RULES CRUD
  let createdRuleId = null;
  await asyncTest('createIpRule creates new IP policy (CIDR, allow/deny, scope)', async () => {
    const adminUser = { id: null, display_name: 'Test Super Admin', email: 'owner@desigot.com' };
    const rule = await secSvc.createIpRule(
      {
        ipAddress: '198.51.100.44',
        cidrRange: '198.51.100.44/32',
        type: 'deny',
        scope: 'api_access',
        reason: 'Automated test malicious IP block'
      },
      adminUser
    );
    assert(rule, 'rule should be created');
    assert.strictEqual(rule.ip_pattern || rule.ip_address, '198.51.100.44');
    assert.strictEqual(rule.restriction_type || rule.type, 'deny');
    createdRuleId = rule.id;
  });

  await asyncTest('getIpRules finds the newly created rule', async () => {
    assert(createdRuleId, 'createdRuleId must be set');
    const res = await secSvc.getIpRules({ type: 'deny', search: '198.51.100.44' });
    assert(res.rules.some(r => r.id === createdRuleId), 'created rule must be in list');
  });

  await asyncTest('updateIpRule modifies rule reason and status', async () => {
    assert(createdRuleId, 'createdRuleId must be set');
    const adminUser = { id: null, display_name: 'Test Admin' };
    const updated = await secSvc.updateIpRule(
      createdRuleId,
      { reason: 'Updated reason by test suite', isActive: false },
      adminUser
    );
    assert(updated, 'updated rule must be returned');
    assert.strictEqual(updated.reason, 'Updated reason by test suite');
    assert.strictEqual(updated.is_active, false);
  });

  await asyncTest('deleteIpRule deletes the created IP rule', async () => {
    assert(createdRuleId, 'createdRuleId must be set');
    const adminUser = { id: null, display_name: 'Test Admin' };
    const deleted = await secSvc.deleteIpRule(createdRuleId, adminUser);
    assert(deleted, 'deleted rule must be returned');
    assert.strictEqual(deleted.id, createdRuleId);
  });

  // 11. AUTHENTICATION & PASSWORD POLICIES
  await asyncTest('getAuthSettings returns enterprise security configurations', async () => {
    const settings = await secSvc.getAuthSettings();
    assert(settings, 'settings must exist');
    assert(typeof settings.session_timeout_minutes === 'number', 'session_timeout_minutes must be number');
    assert(typeof settings.login_max_attempts === 'number' || typeof settings.max_failed_logins === 'number', 'max attempts must be number');
    assert(typeof settings.password_min_length === 'number', 'password_min_length must be number');
    assert(typeof settings.lockout_duration_minutes === 'number', 'lockout_duration_minutes must be number');
  });

  await asyncTest('updateAuthSettings updates policy values safely', async () => {
    const adminUser = { id: null, display_name: 'Super Admin' };
    const updated = await secSvc.updateAuthSettings(
      {
        session_timeout_minutes: 60,
        login_max_attempts: 5,
        password_min_length: 12,
        require_mfa_for_admins: true
      },
      adminUser
    );
    assert(updated, 'updated settings must be returned');
    assert.strictEqual(updated.session_timeout_minutes, 60);
    assert.strictEqual(updated.login_max_attempts, 5);
    assert.strictEqual(updated.password_min_length, 12);
  });

  // 12. TWO-FACTOR AUTHENTICATION (MFA)
  await asyncTest('getMfaAdmins calculates MFA adoption metrics among administrators', async () => {
    const mfaData = await secSvc.getMfaAdmins();
    assert(mfaData, 'mfaData must exist');
    assert(typeof mfaData.totalAdmins === 'number', 'totalAdmins must be number');
    assert(typeof mfaData.mfaEnabledCount === 'number', 'mfaEnabledCount must be number');
    assert(typeof mfaData.mfaAdoptionRate === 'number', 'mfaAdoptionRate must be number');
    assert(Array.isArray(mfaData.admins), 'admins list must be array');
  });

  // 13. ACCOUNT LOCKOUTS
  let sampleLockoutId = null;
  await asyncTest('getAccountLockouts retrieves locked accounts', async () => {
    const res = await secSvc.getAccountLockouts({ status: 'all' });
    assert(Array.isArray(res.lockouts), 'lockouts must be array');
    assert(res.lockouts.length > 0, 'seed lockouts should exist');
    sampleLockoutId = res.lockouts[0].id;
  });

  await asyncTest('releaseLockout unlocks account and restores access', async () => {
    assert(sampleLockoutId, 'sampleLockoutId should be defined');
    const adminUser = { id: null, display_name: 'Test Super Admin' };
    const released = await secSvc.releaseLockout(sampleLockoutId, adminUser);
    assert(released, 'released record should exist');
    assert.strictEqual(released.is_unlocked, true, 'is_unlocked should now be true');
    assert(released.unlocked_at, 'unlocked_at should be populated');
  });

  // 14. SECURITY ALERTS
  let sampleAlertId = null;
  await asyncTest('getSecurityAlerts retrieves active and acknowledged alerts', async () => {
    const res = await secSvc.getSecurityAlerts({ status: 'all' });
    assert(Array.isArray(res.alerts), 'alerts must be array');
    assert(res.alerts.length > 0, 'alerts should exist');
    sampleAlertId = res.alerts[0].id;
  });

  await asyncTest('updateSecurityAlert updates alert status to acknowledged or resolved', async () => {
    assert(sampleAlertId, 'sampleAlertId must exist');
    const adminUser = { id: null, display_name: 'Test Sec Admin' };
    const updated = await secSvc.updateSecurityAlert(
      sampleAlertId,
      { status: 'acknowledged', internalNotes: 'Acknowledged in automated test' },
      adminUser
    );
    assert(updated, 'updated alert must exist');
    assert.strictEqual(updated.status, 'acknowledged');
  });

  // 15. SECURITY INVESTIGATIONS
  let createdInvId = null;
  await asyncTest('createInvestigation launches new security incident investigation', async () => {
    const adminUser = { id: null, display_name: 'Test Sec Analyst' };
    const inv = await secSvc.createInvestigation(
      {
        title: 'Suspicious Credential Stuffing Campaign',
        description: 'Multiple failed logins detected from cluster of residential IPs',
        severity: 'high'
      },
      adminUser
    );
    assert(inv, 'investigation should be created');
    assert.strictEqual(inv.title, 'Suspicious Credential Stuffing Campaign');
    assert.strictEqual(inv.status, 'assigned');
    createdInvId = inv.id;
  });

  await asyncTest('getInvestigationById fetches investigation with linked incident events', async () => {
    assert(createdInvId, 'createdInvId must exist');
    const inv = await secSvc.getInvestigationById(createdInvId);
    assert(inv, 'inv must exist');
    assert.strictEqual(inv.id, createdInvId);
    assert(Array.isArray(inv.events), 'linked events must be array');
  });

  await asyncTest('updateInvestigation records findings and sets status to resolved', async () => {
    assert(createdInvId, 'createdInvId must exist');
    const adminUser = { id: null, display_name: 'Test Sec Analyst' };
    const updated = await secSvc.updateInvestigation(
      createdInvId,
      {
        status: 'resolved',
        findings: 'Identified automated script hitting login endpoint. Added IP block.',
        resolutionNotes: 'Mitigated successfully.'
      },
      adminUser
    );
    assert(updated, 'updated inv must exist');
    assert.strictEqual(updated.status, 'resolved');
    assert(updated.resolved_at, 'resolved_at should be set');
  });

  // 16. SENSITIVE DATA ACCESS LOGS
  await asyncTest('getDataAccessLogs tracks customer & financial data inspection', async () => {
    const res = await secSvc.getDataAccessLogs({ limit: 10 });
    assert(Array.isArray(res.logs), 'logs must be array');
    assert(res.logs.length > 0, 'data access logs should exist');
    const sample = res.logs[0];
    assert(sample.resource_type, 'resource_type must exist');
    assert(sample.access_type, 'access_type must exist');
  });

  // 17. DEVICE MANAGEMENT & REVOCATION
  let sampleDeviceId = null;
  await asyncTest('getDevices retrieves trusted client devices', async () => {
    const res = await secSvc.getDevices();
    assert(Array.isArray(res.devices), 'devices must be array');
    assert(res.devices.length > 0, 'devices must exist');
    sampleDeviceId = res.devices[0].id;
  });

  await asyncTest('revokeDeviceTrust marks device as untrusted', async () => {
    assert(sampleDeviceId, 'sampleDeviceId must exist');
    const revoked = await secSvc.revokeDeviceTrust(sampleDeviceId);
    assert(revoked, 'revoked device returned');
    assert.strictEqual(revoked.is_trusted, false, 'is_trusted must be false');
  });

  // 18. COMPLIANCE AUDIT EXPORT
  await asyncTest('createComplianceExport generates export record', async () => {
    const adminUser = { id: null, display_name: 'Compliance Officer' };
    const exp = await secSvc.createComplianceExport(
      { reportType: 'soc2_audit_trail', format: 'csv' },
      adminUser
    );
    assert(exp, 'export record must exist');
    assert.strictEqual(exp.report_type, 'soc2_audit_trail');
    assert.strictEqual(exp.status, 'completed');
  });

  await asyncTest('getComplianceReports retrieves history of compliance exports', async () => {
    const res = await secSvc.getComplianceReports();
    assert(Array.isArray(res.reports), 'reports must be array');
    assert(res.reports.length > 0, 'compliance reports should exist');
  });

  console.log('\n========================================================');
  console.log(`ALL MODULE 15 SECURITY TESTS PASSED: ${passed}/${total}`);
  console.log('========================================================\n');
}

runSecurityAuditTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('TEST SUITE CRASHED:', err);
    process.exit(1);
  });
