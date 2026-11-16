-- =============================================================================
-- RBAC ENTERPRISE EXTENSION MIGRATION
-- Adds Module Access, API Route Permissions, Admin Sessions,
-- Admin Activity Logs, and Security Settings
-- =============================================================================

-- 1. ROLE MODULES (Fine-grained module access per role)
CREATE TABLE IF NOT EXISTS role_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  access_level VARCHAR(20) NOT NULL DEFAULT 'read', -- 'none', 'read', 'write', 'admin'
  is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_role_modules UNIQUE (role_id, module_id)
);

-- 2. API ROUTE PERMISSIONS (Enterprise API access control registry)
CREATE TABLE IF NOT EXISTS api_route_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(100) NOT NULL,
  method VARCHAR(10) NOT NULL, -- GET, POST, PUT, DELETE, PATCH
  endpoint VARCHAR(255) NOT NULL,
  required_permission VARCHAR(100),
  description TEXT,
  is_protected BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_api_route UNIQUE (method, endpoint)
);

-- 3. ADMIN SESSIONS (Real-time active sessions with instant revocation)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device VARCHAR(50) DEFAULT 'Desktop',
  browser VARCHAR(50) DEFAULT 'Chrome',
  os VARCHAR(50) DEFAULT 'Windows',
  location VARCHAR(100) DEFAULT 'New York, US',
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ADMIN ACTIVITY LOGS (Detailed administrative audit trail)
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  details TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SECURITY SETTINGS (System-wide security policy configuration)
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. EXTEND USER_ROLES COLUMNS IF NOT PRESENT
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. EXTEND USERS TABLE IF NEEDED
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- 8. INDEXES FOR HIGH-THROUGHPUT RBAC LOOKUPS
CREATE INDEX IF NOT EXISTS idx_role_modules_role ON role_modules (role_id);
CREATE INDEX IF NOT EXISTS idx_role_modules_module ON role_modules (module_id);
CREATE INDEX IF NOT EXISTS idx_api_route_perms_lookup ON api_route_permissions (method, endpoint);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions (user_id, is_revoked);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_admin_activity_user ON admin_activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_module ON admin_activity_logs (module, created_at DESC);
