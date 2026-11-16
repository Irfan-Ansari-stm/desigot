'use strict';

const fs = require('fs');
const path = require('path');
const pool = require('./pool');

const REVIEW_PERMISSIONS = [
  // ALL REVIEWS
  { name: 'Read All Reviews', slug: 'reviews.read', resource: 'reviews', action: 'read' },
  { name: 'Search Reviews', slug: 'reviews.search', resource: 'reviews', action: 'search' },
  { name: 'Filter Reviews', slug: 'reviews.filter', resource: 'reviews', action: 'filter' },
  { name: 'Export Reviews', slug: 'reviews.export', resource: 'reviews', action: 'export' },
  { name: 'View Review Details', slug: 'reviews.view_details', resource: 'reviews', action: 'view_details' },

  // PENDING REVIEWS
  { name: 'Read Pending Reviews', slug: 'reviews.pending.read', resource: 'reviews.pending', action: 'read' },
  { name: 'Approve Pending Reviews', slug: 'reviews.pending.approve', resource: 'reviews.pending', action: 'approve' },
  { name: 'Reject Pending Reviews', slug: 'reviews.pending.reject', resource: 'reviews.pending', action: 'reject' },

  // APPROVED REVIEWS
  { name: 'Read Approved Reviews', slug: 'reviews.approved.read', resource: 'reviews.approved', action: 'read' },
  { name: 'Hide Approved Reviews', slug: 'reviews.approved.hide', resource: 'reviews.approved', action: 'hide' },
  { name: 'Restore Approved Reviews', slug: 'reviews.approved.restore', resource: 'reviews.approved', action: 'restore' },

  // REJECTED REVIEWS
  { name: 'Read Rejected Reviews', slug: 'reviews.rejected.read', resource: 'reviews.rejected', action: 'read' },
  { name: 'Restore Rejected Reviews', slug: 'reviews.rejected.restore', resource: 'reviews.rejected', action: 'restore' },
  { name: 'Delete Rejected Reviews', slug: 'reviews.rejected.delete', resource: 'reviews.rejected', action: 'delete' },

  // REPORTED REVIEWS
  { name: 'Read Reported Reviews', slug: 'reviews.reported.read', resource: 'reviews.reported', action: 'read' },
  { name: 'Investigate Reported Reviews', slug: 'reviews.reported.investigate', resource: 'reviews.reported', action: 'investigate' },
  { name: 'Dismiss Reported Reviews', slug: 'reviews.reported.dismiss', resource: 'reviews.reported', action: 'dismiss' },
  { name: 'Remove Reported Reviews', slug: 'reviews.reported.remove', resource: 'reviews.reported', action: 'remove' },
  { name: 'Escalate Reported Reviews', slug: 'reviews.reported.escalate', resource: 'reviews.reported', action: 'escalate' },

  // SELLER RESPONSES
  { name: 'Read Seller Responses', slug: 'reviews.responses.read', resource: 'reviews.responses', action: 'read' },
  { name: 'Create Seller Response', slug: 'reviews.responses.create', resource: 'reviews.responses', action: 'create' },
  { name: 'Update Seller Response', slug: 'reviews.responses.update', resource: 'reviews.responses', action: 'update' },
  { name: 'Approve Seller Response', slug: 'reviews.responses.approve', resource: 'reviews.responses', action: 'approve' },
  { name: 'Reject Seller Response', slug: 'reviews.responses.reject', resource: 'reviews.responses', action: 'reject' },
  { name: 'Remove Seller Response', slug: 'reviews.responses.remove', resource: 'reviews.responses', action: 'remove' },

  // REVIEW MODERATION
  { name: 'Read Review Moderation', slug: 'reviews.moderation.read', resource: 'reviews.moderation', action: 'read' },
  { name: 'Manage Review Moderation', slug: 'reviews.moderation.manage', resource: 'reviews.moderation', action: 'manage' },
  { name: 'Manage Moderation Rules', slug: 'reviews.moderation.rules.manage', resource: 'reviews.moderation', action: 'rules.manage' },
  { name: 'Manage Moderation Categories', slug: 'reviews.moderation.categories.manage', resource: 'reviews.moderation', action: 'categories.manage' },
  { name: 'Read Moderation Audit Log', slug: 'reviews.moderation.audit.read', resource: 'reviews.moderation', action: 'audit.read' },

  // PRODUCT RATINGS
  { name: 'Read Product Ratings', slug: 'reviews.product_ratings.read', resource: 'reviews.product_ratings', action: 'read' },
  { name: 'Product Ratings Analytics', slug: 'reviews.product_ratings.analytics', resource: 'reviews.product_ratings', action: 'analytics' },
  { name: 'Export Product Ratings', slug: 'reviews.product_ratings.export', resource: 'reviews.product_ratings', action: 'export' },

  // SERVICE RATINGS
  { name: 'Read Service Ratings', slug: 'reviews.service_ratings.read', resource: 'reviews.service_ratings', action: 'read' },
  { name: 'Service Ratings Analytics', slug: 'reviews.service_ratings.analytics', resource: 'reviews.service_ratings', action: 'analytics' },
  { name: 'Export Service Ratings', slug: 'reviews.service_ratings.export', resource: 'reviews.service_ratings', action: 'export' },
];

async function migrate() {
  console.log('⚡ Starting Reviews & Moderation Migration...');
  const client = await pool.getClient();

  try {
    // 1. Run SQL schema file
    const sqlPath = path.join(__dirname, 'reviews-moderation-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('✅ Base reviews schema and tables created/updated successfully.');

    // 2. Register Reviews Module
    const modRes = await client.query(`
      INSERT INTO modules (name, slug, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING id;
    `, ['Reviews & Moderation', 'reviews', 'Complete marketplace reviews, ratings calculation, reports, seller responses, and moderation management.']);
    const moduleId = modRes.rows[0].id;
    console.log(`✅ Module "Reviews & Moderation" registered (id: ${moduleId}).`);

    // 3. Register Permissions
    let permsAdded = 0;
    const permMap = {};
    for (const p of REVIEW_PERMISSIONS) {
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
    console.log(`✅ ${permsAdded} permissions registered for Reviews & Moderation.`);

    // 4. Create / Update Specific Roles
    const rolesToCreate = [
      { name: 'Review Manager', slug: 'review_manager', description: 'Complete authorized review and ratings management.' },
      { name: 'Moderation Manager', slug: 'moderation_manager', description: 'Review moderation, reports investigation, and policy management.' },
      { name: 'Review Moderator', slug: 'review_moderator', description: 'Assigned review queue moderation and inspection.' },
      { name: 'Review Auditor', slug: 'review_auditor', description: 'Read-only authorized audit access to reviews and moderation.' },
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
    console.log('✅ Review roles registered.');

    // 5. Assign Permissions to Roles
    // Superadmin role gets all permissions
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
      console.log('✅ Super Admin role assigned all reviews permissions.');
    }

    // Assign Review Manager permissions (all reviews.*)
    for (const permId of Object.values(permMap)) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      `, [roleMap['review_manager'], permId]);
    }

    // Assign Moderation Manager permissions (pending, approved, rejected, reported, moderation, audit)
    for (const [slug, id] of Object.entries(permMap)) {
      if (slug.startsWith('reviews.pending') || slug.startsWith('reviews.approved') ||
          slug.startsWith('reviews.rejected') || slug.startsWith('reviews.reported') ||
          slug.startsWith('reviews.moderation') || slug === 'reviews.read' || slug === 'reviews.search' || slug === 'reviews.view_details') {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['moderation_manager'], id]);
      }
    }

    // Assign Review Moderator permissions (pending, approve/reject, read reported, audit read)
    for (const [slug, id] of Object.entries(permMap)) {
      if (slug.startsWith('reviews.pending') || slug === 'reviews.read' || slug === 'reviews.search' || 
          slug === 'reviews.view_details' || slug === 'reviews.reported.read' || slug === 'reviews.responses.read') {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['review_moderator'], id]);
      }
    }

    // Assign Review Auditor (read-only perms)
    for (const [slug, id] of Object.entries(permMap)) {
      if (slug.endsWith('.read') || slug.endsWith('.analytics') || slug.endsWith('.export') || slug === 'reviews.search' || slug === 'reviews.view_details') {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['review_auditor'], id]);
      }
    }

    // 6. Backfill existing reviews
    console.log('🔄 Backfilling reference numbers and entities for existing reviews...');
    const existingReviews = await client.query(`
      SELECT id, order_id, reviewer_id, subject_id, listing_id, status, created_at, review_reference
      FROM reviews
      WHERE review_reference IS NULL OR customer_id IS NULL OR seller_id IS NULL
    `);

    let backfilledCount = 0;
    for (let i = 0; i < existingReviews.rows.length; i++) {
      const r = existingReviews.rows[i];
      const seqStr = String(i + 1).padStart(5, '0');
      const ref = r.review_reference || `REV-2026-${seqStr}`;
      
      // Determine if listing matches service or digital product
      const listingRes = await client.query(`SELECT id, listing_type, title FROM listings WHERE id = $1`, [r.listing_id]);
      let srvId = null;
      let prodId = null;

      if (listingRes.rows.length > 0) {
        const l = listingRes.rows[0];
        if (l.listing_type === 'service') {
          const srvCheck = await client.query(`SELECT id FROM services WHERE id = $1 OR listing_id = $1 LIMIT 1`, [l.id]);
          if (srvCheck.rows.length > 0) srvId = srvCheck.rows[0].id;
        } else if (l.listing_type === 'asset') {
          const prodCheck = await client.query(`SELECT id FROM digital_products WHERE id = $1 OR listing_id = $1 LIMIT 1`, [l.id]);
          if (prodCheck.rows.length > 0) prodId = prodCheck.rows[0].id;
        }
      }

      await client.query(`
        UPDATE reviews
        SET review_reference = COALESCE(review_reference, $1),
            customer_id = COALESCE(customer_id, $2),
            seller_id = COALESCE(seller_id, $3),
            service_id = COALESCE(service_id, $4),
            product_id = COALESCE(product_id, $5),
            is_verified_purchase = true,
            visibility_status = CASE WHEN status = 'hidden' THEN 'hidden' ELSE 'visible' END
        WHERE id = $6
      `, [ref, r.reviewer_id, r.subject_id, srvId, prodId, r.id]);
      backfilledCount++;
    }
    console.log(`✅ Backfilled ${backfilledCount} existing reviews.`);

    // 7. Seed Default Review Settings
    const defaultSettings = [
      { key: 'auto_publish_threshold', value: { min_rating: 4, verified_only: true, bypass_ai_flag: false }, description: 'Auto publish reviews matching criteria' },
      { key: 'profanity_filter_enabled', value: true, description: 'Automatically flag reviews containing blacklisted terms' },
      { key: 'verified_purchase_required', value: true, description: 'Only customers who completed order/booking can submit reviews' },
      { key: 'seller_response_moderation', value: true, description: 'Require admin approval for seller responses before public visibility' },
      { key: 'report_auto_investigation_threshold', value: 3, description: 'Number of reports required to trigger priority investigation queue' },
    ];

    for (const s of defaultSettings) {
      await client.query(`
        INSERT INTO review_settings (key, value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
      `, [s.key, JSON.stringify(s.value), s.description]);
    }
    console.log('✅ Default review settings seeded.');

    console.log('🎉 Reviews & Moderation Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrate;
