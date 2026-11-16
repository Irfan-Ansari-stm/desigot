'use strict';
require('dotenv').config();
const config = require('../src/config');
const { Pool } = require('pg');

async function check() {
  const pool = new Pool({ connectionString: config.db.primary });
  const tables = ['login_history', 'security_events', 'ip_restrictions', 'user_sessions', 'admin_sessions', 'audit_logs', 'security_settings'];
  for (const t of tables) {
    const r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position", [t]);
    console.log(`\n=== TABLE: ${t} ===`);
    console.log(r.rows.map(x => `${x.column_name} (${x.data_type})`).join(', '));
  }
  await pool.end();
}
check();
