-- ==============================================================================
-- DESIGOT MODULE 18: PROFILE & PERSONAL ACCOUNT MANAGEMENT MIGRATION
-- Personal Account Control, Security, Sessions, 2FA, & Preferences
-- ==============================================================================

-- 1. User Profiles Table (1-to-1 extension for users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  job_title VARCHAR(128),
  department VARCHAR(128),
  company VARCHAR(128) DEFAULT 'Desigot Marketplace',
  country VARCHAR(64) DEFAULT 'India',
  state VARCHAR(64),
  city VARCHAR(64),
  address TEXT,
  postal_code VARCHAR(32),
  bio TEXT,
  website VARCHAR(255),
  linkedin_url VARCHAR(255),
  social_links JSONB DEFAULT '{}'::jsonb,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
  date_format VARCHAR(32) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(32) DEFAULT '12-hour',
  currency_display VARCHAR(10) DEFAULT 'INR',
  theme VARCHAR(20) DEFAULT 'dark',
  sidebar_collapsed BOOLEAN DEFAULT false,
  dashboard_layout VARCHAR(32) DEFAULT 'comfortable',
  email_notifications BOOLEAN DEFAULT true,
  security_notifications BOOLEAN DEFAULT true,
  login_alerts BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  reduced_motion BOOLEAN DEFAULT false,
  font_size VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- 3. User Recovery Codes Table
CREATE TABLE IF NOT EXISTS user_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(128) NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_recovery_codes_user ON user_recovery_codes(user_id);

-- 4. User Security Settings Table (Preferences & Notification Toggles)
CREATE TABLE IF NOT EXISTS user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  password_changed_at TIMESTAMPTZ DEFAULT NOW(),
  two_factor_method VARCHAR(32) DEFAULT 'totp',
  email_security_notifications BOOLEAN DEFAULT true,
  login_alerts BOOLEAN DEFAULT true,
  revoke_sessions_on_password_change BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user ON user_security_settings(user_id);

-- 5. Extend admin_sessions if needed
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS device_type VARCHAR(32) DEFAULT 'desktop';
