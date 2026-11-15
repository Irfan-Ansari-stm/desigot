'use strict';
require('dotenv').config();
const { query } = require('../db/pool');

async function seedAdditionalTestData() {
  console.log('🚀 Seeding Additional Live Test Data for Service Management...');

  // 1. Get user IDs
  const usersRes = await query(`SELECT id, email, role FROM users LIMIT 30`);
  const superAdmin = usersRes.rows.find((u) => u.email === 'superadmin@desigot.com') || usersRes.rows[0];
  const seller = usersRes.rows.find((u) => u.role === 'seller') || usersRes.rows[1];
  const buyer = usersRes.rows.find((u) => u.role === 'buyer') || usersRes.rows[2];

  // 2. Get Services
  const servicesRes = await query(`SELECT id, title, seller_id FROM services WHERE deleted_at IS NULL LIMIT 20`);
  if (!servicesRes.rows.length) {
    console.error('No services found to link reports to.');
    process.exit(1);
  }

  // 3. Seed Fresh "new" Service Reports
  console.log('🚨 Seeding Fresh "new" Service Moderation Reports...');
  const newReports = [
    {
      service_id: servicesRes.rows[0].id,
      reporter_id: buyer.id,
      seller_id: servicesRes.rows[0].seller_id,
      reason: 'copyright_infringement',
      description: 'The hero presentation displays proprietary UI components from Linear without attribution or commercial redistribution license.',
      status: 'new',
    },
    {
      service_id: servicesRes.rows[1].id,
      reporter_id: buyer.id,
      seller_id: servicesRes.rows[1].seller_id,
      reason: 'misleading_description',
      description: 'The listing description states "3 full design revisions included with prototype", but in client chat seller stated revisions only apply to color palette.',
      status: 'new',
    },
    {
      service_id: servicesRes.rows[2].id,
      reporter_id: buyer.id,
      seller_id: servicesRes.rows[2].seller_id,
      reason: 'seller_misconduct',
      description: 'Seller pressured client to mark milestone completed before delivering source Figma files.',
      status: 'new',
    },
    {
      service_id: servicesRes.rows[3].id,
      reporter_id: buyer.id,
      seller_id: servicesRes.rows[3].seller_id,
      reason: 'fraudulent_listing',
      description: 'Mockup images were identified as public Dribbble community shots created by a different studio.',
      status: 'new',
    },
  ];

  for (const nr of newReports) {
    await query(
      `INSERT INTO service_reports (service_id, reporter_id, seller_id, reason, description, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - interval '2 hours')`,
      [nr.service_id, nr.reporter_id, nr.seller_id, nr.reason, nr.description, nr.status]
    );
  }
  console.log('  ✓ 4 new actionable moderation reports seeded.');

  // 4. Seed Category-Specific Pricing Rules
  console.log('💰 Seeding Category-Specific Pricing Rules...');
  const categoriesRes = await query(`SELECT id, name FROM listing_categories WHERE parent_id IS NULL LIMIT 6`);

  const pricingRules = [
    {
      name: 'Mobile App Design Specialized Rule',
      category_id: categoriesRes.rows[0]?.id || null,
      min_price_cents: 25000, // $250
      max_price_cents: 2500000, // $25,000
      commission_rate: 0.1200, // 12% fee
      allow_hourly: true,
      allow_packages: true,
      allow_custom_quotes: true,
    },
    {
      name: 'Enterprise SaaS Dashboard Standard',
      category_id: categoriesRes.rows[1]?.id || null,
      min_price_cents: 50000, // $500
      max_price_cents: 5000000, // $50,000
      commission_rate: 0.1400, // 14% fee
      allow_hourly: true,
      allow_packages: true,
      allow_custom_quotes: true,
    },
    {
      name: 'Branding & Corporate Identity Rule',
      category_id: categoriesRes.rows[2]?.id || null,
      min_price_cents: 15000, // $150
      max_price_cents: 1500000, // $15,000
      commission_rate: 0.1000, // 10% fee
      allow_hourly: false,
      allow_packages: true,
      allow_custom_quotes: true,
    },
    {
      name: 'Design System & Component Library Rule',
      category_id: categoriesRes.rows[3]?.id || null,
      min_price_cents: 75000, // $750
      max_price_cents: 7500000, // $75,000
      commission_rate: 0.1500, // 15% fee
      allow_hourly: true,
      allow_packages: true,
      allow_custom_quotes: true,
    },
    {
      name: 'UX Research & Usability Audit Rule',
      category_id: categoriesRes.rows[4]?.id || null,
      min_price_cents: 30000, // $300
      max_price_cents: 3000000, // $30,000
      commission_rate: 0.1250, // 12.5% fee
      allow_hourly: true,
      allow_packages: true,
      allow_custom_quotes: true,
    },
  ];

  for (const pr of pricingRules) {
    if (pr.category_id) {
      await query(
        `INSERT INTO service_pricing_rules (
          name, category_id, min_price_cents, max_price_cents, commission_rate,
          allow_hourly, allow_packages, allow_custom_quotes, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
        [
          pr.name,
          pr.category_id,
          pr.min_price_cents,
          pr.max_price_cents,
          pr.commission_rate,
          pr.allow_hourly,
          pr.allow_packages,
          pr.allow_custom_quotes,
        ]
      );
    }
  }
  console.log('  ✓ 5 category-specific pricing rules seeded.');

  // 5. Ensure Super Admin availability is configured
  console.log('📅 Seeding Super Admin & Top Sellers Availability Schedules...');
  for (const u of [superAdmin, seller]) {
    await query(
      `INSERT INTO service_availability (
        seller_id, timezone, weekly_schedule, vacation_mode, max_active_orders, booking_notice_days, max_advance_days, expected_response_hours
       ) VALUES ($1, 'America/New_York', '{
        "mon": {"active": true, "start": "09:00", "end": "18:00"},
        "tue": {"active": true, "start": "09:00", "end": "18:00"},
        "wed": {"active": true, "start": "09:00", "end": "18:00"},
        "thu": {"active": true, "start": "09:00", "end": "18:00"},
        "fri": {"active": true, "start": "09:00", "end": "17:00"},
        "sat": {"active": false},
        "sun": {"active": false}
       }', false, 8, 1, 45, 2)
       ON CONFLICT (seller_id) DO UPDATE SET
        weekly_schedule = EXCLUDED.weekly_schedule,
        max_active_orders = EXCLUDED.max_active_orders,
        timezone = EXCLUDED.timezone`,
      [u.id]
    );
  }
  console.log('  ✓ Availability schedules configured for testing.');

  console.log('\n======================================================');
  console.log('🎉 ADDITIONAL LIVE TEST DATA READY ACROSS ALL MODULES!');
  console.log('======================================================');
  process.exit(0);
}

seedAdditionalTestData().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
