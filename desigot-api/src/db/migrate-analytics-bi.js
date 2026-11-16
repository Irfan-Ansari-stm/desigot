'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

async function runAnalyticsMigration() {
  const pool = new Pool({ connectionString: config.db.primary });
  const client = await pool.connect();

  try {
    console.log('Running Analytics BI System Migration...');
    const sqlPath = path.join(__dirname, 'analytics-bi-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✓ Analytics BI System Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runAnalyticsMigration();
