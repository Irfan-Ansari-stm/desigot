'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { primaryPool } = require('./pool');

async function migrateCommunication() {
  const sqlPath = path.join(__dirname, 'communication-migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Running Messages & Communication database migration...');
  const client = await primaryPool.connect();

  try {
    await client.query('BEGIN');
    await client.query(sql);

    // 1. Ensure 'communication' module exists
    let moduleId;
    const modRes = await client.query(`SELECT id FROM modules WHERE slug = 'communication'`);
    if (modRes.rows.length) {
      moduleId = modRes.rows[0].id;
    } else {
      const insMod = await client.query(`
        INSERT INTO modules (name, slug, description, is_active)
        VALUES ('Messages & Communication', 'communication', 'Enterprise communication, support desk, disputes, emails and notifications', TRUE)
        RETURNING id
      `);
      moduleId = insMod.rows[0].id;
    }

    // 2. Define all granular permissions
    const permissions = [
      // Conversations
      { slug: 'communication.conversations.read', name: 'Read Conversations', resource: 'conversations', action: 'READ' },
      { slug: 'communication.conversations.search', name: 'Search Conversations', resource: 'conversations', action: 'SEARCH' },
      { slug: 'communication.conversations.assign', name: 'Assign Conversations', resource: 'conversations', action: 'ASSIGN' },
      { slug: 'communication.conversations.reassign', name: 'Reassign Conversations', resource: 'conversations', action: 'ASSIGN' },
      { slug: 'communication.conversations.archive', name: 'Archive Conversations', resource: 'conversations', action: 'MANAGE' },
      { slug: 'communication.conversations.close', name: 'Close Conversations', resource: 'conversations', action: 'MANAGE' },
      { slug: 'communication.conversations.export', name: 'Export Conversations', resource: 'conversations', action: 'EXPORT' },

      // Customer Messages
      { slug: 'communication.customer_messages.read', name: 'Read Customer Messages', resource: 'customer_messages', action: 'READ' },
      { slug: 'communication.customer_messages.reply', name: 'Reply Customer Messages', resource: 'customer_messages', action: 'CREATE' },
      { slug: 'communication.customer_messages.manage', name: 'Manage Customer Messages', resource: 'customer_messages', action: 'MANAGE' },

      // Seller Messages
      { slug: 'communication.seller_messages.read', name: 'Read Seller Messages', resource: 'seller_messages', action: 'READ' },
      { slug: 'communication.seller_messages.reply', name: 'Reply Seller Messages', resource: 'seller_messages', action: 'CREATE' },
      { slug: 'communication.seller_messages.manage', name: 'Manage Seller Messages', resource: 'seller_messages', action: 'MANAGE' },

      // Order Conversations
      { slug: 'communication.order_messages.read', name: 'Read Order Messages', resource: 'order_messages', action: 'READ' },
      { slug: 'communication.order_messages.reply', name: 'Reply Order Messages', resource: 'order_messages', action: 'CREATE' },
      { slug: 'communication.order_messages.manage', name: 'Manage Order Messages', resource: 'order_messages', action: 'MANAGE' },

      // Support Tickets
      { slug: 'communication.tickets.read', name: 'Read Tickets', resource: 'tickets', action: 'READ' },
      { slug: 'communication.tickets.create', name: 'Create Tickets', resource: 'tickets', action: 'CREATE' },
      { slug: 'communication.tickets.assign', name: 'Assign Tickets', resource: 'tickets', action: 'ASSIGN' },
      { slug: 'communication.tickets.reply', name: 'Reply to Tickets', resource: 'tickets', action: 'CREATE' },
      { slug: 'communication.tickets.update', name: 'Update Tickets', resource: 'tickets', action: 'UPDATE' },
      { slug: 'communication.tickets.close', name: 'Close Tickets', resource: 'tickets', action: 'MANAGE' },
      { slug: 'communication.tickets.reopen', name: 'Reopen Tickets', resource: 'tickets', action: 'MANAGE' },
      { slug: 'communication.tickets.escalate', name: 'Escalate Tickets', resource: 'tickets', action: 'MANAGE' },
      { slug: 'communication.tickets.export', name: 'Export Tickets', resource: 'tickets', action: 'EXPORT' },

      // Disputes
      { slug: 'communication.disputes.read', name: 'Read Disputes', resource: 'disputes', action: 'READ' },
      { slug: 'communication.disputes.assign', name: 'Assign Dispute Investigator', resource: 'disputes', action: 'ASSIGN' },
      { slug: 'communication.disputes.investigate', name: 'Investigate Disputes', resource: 'disputes', action: 'MANAGE' },
      { slug: 'communication.disputes.respond', name: 'Respond to Disputes', resource: 'disputes', action: 'CREATE' },
      { slug: 'communication.disputes.resolve', name: 'Resolve Disputes', resource: 'disputes', action: 'MANAGE' },
      { slug: 'communication.disputes.escalate', name: 'Escalate Disputes', resource: 'disputes', action: 'MANAGE' },
      { slug: 'communication.disputes.export', name: 'Export Disputes', resource: 'disputes', action: 'EXPORT' },

      // Announcements
      { slug: 'communication.announcements.read', name: 'Read Announcements', resource: 'announcements', action: 'READ' },
      { slug: 'communication.announcements.create', name: 'Create Announcements', resource: 'announcements', action: 'CREATE' },
      { slug: 'communication.announcements.update', name: 'Update Announcements', resource: 'announcements', action: 'UPDATE' },
      { slug: 'communication.announcements.publish', name: 'Publish Announcements', resource: 'announcements', action: 'MANAGE' },
      { slug: 'communication.announcements.schedule', name: 'Schedule Announcements', resource: 'announcements', action: 'MANAGE' },
      { slug: 'communication.announcements.delete', name: 'Delete Announcements', resource: 'announcements', action: 'DELETE' },

      // Email Notifications
      { slug: 'communication.email.read', name: 'Read Email Logs', resource: 'email', action: 'READ' },
      { slug: 'communication.email.send', name: 'Send Email', resource: 'email', action: 'CREATE' },
      { slug: 'communication.email.retry', name: 'Retry Failed Email', resource: 'email', action: 'MANAGE' },
      { slug: 'communication.email.cancel', name: 'Cancel Queued Email', resource: 'email', action: 'MANAGE' },
      { slug: 'communication.email.configure', name: 'Configure Email Provider', resource: 'email', action: 'CONFIGURE' },
      { slug: 'communication.email.export', name: 'Export Email Logs', resource: 'email', action: 'EXPORT' },

      // Notification Templates
      { slug: 'communication.templates.read', name: 'Read Templates', resource: 'templates', action: 'READ' },
      { slug: 'communication.templates.create', name: 'Create Templates', resource: 'templates', action: 'CREATE' },
      { slug: 'communication.templates.update', name: 'Update Templates', resource: 'templates', action: 'UPDATE' },
      { slug: 'communication.templates.delete', name: 'Delete Templates', resource: 'templates', action: 'DELETE' },
      { slug: 'communication.templates.activate', name: 'Activate Templates', resource: 'templates', action: 'MANAGE' },
      { slug: 'communication.templates.test', name: 'Test Send Templates', resource: 'templates', action: 'MANAGE' },

      // Fallback/Legacy Aliases
      { slug: 'messages.read', name: 'General Messages Read', resource: 'messages', action: 'READ' },
      { slug: 'messages.manage', name: 'General Messages Manage', resource: 'messages', action: 'MANAGE' },
    ];

    const insertedPermIds = [];
    for (const p of permissions) {
      const existing = await client.query(`SELECT id FROM permissions WHERE slug = $1`, [p.slug]);
      let permId;
      if (existing.rows.length) {
        permId = existing.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO permissions (name, slug, module_id, resource, action, description)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [p.name, p.slug, moduleId, p.resource, p.action, `Permission for ${p.name}`]
        );
        permId = ins.rows[0].id;
      }
      insertedPermIds.push(permId);
    }

    // 3. Map permissions to Super Admin and Platform Administrator roles
    const adminRoles = await client.query(`SELECT id, name FROM roles WHERE name IN ('Super Admin', 'Platform Administrator')`);
    for (const r of adminRoles.rows) {
      for (const pId of insertedPermIds) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [r.id, pId]);
      }
    }

    // 4. Create or update specialized communication roles
    const specialRoles = [
      { name: 'Communication Admin', slug: 'communication_admin', desc: 'Complete authorized communication management' },
      { name: 'Support Manager', slug: 'support_manager', desc: 'Support team, SLA policies, and ticket management' },
      { name: 'Support Agent', slug: 'support_agent', desc: 'Handles assigned support tickets and direct inquiries' },
      { name: 'Dispute Manager', slug: 'dispute_manager', desc: 'Dispute investigation, evidence collection, and resolution' },
      { name: 'Notification Manager', slug: 'notification_manager', desc: 'Email broadcasts, templates, and delivery pipelines' },
    ];

    for (const sr of specialRoles) {
      const exists = await client.query(`SELECT id FROM roles WHERE slug = $1`, [sr.slug]);
      let rId;
      if (exists.rows.length) {
        rId = exists.rows[0].id;
      } else {
        const insR = await client.query(`
          INSERT INTO roles (name, slug, description, is_system, hierarchy_level)
          VALUES ($1, $2, $3, FALSE, 3)
          RETURNING id
        `, [sr.name, sr.slug, sr.desc]);
        rId = insR.rows[0].id;
      }

      // Assign all communication permissions to Communication Admin
      if (sr.slug === 'communication_admin') {
        for (const pId of insertedPermIds) {
          await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT (role_id, permission_id) DO NOTHING
          `, [rId, pId]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Messages & Communication migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateCommunication().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrateCommunication;
