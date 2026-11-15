'use strict';
require('dotenv').config();
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
  console.log('==================================================================');
  console.log('🧪 STARTING DESIGOT DIGITAL PRODUCT MANAGEMENT TEST SUITE 🧪');
  console.log('==================================================================\n');

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      console.log(`[Test Server] Listening on ${baseUrl}`);
      resolve();
    });
  });

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // 1. Authenticate as Super Admin
    console.log('\n--- 1. Authentication ---');
    const loginRes = await request('POST', '/auth/login', {
      email: 'superadmin@desigot.com',
      password: 'Password123!',
    });
    assert(loginRes.status === 200, 'Super Admin login successful');
    const token = loginRes.body?.data?.accessToken || loginRes.body?.token;
    assert(!!token, 'Access token received');

    // 2. Overview Stats
    console.log('\n--- 2. Product Stats Endpoint ---');
    const statsRes = await request('GET', '/admin/digital-products/stats', null, token);
    assert(statsRes.status === 200, 'GET /admin/digital-products/stats returns 200');
    assert(statsRes.body.data?.totalProducts >= 10, `Total products >= 10 (actual: ${statsRes.body.data?.totalProducts})`);
    assert(statsRes.body.data?.publishedProducts >= 5, `Published products >= 5 (actual: ${statsRes.body.data?.publishedProducts})`);
    assert(statsRes.body.data?.totalLicenses >= 4, `Total licenses >= 4 (actual: ${statsRes.body.data?.totalLicenses})`);

    // 3. Product Listing & Filtering
    console.log('\n--- 3. Product Catalog Queries ---');
    const allRes = await request('GET', '/admin/digital-products', null, token);
    assert(allRes.status === 200, 'GET /admin/digital-products returns 200');
    assert(Array.isArray(allRes.body.products), 'Products is an array');

    const publishedRes = await request('GET', '/admin/digital-products?status=published', null, token);
    assert(publishedRes.status === 200, 'Filter by status=published returns 200');
    assert(publishedRes.body.products.every(p => p.status === 'published'), 'All items returned have status=published');

    const pendingRes = await request('GET', '/admin/digital-products?status=pending_review', null, token);
    assert(pendingRes.status === 200, 'Filter by status=pending_review returns 200');
    assert(pendingRes.body.products.every(p => p.status === 'pending_review'), 'All items returned have status=pending_review');

    const featuredRes = await request('GET', '/admin/digital-products?is_featured=true', null, token);
    assert(featuredRes.status === 200, 'Filter by is_featured=true returns 200');
    assert(featuredRes.body.products.every(p => p.is_featured === true), 'All items returned are featured');

    // 4. Create Product (Wizard step simulation)
    console.log('\n--- 4. Product Creation & Lifecycle ---');
    const createRes = await request('POST', '/admin/digital-products', {
      title: 'Automated Test Kit Pro 2026',
      short_description: 'High-performance testing design assets bundle',
      description: 'Comprehensive test kit containing UI mocks, badges, and tokens.',
      price_personal_cents: 2900,
      price_commercial_cents: 7900,
      price_extended_cents: 19900,
      price_enterprise_cents: 49900,
      file_formats: ['.fig', '.svg'],
      software_compatibility: ['Figma', 'Framer'],
      tags: ['test', 'automated', 'ui-kit'],
      thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    }, token);

    assert(createRes.status === 201, 'POST /admin/digital-products returns 201');
    const newProd = createRes.body.data;
    assert(newProd?.title === 'Automated Test Kit Pro 2026', 'New product title matches');
    assert(newProd?.status === 'draft', 'Initial status is draft');

    // 5. Product Detail View
    console.log('\n--- 5. Product Detail 14-Tab Data ---');
    const detailRes = await request('GET', `/admin/digital-products/${newProd.id}`, null, token);
    assert(detailRes.status === 200, 'GET /admin/digital-products/:id returns 200');
    assert(Array.isArray(detailRes.body.data.licenses), 'Product has license assignments');
    assert(Array.isArray(detailRes.body.data.versions), 'Product has version history');
    assert(Array.isArray(detailRes.body.data.moderation_history), 'Product has moderation history');

    // 6. Moderation: Approve
    console.log('\n--- 6. Moderation Workflow ---');
    const approveRes = await request('POST', `/admin/digital-products/${newProd.id}/approve`, {
      notes: 'Approved by Automated Quality Gate',
    }, token);
    assert(approveRes.status === 200, 'POST /:id/approve returns 200');
    assert(approveRes.body.data.status === 'published', 'Product status is now published');

    // 7. Feature Toggle
    console.log('\n--- 7. Feature Management ---');
    const featureRes = await request('POST', `/admin/digital-products/${newProd.id}/feature`, {
      is_featured: true,
      position: 5,
      featured_type: 'staff_pick',
    }, token);
    assert(featureRes.status === 200, 'POST /:id/feature returns 200');
    assert(featureRes.body.data.is_featured === true, 'Product is marked featured');

    // 8. Files Manager
    console.log('\n--- 8. Files Manager ---');
    const filesListRes = await request('GET', '/admin/digital-products/files', null, token);
    assert(filesListRes.status === 200, 'GET /admin/digital-products/files returns 200');
    assert(filesListRes.body.files?.length > 0, 'Files catalog has items');

    const addFileRes = await request('POST', '/admin/digital-products/files', {
      product_id: newProd.id,
      file_name: 'test-bundle.fig',
      file_size_bytes: 8492000,
      mime_type: 'application/octet-stream',
      file_format: '.fig',
      is_primary: true,
    }, token);
    assert(addFileRes.status === 201, 'POST /admin/digital-products/files returns 201');
    const fileId = addFileRes.body.data.id;

    // 9. Licenses Manager
    console.log('\n--- 9. Licenses Manager ---');
    const licRes = await request('GET', '/admin/digital-products/licenses', null, token);
    assert(licRes.status === 200, 'GET /admin/digital-products/licenses returns 200');
    assert(licRes.body.data?.length >= 5, 'Found 5 standard license templates');

    // 10. Versions Manager
    console.log('\n--- 10. Versions Manager ---');
    const verListRes = await request('GET', '/admin/digital-products/versions', null, token);
    assert(verListRes.status === 200, 'GET /admin/digital-products/versions returns 200');

    const newVerRes = await request('POST', '/admin/digital-products/versions', {
      product_id: newProd.id,
      version_string: '2.0.0',
      release_notes: 'Major 2.0 release with 50 new components',
      changelog: '- Rebuilt with auto-layout v5\n- Added dark mode',
      is_current: true,
    }, token);
    assert(newVerRes.status === 201, 'POST /admin/digital-products/versions returns 201');

    // 11. Downloads & Signed URL Generation
    console.log('\n--- 11. Secure Downloads ---');
    const dlRes = await request('GET', '/admin/digital-products/downloads', null, token);
    assert(dlRes.status === 200, 'GET /admin/digital-products/downloads returns 200');

    const signRes = await request('POST', '/admin/digital-products/downloads/signed-url', {
      productId: newProd.id,
      fileId: fileId,
    }, token);
    assert(signRes.status === 200, 'POST /downloads/signed-url returns 200');
    assert(signRes.body.data?.downloadUrl?.includes('token='), 'Signed URL generated with security token');

    // 12. Sales History
    console.log('\n--- 12. Sales History ---');
    const salesRes = await request('GET', '/admin/digital-products/sales', null, token);
    assert(salesRes.status === 200, 'GET /admin/digital-products/sales returns 200');

    // 13. Refunds Queue & Resolution
    console.log('\n--- 13. Refunds Queue ---');
    const refRes = await request('GET', '/admin/digital-products/refunds', null, token);
    assert(refRes.status === 200, 'GET /admin/digital-products/refunds returns 200');
    const firstRefund = refRes.body.refunds?.[0];
    if (firstRefund) {
      const resolveRes = await request('POST', `/admin/digital-products/refunds/${firstRefund.id}/resolve`, {
        resolution: 'approve',
        notes: 'Test refund approval verified by system tests.',
      }, token);
      assert(resolveRes.status === 200, 'POST /refunds/:id/resolve returns 200');
      assert(resolveRes.body.data.status === 'refunded', 'Refund status updated to refunded');
    }

    // 14. Product Duplication
    console.log('\n--- 14. Product Duplication ---');
    const dupRes = await request('POST', `/admin/digital-products/${newProd.id}/duplicate`, {}, token);
    assert(dupRes.status === 201, 'POST /:id/duplicate returns 201');
    assert(dupRes.body.data?.title?.includes('(Copy)'), 'Cloned product title includes (Copy)');

    // 15. Cleanup / Delete
    console.log('\n--- 15. Product Cleanup ---');
    const delRes = await request('DELETE', `/admin/digital-products/${newProd.id}`, null, token);
    assert(delRes.status === 200, 'DELETE /admin/digital-products/:id returns 200');
    const delDupRes = await request('DELETE', `/admin/digital-products/${dupRes.body.data.id}`, null, token);
    assert(delDupRes.status === 200, 'DELETE cloned product returns 200');

  } catch (err) {
    console.error('💥 Test suite runtime exception:', err);
    failCount++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await primaryPool.end();
  }

  console.log('\n==================================================================');
  console.log(`🏁 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('==================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
