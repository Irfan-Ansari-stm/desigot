'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { primaryPool } = require('./pool');

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, 'seller-applications-migration.sql'), 'utf8');
  console.log('Applying seller applications migration...');
  await primaryPool.query(sql);
  console.log('Seller applications migration applied successfully!');
  await primaryPool.end();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
