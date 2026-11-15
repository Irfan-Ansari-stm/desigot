'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

const CUSTOMER_PERMISSIONS = [
  { name: 'View Customers Directory', slug: 'customers.read', resource: 'customers', action: 'read' },
  { name: 'View Customer', slug: 'customer.read', resource: 'customers', action: 'read' },
  { name: 'Create Customer Account', slug: 'customer.create', resource: 'customers', action: 'create' },
  { name: 'Update Customer Account', slug: 'customer.update', resource: 'customers', action: 'update' },
  { name: 'Delete Customer Account', slug: 'customer.delete', resource: 'customers', action: 'delete' },
  { name: 'Activate Customer Account', slug: 'customer.activate', resource: 'customers', action: 'activate' },
  { name: 'Deactivate Customer Account', slug: 'customer.deactivate', resource: 'customers', action: 'deactivate' },
  { name: 'Suspend Customer Account', slug: 'customer.suspend', resource: 'customers', action: 'suspend' },
  { name: 'Reactivate Customer Account', slug: 'customer.reactivate', resource: 'customers', action: 'reactivate' },
  { name: 'Export Customer Reports', slug: 'customer.export', resource: 'customers', action: 'export' },
  { name: 'Read Customer Profile', slug: 'customer.profile.read', resource: 'customers', action: 'profile_read' },
  { name: 'Update Customer Profile', slug: 'customer.profile.update', resource: 'customers', action: 'profile_update' },
  { name: 'Read Customer Orders', slug: 'customer.orders.read', resource: 'customers', action: 'orders_read' },
  { name: 'Manage Customer Orders', slug: 'customer.orders.manage', resource: 'customers', action: 'orders_manage' },
  { name: 'Read Customer Bookings', slug: 'customer.bookings.read', resource: 'customers', action: 'bookings_read' },
  { name: 'Manage Customer Bookings', slug: 'customer.bookings.manage', resource: 'customers', action: 'bookings_manage' },
  { name: 'Read Customer Reviews', slug: 'customer.reviews.read', resource: 'customers', action: 'reviews_read' },
  { name: 'Moderate Customer Reviews', slug: 'customer.reviews.moderate', resource: 'customers', action: 'reviews_moderate' },
  { name: 'Read Customer Complaints', slug: 'customer.complaints.read', resource: 'customers', action: 'complaints_read' },
  { name: 'Assign Customer Complaints', slug: 'customer.complaints.assign', resource: 'customers', action: 'complaints_assign' },
  { name: 'Respond Customer Complaints', slug: 'customer.complaints.respond', resource: 'customers', action: 'complaints_respond' },
  { name: 'Resolve Customer Complaints', slug: 'customer.complaints.resolve', resource: 'customers', action: 'complaints_resolve' },
  { name: 'Escalate Customer Complaints', slug: 'customer.complaints.escalate', resource: 'customers', action: 'complaints_escalate' },
  { name: 'Read Customer Activity Log', slug: 'customer.activity.read', resource: 'customers', action: 'activity_read' },
  { name: 'Read Customer Analytics', slug: 'customer.analytics.read', resource: 'customers', action: 'analytics_read' },
  { name: 'Read Customer Refunds', slug: 'customer.refunds.read', resource: 'customers', action: 'refunds_read' },
  { name: 'Manage Customer Refunds', slug: 'customer.refunds.manage', resource: 'customers', action: 'refunds_manage' },
  { name: 'Manage Customer Tags', slug: 'customer.tags.manage', resource: 'customers', action: 'tags_manage' },
  { name: 'Manage Customer Internal Notes', slug: 'customer.notes.manage', resource: 'customers', action: 'notes_manage' },
  { name: 'Manage Customer Communications', slug: 'customer.communication.manage', resource: 'customers', action: 'comm_manage' },
  { name: 'Read Customer Audit Logs', slug: 'customer.audit.read', resource: 'customers', action: 'audit_read' },
];

async function migrateCustomers() {
  const pool = new Pool({
    connectionString: config.db.primary,
    ssl: config.db.ssl,
  });

  const sqlPath = path.join(__dirname, 'customer-management-migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();

  try {
    console.log('🚀 Running Complete Customer Management database migration...');
    await client.query(sql);
    console.log('✅ Customer Management tables and indexes migrated.');

    // Seed permissions
    console.log('🔐 Seeding customer management permissions...');
    for (const p of CUSTOMER_PERMISSIONS) {
      await client.query(
        `INSERT INTO permissions (name, slug, resource, action, is_system)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, resource = EXCLUDED.resource, action = EXCLUDED.action`,
        [p.name, p.slug, p.resource, p.action]
      );
    }

    // Assign permissions to admin, manager, super_admin roles
    const rolesRes = await client.query(`SELECT id, name FROM roles WHERE name IN ('super_admin', 'admin', 'manager')`);
    const permRes = await client.query(`SELECT id FROM permissions WHERE resource = 'customers'`);

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
    console.log(`✅ Granted ${permRes.rows.length} customer permissions to admin/manager roles.`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrateCustomers();
}

module.exports = migrateCustomers;
