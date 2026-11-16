'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

async function runSecurityMigration() {
  const pool = new Pool({ connectionString: config.db.primary });
  const client = await pool.connect();

  try {
    console.log('Running Module 15: Security & Audit System Migration...');
    const sqlPath = path.join(__dirname, 'security-audit-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✓ Security & Audit System Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Security migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSecurityMigration();
