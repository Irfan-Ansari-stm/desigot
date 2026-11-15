'use strict';
require('dotenv').config();
const { primaryPool } = require('../src/db/pool');

async function inspectListings() {
  try {
    const colRes = await primaryPool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'listings';
    `);
    console.log('Listings columns:');
    colRes.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

    const sampleRes = await primaryPool.query(`SELECT id, title, type, seller_id, price_cents FROM listings LIMIT 5;`);
    console.log('Sample listings:', sampleRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

inspectListings();
