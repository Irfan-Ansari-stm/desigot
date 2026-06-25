'use strict';
const { query, queryRead } = require('../../db/pool');
const { paginate } = require('../../shared/utils');

// ── Platform metrics dashboard ────────────────────────────────────────────────
const getPlatformMetrics = async () => {
  const { rows } = await queryRead(`SELECT * FROM v_platform_metrics`);
  return rows[0];
};

// ── Audit logs ─────────────────────────────────────────────────────────────────
const getAuditLogs = async (filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { actor_id, entity_type, action } = filters;

  const { rows } = await queryRead(
    `SELECT al.*, u.email AS actor_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id=al.actor_id
      WHERE ($1::UUID IS NULL OR al.actor_id=$1)
        AND ($2::TEXT IS NULL OR al.entity_type=$2)
        AND ($3::TEXT IS NULL OR al.action=$3)
      ORDER BY al.created_at DESC LIMIT $4 OFFSET $5`,
    [actor_id || null, entity_type || null, action || null, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM audit_logs
      WHERE ($1::UUID IS NULL OR actor_id=$1)
        AND ($2::TEXT IS NULL OR entity_type=$2)
        AND ($3::TEXT IS NULL OR action=$3)`,
    [actor_id || null, entity_type || null, action || null]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Platform config ────────────────────────────────────────────────────────────
const getConfig = async () => {
  const { rows } = await queryRead(
    `SELECT key, value, description, is_sensitive, updated_at FROM platform_config ORDER BY key`
  );
  // Mask sensitive values
  return rows.map((r) => ({ ...r, value: r.is_sensitive ? '***' : r.value }));
};

const updateConfig = async (adminId, key, value, description) => {
  const { rows } = await query(
    `INSERT INTO platform_config (key, value, description, updated_by_id)
     VALUES ($1,$2::JSONB,$3,$4)
     ON CONFLICT (key) DO UPDATE
       SET value=$2::JSONB, description=COALESCE($3,platform_config.description),
           updated_by_id=$4, updated_at=NOW()
     RETURNING key, value, description, updated_at`,
    [key, JSON.stringify(value), description || null, adminId]
  );
  return rows[0];
};

// ── Feature flags ──────────────────────────────────────────────────────────────
const getFeatureFlags = async () => {
  const { rows } = await queryRead(`SELECT * FROM feature_flags ORDER BY key`);
  return rows;
};

const updateFeatureFlag = async (adminId, key, data) => {
  const { rows } = await query(
    `INSERT INTO feature_flags (key, description, is_enabled, rollout_percentage, allowed_plan_names, updated_by_id)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (key) DO UPDATE
       SET is_enabled=$3, rollout_percentage=$4, allowed_plan_names=$5,
           updated_by_id=$6, updated_at=NOW()
     RETURNING *`,
    [key, data.description || key, data.is_enabled ?? false,
     data.rollout_percentage ?? 0, data.allowed_plan_names || [], adminId]
  );
  return rows[0];
};

// ── Seller health scores ───────────────────────────────────────────────────────
const computeSellerHealth = async (sellerId) => {
  // Calculate component scores
  const { rows: seller } = await queryRead(
    `SELECT u.response_rate, u.avg_seller_rating, u.seller_review_count,
            (SELECT COUNT(*) FROM disputes d JOIN orders o ON o.id=d.order_id
              WHERE o.seller_id=u.id AND d.opened_at > NOW()-INTERVAL '90 days') AS recent_disputes,
            (SELECT COUNT(*) FROM orders WHERE seller_id=u.id AND created_at > NOW()-INTERVAL '90 days') AS recent_orders
       FROM users u WHERE u.id=$1`,
    [sellerId]
  );
  if (!seller.length) return null;
  const s = seller[0];

  const responseScore   = Math.round((parseFloat(s.response_rate) || 0) * 100);
  const ratingScore     = Math.round(((parseFloat(s.avg_seller_rating) || 0) / 5) * 100);
  const disputeRate     = s.recent_orders > 0 ? s.recent_disputes / s.recent_orders : 0;
  const disputeScore    = Math.round(Math.max(0, 100 - disputeRate * 1000));
  const overallScore    = Math.round((responseScore * 0.25 + ratingScore * 0.40 + disputeScore * 0.35));

  const tips = [];
  if (responseScore < 80) tips.push('Improve response rate by replying to buyers within 24 hours');
  if (ratingScore < 80)   tips.push('Improve listing quality to increase review ratings');
  if (disputeScore < 90)  tips.push('Reduce disputes by accurately describing your listings');

  const { rows } = await query(
    `INSERT INTO seller_health_scores
       (seller_id, overall_score, response_rate_score, rating_score, dispute_rate_score,
        on_time_delivery_score, improvement_tips, computed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
     ON CONFLICT (seller_id) DO UPDATE
       SET overall_score=$2, response_rate_score=$3, rating_score=$4,
           dispute_rate_score=$5, improvement_tips=$7, computed_at=NOW()
     RETURNING *`,
    [sellerId, overallScore, responseScore, ratingScore, disputeScore, 100,
     JSON.stringify(tips)]
  );
  return rows[0];
};

// ── Seller earnings view ───────────────────────────────────────────────────────
const getSellerEarnings = async (sellerId) => {
  const { rows } = await queryRead(
    `SELECT * FROM v_seller_earnings_summary WHERE seller_id=$1`, [sellerId]
  );
  return rows[0] || null;
};

// ── Maintenance jobs ───────────────────────────────────────────────────────────
const runMaintenanceJob = async (job) => {
  const jobMap = {
    'release_escrow':      `SELECT proc_release_expired_escrow() AS affected`,
    'archive_projects':    `SELECT proc_archive_old_projects() AS affected`,
    'purge_notifications': `SELECT proc_purge_old_notifications() AS affected`,
    'purge_sessions':      `SELECT proc_purge_expired_sessions() AS affected`,
    'refresh_categories':  `SELECT proc_refresh_category_counts() AS affected`,
  };
  if (!jobMap[job]) throw new Error(`Unknown job: ${job}`);
  const { rows } = await query(jobMap[job]);
  return { job, result: rows[0] };
};

// ── API keys (admin view) ──────────────────────────────────────────────────────
const listApiKeys = async (filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { user_id } = filters;
  const { rows } = await queryRead(
    `SELECT ak.id, ak.key_prefix, ak.name, ak.environment, ak.scopes,
            ak.is_active, ak.last_used_at, ak.expires_at, ak.created_at,
            u.email AS owner_email
       FROM api_keys ak JOIN users u ON u.id=ak.user_id
      WHERE ($1::UUID IS NULL OR ak.user_id=$1)
      ORDER BY ak.created_at DESC LIMIT $2 OFFSET $3`,
    [user_id || null, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM api_keys WHERE ($1::UUID IS NULL OR user_id=$1)`,
    [user_id || null]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

const revokeApiKey = async (keyId) => {
  await query(`UPDATE api_keys SET is_active=FALSE, revoked_at=NOW() WHERE id=$1`, [keyId]);
  return { message: 'API key revoked' };
};

// ── Webhook management (seller self-service + admin view) ─────────────────────
const createWebhook = async (sellerId, url, events, secretHash) => {
  const { rows } = await query(
    `INSERT INTO webhook_endpoints (seller_id, url, secret_hash, events)
     VALUES ($1,$2,$3,$4) RETURNING id, url, events, is_active, created_at`,
    [sellerId, url, secretHash, events]
  );
  return rows[0];
};

const listWebhooks = async (sellerId) => {
  const { rows } = await queryRead(
    `SELECT id, url, events, is_active, failure_count, last_success_at, last_failure_at, created_at
       FROM webhook_endpoints WHERE seller_id=$1 ORDER BY created_at DESC`,
    [sellerId]
  );
  return rows;
};

const deleteWebhook = async (webhookId, sellerId) => {
  await query(`DELETE FROM webhook_endpoints WHERE id=$1 AND seller_id=$2`, [webhookId, sellerId]);
  return { message: 'Webhook removed' };
};

const getWebhookDeliveries = async (webhookId, sellerId, pageOpts) => {
  // Verify ownership
  const { rows: wh } = await queryRead(
    `SELECT id FROM webhook_endpoints WHERE id=$1 AND seller_id=$2`, [webhookId, sellerId]
  );
  if (!wh.length) throw new Error('Webhook not found');

  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT * FROM webhook_deliveries WHERE webhook_id=$1
      ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [webhookId, limit, offset]
  );
  return rows;
};

module.exports = {
  getPlatformMetrics, getAuditLogs,
  getConfig, updateConfig,
  getFeatureFlags, updateFeatureFlag,
  computeSellerHealth, getSellerEarnings,
  runMaintenanceJob,
  listApiKeys, revokeApiKey,
  createWebhook, listWebhooks, deleteWebhook, getWebhookDeliveries,
};
