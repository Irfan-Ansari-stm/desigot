-- ============================================================================
-- DESIGOT DIGITAL PRODUCT MANAGEMENT EXTENSION MIGRATION
-- Supports all 15 digital product sections:
-- Products, Files, Licenses, Versions, Downloads, Sales, Refunds, Moderation,
-- Featured placements, Categories, Tags, and full RBAC integration.
-- ============================================================================

-- 1. Digital Products Table
CREATE TABLE IF NOT EXISTS digital_products (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id              UUID REFERENCES listings(id) ON DELETE SET NULL,
  seller_id               UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id             UUID REFERENCES listing_categories(id) ON DELETE SET NULL,
  title                   VARCHAR(255) NOT NULL CHECK (char_length(title) >= 3),
  slug                    VARCHAR(255) NOT NULL UNIQUE,
  short_description       TEXT,
  description             TEXT NOT NULL,
  version                 VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  status                  VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'published', 'rejected', 'suspended', 'archived')),
  price_personal_cents    INTEGER NOT NULL DEFAULT 0 CHECK (price_personal_cents >= 0),
  price_commercial_cents  INTEGER NOT NULL DEFAULT 0 CHECK (price_commercial_cents >= 0),
  price_extended_cents    INTEGER NOT NULL DEFAULT 0 CHECK (price_extended_cents >= 0),
  price_enterprise_cents  INTEGER NOT NULL DEFAULT 0 CHECK (price_enterprise_cents >= 0),
  currency                CHAR(3) NOT NULL DEFAULT 'USD',
  is_featured             BOOLEAN NOT NULL DEFAULT FALSE,
  featured_position       INTEGER NOT NULL DEFAULT 0,
  featured_until          TIMESTAMPTZ,
  file_formats            TEXT[] DEFAULT '{}',
  software_compatibility  TEXT[] DEFAULT '{}',
  tags                    TEXT[] DEFAULT '{}',
  thumbnail_url           TEXT,
  preview_images          TEXT[] DEFAULT '{}',
  demo_url                TEXT,
  documentation_url       TEXT,
  included_assets         TEXT[] DEFAULT '{}',
  changelog               TEXT,
  rejection_reason        TEXT,
  moderator_notes         TEXT,
  total_sales             INTEGER NOT NULL DEFAULT 0,
  total_revenue_cents     BIGINT NOT NULL DEFAULT 0,
  total_downloads         INTEGER NOT NULL DEFAULT 0,
  view_count              INTEGER NOT NULL DEFAULT 0,
  avg_rating              DECIMAL(3,2) DEFAULT 5.00,
  review_count            INTEGER NOT NULL DEFAULT 0,
  published_at            TIMESTAMPTZ,
  approved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_digital_products_seller ON digital_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_category ON digital_products(category_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status);
CREATE INDEX IF NOT EXISTS idx_digital_products_featured ON digital_products(is_featured, featured_position);
CREATE INDEX IF NOT EXISTS idx_digital_products_created ON digital_products(created_at DESC);

-- 2. Digital Product Files
CREATE TABLE IF NOT EXISTS digital_product_files (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id              UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  file_name               VARCHAR(255) NOT NULL,
  file_size_bytes         BIGINT NOT NULL DEFAULT 0,
  mime_type               VARCHAR(100) NOT NULL,
  file_format             VARCHAR(50) NOT NULL,
  storage_path            TEXT NOT NULL,
  storage_provider        VARCHAR(50) NOT NULL DEFAULT 's3',
  checksum_sha256         VARCHAR(64),
  virus_scan_status       VARCHAR(32) NOT NULL DEFAULT 'clean' CHECK (virus_scan_status IN ('pending', 'scanning', 'clean', 'infected', 'skipped')),
  is_primary              BOOLEAN NOT NULL DEFAULT FALSE,
  download_count          INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dp_files_product ON digital_product_files(product_id);

-- 3. Digital Product Licenses (License Templates)
CREATE TABLE IF NOT EXISTS digital_product_licenses (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    VARCHAR(100) NOT NULL,
  slug                    VARCHAR(100) NOT NULL UNIQUE,
  description             TEXT,
  terms_summary           TEXT,
  allowed_uses            TEXT[] DEFAULT '{}',
  prohibited_uses         TEXT[] DEFAULT '{}',
  max_end_products        INTEGER NOT NULL DEFAULT 1,
  can_resell              BOOLEAN NOT NULL DEFAULT FALSE,
  can_modify              BOOLEAN NOT NULL DEFAULT TRUE,
  is_default              BOOLEAN NOT NULL DEFAULT FALSE,
  price_multiplier        DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Product License Assignments
CREATE TABLE IF NOT EXISTS digital_product_license_assignments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id              UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  license_id              UUID NOT NULL REFERENCES digital_product_licenses(id) ON DELETE CASCADE,
  custom_price_cents      INTEGER,
  is_enabled              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_license UNIQUE (product_id, license_id)
);

CREATE INDEX IF NOT EXISTS idx_dp_lic_product ON digital_product_license_assignments(product_id);

-- 5. Product Versions
CREATE TABLE IF NOT EXISTS digital_product_versions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id              UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  version_string          VARCHAR(50) NOT NULL,
  release_notes           TEXT,
  changelog               TEXT,
  file_url                TEXT,
  file_size_bytes         BIGINT DEFAULT 0,
  is_current              BOOLEAN NOT NULL DEFAULT TRUE,
  released_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  download_count          INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dp_versions_product ON digital_product_versions(product_id);

-- 6. Product Downloads Log
CREATE TABLE IF NOT EXISTS digital_product_downloads (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id              UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  file_id                 UUID REFERENCES digital_product_files(id) ON DELETE SET NULL,
  user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id                UUID REFERENCES orders(id) ON DELETE SET NULL,
  ip_address              VARCHAR(45),
  user_agent              TEXT,
  downloaded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status                  VARCHAR(32) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'expired', 'blocked')),
  file_version            VARCHAR(50) NOT NULL DEFAULT '1.0.0'
);

CREATE INDEX IF NOT EXISTS idx_dp_downloads_product ON digital_product_downloads(product_id);
CREATE INDEX IF NOT EXISTS idx_dp_downloads_user ON digital_product_downloads(user_id);

-- 7. Product Download Entitlements
CREATE TABLE IF NOT EXISTS digital_product_download_entitlements (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id              UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  license_type            VARCHAR(50) NOT NULL DEFAULT 'personal',
  license_key             VARCHAR(100) NOT NULL UNIQUE,
  max_downloads           INTEGER NOT NULL DEFAULT 10,
  downloads_used          INTEGER NOT NULL DEFAULT 0,
  expires_at              TIMESTAMPTZ,
  is_revoked              BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_reason          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dp_entitlements_order ON digital_product_download_entitlements(order_id);
CREATE INDEX IF NOT EXISTS idx_dp_entitlements_user ON digital_product_download_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_dp_entitlements_key ON digital_product_download_entitlements(license_key);

-- 8. Moderation History
CREATE TABLE IF NOT EXISTS digital_product_moderation_history (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id              UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  moderator_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  action                  VARCHAR(50) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'changes_requested', 'published', 'unpublished', 'suspended', 'restored', 'featured', 'unfeatured')),
  notes                   TEXT,
  previous_status         VARCHAR(50),
  new_status              VARCHAR(50),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dp_moderation_product ON digital_product_moderation_history(product_id);

-- 9. Refund Requests
CREATE TABLE IF NOT EXISTS digital_product_refund_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id              UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  buyer_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents            INTEGER NOT NULL,
  reason                  TEXT NOT NULL,
  evidence_urls           TEXT[] DEFAULT '{}',
  status                  VARCHAR(32) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'under_review', 'approved', 'rejected', 'refunded')),
  resolution_notes        TEXT,
  resolved_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dp_refunds_product ON digital_product_refund_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_dp_refunds_status ON digital_product_refund_requests(status);

-- 10. Featured Placements
CREATE TABLE IF NOT EXISTS digital_product_featured (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id              UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  position                INTEGER NOT NULL DEFAULT 1,
  featured_type           VARCHAR(50) NOT NULL DEFAULT 'badge' CHECK (featured_type IN ('hero_banner', 'category_top', 'badge', 'staff_pick', 'trending_spotlight')),
  starts_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at                 TIMESTAMPTZ,
  impressions             INTEGER NOT NULL DEFAULT 0,
  clicks                  INTEGER NOT NULL DEFAULT 0,
  conversions             INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dp_featured_product ON digital_product_featured(product_id);
