'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query } = require('./pool');

async function runMigration() {
  console.log('--- STARTING MODULE 16: INTEGRATIONS & API MANAGEMENT MIGRATION ---');
  const sql = fs.readFileSync(path.join(__dirname, 'integrations-migration.sql'), 'utf8');

  try {
    await query(sql);
    console.log('✓ Integrations & API Management tables and extensions created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
