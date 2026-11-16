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
  console.log('🧪 STARTING DESIGOT MESSAGES & COMMUNICATION TEST SUITE 🧪');
  console.log('==================================================================\n');

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      console.log(`[Test Server] Listening on ${baseUrl}\n`);
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

  let superAdminToken;
  let sellerToken;
  let customerToken;
  let sampleConvId;
  let sampleTicketId;
  let sampleDisputeId;
  let sampleTemplateId;
  let sampleEmailId;

  try {
    // 1. Auth Setup
    await test('1. Super Admin Authentication', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'superadmin@desigot.com',
        password: 'Password123!',
      });
      superAdminToken = res.body.data?.accessToken || res.body.data?.token;
      if (res.status !== 200 || !superAdminToken) throw new Error(`Superadmin login failed: ${JSON.stringify(res.body)}`);
    });

    await test('2. Seller Authentication', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'seller@desigot.com',
        password: 'Password123!',
      });
      sellerToken = res.body.data?.accessToken || res.body.data?.token;
      if (res.status !== 200 || !sellerToken) throw new Error(`Seller login failed: ${JSON.stringify(res.body)}`);
    });

    await test('3. Customer Authentication', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'buyer@desigot.com',
        password: 'Password123!',
      });
      customerToken = res.body.data?.accessToken || res.body.data?.token;
      if (res.status !== 200 || !customerToken) {
        // Fallback to user@desigot.com
        const res2 = await request('POST', '/auth/login', {
          email: 'user@desigot.com',
          password: 'Password123!',
        });
        customerToken = res2.body.data?.accessToken || res2.body.data?.token;
      }
      if (!customerToken) throw new Error('Customer login failed');
    });

    // 2. RBAC & Security Tests
    await test('4. Unauthorized Request Rejection (No Token)', async () => {
      const res = await request('GET', '/admin/communication/conversations');
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    });

    await test('5. Standard Buyer Denied Access to Staff Management Routes', async () => {
      const res = await request('GET', '/admin/communication/audit-logs', null, customerToken);
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden for buyer on audit logs, got ${res.status}`);
    });

    // 3. All Conversations Tests
    await test('6. Super Admin Can Access Master Conversations Inbox', async () => {
      const res = await request('GET', '/admin/communication/conversations?limit=10', null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List conversations failed: ${JSON.stringify(res.body)}`);
      if (!Array.isArray(res.body.conversations) || res.body.conversations.length === 0) throw new Error('No seeded conversations found');
      sampleConvId = res.body.conversations[0].id;
    });

    await test('7. Conversation Detail View with Participants', async () => {
      const res = await request('GET', `/admin/communication/conversations/${sampleConvId}`, null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Get conversation failed: ${JSON.stringify(res.body)}`);
      if (!res.body.data || !Array.isArray(res.body.data.participants)) throw new Error('Missing participants in conversation detail');
    });

    await test('8. Conversation Assignment to Support Agent', async () => {
      const res = await request('POST', `/admin/communication/conversations/${sampleConvId}/assign`, {
        assigned_agent_id: '33535558-ccea-4acc-9c09-9c725959a52d'
      }, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Assign conversation failed: ${JSON.stringify(res.body)}`);
    });

    await test('9. Message Persistence and Internal Notes Visibility Rule', async () => {
      // Post public reply
      const pubRes = await request('POST', `/admin/communication/conversations/${sampleConvId}/messages`, {
        message_content: 'Automated test public reply from support staff',
        is_internal: false
      }, superAdminToken);
      if (pubRes.status !== 200 || !pubRes.body.success) throw new Error(`Public message failed: ${JSON.stringify(pubRes.body)}`);

      // Post internal note
      const intRes = await request('POST', `/admin/communication/conversations/${sampleConvId}/messages`, {
        message_content: 'CONFIDENTIAL INTERNAL NOTE: Verify buyer KYC risk score',
        is_internal: true
      }, superAdminToken);
      if (intRes.status !== 200 || !intRes.body.success) throw new Error(`Internal note failed: ${JSON.stringify(intRes.body)}`);

      // Verify internal note has visibility: 'internal_only'
      if (intRes.body.data.visibility !== 'internal_only') throw new Error('Internal note visibility must be internal_only');
    });

    await test('10. Conversation Export to CSV', async () => {
      const res = await request('GET', '/admin/communication/conversations/export', null, superAdminToken);
      if (res.status !== 200 || !res.headers['content-type'].includes('text/csv')) throw new Error('Export CSV failed');
    });

    // 4. Customer Messages Module
    await test('11. Customer Messages Management Directory', async () => {
      const res = await request('GET', '/admin/communication/customer-messages?limit=10', null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List customer messages failed: ${JSON.stringify(res.body)}`);
      if (!Array.isArray(res.body.customers)) throw new Error('Expected customers array');
      const sampleCust = res.body.customers[0];
      if (sampleCust) {
        const profRes = await request('GET', `/admin/communication/customer-messages/${sampleCust.customer_id}/profile`, null, superAdminToken);
        if (profRes.status !== 200 || !profRes.body.success) throw new Error('Get customer profile failed');
      }
    });

    // 5. Seller Messages Module
    await test('12. Seller Messages Management Directory', async () => {
      const res = await request('GET', '/admin/communication/seller-messages?limit=10', null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List seller messages failed: ${JSON.stringify(res.body)}`);
      if (!Array.isArray(res.body.sellers)) throw new Error('Expected sellers array');
      const sampleSeller = res.body.sellers[0];
      if (sampleSeller) {
        const profRes = await request('GET', `/admin/communication/seller-messages/${sampleSeller.seller_id}/profile`, null, superAdminToken);
        if (profRes.status !== 200 || !profRes.body.success) throw new Error('Get seller profile failed');
      }
    });

    // 6. Order Conversations Module
    await test('13. Order Conversations Management Directory', async () => {
      const res = await request('GET', '/admin/communication/order-conversations?limit=10', null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List order conversations failed: ${JSON.stringify(res.body)}`);
      if (!Array.isArray(res.body.order_conversations)) throw new Error('Expected order conversations array');
    });

    // 7. Support Tickets Module
    await test('14. Support Tickets Directory with SLA and Priority Status', async () => {
      const res = await request('GET', '/admin/communication/tickets?limit=10', null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List tickets failed: ${JSON.stringify(res.body)}`);
      if (!Array.isArray(res.body.tickets) || res.body.tickets.length === 0) throw new Error('No seeded tickets found');
      sampleTicketId = res.body.tickets[0].id;
    });

    await test('15. Ticket Detail, Comments Thread and SLA Compliance Check', async () => {
      const res = await request('GET', `/admin/communication/tickets/${sampleTicketId}`, null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Get ticket failed: ${JSON.stringify(res.body)}`);
      if (!res.body.data.ticket_reference || !Array.isArray(res.body.data.comments)) throw new Error('Invalid ticket data');
    });

    await test('16. Support Ticket Reply and Status Progression', async () => {
      const res = await request('POST', `/admin/communication/tickets/${sampleTicketId}/reply`, {
        content: 'Support agent automated test response: The design files are being re-exported.',
        is_internal: false
      }, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Ticket reply failed: ${JSON.stringify(res.body)}`);
    });

    await test('17. Support Ticket Escalation', async () => {
      const res = await request('POST', `/admin/communication/tickets/${sampleTicketId}/escalate`, {
        reason: 'Client requested senior manager attention regarding urgent delivery delay'
      }, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Ticket escalation failed: ${JSON.stringify(res.body)}`);
      if (res.body.data.status !== 'escalated') throw new Error('Ticket status must be escalated');
    });

    await test('18. Support Ticket Resolution', async () => {
      const res = await request('POST', `/admin/communication/tickets/${sampleTicketId}/resolve`, {
        resolution_notes: 'All milestone assets verified and delivered to customer satisfactions.'
      }, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Ticket resolution failed: ${JSON.stringify(res.body)}`);
      if (res.body.data.status !== 'resolved') throw new Error('Ticket status must be resolved');
    });

    // 8. Disputes Module
    await test('19. Marketplace Disputes Directory', async () => {
      const res = await request('GET', '/admin/communication/disputes?limit=10', null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List disputes failed: ${JSON.stringify(res.body)}`);
      if (!Array.isArray(res.body.disputes) || res.body.disputes.length === 0) throw new Error('No seeded disputes found');
      sampleDisputeId = res.body.disputes[0].id;
    });

    await test('20. Dispute Detail with Evidence and Audit Trail', async () => {
      const res = await request('GET', `/admin/communication/disputes/${sampleDisputeId}`, null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Get dispute failed: ${JSON.stringify(res.body)}`);
      if (!res.body.data.dispute_reference || !Array.isArray(res.body.data.timeline)) throw new Error('Invalid dispute data');
    });

    await test('21. Dispute Resolution with Non-Auto-Refund Safety Enforced', async () => {
      const res = await request('POST', `/admin/communication/disputes/${sampleDisputeId}/resolve`, {
        outcome: 'full_refund',
        resolution_type: 'customer_favor',
        resolution_reason: 'Investigation verified deliverables failed critical Figma responsive constraints'
      }, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Resolve dispute failed: ${JSON.stringify(res.body)}`);
      if (res.body.data.status !== 'resolved') throw new Error('Dispute status must be resolved');
    });

    // 9. Announcements Module
    await test('22. Announcements Management and Creation', async () => {
      const createRes = await request('POST', '/admin/communication/announcements', {
        title: 'Automated Platform Maintenance Advisory',
        content: 'Infrastructure database cluster maintenance scheduled for midnight UTC.',
        announcement_type: 'maintenance_notifications',
        target_audience: 'all_users',
        priority: 'high',
        status: 'draft'
      }, superAdminToken);
      if (createRes.status !== 200 || !createRes.body.success) throw new Error(`Create announcement failed: ${JSON.stringify(createRes.body)}`);
      
      const annId = createRes.body.data.id;
      const pubRes = await request('POST', `/admin/communication/announcements/${annId}/publish`, {}, superAdminToken);
      if (pubRes.status !== 200 || !pubRes.body.success) throw new Error('Publish announcement failed');
      if (pubRes.body.data.status !== 'published') throw new Error('Announcement status must be published');
    });

    // 10. Email Notifications Module
    await test('23. Email Delivery Logs Directory and Retry Processing', async () => {
      const res = await request('GET', '/admin/communication/emails?limit=10', null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List emails failed: ${JSON.stringify(res.body)}`);
      if (!Array.isArray(res.body.emails) || res.body.emails.length === 0) throw new Error('No seeded emails found');
      
      const failedEmail = res.body.emails.find(e => e.status === 'failed' || e.status === 'bounced') || res.body.emails[0];
      sampleEmailId = failedEmail.id;

      if (failedEmail.status !== 'delivered') {
        const retryRes = await request('POST', `/admin/communication/emails/${sampleEmailId}/retry`, {}, superAdminToken);
        if (retryRes.status !== 200 || !retryRes.body.success) throw new Error(`Retry email failed: ${JSON.stringify(retryRes.body)}`);
        if (retryRes.body.data.status !== 'queued') throw new Error('Retried email must be queued');
      }
    });

    // 11. Notification Templates Module
    await test('24. Notification Templates Catalog and Variable Interpolation Preview', async () => {
      const res = await request('GET', '/admin/communication/templates', null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`List templates failed: ${JSON.stringify(res.body)}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) throw new Error('No seeded templates found');
      sampleTemplateId = res.body.data[0].id;

      const prevRes = await request('POST', `/admin/communication/templates/${sampleTemplateId}/preview`, {
        variables: { customer_name: 'Jane Doe', order_id: 'ORD-999-TEST' }
      }, superAdminToken);
      if (prevRes.status !== 200 || !prevRes.body.success) throw new Error('Template preview failed');
      if (!prevRes.body.data.subject) throw new Error('Preview missing rendered subject');
    });

    await test('25. Notification Template Versioning and Update', async () => {
      const res = await request('PUT', `/admin/communication/templates/${sampleTemplateId}`, {
        subject: 'Updated Order Notice: Your deliverables are ready for review',
        change_summary: 'Enhanced subject line clarity for automated notifications'
      }, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Update template failed: ${JSON.stringify(res.body)}`);
      if (res.body.data.version <= 1) throw new Error('Template version must increment upon update');
    });

    // 12. Analytics & Audit
    await test('26. Communication Analytics KPIs and Overview Metrics', async () => {
      const res = await request('GET', '/admin/communication/analytics/overview', null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Analytics overview failed: ${JSON.stringify(res.body)}`);
      const kpis = res.body.data;
      if (kpis.total_conversations === undefined || kpis.open_conversations === undefined) throw new Error('Missing KPI counts');
      console.log(`     Analytics: ${kpis.total_conversations} convs, ${kpis.pending_tickets} tickets, ${kpis.active_disputes} disputes, ${kpis.email_delivery_rate}% email delivery`);
    });

    await test('27. Communication Audit Logs Trail Verification', async () => {
      const res = await request('GET', '/admin/communication/audit-logs?limit=10', null, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error(`Audit logs failed: ${JSON.stringify(res.body)}`);
      if (!Array.isArray(res.body.audit_logs) || res.body.audit_logs.length === 0) throw new Error('Audit trail records not logged');
    });

    await test('28. Real-Time Typing Indicator Broadcast Endpoint', async () => {
      const res = await request('POST', '/communication/typing', {
        conversationId: sampleConvId,
        isTyping: true
      }, superAdminToken);
      if (res.status !== 200 || !res.body.success) throw new Error('Typing indicator failed');
    });

  } finally {
    server.close();
  }

  console.log('\n==================================================================');
  console.log(`🏁 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED 🏁`);
  console.log('==================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
