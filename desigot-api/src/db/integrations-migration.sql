-- =============================================================================
-- DESIGOT MODULE 16: ENTERPRISE INTEGRATIONS & API MANAGEMENT SYSTEM
-- Database Migration Script
-- =============================================================================

-- 1. CENTRAL INTEGRATIONS REGISTRY
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  integration_type VARCHAR(50) NOT NULL, -- payment, email, storage, external_service, internal_api, webhook
  environment VARCHAR(30) DEFAULT 'sandbox', -- sandbox, production
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, failed, pending_configuration, degraded
  health_status VARCHAR(50) DEFAULT 'operational', -- operational, degraded, disconnected, authentication_failed, configuration_error, maintenance, unknown
  is_default BOOLEAN DEFAULT FALSE,
  config_data JSONB DEFAULT '{}'::jsonb,
  credentials_encrypted JSONB DEFAULT '{}'::jsonb,
  last_tested_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_health ON integrations(health_status);

-- 2. EMAIL INTEGRATIONS SPECIFIC TABLE
CREATE TABLE IF NOT EXISTS email_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- smtp, ses, sendgrid, mailgun, resend
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  reply_to VARCHAR(255),
  smtp_host VARCHAR(255),
  smtp_port INTEGER DEFAULT 587,
  encryption VARCHAR(20) DEFAULT 'tls', -- tls, ssl, none
  daily_limit INTEGER DEFAULT 10000,
  sent_today INTEGER DEFAULT 0,
  bounces_count INTEGER DEFAULT 0,
  complaints_count INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLOUD STORAGE INTEGRATIONS SPECIFIC TABLE
CREATE TABLE IF NOT EXISTS storage_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- s3, r2, gcs, azure_blob, local
  bucket_name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  endpoint_url VARCHAR(255),
  cdn_url VARCHAR(255),
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  max_file_size_mb INTEGER DEFAULT 50,
  allowed_file_types TEXT[] DEFAULT ARRAY['jpg','jpeg','png','svg','pdf','zip','mp4'],
  total_files INTEGER DEFAULT 0,
  used_bytes BIGINT DEFAULT 0,
  storage_quota_gb INTEGER DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXTERNAL SERVICES TABLE
CREATE TABLE IF NOT EXISTS external_service_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- communication, maps, analytics, search, monitoring, identity, ai
  service_name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  environment VARCHAR(30) DEFAULT 'production',
  config_data JSONB DEFAULT '{}'::jsonb,
  health_status VARCHAR(50) DEFAULT 'operational',
  last_ping_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INTEGRATION LOGS
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID,
  service_type VARCHAR(50) NOT NULL, -- payment, email, storage, webhook, external_api, api_key
  provider VARCHAR(50),
  request_id VARCHAR(100),
  endpoint VARCHAR(255),
  http_method VARCHAR(10) DEFAULT 'GET',
  response_status INTEGER DEFAULT 200,
  duration_ms INTEGER DEFAULT 50,
  retry_count INTEGER DEFAULT 0,
  error_category VARCHAR(100),
  error_message TEXT,
  environment VARCHAR(30) DEFAULT 'production',
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_type ON integration_logs(service_type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(response_status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_date ON integration_logs(occurred_at);

-- 6. INTEGRATION SETTINGS
CREATE TABLE IF NOT EXISTS integration_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value JSONB NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. API USAGE METRICS (Daily aggregates for trend charts)
CREATE TABLE IF NOT EXISTS api_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_response_time_ms NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, service_type)
);

-- 8. EXTEND API_KEYS TABLE
DO $$
BEGIN
  ALTER TABLE api_keys ALTER COLUMN user_id DROP NOT NULL;
  ALTER TABLE api_keys ALTER COLUMN key_prefix TYPE VARCHAR(64);
  ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_environment_check;
  ALTER TABLE api_keys ADD CONSTRAINT api_keys_environment_check CHECK (environment IN ('production', 'staging', 'development', 'sandbox', 'live', 'test'));
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'key_type') THEN
    ALTER TABLE api_keys ADD COLUMN key_type VARCHAR(50) DEFAULT 'server_to_server';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'allowed_ips') THEN
    ALTER TABLE api_keys ADD COLUMN allowed_ips TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'allowed_origins') THEN
    ALTER TABLE api_keys ADD COLUMN allowed_origins TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'app_name') THEN
    ALTER TABLE api_keys ADD COLUMN app_name VARCHAR(100);
  END IF;
END $$;

-- 9. EXTEND WEBHOOK_ENDPOINTS TABLE
DO $$
BEGIN
  ALTER TABLE webhook_endpoints ALTER COLUMN seller_id DROP NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_endpoints' AND column_name = 'name') THEN
    ALTER TABLE webhook_endpoints ADD COLUMN name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_endpoints' AND column_name = 'environment') THEN
    ALTER TABLE webhook_endpoints ADD COLUMN environment VARCHAR(30) DEFAULT 'production';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_endpoints' AND column_name = 'timeout_seconds') THEN
    ALTER TABLE webhook_endpoints ADD COLUMN timeout_seconds INTEGER DEFAULT 15;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_endpoints' AND column_name = 'retry_limit') THEN
    ALTER TABLE webhook_endpoints ADD COLUMN retry_limit INTEGER DEFAULT 5;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_endpoints' AND column_name = 'signing_secret_masked') THEN
    ALTER TABLE webhook_endpoints ADD COLUMN signing_secret_masked VARCHAR(100);
  END IF;
END $$;

-- 10. EXTEND WEBHOOK_DELIVERIES TABLE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'status') THEN
    ALTER TABLE webhook_deliveries ADD COLUMN status VARCHAR(50) DEFAULT 'delivered';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_deliveries' AND column_name = 'next_retry_at') THEN
    ALTER TABLE webhook_deliveries ADD COLUMN next_retry_at TIMESTAMPTZ;
  END IF;
END $$;
