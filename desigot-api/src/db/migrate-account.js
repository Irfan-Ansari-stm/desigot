'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query } = require('./pool');

async function runMigration() {
  console.log('--- STARTING MODULE 18: PROFILE & ACCOUNT MANAGEMENT MIGRATION ---');
  const sql = fs.readFileSync(path.join(__dirname, 'account-migration.sql'), 'utf8');

  try {
    await query(sql);
    console.log('✓ Profile & Account Management tables created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
