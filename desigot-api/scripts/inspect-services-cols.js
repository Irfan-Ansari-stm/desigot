'use strict';
require('dotenv').config();
const { primaryPool } = require('../src/db/pool');

async function inspectServices() {
  try {
    const colRes = await primaryPool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'services';
    `);
    console.log('Services columns:', colRes.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

inspectServices();
