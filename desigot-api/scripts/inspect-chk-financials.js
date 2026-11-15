'use strict';
require('dotenv').config();
const { primaryPool } = require('../src/db/pool');

async function inspectConstraint() {
  try {
    const res = await primaryPool.query(`
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conname = 'chk_order_financials';
    `);
    console.log('chk_order_financials definition:', res.rows[0]?.def);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

inspectConstraint();
