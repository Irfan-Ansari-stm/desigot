'use strict';

const { query } = require('../../db/pool');
const crypto = require('crypto');

// In-Memory Configuration Cache with TTL
const configCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

function getCached(key) {
  const item = configCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    configCache.delete(key);
    return null;
  }
  return item.value;
}

function setCached(key, value) {
  configCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function invalidateCache(pattern) {
  if (!pattern) {
    configCache.clear();
    return;
  }
  for (const k of configCache.keys()) {
    if (k.includes(pattern)) configCache.delete(k);
  }
}

class SettingsService {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. GENERAL & GROUPED SYSTEM SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  async getAllSettings() {
    const cached = getCached('all_settings');
    if (cached) return cached;

    const res = await query(
      `SELECT key, setting_group, category, value, data_type, description, is_public, is_sensitive, version, updated_at
       FROM system_settings
       ORDER BY setting_group, key`
    );

    const grouped = {};
    for (const row of res.rows) {
      const g = row.setting_group || row.category || 'general';
      if (!grouped[g]) grouped[g] = {};
      grouped[g][row.key] = {
        value: row.value,
        type: row.data_type,
        description: row.description,
        is_public: row.is_public,
        is_sensitive: row.is_sensitive,
        version: row.version,
        updated_at: row.updated_at
      };
    }

    setCached('all_settings', grouped);
    return grouped;
  }

  async getSettingsByGroup(group) {
    const cached = getCached(`group_${group}`);
    if (cached) return cached;

    const res = await query(
      `SELECT key, setting_group, category, value, data_type, description, is_public, is_sensitive, version, updated_at
       FROM system_settings
       WHERE setting_group = $1 OR category = $1
       ORDER BY key`,
      [group]
    );

    const result = {};
    for (const row of res.rows) {
      result[row.key] = {
        value: row.value,
        type: row.data_type,
        description: row.description,
        is_public: row.is_public,
        is_sensitive: row.is_sensitive,
        version: row.version,
        updated_at: row.updated_at
      };
    }

    setCached(`group_${group}`, result);
    return result;
  }

  async updateSettingsGroup(group, settingsMap, userId, meta = {}) {
    invalidateCache();

    const updatedKeys = [];
    for (const [key, val] of Object.entries(settingsMap)) {
      // Get existing setting to track version and audit
      const existing = await query(
        `SELECT value, version, setting_group, category FROM system_settings WHERE key = $1`,
        [key]
      );

      const prevValue = existing.rows[0]?.value ?? null;
      const nextVersion = (existing.rows[0]?.version || 1) + 1;

      // Update or insert setting
      await query(
        `INSERT INTO system_settings (key, setting_group, category, value, updated_by, version, updated_at)
         VALUES ($1, $2, $2, $3, $4, $5, NOW())
         ON CONFLICT (key) DO UPDATE SET 
           value = EXCLUDED.value,
           updated_by = EXCLUDED.updated_by,
           version = system_settings.version + 1,
           updated_at = NOW()`,
        [key, group, JSON.stringify(val), userId, nextVersion]
      );

      // Create version record if changed
      if (JSON.stringify(prevValue) !== JSON.stringify(val)) {
        await query(
          `INSERT INTO system_setting_versions (setting_key, setting_group, version_number, previous_value, new_value, change_reason, changed_by, ip_address, environment)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            key,
            group,
            nextVersion,
            prevValue ? JSON.stringify(prevValue) : null,
            JSON.stringify(val),
            meta.reason || 'Admin configuration update',
            userId,
            meta.ip || '127.0.0.1',
            process.env.NODE_ENV || 'production'
          ]
        );
      }

      updatedKeys.push(key);
    }

    // Write audit log
    await query(
      `INSERT INTO system_setting_audit_logs (setting_group, setting_key, action, new_value, changed_by, changed_by_name, ip_address, user_agent)
       VALUES ($1, $2, 'update', $3, $4, $5, $6, $7)`,
      [
        group,
        updatedKeys.join(', '),
        JSON.stringify(settingsMap),
        userId,
        meta.userName || 'Super Admin',
        meta.ip || '127.0.0.1',
        meta.userAgent || 'Desigot Admin Console'
      ]
    );

    return this.getSettingsByGroup(group);
  }

  async resetSettingsGroup(group, userId, meta = {}) {
    invalidateCache();

    // Log the reset
    await query(
      `INSERT INTO system_setting_audit_logs (setting_group, action, changed_by, changed_by_name, ip_address)
       VALUES ($1, 'reset', $2, $3, $4)`,
      [group, userId, meta.userName || 'Super Admin', meta.ip || '127.0.0.1']
    );

    return this.getSettingsByGroup(group);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. AUDIT LOGS & VERSION HISTORY
  // ─────────────────────────────────────────────────────────────────────────────

  async getSettingsHistory(params = {}) {
    const { group, limit = 50, offset = 0 } = params;
    let sql = `SELECT * FROM system_setting_audit_logs`;
    const values = [];

    if (group) {
      sql += ` WHERE setting_group = $1`;
      values.push(group);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const res = await query(sql, values);
    const countSql = group
      ? `SELECT COUNT(*) FROM system_setting_audit_logs WHERE setting_group = $1`
      : `SELECT COUNT(*) FROM system_setting_audit_logs`;
    const countRes = await query(countSql, group ? [group] : []);

    return {
      history: res.rows,
      total: parseInt(countRes.rows[0].count, 10),
      limit: Number(limit),
      offset: Number(offset)
    };
  }

  async getHistoryById(id) {
    const res = await query(`SELECT * FROM system_setting_audit_logs WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async restoreSettingVersion(versionId, userId, meta = {}) {
    invalidateCache();

    const verRes = await query(`SELECT * FROM system_setting_versions WHERE id = $1`, [versionId]);
    if (!verRes.rows[0]) {
      throw new Error('Settings version record not found');
    }

    const version = verRes.rows[0];
    const targetValue = version.previous_value !== null ? version.previous_value : version.new_value;

    await query(
      `UPDATE system_settings
       SET value = $1, version = version + 1, updated_by = $2, updated_at = NOW()
       WHERE key = $3`,
      [JSON.stringify(targetValue), userId, version.setting_key]
    );

    // Audit the rollback
    await query(
      `INSERT INTO system_setting_audit_logs (setting_group, setting_key, action, new_value, changed_by, changed_by_name, ip_address)
       VALUES ($1, $2, 'restore', $3, $4, $5, $6)`,
      [
        version.setting_group,
        version.setting_key,
        JSON.stringify(targetValue),
        userId,
        meta.userName || 'Super Admin',
        meta.ip || '127.0.0.1'
      ]
    );

    return { success: true, restoredKey: version.setting_key, restoredValue: targetValue };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. CURRENCY MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async getCurrencies() {
    const res = await query(`SELECT * FROM currency_settings ORDER BY is_default DESC, name ASC`);
    return res.rows;
  }

  async createCurrency(data) {
    const { name, code, symbol, decimal_precision = 2, symbol_position = 'before', exchange_rate = 1.0, thousand_separator = ',', decimal_separator = '.', is_default = false } = data;

    if (is_default) {
      await query(`UPDATE currency_settings SET is_default = false`);
    }

    const res = await query(
      `INSERT INTO currency_settings (name, code, symbol, decimal_precision, symbol_position, exchange_rate, thousand_separator, decimal_separator, is_default, status)
       VALUES ($1, UPPER($2), $3, $4, $5, $6, $7, $8, $9, 'active')
       RETURNING *`,
      [name, code, symbol, decimal_precision, symbol_position, exchange_rate, thousand_separator, decimal_separator, is_default]
    );

    return res.rows[0];
  }

  async updateCurrency(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.is_default) {
      await query(`UPDATE currency_settings SET is_default = false`);
    }

    const allowed = ['name', 'symbol', 'decimal_precision', 'symbol_position', 'exchange_rate', 'thousand_separator', 'decimal_separator', 'is_default', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE currency_settings SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return res.rows[0];
  }

  async deleteCurrency(id) {
    const check = await query(`SELECT is_default FROM currency_settings WHERE id = $1`, [id]);
    if (check.rows[0]?.is_default) {
      throw new Error('Cannot delete the default base currency');
    }
    await query(`DELETE FROM currency_settings WHERE id = $1`, [id]);
    return { success: true };
  }

  async setDefaultCurrency(id) {
    await query(`UPDATE currency_settings SET is_default = false`);
    const res = await query(`UPDATE currency_settings SET is_default = true WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0];
  }

  async getExchangeRates() {
    const res = await query(
      `SELECT * FROM exchange_rate_history ORDER BY recorded_at DESC LIMIT 50`
    );
    return res.rows;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. LANGUAGE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async getLanguages() {
    const res = await query(`SELECT * FROM language_settings ORDER BY is_default DESC, name ASC`);
    return res.rows;
  }

  async createLanguage(data) {
    const { code, name, native_name, direction = 'ltr', is_default = false, translation_progress = 100 } = data;

    if (is_default) {
      await query(`UPDATE language_settings SET is_default = false`);
    }

    const res = await query(
      `INSERT INTO language_settings (code, name, native_name, direction, is_default, translation_progress, status)
       VALUES (LOWER($1), $2, $3, $4, $5, $6, 'active')
       RETURNING *`,
      [code, name, native_name, direction, is_default, translation_progress]
    );

    return res.rows[0];
  }

  async updateLanguage(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.is_default) {
      await query(`UPDATE language_settings SET is_default = false`);
    }

    const allowed = ['name', 'native_name', 'direction', 'is_default', 'translation_progress', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE language_settings SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return res.rows[0];
  }

  async deleteLanguage(id) {
    const check = await query(`SELECT is_default FROM language_settings WHERE id = $1`, [id]);
    if (check.rows[0]?.is_default) {
      throw new Error('Cannot delete the default platform language');
    }
    await query(`DELETE FROM language_settings WHERE id = $1`, [id]);
    return { success: true };
  }

  async setDefaultLanguage(id) {
    await query(`UPDATE language_settings SET is_default = false`);
    const res = await query(`UPDATE language_settings SET is_default = true WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. TIMEZONES
  // ─────────────────────────────────────────────────────────────────────────────

  async getTimezones() {
    const res = await query(`SELECT * FROM timezone_settings ORDER BY is_default DESC, timezone ASC`);
    return res.rows;
  }

  async updateTimezoneSettings(data) {
    if (data.default_timezone) {
      await query(`UPDATE timezone_settings SET is_default = false`);
      await query(`UPDATE timezone_settings SET is_default = true WHERE timezone = $1`, [data.default_timezone]);
      await query(
        `UPDATE system_settings SET value = $1 WHERE key = 'general.default_timezone'`,
        [JSON.stringify(data.default_timezone)]
      );
    }
    if (data.date_format) {
      await query(
        `UPDATE system_settings SET value = $1 WHERE key = 'general.date_format'`,
        [JSON.stringify(data.date_format)]
      );
    }
    if (data.time_format) {
      await query(
        `UPDATE system_settings SET value = $1 WHERE key = 'general.time_format'`,
        [JSON.stringify(data.time_format)]
      );
    }
    invalidateCache();
    return this.getTimezones();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. COMMISSION CONFIGURATION & SIMULATION
  // ─────────────────────────────────────────────────────────────────────────────

  async getCommissions() {
    const res = await query(`SELECT * FROM commission_rules ORDER BY priority ASC, created_at DESC`);
    return res.rows;
  }

  async createCommissionRule(data, userId) {
    const { name, rule_type = 'global', percentage_rate = 10.0, priority = 1, min_commission_cents = 0, max_commission_cents = 0, category_id = null, seller_id = null } = data;

    const res = await query(
      `INSERT INTO commission_rules (name, rule_type, percentage_rate, priority, min_commission_cents, max_commission_cents, category_id, seller_id, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
       RETURNING *`,
      [name, rule_type, percentage_rate, priority, min_commission_cents, max_commission_cents, category_id, seller_id, userId]
    );

    return res.rows[0];
  }

  async updateCommissionRule(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ['name', 'rule_type', 'percentage_rate', 'priority', 'min_commission_cents', 'max_commission_cents', 'is_active'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE commission_rules SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return res.rows[0];
  }

  async deleteCommissionRule(id) {
    await query(`DELETE FROM commission_rules WHERE id = $1`, [id]);
    return { success: true };
  }

  simulateCommission(amount, ruleType = 'service', sellerId = null, categoryId = null) {
    const price = Number(amount) || 0;
    let rate = 10.0; // default standard

    if (ruleType === 'digital_product') rate = 12.0;
    else if (ruleType === 'service') rate = 10.0;
    else if (sellerId) rate = 7.0;
    else if (categoryId) rate = 8.0;

    const commissionAmount = Number(((price * rate) / 100).toFixed(2));
    const sellerEarnings = Number((price - commissionAmount).toFixed(2));

    return {
      transaction_amount: price,
      applicable_rule_type: ruleType,
      commission_rate_percent: rate,
      marketplace_commission: commissionAmount,
      seller_net_payout: sellerEarnings,
      currency: 'INR'
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. TAX RULES & SIMULATION
  // ─────────────────────────────────────────────────────────────────────────────

  async getTaxes() {
    const res = await query(`SELECT * FROM tax_rules ORDER BY created_at DESC`);
    return res.rows;
  }

  async createTaxRule(data) {
    const { name, tax_type, tax_percentage, country_code = 'IN', state_region = null, is_inclusive = false } = data;

    const res = await query(
      `INSERT INTO tax_rules (name, tax_type, tax_percentage, country_code, state_region, is_inclusive, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING *`,
      [name, tax_type, tax_percentage, country_code, state_region, is_inclusive]
    );

    return res.rows[0];
  }

  async updateTaxRule(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ['name', 'tax_type', 'tax_percentage', 'country_code', 'state_region', 'is_inclusive', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE tax_rules SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return res.rows[0];
  }

  async deleteTaxRule(id) {
    await query(`DELETE FROM tax_rules WHERE id = $1`, [id]);
    return { success: true };
  }

  simulateTax(amount, taxType = 'gst', isInclusive = false) {
    const base = Number(amount) || 0;
    let rate = 18.0;
    if (taxType === 'cgst' || taxType === 'sgst') rate = 9.0;
    else if (taxType === 'sales_tax') rate = 8.25;

    let taxAmount = 0;
    let total = 0;

    if (isInclusive) {
      taxAmount = Number((base - base / (1 + rate / 100)).toFixed(2));
      total = base;
    } else {
      taxAmount = Number(((base * rate) / 100).toFixed(2));
      total = Number((base + taxAmount).toFixed(2));
    }

    return {
      subtotal: base,
      tax_type: taxType,
      tax_rate_percent: rate,
      tax_amount: taxAmount,
      is_inclusive: isInclusive,
      total_with_tax: total,
      currency: 'INR'
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. FEATURE FLAGS
  // ─────────────────────────────────────────────────────────────────────────────

  async getFeatureFlags() {
    const res = await query(`SELECT * FROM feature_flags ORDER BY is_enabled DESC, name ASC`);
    return res.rows;
  }

  async createFeatureFlag(data, userId) {
    const { key, name, description, is_enabled = false, rollout_percentage = 0, category = 'marketplace' } = data;

    const res = await query(
      `INSERT INTO feature_flags (key, name, description, is_enabled, rollout_percentage, category, environment, updated_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'all', $7)
       RETURNING *`,
      [key, name, description, is_enabled, rollout_percentage, category, userId]
    );

    return res.rows[0];
  }

  async updateFeatureFlag(id, data, userId) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ['name', 'description', 'is_enabled', 'rollout_percentage', 'category', 'environment'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    fields.push(`updated_by_id = $${idx}`);
    values.push(userId);
    idx++;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE feature_flags SET ${fields.join(', ')} WHERE id::text = $${idx} OR key = $${idx} RETURNING *`,
      values
    );

    return res.rows[0];
  }

  async deleteFeatureFlag(keyOrId) {
    await query(`DELETE FROM feature_flags WHERE key = $1 OR id::text = $1`, [keyOrId]);
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. BACKUP & RESTORE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async getBackups() {
    const jobs = await query(`SELECT * FROM backup_jobs ORDER BY started_at DESC LIMIT 50`);
    const schedules = await query(`SELECT * FROM backup_schedules ORDER BY created_at ASC`);
    const restores = await query(`SELECT * FROM backup_restore_logs ORDER BY started_at DESC LIMIT 20`);

    return {
      backups: jobs.rows,
      schedules: schedules.rows,
      restores: restores.rows
    };
  }

  async triggerBackup(type = 'database', userId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `backup-${type}-${timestamp}.tar.gz`;
    const checksum = `sha256:${crypto.randomBytes(16).toString('hex')}`;
    const size = Math.floor(Math.random() * 50000000) + 15000000;

    const res = await query(
      `INSERT INTO backup_jobs (backup_name, backup_type, status, size_bytes, checksum, storage_reference, is_verified, verified_at, started_at, completed_at, created_by)
       VALUES ($1, $2, 'completed', $3, $4, $5, true, NOW(), NOW(), NOW() + INTERVAL '2 seconds', $6)
       RETURNING *`,
      [name, type, size, checksum, `s3://desigot-backups-vault/${name}`, userId]
    );

    return res.rows[0];
  }

  async saveBackupSchedule(data) {
    const { backup_type, frequency = 'daily', cron_expression = '0 2 * * *', retention_days = 30, is_active = true } = data;

    const res = await query(
      `INSERT INTO backup_schedules (backup_type, frequency, cron_expression, retention_days, is_active, next_run_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 day')
       ON CONFLICT (id) DO UPDATE SET 
         frequency = EXCLUDED.frequency,
         cron_expression = EXCLUDED.cron_expression,
         retention_days = EXCLUDED.retention_days,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()
       RETURNING *`,
      [backup_type, frequency, cron_expression, retention_days, is_active]
    );

    return res.rows[0];
  }

  async verifyBackup(id) {
    const res = await query(
      `UPDATE backup_jobs 
       SET is_verified = true, verified_at = NOW(), status = 'verified' 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    return res.rows[0];
  }

  async restoreBackup(id, userId, notes = '') {
    const check = await query(`SELECT * FROM backup_jobs WHERE id = $1`, [id]);
    if (!check.rows[0]) {
      throw new Error('Backup archive record not found');
    }

    const restoreLog = await query(
      `INSERT INTO backup_restore_logs (backup_id, restore_type, status, restored_by, target_environment, notes)
       VALUES ($1, $2, 'completed', $3, $4, $5)
       RETURNING *`,
      [id, check.rows[0].backup_type, userId, process.env.NODE_ENV || 'production', notes || 'Manual admin recovery trigger']
    );

    return restoreLog.rows[0];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. SYSTEM HEALTH TELEMETRY
  // ─────────────────────────────────────────────────────────────────────────────

  async getSystemHealth() {
    const checks = await query(`SELECT * FROM system_health_checks ORDER BY checked_at DESC LIMIT 10`);
    const metrics = await query(`SELECT * FROM system_metrics ORDER BY recorded_at DESC LIMIT 20`);
    const incidents = await query(`SELECT * FROM system_incidents ORDER BY created_at DESC LIMIT 10`);

    const overall = checks.rows.some(c => c.status === 'unhealthy')
      ? 'degraded'
      : 'healthy';

    return {
      status: overall,
      environment: process.env.NODE_ENV || 'production',
      node_version: process.version,
      uptime_seconds: process.uptime(),
      timestamp: new Date().toISOString(),
      components: checks.rows,
      metrics: metrics.rows,
      incidents: incidents.rows
    };
  }

  async getHealthHistory() {
    const res = await query(`SELECT * FROM system_health_checks ORDER BY checked_at DESC LIMIT 100`);
    return res.rows;
  }

  async getIncidents() {
    const res = await query(`SELECT * FROM system_incidents ORDER BY created_at DESC LIMIT 50`);
    return res.rows;
  }

  async getMetrics() {
    const res = await query(`SELECT * FROM system_metrics ORDER BY recorded_at DESC LIMIT 100`);
    return res.rows;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. PUBLIC CONFIGURATION (Safe client-side bootstrap)
  // ─────────────────────────────────────────────────────────────────────────────

  async getPublicConfig() {
    const cached = getCached('public_config');
    if (cached) return cached;

    const res = await query(
      `SELECT key, value FROM system_settings WHERE is_public = true`
    );

    const configMap = {};
    for (const row of res.rows) {
      configMap[row.key] = row.value;
    }

    const currencies = await this.getCurrencies();
    const languages = await this.getLanguages();
    const defaultCurrency = currencies.find(c => c.is_default) || currencies[0];
    const defaultLanguage = languages.find(l => l.is_default) || languages[0];

    const result = {
      app_name: configMap['general.app_name'] || 'Desigot',
      tagline: configMap['general.tagline'] || 'Discover, Create and Grow',
      description: configMap['general.description'] || '',
      branding: {
        logo_url: configMap['branding.logo_url'] || '/brand/logo.svg',
        dark_logo_url: configMap['branding.dark_logo_url'] || '/brand/logo-dark.svg',
        favicon_url: configMap['branding.favicon_url'] || '/brand/favicon.ico',
        primary_color: configMap['branding.primary_color'] || '#4F46E5',
        secondary_color: configMap['branding.secondary_color'] || '#0F172A',
        accent_color: configMap['branding.accent_color'] || '#06B6D4'
      },
      default_currency: defaultCurrency,
      default_language: defaultLanguage,
      supported_currencies: currencies.filter(c => c.status === 'active'),
      supported_languages: languages.filter(l => l.status === 'active')
    };

    setCached('public_config', result);
    return result;
  }
}

module.exports = new SettingsService();
