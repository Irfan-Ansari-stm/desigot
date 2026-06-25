'use strict';
require('dotenv').config();
const http   = require('http');
const config = require('./config');
const logger = require('./config/logger');
const createApp = require('./app');
const { testConnection } = require('./db/pool');

const bootstrap = async () => {
  // Verify DB connectivity before accepting traffic
  await testConnection();

  const app    = createApp();
  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(`Desigot API started`, {
      port: config.port,
      env: config.env,
      version: config.apiVersion,
    });
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────────
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully…`);
    server.close(async () => {
      const { primaryPool, replicaPool } = require('./db/pool');
      await primaryPool.end();
      await replicaPool.end();
      logger.info('Database pools closed. Exiting.');
      process.exit(0);
    });

    // Force exit after 30s if still hanging
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err: err.message, stack: err.stack });
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
    process.exit(1);
  });
};

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err.message);
  process.exit(1);
});
