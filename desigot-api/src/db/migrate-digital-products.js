'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

const DIGITAL_PRODUCT_PERMISSIONS = [
  { name: 'View Digital Products', slug: 'products.read', resource: 'products', action: 'read' },
  { name: 'Create Digital Product', slug: 'products.create', resource: 'products', action: 'create' },
  { name: 'Update Digital Product', slug: 'products.update', resource: 'products', action: 'update' },
  { name: 'Delete Digital Product', slug: 'products.delete', resource: 'products', action: 'delete' },
  { name: 'Approve Digital Product', slug: 'products.approve', resource: 'products', action: 'approve' },
  { name: 'Reject Digital Product', slug: 'products.reject', resource: 'products', action: 'reject' },
  { name: 'Publish Digital Product', slug: 'products.publish', resource: 'products', action: 'publish' },
  { name: 'Unpublish Digital Product', slug: 'products.unpublish', resource: 'products', action: 'unpublish' },
  { name: 'Feature Digital Product', slug: 'products.feature', resource: 'products', action: 'feature' },
  { name: 'Manage Product Licenses', slug: 'products.licenses', resource: 'products', action: 'manage_licenses' },
  { name: 'Manage Product Files', slug: 'products.files', resource: 'products', action: 'manage_files' },
  { name: 'Manage Product Versions', slug: 'products.versions', resource: 'products', action: 'manage_versions' },
  { name: 'View Product Downloads', slug: 'products.downloads', resource: 'products', action: 'view_downloads' },
  { name: 'View Product Sales', slug: 'products.sales', resource: 'products', action: 'view_sales' },
  { name: 'Manage Product Refunds', slug: 'products.refunds', resource: 'products', action: 'manage_refunds' },
];

async function migrateDigitalProducts() {
  const pool = new Pool({
    connectionString: config.db.primary,
    ssl: config.db.ssl,
  });

  const sqlPath = path.join(__dirname, 'digital-products-migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();

  try {
    console.log('🚀 Running Digital Product Management database migration...');
    await client.query(sql);
    console.log('✅ Tables and indexes migrated.');

    // Seed permissions
    console.log('🔐 Seeding digital product permissions...');
    for (const p of DIGITAL_PRODUCT_PERMISSIONS) {
      await client.query(
        `INSERT INTO permissions (name, slug, resource, action, is_system)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, resource = EXCLUDED.resource, action = EXCLUDED.action`,
        [p.name, p.slug, p.resource, p.action]
      );
    }

    // Assign permissions to admin, manager, superadmin roles if role_permissions exists
    const rolesRes = await client.query(`SELECT id, name FROM roles WHERE name IN ('super_admin', 'admin', 'manager')`);
    const permRes = await client.query(`SELECT id FROM permissions WHERE resource = 'products'`);

    for (const role of rolesRes.rows) {
      for (const perm of permRes.rows) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [role.id, perm.id]
        );
      }
    }
    console.log(`✅ Granted ${permRes.rows.length} product permissions to admin roles.`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrateDigitalProducts();
}

module.exports = migrateDigitalProducts;
