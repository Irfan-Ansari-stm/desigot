'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

async function runRbacMigration() {
  const pool = new Pool({ connectionString: config.db.primary });
  const sqlPath = path.join(__dirname, 'rbac-migration.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('Migration SQL not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();

  try {
    console.log('Running RBAC schema migrations...');
    await client.query(sql);
    console.log('RBAC schema migrations completed successfully.');

    // Verify key tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'roles', 'permissions', 'modules', 'permission_groups', 
          'user_roles', 'role_permissions', 'departments', 'teams', 
          'designations', 'user_invitations', 'access_policies', 
          'login_history', 'system_settings', 'user_mfa_settings', 
          'security_events', 'ip_restrictions', 'email_templates'
        )
      ORDER BY table_name;
    `);
    console.log('Verified RBAC Tables created:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('RBAC Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runRbacMigration();
