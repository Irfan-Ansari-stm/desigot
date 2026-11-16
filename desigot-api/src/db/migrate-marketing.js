'use strict';

const fs = require('fs');
const path = require('path');
const pool = require('./pool');

const MARKETING_PERMISSIONS = [
  // COUPONS
  { name: 'Read Coupons', slug: 'marketing.coupons.read', resource: 'marketing.coupons', action: 'read' },
  { name: 'Create Coupon', slug: 'marketing.coupons.create', resource: 'marketing.coupons', action: 'create' },
  { name: 'Update Coupon', slug: 'marketing.coupons.update', resource: 'marketing.coupons', action: 'update' },
  { name: 'Delete Coupon', slug: 'marketing.coupons.delete', resource: 'marketing.coupons', action: 'delete' },
  { name: 'Activate Coupon', slug: 'marketing.coupons.activate', resource: 'marketing.coupons', action: 'activate' },
  { name: 'Deactivate Coupon', slug: 'marketing.coupons.deactivate', resource: 'marketing.coupons', action: 'deactivate' },
  { name: 'Export Coupons', slug: 'marketing.coupons.export', resource: 'marketing.coupons', action: 'export' },

  // DISCOUNT CAMPAIGNS
  { name: 'Read Campaigns', slug: 'marketing.campaigns.read', resource: 'marketing.campaigns', action: 'read' },
  { name: 'Create Campaign', slug: 'marketing.campaigns.create', resource: 'marketing.campaigns', action: 'create' },
  { name: 'Update Campaign', slug: 'marketing.campaigns.update', resource: 'marketing.campaigns', action: 'update' },
  { name: 'Delete Campaign', slug: 'marketing.campaigns.delete', resource: 'marketing.campaigns', action: 'delete' },
  { name: 'Publish Campaign', slug: 'marketing.campaigns.publish', resource: 'marketing.campaigns', action: 'publish' },
  { name: 'Pause Campaign', slug: 'marketing.campaigns.pause', resource: 'marketing.campaigns', action: 'pause' },
  { name: 'Campaign Analytics', slug: 'marketing.campaigns.analytics', resource: 'marketing.campaigns', action: 'analytics' },

  // FEATURED SERVICES
  { name: 'Read Featured Services', slug: 'marketing.featured_services.read', resource: 'marketing.featured_services', action: 'read' },
  { name: 'Create Featured Service', slug: 'marketing.featured_services.create', resource: 'marketing.featured_services', action: 'create' },
  { name: 'Update Featured Service', slug: 'marketing.featured_services.update', resource: 'marketing.featured_services', action: 'update' },
  { name: 'Remove Featured Service', slug: 'marketing.featured_services.remove', resource: 'marketing.featured_services', action: 'remove' },
  { name: 'Reorder Featured Services', slug: 'marketing.featured_services.reorder', resource: 'marketing.featured_services', action: 'reorder' },

  // FEATURED PRODUCTS
  { name: 'Read Featured Products', slug: 'marketing.featured_products.read', resource: 'marketing.featured_products', action: 'read' },
  { name: 'Create Featured Product', slug: 'marketing.featured_products.create', resource: 'marketing.featured_products', action: 'create' },
  { name: 'Update Featured Product', slug: 'marketing.featured_products.update', resource: 'marketing.featured_products', action: 'update' },
  { name: 'Remove Featured Product', slug: 'marketing.featured_products.remove', resource: 'marketing.featured_products', action: 'remove' },
  { name: 'Reorder Featured Products', slug: 'marketing.featured_products.reorder', resource: 'marketing.featured_products', action: 'reorder' },

  // HOMEPAGE BANNERS
  { name: 'Read Banners', slug: 'marketing.banners.read', resource: 'marketing.banners', action: 'read' },
  { name: 'Create Banner', slug: 'marketing.banners.create', resource: 'marketing.banners', action: 'create' },
  { name: 'Update Banner', slug: 'marketing.banners.update', resource: 'marketing.banners', action: 'update' },
  { name: 'Delete Banner', slug: 'marketing.banners.delete', resource: 'marketing.banners', action: 'delete' },
  { name: 'Publish Banner', slug: 'marketing.banners.publish', resource: 'marketing.banners', action: 'publish' },
  { name: 'Schedule Banner', slug: 'marketing.banners.schedule', resource: 'marketing.banners', action: 'schedule' },

  // PROMOTIONAL SECTIONS
  { name: 'Read Sections', slug: 'marketing.sections.read', resource: 'marketing.sections', action: 'read' },
  { name: 'Create Section', slug: 'marketing.sections.create', resource: 'marketing.sections', action: 'create' },
  { name: 'Update Section', slug: 'marketing.sections.update', resource: 'marketing.sections', action: 'update' },
  { name: 'Delete Section', slug: 'marketing.sections.delete', resource: 'marketing.sections', action: 'delete' },
  { name: 'Publish Section', slug: 'marketing.sections.publish', resource: 'marketing.sections', action: 'publish' },
  { name: 'Reorder Sections', slug: 'marketing.sections.reorder', resource: 'marketing.sections', action: 'reorder' },

  // NEWSLETTER CAMPAIGNS
  { name: 'Read Newsletters', slug: 'marketing.newsletters.read', resource: 'marketing.newsletters', action: 'read' },
  { name: 'Create Newsletter', slug: 'marketing.newsletters.create', resource: 'marketing.newsletters', action: 'create' },
  { name: 'Update Newsletter', slug: 'marketing.newsletters.update', resource: 'marketing.newsletters', action: 'update' },
  { name: 'Send Newsletter', slug: 'marketing.newsletters.send', resource: 'marketing.newsletters', action: 'send' },
  { name: 'Schedule Newsletter', slug: 'marketing.newsletters.schedule', resource: 'marketing.newsletters', action: 'schedule' },
  { name: 'Newsletter Analytics', slug: 'marketing.newsletters.analytics', resource: 'marketing.newsletters', action: 'analytics' },

  // AFFILIATE MANAGEMENT
  { name: 'Read Affiliates', slug: 'marketing.affiliates.read', resource: 'marketing.affiliates', action: 'read' },
  { name: 'Create Affiliate', slug: 'marketing.affiliates.create', resource: 'marketing.affiliates', action: 'create' },
  { name: 'Update Affiliate', slug: 'marketing.affiliates.update', resource: 'marketing.affiliates', action: 'update' },
  { name: 'Approve Affiliate', slug: 'marketing.affiliates.approve', resource: 'marketing.affiliates', action: 'approve' },
  { name: 'Suspend Affiliate', slug: 'marketing.affiliates.suspend', resource: 'marketing.affiliates', action: 'suspend' },
  { name: 'Manage Commissions', slug: 'marketing.affiliates.commissions.manage', resource: 'marketing.affiliates', action: 'commissions.manage' },
  { name: 'Manage Payouts', slug: 'marketing.affiliates.payouts.manage', resource: 'marketing.affiliates', action: 'payouts.manage' },

  // REFERRAL PROGRAMS
  { name: 'Read Referrals', slug: 'marketing.referrals.read', resource: 'marketing.referrals', action: 'read' },
  { name: 'Create Referral Program', slug: 'marketing.referrals.create', resource: 'marketing.referrals', action: 'create' },
  { name: 'Update Referral Program', slug: 'marketing.referrals.update', resource: 'marketing.referrals', action: 'update' },
  { name: 'Manage Referral Rewards', slug: 'marketing.referrals.manage_rewards', resource: 'marketing.referrals', action: 'manage_rewards' },
  { name: 'Referral Analytics', slug: 'marketing.referrals.analytics', resource: 'marketing.referrals', action: 'analytics' },

  // ADVERTISEMENT MANAGEMENT
  { name: 'Read Advertisements', slug: 'marketing.ads.read', resource: 'marketing.ads', action: 'read' },
  { name: 'Create Advertisement', slug: 'marketing.ads.create', resource: 'marketing.ads', action: 'create' },
  { name: 'Update Advertisement', slug: 'marketing.ads.update', resource: 'marketing.ads', action: 'update' },
  { name: 'Delete Advertisement', slug: 'marketing.ads.delete', resource: 'marketing.ads', action: 'delete' },
  { name: 'Approve Advertisement', slug: 'marketing.ads.approve', resource: 'marketing.ads', action: 'approve' },
  { name: 'Pause Advertisement', slug: 'marketing.ads.pause', resource: 'marketing.ads', action: 'pause' },
  { name: 'Advertisement Analytics', slug: 'marketing.ads.analytics', resource: 'marketing.ads', action: 'analytics' },

  // GENERAL MARKETING READ
  { name: 'Read Marketing & Promotions', slug: 'marketing.read', resource: 'marketing', action: 'read' },
];

async function migrateMarketing() {
  console.log('⚡ Starting Marketing & Promotions Migration...');
  const client = await pool.getClient();

  try {
    // 1. Run SQL schema
    const sqlPath = path.join(__dirname, 'marketing-promotions-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('✅ Base marketing schema and tables created/updated successfully.');

    // 2. Register Marketing Module in modules table
    const modRes = await client.query(`
      INSERT INTO modules (name, slug, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING id;
    `, ['Marketing & Promotions', 'marketing', 'Centralized promotional campaigns, coupon engine, featured listings, banners, sections, newsletters, affiliates, referrals, and advertisements.']);
    const moduleId = modRes.rows[0].id;
    console.log(`✅ Module "Marketing & Promotions" registered (id: ${moduleId}).`);

    // 3. Register Permissions
    let permsAdded = 0;
    const permMap = {};
    for (const p of MARKETING_PERMISSIONS) {
      const res = await client.query(`
        INSERT INTO permissions (name, slug, resource, action, module_id, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO UPDATE 
          SET name = EXCLUDED.name, resource = EXCLUDED.resource, action = EXCLUDED.action, module_id = EXCLUDED.module_id
        RETURNING id, slug;
      `, [p.name, p.slug, p.resource, p.action, moduleId, p.name]);
      permMap[p.slug] = res.rows[0].id;
      permsAdded++;
    }
    console.log(`✅ ${permsAdded} permissions registered for Marketing & Promotions.`);

    // 4. Create / Update Specific Marketing Roles
    const rolesToCreate = [
      { name: 'Marketing Manager', slug: 'marketing_manager', description: 'Full administrative control over all marketing and promotions.' },
      { name: 'Campaign Manager', slug: 'campaign_manager', description: 'Discount campaigns, coupons, and featured content management.' },
      { name: 'Affiliate Manager', slug: 'affiliate_manager', description: 'Affiliate applications, commissions, and payout processing.' },
      { name: 'Advertisement Manager', slug: 'ad_manager', description: 'Advertising campaigns, approval, budgeting, and performance.' },
      { name: 'Marketing Analyst', slug: 'marketing_analyst', description: 'Read-only access to marketing metrics, ROI, and performance.' },
    ];

    const roleMap = {};
    for (const r of rolesToCreate) {
      const roleRes = await client.query(`
        INSERT INTO roles (name, slug, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
        RETURNING id, slug;
      `, [r.name, r.slug, r.description]);
      roleMap[r.slug] = roleRes.rows[0].id;
    }
    console.log('✅ Marketing roles registered.');

    // 5. Assign Permissions to Roles
    // Superadmin & Admin get all permissions
    const superAdminRole = await client.query(`SELECT id FROM roles WHERE slug = 'superadmin' OR slug = 'admin' LIMIT 1`);
    if (superAdminRole.rows.length > 0) {
      const sAdminId = superAdminRole.rows[0].id;
      for (const permId of Object.values(permMap)) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [sAdminId, permId]);
      }
      console.log('✅ Super Admin role assigned all marketing permissions.');
    }

    // Assign Marketing Manager all permissions
    for (const permId of Object.values(permMap)) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      `, [roleMap['marketing_manager'], permId]);
    }

    // Assign Campaign Manager
    for (const [slug, id] of Object.entries(permMap)) {
      if (slug.startsWith('marketing.coupons') || slug.startsWith('marketing.campaigns') || 
          slug.startsWith('marketing.featured_') || slug.startsWith('marketing.banners') || 
          slug.startsWith('marketing.sections') || slug === 'marketing.read') {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['campaign_manager'], id]);
      }
    }

    // Assign Affiliate Manager
    for (const [slug, id] of Object.entries(permMap)) {
      if (slug.startsWith('marketing.affiliates') || slug.startsWith('marketing.referrals') || slug === 'marketing.read') {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['affiliate_manager'], id]);
      }
    }

    // Assign Marketing Analyst (read & analytics)
    for (const [slug, id] of Object.entries(permMap)) {
      if (slug.endsWith('.read') || slug.endsWith('.analytics') || slug.endsWith('.export')) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['marketing_analyst'], id]);
      }
    }

    // 6. Seed Default Marketing Settings
    const defaultSettings = [
      { key: 'coupon_stacking_allowed', value: false, description: 'Allow customers to apply multiple coupons on a single checkout' },
      { key: 'affiliate_default_commission_rate', value: 10.00, description: 'Default percentage commission for approved affiliates' },
      { key: 'affiliate_qualification_window_days', value: 14, description: 'Days after order completion before affiliate commission becomes approved' },
      { key: 'referral_default_referrer_reward_cents', value: 1500, description: 'Default reward credited to referrer upon qualified order' },
      { key: 'referral_default_referee_reward_cents', value: 1000, description: 'Default discount reward for invited friend on first purchase' },
      { key: 'ad_max_daily_budget_cents', value: 100000, description: 'System-wide maximum daily ad budget per advertiser' },
    ];

    for (const s of defaultSettings) {
      await client.query(`
        INSERT INTO marketing_settings (key, value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
      `, [s.key, JSON.stringify(s.value), s.description]);
    }
    console.log('✅ Default marketing settings seeded.');

    console.log('🎉 Marketing & Promotions Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateMarketing().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrateMarketing;
