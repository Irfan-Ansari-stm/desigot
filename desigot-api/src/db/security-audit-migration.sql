-- =============================================================================
-- DESIGOT MODULE 15: SECURITY & AUDIT MANAGEMENT SYSTEM MIGRATION
-- =============================================================================

-- 1. Extend login_history with rich client telemetry
ALTER TABLE login_history ADD COLUMN IF NOT EXISTS device_type VARCHAR(50);
ALTER TABLE login_history ADD COLUMN IF NOT EXISTS browser VARCHAR(50);
ALTER TABLE login_history ADD COLUMN IF NOT EXISTS operating_system VARCHAR(50);
ALTER TABLE login_history ADD COLUMN IF NOT EXISTS authentication_method VARCHAR(50) DEFAULT 'password';
ALTER TABLE login_history ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE login_history ADD COLUMN IF NOT EXISTS session_id UUID;

-- 2. Extend security_events with investigation workflow columns
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS investigation_status VARCHAR(50) DEFAULT 'unassigned';
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- 3. Extend ip_restrictions with scope and CIDR support
ALTER TABLE ip_restrictions ADD COLUMN IF NOT EXISTS cidr_range VARCHAR(50);
ALTER TABLE ip_restrictions ADD COLUMN IF NOT EXISTS scope VARCHAR(50) DEFAULT 'all';
ALTER TABLE ip_restrictions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE ip_restrictions ADD COLUMN IF NOT EXISTS created_by UUID;

-- 4. Extend audit_logs with module, severity, and hash chain fields
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS module VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'info';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS change_summary TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS integrity_hash VARCHAR(64);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(64);

-- 5. Failed Login Attempts Tracking
CREATE TABLE IF NOT EXISTS security_failed_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_identifier VARCHAR(255) NOT NULL,
  user_id UUID,
  ip_address VARCHAR(45),
  failure_category VARCHAR(100) NOT NULL,
  attempt_count INT DEFAULT 1,
  risk_level VARCHAR(20) DEFAULT 'low',
  device_info TEXT,
  browser VARCHAR(50),
  operating_system VARCHAR(50),
  request_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Administrative Actions Log
CREATE TABLE IF NOT EXISTS administrative_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_name VARCHAR(255),
  actor_role VARCHAR(50),
  action_type VARCHAR(100) NOT NULL,
  target_user_id UUID,
  target_resource VARCHAR(100),
  module VARCHAR(50),
  before_value JSONB,
  after_value JSONB,
  ip_address VARCHAR(45),
  result VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. API Access Logs (Structured Audit & Monitoring)
CREATE TABLE IF NOT EXISTS api_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID DEFAULT gen_random_uuid(),
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  user_id UUID,
  client_app VARCHAR(100) DEFAULT 'desigot-web',
  ip_address VARCHAR(45),
  user_agent TEXT,
  status_code INT NOT NULL,
  duration_ms INT NOT NULL,
  request_size INT DEFAULT 0,
  response_size INT DEFAULT 0,
  rate_limit_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Account Lockouts Management
CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email VARCHAR(255) NOT NULL,
  lockout_reason TEXT,
  failed_attempt_count INT DEFAULT 5,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_by UUID,
  unlocked_at TIMESTAMPTZ
);

-- 9. Security Alerts & Incident Feed
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID,
  ip_address VARCHAR(45),
  status VARCHAR(50) DEFAULT 'open',
  assigned_to UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Security Investigations Dossier
CREATE TABLE IF NOT EXISTS security_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  assigned_to UUID,
  created_by UUID,
  findings TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 11. Security Investigation Linked Events
CREATE TABLE IF NOT EXISTS security_investigation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID REFERENCES security_investigations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Data Access Logs (Sensitive Resource Read Tracking)
CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_role VARCHAR(50),
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  access_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  request_id UUID,
  result VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Trusted Device Registry
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  device_id VARCHAR(255) NOT NULL,
  device_type VARCHAR(50),
  browser VARCHAR(50),
  operating_system VARCHAR(50),
  ip_address VARCHAR(45),
  is_trusted BOOLEAN DEFAULT TRUE,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Compliance Reports & Audit Exports
CREATE TABLE IF NOT EXISTS security_compliance_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(100) NOT NULL,
  format VARCHAR(10) DEFAULT 'csv',
  requested_by UUID,
  record_count INT DEFAULT 0,
  file_path VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. User MFA Methods Registry
CREATE TABLE IF NOT EXISTS user_mfa_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  method_type VARCHAR(50) DEFAULT 'totp',
  secret_encrypted TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  recovery_codes_hashes JSONB,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_sec_failed_account ON security_failed_attempts(account_identifier);
CREATE INDEX IF NOT EXISTS idx_sec_failed_created ON security_failed_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_actor ON administrative_actions(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON administrative_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_access_created ON api_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_access_endpoint ON api_access_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_sec_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sec_investigations_status ON security_investigations(status);
CREATE INDEX IF NOT EXISTS idx_data_access_resource ON data_access_logs(resource_type, resource_id);
