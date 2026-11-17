const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/db/pool');

async function main() {
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%footer%' OR table_name LIKE '%newsletter%'
  `);
  console.log('Matching tables:', tables.rows.map(r => r.table_name));

  for (const t of tables.rows) {
    const count = await pool.query(`SELECT count(*) FROM "${t.table_name}"`);
    console.log(`Table ${t.table_name}: ${count.rows[0].count} rows`);
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [t.table_name]);
    console.log(` Columns for ${t.table_name}:`, cols.rows.map(c => c.column_name).join(', '));
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
