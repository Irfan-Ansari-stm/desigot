'use strict';
const { query, queryRead } = require('../../db/pool');
const { NotFoundError, ForbiddenError } = require('../../shared/errors/AppError');
const { paginate } = require('../../shared/utils');
const logger = require('../../config/logger');

// ── Create notification (internal helper) ─────────────────────────────────────
const createNotification = async (userId, type, title, body, actionUrl = null, metadata = {}) => {
  try {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, type, title, body, action_url, metadata)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, type, title, body, actionUrl, JSON.stringify(metadata)]
    );
    return rows[0];
  } catch (err) {
    logger.warn('Failed to create notification', { err: err.message, userId, type });
    return null;
  }
};

// ── Get notifications ──────────────────────────────────────────────────────────
const getNotifications = async (userId, filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { unread_only } = filters;

  const { rows } = await queryRead(
    `SELECT * FROM notifications
      WHERE user_id=$1 AND ($2::BOOLEAN IS NULL OR is_read=$3)
      ORDER BY created_at DESC LIMIT $4 OFFSET $5`,
    [userId, unread_only ? true : null, unread_only ? false : null, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM notifications
      WHERE user_id=$1 AND ($2::BOOLEAN IS NULL OR is_read=$3)`,
    [userId, unread_only ? true : null, unread_only ? false : null]
  );
  const { rows: unread } = await queryRead(
    `SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=FALSE`, [userId]
  );
  return {
    data: rows,
    total: parseInt(cnt[0].count),
    unread_count: parseInt(unread[0].count),
    page, limit,
  };
};

// ── Mark as read ───────────────────────────────────────────────────────────────
const markAsRead = async (userId, notificationId) => {
  const { rows } = await query(
    `UPDATE notifications SET is_read=TRUE, read_at=NOW()
      WHERE id=$1 AND user_id=$2 RETURNING id`,
    [notificationId, userId]
  );
  if (!rows.length) throw new NotFoundError('Notification');
  return { message: 'Marked as read' };
};

const markAllAsRead = async (userId) => {
  await query(
    `UPDATE notifications SET is_read=TRUE, read_at=NOW()
      WHERE user_id=$1 AND is_read=FALSE`,
    [userId]
  );
  return { message: 'All notifications marked as read' };
};

// ── Delete notification ────────────────────────────────────────────────────────
const deleteNotification = async (userId, notificationId) => {
  const { rows } = await query(
    `DELETE FROM notifications WHERE id=$1 AND user_id=$2 RETURNING id`,
    [notificationId, userId]
  );
  if (!rows.length) throw new NotFoundError('Notification');
  return { message: 'Notification deleted' };
};

// ── Preferences ────────────────────────────────────────────────────────────────
const getPreferences = async (userId) => {
  const { rows } = await queryRead(
    `SELECT * FROM notification_preferences WHERE user_id=$1 ORDER BY event_type`,
    [userId]
  );
  return rows;
};

const updatePreferences = async (userId, preferences) => {
  // preferences: [{ event_type, email_enabled, in_app_enabled, push_enabled }]
  for (const pref of preferences) {
    await query(
      `INSERT INTO notification_preferences (user_id, event_type, email_enabled, in_app_enabled, push_enabled)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, event_type)
       DO UPDATE SET email_enabled=$3, in_app_enabled=$4, push_enabled=$5, updated_at=NOW()`,
      [userId, pref.event_type, pref.email_enabled ?? true, pref.in_app_enabled ?? true, pref.push_enabled ?? false]
    );
  }
  return getPreferences(userId);
};

// ── Push subscriptions ─────────────────────────────────────────────────────────
const registerPushSubscription = async (userId, data) => {
  const { rows } = await query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, user_agent)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (endpoint)
     DO UPDATE SET is_active=TRUE, user_id=$1, last_used_at=NOW()
     RETURNING *`,
    [userId, data.endpoint, data.p256dh_key, data.auth_key, data.user_agent || null]
  );
  return rows[0];
};

const unregisterPushSubscription = async (userId, endpoint) => {
  await query(
    `UPDATE push_subscriptions SET is_active=FALSE
      WHERE endpoint=$1 AND user_id=$2`,
    [endpoint, userId]
  );
  return { message: 'Push subscription removed' };
};

// ── Email logs ─────────────────────────────────────────────────────────────────
const getEmailLogs = async (filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { status, user_id } = filters;
  const { rows } = await queryRead(
    `SELECT * FROM email_logs
      WHERE ($1::TEXT IS NULL OR status=$1)
        AND ($2::UUID IS NULL OR user_id=$2)
      ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
    [status || null, user_id || null, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM email_logs
      WHERE ($1::TEXT IS NULL OR status=$1) AND ($2::UUID IS NULL OR user_id=$2)`,
    [status || null, user_id || null]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

const logEmail = async (userId, recipientEmail, eventType, subject, status = 'queued') => {
  const { rows } = await query(
    `INSERT INTO email_logs (user_id, recipient_email, event_type, subject, status)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId || null, recipientEmail, eventType || null, subject, status]
  );
  return rows[0];
};

module.exports = {
  createNotification, getNotifications, markAsRead, markAllAsRead, deleteNotification,
  getPreferences, updatePreferences,
  registerPushSubscription, unregisterPushSubscription,
  getEmailLogs, logEmail,
};
