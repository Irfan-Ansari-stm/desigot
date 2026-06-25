'use strict';
const { Pool } = require('pg');
const config = require('../config');
const logger = require('../config/logger');

const primaryPool = new Pool({
  connectionString: config.db.primary,
  ssl: config.db.ssl,
  ...config.db.pool,
});

const replicaPool = new Pool({
  connectionString: config.db.replica,
  ssl: config.db.ssl,
  ...config.db.pool,
});

primaryPool.on('error', (err) => logger.error('Primary pool error', { err: err.message }));
replicaPool.on('error', (err) => logger.error('Replica pool error', { err: err.message }));

/**
 * Run a query on the primary (write) pool.
 */
const query = (text, params) => primaryPool.query(text, params);

/**
 * Run a query on the replica (read) pool.
 */
const queryRead = (text, params) => replicaPool.query(text, params);

/**
 * Acquire a client for multi-statement transactions.
 */
const getClient = () => primaryPool.connect();

/**
 * Helper: run multiple statements inside a single transaction.
 * callback receives (client) and must return a Promise.
 */
const withTransaction = async (callback) => {
  const client = await primaryPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Set RLS session variables for the current connection.
 */
const setRLSContext = async (client, userId, userRole) => {
  await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId || '']);
  await client.query('SELECT set_config($1, $2, true)', ['app.current_user_role', userRole || '']);
};

const testConnection = async () => {
  const client = await primaryPool.connect();
  await client.query('SELECT 1');
  client.release();
  logger.info('PostgreSQL connection established');
};

module.exports = { query, queryRead, getClient, withTransaction, setRLSContext, testConnection, primaryPool, replicaPool };
