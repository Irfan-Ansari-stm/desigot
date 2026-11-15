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
  console.log('===============================================================');
  console.log('🧪 STARTING DESIGOT SERVICE MANAGEMENT FULL-STACK TEST SUITE 🧪');
  console.log('===============================================================\n');

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
  let sellerToken = null;
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
    assert(saLogin.status === 200, 'Super Admin login succeeds (200)');
    superAdminToken = saLogin.body.data?.accessToken;

    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@desigot.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(adminLogin.status === 200, 'Platform Admin login succeeds (200)');
    adminToken = adminLogin.body.data?.accessToken;

    const sellerLogin = await request('POST', '/auth/login', {
      email: 'seller@example.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(sellerLogin.status === 200, 'Seller login succeeds (200)');
    sellerToken = sellerLogin.body.data?.accessToken;

    const userLogin = await request('POST', '/auth/login', {
      email: 'user@desigot.com',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
    });
    assert(userLogin.status === 200, 'Standard User login succeeds (200)');
    standardUserToken = userLogin.body.data?.accessToken;

    // 2. RBAC Access Control & Super Admin root override
    console.log('\n[2] RBAC Access Control & Authorization Gates:');
    const noAuth = await request('GET', '/admin/services/stats');
    assert(noAuth.status === 401, 'Unauthenticated access to /admin/services/stats is blocked (401)');

    const userBlocked = await request('GET', '/admin/services/stats', null, standardUserToken);
    assert(userBlocked.status === 403, 'Standard user without services.read is rejected with 403');

    const adminStats = await request('GET', '/admin/services/stats', null, adminToken);
    assert(adminStats.status === 200, 'Platform Admin with services.read permission succeeds (200)');

    const saStats = await request('GET', '/admin/services/stats', null, superAdminToken);
    assert(saStats.status === 200, 'Super Admin root override succeeds unconditionally (200)');
    assert(saStats.body.data?.totalServices > 0, `Returns valid services count (${saStats.body.data?.totalServices})`);
    assert(saStats.body.data?.publishedCount > 0, `Returns published services count (${saStats.body.data?.publishedCount})`);

    // 3. All Services List & Filters
    console.log('\n[3] Service Catalog & Advanced Filters:');
    const listRes = await request('GET', '/admin/services?limit=10', null, superAdminToken);
    assert(listRes.status === 200, 'List services with pagination succeeds (200)');
    assert(Array.isArray(listRes.body.data?.services), 'Returns services array');
    assert(listRes.body.data?.services.length > 0, 'Services list is populated with seeded data');
    const firstService = listRes.body.data.services[0];
    assert(firstService.seller_name !== undefined, 'Service includes seller information');
    assert(firstService.starting_price_usd !== undefined, 'Service includes starting_price_usd formatting');

    // Filter by status
    const publishedRes = await request('GET', '/admin/services?status=published', null, superAdminToken);
    assert(publishedRes.status === 200, 'Filter by status=published succeeds');
    assert(publishedRes.body.data.services.every((s) => s.status === 'published'), 'All returned services have status=published');

    const pendingRes = await request('GET', '/admin/services?status=pending_approval', null, superAdminToken);
    assert(pendingRes.status === 200, 'Filter by status=pending_approval succeeds');
    assert(pendingRes.body.data.services.every((s) => s.status === 'pending_approval'), 'All returned have status=pending_approval');

    // 4. Categories, Attributes, and Tags Management
    console.log('\n[4] Categories, Attributes & Tags Endpoints:');
    const catRes = await request('GET', '/admin/services/categories', null, superAdminToken);
    assert(catRes.status === 200, 'List service categories succeeds (200)');
    assert(catRes.body.data.length >= 20, `Returns seeded categories (found ${catRes.body.data.length})`);
    const testCatId = catRes.body.data[0].id;

    const attrRes = await request('GET', '/admin/services/attributes', null, superAdminToken);
    assert(attrRes.status === 200, 'List service attributes succeeds (200)');
    assert(attrRes.body.data.length >= 10, `Returns seeded attributes (found ${attrRes.body.data.length})`);

    const tagsRes = await request('GET', '/admin/services/tags', null, superAdminToken);
    assert(tagsRes.status === 200, 'List service tags succeeds (200)');
    assert(tagsRes.body.data.length >= 20, `Returns seeded tags (found ${tagsRes.body.data.length})`);

    // 5. Create Service via 8-Step Wizard Payload
    console.log('\n[5] Service Creation (8-Step Wizard Payload):');
    const newServicePayload = {
      title: 'Automated Test Design System Creation',
      category_id: testCatId,
      short_description: 'Complete production-grade Figma design system with tokens',
      description: 'We deliver atomic components, documentation, interactive variants, and multi-brand design tokens ready for developer handoff.',
      target_audience: 'SaaS Startups and Product Teams',
      starting_price_cents: 85000, // $850.00
      delivery_time_days: 7,
      revision_limit: 3,
      what_is_included: ['Figma library file', 'Design tokens', 'Documentation guide'],
      what_is_not_included: ['React code implementation'],
      deliverables: ['.fig file', 'PDF style guide'],
      packages: [
        {
          package_type: 'basic',
          name: 'Starter Tokens',
          description: 'Color palette and typography scale',
          price_cents: 85000,
          delivery_days: 7,
          revisions: 2,
          features: [{ feature_name: 'Color Tokens', is_included: true }, { feature_name: 'Typography Hierarchy', is_included: true }],
        },
        {
          package_type: 'standard',
          name: 'Full Component Library',
          description: 'Over 50 components with responsive auto-layout',
          price_cents: 180000,
          delivery_days: 14,
          revisions: 4,
          features: [{ feature_name: 'All Basic Features', is_included: true }, { feature_name: '50+ Auto Layout Components', is_included: true }],
        },
      ],
      addons: [
        { name: 'Dark Mode Variant Tokens', description: 'Additional dark theme tokens', price_cents: 25000, delivery_days_added: 2 },
      ],
      media: [
        { file_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80', caption: 'Design System Overview', is_primary: true },
      ],
      tag_ids: [tagsRes.body.data[0].id],
    };

    const createRes = await request('POST', '/admin/services', newServicePayload, superAdminToken);
    assert(createRes.status === 201, 'Create service responds with 201 Created');
    const createdId = createRes.body.data?.id;
    assert(createdId !== undefined, 'Created service has valid UUID');
    assert(createRes.body.data?.status === 'draft', 'Created service defaults to draft status');
    assert(createRes.body.data?.packages.length === 2, 'Created service correctly saved 2 packages with features');
    assert(createRes.body.data?.addons.length === 1, 'Created service saved 1 addon');

    // 6. Service Lifecycle State Transitions
    console.log('\n[6] Service Lifecycle & State Machine Transitions:');
    // Draft -> Submit
    const submitRes = await request('POST', `/admin/services/${createdId}/submit`, null, superAdminToken);
    assert(submitRes.status === 200, 'Submit service for review changes status to pending_approval');
    assert(submitRes.body.data?.status === 'pending_approval', 'Status is pending_approval');

    // Pending -> Request Changes
    const reqChangesRes = await request('POST', `/admin/services/${createdId}/request-changes`, { feedback: 'Please add more details about icon set inclusion' }, superAdminToken);
    assert(reqChangesRes.status === 200, 'Request changes transitions status to changes_requested');
    assert(reqChangesRes.body.data?.status === 'changes_requested', 'Status is changes_requested');

    // Re-submit
    await request('POST', `/admin/services/${createdId}/submit`, null, superAdminToken);

    // Pending -> Approve & Publish
    const approveRes = await request('POST', `/admin/services/${createdId}/approve`, { notes: 'Approved for publication', autoPublish: true }, superAdminToken);
    assert(approveRes.status === 200, 'Approve service with autoPublish sets status to published');
    assert(approveRes.body.data?.status === 'published', 'Status is published');

    // Unpublish
    const unpublishRes = await request('POST', `/admin/services/${createdId}/unpublish`, { reason: 'Temporarily taking offline for maintenance' }, superAdminToken);
    assert(unpublishRes.status === 200, 'Unpublish service sets status to approved');
    assert(unpublishRes.body.data?.status === 'approved', 'Status is approved');

    // Publish
    const republishRes = await request('POST', `/admin/services/${createdId}/publish`, null, superAdminToken);
    assert(republishRes.status === 200, 'Re-publishing sets status back to published');
    assert(republishRes.body.data?.status === 'published', 'Status is published');

    // Suspend
    const suspendRes = await request('POST', `/admin/services/${createdId}/suspend`, { reason: 'Administrative review required due to external report' }, superAdminToken);
    assert(suspendRes.status === 200, 'Suspend service sets status to suspended');
    assert(suspendRes.body.data?.status === 'suspended', 'Status is suspended');

    // Restore
    const restoreRes = await request('POST', `/admin/services/${createdId}/restore`, { notes: 'Review cleared by admin' }, superAdminToken);
    assert(restoreRes.status === 200, 'Restore service returns status to published');
    assert(restoreRes.body.data?.status === 'published', 'Status is restored to published');

    // 7. Duplicate Service
    console.log('\n[7] Service Duplication:');
    const dupRes = await request('POST', `/admin/services/${createdId}/duplicate`, null, superAdminToken);
    assert(dupRes.status === 201, 'Duplicate service responds with 201 Created');
    assert(dupRes.body.data?.title.startsWith('Copy of'), 'Duplicated service has "Copy of" prefix');
    assert(dupRes.body.data?.status === 'draft', 'Duplicated service status reset to draft');
    const dupId = dupRes.body.data?.id;

    // 8. Delete Service
    console.log('\n[8] Service Deletion:');
    const delRes = await request('DELETE', `/admin/services/${dupId}`, null, superAdminToken);
    assert(delRes.status === 200, 'Delete service returns 200');

    // 9. Featured Services Management
    console.log('\n[9] Featured Services & Campaigns:');
    const featOnRes = await request('POST', `/admin/services/${createdId}/feature`, { priority: 25, days: 15, placement: 'homepage_hero' }, superAdminToken);
    assert(featOnRes.status === 200, 'Feature service sets is_featured = true');

    const featList = await request('GET', '/admin/services/featured', null, superAdminToken);
    assert(featList.status === 200, 'List featured services returns 200');
    assert(featList.body.data.some((f) => f.service_id === createdId), 'Newly featured service appears in featured list');

    const featOffRes = await request('DELETE', `/admin/services/${createdId}/feature`, null, superAdminToken);
    assert(featOffRes.status === 200, 'Remove feature sets is_featured = false');

    // 10. Moderation Reports
    console.log('\n[10] Moderation Reports:');
    const repList = await request('GET', '/admin/services/reports', null, superAdminToken);
    assert(repList.status === 200, 'List moderation reports returns 200');
    assert(repList.body.data.length > 0, `Returns seeded moderation reports (count: ${repList.body.data.length})`);
    const testReportId = repList.body.data[0].id;

    const repUpdate = await request('PATCH', `/admin/services/reports/${testReportId}`, {
      status: 'resolved',
      resolution_notes: 'Reviewed content and confirmed compliance with marketplace guidelines.',
    }, superAdminToken);
    assert(repUpdate.status === 200, 'Resolve report updates report status to resolved');
    assert(repUpdate.body.data.status === 'resolved', 'Report status confirmed resolved');

    // 11. Custom Service Requests & Quotations
    console.log('\n[11] Custom Requests & Seller Quotations:');
    const crList = await request('GET', '/admin/services/custom-requests', null, superAdminToken);
    assert(crList.status === 200, 'List custom requests returns 200');
    assert(crList.body.data.length > 0, `Returns seeded custom requests (count: ${crList.body.data.length})`);
    const testCrId = crList.body.data[0].id;

    const crDetail = await request('GET', `/admin/services/custom-requests/${testCrId}`, null, superAdminToken);
    assert(crDetail.status === 200, 'Get custom request detail returns 200');
    assert(Array.isArray(crDetail.body.data.quotes), 'Returns quotes associated with custom request');

    // Submit quote
    const quoteRes = await request('POST', `/admin/services/custom-requests/${testCrId}/quote`, {
      price_cents: 95000,
      delivery_days: 10,
      deliverables: ['Custom wireframes', 'UI prototype in Figma'],
      terms: '50% advance milestone, 2 rounds of revisions',
    }, superAdminToken);
    assert(quoteRes.status === 201, 'Submit quote returns 201 Created');

    // 12. Price Calculator & Pricing Rules
    console.log('\n[12] Dynamic Price Calculator & Rules:');
    const calcRes = await request('POST', '/admin/services/calculate-price', {
      serviceId: createdId,
      packageId: createRes.body.data.packages[1].id,
      addonIds: [createRes.body.data.addons[0].id],
      isExpress: false,
    }, superAdminToken);
    assert(calcRes.status === 200, 'Calculate price returns 200');
    assert(calcRes.body.data.subtotalCents > 0, `Calculated subtotal cents: ${calcRes.body.data.subtotalCents}`);
    assert(calcRes.body.data.platformFeeCents > 0, `Calculated platform fee: ${calcRes.body.data.platformFeeCents}`);
    assert(calcRes.body.data.sellerEarningsCents > 0, `Calculated seller earnings: ${calcRes.body.data.sellerEarningsCents}`);

    const prList = await request('GET', '/admin/services/pricing-rules', null, superAdminToken);
    assert(prList.status === 200, 'List pricing rules returns 200');

    // 13. Service Performance Analytics
    console.log('\n[13] Service Performance Analytics:');
    const perfRes = await request('GET', '/admin/services/performance', null, superAdminToken);
    assert(perfRes.status === 200, 'Service performance returns 200');
    assert(Array.isArray(perfRes.body.data?.topServices), 'Returns topServices performance array');
    assert(Array.isArray(perfRes.body.data?.categoryPerformance), 'Returns categoryPerformance breakdown');

    // 14. Public Marketplace Endpoints (Isolation & Visibility)
    console.log('\n[14] Public Marketplace Catalog Endpoints:');
    const pubList = await request('GET', '/public/services');
    assert(pubList.status === 200, 'Public catalog returns 200 without authentication');
    assert(pubList.body.data.services.every((s) => s.status === 'published'), 'Public catalog ONLY displays published services');

    const pubCats = await request('GET', '/public/services/categories');
    assert(pubCats.status === 200, 'Public categories returns 200');
    assert(pubCats.body.data.length > 0, 'Public categories populated');

    const pubTags = await request('GET', '/public/services/tags');
    assert(pubTags.status === 200, 'Public tags returns 200');

    // Cleanup test service
    await request('DELETE', `/admin/services/${createdId}`, null, superAdminToken);

    console.log('\n===============================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
}

runTests();
