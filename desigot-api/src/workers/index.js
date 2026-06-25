'use strict';
require('dotenv').config();
const logger = require('../config/logger');
const { testConnection } = require('../db/pool');
const { scheduleJobs } = require('./escrow.worker');

(async () => {
  await testConnection();
  await scheduleJobs();
  logger.info('Worker process started. Listening for jobs…');
})();

process.on('SIGTERM', () => {
  logger.info('Worker shutting down…');
  process.exit(0);
});
