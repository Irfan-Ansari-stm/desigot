-- ==============================================================================
-- DESIGOT MODULE 17: SYSTEM SETTINGS MANAGEMENT MIGRATION
-- Enterprise-Grade Global Application Configuration & Control Center
-- ==============================================================================

-- 1. Extend system_settings with group, versioning, and sensitivity
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS setting_group VARCHAR(64);
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT false;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}'::jsonb;

-- Populate setting_group from category if null
UPDATE system_settings SET setting_group = category WHERE setting_group IS NULL;

-- 2. System Setting Versions (Immutable history for rollbacks)
CREATE TABLE IF NOT EXISTS system_setting_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(128) NOT NULL,
  setting_group VARCHAR(64) NOT NULL,
  version_number INT NOT NULL,
  previous_value JSONB,
  new_value JSONB NOT NULL,
  change_reason TEXT,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  environment VARCHAR(32) DEFAULT 'production'
);
CREATE INDEX IF NOT EXISTS idx_setting_versions_key ON system_setting_versions(setting_key, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_setting_versions_group ON system_setting_versions(setting_group);

-- 3. System Setting Audit Logs
CREATE TABLE IF NOT EXISTS system_setting_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_group VARCHAR(64) NOT NULL,
  setting_key VARCHAR(128),
  action VARCHAR(32) NOT NULL, -- 'update', 'reset', 'restore', 'create', 'delete'
  previous_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name VARCHAR(128),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_setting_audit_group ON system_setting_audit_logs(setting_group, created_at DESC);

-- 4. Multi-Currency Settings
CREATE TABLE IF NOT EXISTS currency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(64) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  symbol VARCHAR(10) NOT NULL,
  decimal_precision INT NOT NULL DEFAULT 2,
  symbol_position VARCHAR(10) NOT NULL DEFAULT 'before', -- 'before' | 'after'
  exchange_rate NUMERIC(16, 6) NOT NULL DEFAULT 1.000000,
  thousand_separator VARCHAR(5) NOT NULL DEFAULT ',',
  decimal_separator VARCHAR(5) NOT NULL DEFAULT '.',
  is_default BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'inactive'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_currency_code ON currency_settings(code);

-- 5. Exchange Rate History
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate NUMERIC(16, 6) NOT NULL,
  provider VARCHAR(64) DEFAULT 'manual',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_exchange_rates ON exchange_rate_history(from_currency, to_currency, recorded_at DESC);

-- 6. Language Settings
CREATE TABLE IF NOT EXISTS language_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  native_name VARCHAR(64) NOT NULL,
  direction VARCHAR(5) NOT NULL DEFAULT 'ltr', -- 'ltr' | 'rtl'
  is_default BOOLEAN NOT NULL DEFAULT false,
  translation_progress INT NOT NULL DEFAULT 100,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'inactive'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_language_code ON language_settings(code);

-- 7. Timezone Settings
CREATE TABLE IF NOT EXISTS timezone_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timezone VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(128) NOT NULL,
  utc_offset VARCHAR(10) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Extend commission_rules if needed & add history
ALTER TABLE commission_rules ADD COLUMN IF NOT EXISTS calculation_type VARCHAR(32) DEFAULT 'percentage';
ALTER TABLE commission_rules ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

CREATE TABLE IF NOT EXISTS commission_rule_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES commission_rules(id) ON DELETE CASCADE,
  action VARCHAR(32) NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Extend feature_flags
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS name VARCHAR(128);
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS environment VARCHAR(32) DEFAULT 'all';
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'marketplace';

-- 10. Backup & Restore Management
CREATE TABLE IF NOT EXISTS backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name VARCHAR(128) NOT NULL,
  backup_type VARCHAR(32) NOT NULL, -- 'database' | 'files' | 'config' | 'full'
  storage_reference TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'completed', -- 'completed' | 'failed' | 'in_progress' | 'verified'
  size_bytes BIGINT NOT NULL DEFAULT 0,
  checksum VARCHAR(128),
  encryption_type VARCHAR(32) DEFAULT 'AES-256',
  error_message TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_type ON backup_jobs(backup_type, status);

CREATE TABLE IF NOT EXISTS backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type VARCHAR(32) NOT NULL,
  frequency VARCHAR(32) NOT NULL DEFAULT 'daily', -- 'daily' | 'weekly' | 'monthly'
  cron_expression VARCHAR(64) NOT NULL DEFAULT '0 2 * * *',
  retention_days INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  storage_target VARCHAR(64) DEFAULT 'local',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_restore_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
  restore_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'completed',
  restored_by UUID REFERENCES users(id) ON DELETE SET NULL,
  target_environment VARCHAR(32) DEFAULT 'production',
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. System Health Incidents & Metrics
CREATE TABLE IF NOT EXISTS system_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number VARCHAR(32) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'critical' | 'high' | 'medium' | 'low'
  status VARCHAR(20) NOT NULL DEFAULT 'resolved', -- 'open' | 'investigating' | 'resolved'
  affected_components TEXT[] DEFAULT '{}',
  summary TEXT,
  root_cause TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(64) NOT NULL,
  metric_value NUMERIC(12, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON system_metrics(metric_name, recorded_at DESC);
