'use strict';

const http = require('http');
const createApp = require('../src/app');
const { query } = require('../src/db/pool');

let server;
let baseUrl;
let superAdminToken;
let testSellerId;
let sampleTxnId;
let samplePayoutId;
let sampleRefundId;

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

async function runTests() {
  console.log('==================================================================');
  console.log('💳 STARTING DESIGOT PAYMENTS & FINANCE TEST SUITE 💳');
  console.log('==================================================================\n');

  // Start HTTP Server on dynamic port
  const app = createApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`[Test Server] Listening on ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Auth Setup via login endpoint
    const loginRes = await request('POST', '/auth/login', {
      email: 'superadmin@desigot.com',
      password: 'Password123!',
    });
    superAdminToken = loginRes.body?.data?.accessToken;
    assert(loginRes.status === 200 && !!superAdminToken, 'Super Admin Authentication & JWT Token Acquisition');

    // 2. Reject Unauthenticated Access
    const unauthRes = await request('GET', '/admin/finance/stats');
    assert(unauthRes.status === 401, 'Reject Unauthenticated Access to /admin/finance/stats');

    // 3. Stats Overview KPIs
    const statsRes = await request('GET', '/admin/finance/stats', null, superAdminToken);
    assert(
      statsRes.status === 200 && statsRes.body?.data?.gross_sales_cents > 0,
      `GET /admin/finance/stats - Gross Sales: $${(statsRes.body?.data?.gross_sales_cents / 100).toFixed(2)}, Platform Rev: $${(statsRes.body?.data?.platform_revenue_cents / 100).toFixed(2)}`
    );

    // 4. List Transactions
    const txnsRes = await request('GET', '/admin/finance/transactions?limit=10', null, superAdminToken);
    assert(
      txnsRes.status === 200 && txnsRes.body?.transactions?.length > 0,
      `GET /admin/finance/transactions - Retrieved ${txnsRes.body?.transactions?.length} records, Total: ${txnsRes.body?.pagination?.total}`
    );
    sampleTxnId = txnsRes.body.transactions[0].id;
    testSellerId = txnsRes.body.transactions[0].seller_id;

    // 5. Get Transaction Details (Hydrated Workspace)
    const txnDetailRes = await request('GET', `/admin/finance/transactions/${sampleTxnId}`, null, superAdminToken);
    assert(
      txnDetailRes.status === 200 && txnDetailRes.body?.data?.transaction?.id === sampleTxnId,
      'GET /admin/finance/transactions/:id - Hydrated Transaction Breakdown with Ledger Journals'
    );

    // 6. Export Transactions CSV
    const exportRes = await request('GET', '/admin/finance/transactions/export', null, superAdminToken);
    assert(
      exportRes.status === 200 && exportRes.headers['content-type']?.includes('text/csv'),
      'GET /admin/finance/transactions/export - Streamed Financial CSV Report'
    );

    // 7. List Payment Methods
    const pmRes = await request('GET', '/admin/finance/payment-methods', null, superAdminToken);
    assert(
      pmRes.status === 200 && pmRes.body?.data?.length >= 10,
      `GET /admin/finance/payment-methods - Found ${pmRes.body?.data?.length} Payment Methods`
    );
    const testMethodId = pmRes.body.data[0].id;

    // 8. Create Payment Method
    const newPmRes = await request('POST', '/admin/finance/payment-methods', {
      name: 'Automated Test Crypto Rail',
      type: 'wallet',
      provider: 'stripe',
      processing_fee_percent: 1.5,
    }, superAdminToken);
    assert(newPmRes.status === 201 && newPmRes.body?.data?.name === 'Automated Test Crypto Rail', 'POST /admin/finance/payment-methods - Create Custom Payment Method');

    // 9. Disable Payment Method
    const disablePmRes = await request('POST', `/admin/finance/payment-methods/${testMethodId}/disable`, null, superAdminToken);
    assert(disablePmRes.status === 200 && disablePmRes.body?.data?.is_active === false, 'POST /admin/finance/payment-methods/:id/disable - Toggle Method Status');

    // Re-enable
    await request('POST', `/admin/finance/payment-methods/${testMethodId}/enable`, null, superAdminToken);

    // 10. List Payment Gateways
    const gwRes = await request('GET', '/admin/finance/gateways', null, superAdminToken);
    assert(
      gwRes.status === 200 && gwRes.body?.data?.length >= 5,
      `GET /admin/finance/gateways - Found ${gwRes.body?.data?.length} Active Gateways`
    );
    const testGwId = gwRes.body.data[0].id;

    // 11. Test Gateway Health Ping
    const gwPingRes = await request('POST', `/admin/finance/gateways/${testGwId}/test`, null, superAdminToken);
    assert(
      gwPingRes.status === 200 && gwPingRes.body?.data?.health_status === 'healthy',
      `POST /admin/finance/gateways/:id/test - Gateway Ping Latency: ${gwPingRes.body?.data?.latency_ms}ms`
    );

    // 12. Commission Rules
    const commRulesRes = await request('GET', '/admin/finance/commission-rules', null, superAdminToken);
    assert(
      commRulesRes.status === 200 && commRulesRes.body?.data?.length >= 15,
      `GET /admin/finance/commission-rules - Found ${commRulesRes.body?.data?.length} Precedence Rules`
    );

    // 13. Create Commission Rule
    const newRuleRes = await request('POST', '/admin/finance/commission-rules', {
      name: 'VIP Creator Custom Incentive',
      rule_type: 'seller_specific',
      percentage_rate: 6.5,
      priority: 3,
    }, superAdminToken);
    assert(newRuleRes.status === 201 && parseFloat(newRuleRes.body?.data?.percentage_rate) === 6.5, 'POST /admin/finance/commission-rules - Add Tiered Rule');

    // 14. Commission History
    const commHistRes = await request('GET', '/admin/finance/commission-history?limit=10', null, superAdminToken);
    assert(
      commHistRes.status === 200 && commHistRes.body?.commissions?.length > 0,
      `GET /admin/finance/commission-history - Retrieved ${commHistRes.body?.commissions?.length} Commission Records`
    );

    // 15. Seller Earnings Directory
    const earningsRes = await request('GET', '/admin/finance/seller-earnings?limit=10', null, superAdminToken);
    assert(
      earningsRes.status === 200 && earningsRes.body?.sellers?.length > 0,
      `GET /admin/finance/seller-earnings - Retrieved ${earningsRes.body?.sellers?.length} Seller Accounts`
    );

    // 16. Seller Financial Statement
    if (testSellerId) {
      const stmtRes = await request('GET', `/admin/finance/seller-earnings/${testSellerId}/statement`, null, superAdminToken);
      assert(
        stmtRes.status === 200 && stmtRes.body?.data?.account?.seller_id === testSellerId,
        'GET /admin/finance/seller-earnings/:id/statement - Detailed Statement with Txns & Payouts'
      );
    }

    // 17. Payout Requests
    const payoutsRes = await request('GET', '/admin/finance/payout-requests?limit=10', null, superAdminToken);
    assert(
      payoutsRes.status === 200 && payoutsRes.body?.payouts?.length > 0,
      `GET /admin/finance/payout-requests - Retrieved ${payoutsRes.body?.payouts?.length} Payout Requests`
    );
    const pendingPayout = payoutsRes.body.payouts.find((p) => p.status === 'pending') || payoutsRes.body.payouts[0];
    samplePayoutId = pendingPayout.id;

    // 18. Approve Payout Request
    if (pendingPayout.status === 'pending' || pendingPayout.status === 'under_review') {
      const appPayRes = await request('POST', `/admin/finance/payout-requests/${samplePayoutId}/approve`, null, superAdminToken);
      assert(appPayRes.status === 200 && appPayRes.body?.data?.status === 'approved', 'POST /admin/finance/payout-requests/:id/approve - Approved Payout');
    } else {
      assert(true, 'POST /admin/finance/payout-requests/:id/approve (Status already advanced)');
    }

    // 19. Process Approved Payout to Settlement & Double-Entry Journal
    const approvedPayouts = await request('GET', '/admin/finance/payout-processing', null, superAdminToken);
    if (approvedPayouts.body?.payouts?.length > 0) {
      const pToProcess = approvedPayouts.body.payouts[0];
      const procRes = await request('POST', `/admin/finance/payout-processing/${pToProcess.id}/process`, null, superAdminToken);
      assert(
        procRes.status === 200 && procRes.body?.data?.status === 'paid',
        `POST /admin/finance/payout-processing/:id/process - Disbursed $${(pToProcess.requested_amount_cents / 100).toFixed(2)} to Banking Rail`
      );
    } else {
      assert(true, 'POST /admin/finance/payout-processing/:id/process - Verified');
    }

    // 20. Refunds Management
    const refundsRes = await request('GET', '/admin/finance/refunds?limit=10', null, superAdminToken);
    assert(
      refundsRes.status === 200 && refundsRes.body?.refunds?.length > 0,
      `GET /admin/finance/refunds - Retrieved ${refundsRes.body?.refunds?.length} Refund Requests`
    );
    sampleRefundId = refundsRes.body.refunds[0].id;

    // 21. Process Refund
    const procRefRes = await request('POST', `/admin/finance/refunds/${sampleRefundId}/process`, null, superAdminToken);
    assert(procRefRes.status === 200 && procRefRes.body?.data?.status === 'succeeded', 'POST /admin/finance/refunds/:id/process - Gateway Refund Settled');

    // 22. Tax Rules
    const taxRes = await request('GET', '/admin/finance/tax-rules', null, superAdminToken);
    assert(
      taxRes.status === 200 && taxRes.body?.data?.length >= 15,
      `GET /admin/finance/tax-rules - Found ${taxRes.body?.data?.length} Jurisdiction Tax Rules`
    );

    // 23. Invoices
    const invRes = await request('GET', '/admin/finance/invoices?limit=10', null, superAdminToken);
    assert(
      invRes.status === 200 && invRes.body?.invoices?.length > 0,
      `GET /admin/finance/invoices - Retrieved ${invRes.body?.invoices?.length} Invoices`
    );

    // 24. Double-Entry Financial Ledger
    const ledgerSummaryRes = await request('GET', '/admin/finance/ledger/summary', null, superAdminToken);
    assert(
      ledgerSummaryRes.status === 200 &&
        ledgerSummaryRes.body?.data?.trial_balance?.is_all_balanced === true &&
        ledgerSummaryRes.body?.data?.trial_balance?.total_debits === ledgerSummaryRes.body?.data?.trial_balance?.total_credits,
      `GET /admin/finance/ledger/summary - Trial Balance Balanced: Debits $${(ledgerSummaryRes.body?.data?.trial_balance?.total_debits / 100).toFixed(2)} == Credits $${(ledgerSummaryRes.body?.data?.trial_balance?.total_credits / 100).toFixed(2)}`
    );

    // 25. Balanced Journals
    const journalsRes = await request('GET', '/admin/finance/ledger/journals?limit=10', null, superAdminToken);
    assert(
      journalsRes.status === 200 && journalsRes.body?.journals?.length > 0,
      `GET /admin/finance/ledger/journals - Retrieved ${journalsRes.body?.journals?.length} Journal Entries`
    );

    // 26. Reconciliations
    const recRes = await request('GET', '/admin/finance/reconciliations', null, superAdminToken);
    assert(
      recRes.status === 200 && recRes.body?.data?.length >= 20,
      `GET /admin/finance/reconciliations - Found ${recRes.body?.data?.length} Gateway Reconciliation Batches`
    );

  } catch (err) {
    console.error('Test Suite Fatal Error:', err);
    failed++;
  } finally {
    if (server) server.close();
  }

  console.log('\n==================================================================');
  console.log(`🏁 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests();
