'use strict';
require('dotenv').config();
const http = require('http');
const createApp = require('../src/app');
const { query } = require('../src/db/pool');

let server;
let baseUrl;

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runEnterpriseTests() {
  console.log('--- STARTING SECTION 13 RBAC & ADMIN MANAGEMENT ENTERPRISE TEST SUITE ---');
  const app = createApp();
  server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`Test server running at ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Actors
    console.log('\n[1] Authentication & Actor Tokens:');
    const saLogin = await request('POST', '/auth/login', {
      email: 'superadmin@desigot.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(saLogin.status === 200, 'Super Admin login succeeds');
    const saToken = saLogin.body.data.accessToken;
    const saUserId = saLogin.body.data.user.id;

    const userLogin = await request('POST', '/auth/login', {
      email: 'user@desigot.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(userLogin.status === 200, 'Standard user login succeeds');
    const userToken = userLogin.body.data.accessToken;

    // 2. Module Access Testing
    console.log('\n[2] Module Access Management:');
    const modAccessRes = await request('GET', '/rbac/modules/access', null, saToken);
    assert(modAccessRes.status === 200, 'Super Admin can fetch Module Access matrix (200)');
    assert(Array.isArray(modAccessRes.body.data.roles) && modAccessRes.body.data.roles.length >= 10, 'Returns at least 10 roles');
    assert(Array.isArray(modAccessRes.body.data.modules) && modAccessRes.body.data.modules.length >= 10, 'Returns at least 10 modules');

    const testRoleId = modAccessRes.body.data.roles.find(r => r.slug === 'custom_admin')?.id || modAccessRes.body.data.roles[0].id;
    const testModId = modAccessRes.body.data.modules[0].id;

    const updateModRes = await request('PUT', '/rbac/modules/access', {
      updates: [{ roleId: testRoleId, moduleId: testModId, accessLevel: 'admin', isAccessible: true }]
    }, saToken);
    assert(updateModRes.status === 200, 'Super Admin updates module access level successfully');

    const unauthModRes = await request('PUT', '/rbac/modules/access', {
      updates: [{ roleId: testRoleId, moduleId: testModId, accessLevel: 'admin' }]
    }, userToken);
    assert(unauthModRes.status === 403, 'Unauthorized standard user rejected on module access update (403)');

    // 3. API Route Permissions Registry
    console.log('\n[3] API Route Permissions Registry:');
    const apiPermsRes = await request('GET', '/rbac/api-permissions', null, saToken);
    assert(apiPermsRes.status === 200, 'Fetch API permissions list (200)');
    assert(Array.isArray(apiPermsRes.body.data) && apiPermsRes.body.data.length >= 10, 'Returns at least 10 API route permissions');

    const newApiRoute = await request('POST', '/rbac/api-permissions', {
      module: 'analytics',
      method: 'GET',
      endpoint: '/api/v1/admin/analytics/custom-kpi',
      required_permission: 'dashboard.view',
      description: 'Fetch executive custom KPI report'
    }, saToken);
    assert(newApiRoute.status === 201, 'Create new API route permission returns 201');
    const routeId = newApiRoute.body.data.id;

    const updateApiRoute = await request('PUT', `/rbac/api-permissions/${routeId}`, {
      description: 'Updated executive custom KPI report description'
    }, saToken);
    assert(updateApiRoute.status === 200, 'Update API route permission succeeds (200)');

    const deleteApiRoute = await request('DELETE', `/rbac/api-permissions/${routeId}`, null, saToken);
    assert(deleteApiRoute.status === 200, 'Delete API route permission succeeds (200)');

    // 4. Role Assignments API
    console.log('\n[4] Role Assignments API:');
    const assignmentsRes = await request('GET', '/rbac/assignments', null, saToken);
    assert(assignmentsRes.status === 200, 'Fetch user role assignments list (200)');
    const assignmentList = Array.isArray(assignmentsRes.body.data) ? assignmentsRes.body.data : (assignmentsRes.body.data?.assignments || []);
    assert(assignmentList.length > 0, 'Assignments list populated');

    // Test assign role to standard user
    const customAdminRole = modAccessRes.body.data.roles.find(r => r.slug === 'analyst')?.id;
    const assignRes = await request('POST', '/rbac/assignments', {
      userId: userLogin.body.data.user.id,
      roleIds: [customAdminRole],
      isPrimary: false
    }, saToken);
    assert(assignRes.status === 200, 'Assign role to user succeeds (200)');

    // Test unassign role
    const removeRoleRes = await request('DELETE', `/rbac/assignments/${userLogin.body.data.user.id}/${customAdminRole}`, null, saToken);
    assert(removeRoleRes.status === 200, 'Remove role from user succeeds (200)');

    // Verify cannot remove superadmin role from the owner
    const superAdminRole = modAccessRes.body.data.roles.find(r => r.slug === 'superadmin')?.id;
    const removeSaRoleRes = await request('DELETE', `/rbac/assignments/${saUserId}/${superAdminRole}`, null, saToken);
    assert(removeSaRoleRes.status === 403, 'System forbids removing Super Admin role from owner (403)');

    // 5. Active Sessions & Instant Revocation
    console.log('\n[5] Active Sessions & Instant Revocation:');
    const sessionsRes = await request('GET', '/rbac/security/sessions', null, saToken);
    assert(sessionsRes.status === 200, 'Fetch active sessions returns 200');
    const sessionList = Array.isArray(sessionsRes.body.data) ? sessionsRes.body.data : (sessionsRes.body.data?.sessions || []);
    assert(sessionList.length > 0, 'Active sessions list returned');

    const firstSessionId = sessionList[0].id;
    const revokeRes = await request('DELETE', `/rbac/security/sessions/${firstSessionId}`, null, saToken);
    assert(revokeRes.status === 200, 'Revoke session token returns 200');

    // 6. Admin Activity Logs
    console.log('\n[6] Admin Activity Logs:');
    const activityRes = await request('GET', '/rbac/activity?limit=10', null, saToken);
    assert(activityRes.status === 200, 'Fetch admin activity logs returns 200');
    const activityList = Array.isArray(activityRes.body.data) ? activityRes.body.data : (activityRes.body.data?.activity || []);
    assert(activityList.length > 0, 'Admin activity logs returned');
    assert(activityRes.body.pagination?.total >= 50 || activityList.length >= 10, 'Admin activity count >= 10');

    // 7. Security Settings
    console.log('\n[7] Enterprise Security Settings:');
    const secSettingsRes = await request('GET', '/rbac/security/settings', null, saToken);
    assert(secSettingsRes.status === 200, 'Fetch security settings returns 200');
    assert(secSettingsRes.body.data.session_timeout_minutes !== undefined, 'Has session_timeout_minutes');
    assert(secSettingsRes.body.data.password_policy !== undefined, 'Has password_policy');

    const updateSecRes = await request('PUT', '/rbac/security/settings', {
      session_timeout_minutes: { value: 90, unit: 'minutes' }
    }, saToken);
    assert(updateSecRes.status === 200, 'Update security settings returns 200');

    // 8. Access Control Policies ABAC
    console.log('\n[8] Access Control Policies:');
    const policiesRes = await request('GET', '/access-control/policies', null, saToken);
    assert(policiesRes.status === 200, 'Fetch access policies returns 200');
    assert(Array.isArray(policiesRes.body.data) && policiesRes.body.data.length >= 3, 'Policies array length >= 3');

    const createPolicyRes = await request('POST', '/access-control/policies', {
      name: 'Custom Test Policy',
      slug: 'custom-test-policy',
      description: 'Temporary ABAC test policy',
      effect: 'allow',
      subject_type: 'role',
      resource: 'audit',
      action: 'READ',
      priority: 5,
      conditions: { test: true }
    }, saToken);
    assert(createPolicyRes.status === 201, 'Create access policy returns 201');
    const policyId = createPolicyRes.body.data.id;

    const deletePolicyRes = await request('DELETE', `/access-control/policies/${policyId}`, null, saToken);
    assert(deletePolicyRes.status === 200, 'Delete access policy returns 200');

    // 9. Login History
    console.log('\n[9] Login History:');
    const loginHistRes = await request('GET', '/rbac/security/login-history?limit=10', null, saToken);
    assert(loginHistRes.status === 200, 'Fetch login history returns 200');
    const historyList = Array.isArray(loginHistRes.body.data) ? loginHistRes.body.data : (loginHistRes.body.data?.history || []);
    assert(historyList.length > 0, 'Login history records returned');
    assert(loginHistRes.body.pagination?.total >= 50 || historyList.length >= 10, 'Login history count >= 10');

    // 10. Audit Logs
    console.log('\n[10] Universal Audit Logs:');
    const auditRes = await request('GET', '/rbac/audit-logs?limit=10', null, saToken);
    assert(auditRes.status === 200, 'Fetch audit logs returns 200');
    const auditList = Array.isArray(auditRes.body.data) ? auditRes.body.data : (auditRes.body.data?.logs || []);
    assert(auditList.length > 0, 'Audit logs returned');

    console.log('\n======================================================');
    console.log(`ENTERPRISE RBAC RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
}

runEnterpriseTests();
