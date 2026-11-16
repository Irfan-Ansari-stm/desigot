'use strict';
require('dotenv').config();
const assert = require('assert');
const { Pool } = require('pg');
const config = require('../src/config');
const biSvc = require('../src/modules/dashboard-analytics/analytics-bi.service');

async function runAnalyticsBiTests() {
  console.log('====================================================');
  console.log('RUNNING MODULE 14: ANALYTICS & BI COMPREHENSIVE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // 1. DATE RANGE PARSER TESTS
  test('parseDateRange handles presets and comparison windows', () => {
    const r30 = biSvc.parseDateRange({ period: '30d' });
    assert(r30.start instanceof Date, 'start is Date');
    assert(r30.end instanceof Date, 'end is Date');
    assert(r30.prevStart instanceof Date, 'prevStart is Date');
    assert(r30.prevEnd instanceof Date, 'prevEnd is Date');
    assert(r30.start > r30.prevStart, 'start is after prevStart');

    const rYear = biSvc.parseDateRange({ period: 'this_year' });
    assert.strictEqual(rYear.start.getMonth(), 0, 'this_year starts in January');

    const rCustom = biSvc.parseDateRange({ startDate: '2026-01-01', endDate: '2026-03-31' });
    assert(rCustom.end > rCustom.start, 'custom range parsed correctly');
  });

  // 2. UNIFIED OVERVIEW KPIS TEST
  await asyncTest('Unified Overview returns all 12 KPIs with comparisons & sparklines', async () => {
    const data = await biSvc.getUnifiedOverview({ period: '30d' });
    assert(data.kpis, 'kpis object exists');

    const expectedKpis = [
      'grossRevenue', 'netRevenue', 'totalSales', 'totalOrders',
      'totalBookings', 'servicesSold', 'digitalProductsSold', 'totalCustomers',
      'activeSellers', 'totalCommission', 'conversionRate', 'averageOrderValue'
    ];

    for (const key of expectedKpis) {
      assert(data.kpis[key], `KPI ${key} exists`);
      assert(typeof data.kpis[key].value === 'number', `${key} value is number`);
      assert(typeof data.kpis[key].changePct === 'number', `${key} changePct is number`);
      assert(['up', 'down'].includes(data.kpis[key].trend), `${key} trend is up or down`);
      assert(Array.isArray(data.kpis[key].sparkline), `${key} sparkline is array`);
      assert(data.kpis[key].sparkline.length > 0, `${key} sparkline has points`);
    }
  });

  // 3. UNIFIED OVERVIEW 10 CHARTS TEST
  await asyncTest('Unified Overview returns all 10 interactive chart datasets', async () => {
    const data = await biSvc.getUnifiedOverview({ period: '30d' });
    assert(data.charts, 'charts object exists');

    const expectedCharts = [
      'revenueTrend', 'salesGrowth', 'ordersOverview', 'serviceVsProductRevenue',
      'commissionOverview', 'sellerPerformance', 'customerGrowth',
      'orderStatusDistribution', 'popularCategories', 'conversionFunnel'
    ];

    for (const key of expectedCharts) {
      assert(data.charts[key] !== undefined, `Chart dataset ${key} exists`);
      assert(Array.isArray(data.charts[key]), `Chart dataset ${key} is array`);
    }

    // Check 7-Stage Funnel structure
    const funnel = data.charts.conversionFunnel;
    assert.strictEqual(funnel.length, 7, 'conversion funnel has 7 stages');
    assert.strictEqual(funnel[0].stage, 'visitors', 'first stage is visitors');
    assert.strictEqual(funnel[6].stage, 'purchase', 'last stage is purchase');
  });

  // 4. REVENUE REPORT TEST
  await asyncTest('getRevenueReport returns financial breakdown & ledger', async () => {
    const res = await biSvc.getRevenueReport({ page: 1, limit: 10 });
    assert(res.summary, 'summary exists');
    assert(res.summary.gross_revenue !== undefined, 'gross_revenue present');
    assert(res.summary.net_revenue !== undefined, 'net_revenue present');
    assert(res.summary.marketplace_commission !== undefined, 'marketplace_commission present');
    assert(Array.isArray(res.transactions), 'transactions is array');
    assert(res.pagination.total >= 0, 'pagination total exists');
  });

  // 5. SALES REPORT TEST
  await asyncTest('getSalesReport returns order statistics & repeat purchase metrics', async () => {
    const res = await biSvc.getSalesReport({ period: '90d', page: 1, limit: 10 });
    assert(res.summary, 'summary exists');
    assert(res.summary.total_orders !== undefined, 'total_orders exists');
    assert(res.summary.repeatPurchaseRate !== undefined, 'repeatPurchaseRate exists');
    assert(Array.isArray(res.orders), 'orders list is array');
  });

  // 6. SERVICE REPORT TEST
  await asyncTest('getServiceReport returns bookings metrics & top services table', async () => {
    const res = await biSvc.getServiceReport();
    assert(res.metrics, 'metrics exist');
    assert(res.bookings, 'bookings exist');
    assert(Array.isArray(res.topServices), 'topServices is array');
    assert(res.topServices.length > 0, 'topServices populated');
  });

  // 7. PRODUCT REPORT TEST
  await asyncTest('getProductReport returns catalog downloads & licensing tiers', async () => {
    const res = await biSvc.getProductReport();
    assert(res.metrics, 'metrics exist');
    assert(res.catalog, 'catalog exists');
    assert(Array.isArray(res.licenseBreakdown), 'licenseBreakdown is array');
    assert.strictEqual(res.licenseBreakdown.length, 3, '3 license tiers');
    assert(Array.isArray(res.topProducts), 'topProducts is array');
  });

  // 8. SELLER REPORT TEST
  await asyncTest('getSellerReport returns seller leaderboard and payouts', async () => {
    const res = await biSvc.getSellerReport();
    assert(res.stats, 'stats exist');
    assert(Array.isArray(res.leaderboard), 'leaderboard is array');
    assert(res.leaderboard.length > 0, 'leaderboard populated');
  });

  // 9. CUSTOMER REPORT TEST
  await asyncTest('getCustomerReport returns LTV, retention & customer segments', async () => {
    const res = await biSvc.getCustomerReport();
    assert(res.stats, 'stats exist');
    assert(res.stats.retentionRate !== undefined, 'retentionRate exists');
    assert(Array.isArray(res.segments), 'segments is array');
    assert.strictEqual(res.segments.length, 6, '6 customer segments');
    assert(Array.isArray(res.topCustomers), 'topCustomers is array');
  });

  // 10. COMMISSION REPORT TEST
  await asyncTest('getCommissionReport returns commission breakdown & ledger', async () => {
    const res = await biSvc.getCommissionReport();
    assert(res.kpis, 'kpis exist');
    assert(Array.isArray(res.statusBreakdown), 'statusBreakdown is array');
    assert(Array.isArray(res.ledger), 'ledger is array');
  });

  // 11. CONVERSION REPORT TEST
  await asyncTest('getConversionReport returns 7 stages, devices & traffic sources', async () => {
    const res = await biSvc.getConversionReport();
    assert(Array.isArray(res.funnel), 'funnel is array');
    assert.strictEqual(res.funnel.length, 7, '7 funnel stages');
    assert(Array.isArray(res.devices), 'devices is array');
    assert(Array.isArray(res.trafficSources), 'trafficSources is array');
  });

  // 12. POPULAR CATEGORIES REPORT TEST
  await asyncTest('getCategoriesReport returns taxonomy revenue rankings', async () => {
    const res = await biSvc.getCategoriesReport();
    assert(Array.isArray(res.categories), 'categories is array');
    assert(res.categories.length > 0, 'categories populated');
  });

  // 13. POPULAR SERVICES & PRODUCTS TESTS
  await asyncTest('getPopularServicesReport and getPopularProductsReport return rankings', async () => {
    const srv = await biSvc.getPopularServicesReport({ limit: 10 });
    assert(Array.isArray(srv.services), 'services is array');
    assert(srv.services.length > 0, 'services returned');

    const prd = await biSvc.getPopularProductsReport({ limit: 10 });
    assert(Array.isArray(prd.products), 'products is array');
    assert(prd.products.length > 0, 'products returned');
  });

  // 14. EXPORT REPORTS & JOB CREATION TEST
  await asyncTest('Export management creates and downloads reports', async () => {
    const listRes = await biSvc.getExportReports({ page: 1, limit: 5 });
    assert(Array.isArray(listRes.exports), 'exports is array');
    assert(listRes.exports.length > 0, 'exports list populated from seed');

    // Create a new export
    const created = await biSvc.createExportReport({
      reportName: 'Automated Test Revenue Export',
      reportType: 'revenue',
      format: 'csv'
    }, { id: null });
    assert(created.id, 'created export has ID');
    assert.strictEqual(created.status, 'completed', 'status is completed');

    // Download export
    const downloaded = await biSvc.downloadExportReport(created.id);
    assert(downloaded, 'download payload returned');
    assert(downloaded.content.includes('Order ID') || downloaded.content.includes('ID'), 'CSV content has header');
  });

  // 15. EVENT INGESTION TEST
  await asyncTest('trackAnalyticsEvent records funnel event to database', async () => {
    const event = await biSvc.trackAnalyticsEvent({
      eventType: 'page_view',
      sessionId: 'test_session_automated_123',
      deviceType: 'Desktop',
      trafficSource: 'Direct',
      metadata: { test: true }
    });
    assert(event.id, 'event inserted and ID returned');
    assert.strictEqual(event.event_type, 'page_view', 'event type matches');
  });

  console.log('\n====================================================');
  console.log(`ALL ${passed}/${total} ANALYTICS & BI TESTS PASSED PERFECTLY!`);
  console.log('====================================================\n');
}

runAnalyticsBiTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
