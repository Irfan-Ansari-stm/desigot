-- ============================================================================
-- DESIGOT DASHBOARD & ANALYTICS EXTENSION MIGRATION
-- Adds analytics events, daily pre-aggregations, system health monitoring,
-- dashboard preferences, saved filters, and granular RBAC permissions.
-- ============================================================================

-- 1. Analytics Events (tracks views, searches, funnel steps, conversions)
CREATE TABLE IF NOT EXISTS analytics_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      VARCHAR(64) NOT NULL, -- 'page_view', 'product_view', 'service_view', 'search', 'add_to_cart', 'checkout_intent', 'payment_success', 'order_complete'
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id      VARCHAR(64),
  resource_type   VARCHAR(32), -- 'product', 'service', 'category', 'seller', 'checkout'
  resource_id     UUID,
  metadata        JSONB NOT NULL DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_resource ON analytics_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);

-- 2. Daily Analytics Aggregation Table
CREATE TABLE IF NOT EXISTS daily_analytics (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                    DATE NOT NULL UNIQUE,
  gmv_cents               BIGINT NOT NULL DEFAULT 0,
  platform_revenue_cents  BIGINT NOT NULL DEFAULT 0,
  seller_payout_cents     BIGINT NOT NULL DEFAULT 0,
  refund_cents            BIGINT NOT NULL DEFAULT 0,
  total_orders            INTEGER NOT NULL DEFAULT 0,
  completed_orders        INTEGER NOT NULL DEFAULT 0,
  cancelled_orders        INTEGER NOT NULL DEFAULT 0,
  product_orders          INTEGER NOT NULL DEFAULT 0,
  service_orders          INTEGER NOT NULL DEFAULT 0,
  new_users               INTEGER NOT NULL DEFAULT 0,
  new_sellers             INTEGER NOT NULL DEFAULT 0,
  new_customers           INTEGER NOT NULL DEFAULT 0,
  total_views             INTEGER NOT NULL DEFAULT 0,
  search_count            INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);

-- 3. System Health Checks Table (live & historical monitoring)
CREATE TABLE IF NOT EXISTS system_health_checks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component       VARCHAR(64) NOT NULL, -- 'database', 'redis', 'api_gateway', 'stripe', 'email', 'storage'
  check_type      VARCHAR(32) NOT NULL, -- 'liveness', 'readiness', 'latency', 'integration'
  status          VARCHAR(16) NOT NULL, -- 'operational', 'degraded', 'down', 'unknown'
  latency_ms      INTEGER NOT NULL DEFAULT 0,
  details         JSONB NOT NULL DEFAULT '{}',
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_checks_component_time ON system_health_checks(component, checked_at DESC);

-- 4. System Health Alerts
CREATE TABLE IF NOT EXISTS system_health_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity        VARCHAR(16) NOT NULL, -- 'critical', 'warning', 'info'
  component       VARCHAR(64) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  message         TEXT NOT NULL,
  is_resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_alerts_status ON system_health_alerts(is_resolved, created_at DESC);

-- 5. Background Job Execution Logs
CREATE TABLE IF NOT EXISTS background_job_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name        VARCHAR(100) NOT NULL,
  queue_name      VARCHAR(64) NOT NULL DEFAULT 'default',
  status          VARCHAR(24) NOT NULL, -- 'queued', 'running', 'completed', 'failed', 'retrying'
  duration_ms     INTEGER NOT NULL DEFAULT 0,
  attempts        INTEGER NOT NULL DEFAULT 1,
  error_message   TEXT,
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_logs_status_time ON background_job_logs(status, created_at DESC);

-- 6. Dashboard Preferences & Saved Filters
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_period  VARCHAR(24) NOT NULL DEFAULT '30d',
  theme           VARCHAR(16) NOT NULL DEFAULT 'system',
  widget_order    JSONB NOT NULL DEFAULT '[]',
  hidden_widgets  JSONB NOT NULL DEFAULT '[]',
  refresh_interval INTEGER NOT NULL DEFAULT 60, -- seconds
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_saved_filters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  view_section    VARCHAR(64) NOT NULL, -- 'overview', 'revenue', 'marketplace', 'sales', 'services', 'sellers', 'customers'
  filter_config   JSONB NOT NULL DEFAULT '{}',
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_section ON dashboard_saved_filters(user_id, view_section);

-- 7. Add Dashboard Performance Indexes to Existing Tables
CREATE INDEX IF NOT EXISTS idx_orders_status_time ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type_status ON orders(listing_type, status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_amount ON orders(amount_cents);

CREATE INDEX IF NOT EXISTS idx_listings_seller_type ON listings(seller_id, listing_type, status);
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON listings(category_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_sales_revenue ON listings(total_sales DESC, total_revenue_cents DESC);

CREATE INDEX IF NOT EXISTS idx_commission_ledger_created ON commission_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_seller ON commission_ledger(seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payouts_seller_status ON payouts(seller_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_order_status ON disputes(order_id, status, created_at DESC);

-- 8. Seed Granular RBAC Permissions for Dashboard
DO $$
DECLARE
  v_group_id UUID;
  v_perm_id UUID;
  v_admin_role_id UUID;
  v_manager_role_id UUID;
  v_superadmin_role_id UUID;
BEGIN
  -- Ensure permission group exists
  SELECT id INTO v_group_id FROM permission_groups WHERE slug = 'group-dashboard';
  IF v_group_id IS NULL THEN
    INSERT INTO permission_groups (name, slug, description, display_order)
    VALUES ('Dashboard & Analytics', 'group-dashboard', 'Controls for business intelligence and administrative overview dashboards', 0)
    RETURNING id INTO v_group_id;
  END IF;

  -- Add Permissions
  INSERT INTO permissions (name, slug, resource, action, module_id, group_id, is_system)
  VALUES
    ('View Dashboard Overview', 'dashboard.overview.read', 'dashboard', 'READ', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('View Revenue Analytics', 'dashboard.revenue.read', 'dashboard', 'READ', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('View Marketplace Analytics', 'dashboard.marketplace.read', 'dashboard', 'READ', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('View Sales Analytics', 'dashboard.sales.read', 'dashboard', 'READ', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('View Service Analytics', 'dashboard.services.read', 'dashboard', 'READ', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('View Seller Analytics', 'dashboard.sellers.read', 'dashboard', 'READ', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('View Customer Analytics', 'dashboard.customers.read', 'dashboard', 'READ', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('View Recent Activities', 'dashboard.activities.read', 'dashboard', 'READ', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('View System Health', 'dashboard.system_health.read', 'dashboard', 'READ', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('Export Analytics Reports', 'dashboard.export', 'dashboard', 'EXPORT', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('Manage Dashboard Filters', 'dashboard.filters.manage', 'dashboard', 'MANAGE', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('Manage Dashboard Widgets', 'dashboard.widgets.manage', 'dashboard', 'MANAGE', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE),
    ('Manage System Health Operations', 'dashboard.system_health.manage', 'dashboard', 'MANAGE', (SELECT id FROM modules WHERE slug = 'dashboard'), v_group_id, FALSE)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action;

  -- Get Role IDs
  SELECT id INTO v_admin_role_id FROM roles WHERE slug = 'admin';
  SELECT id INTO v_manager_role_id FROM roles WHERE slug = 'manager';
  SELECT id INTO v_superadmin_role_id FROM roles WHERE slug = 'superadmin';

  -- Grant all dashboard permissions to admin role
  IF v_admin_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, id FROM permissions WHERE slug LIKE 'dashboard.%'
    ON CONFLICT DO NOTHING;
  END IF;

  -- Grant operational dashboard permissions to manager role
  IF v_manager_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_manager_role_id, id FROM permissions 
    WHERE slug IN (
      'dashboard.overview.read',
      'dashboard.marketplace.read',
      'dashboard.sales.read',
      'dashboard.services.read',
      'dashboard.sellers.read',
      'dashboard.customers.read',
      'dashboard.activities.read',
      'dashboard.export',
      'dashboard.filters.manage'
    )
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
