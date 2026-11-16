'use strict';
require('dotenv').config();
const { Pool } = require('pg');
const config = require('../config');

async function seedAnalyticsBI() {
  const pool = new Pool({ connectionString: config.db.primary });
  const client = await pool.connect();

  try {
    console.log('Seeding Comprehensive Analytics & BI Module Data...');
    await client.query('BEGIN');

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ENSURE AT LEAST 40 SELLERS (Currently ~32)
    // ─────────────────────────────────────────────────────────────────────────
    const sellerCountRes = await client.query(
      `SELECT COUNT(*) FROM users WHERE role = 'seller' OR seller_verified = TRUE`
    );
    const existingSellers = parseInt(sellerCountRes.rows[0].count, 10);
    console.log(`Current sellers count: ${existingSellers}`);

    const sellerCategories = await client.query(`SELECT id FROM listing_categories LIMIT 10`);
    const catIds = sellerCategories.rows.map(r => r.id);

    if (existingSellers < 40) {
      const needed = 42 - existingSellers;
      console.log(`Adding ${needed} development sellers to reach 42...`);
      for (let i = 1; i <= needed; i++) {
        await client.query(`
          INSERT INTO users (
            email, password_hash, role, first_name, last_name, display_name,
            account_status, seller_verified, seller_type, avg_seller_rating,
            total_sales, seller_review_count, created_at
          ) VALUES (
            $1, '$2a$10$wT2eXoYm8qZtT0gB7U7.9eQoI2M9wZ1y2b3c4d5e6f7g8h9i0jklm',
            'seller', $2, $3, $4, 'active', TRUE, 'freelancer',
            $5, $6, $7,
            NOW() - (random() * INTERVAL '180 days')
          )
          ON CONFLICT (email) DO NOTHING;
        `, [
          `seller.pro${i + 50}@desigot.com`,
          `StudioPro`,
          `Creator ${i}`,
          `Studio Pro ${i}`,
          4.5 + Math.random() * 0.4,
          20 + (i * 5),
          10 + i
        ]);
      }
    }

    const allSellersRes = await client.query(
      `SELECT id, display_name FROM users WHERE role = 'seller' OR seller_verified = TRUE`
    );
    const sellerIds = allSellersRes.rows.map(r => r.id);
    console.log(`✓ Total available sellers: ${sellerIds.length}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ENSURE AT LEAST 100 SERVICES (Currently ~69)
    // ─────────────────────────────────────────────────────────────────────────
    const serviceCountRes = await client.query(`SELECT COUNT(*) FROM services`);
    const currentServices = parseInt(serviceCountRes.rows[0].count, 10);
    console.log(`Current services count: ${currentServices}`);

    if (currentServices < 100) {
      const neededServices = 105 - currentServices;
      console.log(`Adding ${neededServices} development services to reach 105...`);
      const serviceTitles = [
        'Enterprise SaaS Design System & Figma UI Kit',
        'Mobile App Prototype & Flutter Code Delivery',
        'Custom 3D WebGL Landing Page & Interaction Design',
        'Branding & Visual Identity Masterclass Package',
        'Full-Stack Next.js 15 & PostgreSQL Web Application',
        'High-Converting E-Commerce Shopify Theme Customization',
        'AI Agent Workflow Orchestration & Tool Integration',
        'Microservices Cloud Architecture & Docker DevOps Setup',
        'B2B Product Strategy & UX Audit Consultation',
        'Custom Webflow Agency Website with Interactive CMS',
        'FinTech Mobile Banking iOS & Android Interface',
        'Real-time Analytics Dashboard & Chart Visualization',
        'Design Audit & Accessibility WCAG 2.1 Compliance',
        'Interactive SVG Icons & Vector Illustration Suite'
      ];

      for (let i = 1; i <= neededServices; i++) {
        const sId = sellerIds[i % sellerIds.length];
        const cId = catIds[i % catIds.length];
        const baseTitle = serviceTitles[i % serviceTitles.length];
        const title = `${baseTitle} (Tier ${i})`;
        const slug = `service-bi-${i}-${Date.now().toString(36)}`;
        const price = (150 + (i * 25)) * 100;
        const deliveryDays = 3 + (i % 7);
        const totalOrders = 5 + (i * 2);
        const totalRevenue = totalOrders * price;
        const avgRating = 4.6 + Math.random() * 0.4;
        const reviewCount = 8 + (i % 15);
        const viewCount = 150 + (i * 20);

        await client.query(`
          INSERT INTO services (
            seller_id, category_id, title, slug, short_description, description,
            status, starting_price_cents, currency, delivery_time_days, revision_limit,
            total_orders, total_revenue_cents, avg_rating, review_count, view_count,
            created_at, published_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, 'published', $7, 'USD', $8, 3,
            $9, $10, $11, $12, $13,
            NOW() - (random() * INTERVAL '120 days'), NOW() - (random() * INTERVAL '100 days')
          );
        `, [
          sId, cId, title, slug,
          'Professional marketplace enterprise delivery package with full commercial licensing and revision support.',
          'Full-service professional creative implementation tailored for modern software startups and agencies.',
          price, deliveryDays, totalOrders, totalRevenue, avgRating, reviewCount, viewCount
        ]);
      }
    }
    console.log('✓ Services count verified >= 100');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ENSURE AT LEAST 100 DIGITAL PRODUCTS (Currently ~16)
    // ─────────────────────────────────────────────────────────────────────────
    const productCountRes = await client.query(`SELECT COUNT(*) FROM digital_products`);
    const currentProducts = parseInt(productCountRes.rows[0].count, 10);
    console.log(`Current digital products count: ${currentProducts}`);

    if (currentProducts < 100) {
      const neededProducts = 105 - currentProducts;
      console.log(`Adding ${neededProducts} digital products to reach 105...`);
      const productTitles = [
        'Fintech UI Kit 200+ Dark Mode Mobile Screens',
        'SaaS Admin Dashboard Wireframe & Component Library',
        'iOS 18 Native Design System for Figma with Auto-Layout',
        'TailwindCSS E-Commerce Storefront Production Template',
        '3D Isometric Tech Icon Set (Blender + PNG + SVG)',
        'Modern Pitch Deck Presentation Slides for Founders',
        'Complete Branding Mockup Bundle & Stationery PSDs',
        'Next.js Full-Stack Starter Template with Auth & Stripe',
        'Notion Creator Operating System & Project Planner',
        'Mobile App Micro-Interactions & Lottie JSON Animations',
        'Design Agency Contract & Legal Proposal Templates',
        'Cryptocurrency & Web3 Wallet UI Concept System',
        'Vector Logo Kit & Vintage Monogram Typography Pack',
        'Social Media Carousel & Instagram Growth Graphic Kit'
      ];

      for (let i = 1; i <= neededProducts; i++) {
        const sId = sellerIds[i % sellerIds.length];
        const cId = catIds[i % catIds.length];
        const baseTitle = productTitles[i % productTitles.length];
        const title = `${baseTitle} Vol. ${i}`;
        const slug = `product-bi-${i}-${Date.now().toString(36)}`;
        const pricePersonal = (29 + (i * 5)) * 100;
        const priceCommercial = pricePersonal * 2;
        const priceExtended = pricePersonal * 4;
        const isFeatured = (i % 5 === 0);
        const totalSales = 15 + (i * 3);
        const totalRevenue = totalSales * pricePersonal;
        const totalDownloads = 25 + (i * 4);
        const viewCount = 300 + (i * 40);
        const avgRating = 4.7 + Math.random() * 0.3;
        const reviewCount = 12 + (i % 20);

        await client.query(`
          INSERT INTO digital_products (
            seller_id, category_id, title, slug, short_description, description,
            version, status, price_personal_cents, price_commercial_cents,
            price_extended_cents, currency, is_featured, file_formats, tags,
            total_sales, total_revenue_cents, total_downloads, view_count,
            avg_rating, review_count, created_at, published_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, '1.2.0', 'published', $7, $8, $9, 'USD',
            $10, ARRAY['figma', 'sketch', 'svg', 'png'], ARRAY['design', 'template', 'ui-kit'],
            $11, $12, $13, $14,
            $15, $16,
            NOW() - (random() * INTERVAL '150 days'), NOW() - (random() * INTERVAL '130 days')
          );
        `, [
          sId, cId, title, slug,
          'Ready-to-use professional digital asset bundle with verified licensing and continuous updates.',
          'Comprehensive design system and digital deliverable package crafted for high performance.',
          pricePersonal, priceCommercial, priceExtended,
          isFeatured, totalSales, totalRevenue, totalDownloads, viewCount, avgRating, reviewCount
        ]);
      }
    }
    console.log('✓ Digital Products count verified >= 100');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. SEED 5,000+ ANALYTICS SESSIONS & EVENTS (7-Stage Funnel)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 5,000+ analytics events across 7-stage conversion funnel...');

    // Fetch users for linking
    const userRows = await client.query(`SELECT id FROM users LIMIT 150`);
    const buyerIds = userRows.rows.map(r => r.id);

    // Fetch digital products and services for resource referencing
    const prodRows = await client.query(`SELECT id FROM digital_products LIMIT 50`);
    const srvRows = await client.query(`SELECT id FROM services LIMIT 50`);
    const productSampleIds = prodRows.rows.map(r => r.id);
    const serviceSampleIds = srvRows.rows.map(r => r.id);

    const devices = ['Desktop', 'Desktop', 'Mobile', 'Mobile', 'Mobile', 'Tablet'];
    const browsers = ['Chrome', 'Chrome', 'Safari', 'Firefox', 'Edge'];
    const trafficSources = ['Direct', 'Organic Search', 'Organic Search', 'Social', 'Referral', 'Email', 'Paid Ad'];
    const landingPages = ['/', '/browse', '/categories', '/services', '/blog'];

    // Clear previous raw analytics sessions & events for clean idempotent rebuild
    await client.query(`DELETE FROM analytics_events WHERE created_at < NOW()`);
    await client.query(`DELETE FROM analytics_sessions WHERE started_at < NOW()`);

    // Create 1,500 realistic visitor sessions
    const sessionIds = [];
    for (let s = 1; s <= 1500; s++) {
      const anonSessionId = `sess_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
      sessionIds.push(anonSessionId);

      const uId = (s % 3 === 0) ? buyerIds[s % buyerIds.length] : null;
      const device = devices[s % devices.length];
      const browser = browsers[s % browsers.length];
      const source = trafficSources[s % trafficSources.length];
      const landing = landingPages[s % landingPages.length];
      const hoursAgo = Math.floor(Math.random() * (90 * 24)); // Last 90 days

      await client.query(`
        INSERT INTO analytics_sessions (
          anonymous_session_id, user_id, device_type, browser, os,
          traffic_source, landing_page, started_at, last_activity_at
        ) VALUES (
          $1, $2, $3, $4, 'Windows', $5, $6,
          NOW() - ($7 || ' hours')::INTERVAL, NOW() - ($7 || ' hours')::INTERVAL + INTERVAL '15 minutes'
        );
      `, [anonSessionId, uId, device, browser, source, landing, hoursAgo]);
    }
    console.log(`✓ Seeded ${sessionIds.length} analytics sessions`);

    // Funnel distribution:
    // 1. page_view: ~2,500
    // 2. product_view: ~1,000
    // 3. service_view: ~800
    // 4. registration_started: ~350
    // 5. registration_completed: ~250
    // 6. add_to_cart: ~500
    // 7. checkout_started: ~300
    // 8. payment_initiated: ~200
    // 9. purchase_completed: ~150
    // Total events: ~6,050
    const eventBatches = [
      { type: 'page_view', count: 2500, resType: 'page' },
      { type: 'product_view', count: 1000, resType: 'digital_product' },
      { type: 'service_view', count: 800, resType: 'service' },
      { type: 'registration_started', count: 350, resType: 'auth' },
      { type: 'registration_completed', count: 250, resType: 'auth' },
      { type: 'add_to_cart', count: 500, resType: 'cart' },
      { type: 'checkout_started', count: 300, resType: 'checkout' },
      { type: 'payment_initiated', count: 200, resType: 'payment' },
      { type: 'purchase_completed', count: 150, resType: 'order' }
    ];

    let totalEventsSeeded = 0;
    for (const batch of eventBatches) {
      for (let i = 0; i < batch.count; i++) {
        const sessId = sessionIds[i % sessionIds.length];
        const uId = (i % 4 === 0) ? buyerIds[i % buyerIds.length] : null;
        const device = devices[i % devices.length];
        const source = trafficSources[i % trafficSources.length];
        const hoursAgo = Math.floor(Math.random() * (90 * 24)); // Within last 90 days

        let resId = null;
        if (batch.resType === 'digital_product' && productSampleIds.length) {
          resId = productSampleIds[i % productSampleIds.length];
        } else if (batch.resType === 'service' && serviceSampleIds.length) {
          resId = serviceSampleIds[i % serviceSampleIds.length];
        }

        await client.query(`
          INSERT INTO analytics_events (
            event_type, user_id, session_id, resource_type, resource_id,
            device_type, traffic_source, referrer, metadata, created_at, occurred_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            NOW() - ($10 || ' hours')::INTERVAL, NOW() - ($10 || ' hours')::INTERVAL
          );
        `, [
          batch.type,
          uId,
          sessId,
          batch.resType,
          resId,
          device,
          source,
          source === 'Organic Search' ? 'https://google.com' : 'https://desigot.com',
          JSON.stringify({ funnelStep: batch.type, device, source }),
          hoursAgo
        ]);
        totalEventsSeeded++;
      }
    }
    console.log(`✓ Seeded ${totalEventsSeeded} granular analytics events`);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. SEED 20 DEVELOPMENT EXPORT HISTORY RECORDS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Seeding 20 analytics report export history records...');
    await client.query(`DELETE FROM analytics_report_exports WHERE created_at < NOW()`);

    const exportTypes = [
      { name: 'Q1 Comprehensive Revenue Breakdown', type: 'revenue', format: 'csv', records: 420 },
      { name: 'Monthly Sales & Order Volume Report', type: 'sales', format: 'xlsx', records: 580 },
      { name: 'Service Catalog Performance & Bookings', type: 'services', format: 'csv', records: 105 },
      { name: 'Digital Product Downloads & Licensing Audit', type: 'products', format: 'pdf', records: 105 },
      { name: 'Top Seller Earnings & Payout Ledger', type: 'sellers', format: 'xlsx', records: 42 },
      { name: 'Customer Cohorts & Lifetime Value (LTV)', type: 'customers', format: 'csv', records: 203 },
      { name: 'Marketplace Platform Commission Reconciliation', type: 'commissions', format: 'csv', records: 340 },
      { name: 'Conversion Funnel & Drop-off Analysis', type: 'conversion', format: 'pdf', records: 6050 },
      { name: 'Design Taxonomy & Category GMV Rankings', type: 'categories', format: 'csv', records: 10 },
      { name: 'Annual Executive Gross vs Net Revenue Report', type: 'revenue', format: 'pdf', records: 1200 },
      { name: 'B2B Custom Quotes & Milestones Summary', type: 'sales', format: 'xlsx', records: 185 },
      { name: 'Escrow Holdings & Disbursal Audit', type: 'revenue', format: 'csv', records: 280 },
      { name: 'Top 50 Best Selling Digital Assets', type: 'products', format: 'csv', records: 50 },
      { name: 'Top 50 Booked Professional Services', type: 'services', format: 'xlsx', records: 50 },
      { name: 'Buyer Churn & Repeat Purchase Cohorts', type: 'customers', format: 'pdf', records: 150 },
      { name: 'Referral & Promo Code Usage Audit', type: 'sales', format: 'csv', records: 95 },
      { name: 'Stripe Gateway Fees & Net Deductions', type: 'revenue', format: 'xlsx', records: 490 },
      { name: 'Failed Checkout & Cart Abandonment Logs', type: 'conversion', format: 'csv', records: 300 },
      { name: 'Weekly Commission Settlement Schedule', type: 'commissions', format: 'xlsx', records: 110 },
      { name: 'Disputed Orders & Refund Liability Audit', type: 'sales', format: 'pdf', records: 35 }
    ];

    const requesterId = buyerIds[0];
    const exportStatuses = ['completed', 'completed', 'completed', 'completed', 'queued', 'processing', 'failed'];

    for (let e = 0; e < exportTypes.length; e++) {
      const exp = exportTypes[e];
      const status = exportStatuses[e % exportStatuses.length];
      const hoursAgo = e * 6; // Spread over previous days
      const createdAt = new Date(Date.now() - hoursAgo * 3600 * 1000);
      const completedAt = status === 'completed' ? new Date(createdAt.getTime() + 30 * 1000) : null;

      await client.query(`
        INSERT INTO analytics_report_exports (
          report_name, report_type, format, requested_by, filters_json,
          file_reference, status, record_count, file_size_bytes, error_message,
          expires_at, created_at, completed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          NOW() + INTERVAL '7 days',
          $11,
          $12
        );
      `, [
        exp.name,
        exp.type,
        exp.format,
        requesterId,
        JSON.stringify({ range: 'last_90_days', currency: 'USD', status: 'all' }),
        status === 'completed' ? `exports/${exp.type}_report_${Date.now().toString(36)}.${exp.format}` : null,
        status,
        exp.records,
        exp.records * 128,
        status === 'failed' ? 'Database query timed out during complex join' : null,
        createdAt,
        completedAt
      ]);
    }
    console.log(`✓ Seeded ${exportTypes.length} export history records`);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. BUILD DAILY & MONTHLY SUMMARIES FROM REAL TRANSACTIONAL RECORDS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('Generating daily and monthly summaries from underlying orders and bookings...');

    await client.query(`DELETE FROM analytics_daily_summaries`);
    await client.query(`DELETE FROM analytics_monthly_summaries`);

    // Group orders by date for daily summaries
    await client.query(`
      INSERT INTO analytics_daily_summaries (
        report_date, report_type, dimension_type, dimension_id, currency,
        gross_revenue, net_revenue, order_count, completed_order_count,
        refund_amount, commission_amount, unique_customers, metrics_json
      )
      SELECT
        DATE(created_at) as report_date,
        'overview' as report_type,
        'all' as dimension_type,
        'all' as dimension_id,
        'USD' as currency,
        ROUND(COALESCE(SUM(amount_cents), 0)::NUMERIC / 100, 2) as gross_revenue,
        ROUND(COALESCE(SUM(CASE WHEN status = 'complete' THEN amount_cents ELSE 0 END), 0)::NUMERIC / 100, 2) as net_revenue,
        COUNT(*) as order_count,
        COUNT(CASE WHEN status = 'complete' THEN 1 END) as completed_order_count,
        ROUND(COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount_cents ELSE 0 END), 0)::NUMERIC / 100, 2) as refund_amount,
        ROUND(COALESCE(SUM(platform_fee_cents), 0)::NUMERIC / 100, 2) as commission_amount,
        COUNT(DISTINCT buyer_id) as unique_customers,
        json_build_object(
          'avgOrderValue', ROUND(AVG(amount_cents)::NUMERIC / 100, 2),
          'productOrders', COUNT(CASE WHEN listing_type = 'asset' THEN 1 END),
          'serviceOrders', COUNT(CASE WHEN listing_type = 'service' THEN 1 END)
        ) as metrics_json
      FROM orders
      GROUP BY DATE(created_at)
      ON CONFLICT (report_date, report_type, dimension_type, dimension_id, currency) DO NOTHING;
    `);

    // Group orders by month for monthly summaries
    await client.query(`
      INSERT INTO analytics_monthly_summaries (
        year_month, report_type, gross_revenue, net_revenue,
        order_count, commission_amount, metrics_json
      )
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as year_month,
        'overview' as report_type,
        ROUND(COALESCE(SUM(amount_cents), 0)::NUMERIC / 100, 2) as gross_revenue,
        ROUND(COALESCE(SUM(CASE WHEN status = 'complete' THEN amount_cents ELSE 0 END), 0)::NUMERIC / 100, 2) as net_revenue,
        COUNT(*) as order_count,
        ROUND(COALESCE(SUM(platform_fee_cents), 0)::NUMERIC / 100, 2) as commission_amount,
        json_build_object(
          'completedOrders', COUNT(CASE WHEN status = 'complete' THEN 1 END),
          'refundCount', COUNT(CASE WHEN status = 'refunded' THEN 1 END)
        ) as metrics_json
      FROM orders
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ON CONFLICT (year_month, report_type) DO NOTHING;
    `);

    console.log('✓ Successfully generated pre-aggregated daily & monthly summaries');

    await client.query('COMMIT');
    console.log('\n======================================================');
    console.log('✓ ANALYTICS & BI SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Analytics BI seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedAnalyticsBI();
