'use strict';
require('dotenv').config();
const http = require('http');
const createApp = require('../src/app');

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
  console.log('--- STARTING ENTERPRISE DASHBOARD & ANALYTICS MODULE TESTS ---');
  const app = createApp();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      console.log(`Test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  let superAdminToken = null;
  let adminToken = null;
  let standardUserToken = null;
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
    // 1. Authenticate Personas
    console.log('[1] Authentication & Token Issuance:');
    const saLogin = await request('POST', '/auth/login', {
      email: 'superadmin@desigot.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(saLogin.status === 200, 'Super Admin login succeeds with 200');
    superAdminToken = saLogin.body.data?.accessToken;

    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@desigot.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(adminLogin.status === 200, 'Platform Admin login succeeds with 200');
    adminToken = adminLogin.body.data?.accessToken;

    const userLogin = await request('POST', '/auth/login', {
      email: 'user@desigot.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(userLogin.status === 200, 'Standard User login succeeds with 200');
    standardUserToken = userLogin.body.data?.accessToken;

    // 2. Unauthenticated and Unauthorized checks
    console.log('\n[2] RBAC & Authentication Enforcement:');
    const noAuth = await request('GET', '/admin/dashboard/overview');
    assert(noAuth.status === 401, 'Unauthenticated request to overview returns 401');

    const userNoPerm = await request('GET', '/admin/dashboard/overview', null, standardUserToken);
    assert(userNoPerm.status === 403, 'Standard user without permissions receives 403 Forbidden');

    const saOverview = await request('GET', '/admin/dashboard/overview', null, superAdminToken);
    assert(saOverview.status === 200, 'Super Admin bypass receives 200 on overview');
    assert(saOverview.body.success === true, 'Response format contains success: true');

    const adminOverview = await request('GET', '/admin/dashboard/overview', null, adminToken);
    assert(adminOverview.status === 200, 'Admin with dashboard.overview.read receives 200');

    // 3. Overview Metrics & Financial Calculations
    console.log('\n[3] Overview Metrics & Database Validation:');
    const summary = saOverview.body.data?.summary;
    assert(summary !== undefined, 'Summary object present');
    assert(typeof summary?.grossRevenue === 'number' && summary.grossRevenue > 0, `Gross revenue computed from DB: $${summary?.grossRevenue}`);
    assert(typeof summary?.netPlatformRevenue === 'number' && summary.netPlatformRevenue > 0, `Net platform revenue computed: $${summary?.netPlatformRevenue}`);
    assert(summary?.totalOrders > 0, `Total orders count > 0: ${summary?.totalOrders}`);
    assert(summary?.activeSellers >= 20, `Active sellers count reflects seed: ${summary?.activeSellers}`);
    assert(summary?.totalCustomers >= 90, `Total customers count reflects seed: ${summary?.totalCustomers}`);
    assert(Array.isArray(saOverview.body.data?.revenueChart), 'Revenue chart dataset is an array');
    assert(Array.isArray(saOverview.body.data?.recentOrders), 'Recent orders dataset is an array');
    assert(saOverview.body.data?.recentOrders?.length > 0, 'Recent orders has actual database records');

    // 4. Revenue Analytics
    console.log('\n[4] Revenue Analytics & Reconciliation:');
    const revRes = await request('GET', '/admin/analytics/revenue?period=30d', null, adminToken);
    assert(revRes.status === 200, 'Revenue analytics endpoint returns 200');
    const revData = revRes.body.data;
    assert(revData?.kpis?.gmv > 0, `GMV is non-zero: $${revData?.kpis?.gmv}`);
    assert(revData?.kpis?.platformCommission > 0, `Platform commission is non-zero: $${revData?.kpis?.platformCommission}`);
    assert(revData?.kpis?.sellerEarnings > 0, `Seller earnings is non-zero: $${revData?.kpis?.sellerEarnings}`);
    assert(Array.isArray(revData?.trends), 'Revenue trends array returned');
    assert(Array.isArray(revData?.byCategory), 'Revenue by category returned');
    assert(Array.isArray(revData?.byType), 'Revenue by order type returned');

    // 5. Marketplace Analytics
    console.log('\n[5] Marketplace Analytics & Distribution:');
    const mktRes = await request('GET', '/admin/analytics/marketplace?period=30d', null, adminToken);
    assert(mktRes.status === 200, 'Marketplace analytics returns 200');
    assert(mktRes.body.data?.kpis?.totalListings >= 80, `Total marketplace listings: ${mktRes.body.data?.kpis?.totalListings}`);
    assert(mktRes.body.data?.kpis?.activeServices >= 30, `Active services count: ${mktRes.body.data?.kpis?.activeServices}`);
    assert(mktRes.body.data?.kpis?.publishedProducts >= 40, `Published products count: ${mktRes.body.data?.kpis?.publishedProducts}`);
    assert(Array.isArray(mktRes.body.data?.categoryPerformance), 'Category performance table populated');
    assert(Array.isArray(mktRes.body.data?.topSearches), 'Search analytics records populated');

    // 6. Sales Analytics & Funnel
    console.log('\n[6] Sales Analytics & Conversion Funnel:');
    const salesRes = await request('GET', '/admin/analytics/sales?period=30d', null, adminToken);
    assert(salesRes.status === 200, 'Sales analytics returns 200');
    assert(salesRes.body.data?.products?.totalOrders > 0, `Digital product orders: ${salesRes.body.data?.products?.totalOrders}`);
    assert(salesRes.body.data?.services?.totalOrders > 0, `Service booking orders: ${salesRes.body.data?.services?.totalOrders}`);
    assert(salesRes.body.data?.funnel?.length === 5, 'Conversion funnel steps populated');
    assert(Array.isArray(salesRes.body.data?.orders), 'Orders table data populated');

    // 7. Service Analytics
    console.log('\n[7] Service Analytics & Categories:');
    const svcRes = await request('GET', '/admin/analytics/services', null, adminToken);
    assert(svcRes.status === 200, 'Service analytics returns 200');
    assert(svcRes.body.data?.kpis?.totalServices >= 35, `Service listings count: ${svcRes.body.data?.kpis?.totalServices}`);
    assert(svcRes.body.data?.topServices?.length > 0, 'Top performing services populated');

    // 8. Seller Analytics & Segmentation
    console.log('\n[8] Seller Analytics & Top Performers:');
    const sellerRes = await request('GET', '/admin/analytics/sellers', null, adminToken);
    assert(sellerRes.status === 200, 'Seller analytics returns 200');
    assert(sellerRes.body.data?.kpis?.totalSellers >= 25, `Total sellers count: ${sellerRes.body.data?.kpis?.totalSellers}`);
    assert(sellerRes.body.data?.topSellers?.length > 0, 'Top sellers leaderboard populated');
    assert(Array.isArray(sellerRes.body.data?.segmentation), 'Seller segmentation breakdown returned');

    // 9. Customer Analytics & LTV
    console.log('\n[9] Customer Analytics:');
    const custRes = await request('GET', '/admin/analytics/customers', null, adminToken);
    assert(custRes.status === 200, 'Customer analytics returns 200');
    assert(custRes.body.data?.kpis?.totalCustomers >= 90, `Total customers count: ${custRes.body.data?.kpis?.totalCustomers}`);
    assert(custRes.body.data?.kpis?.avgLtv > 0, `Average LTV calculated: $${custRes.body.data?.kpis?.avgLtv}`);
    assert(custRes.body.data?.topCustomers?.length > 0, 'Top customers table populated');

    // 10. Centralized Recent Activities
    console.log('\n[10] Recent Activities Feed:');
    const actRes = await request('GET', '/admin/activities?limit=10', null, adminToken);
    assert(actRes.status === 200, 'Activities list returns 200');
    assert(Array.isArray(actRes.body.data?.data), 'Activities array returned');
    assert(actRes.body.data?.data?.length > 0, 'Actual recorded events present in activity log');
    assert(actRes.body.data?.pagination?.total > 100, `Activity count > 100: ${actRes.body.data?.pagination?.total}`);

    // 11. System Health & Integrations
    console.log('\n[11] System Health & Infrastructure Monitoring:');
    const healthRes = await request('GET', '/admin/system/health', null, adminToken);
    assert(healthRes.status === 200, 'System health endpoint returns 200');
    assert(healthRes.body.data?.application?.status === 'operational', 'Application status is operational');
    assert(healthRes.body.data?.database?.status === 'operational', 'Database status is operational');
    assert(Array.isArray(healthRes.body.data?.integrations), 'Integrations health list returned');
    assert(healthRes.body.data?.integrations?.length >= 4, 'Includes Stripe, DB, Email, Storage checks');

    // 12. Reports Export
    console.log('\n[12] Reports & Data Export:');
    const exportCsv = await request('GET', '/admin/analytics/export?type=revenue&format=csv', null, adminToken);
    assert(exportCsv.status === 200, 'Export revenue as CSV returns 200');
    assert(typeof exportCsv.body === 'string' && exportCsv.body.includes('order_id'), 'CSV body contains valid columns');

    const exportJson = await request('GET', '/admin/analytics/export?type=sellers&format=json', null, adminToken);
    assert(exportJson.status === 200, 'Export sellers as JSON returns 200');
    assert(Array.isArray(exportJson.body), 'JSON export body is an array of seller records');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) server.close();
    console.log('\n========================================');
    console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
