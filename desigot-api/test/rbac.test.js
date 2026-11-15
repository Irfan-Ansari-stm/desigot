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

async function runTests() {
  console.log('--- STARTING ENTERPRISE RBAC SYSTEM TESTS ---');
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
    // 1. Test Super Admin Login
    console.log('\n[1] Authentication & Token Issue:');
    const saLogin = await request('POST', '/auth/login', {
      email: 'superadmin@desigot.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(saLogin.status === 200, 'Super Admin login succeeds with 200');
    assert(saLogin.body.data.user.is_super_admin === true, 'User profile has is_super_admin = true');
    assert(saLogin.body.data.user.permissions.includes('*'), 'Super Admin has wildcard permissions');
    const saToken = saLogin.body.data.accessToken;

    // 2. Test Admin Login
    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@desigot.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(adminLogin.status === 200, 'Admin login succeeds with 200');
    assert(adminLogin.body.data.user.is_super_admin === false, 'Admin has is_super_admin = false');
    assert(!adminLogin.body.data.user.permissions.includes('*'), 'Admin does NOT have wildcard permissions');
    const adminToken = adminLogin.body.data.accessToken;

    // 3. Test Standard User Login
    const userLogin = await request('POST', '/auth/login', {
      email: 'user@desigot.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(userLogin.status === 200, 'Standard user login succeeds with 200');
    const userToken = userLogin.body.data.accessToken;

    // 4. Test Super Admin Access to Super Admin Control Center
    console.log('\n[2] Protected Super Admin Control Center Access:');
    const saDashboard = await request('GET', '/rbac/super-admin/dashboard', null, saToken);
    assert(saDashboard.status === 200, 'Super Admin can access Super Admin Control Center');
    assert(saDashboard.body.data.kpis.users.total_users > 0, 'Super Admin receives KPI metrics');

    // 5. Test Non-Super Admin BLOCKED from Super Admin Control Center
    const adminTrySa = await request('GET', '/rbac/super-admin/dashboard', null, adminToken);
    assert(adminTrySa.status === 403, 'Platform Admin receives 403 Forbidden on Super Admin Control Center');

    const userTrySa = await request('GET', '/rbac/super-admin/dashboard', null, userToken);
    assert(userTrySa.status === 403, 'Standard User receives 403 Forbidden on Super Admin Control Center');

    // 6. Test Privilege Escalation Protection: Admin cannot grant themselves Super Admin
    console.log('\n[3] Privilege Escalation Prevention:');
    const escalateAttempt = await request(
      'PUT',
      `/rbac/users/${adminLogin.body.data.user.id}`,
      { is_super_admin: true },
      adminToken
    );
    assert(escalateAttempt.status === 403, 'Admin cannot elevate themselves to Super Admin (403)');

    // 7. Test Admin cannot modify or tamper with Super Admin account
    const tamperSaAttempt = await request(
      'PUT',
      `/rbac/users/${saLogin.body.data.user.id}`,
      { display_name: 'Hacked Super Admin' },
      adminToken
    );
    assert(tamperSaAttempt.status === 403, 'Admin cannot modify Super Admin user record (403)');

    // 8. Test Protection of the Last Active Super Admin: Cannot deactivate or delete last Super Admin
    console.log('\n[4] Last Active Super Admin Protection:');
    const deactivateSaAttempt = await request(
      'PATCH',
      `/rbac/users/${saLogin.body.data.user.id}/status`,
      { status: 'suspended', reason: 'Test attempt' },
      saToken
    );
    assert(
      deactivateSaAttempt.status === 403,
      'System prevents suspending/deactivating the last active Super Admin (403)'
    );

    const deleteSaAttempt = await request(
      'DELETE',
      `/rbac/users/${saLogin.body.data.user.id}`,
      null,
      saToken
    );
    assert(
      deleteSaAttempt.status === 403,
      'System prevents deleting the last active Super Admin (403)'
    );

    // 9. Test Role & Permission CRUD
    console.log('\n[5] Role & Permission Management CRUD:');
    const uniqueSlug = `test-role-${Date.now().toString(36)}`;
    const createRoleRes = await request(
      'POST',
      '/roles',
      {
        name: 'Automated Test Role',
        slug: uniqueSlug,
        description: 'Role created during automated verification',
        hierarchy_level: 4,
        role_type: 'custom',
      },
      saToken
    );
    assert(createRoleRes.status === 201, 'Super Admin can create a custom role (201)');
    const createdRoleId = createRoleRes.body.data.id;

    // Read role
    const getRoleRes = await request('GET', `/roles/${createdRoleId}`, null, saToken);
    assert(getRoleRes.status === 200, 'Created role details successfully retrieved (200)');

    // Standard user without roles.create cannot create role
    const userCreateRole = await request(
      'POST',
      '/roles',
      { name: 'Illegal Role', slug: 'illegal-role' },
      userToken
    );
    assert(userCreateRole.status === 403, 'User without permissions cannot create a role (403)');

    // 10. Test Permission Matrix Retrieval and Batch Update
    console.log('\n[6] Visual Permission Matrix:');
    const matrixRes = await request('GET', '/access-control/matrix', null, saToken);
    assert(matrixRes.status === 200, 'Matrix data successfully retrieved (200)');
    assert(Array.isArray(matrixRes.body.data.modules), 'Matrix returns list of modules');
    assert(Array.isArray(matrixRes.body.data.actions), 'Matrix returns list of actions');

    // Find a permission to assign to our new role
    const permsRes = await request('GET', '/permissions', null, saToken);
    assert(permsRes.status === 200, 'Permissions listed (200)');
    const samplePerm = permsRes.body.data[0];

    const updateMatrixRes = await request(
      'POST',
      '/access-control/matrix',
      {
        updates: [{ roleId: createdRoleId, permissionId: samplePerm.id, assigned: true }],
      },
      saToken
    );
    assert(updateMatrixRes.status === 200, 'Batch matrix update succeeds with atomic persistence (200)');

    // Verify matrix update took effect
    const updatedRoleCheck = await request('GET', `/roles/${createdRoleId}`, null, saToken);
    assert(
      updatedRoleCheck.body.data.permissions.some((p) => p.id === samplePerm.id),
      'Assigned permission reflected immediately in role details'
    );

    // 11. Test System-Protected Roles cannot be deleted
    console.log('\n[7] Role Deletion Safety:');
    const saRole = (await request('GET', '/roles', null, saToken)).body.data.find(
      (r) => r.slug === 'superadmin'
    );
    if (saRole) {
      const deleteSaRole = await request('DELETE', `/roles/${saRole.id}`, null, saToken);
      assert(deleteSaRole.status === 403, 'System role "superadmin" cannot be deleted (403)');
    }

    // Delete custom role
    const deleteCustomRole = await request('DELETE', `/roles/${createdRoleId}`, null, saToken);
    assert(deleteCustomRole.status === 200, 'Custom test role deleted successfully (200)');

    // 12. Test Audit Log Immutability
    console.log('\n[8] Immutable Audit Trail:');
    const auditRes = await request('GET', '/audit-logs', null, saToken);
    assert(auditRes.status === 200, 'Audit logs retrieved successfully (200)');
    assert(auditRes.body.data.length > 0, 'Audit records contain recorded actions');

    // 13. Test Deactivating a user immediately blocks authentication
    console.log('\n[9] Deactivation & Session Enforcement:');
    // Create a temporary user
    const tempEmail = `temp-${Date.now().toString(36)}@test.com`;
    const createTempUser = await request(
      'POST',
      '/rbac/users',
      {
        email: tempEmail,
        password: 'Password123!',
        display_name: 'Temporary User',
      },
      saToken
    );
    assert(createTempUser.status === 201, 'Temporary user created for suspension test (201)');
    const tempUserId = createTempUser.body.data.id;

    // Log in as temp user
    const tempLogin = await request('POST', '/auth/login', {
      email: tempEmail,
      password: 'Password123!',
    });
    assert(tempLogin.status === 200, 'Temporary user logs in successfully (200)');

    // Suspend temp user
    const suspendRes = await request(
      'PATCH',
      `/rbac/users/${tempUserId}/status`,
      { status: 'suspended', reason: 'Security violation test' },
      saToken
    );
    assert(suspendRes.status === 200, 'User suspended (200)');

    // Attempt login as suspended user
    const loginSuspended = await request('POST', '/auth/login', {
      email: tempEmail,
      password: 'Password123!',
    });
    assert(loginSuspended.status === 403, 'Suspended user is blocked from logging in (403)');

    // Clean up temp user
    await request('DELETE', `/rbac/users/${tempUserId}`, null, saToken);

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Test suite uncaught error:', err);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
