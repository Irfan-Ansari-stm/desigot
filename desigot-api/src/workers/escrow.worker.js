'use strict';
const { Worker, Queue } = require('bullmq');
const config  = require('../config');
const logger  = require('../config/logger');
const { query } = require('../db/pool');

const connection = { url: config.redis.url };

// ── Queues ────────────────────────────────────────────────────────────────────
const escrowQueue        = new Queue('escrow-release',    { connection });
const notificationQueue  = new Queue('notifications',     { connection });
const emailQueue         = new Queue('email',             { connection });
const healthScoreQueue   = new Queue('seller-health',     { connection });

// ── Escrow auto-release worker ─────────────────────────────────────────────────
const escrowWorker = new Worker(
  'escrow-release',
  async (job) => {
    logger.info('Running escrow release job', { jobId: job.id });
    const { rows } = await query(`SELECT proc_release_expired_escrow() AS released`);
    const released = rows[0]?.released || 0;
    logger.info(`Escrow release complete: ${released} records released`);
    return { released };
  },
  { connection, concurrency: 1 }
);

// ── Notification worker ────────────────────────────────────────────────────────
const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { userId, type, title, body, actionUrl, metadata } = job.data;
    await query(
      `INSERT INTO notifications (user_id, type, title, body, action_url, metadata)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, type, title, body, actionUrl || null, JSON.stringify(metadata || {})]
    );
    logger.debug('Notification created', { userId, type });
  },
  { connection, concurrency: 10 }
);

// ── Email worker ───────────────────────────────────────────────────────────────
const emailWorker = new Worker(
  'email',
  async (job) => {
    const { to, subject, html, logId } = job.data;
    try {
      // In production: send via nodemailer/SendGrid
      logger.info('Email sent (simulated)', { to, subject });
      if (logId) {
        await query(
          `UPDATE email_logs SET status='sent', sent_at=NOW() WHERE id=$1`, [logId]
        );
      }
    } catch (err) {
      if (logId) {
        await query(
          `UPDATE email_logs SET status='failed', error_message=$1 WHERE id=$2`,
          [err.message, logId]
        );
      }
      throw err;
    }
  },
  { connection, concurrency: 5 }
);

// ── Seller health score worker ─────────────────────────────────────────────────
const healthWorker = new Worker(
  'seller-health',
  async (job) => {
    const { sellerId } = job.data;
    const adminSvc = require('../modules/admin/admin.service');
    await adminSvc.computeSellerHealth(sellerId);
    logger.debug('Seller health computed', { sellerId });
  },
  { connection, concurrency: 5 }
);

// ── Error handlers ─────────────────────────────────────────────────────────────
[escrowWorker, notificationWorker, emailWorker, healthWorker].forEach((worker) => {
  worker.on('failed', (job, err) => {
    logger.error(`Worker job failed: ${worker.name}`, { jobId: job?.id, err: err.message });
  });
});

// ── Schedule recurring jobs ────────────────────────────────────────────────────
const scheduleJobs = async () => {
  // Run escrow release every 15 minutes
  await escrowQueue.add('release', {}, {
    repeat: { every: 15 * 60 * 1000 },
    jobId: 'escrow-release-recurring',
  });
  logger.info('Scheduled recurring jobs');
};

// ── Helpers to enqueue from services ──────────────────────────────────────────
const enqueueNotification = (data) => notificationQueue.add('send', data);
const enqueueEmail        = (data) => emailQueue.add('send', data);
const enqueueHealthScore  = (sellerId) => healthScoreQueue.add('compute', { sellerId });

module.exports = {
  escrowWorker, notificationWorker, emailWorker, healthWorker,
  scheduleJobs, enqueueNotification, enqueueEmail, enqueueHealthScore,
};
