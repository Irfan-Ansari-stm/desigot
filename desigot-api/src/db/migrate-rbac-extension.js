'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

async function runExtensionMigration() {
  const pool = new Pool({ connectionString: config.db.primary });
  const client = await pool.connect();

  try {
    console.log('Running RBAC extension migration...');

    // ALTER TYPE ADD VALUE must run outside transaction block
    try {
      await client.query("ALTER TYPE account_status_enum ADD VALUE IF NOT EXISTS 'invited'");
      await client.query("ALTER TYPE account_status_enum ADD VALUE IF NOT EXISTS 'inactive'");
      console.log('✓ Extended account_status_enum with invited, inactive');
    } catch (e) {
      console.log('Enum value already present or skipped:', e.message);
    }

    const sqlPath = path.join(__dirname, 'rbac-extension-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('RBAC extension migration applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runExtensionMigration();
