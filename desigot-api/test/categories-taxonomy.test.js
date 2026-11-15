'use strict';

const http = require('http');
const createApp = require('../src/app');
const { primaryPool } = require('../src/db/pool');

let server;
let baseUrl;

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTestSuite() {
  console.log('==================================================================');
  console.log('🏷️ STARTING DESIGOT CATEGORIES & TAXONOMY TEST SUITE 🏷️');
  console.log('==================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  try {
    const app = createApp();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;
    console.log(`[Test Server] Listening on ${baseUrl}\n`);

    // 1. Authenticate as Super Admin
    let adminToken;
    await test('Super Admin Authentication', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'superadmin@desigot.com',
        password: 'Password123!',
      });
      if (res.status !== 200 || !res.body.success || !res.body.data.accessToken) {
        throw new Error(`Login failed with status ${res.status}`);
      }
      adminToken = res.body.data.accessToken;
    });

    // 2. Reject unauthenticated access
    await test('Reject Unauthenticated Access to Category APIs', async () => {
      const res = await request('GET', '/admin/categories');
      if (res.status !== 401) {
        throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      }
    });

    // 3. Stats & KPI Overview
    await test('GET /admin/categories/stats - KPI Overview', async () => {
      const res = await request('GET', '/admin/categories/stats', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Stats endpoint failed: ${JSON.stringify(res.body)}`);
      }
      const data = res.body.data;
      if (typeof data.total_categories !== 'number' || data.total_categories < 15) {
        throw new Error(`Expected at least 15 categories, found ${data.total_categories}`);
      }
      console.log(`     Total Categories: ${data.total_categories}, Main: ${data.main_categories}, Sub: ${data.subcategories}, Attributes: ${data.total_attributes}`);
    });

    // 4. Master Directory
    let sampleCategoryId;
    await test('GET /admin/categories - Master Directory', async () => {
      const res = await request('GET', '/admin/categories?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success || !Array.isArray(res.body.data.categories)) {
        throw new Error(`List categories failed`);
      }
      sampleCategoryId = res.body.data.categories[0].id;
    });

    // 5. Create Main Category
    let createdMainId;
    const testMainSlug = `test-main-category-${Date.now()}`;
    await test('POST /admin/categories - Create Main Category (depth = 0)', async () => {
      const res = await request('POST', '/admin/categories', {
        name: 'Autonomous Web Agents',
        slug: testMainSlug,
        description: 'Next-gen autonomous AI web agents and design orchestrations',
        category_type: 'shared',
        icon_name: 'Cpu',
        display_order: 99,
      }, adminToken);

      if (res.status !== 201 || !res.body.success) {
        throw new Error(`Create main category failed: ${JSON.stringify(res.body)}`);
      }
      createdMainId = res.body.data.id;
      if (res.body.data.depth !== 0) {
        throw new Error(`Expected depth 0, got ${res.body.data.depth}`);
      }
    });

    // 6. Create Subcategory
    let createdSubId;
    const testSubSlug = `test-sub-category-${Date.now()}`;
    await test('POST /admin/categories - Create Subcategory (depth = 1)', async () => {
      const res = await request('POST', '/admin/categories', {
        name: 'Browser Automation Agents',
        slug: testSubSlug,
        description: 'Autonomous browser tool integration and testing agents',
        parent_id: createdMainId,
        category_type: 'service',
        icon_name: 'Terminal',
      }, adminToken);

      if (res.status !== 201 || !res.body.success) {
        throw new Error(`Create subcategory failed: ${JSON.stringify(res.body)}`);
      }
      createdSubId = res.body.data.id;
      if (res.body.data.depth !== 1) {
        throw new Error(`Expected depth 1, got ${res.body.data.depth}`);
      }
    });

    // 7. Create Nested Third-Level Category
    let createdNestedId;
    const testNestedSlug = `test-nested-category-${Date.now()}`;
    await test('POST /admin/categories - Create Nested Category (depth = 2)', async () => {
      const res = await request('POST', '/admin/categories', {
        name: 'Playwright & DevTools Automations',
        slug: testNestedSlug,
        description: 'Deep DevTools CDP workflow execution',
        parent_id: createdSubId,
        category_type: 'service',
        icon_name: 'Code',
      }, adminToken);

      if (res.status !== 201 || !res.body.success) {
        throw new Error(`Create nested category failed: ${JSON.stringify(res.body)}`);
      }
      createdNestedId = res.body.data.id;
      if (res.body.data.depth !== 2) {
        throw new Error(`Expected depth 2, got ${res.body.data.depth}`);
      }
    });

    // 8. Prevent Circular Hierarchy (cannot be own parent)
    await test('Hierarchy Integrity: Prevent Category as Own Parent', async () => {
      const res = await request('PUT', `/admin/categories/${createdMainId}`, {
        parent_id: createdMainId,
      }, adminToken);

      if (res.status !== 400 && res.status !== 422) {
        throw new Error(`Expected validation error 400/422, got ${res.status}`);
      }
    });

    // 9. Prevent Circular Hierarchy (cannot move below own descendant)
    await test('Hierarchy Integrity: Prevent Moving Category below its Own Descendant', async () => {
      const res = await request('PUT', `/admin/categories/${createdMainId}`, {
        parent_id: createdNestedId,
      }, adminToken);

      if (res.status !== 400 && res.status !== 422) {
        throw new Error(`Expected validation error 400/422, got ${res.status}`);
      }
    });

    // 10. Update Category & Slug with 301 Redirect Generation
    const updatedSlug = `${testMainSlug}-revised`;
    await test('PUT /admin/categories/:id - Update Slug and Verify 301 Redirect Creation', async () => {
      const res = await request('PUT', `/admin/categories/${createdMainId}`, {
        name: 'Autonomous Web Agents Enterprise',
        slug: updatedSlug,
        is_featured: true,
      }, adminToken);

      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Update category failed: ${JSON.stringify(res.body)}`);
      }

      // Check redirect table
      const redirRes = await request('GET', '/admin/categories/redirects', null, adminToken);
      const redirects = redirRes.body.data.redirects || [];
      const match = redirects.find((r) => r.old_slug === testMainSlug && r.new_slug === updatedSlug);
      if (!match) {
        throw new Error(`Expected 301 redirect from ${testMainSlug} to ${updatedSlug}`);
      }
    });

    // 11. Category Tree
    await test('GET /admin/categories/tree - Recursive Tree Retrieval', async () => {
      const res = await request('GET', '/admin/categories/tree', null, adminToken);
      if (res.status !== 200 || !res.body.success || !Array.isArray(res.body.data.tree)) {
        throw new Error(`Get tree failed`);
      }
      const tree = res.body.data.tree;
      if (tree.length < 5) throw new Error('Expected multiple root tree branches');
    });

    // 12. Main Categories Filter
    await test('GET /admin/categories/main - Main Categories Only', async () => {
      const res = await request('GET', '/admin/categories/main', null, adminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List main failed`);
      const list = res.body.data.categories || [];
      const invalid = list.find((c) => c.parent_id !== null);
      if (invalid) throw new Error(`Found non-root category in /main: ${invalid.name}`);
    });

    // 13. Subcategories Filter
    await test('GET /admin/categories/subcategories - Subcategories Only', async () => {
      const res = await request('GET', '/admin/categories/subcategories', null, adminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List subcategories failed`);
      const list = res.body.data.categories || [];
      const invalid = list.find((c) => c.parent_id === null);
      if (invalid) throw new Error(`Found root category in /subcategories: ${invalid.name}`);
    });

    // 14. Service Categories
    await test('GET /admin/categories/services - Service Categories', async () => {
      const res = await request('GET', '/admin/categories/services', null, adminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List service categories failed`);
    });

    // 15. Product Categories
    await test('GET /admin/categories/products - Product Categories', async () => {
      const res = await request('GET', '/admin/categories/products', null, adminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List product categories failed`);
    });

    // 16. Detail Workspace by ID
    await test('GET /admin/categories/:id - Hydrated Detail Workspace', async () => {
      const res = await request('GET', `/admin/categories/${createdMainId}`, null, adminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Get detail failed`);
      const d = res.body.data;
      if (!d.category || !Array.isArray(d.children) || !Array.isArray(d.breadcrumbs)) {
        throw new Error(`Incomplete detail payload`);
      }
    });

    // 17. Dynamic Attributes Creation & Listing
    let createdAttrId;
    await test('POST & GET /admin/categories/attributes - Dynamic Attribute Management', async () => {
      const createRes = await request('POST', '/admin/categories/attributes', {
        category_id: createdMainId,
        name: 'Agent Engine Runtime',
        key: 'agent_runtime',
        type: 'single_select',
        is_required: true,
        allowed_values: [
          { label: 'Chromium DevTools CDP', value: 'cdp' },
          { label: 'Node.js Sandbox', value: 'node_sandbox' }
        ],
      }, adminToken);

      if (createRes.status !== 201 || !createRes.body.success) {
        throw new Error(`Create attribute failed: ${JSON.stringify(createRes.body)}`);
      }
      createdAttrId = createRes.body.data.id;

      // List attributes for nested child and verify ancestor inheritance!
      const listRes = await request('GET', `/admin/categories/attributes?category_id=${createdNestedId}`, null, adminToken);
      if (listRes.status !== 200 || !listRes.body.success) throw new Error(`List attributes failed`);
      const attrs = listRes.body.data.attributes || [];
      const inherited = attrs.find((a) => a.key === 'agent_runtime');
      if (!inherited) {
        throw new Error(`Expected nested child to inherit 'agent_runtime' attribute from ancestor`);
      }
    });

    // 18. Delete Attribute
    await test('DELETE /admin/categories/attributes/:id - Attribute Deletion', async () => {
      const res = await request('DELETE', `/admin/categories/attributes/${createdAttrId}`, null, adminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Delete attribute failed`);
    });

    // 19. Icons Management
    await test('GET & POST /admin/categories/icons - Icons Library', async () => {
      const createRes = await request('POST', '/admin/categories/icons', {
        name: 'Neural Agent Brain',
        icon_type: 'library',
        icon_ref: 'Brain',
      }, adminToken);
      if (createRes.status !== 201 || !createRes.body.success) {
        throw new Error(`Create icon failed`);
      }

      const listRes = await request('GET', '/admin/categories/icons', null, adminToken);
      if (listRes.status !== 200 || !listRes.body.success || listRes.body.data.icons.length < 10) {
        throw new Error(`Icons library incomplete`);
      }
    });

    // 20. Banners Management
    let createdBannerId;
    await test('GET & POST /admin/categories/banners - Banner Configuration', async () => {
      const createRes = await request('POST', '/admin/categories/banners', {
        category_id: createdMainId,
        name: 'Autonomous Agents Q4 Launch Banner',
        desktop_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
        alt_text: 'Autonomous agents banner',
        display_priority: 1,
      }, adminToken);
      if (createRes.status !== 201 || !createRes.body.success) {
        throw new Error(`Create banner failed`);
      }
      createdBannerId = createRes.body.data.id;

      const listRes = await request('GET', `/admin/categories/banners?category_id=${createdMainId}`, null, adminToken);
      if (listRes.status !== 200 || !listRes.body.success || listRes.body.data.banners.length === 0) {
        throw new Error(`Banner not found`);
      }
    });

    // 21. Delete Banner
    await test('DELETE /admin/categories/banners/:id - Banner Deletion', async () => {
      const res = await request('DELETE', `/admin/categories/banners/${createdBannerId}`, null, adminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Delete banner failed`);
    });

    // 22. Category Ordering Sequence
    await test('POST /admin/categories/reorder - Persistent Sequence Reorder', async () => {
      const res = await request('POST', '/admin/categories/reorder', {
        ordered_ids: [createdNestedId, createdSubId],
      }, adminToken);

      if (res.status !== 200 || !res.body.success) throw new Error(`Reorder failed`);
    });

    // 23. CSV Export
    await test('GET /admin/categories/export - CSV Catalog Export', async () => {
      const res = await request('GET', '/admin/categories/export', null, adminToken);
      if (res.status !== 200 || typeof res.body !== 'string' || !res.body.includes('ID,Name,Slug')) {
        throw new Error(`Export CSV failed or invalid headers`);
      }
    });

    // 24. Delete / Archive Category
    await test('DELETE & RESTORE /admin/categories/:id - Safe Deletion Lifecycle', async () => {
      // First delete leaf nested (unreferenced, so permanently deleted)
      const delNested = await request('DELETE', `/admin/categories/${createdNestedId}`, null, adminToken);
      if (delNested.status !== 200 || !delNested.body.success) throw new Error(`Delete nested failed`);

      // Archive main category
      const archMain = await request('POST', `/admin/categories/${createdMainId}/archive`, null, adminToken);
      if (archMain.status !== 200 || !archMain.body.success) throw new Error(`Archive main failed`);

      // Restore main
      const restoreMain = await request('POST', `/admin/categories/${createdMainId}/restore`, null, adminToken);
      if (restoreMain.status !== 200 || !restoreMain.body.success) throw new Error(`Restore main failed`);
    });

    console.log('\n==================================================================');
    console.log(`🏁 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================================\n');

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
}

runTestSuite();
