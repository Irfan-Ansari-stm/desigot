const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('./pool');

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, 'migrate-footer-system.sql'), 'utf8');
  console.log('Running footer database migration...');
  await pool.query(sql);
  console.log('✅ Footer database migration completed successfully.');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
