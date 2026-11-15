'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { primaryPool } = require('../src/db/pool');

async function runMigration() {
  console.log('--- EXECUTING ORDERS & BOOKINGS MIGRATION ---');
  const sqlPath = path.join(__dirname, '../src/db/orders-bookings-migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await primaryPool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migration executed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();
