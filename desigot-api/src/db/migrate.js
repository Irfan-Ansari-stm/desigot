'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

async function migrate() {
  const pool = new Pool({ connectionString: config.db.primary });
  const sqlPath = path.join(__dirname, 'schema.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('schema.sql not found at', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();

  try {
    console.log('Running migrations…');
    await client.query(sql);
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
