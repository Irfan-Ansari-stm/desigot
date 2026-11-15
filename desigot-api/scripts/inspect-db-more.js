'use strict';
require('dotenv').config();
const { primaryPool } = require('../src/db/pool');

async function inspectMore() {
  try {
    const enumsRes = await primaryPool.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname IN ('order_status_enum', 'listing_type_enum', 'project_status_enum', 'dispute_status_enum', 'dispute_reason_enum', 'dispute_outcome_enum', 'license_type_enum')
      ORDER BY t.typname, e.enumsortorder;
    `);
    console.log('--- ENUMS ---');
    const grouped = {};
    enumsRes.rows.forEach(r => {
      grouped[r.typname] = grouped[r.typname] || [];
      grouped[r.typname].push(r.enumlabel);
    });
    console.log(JSON.stringify(grouped, null, 2));

    const checkTables = ['project_milestones', 'project_files', 'project_messages', 'service_quotes', 'service_custom_requests', 'payment_intents'];
    for (const t of checkTables) {
      const colRes = await primaryPool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t]);
      console.log(`\n--- COLUMNS FOR ${t} ---`);
      colRes.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));
    }
  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    process.exit(0);
  }
}

inspectMore();
