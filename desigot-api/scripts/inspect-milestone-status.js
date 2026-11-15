'use strict';
require('dotenv').config();
const { primaryPool } = require('../src/db/pool');

async function inspectMilestoneStatus() {
  try {
    const res = await primaryPool.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname LIKE '%milestone%'
      ORDER BY t.typname, e.enumsortorder;
    `);
    console.log('Milestone status enum:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

inspectMilestoneStatus();
