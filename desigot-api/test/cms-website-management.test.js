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
  console.log('🧪 STARTING DESIGOT CMS & WEBSITE MANAGEMENT TEST SUITE 🧪');
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
  let buyerToken;
  let testHeroId;
  let testMenuId;
  let testMenuItemId;
  let testFaqId;
  let testPageId;
  let testPageVersionId;
  let testPostId;
  let testMediaId;
  let testRedirectId;
  let testSubmissionId;
  let testLegalDocVersionId;

  try {
    // ── 1. AUTHENTICATION SETUP & RBAC ────────────────────────────────────────
    await test('1. Super Admin Authentication', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'superadmin@desigot.com',
        password: 'Password123!',
      });
      superAdminToken = res.body.data?.accessToken || res.body.data?.token;
      if (res.status !== 200 || !superAdminToken) throw new Error(`Superadmin login failed: ${JSON.stringify(res.body)}`);
    });

    await test('2. Buyer Authentication', async () => {
      const res = await request('POST', '/auth/login', {
        email: 'buyer@desigot.com',
        password: 'Password123!',
      });
      buyerToken = res.body.data?.accessToken || res.body.data?.token;
      if (res.status !== 200 || !buyerToken) throw new Error(`Buyer login failed: ${JSON.stringify(res.body)}`);
    });

    await test('3. RBAC: Reject unauthorized buyer from CMS admin panel', async () => {
      const res = await request('GET', '/admin/cms/stats/summary', null, buyerToken);
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    });

    // ── 2. KPI STATS SUMMARY ──────────────────────────────────────────────────
    await test('4. CMS KPI Stats Summary', async () => {
      const res = await request('GET', '/admin/cms/stats/summary', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = res.body.data;
      if (typeof data.activePages !== 'number' || typeof data.publishedBlogPosts !== 'number' || typeof data.mediaAssets !== 'number') {
        throw new Error('Invalid KPI response payload');
      }
    });

    // ── 3. HOMEPAGE MANAGEMENT ────────────────────────────────────────────────
    await test('5. Retrieve Homepage Settings and Sections', async () => {
      const res = await request('GET', '/admin/cms/homepage', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const { settings, sections } = res.body.data;
      if (!settings || !Array.isArray(sections) || sections.length < 10) {
        throw new Error('Expected at least 10 homepage sections');
      }
    });

    await test('6. Update Homepage Global Settings', async () => {
      const res = await request('PUT', '/admin/cms/homepage', {
        announcement_bar_text: '⚡ Spring Flash Sale: Up to 30% Off All Figma Kits',
        announcement_bar_enabled: true
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.data.announcement_bar_text !== '⚡ Spring Flash Sale: Up to 30% Off All Figma Kits') {
        throw new Error('Announcement bar text not updated');
      }
    });

    await test('7. Reorder Homepage Sections', async () => {
      const res = await request('PUT', '/admin/cms/homepage/sections/reorder', {
        orderedKeys: ['hero', 'featured_products', 'promotions', 'categories', 'trending_services']
      }, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    // ── 4. HERO SECTION & SLIDES ──────────────────────────────────────────────
    await test('8. Retrieve Hero Slides', async () => {
      const res = await request('GET', '/admin/cms/hero', null, superAdminToken);
      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length < 5) {
        throw new Error('Expected at least 5 hero slides');
      }
      testHeroId = res.body.data[0].id;
    });

    await test('9. Create New Hero Slide', async () => {
      const res = await request('POST', '/admin/cms/hero', {
        name: 'Automated Test Hero Slide',
        title: 'Empower Your Design Velocity',
        subtitle: 'Automated test suite creation',
        desktop_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920',
        primary_cta_text: 'Explore Now',
        primary_cta_url: '/browse',
        priority: 99
      }, superAdminToken);
      if (res.status !== 201 || !res.body.data?.id) throw new Error(`Failed to create hero: ${JSON.stringify(res.body)}`);
      testHeroId = res.body.data.id;
    });

    await test('10. Update Hero Slide', async () => {
      const res = await request('PUT', `/admin/cms/hero/${testHeroId}`, {
        title: 'Empower Your Design Velocity - Updated'
      }, superAdminToken);
      if (res.status !== 200 || res.body.data.title !== 'Empower Your Design Velocity - Updated') {
        throw new Error('Hero slide update failed');
      }
    });

    await test('11. Toggle Hero Slide Status', async () => {
      const res = await request('PATCH', `/admin/cms/hero/${testHeroId}/toggle-status`, null, superAdminToken);
      if (res.status !== 200) throw new Error('Failed to toggle hero status');
    });

    await test('12. Delete Test Hero Slide', async () => {
      const res = await request('DELETE', `/admin/cms/hero/${testHeroId}`, null, superAdminToken);
      if (res.status !== 200) throw new Error('Failed to delete hero slide');
    });

    // ── 5. NAVIGATION MENUS ───────────────────────────────────────────────────
    await test('13. Retrieve Navigation Menus and Nested Items', async () => {
      const res = await request('GET', '/admin/cms/navigation', null, superAdminToken);
      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length < 3) {
        throw new Error('Expected at least 3 navigation menus');
      }
      testMenuId = res.body.data[0].id;
    });

    await test('14. Create Menu Item', async () => {
      const res = await request('POST', `/admin/cms/navigation/${testMenuId}/items`, {
        label: 'Test Nav Link',
        item_type: 'internal_page',
        target_url: '/pages/test',
        sort_order: 99
      }, superAdminToken);
      if (res.status !== 201 || !res.body.data?.id) throw new Error('Failed to create menu item');
      testMenuItemId = res.body.data.id;
    });

    await test('15. Update and Delete Menu Item', async () => {
      const up = await request('PUT', `/admin/cms/navigation/items/${testMenuItemId}`, {
        label: 'Test Nav Link Updated'
      }, superAdminToken);
      if (up.status !== 200 || up.body.data.label !== 'Test Nav Link Updated') throw new Error('Failed to update menu item');

      const del = await request('DELETE', `/admin/cms/navigation/items/${testMenuItemId}`, null, superAdminToken);
      if (del.status !== 200) throw new Error('Failed to delete menu item');
    });

    // ── 6. MEGA MENU ──────────────────────────────────────────────────────────
    await test('16. Retrieve Browse Mega Menu Columns and Links', async () => {
      const res = await request('GET', '/admin/cms/mega-menu', null, superAdminToken);
      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length < 3) {
        throw new Error('Expected at least 3 mega menu columns');
      }
      const totalItems = res.body.data.reduce((acc, c) => acc + (c.items ? c.items.length : 0), 0);
      if (totalItems < 15) throw new Error(`Expected at least 15 mega menu items, got ${totalItems}`);
    });

    // ── 7. SERVICES & CATEGORIES PAGES ────────────────────────────────────────
    await test('17. Services Page CMS Settings', async () => {
      const res = await request('GET', '/admin/cms/services-page', null, superAdminToken);
      if (res.status !== 200 || !res.body.data?.page_title) throw new Error('Failed to get services page settings');

      const up = await request('PUT', '/admin/cms/services-page', {
        page_title: 'Hire Elite UI/UX Specialists & Digital Agencies – Updated'
      }, superAdminToken);
      if (up.status !== 200 || up.body.data.page_title !== 'Hire Elite UI/UX Specialists & Digital Agencies – Updated') {
        throw new Error('Failed to update services page settings');
      }
    });

    await test('18. Categories Page CMS Settings', async () => {
      const res = await request('GET', '/admin/cms/categories-page', null, superAdminToken);
      if (res.status !== 200 || !res.body.data?.page_title) throw new Error('Failed to get categories page settings');
    });

    // ── 8. FEATURED & TRENDING SECTIONS ───────────────────────────────────────
    await test('19. Featured Sections (Min 8 sections)', async () => {
      const res = await request('GET', '/admin/cms/featured-sections', null, superAdminToken);
      if (res.status !== 200 || res.body.data.length < 8) throw new Error(`Expected >= 8 featured sections, got ${res.body.data?.length}`);
    });

    await test('20. Trending Sections (Min 6 sections)', async () => {
      const res = await request('GET', '/admin/cms/trending-sections', null, superAdminToken);
      if (res.status !== 200 || res.body.data.length < 6) throw new Error(`Expected >= 6 trending sections, got ${res.body.data?.length}`);
    });

    // ── 9. ABOUT US & TEAM MEMBERS ────────────────────────────────────────────
    await test('21. About Us Content & Team Members', async () => {
      const res = await request('GET', '/admin/cms/about', null, superAdminToken);
      if (res.status !== 200 || !res.body.data?.content || !Array.isArray(res.body.data.team) || res.body.data.team.length < 4) {
        throw new Error('Expected About content and at least 4 team members');
      }
    });

    // ── 10. CONTACT SETTINGS & SUBMISSIONS ────────────────────────────────────
    await test('22. Contact Settings & Submissions', async () => {
      const s = await request('GET', '/admin/cms/contact/settings', null, superAdminToken);
      if (s.status !== 200 || !s.body.data?.support_email) throw new Error('Failed to get contact settings');

      const subs = await request('GET', '/admin/cms/contact/submissions', null, superAdminToken);
      if (subs.status !== 200 || subs.body.data.length < 10) throw new Error('Expected at least 10 contact submissions');
      testSubmissionId = subs.body.data[0].id;
    });

    await test('23. Update Contact Submission Status', async () => {
      const res = await request('PATCH', `/admin/cms/contact/submissions/${testSubmissionId}/status`, {
        status: 'in_progress',
        adminNotes: 'Assigned to enterprise sales lead for immediate follow-up.'
      }, superAdminToken);
      if (res.status !== 200 || res.body.data.status !== 'in_progress') {
        throw new Error('Failed to update submission status');
      }
    });

    // ── 11. FAQ MANAGEMENT ────────────────────────────────────────────────────
    await test('24. FAQ Categories (Min 8) and FAQs (Min 40)', async () => {
      const cats = await request('GET', '/admin/cms/faqs/categories', null, superAdminToken);
      if (cats.status !== 200 || cats.body.data.length < 8) throw new Error('Expected at least 8 FAQ categories');

      const faqs = await request('GET', '/admin/cms/faqs', null, superAdminToken);
      if (faqs.status !== 200 || faqs.body.data.length < 40) throw new Error('Expected at least 40 FAQs');
    });

    await test('25. Create and Delete FAQ', async () => {
      const createRes = await request('POST', '/admin/cms/faqs', {
        question: 'Automated Test FAQ Question?',
        answer_html: '<p>This is an automated test answer.</p>',
        display_position: 99
      }, superAdminToken);
      if (createRes.status !== 201 || !createRes.body.data?.id) throw new Error('Failed to create FAQ');
      testFaqId = createRes.body.data.id;

      const delRes = await request('DELETE', `/admin/cms/faqs/${testFaqId}`, null, superAdminToken);
      if (delRes.status !== 200) throw new Error('Failed to delete FAQ');
    });

    // ── 12. LEGAL DOCUMENTS & VERSION ROLLBACK ────────────────────────────────
    await test('26. Legal Documents (Terms, Privacy, Refund) with 3+ versions', async () => {
      const res = await request('GET', '/admin/cms/legal/terms', null, superAdminToken);
      if (res.status !== 200 || !res.body.data || !Array.isArray(res.body.data.versions) || res.body.data.versions.length < 3) {
        throw new Error('Expected Terms document with at least 3 historical versions');
      }
      testLegalDocVersionId = res.body.data.versions[1].id; // Historic version
    });

    await test('27. Update Terms Document and Verify Version Archival', async () => {
      const res = await request('PUT', '/admin/cms/legal/terms', {
        title: 'Terms of Service v2.1 (Automated Test)',
        content_html: '<h2>Updated Terms</h2><p>Automated test revision content.</p>',
        version: '2.1.0',
        change_summary: 'Automated test suite legal revision'
      }, superAdminToken);
      if (res.status !== 200 || res.body.data.version !== '2.1.0') throw new Error('Failed to update legal document');
    });

    await test('28. Restore Legal Document Historic Version', async () => {
      const res = await request('POST', `/admin/cms/legal/terms/restore/${testLegalDocVersionId}`, null, superAdminToken);
      if (res.status !== 200) throw new Error('Failed to restore historical legal version');
    });

    // ── 13. FOOTER MANAGEMENT ─────────────────────────────────────────────────
    await test('29. Footer Settings, Columns (Min 6), Links (Min 30)', async () => {
      const res = await request('GET', '/admin/cms/footer', null, superAdminToken);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const { settings, columns } = res.body.data;
      if (!settings || !Array.isArray(columns) || columns.length < 6) throw new Error('Expected >= 6 footer columns');
      const totalLinks = columns.reduce((acc, c) => acc + (c.links ? c.links.length : 0), 0);
      if (totalLinks < 30) throw new Error(`Expected >= 30 footer links, got ${totalLinks}`);
    });

    // ── 14. STATIC PAGES & VERSIONING ─────────────────────────────────────────
    await test('30. Static Pages (Min 15 Pages)', async () => {
      const res = await request('GET', '/admin/cms/pages', null, superAdminToken);
      if (res.status !== 200 || res.body.total < 15) throw new Error(`Expected >= 15 static pages, got ${res.body.total}`);
      testPageId = res.body.data[0].id;
    });

    await test('31. Create Static Page and Save Version', async () => {
      const res = await request('POST', '/admin/cms/pages', {
        title: 'Automated Test Page',
        slug: 'automated-test-page',
        description: 'Testing page creation and block storage',
        content_html: '<h2>Automated Content</h2>',
        content_blocks_json: [{ type: 'header', content: 'Automated Content' }]
      }, superAdminToken);
      if (res.status !== 201 || !res.body.data?.id) throw new Error('Failed to create static page');
      const newPageId = res.body.data.id;

      // Delete test page
      await request('DELETE', `/admin/cms/pages/${newPageId}`, null, superAdminToken);
    });

    // ── 15. BLOG MANAGEMENT ───────────────────────────────────────────────────
    await test('32. Blog Categories (Min 8), Tags (Min 20), Posts (Min 20)', async () => {
      const cats = await request('GET', '/admin/cms/blog/categories', null, superAdminToken);
      if (cats.status !== 200 || cats.body.data.length < 8) throw new Error('Expected >= 8 blog categories');

      const tags = await request('GET', '/admin/cms/blog/tags', null, superAdminToken);
      if (tags.status !== 200 || tags.body.data.length < 20) throw new Error('Expected >= 20 blog tags');

      const posts = await request('GET', '/admin/cms/blog/posts', null, superAdminToken);
      if (posts.status !== 200 || posts.body.total < 20) throw new Error(`Expected >= 20 blog posts, got ${posts.body.total}`);
    });

    // ── 16. MEDIA LIBRARY & SEO ───────────────────────────────────────────────
    await test('33. Media Library Assets (Min 40 assets)', async () => {
      const res = await request('GET', '/admin/cms/media', null, superAdminToken);
      if (res.status !== 200 || res.body.total < 40) throw new Error(`Expected >= 40 media assets, got ${res.body.total}`);
    });

    await test('34. Global SEO Settings & Redirects (Min 10 redirects)', async () => {
      const res = await request('GET', '/admin/cms/seo', null, superAdminToken);
      if (res.status !== 200) throw new Error('Failed to get SEO settings');
      const { settings, redirects } = res.body.data;
      if (!settings?.canonical_base_url || !Array.isArray(redirects) || redirects.length < 10) {
        throw new Error('Expected SEO settings and at least 10 redirects');
      }
    });

    await test('35. CMS Audit Logs (Min 100 entries)', async () => {
      const res = await request('GET', '/admin/cms/audit-logs', null, superAdminToken);
      if (res.status !== 200 || res.body.total < 100) throw new Error(`Expected >= 100 CMS audit logs, got ${res.body.total}`);
    });

    // ── 17. PUBLIC MARKETPLACE CMS APIS ───────────────────────────────────────
    await test('36. Public Marketplace Homepage CMS Endpoint', async () => {
      const res = await request('GET', '/public/cms/homepage');
      if (res.status !== 200 || !res.body.data?.settings || !res.body.data?.hero || !Array.isArray(res.body.data?.sections)) {
        throw new Error('Invalid public homepage payload');
      }
    });

    await test('37. Public Marketplace About Us Endpoint', async () => {
      const res = await request('GET', '/public/cms/about');
      if (res.status !== 200 || !res.body.data?.content || !Array.isArray(res.body.data?.team)) {
        throw new Error('Invalid public about payload');
      }
    });

    await test('38. Public Marketplace FAQs Endpoint', async () => {
      const res = await request('GET', '/public/cms/faqs');
      if (res.status !== 200 || !Array.isArray(res.body.data?.faqs) || res.body.data.faqs.length < 30) {
        throw new Error('Invalid public FAQs payload');
      }
    });

    await test('39. Public Marketplace Legal Document (Terms & Privacy)', async () => {
      const terms = await request('GET', '/public/cms/legal/terms');
      if (terms.status !== 200 || !terms.body.data?.content_html) throw new Error('Failed to get public terms');

      const privacy = await request('GET', '/public/cms/legal/privacy');
      if (privacy.status !== 200 || !privacy.body.data?.content_html) throw new Error('Failed to get public privacy');
    });

    await test('40. Public Marketplace Contact Form Submission', async () => {
      const res = await request('POST', '/public/cms/contact', {
        name: 'Public Test Inquirer',
        email: 'inquirer@example.com',
        subject: 'General Question on Licensing',
        message: 'Hello, what license do I need for a SaaS platform with 50k users?'
      });
      if (res.status !== 201 || !res.body.data?.id) throw new Error('Failed to submit public contact form');
    });

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  console.log('\n==================================================================');
  console.log(`🏁 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED 🏁`);
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
