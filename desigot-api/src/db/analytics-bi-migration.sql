-- =============================================================================
-- DESIGOT ANALYTICS & BUSINESS INTELLIGENCE SYSTEM MIGRATION
-- Module 14: Analytics, BI Reporting, Funnels, and Exports
-- =============================================================================

-- 1. ANALYTICS SESSIONS TABLE
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_session_id VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  device_type VARCHAR(50) NOT NULL DEFAULT 'Desktop', -- Desktop, Mobile, Tablet
  browser VARCHAR(50) DEFAULT 'Chrome',
  os VARCHAR(50) DEFAULT 'Windows',
  traffic_source VARCHAR(100) NOT NULL DEFAULT 'Direct', -- Organic Search, Direct, Social, Referral, Email, Paid Ad
  landing_page VARCHAR(255) DEFAULT '/',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. EXTEND ANALYTICS EVENTS TABLE
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS device_type VARCHAR(50) DEFAULT 'Desktop';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS traffic_source VARCHAR(100) DEFAULT 'Direct';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ DEFAULT NOW();

-- 3. ANALYTICS DAILY SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS analytics_daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  report_type VARCHAR(50) NOT NULL DEFAULT 'overview', -- overview, revenue, sales, services, products, sellers, customers, commissions
  dimension_type VARCHAR(50) NOT NULL DEFAULT 'all', -- all, category, seller, product, service, channel
  dimension_id VARCHAR(100) NOT NULL DEFAULT 'all',
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  gross_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  completed_order_count INTEGER NOT NULL DEFAULT 0,
  refund_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  unique_customers INTEGER NOT NULL DEFAULT 0,
  metrics_json JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_daily_summary UNIQUE (report_date, report_type, dimension_type, dimension_id, currency)
);

-- 4. ANALYTICS MONTHLY SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS analytics_monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month VARCHAR(7) NOT NULL, -- YYYY-MM
  report_type VARCHAR(50) NOT NULL DEFAULT 'overview',
  gross_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  commission_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  metrics_json JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_monthly_summary UNIQUE (year_month, report_type)
);

-- 5. ANALYTICS REPORT EXPORTS TABLE
CREATE TABLE IF NOT EXISTS analytics_report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name VARCHAR(150) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- revenue, sales, services, products, sellers, customers, commissions, conversion, categories
  format VARCHAR(10) NOT NULL DEFAULT 'csv', -- csv, xlsx, pdf, json
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  filters_json JSONB DEFAULT '{}',
  file_reference VARCHAR(255),
  file_content TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- queued, processing, completed, failed, expired
  record_count INTEGER NOT NULL DEFAULT 0,
  file_size_bytes BIGINT DEFAULT 0,
  error_message TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 6. HIGH PERFORMANCE INDEXES FOR REAL-TIME BI REPORTING
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_resource ON analytics_events (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_time ON analytics_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_device_traffic ON analytics_sessions (device_type, traffic_source);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily_summaries (report_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_lookup ON analytics_daily_summaries (report_type, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_monthly_ym ON analytics_monthly_summaries (year_month DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_exports_user ON analytics_report_exports (requested_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_analytics ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_analytics ON orders (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_analytics ON orders (buyer_id, created_at DESC);
