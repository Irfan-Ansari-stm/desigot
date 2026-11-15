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
  console.log('==================================================================');
  console.log('🧪 STARTING DESIGOT ORDERS & BOOKINGS TEST SUITE 🧪');
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
  let sampleOrderId;
  let sampleBookingId;
  let sampleDeliveryId;
  let sampleDisputeId;
  let sampleQuoteId;

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
    await test('GET /admin/orders/stats - Unified Overview KPIs', async () => {
      const res = await request('GET', '/admin/orders/stats', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Stats endpoint failed: ${JSON.stringify(res.body)}`);
      }
      const data = res.body.data;
      if (data.totalOrders === undefined || data.totalBookings === undefined) {
        throw new Error('Stats missing required count properties');
      }
      console.log(`     Total Orders: ${data.totalOrders}, Total Bookings: ${data.totalBookings}, GMV: $${(data.totalGrossCents / 100).toFixed(2)}`);
    });

    // 3. All Orders List
    await test('GET /admin/orders - Master Order Directory', async () => {
      const res = await request('GET', '/admin/orders?page=1&limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Orders list failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.orders) || res.body.orders.length === 0) {
        throw new Error('Expected orders array with seeded records');
      }
      sampleOrderId = res.body.orders[0].id;
      console.log(`     Retrieved ${res.body.orders.length} orders (Total in DB: ${res.body.pagination.total})`);
    });

    // 4. Digital Product Orders
    await test('GET /admin/orders/digital - Digital Orders Filter', async () => {
      const res = await request('GET', '/admin/orders/digital?limit=5', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Digital orders failed: ${JSON.stringify(res.body)}`);
      }
      const invalid = (res.body.orders || []).filter(o => o.listing_type !== 'asset');
      if (invalid.length > 0) throw new Error('Found non-asset order in digital filter');
      console.log(`     Total digital orders: ${res.body.pagination.total}`);
    });

    // 5. Service Orders
    await test('GET /admin/orders/services - Service Orders Filter', async () => {
      const res = await request('GET', '/admin/orders/services?limit=5', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Service orders failed: ${JSON.stringify(res.body)}`);
      }
      const invalid = (res.body.orders || []).filter(o => o.listing_type !== 'service');
      if (invalid.length > 0) throw new Error('Found non-service order in services filter');
      console.log(`     Total service orders: ${res.body.pagination.total}`);
    });

    // 6. Pending Confirmation Orders
    await test('GET /admin/orders/pending-confirmation - Pending Filter', async () => {
      const res = await request('GET', '/admin/orders/pending-confirmation?limit=5', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Pending confirmation failed: ${JSON.stringify(res.body)}`);
      }
      const invalid = (res.body.orders || []).filter(o => o.status !== 'pending');
      if (invalid.length > 0) throw new Error('Found non-pending order in pending filter');
    });

    // 7. In Progress Orders
    await test('GET /admin/orders/in-progress - In Progress Filter', async () => {
      const res = await request('GET', '/admin/orders/in-progress?limit=5', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`In progress failed: ${JSON.stringify(res.body)}`);
      }
      const invalid = (res.body.orders || []).filter(o => o.status !== 'active');
      if (invalid.length > 0) throw new Error('Found non-active order in in-progress filter');
    });

    // 8. Completed Orders
    await test('GET /admin/orders/completed - Completed Filter', async () => {
      const res = await request('GET', '/admin/orders/completed?limit=5', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Completed orders failed: ${JSON.stringify(res.body)}`);
      }
      const invalid = (res.body.orders || []).filter(o => o.status !== 'complete');
      if (invalid.length > 0) throw new Error('Found non-complete order in completed filter');
    });

    // 9. Cancelled Orders
    await test('GET /admin/orders/cancelled - Cancelled Filter', async () => {
      const res = await request('GET', '/admin/orders/cancelled?limit=5', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Cancelled orders failed: ${JSON.stringify(res.body)}`);
      }
      const invalid = (res.body.orders || []).filter(o => o.status !== 'cancelled');
      if (invalid.length > 0) throw new Error('Found non-cancelled order in cancelled filter');
    });

    // 10. Central Order Detail Workspace (16 Tabs Data)
    await test(`GET /admin/orders/:id - Central Order Workspace`, async () => {
      const res = await request('GET', `/admin/orders/${sampleOrderId}`, null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Get order details failed: ${JSON.stringify(res.body)}`);
      }
      const o = res.body.data;
      if (!o || o.id !== sampleOrderId) throw new Error('Order ID mismatch');
      if (!Array.isArray(o.items) || !Array.isArray(o.deliveries) || !Array.isArray(o.history)) {
        throw new Error('Expected items, deliveries, and history arrays in workspace payload');
      }
      console.log(`     Order #${o.id.slice(0, 8)} (${o.listing_title}), Items: ${o.items.length}, History: ${o.history.length}`);
    });

    // 11. Confirm Order Action
    await test(`POST /admin/orders/:id/confirm - Confirm Order Transition`, async () => {
      // Find a pending order to confirm
      const pendingRes = await request('GET', '/admin/orders/pending-confirmation?limit=1', null, adminToken);
      const pendingOrder = pendingRes.body.orders?.[0];
      if (pendingOrder) {
        const res = await request('POST', `/admin/orders/${pendingOrder.id}/confirm`, {
          reason: 'Verified payment confirmation and approved project start.',
        }, adminToken);
        if (res.status !== 200 || !res.body.success) {
          throw new Error(`Confirm order failed: ${JSON.stringify(res.body)}`);
        }
        if (res.body.data.status !== 'active') {
          throw new Error(`Expected order status to be active, got ${res.body.data.status}`);
        }
      }
    });

    // 12. Staff Assignment
    await test(`POST /admin/orders/:id/assign - Operational Assignment`, async () => {
      const meRes = await request('GET', '/auth/me', null, adminToken);
      const staffId = meRes.body.data?.id || meRes.body.data?.user?.id;
      const res = await request('POST', `/admin/orders/${sampleOrderId}/assign`, {
        staff_id: staffId,
        role_type: 'order_manager',
        notes: 'Assigned to supervise delivery timeline',
      }, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Assign order failed: ${JSON.stringify(res.body)}`);
      }
    });

    // 13. Add Internal Staff Note
    await test(`POST /admin/orders/:id/notes - Internal Staff Note`, async () => {
      const res = await request('POST', `/admin/orders/${sampleOrderId}/notes`, {
        note: 'Customer requested expedited delivery for upcoming board presentation.',
      }, adminToken);
      if (res.status !== 201 || !res.body.success) {
        throw new Error(`Add internal note failed: ${JSON.stringify(res.body)}`);
      }
    });

    // 14. Bookings Directory
    await test('GET /admin/orders/bookings - Master Bookings Directory', async () => {
      const res = await request('GET', '/admin/orders/bookings?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Bookings list failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.bookings) || res.body.bookings.length === 0) {
        throw new Error('Expected bookings array with seeded appointments');
      }
      sampleBookingId = res.body.bookings[0].id;
      console.log(`     Total bookings returned: ${res.body.pagination.total}`);
    });

    // 15. New Bookings
    await test('GET /admin/orders/bookings/new - New / Requested Bookings', async () => {
      const res = await request('GET', '/admin/orders/bookings/new?limit=5', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`New bookings failed: ${JSON.stringify(res.body)}`);
      }
      console.log(`     Total requested bookings: ${res.body.pagination.total}`);
    });

    // 16. Confirm Booking
    await test(`POST /admin/orders/bookings/:id/confirm - Confirm Booking`, async () => {
      const res = await request('POST', `/admin/orders/bookings/${sampleBookingId}/confirm`, {
        notes: 'Appointment confirmed with lead designer Google Meet link sent.',
      }, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Confirm booking failed: ${JSON.stringify(res.body)}`);
      }
      if (res.body.data.booking_status !== 'confirmed') {
        throw new Error(`Booking status not confirmed: ${res.body.data.booking_status}`);
      }
    });

    // 17. Reschedule Booking
    await test(`POST /admin/orders/bookings/:id/reschedule - Reschedule Appointment`, async () => {
      const res = await request('POST', `/admin/orders/bookings/${sampleBookingId}/reschedule`, {
        appointment_date: '2026-12-05',
        start_time: '15:00:00',
        end_time: '15:45:00',
        reason: 'Customer requested afternoon slot',
      }, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Reschedule booking failed: ${JSON.stringify(res.body)}`);
      }
      if (res.body.data.booking_status !== 'rescheduled') {
        throw new Error(`Booking status not rescheduled: ${res.body.data.booking_status}`);
      }
    });

    // 18. Active Projects
    await test('GET /admin/orders/projects/active - Active Projects with Dynamic Progress', async () => {
      const res = await request('GET', '/admin/orders/projects/active?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Active projects failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.projects) || res.body.projects.length === 0) {
        throw new Error('Expected projects array');
      }
      console.log(`     Total active projects: ${res.body.pagination.total}, sample progress: ${res.body.projects[0].progress}%`);
    });

    // 19. Submitted Deliveries & Review Workflow
    await test('GET & POST /admin/orders/deliveries - Delivery Review Workflow', async () => {
      const res = await request('GET', '/admin/orders/deliveries?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Deliveries list failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.deliveries) || res.body.deliveries.length === 0) {
        throw new Error('Expected deliveries array');
      }
      sampleDeliveryId = res.body.deliveries[0].id;

      const reviewRes = await request('POST', `/admin/orders/deliveries/${sampleDeliveryId}/review`, {
        review_status: 'approved',
        notes: 'Quality inspection verified. Color tokens and responsive breakpoints complete.',
      }, adminToken);
      if (reviewRes.status !== 200 || !reviewRes.body.success) {
        throw new Error(`Review delivery failed: ${JSON.stringify(reviewRes.body)}`);
      }
      if (reviewRes.body.data.review_status !== 'approved') {
        throw new Error(`Delivery status not updated: ${reviewRes.body.data.review_status}`);
      }
    });

    // 20. Revision Requests
    await test('GET /admin/orders/revisions - Revision Requests Directory', async () => {
      const res = await request('GET', '/admin/orders/revisions?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Revisions list failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.revisions) || res.body.revisions.length === 0) {
        throw new Error('Expected revisions array');
      }
      console.log(`     Total revisions: ${res.body.pagination.total}`);
    });

    // 21. Disputed Orders & Dispute Resolution
    await test('GET & POST /admin/orders/disputes - Dispute Investigation & Resolution', async () => {
      const res = await request('GET', '/admin/orders/disputes?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Disputes list failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.disputes) || res.body.disputes.length === 0) {
        throw new Error('Expected disputes array');
      }
      sampleDisputeId = res.body.disputes[0].id;

      const resolveRes = await request('POST', `/admin/orders/disputes/${sampleDisputeId}/resolve`, {
        outcome: 'partial_refund',
        outcome_notes: 'Resolution confirmed by lead dispute mediator.',
        refund_amount_cents: 15000,
      }, adminToken);
      if (resolveRes.status !== 200 || !resolveRes.body.success) {
        throw new Error(`Resolve dispute failed: ${JSON.stringify(resolveRes.body)}`);
      }
      if (resolveRes.body.data.status !== 'resolved') {
        throw new Error(`Dispute status not resolved: ${resolveRes.body.data.status}`);
      }
    });

    // 22. Custom Quotes & Conversion
    await test('GET & POST /admin/orders/quotes - Custom Quotes & Order Conversion', async () => {
      const res = await request('GET', '/admin/orders/quotes?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Quotes list failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.quotes) || res.body.quotes.length === 0) {
        throw new Error('Expected quotes array');
      }
      // Find unconverted quote
      const unconverted = res.body.quotes.find(q => !q.converted_order_id && q.status === 'accepted') || res.body.quotes[0];
      sampleQuoteId = unconverted.id;

      if (!unconverted.converted_order_id) {
        const convertRes = await request('POST', `/admin/orders/quotes/${sampleQuoteId}/convert`, {}, adminToken);
        if (convertRes.status !== 201 || !convertRes.body.success) {
          throw new Error(`Convert quote failed: ${JSON.stringify(convertRes.body)}`);
        }
        if (!convertRes.body.data?.id) {
          throw new Error('Expected converted order in response');
        }
        console.log(`     Quote #${unconverted.quote_number} successfully converted to Order #${convertRes.body.data.id.slice(0, 8)}`);
      }
    });

    // 23. Order History Timeline
    await test('GET /admin/orders/history - Append-Only Order History Audit', async () => {
      const res = await request('GET', '/admin/orders/history?limit=10', null, adminToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Order history failed: ${JSON.stringify(res.body)}`);
      }
      if (!Array.isArray(res.body.history) || res.body.history.length === 0) {
        throw new Error('Expected history array');
      }
      console.log(`     Total historical order events in DB: ${res.body.pagination.total}`);
    });

    // 24. CSV Export
    await test('GET /admin/orders/export - CSV Export', async () => {
      const res = await request('GET', '/admin/orders/export', null, adminToken);
      if (res.status !== 200) {
        throw new Error(`Export failed with status: ${res.status}`);
      }
      if (typeof res.body !== 'string' || !res.body.includes('Order ID')) {
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
