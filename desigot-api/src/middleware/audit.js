'use strict';
const { query } = require('../db/pool');
const logger = require('../config/logger');

/**
 * Middleware factory: writes to audit_logs after the response is sent.
 */
const auditLog = (action, entityType) => (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 400) return; // Only log successful mutations
    try {
      const entityId = req.params.id || req.auditEntityId || null;
      if (!entityId) return;
      await query(
        `INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, ip_address, user_agent, new_values)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          req.user?.id || null,
          req.user ? 'user' : 'system',
          action,
          entityType,
          entityId,
          req.ip,
          req.headers['user-agent'] || null,
          req.auditNewValues ? JSON.stringify(req.auditNewValues) : null,
        ]
      );
    } catch (err) {
      logger.warn('Audit log write failed', { err: err.message });
    }
  });
  next();
};

module.exports = { auditLog };
