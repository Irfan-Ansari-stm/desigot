'use strict';
require('dotenv').config();
const { primaryPool } = require('../src/db/pool');

async function inspectCounts() {
  try {
    const res = await primaryPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM listings) AS listings_count,
        (SELECT COUNT(*) FROM digital_products) AS digital_products_count,
        (SELECT COUNT(*) FROM services) AS services_count,
        (SELECT COUNT(*) FROM orders) AS orders_count,
        (SELECT COUNT(*) FROM customer_bookings) AS bookings_count,
        (SELECT COUNT(*) FROM users WHERE role = 'buyer') AS buyers_count,
        (SELECT COUNT(*) FROM users WHERE role = 'seller' OR seller_verified = true) AS sellers_count;
    `);
    console.log('Current Counts:', res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

inspectCounts();
