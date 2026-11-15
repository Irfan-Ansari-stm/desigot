'use strict';
require('dotenv').config();
const { primaryPool } = require('../src/db/pool');

async function inspect() {
  try {
    const res = await primaryPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('--- PUBLIC TABLES ---');
    console.log(res.rows.map(r => r.table_name).join('\n'));

    // Check specific tables: orders, order_items, disputes, payments, bookings
    const checkTables = ['orders', 'order_items', 'customer_bookings', 'bookings', 'disputes', 'payments', 'refunds', 'projects', 'deliveries', 'revisions', 'custom_quotes'];
    for (const t of checkTables) {
      const colRes = await primaryPool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t]);
      if (colRes.rows.length > 0) {
        console.log(`\n--- COLUMNS FOR ${t} ---`);
        colRes.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));
      } else {
        console.log(`\nTable ${t} does NOT exist yet.`);
      }
    }
  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    process.exit(0);
  }
}

inspect();
