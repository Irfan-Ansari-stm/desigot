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
  console.log('🧪 STARTING DESIGOT MARKETING & PROMOTIONS TEST SUITE 🧪');
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
  let testCouponId;
  let testCampaignId;
  let testFeaturedServiceId;
  let testFeaturedProductId;
  let testBannerId;
  let testSectionId;
  let testNewsletterId;
  let testAffiliateId;
  let testReferralProgId;
  let testAdId;
  let sampleServiceId;
  let sampleProductId;

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

    await test('3. Buyer Authentication', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'buyer@desigot.com',
        password: 'Password123!',
      });
      customerToken = res.body.data?.accessToken || res.body.data?.token;
      if (res.status !== 200 || !customerToken) throw new Error(`Buyer login failed: ${JSON.stringify(res.body)}`);
    });

    // ── 2. RBAC ENFORCEMENT ───────────────────────────────────────────────────
    await test('4. RBAC: Reject unauthorized buyer from marketing coupons', async () => {
      const res = await request('GET', '/admin/marketing/coupons', null, customerToken);
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    });

    await test('5. RBAC: Reject unauthorized seller from marketing campaigns', async () => {
      const res = await request('GET', '/admin/marketing/campaigns', null, sellerToken);
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    });

    // ── 3. KPI STATS SUMMARY ──────────────────────────────────────────────────
    await test('6. Marketing KPI Stats Summary', async () => {
      const res = await request('GET', '/admin/marketing/stats/summary', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const stats = res.body.data;
      if (!stats.coupons || !stats.campaigns || !stats.banners || !stats.affiliates) {
        throw new Error('Stats missing key metric sections');
      }
      if (stats.coupons.total <= 0) throw new Error('Expected coupons in database');
    });

    // Fetch sample service and product from db for relations
    const prodRes = await primaryPool.query('SELECT id FROM digital_products LIMIT 1');
    const servRes = await primaryPool.query('SELECT id FROM services LIMIT 1');
    sampleProductId = prodRes.rows[0]?.id;
    sampleServiceId = servRes.rows[0]?.id;

    // ── 4. COUPONS ENGINE ─────────────────────────────────────────────────────
    await test('7. List Coupons with Pagination', async () => {
      const res = await request('GET', '/admin/marketing/coupons?limit=10&page=1', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) throw new Error('Expected coupon array');
    });

    await test('8. Create New Percentage Coupon', async () => {
      const testCode = `TEST${Date.now().toString().slice(-4)}`;
      const res = await request('POST', '/admin/marketing/coupons', {
        code: testCode,
        name: 'Automated Test 25% Off Coupon',
        coupon_type: 'percentage',
        discount_type: 'percentage',
        discount_value: 25,
        min_order_cents: 3000,
        max_discount_cents: 5000,
        max_uses: 100,
        status: 'active'
      }, superAdminToken);

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
      testCouponId = res.body.data.id;
      if (!testCouponId) throw new Error('Created coupon missing ID');
    });

    await test('9. Update Coupon Details', async () => {
      const res = await request('PUT', `/admin/marketing/coupons/${testCouponId}`, {
        name: 'Automated Test 30% Off Coupon Updated',
        discount_value: 30
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (parseFloat(res.body.data.discount_value) !== 30) throw new Error('Discount value not updated');
    });

    await test('10. Toggle Coupon Status', async () => {
      const res = await request('PATCH', `/admin/marketing/coupons/${testCouponId}/toggle-status`, {}, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.data.status !== 'disabled') throw new Error(`Expected status disabled, got ${res.body.data.status}`);
      // Re-enable
      await request('PATCH', `/admin/marketing/coupons/${testCouponId}/toggle-status`, {}, superAdminToken);
    });

    await test('11. Export Coupons', async () => {
      const res = await request('GET', '/admin/marketing/coupons/export', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) throw new Error('Export returned no data');
    });

    // ── 5. CHECKOUT COUPON VALIDATION ENGINE ─────────────────────────────────
    await test('12. Checkout Coupon Engine: Valid Percentage Calculation', async () => {
      const res = await request('POST', '/marketplace/marketing/coupons/validate', {
        code: 'WELCOME10',
        orderAmountCents: 5000
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      const val = res.body.data;
      if (val.discount_cents !== 500) throw new Error(`Expected 500 cents discount (10% of 5000), got ${val.discount_cents}`);
      if (val.final_amount_cents !== 4500) throw new Error(`Expected 4500 cents final amount, got ${val.final_amount_cents}`);
    });

    await test('13. Checkout Coupon Engine: Reject Below Minimum Order', async () => {
      const res = await request('POST', '/marketplace/marketing/coupons/validate', {
        code: 'WELCOME10',
        orderAmountCents: 1000 // min is 2000
      });
      if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
    });

    await test('14. Checkout Coupon Engine: Reject Non-Existent Code', async () => {
      const res = await request('POST', '/marketplace/marketing/coupons/validate', {
        code: 'FAKEINVALID999',
        orderAmountCents: 10000
      });
      if (res.status !== 404) throw new Error(`Expected 404 Not Found, got ${res.status}`);
    });

    // ── 6. DISCOUNT CAMPAIGNS ─────────────────────────────────────────────────
    await test('15. List Discount Campaigns', async () => {
      const res = await request('GET', '/admin/marketing/campaigns?limit=10', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected campaign array');
    });

    await test('16. Create Discount Campaign with Items', async () => {
      const res = await request('POST', '/admin/marketing/campaigns', {
        name: 'Flash Weekend Sprint Sale 2026',
        description: 'Super discount across premium developer and design assets',
        campaign_type: 'flash_sale',
        discount_percentage: 20,
        budget_cents: 80000,
        status: 'published',
        items: [
          { product_id: sampleProductId, custom_discount_pct: 25 },
          { service_id: sampleServiceId, custom_discount_pct: 20 }
        ]
      }, superAdminToken);

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
      testCampaignId = res.body.data.id;
    });

    await test('17. Update Campaign Status (Pause)', async () => {
      const res = await request('PATCH', `/admin/marketing/campaigns/${testCampaignId}/status`, {
        status: 'paused'
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.data.status !== 'paused') throw new Error(`Expected paused, got ${res.body.data.status}`);
    });

    // ── 7. FEATURED SERVICES ──────────────────────────────────────────────────
    await test('18. List Featured Services', async () => {
      const res = await request('GET', '/admin/marketing/featured-services', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected featured services array');
    });

    if (sampleServiceId) {
      await test('19. Feature a Service with Priority', async () => {
        const res = await request('POST', '/admin/marketing/featured-services', {
          service_id: sampleServiceId,
          placement: 'search_top',
          priority: 50,
          badge_text: 'Top Rated Pro'
        }, superAdminToken);
        if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
        testFeaturedServiceId = res.body.data.id;
      });

      await test('20. Batch Reorder Featured Services', async () => {
        const res = await request('POST', '/admin/marketing/featured-services/reorder', {
          items: [{ id: testFeaturedServiceId, priority: 75 }]
        }, superAdminToken);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      });
    }

    // ── 8. FEATURED PRODUCTS ──────────────────────────────────────────────────
    await test('21. List Featured Products', async () => {
      const res = await request('GET', '/admin/marketing/featured-products', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected featured products array');
    });

    if (sampleProductId) {
      await test('22. Feature a Product with Priority', async () => {
        const res = await request('POST', '/admin/marketing/featured-products', {
          product_id: sampleProductId,
          placement: 'search_top',
          priority: 50,
          badge_text: 'Editor Choice'
        }, superAdminToken);
        if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
        testFeaturedProductId = res.body.data.id;
      });

      await test('23. Batch Reorder Featured Products', async () => {
        const res = await request('POST', '/admin/marketing/featured-products/reorder', {
          items: [{ id: testFeaturedProductId, priority: 80 }]
        }, superAdminToken);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      });
    }

    // ── 9. HOMEPAGE BANNERS ───────────────────────────────────────────────────
    await test('24. List Homepage Banners', async () => {
      const res = await request('GET', '/admin/marketing/banners', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected banners array');
    });

    await test('25. Create Responsive Homepage Banner', async () => {
      const res = await request('POST', '/admin/marketing/banners', {
        title: 'Autumn Cyber Design Weeks',
        subtitle: 'Save up to 40% on production-ready systems',
        placement: 'hero',
        image_desktop_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
        image_tablet_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&auto=format&fit=crop&q=80',
        image_mobile_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=640&auto=format&fit=crop&q=80',
        cta_text: 'Claim Offer',
        cta_link: '/browse?promo=autumn',
        priority: 25
      }, superAdminToken);

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      testBannerId = res.body.data.id;
    });

    await test('26. Toggle Banner Active State', async () => {
      const res = await request('PATCH', `/admin/marketing/banners/${testBannerId}/toggle-status`, {}, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.data.is_active !== false) throw new Error('Expected banner to be toggled inactive');
      // Toggle back
      await request('PATCH', `/admin/marketing/banners/${testBannerId}/toggle-status`, {}, superAdminToken);
    });

    // ── 10. PROMOTIONAL SECTIONS ──────────────────────────────────────────────
    await test('27. List Promotional Sections', async () => {
      const res = await request('GET', '/admin/marketing/sections', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected sections array');
    });

    await test('28. Create Promotional Homepage Section with Items', async () => {
      const res = await request('POST', '/admin/marketing/sections', {
        title: 'Handpicked UI Component Kits',
        subtitle: 'Production vetted React and Figma design assets',
        section_type: 'featured_products',
        layout: 'carousel',
        columns_count: 4,
        max_items_count: 6,
        priority: 15,
        items: [
          { product_id: sampleProductId, priority: 10 }
        ]
      }, superAdminToken);

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      testSectionId = res.body.data.id;
    });

    // ── 11. NEWSLETTERS & SUBSCRIBERS ─────────────────────────────────────────
    await test('29. List Newsletter Campaigns', async () => {
      const res = await request('GET', '/admin/marketing/newsletters', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected newsletters array');
    });

    await test('30. Create Newsletter Campaign Draft', async () => {
      const res = await request('POST', '/admin/marketing/newsletters', {
        subject: '🚀 Top 10 Design Trends for Next-Gen Founders',
        preview_text: 'Curated architectural inspiration for design systems',
        html_content: '<h1>Design Trends 2026</h1><p>Welcome to this week edition.</p>',
        audience_segment: 'all_subscribers'
      }, superAdminToken);

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      testNewsletterId = res.body.data.id;
    });

    await test('31. Public Newsletter Subscription', async () => {
      const randomSub = `sub_${Date.now()}@example.com`;
      const res = await request('POST', '/marketplace/marketing/newsletters/subscribe', {
        email: randomSub,
        source: 'homepage_banner_popup'
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    await test('32. Send Newsletter Simulation to Subscribers', async () => {
      const res = await request('POST', `/admin/marketing/newsletters/${testNewsletterId}/send`, {}, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.data.status !== 'sent') throw new Error(`Expected sent, got ${res.body.data.status}`);
      if (res.body.data.total_recipients <= 0) throw new Error('Expected positive recipient count');
    });

    // ── 12. AFFILIATES & PAYOUTS ──────────────────────────────────────────────
    await test('33. List Affiliates Roster', async () => {
      const res = await request('GET', '/admin/marketing/affiliates', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected affiliates array');
    });

    const testAffCode = `AFFTEST${Date.now().toString().slice(-4)}`;
    await test('34. Onboard New Marketing Affiliate', async () => {
      const res = await request('POST', '/admin/marketing/affiliates', {
        affiliate_code: testAffCode,
        affiliate_name: 'Studio Vector Media',
        email: `partner_${Date.now()}@studiovector.com`,
        affiliate_type: 'agency',
        commission_rate: 12.50,
        status: 'approved'
      }, superAdminToken);

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      testAffiliateId = res.body.data.id;
    });

    await test('35. Track Affiliate Referral Click', async () => {
      const res = await request('POST', '/marketplace/marketing/affiliates/track-click', {
        affiliateCode: testAffCode,
        landingPage: '/browse?category=design-systems',
        referrerUrl: 'https://youtube.com'
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.body.data.tracked) throw new Error('Affiliate click was not tracked');
    });

    // ── 13. REFERRAL PROGRAMS ─────────────────────────────────────────────────
    await test('36. List Referral Programs', async () => {
      const res = await request('GET', '/admin/marketing/referrals', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected referral programs array');
    });

    await test('37. Create Referral Program', async () => {
      const res = await request('POST', '/admin/marketing/referrals', {
        name: 'Community Creator Referral Drive 2026',
        description: 'Invite design peers and earn platform credits',
        referrer_reward_type: 'fixed',
        referrer_reward_value: 2000,
        referred_reward_type: 'fixed',
        referred_reward_value: 1500,
        min_order_cents: 4000,
        budget_cents: 200000
      }, superAdminToken);

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      testReferralProgId = res.body.data.id;
    });

    // ── 14. ADVERTISEMENT MANAGEMENT & SPEND TRACKING ─────────────────────────
    await test('38. List Advertisements', async () => {
      const res = await request('GET', '/admin/marketing/ads', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected ads array');
    });

    await test('39. Create Advertisement Campaign', async () => {
      const res = await request('POST', '/admin/marketing/ads', {
        name: 'Sponsored Design Audit Ad Campaign',
        headline: 'Scale Your UX Conversion by 2.5x',
        ad_type: 'homepage_banner',
        placement: 'homepage_top',
        bid_amount_cents: 80,
        total_budget_cents: 50000,
        daily_budget_cents: 5000,
        destination_url: '/services/design-audit',
        status: 'active'
      }, superAdminToken);

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      testAdId = res.body.data.id;
    });

    await test('40. Track Ad Click and Update Budget Spend', async () => {
      const res = await request('POST', `/marketplace/marketing/ads/${testAdId}/click`, {});
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.data.clicks < 1) throw new Error('Ad clicks did not increment');
      if (res.body.data.current_spend_cents <= 0) throw new Error('Ad spend did not increase');
    });

    // ── 15. AUDIT LOGS & SETTINGS ─────────────────────────────────────────────
    await test('41. Marketing Audit Logs Tracking', async () => {
      const res = await request('GET', '/admin/marketing/audit-logs?limit=10', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data) || res.body.data.length === 0) throw new Error('Expected audit log records');
    });

    await test('42. Marketing Settings Read & Update', async () => {
      const getRes = await request('GET', '/admin/marketing/settings', null, superAdminToken);
      if (getRes.status !== 200) throw new Error(`Expected 200, got ${getRes.status}`);

      const putRes = await request('PUT', '/admin/marketing/settings', {
        default_affiliate_commission_rate: 12.0
      }, superAdminToken);
      if (putRes.status !== 200) throw new Error(`Expected 200, got ${putRes.status}`);
    });

    // ── 16. PUBLIC MARKETPLACE INTEGRATION ENDPOINTS ───────────────────────────
    await test('43. Public Marketplace Banners Endpoint', async () => {
      const res = await request('GET', '/marketplace/marketing/banners?placement=hero');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected array of public banners');
    });

    await test('44. Public Marketplace Promotional Sections Endpoint', async () => {
      const res = await request('GET', '/marketplace/marketing/sections');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected array of sections with resolved items');
    });

    await test('45. Public Marketplace Featured Products Endpoint', async () => {
      const res = await request('GET', '/marketplace/marketing/featured-products?placement=homepage');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected array of public featured products');
    });

    await test('46. Public Marketplace Featured Services Endpoint', async () => {
      const res = await request('GET', '/marketplace/marketing/featured-services?placement=homepage');
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body.data)) throw new Error('Expected array of public featured services');
    });

  } catch (globalErr) {
    console.error('Fatal test runner error:', globalErr);
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n==================================================================');
  console.log(`🏁 MARKETING TEST SUITE COMPLETE: ${passCount} Passed, ${failCount} Failed 🏁`);
  console.log('==================================================================');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
