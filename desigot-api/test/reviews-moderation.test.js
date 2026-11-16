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
  console.log('🧪 STARTING DESIGOT REVIEWS & MODERATION TEST SUITE 🧪');
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
  let sampleReviewId;
  let samplePendingId;
  let sampleReportId;
  let sampleResponseId;
  let sampleRuleId;
  let sampleProductId;
  let sampleServiceId;

  try {
    // ── 1. AUTHENTICATION SETUP ───────────────────────────────────────────────
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
        const res2 = await request('POST', '/auth/login', {
          email: 'user@desigot.com',
          password: 'Password123!',
        });
        customerToken = res2.body.data?.accessToken || res2.body.data?.token;
      }
      if (!customerToken) throw new Error('Customer login failed');
    });

    // ── 2. RBAC & SECURITY TESTS ──────────────────────────────────────────────
    await test('4. Unauthorized Request Rejection (No Token)', async () => {
      const res = await request('GET', '/admin/reviews/stats/summary');
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, received ${res.status}`);
    });

    await test('5. Customer Forbidden on Admin Review Endpoints', async () => {
      const res = await request('GET', '/admin/reviews/stats/summary', null, customerToken);
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden, received ${res.status}`);
    });

    await test('6. Super Admin Access without ordinary restrictions', async () => {
      const res = await request('GET', '/admin/reviews/stats/summary', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (!res.body.data || typeof res.body.data.total_reviews !== 'number') {
        throw new Error('Stats summary missing total_reviews metric');
      }
    });

    // ── 3. ALL REVIEWS & FILTERING ────────────────────────────────────────────
    await test('7. All Reviews Listing & Pagination', async () => {
      const res = await request('GET', '/admin/reviews?page=1&limit=10', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected data to be an array');
      if (res.body.data.length === 0) throw new Error('Expected at least 1 review returned');
      sampleReviewId = res.body.data[0].id;
    });

    await test('8. Filter Reviews by Rating & Status', async () => {
      const res = await request('GET', '/admin/reviews?rating=5&status=approved', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      const non5Star = res.body.data.find((r) => r.rating_overall !== 5 || r.status !== 'approved');
      if (non5Star) throw new Error(`Found review not matching filter: rating=${non5Star.rating_overall}, status=${non5Star.status}`);
    });

    await test('9. Get Review Details by ID with full relations', async () => {
      const res = await request('GET', `/admin/reviews/${sampleReviewId}`, null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      const rev = res.body.data;
      if (!rev.id || !rev.review_text || !Array.isArray(rev.attachments)) {
        throw new Error('Review detail missing core fields or attachments array');
      }
    });

    // ── 4. PENDING REVIEWS QUEUE & APPROVAL WORKFLOW ──────────────────────────
    await test('10. Pending Reviews Queue Retrieval', async () => {
      const res = await request('GET', '/admin/reviews/pending?limit=10', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
        throw new Error('Expected pending reviews in queue');
      }
      samplePendingId = res.body.data[0].id;
    });

    await test('11. Approve Pending Review', async () => {
      const res = await request('POST', `/admin/reviews/pending/${samplePendingId}/approve`, {
        note: 'Approved after verifying design assets quality',
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}: ${JSON.stringify(res.body)}`);
      if (res.body.data.status !== 'approved') throw new Error(`Expected status 'approved', got ${res.body.data.status}`);
    });

    await test('12. Reject Review with mandatory reason', async () => {
      // Pick another pending or existing review to test rejection
      const pendingRes = await request('GET', '/admin/reviews/pending?limit=2', null, superAdminToken);
      const toRejectId = pendingRes.body.data[0]?.id || samplePendingId;
      const res = await request('POST', `/admin/reviews/pending/${toRejectId}/reject`, {
        reason: 'Violates quality standards: Contains unsubstantiated claims',
        note: 'Tested rejection flow',
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (res.body.data.status !== 'rejected') throw new Error(`Expected status 'rejected', got ${res.body.data.status}`);
      if (!res.body.data.rejection_reason) throw new Error('Expected rejection_reason to be populated');
    });

    await test('13. Batch Approve Reviews', async () => {
      const pendingList = await request('GET', '/admin/reviews/pending?limit=3', null, superAdminToken);
      const ids = pendingList.body.data.map((r) => r.id);
      if (ids.length > 0) {
        const res = await request('POST', '/admin/reviews/pending/batch-approve', {
          ids,
          note: 'Batch approved in test',
        }, superAdminToken);
        if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      }
    });

    // ── 5. APPROVED & REJECTED REVIEWS MANAGEMENT ─────────────────────────────
    await test('14. Hide Approved Review from Platform Ratings', async () => {
      const res = await request('POST', `/admin/reviews/approved/${sampleReviewId}/hide`, {
        reason: 'Dispute investigation initiated',
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (res.body.data.visibility_status !== 'hidden' || res.body.data.status !== 'hidden') {
        throw new Error('Expected review to be marked hidden');
      }
    });

    await test('15. Restore Hidden Review back to Approved', async () => {
      const res = await request('POST', `/admin/reviews/approved/${sampleReviewId}/restore`, {
        reason: 'Dispute resolved in good standing',
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (res.body.data.status !== 'approved' || res.body.data.visibility_status !== 'visible') {
        throw new Error('Expected review restored to approved & visible');
      }
    });

    await test('16. Reconsider & Restore Rejected Review', async () => {
      const rejList = await request('GET', '/admin/reviews/rejected?limit=2', null, superAdminToken);
      if (rejList.body.data.length > 0) {
        const rejId = rejList.body.data[0].id;
        const res = await request('POST', `/admin/reviews/rejected/${rejId}/restore`, {
          reason: 'Seller clarified misunderstanding; review restored.',
        }, superAdminToken);
        if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
        if (res.body.data.status !== 'approved') throw new Error('Expected review restored to approved');
      }
    });

    // ── 6. REPORTED REVIEWS & INVESTIGATION QUEUE ────────────────────────────
    await test('17. Reported Reviews Queue Retrieval', async () => {
      const res = await request('GET', '/admin/reviews/reports?limit=10', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
        throw new Error('Expected reported reviews in queue');
      }
      sampleReportId = res.body.data[0].id;
    });

    await test('18. Investigate Reported Review', async () => {
      const res = await request('POST', `/admin/reviews/reports/${sampleReportId}/investigate`, {
        notes: 'Assigned investigator to inspect chat logs',
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (res.body.data.status !== 'investigating') throw new Error(`Expected status 'investigating', got ${res.body.data.status}`);
    });

    await test('19. Dismiss Report as Non-Violating', async () => {
      const res = await request('POST', `/admin/reviews/reports/${sampleReportId}/dismiss`, {
        notes: 'Customer provided valid opinion within marketplace bounds',
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (res.body.data.status !== 'resolved_dismissed') throw new Error(`Expected 'resolved_dismissed', got ${res.body.data.status}`);
    });

    await test('20. Remove Reported Review after Substantiated Violation', async () => {
      const reportsRes = await request('GET', '/admin/reviews/reports?status=pending&limit=2', null, superAdminToken);
      if (reportsRes.body.data.length > 0) {
        const repId = reportsRes.body.data[0].id;
        const res = await request('POST', `/admin/reviews/reports/${repId}/remove-review`, {
          reason: 'Confirmed promotional spam violation',
        }, superAdminToken);
        if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
        if (res.body.data.status !== 'removed' || res.body.data.visibility_status !== 'hidden') {
          throw new Error('Expected review removed and hidden');
        }
      }
    });

    // ── 7. SELLER RESPONSES MODERATION ────────────────────────────────────────
    await test('21. Seller Responses Queue Retrieval', async () => {
      const res = await request('GET', '/admin/reviews/responses?limit=10', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
        throw new Error('Expected seller responses in queue');
      }
      sampleResponseId = res.body.data[0].id;
    });

    await test('22. Approve Seller Response', async () => {
      const res = await request('POST', `/admin/reviews/responses/${sampleResponseId}/approve`, {
        note: 'Approved professional response',
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (res.body.data.status !== 'approved' || res.body.data.is_visible !== true) {
        throw new Error('Expected response approved and visible');
      }
    });

    await test('23. Reject Inappropriate Seller Response', async () => {
      const pendingRes = await request('GET', '/admin/reviews/responses?limit=5', null, superAdminToken);
      const respId = pendingRes.body.data[1]?.id || sampleResponseId;
      const res = await request('POST', `/admin/reviews/responses/${respId}/reject`, {
        reason: 'Contains argumentative tone and personal contact information',
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (res.body.data.status !== 'rejected' || res.body.data.is_visible !== false) {
        throw new Error('Expected response rejected and not visible');
      }
    });

    // ── 8. REVIEW MODERATION RULES & AUDIT TRAIL ───────────────────────────────
    await test('24. Moderation Rules Listing', async () => {
      const res = await request('GET', '/admin/reviews/moderation/rules', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
        throw new Error('Expected moderation rules configured');
      }
    });

    await test('25. Create Moderation Rule', async () => {
      const code = `RULE-TEST-${Date.now().toString().slice(-4)}`;
      const res = await request('POST', '/admin/reviews/moderation/rules', {
        rule_name: 'Test Automatic Flag Rule',
        rule_code: code,
        category: 'keywords',
        condition_type: 'contains_keywords',
        action: 'flag_for_review',
        severity: 'high',
        parameters: { keywords: ['testflagkeyword', 'badwordtest'] },
      }, superAdminToken);
      if (res.status !== 201) throw new Error(`Expected 201 Created, received ${res.status}: ${JSON.stringify(res.body)}`);
      sampleRuleId = res.body.data.id;
    });

    await test('26. Toggle Moderation Rule Active Status', async () => {
      const res = await request('PATCH', `/admin/reviews/moderation/rules/${sampleRuleId}/toggle`, null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (res.body.data.is_active !== false) throw new Error('Expected rule to be toggled inactive');
    });

    await test('27. Delete Moderation Rule', async () => {
      const res = await request('DELETE', `/admin/reviews/moderation/rules/${sampleRuleId}`, null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
    });

    await test('28. Moderation Audit Trail Retrieval', async () => {
      const res = await request('GET', '/admin/reviews/moderation/audit-trail?limit=15', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
        throw new Error('Expected audit trail records');
      }
    });

    await test('29. Review & Moderation Settings Get & Update', async () => {
      const getRes = await request('GET', '/admin/reviews/moderation/settings', null, superAdminToken);
      if (getRes.status !== 200) throw new Error(`Expected 200 OK, received ${getRes.status}`);

      const putRes = await request('PUT', '/admin/reviews/moderation/settings', {
        profanity_filter_enabled: true,
        report_auto_investigation_threshold: 4,
      }, superAdminToken);
      if (putRes.status !== 200) throw new Error(`Expected 200 OK, received ${putRes.status}`);
    });

    // ── 9. PRODUCT & SERVICE RATINGS AGGREGATION ──────────────────────────────
    await test('30. Product Ratings Aggregation Retrieval', async () => {
      const res = await request('GET', '/admin/reviews/products/ratings?limit=10', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
        throw new Error('Expected product ratings returned');
      }
      sampleProductId = res.body.data[0].id;
    });

    await test('31. Recalculate Product Ratings Server-Side', async () => {
      const res = await request('POST', `/admin/reviews/products/${sampleProductId}/recalculate`, null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (typeof res.body.data.average_rating !== 'number') {
        throw new Error('Expected calculated average_rating');
      }
    });

    await test('32. Service Ratings Aggregation Retrieval', async () => {
      const res = await request('GET', '/admin/reviews/services/ratings?limit=10', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
        throw new Error('Expected service ratings returned');
      }
      sampleServiceId = res.body.data[0].id;
    });

    await test('33. Recalculate Service Ratings Server-Side', async () => {
      const res = await request('POST', `/admin/reviews/services/${sampleServiceId}/recalculate`, null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200 OK, received ${res.status}`);
      if (typeof res.body.data.average_rating !== 'number') {
        throw new Error('Expected calculated average_rating');
      }
    });

    // ── 10. CUSTOMER REVIEW SUBMISSION BOUNDARIES ─────────────────────────────
    await test('34. Reject Review Submission for Non-Existent or Ineligible Order', async () => {
      const fakeOrderId = '00000000-0000-0000-0000-000000000000';
      const res = await request('POST', '/admin/reviews/submit', {
        order_id: fakeOrderId,
        rating_overall: 5,
        review_text: 'This should fail because order does not exist.',
      }, customerToken);
      if (res.status !== 404 && res.status !== 400 && res.status !== 403) {
        throw new Error(`Expected 4xx error, received ${res.status}`);
      }
    });

    await test('35. Reject Review Submission with Invalid Rating (6 stars)', async () => {
      const res = await request('POST', '/admin/reviews/submit', {
        order_id: '00000000-0000-0000-0000-000000000000',
        rating_overall: 6,
        review_text: 'Invalid 6 star rating submission.',
      }, customerToken);
      if (res.status !== 400) throw new Error(`Expected 400 Bad Request, received ${res.status}`);
    });

    await test('36. Mathematical Rating Engine Accuracy Verification', async () => {
      // Direct SQL check of mathematical formula:
      // SUM(rating_overall of approved visible reviews) / count(*)
      const check = await primaryPool.query(`
        SELECT 
          COUNT(*)::int as count,
          COALESCE(ROUND(AVG(rating_overall), 2), 0) as expected_avg
        FROM reviews
        WHERE status = 'approved' AND visibility_status = 'visible';
      `);
      const { count, expected_avg } = check.rows[0];
      if (count === 0) throw new Error('No approved reviews found to verify formula');

      const stats = await request('GET', '/admin/reviews/stats/summary', null, superAdminToken);
      const apiAvg = stats.body.data.average_rating;
      if (Math.abs(parseFloat(expected_avg) - parseFloat(apiAvg)) > 0.05) {
        throw new Error(`Formula mismatch: DB calculated ${expected_avg}, API returned ${apiAvg}`);
      }
    });

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log('\n==================================================================');
  console.log(`🏁 TEST RESULTS: ${passCount} Passed, ${failCount} Failed 🏁`);
  console.log('==================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
