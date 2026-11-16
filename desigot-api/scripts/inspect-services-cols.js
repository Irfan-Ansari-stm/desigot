'use strict';
require('dotenv').config();
const { primaryPool } = require('../src/db/pool');

async function inspectWishlistTables() {
  try {
    const res = await primaryPool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name LIKE '%wish%' OR table_name LIKE '%fav%';
    `);
    console.log('Wishlist/fav tables:', res.rows.map(r => r.table_name));
    for (const t of res.rows.map(r => r.table_name)) {
      const c = await primaryPool.query(`
        SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1
      `, [t]);
      console.log(`Cols for ${t}:`, c.rows.map(x => x.column_name).join(', '));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

inspectWishlistTables();
