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
  console.log('🧪 STARTING DESIGOT CUSTOMER MANAGEMENT TEST SUITE 🧪');
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

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passCount++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failCount++;
    }
  }

  let adminToken;
  let sampleCustomerId;
  let sampleBookingId;
  let sampleReviewId;
  let sampleComplaintId;
  let sampleTagId;

  try {
    // 1. Auth Login
    await test('Super Admin Authentication', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'superadmin@desigot.com',
        password: 'Password123!',
      });
      const token = res.body.data?.accessToken || res.body.data?.token;
      if (res.status !== 200 || !token) {
        throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
      }
      adminToken = token;
    });

    // 2. Stats
    await test('GET /admin/customers/stats - Overview Metrics', async () => {
      const res = await request('GET', '/admin/customers/stats', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Stats endpoint failed: ${JSON.stringify(res.body)}`);
      }
      const data = res.body.data;
      if (data.total_customers === undefined || data.active_customers === undefined) {
        throw new Error('Stats missing customer counts');
      }
      console.log(`     Total customers in DB: ${data.total_customers}, Active: ${data.active_customers}`);
    });

    // 3. List Customers
    await test('GET /admin/customers - List & Pagination', async () => {
      const res = await request('GET', '/admin/customers?page=1&limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`List customers failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.customers) || res.body.customers.length === 0) {
        throw new Error('Expected customers array to contain seeded records');
      }
      sampleCustomerId = res.body.customers[0].id;
      console.log(`     Retrieved ${res.body.customers.length} customers (Total: ${res.body.pagination.total})`);
    });

    // 4. Active Customers
    await test('GET /admin/customers/active - Active Filter Shortcut', async () => {
      const res = await request('GET', '/admin/customers/active?limit=5', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Active customers failed: ${JSON.stringify(res.body)}`);
      }
      const nonActive = (res.body.customers || []).filter(c => c.account_status !== 'active');
      if (nonActive.length > 0) {
        throw new Error(`Found non-active customer in active list`);
      }
    });

    // 5. Inactive Customers
    await test('GET /admin/customers/inactive - Inactive Filter Shortcut', async () => {
      const res = await request('GET', '/admin/customers/inactive?limit=5', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Inactive customers failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.customers)) {
        throw new Error(`Expected array of customers`);
      }
    });

    // 6. Customer Details (13 data facets)
    await test(`GET /admin/customers/:id - 13 Tab Detail Facet`, async () => {
      const res = await request('GET', `/admin/customers/${sampleCustomerId}`, null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Get customer details failed: ${JSON.stringify(res.body)}`);
      }
      const c = res.body.data;
      if (!c || c.id !== sampleCustomerId) {
        throw new Error('Customer ID mismatch');
      }
      if (!Array.isArray(c.addresses) || !Array.isArray(c.orders) || !Array.isArray(c.bookings)) {
        throw new Error('Expected arrays for addresses, orders, and bookings');
      }
      console.log(`     Customer: ${c.name} (${c.email}), Orders: ${c.orders.length}, Bookings: ${c.bookings.length}`);
    });

    // 7. Update Customer Profile
    await test(`PUT /admin/customers/:id - Update Customer Details`, async () => {
      const res = await request('PUT', `/admin/customers/${sampleCustomerId}`, {
        first_name: 'Rahul',
        last_name: 'Sharma Verified',
        company: 'Sharma Studios Ltd',
      }, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Update customer failed: ${JSON.stringify(res.body)}`);
      }
      if (res.body.data.name !== 'Rahul Sharma Verified') {
        throw new Error(`Customer name not updated: ${res.body.data.name}`);
      }
    });

    // 8. Internal Note
    let createdNoteId;
    await test(`POST & DELETE /admin/customers/:id/notes - Internal Notes`, async () => {
      const res = await request('POST', `/admin/customers/${sampleCustomerId}/notes`, {
        note: 'Customer requested priority support for Figma deliverables.',
      }, adminToken);
      if (res.status !== 201 || !res.body.success) {
        throw new Error(`Add note failed: ${JSON.stringify(res.body)}`);
      }
      createdNoteId = res.body.data.id;

      const delRes = await request('DELETE', `/admin/customers/${sampleCustomerId}/notes/${createdNoteId}`, null, adminToken);
      if (delRes.status !== 200 || !delRes.body.success) {
        throw new Error(`Delete note failed: ${JSON.stringify(delRes.body)}`);
      }
    });

    // 9. Addresses
    let createdAddressId;
    await test(`POST & DELETE /admin/customers/:id/addresses - Address Book`, async () => {
      const res = await request('POST', `/admin/customers/${sampleCustomerId}/addresses`, {
        address_type: 'shipping',
        street_address: '123 Tech Park Blvd',
        city: 'Bengaluru',
        state: 'Karnataka',
        postal_code: '560001',
        country: 'India',
        is_default: true,
      }, adminToken);
      if (res.status !== 201 || !res.body.success) {
        throw new Error(`Add address failed: ${JSON.stringify(res.body)}`);
      }
      createdAddressId = res.body.data.id;

      const delRes = await request('DELETE', `/admin/customers/${sampleCustomerId}/addresses/${createdAddressId}`, null, adminToken);
      if (delRes.status !== 200 || !delRes.body.success) {
        throw new Error(`Delete address failed: ${JSON.stringify(delRes.body)}`);
      }
    });

    // 10. Tags Management
    await test(`GET /admin/customers/tags & Assign/Remove Tag`, async () => {
      const tagsRes = await request('GET', '/admin/customers/tags', null, adminToken);
      if (tagsRes.status !== 200 || !tagsRes.body.success) {
        throw new Error(`List tags failed: ${JSON.stringify(tagsRes.body)}`);
      }
      if (!Array.isArray(tagsRes.body.data) || tagsRes.body.data.length === 0) {
        throw new Error('No tags returned');
      }
      sampleTagId = tagsRes.body.data[0].id;

      const assignRes = await request('POST', `/admin/customers/${sampleCustomerId}/tags`, {
        tag_id: sampleTagId,
      }, adminToken);
      if (assignRes.status !== 200 || !assignRes.body.success) {
        throw new Error(`Assign tag failed: ${JSON.stringify(assignRes.body)}`);
      }

      const removeRes = await request('DELETE', `/admin/customers/${sampleCustomerId}/tags/${sampleTagId}`, null, adminToken);
      if (removeRes.status !== 200 || !removeRes.body.success) {
        throw new Error(`Remove tag failed: ${JSON.stringify(removeRes.body)}`);
      }
    });

    // 11. Customer Orders
    await test('GET /admin/customers/orders - Global Orders List', async () => {
      const res = await request('GET', '/admin/customers/orders?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Customer orders failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.orders) || res.body.orders.length === 0) {
        throw new Error('Expected orders array to contain seeded orders');
      }
      console.log(`     Total customer orders returned: ${res.body.pagination.total}`);
    });

    // 12. Customer Bookings
    await test('GET /admin/customers/bookings - Global Bookings List', async () => {
      const res = await request('GET', '/admin/customers/bookings?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Customer bookings failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.bookings) || res.body.bookings.length === 0) {
        throw new Error('Expected bookings array to contain seeded bookings');
      }
      sampleBookingId = res.body.bookings[0].id;
      console.log(`     Total customer bookings returned: ${res.body.pagination.total}`);
    });

    // 13. Update Booking Status
    await test(`POST /admin/customers/bookings/:id/status - Status Transition`, async () => {
      const res = await request('POST', `/admin/customers/bookings/${sampleBookingId}/status`, {
        status: 'in_progress',
        notes: 'Session kicked off by lead designer',
      }, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Update booking status failed: ${JSON.stringify(res.body)}`);
      }
      if (res.body.data.status !== 'in_progress') {
        throw new Error(`Booking status not updated: ${res.body.data.status}`);
      }
    });

    // 14. Customer Reviews
    await test('GET /admin/customers/reviews - Global Reviews List', async () => {
      const res = await request('GET', '/admin/customers/reviews?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Customer reviews failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.reviews) || res.body.reviews.length === 0) {
        throw new Error('Expected reviews array to contain seeded reviews');
      }
      sampleReviewId = res.body.reviews[0].id;
      console.log(`     Total customer reviews returned: ${res.body.pagination.total}`);
    });

    // 15. Moderate Review
    await test(`POST /admin/customers/reviews/:id/moderate - Moderation Action`, async () => {
      const res = await request('POST', `/admin/customers/reviews/${sampleReviewId}/moderate`, {
        status: 'approved',
        notes: 'Verified review adheres to community standards.',
      }, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Moderate review failed: ${JSON.stringify(res.body)}`);
      }
      if (res.body.data.status !== 'approved') {
        throw new Error(`Review status not updated: ${res.body.data.status}`);
      }
    });

    // 16. Complaints / Tickets
    await test('GET /admin/customers/complaints - Global Complaints List', async () => {
      const res = await request('GET', '/admin/customers/complaints?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Customer complaints failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.complaints) || res.body.complaints.length === 0) {
        throw new Error('Expected complaints array to contain seeded records');
      }
      sampleComplaintId = res.body.complaints[0].id;
      console.log(`     Total customer complaints returned: ${res.body.pagination.total}`);
    });

    // 17. Complaint Detail & Messaging
    await test(`GET & POST /admin/customers/complaints/:id - Conversation Thread`, async () => {
      const res = await request('GET', `/admin/customers/complaints/${sampleComplaintId}`, null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Get complaint detail failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.data.messages)) {
        throw new Error('Expected complaint messages array');
      }

      // Add a support message
      const msgRes = await request('POST', `/admin/customers/complaints/${sampleComplaintId}/messages`, {
        message: 'We are actively investigating this delivery with the seller.',
        is_internal_note: false,
      }, adminToken);
      if (msgRes.status !== 201 || !msgRes.body.success) {
        throw new Error(`Add complaint message failed: ${JSON.stringify(msgRes.body)}`);
      }

      // Add an internal support note
      const internalRes = await request('POST', `/admin/customers/complaints/${sampleComplaintId}/messages`, {
        message: 'Internal review: Seller has submitted zip archive. Checking integrity.',
        is_internal_note: true,
      }, adminToken);
      if (internalRes.status !== 201 || !internalRes.body.success) {
        throw new Error(`Add internal complaint note failed: ${JSON.stringify(internalRes.body)}`);
      }
    });

    // 18. Customer Activity Log
    await test('GET /admin/customers/activity - Timeline Audit Log', async () => {
      const res = await request('GET', '/admin/customers/activity?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Customer activity failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.events) || res.body.events.length === 0) {
        throw new Error('Expected customer activity events to exist');
      }
      console.log(`     Total customer activity events returned: ${res.body.pagination.total}`);
    });

    // 19. Export to CSV
    await test('GET /admin/customers/export - CSV Export', async () => {
      const res = await request('GET', '/admin/customers/export', null, adminToken);
      if (res.status !== 200) {
        throw new Error(`Export failed with status: ${res.status}`);
      }
      if (typeof res.body !== 'string' || !res.body.includes('Email')) {
        throw new Error('Export did not return valid CSV content');
      }
      console.log(`     CSV Export content length: ${res.body.length} characters`);
    });

  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n==================================================================');
  console.log(`🏁 TEST SUITE COMPLETED: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('==================================================================');
  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
