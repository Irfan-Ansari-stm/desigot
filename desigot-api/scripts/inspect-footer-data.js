const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/db/pool');

async function main() {
  const s = await pool.query('SELECT * FROM cms_footer_settings');
  console.log('Settings:', JSON.stringify(s.rows, null, 2));

  const c = await pool.query('SELECT * FROM cms_footer_columns ORDER BY column_order ASC');
  console.log('Columns:', JSON.stringify(c.rows, null, 2));

  const l = await pool.query('SELECT * FROM cms_footer_links ORDER BY sort_order ASC');
  console.log('Links count:', l.rows.length);
  console.log('Sample links:', JSON.stringify(l.rows.slice(0, 10), null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
