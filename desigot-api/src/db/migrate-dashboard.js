'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

async function migrateDashboard() {
  const pool = new Pool({
    connectionString: config.db.primary,
    ssl: config.db.ssl,
  });

  const sqlPath = path.join(__dirname, 'dashboard-analytics-migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();

  try {
    console.log('🚀 Running Dashboard & Analytics database migration...');
    await client.query(sql);
    console.log('✅ Dashboard & Analytics migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrateDashboard();
}

module.exports = migrateDashboard;
