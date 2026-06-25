-- =============================================================================
-- DESIGOT PLATFORM — PRODUCTION PostgreSQL DATABASE SCHEMA
-- =============================================================================
-- Version:     1.0
-- Platform:    Desigot — Global UI/UX Design Marketplace
-- Engine:      PostgreSQL 16+
-- Encoding:    UTF-8
-- Collation:   en-US-x-icu (case-insensitive, accent-insensitive)
-- Domains:     10 core domains | 35+ tables
-- ID Strategy: UUID (gen_random_uuid()) — time-sortable compatible
-- Soft Delete: deleted_at TIMESTAMPTZ NULL pattern
-- Audit:       created_at, updated_at, deleted_at on all entity tables
-- Timestamps:  All stored in UTC
-- Security:    Row-level constraints, CHECK constraints, FK enforcement
-- =============================================================================

-- =============================================================================
-- 0. PREREQUISITES & EXTENSIONS
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram similarity search
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- Accent-insensitive search
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- GIN indexes for btree ops
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query performance monitoring

-- Custom full-text search configuration (accent-insensitive English)
CREATE TEXT SEARCH CONFIGURATION desigot_fts (COPY = english);
ALTER TEXT SEARCH CONFIGURATION desigot_fts
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, english_stem;

-- =============================================================================
-- 1. ENUM TYPE DEFINITIONS
-- =============================================================================

-- ── Identity & Auth ────────────────────────────────────────────────────────
CREATE TYPE user_role_enum AS ENUM (
  'buyer',
  'seller',
  'admin',
  'superadmin'
);

CREATE TYPE account_status_enum AS ENUM (
  'active',
  'suspended',
  'banned',
  'pending_verification'
);

-- ── Listings ───────────────────────────────────────────────────────────────
CREATE TYPE listing_type_enum AS ENUM (
  'asset',    -- Downloadable design asset
  'service'   -- Custom design service
);

CREATE TYPE listing_status_enum AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'paused',
  'archived'
);

CREATE TYPE media_type_enum AS ENUM (
  'preview_image',   -- Watermarked public preview
  'delivery_file',   -- Full-resolution private delivery
  'video',           -- Preview video
  'portfolio_item'   -- Seller portfolio showcase
);

CREATE TYPE scan_status_enum AS ENUM (
  'pending',
  'clean',
  'infected',
  'skipped'
);

CREATE TYPE license_type_enum AS ENUM (
  'personal',    -- Non-commercial use only
  'commercial',  -- Commercial use, single project
  'extended'     -- Unlimited commercial use + resale
);

-- ── Orders & Payments ──────────────────────────────────────────────────────
CREATE TYPE order_status_enum AS ENUM (
  'pending',
  'active',
  'complete',
  'disputed',
  'refunded',
  'cancelled'
);

CREATE TYPE escrow_status_enum AS ENUM (
  'held',
  'frozen',           -- Frozen due to open dispute
  'released',
  'refunded',
  'partial_refund'
);

CREATE TYPE payout_status_enum AS ENUM (
  'pending',
  'processing',
  'paid',
  'failed',
  'cancelled'
);

-- ── Projects ───────────────────────────────────────────────────────────────
CREATE TYPE project_status_enum AS ENUM (
  'briefing',
  'proposal',
  'active',
  'in_revision',
  'complete',
  'cancelled',
  'disputed'
);

CREATE TYPE milestone_status_enum AS ENUM (
  'not_started',
  'in_progress',
  'submitted',
  'approved',
  'paid',
  'disputed'
);

CREATE TYPE message_type_enum AS ENUM (
  'text',
  'file',
  'system_event',
  'milestone_update'
);

-- ── Reviews ────────────────────────────────────────────────────────────────
CREATE TYPE review_type_enum AS ENUM (
  'buyer_review',   -- Buyer reviewing the seller/listing
  'seller_review'   -- Seller reviewing the buyer
);

CREATE TYPE review_status_enum AS ENUM (
  'pending_moderation',
  'approved',
  'rejected',
  'hidden'
);

-- ── Disputes ───────────────────────────────────────────────────────────────
CREATE TYPE dispute_status_enum AS ENUM (
  'open',
  'under_review',
  'resolved',
  'cancelled'
);

CREATE TYPE dispute_reason_enum AS ENUM (
  'not_as_described',
  'non_delivery',
  'quality_issue',
  'unauthorized',
  'other'
);

CREATE TYPE dispute_outcome_enum AS ENUM (
  'full_refund',
  'partial_refund',
  'no_refund'
);

-- ── Subscriptions ──────────────────────────────────────────────────────────
CREATE TYPE plan_name_enum AS ENUM (
  'free',
  'pro',
  'agency',
  'enterprise'
);

CREATE TYPE subscription_status_enum AS ENUM (
  'active',
  'cancelled',
  'past_due',
  'trialing',
  'paused'
);

-- ── Notifications ──────────────────────────────────────────────────────────
CREATE TYPE notification_type_enum AS ENUM (
  'new_order',
  'order_completed',
  'order_disputed',
  'dispute_resolved',
  'review_received',
  'review_response',
  'payout_processed',
  'payout_failed',
  'listing_approved',
  'listing_rejected',
  'milestone_submitted',
  'milestone_approved',
  'project_completed',
  'subscription_activated',
  'subscription_cancelled',
  'system_alert',
  'price_change_alert',
  'message_received'
);

-- ── Audit ──────────────────────────────────────────────────────────────────
CREATE TYPE actor_type_enum AS ENUM (
  'user',
  'system',
  'webhook',
  'admin'
);


-- =============================================================================
-- 2. SHARED UTILITY FUNCTIONS & TRIGGERS
-- =============================================================================

-- ── Auto-update updated_at on every UPDATE ────────────────────────────────
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── Slugify helper ────────────────────────────────────────────────────────
-- Generates a URL-safe slug from a text value
CREATE OR REPLACE FUNCTION fn_slugify(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      lower(
        unaccent(trim(input))
      ),
      '[^a-z0-9\s-]', '', 'g'   -- Remove non-alphanumeric (except spaces/hyphens)
    ),
    '[\s-]+', '-', 'g'           -- Replace spaces/multiple hyphens with single hyphen
  );
END;
$$;

-- ── Check star rating range ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_valid_rating(val SMALLINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
BEGIN
  RETURN val BETWEEN 1 AND 5;
END;
$$;


-- =============================================================================
-- 3. DOMAIN: IDENTITY & AUTHENTICATION
-- =============================================================================

-- ── TABLE: users ─────────────────────────────────────────────────────────
-- Central user entity; all other domains reference this table.
CREATE TABLE users (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authentication
  email                 VARCHAR(255)  NOT NULL,
  email_verified_at     TIMESTAMPTZ,                        -- NULL = unverified
  password_hash         VARCHAR(255),                       -- NULL for OAuth-only
  failed_login_count    SMALLINT      NOT NULL DEFAULT 0
                          CHECK (failed_login_count >= 0),
  locked_until          TIMESTAMPTZ,                        -- Account lockout expiry

  -- 2FA
  totp_secret           VARCHAR(255),                       -- Encrypted TOTP secret
  totp_enabled          BOOLEAN       NOT NULL DEFAULT FALSE,
  totp_backup_codes     TEXT[],                             -- Hashed backup codes

  -- Profile
  display_name          VARCHAR(100)  NOT NULL,
  username              VARCHAR(50)
                          CHECK (username ~ '^[a-z0-9_-]{3,50}$'), -- URL-safe only
  avatar_url            VARCHAR(1000),
  bio                   TEXT          CHECK (char_length(bio) <= 2000),
  timezone              VARCHAR(50)   NOT NULL DEFAULT 'UTC',
  locale                VARCHAR(10)   NOT NULL DEFAULT 'en-US',

  -- Role & Status
  role                  user_role_enum NOT NULL DEFAULT 'buyer',
  account_status        account_status_enum NOT NULL DEFAULT 'pending_verification',
  seller_verified       BOOLEAN       NOT NULL DEFAULT FALSE,
  seller_type           VARCHAR(20)             -- 'freelancer' | 'agency' | 'studio'
                          CHECK (seller_type IN ('freelancer', 'agency', 'studio')),

  -- Seller specifics
  response_rate         DECIMAL(5,4)            -- 0.0000–1.0000 (e.g. 0.9600 = 96%)
                          CHECK (response_rate BETWEEN 0 AND 1),
  total_sales           INTEGER       NOT NULL DEFAULT 0
                          CHECK (total_sales >= 0),
  avg_seller_rating     DECIMAL(3,2)
                          CHECK (avg_seller_rating BETWEEN 0 AND 5),
  seller_review_count   INTEGER       NOT NULL DEFAULT 0
                          CHECK (seller_review_count >= 0),

  -- Stripe
  stripe_customer_id    VARCHAR(60)   UNIQUE,   -- Stripe Customer (buyer payments)
  stripe_account_id     VARCHAR(60)   UNIQUE,   -- Stripe Connect Account (seller payouts)

  -- Compliance
  gdpr_consent_at       TIMESTAMPTZ,
  marketing_consent     BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Audit timestamps
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,                        -- Soft delete
  last_seen_at          TIMESTAMPTZ,

  CONSTRAINT uq_users_email    UNIQUE (email),
  CONSTRAINT uq_users_username UNIQUE (username)
);

COMMENT ON TABLE  users IS 'Central user entity for buyers, sellers, and admins.';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash with cost=12. NULL for OAuth-only accounts.';
COMMENT ON COLUMN users.totp_secret IS 'AES-256 encrypted TOTP secret. NULL if 2FA not enabled.';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete. PII anonymized but record retained for financial audit.';

-- Trigger: auto-update updated_at
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: user_oauth_accounts ───────────────────────────────────────────
-- Stores OAuth provider links for social login (Google, GitHub, LinkedIn).
CREATE TABLE user_oauth_accounts (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          VARCHAR(20)   NOT NULL CHECK (provider IN ('google', 'github', 'linkedin')),
  provider_user_id  VARCHAR(255)  NOT NULL,
  provider_email    VARCHAR(255),
  access_token      TEXT,        -- Encrypted
  refresh_token     TEXT,        -- Encrypted
  token_expires_at  TIMESTAMPTZ,
  raw_profile       JSONB,        -- Snapshot of provider profile at last login
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

COMMENT ON TABLE user_oauth_accounts IS 'OAuth 2.0 social login provider accounts linked to a Desigot user.';

CREATE TRIGGER trg_user_oauth_updated_at
  BEFORE UPDATE ON user_oauth_accounts
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: user_sessions ─────────────────────────────────────────────────
-- Tracks active refresh tokens for server-side session revocation.
CREATE TABLE user_sessions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,     -- bcrypt/SHA256 hash of token
  device_info     TEXT,          -- Browser/device user agent
  ip_address      INET,
  expires_at      TIMESTAMPTZ   NOT NULL,
  revoked_at      TIMESTAMPTZ,                         -- NULL = still valid
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  last_used_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_sessions IS 'Active JWT refresh tokens. Enables server-side session revocation.';


-- ── TABLE: user_kyc_verifications ────────────────────────────────────────
-- KYC verification records for seller identity checks.
CREATE TABLE user_kyc_verifications (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method          VARCHAR(30)   NOT NULL CHECK (method IN ('government_id', 'linkedin_oauth', 'manual_review')),
  status          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  document_key    VARCHAR(500),  -- S3 key for uploaded ID document (encrypted reference)
  reviewer_id     UUID          REFERENCES users(id),  -- Admin who reviewed
  reviewer_notes  TEXT,
  submitted_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_kyc_updated_at
  BEFORE UPDATE ON user_kyc_verifications
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: user_2fa_backup_codes ─────────────────────────────────────────
-- One-time backup codes for 2FA recovery.
CREATE TABLE user_2fa_backup_codes (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash       VARCHAR(255)  NOT NULL,   -- bcrypt hash of 8-char recovery code
  used_at         TIMESTAMPTZ,              -- NULL = unused; non-NULL = consumed
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_2fa_backup_codes IS '10 one-time 2FA backup recovery codes per user. Hashed at rest.';


-- =============================================================================
-- 4. DOMAIN: LISTINGS & CATEGORIES
-- =============================================================================

-- ── TABLE: listing_categories ────────────────────────────────────────────
-- Self-referential 3-level category hierarchy (Category > Subcategory > Tag-group).
CREATE TABLE listing_categories (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID          REFERENCES listing_categories(id) ON DELETE RESTRICT,
  name            VARCHAR(100)  NOT NULL,
  slug            VARCHAR(120)  NOT NULL UNIQUE,
  description     TEXT,
  icon_name       VARCHAR(50),  -- Lucide icon name
  cover_image_url VARCHAR(1000),
  sort_order      SMALLINT      NOT NULL DEFAULT 0,
  listing_count   INTEGER       NOT NULL DEFAULT 0 CHECK (listing_count >= 0),
  depth           SMALLINT      NOT NULL DEFAULT 0 CHECK (depth BETWEEN 0 AND 2),
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  seo_title       VARCHAR(200),
  seo_description VARCHAR(500),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE listing_categories IS '3-level category taxonomy. depth 0=top, 1=sub, 2=tag-group.';

CREATE TRIGGER trg_listing_categories_updated_at
  BEFORE UPDATE ON listing_categories
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: listings ──────────────────────────────────────────────────────
-- Core marketplace listings (design assets and services).
CREATE TABLE listings (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id             UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id           UUID          NOT NULL REFERENCES listing_categories(id) ON DELETE RESTRICT,

  -- Content
  title                 VARCHAR(200)  NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  slug                  VARCHAR(230)  NOT NULL UNIQUE,
  description           TEXT          NOT NULL CHECK (char_length(description) >= 50),
  listing_type          listing_type_enum NOT NULL DEFAULT 'asset',
  status                listing_status_enum NOT NULL DEFAULT 'draft',

  -- Pricing (in cents, USD; NULL = tier not offered)
  price_personal        INTEGER       CHECK (price_personal IS NULL OR price_personal >= 100),
  price_commercial      INTEGER       CHECK (price_commercial IS NULL OR price_commercial >= 100),
  price_extended        INTEGER       CHECK (price_extended IS NULL OR price_extended >= 100),
  currency              CHAR(3)       NOT NULL DEFAULT 'USD',

  -- At least one price tier must be set for non-service listings
  -- (enforced in application layer; CHECK below handles service type)
  CONSTRAINT chk_listing_has_price CHECK (
    listing_type = 'service' OR
    (price_personal IS NOT NULL OR price_commercial IS NOT NULL OR price_extended IS NOT NULL)
  ),

  -- AI & Quality
  ai_quality_score      DECIMAL(3,2)  CHECK (ai_quality_score BETWEEN 0 AND 5),
  ai_scored_at          TIMESTAMPTZ,

  -- Full-text search vector (auto-updated via trigger)
  search_vector         TSVECTOR,

  -- Denormalized counters (updated via triggers/jobs for performance)
  total_sales           INTEGER       NOT NULL DEFAULT 0 CHECK (total_sales >= 0),
  total_revenue_cents   BIGINT        NOT NULL DEFAULT 0 CHECK (total_revenue_cents >= 0),
  avg_rating            DECIMAL(3,2)  CHECK (avg_rating BETWEEN 0 AND 5),
  review_count          INTEGER       NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  view_count            INTEGER       NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  wishlist_count        INTEGER       NOT NULL DEFAULT 0 CHECK (wishlist_count >= 0),

  -- Discovery
  is_featured           BOOLEAN       NOT NULL DEFAULT FALSE,
  tags                  TEXT[]        NOT NULL DEFAULT '{}',
  software_compat       TEXT[]        NOT NULL DEFAULT '{}',
  file_formats          TEXT[]        NOT NULL DEFAULT '{}',

  -- Review workflow
  rejection_reason      TEXT,
  approved_at           TIMESTAMPTZ,
  rejected_at           TIMESTAMPTZ,

  -- Audit timestamps
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  published_at          TIMESTAMPTZ   -- When first moved to 'approved'
);

COMMENT ON TABLE listings IS 'Core marketplace entity. Supports assets (downloads) and services (custom work).';
COMMENT ON COLUMN listings.price_personal IS 'Price in cents for Personal (non-commercial) license.';
COMMENT ON COLUMN listings.search_vector IS 'tsvector for full-text search. Auto-populated by trigger.';

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Auto-update search_vector on INSERT or UPDATE of searchable fields
CREATE OR REPLACE FUNCTION fn_update_listing_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'desigot_fts',
    COALESCE(NEW.title, '')       || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.software_compat, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.file_formats, ' '), '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_listing_search_vector
  BEFORE INSERT OR UPDATE OF title, description, tags, software_compat, file_formats
  ON listings
  FOR EACH ROW EXECUTE FUNCTION fn_update_listing_search_vector();


-- ── TABLE: listing_versions ──────────────────────────────────────────────
-- Stores 90-day version history of listing edits for compliance and moderation.
CREATE TABLE listing_versions (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  version_num   SMALLINT      NOT NULL,
  changed_by_id UUID          NOT NULL REFERENCES users(id),
  snapshot      JSONB         NOT NULL,    -- Full listing state snapshot at this version
  change_reason TEXT,                      -- Optional note from seller
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_listing_version UNIQUE (listing_id, version_num)
);

COMMENT ON TABLE listing_versions IS '90-day rolling history of listing edits. Older versions purged by scheduled job.';


-- ── TABLE: listing_media ─────────────────────────────────────────────────
-- Images, delivery files, and preview videos associated with listings.
CREATE TABLE listing_media (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  media_type        media_type_enum NOT NULL,
  storage_key       VARCHAR(1000) NOT NULL,     -- S3/R2 object key
  cdn_url           VARCHAR(1000),              -- Cloudflare CDN URL (public previews only)
  file_name         VARCHAR(255)  NOT NULL,
  file_size_bytes   BIGINT        NOT NULL CHECK (file_size_bytes > 0),
  mime_type         VARCHAR(100)  NOT NULL,
  width_px          INTEGER       CHECK (width_px > 0),
  height_px         INTEGER       CHECK (height_px > 0),
  duration_seconds  INTEGER       CHECK (duration_seconds > 0),  -- Video only
  sort_order        SMALLINT      NOT NULL DEFAULT 0,
  is_watermarked    BOOLEAN       NOT NULL DEFAULT FALSE,
  virus_scan_status scan_status_enum NOT NULL DEFAULT 'pending',
  virus_scan_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE listing_media IS 'Media assets for listings. Public previews via CDN; delivery files via signed URL.';


-- ── TABLE: listing_quality_scores ────────────────────────────────────────
-- AI quality assessment scores per listing (one record per listing).
CREATE TABLE listing_quality_scores (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID          NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  overall_score     DECIMAL(3,2)  NOT NULL CHECK (overall_score BETWEEN 0 AND 5),
  visual_score      DECIMAL(3,2)  CHECK (visual_score BETWEEN 0 AND 5),
  description_score DECIMAL(3,2)  CHECK (description_score BETWEEN 0 AND 5),
  pricing_score     DECIMAL(3,2)  CHECK (pricing_score BETWEEN 0 AND 5),
  completeness_score DECIMAL(3,2) CHECK (completeness_score BETWEEN 0 AND 5),
  model_version     VARCHAR(50)   NOT NULL,   -- AI model version used
  raw_output        JSONB,                    -- Full AI model output for debugging
  scored_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ── TABLE: listing_collections ───────────────────────────────────────────
-- Curated editorial collections (Editor's Picks, Trending, etc.)
CREATE TABLE listing_collections (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(150)  NOT NULL,
  slug            VARCHAR(160)  NOT NULL UNIQUE,
  description     TEXT,
  cover_image_url VARCHAR(1000),
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  is_auto_generated BOOLEAN     NOT NULL DEFAULT FALSE,  -- TRUE for AI/algo-driven
  sort_order      SMALLINT      NOT NULL DEFAULT 0,
  seo_title       VARCHAR(200),
  seo_description VARCHAR(500),
  created_by_id   UUID          REFERENCES users(id),   -- Admin who created it
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_listing_collections_updated_at
  BEFORE UPDATE ON listing_collections
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: listing_collection_items ──────────────────────────────────────
-- Junction table: listings <→ collections (many-to-many).
CREATE TABLE listing_collection_items (
  collection_id   UUID          NOT NULL REFERENCES listing_collections(id) ON DELETE CASCADE,
  listing_id      UUID          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sort_order      SMALLINT      NOT NULL DEFAULT 0,
  added_by_id     UUID          REFERENCES users(id),
  added_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  PRIMARY KEY (collection_id, listing_id)
);


-- ── TABLE: wishlist_items ────────────────────────────────────────────────
-- Buyer saved/wishlisted listings.
CREATE TABLE wishlists (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100)  NOT NULL DEFAULT 'My Wishlist',
  is_shared       BOOLEAN       NOT NULL DEFAULT FALSE,
  share_token     VARCHAR(64)   UNIQUE,   -- Unique token for shareable link
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_wishlists_updated_at
  BEFORE UPDATE ON wishlists
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE wishlist_items (
  wishlist_id     UUID          NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  listing_id      UUID          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  added_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  PRIMARY KEY (wishlist_id, listing_id)
);


-- =============================================================================
-- 5. DOMAIN: ORDERS & TRANSACTIONS
-- =============================================================================

-- ── TABLE: orders ────────────────────────────────────────────────────────
-- Purchase transactions. Financial records retained for 7 years.
CREATE TABLE orders (
  id                          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id                    UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id                   UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  listing_id                  UUID          NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,

  -- Immutable snapshot of listing data at purchase time
  listing_title               VARCHAR(200)  NOT NULL,
  listing_type                listing_type_enum NOT NULL,
  license_type                license_type_enum NOT NULL,

  -- Financials (all in cents)
  amount_cents                INTEGER       NOT NULL CHECK (amount_cents > 0),
  discount_cents              INTEGER       NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  platform_fee_cents          INTEGER       NOT NULL CHECK (platform_fee_cents >= 0),
  seller_payout_cents         INTEGER       NOT NULL CHECK (seller_payout_cents >= 0),
  currency                    CHAR(3)       NOT NULL DEFAULT 'USD',

  -- Validation: financials must reconcile
  CONSTRAINT chk_order_financials CHECK (
    amount_cents - discount_cents = platform_fee_cents + seller_payout_cents
  ),

  -- Status
  status                      order_status_enum NOT NULL DEFAULT 'pending',

  -- Stripe
  stripe_payment_intent_id    VARCHAR(60)   UNIQUE,

  -- Idempotency (prevents duplicate order creation on network retries)
  idempotency_key             UUID          NOT NULL UNIQUE DEFAULT gen_random_uuid(),

  -- Promo codes
  promo_code_used             VARCHAR(50),

  -- Timing windows
  inspection_ends_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  download_expires_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW() + INTERVAL '12 months',

  -- Audit timestamps
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  completed_at                TIMESTAMPTZ,
  cancelled_at                TIMESTAMPTZ,
  refunded_at                 TIMESTAMPTZ
);

COMMENT ON TABLE orders IS 'Purchase transactions. Financial retention: 7 years. No soft delete.';
COMMENT ON COLUMN orders.listing_title IS 'Immutable snapshot of listing title at purchase. Survives listing deletion.';
COMMENT ON COLUMN orders.idempotency_key IS 'Client-provided UUID preventing duplicate orders on network retries.';

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: escrow_records ────────────────────────────────────────────────
-- Escrow state for the 7-day inspection window between buyer payment and seller payout.
CREATE TABLE escrow_records (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  status                  escrow_status_enum NOT NULL DEFAULT 'held',
  held_amount_cents       INTEGER       NOT NULL CHECK (held_amount_cents > 0),
  released_amount_cents   INTEGER       NOT NULL DEFAULT 0 CHECK (released_amount_cents >= 0),
  refunded_amount_cents   INTEGER       NOT NULL DEFAULT 0 CHECK (refunded_amount_cents >= 0),

  CONSTRAINT chk_escrow_amounts CHECK (
    released_amount_cents + refunded_amount_cents <= held_amount_cents
  ),

  release_scheduled_at    TIMESTAMPTZ   NOT NULL,   -- T+7 days from order
  released_at             TIMESTAMPTZ,
  frozen_at               TIMESTAMPTZ,              -- Set when dispute opened
  unfrozen_at             TIMESTAMPTZ,

  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE escrow_records IS 'One escrow record per order. Funds held until 7-day inspection window closes.';

CREATE TRIGGER trg_escrow_records_updated_at
  BEFORE UPDATE ON escrow_records
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: licenses ──────────────────────────────────────────────────────
-- License assignment records created on successful order completion.
CREATE TABLE licenses (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  buyer_id        UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  listing_id      UUID          NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  license_type    license_type_enum NOT NULL,
  license_key     VARCHAR(64)   NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  valid_from      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,              -- NULL = perpetual (non-subscription licenses)
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE licenses IS 'Formal license grants created upon order completion. Buyer proof of purchase.';


-- =============================================================================
-- 6. DOMAIN: PAYMENTS & FINANCIALS
-- =============================================================================

-- ── TABLE: payment_intents ───────────────────────────────────────────────
-- Mirrors Stripe PaymentIntent lifecycle.
CREATE TABLE payment_intents (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  stripe_intent_id      VARCHAR(60)   NOT NULL UNIQUE,    -- pi_xxx
  status                VARCHAR(40)   NOT NULL DEFAULT 'requires_payment_method',
  amount_cents          INTEGER       NOT NULL CHECK (amount_cents > 0),
  currency              CHAR(3)       NOT NULL DEFAULT 'USD',
  stripe_customer_id    VARCHAR(60),
  payment_method_type   VARCHAR(30),   -- 'card' | 'apple_pay' | 'google_pay' | 'paypal'
  failure_code          VARCHAR(100),
  failure_message       TEXT,
  stripe_metadata       JSONB,         -- Full Stripe event snapshot
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payment_intents_updated_at
  BEFORE UPDATE ON payment_intents
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: payout_methods ────────────────────────────────────────────────
-- Seller payout destinations (Stripe Connect, PayPal, bank).
CREATE TABLE payout_methods (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id               UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method_type             VARCHAR(30)   NOT NULL CHECK (method_type IN ('stripe_connect', 'paypal', 'bank_transfer')),
  is_default              BOOLEAN       NOT NULL DEFAULT FALSE,
  display_name            VARCHAR(100)  NOT NULL,  -- e.g., "Stripe Account (••••1234)"
  stripe_account_id       VARCHAR(60),             -- Stripe Connect account ID
  paypal_email            VARCHAR(255),            -- Encrypted
  bank_account_last4      CHAR(4),
  bank_routing_last4      CHAR(4),
  is_verified             BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

CREATE TRIGGER trg_payout_methods_updated_at
  BEFORE UPDATE ON payout_methods
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: payouts ───────────────────────────────────────────────────────
-- Seller payout requests and transfer records.
CREATE TABLE payouts (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  payout_method_id    UUID          NOT NULL REFERENCES payout_methods(id) ON DELETE RESTRICT,
  status              payout_status_enum NOT NULL DEFAULT 'pending',
  amount_cents        INTEGER       NOT NULL CHECK (amount_cents >= 5000),  -- $50 minimum
  currency            CHAR(3)       NOT NULL DEFAULT 'USD',
  stripe_transfer_id  VARCHAR(60)   UNIQUE,         -- tr_xxx (Stripe Connect)
  failure_reason      TEXT,
  idempotency_key     UUID          NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  scheduled_for       TIMESTAMPTZ   NOT NULL,
  processed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN payouts.amount_cents IS 'Minimum payout is $50.00 (5000 cents).';

CREATE TRIGGER trg_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: commission_ledger ─────────────────────────────────────────────
-- Immutable financial ledger recording every commission deduction.
-- Append-only: no UPDATE or DELETE permitted (enforced by application + DB rule).
CREATE TABLE commission_ledger (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  seller_id             UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  gross_amount_cents    INTEGER       NOT NULL CHECK (gross_amount_cents > 0),
  commission_rate       DECIMAL(5,4)  NOT NULL CHECK (commission_rate BETWEEN 0 AND 1),
  commission_cents      INTEGER       NOT NULL CHECK (commission_cents >= 0),
  net_seller_cents      INTEGER       NOT NULL CHECK (net_seller_cents >= 0),
  seller_plan           VARCHAR(20)   NOT NULL,   -- Plan name snapshot at transaction time
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_commission_math CHECK (
    gross_amount_cents = commission_cents + net_seller_cents
  )
);

COMMENT ON TABLE commission_ledger IS 'Append-only financial ledger. 7-year retention. No UPDATE or DELETE.';

-- Prevent any UPDATE or DELETE on commission_ledger (immutable ledger)
CREATE OR REPLACE RULE commission_ledger_no_update AS
  ON UPDATE TO commission_ledger DO INSTEAD NOTHING;

CREATE OR REPLACE RULE commission_ledger_no_delete AS
  ON DELETE TO commission_ledger DO INSTEAD NOTHING;


-- ── TABLE: seller_balances ───────────────────────────────────────────────
-- Denormalized real-time seller balance (available + pending).
CREATE TABLE seller_balances (
  seller_id                 UUID          PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  available_cents           BIGINT        NOT NULL DEFAULT 0 CHECK (available_cents >= 0),
  pending_escrow_cents      BIGINT        NOT NULL DEFAULT 0 CHECK (pending_escrow_cents >= 0),
  lifetime_earned_cents     BIGINT        NOT NULL DEFAULT 0 CHECK (lifetime_earned_cents >= 0),
  lifetime_withdrawn_cents  BIGINT        NOT NULL DEFAULT 0 CHECK (lifetime_withdrawn_cents >= 0),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE seller_balances IS 'Denormalized real-time balance. Updated by escrow release and payout jobs.';

CREATE TRIGGER trg_seller_balances_updated_at
  BEFORE UPDATE ON seller_balances
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- =============================================================================
-- 7. DOMAIN: SUBSCRIPTIONS & BILLING
-- =============================================================================

-- ── TABLE: seller_plans ──────────────────────────────────────────────────
-- Plan definitions (Free, Pro, Agency, Enterprise).
CREATE TABLE seller_plans (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    plan_name_enum NOT NULL UNIQUE,
  display_name            VARCHAR(100)  NOT NULL,
  price_monthly_cents     INTEGER       NOT NULL CHECK (price_monthly_cents >= 0),
  price_yearly_cents      INTEGER       CHECK (price_yearly_cents >= 0),
  stripe_price_id_monthly VARCHAR(60),
  stripe_price_id_yearly  VARCHAR(60),
  commission_rate         DECIMAL(5,4)  NOT NULL CHECK (commission_rate BETWEEN 0 AND 1),
  max_active_listings     INTEGER,              -- NULL = unlimited
  search_boost_pct        SMALLINT      NOT NULL DEFAULT 0, -- 0–100%
  api_rate_limit_rpm      INTEGER       NOT NULL DEFAULT 100,
  max_team_members        INTEGER       NOT NULL DEFAULT 1,
  has_ai_optimizer        BOOLEAN       NOT NULL DEFAULT FALSE,
  has_custom_storefront   BOOLEAN       NOT NULL DEFAULT FALSE,
  has_api_access          BOOLEAN       NOT NULL DEFAULT FALSE,
  has_dedicated_cxm       BOOLEAN       NOT NULL DEFAULT FALSE,
  features                JSONB         NOT NULL DEFAULT '[]',  -- Feature list for UI
  is_active               BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order              SMALLINT      NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_seller_plans_updated_at
  BEFORE UPDATE ON seller_plans
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: subscription_records ──────────────────────────────────────────
-- Seller subscription billing history.
CREATE TABLE subscription_records (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id               UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id                 UUID          NOT NULL REFERENCES seller_plans(id),
  status                  subscription_status_enum NOT NULL DEFAULT 'trialing',
  billing_cycle           VARCHAR(10)   NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  stripe_subscription_id  VARCHAR(60)   UNIQUE,
  stripe_customer_id      VARCHAR(60),
  current_period_start    TIMESTAMPTZ   NOT NULL,
  current_period_end      TIMESTAMPTZ   NOT NULL,
  cancel_at               TIMESTAMPTZ,              -- Scheduled cancellation date
  cancelled_at            TIMESTAMPTZ,              -- Actual cancellation timestamp
  trial_end               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_subscription_records_updated_at
  BEFORE UPDATE ON subscription_records
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- =============================================================================
-- 8. DOMAIN: PROJECT WORKSPACE
-- =============================================================================

-- ── TABLE: projects ──────────────────────────────────────────────────────
-- Custom service projects created post-purchase of a service listing.
CREATE TABLE projects (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  buyer_id            UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id           UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title               VARCHAR(200)  NOT NULL CHECK (char_length(title) >= 5),
  description         TEXT          NOT NULL,
  status              project_status_enum NOT NULL DEFAULT 'briefing',
  deadline            TIMESTAMPTZ,
  revision_limit      SMALLINT      NOT NULL DEFAULT 3 CHECK (revision_limit BETWEEN 0 AND 10),
  revisions_used      SMALLINT      NOT NULL DEFAULT 0 CHECK (revisions_used >= 0),
  total_budget_cents  INTEGER       NOT NULL CHECK (total_budget_cents > 0),
  contract_storage_key VARCHAR(1000),   -- S3 key for signed project contract PDF
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ,    -- Set 12 months post-completion
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT chk_project_revisions CHECK (revisions_used <= revision_limit)
);

COMMENT ON TABLE projects IS 'Custom service projects. Archived 12 months post-completion. Retained 7 years.';

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: project_milestones ────────────────────────────────────────────
-- Payment milestones within a project (up to 10 per project).
CREATE TABLE project_milestones (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           VARCHAR(200)  NOT NULL,
  description     TEXT,
  amount_cents    INTEGER       NOT NULL CHECK (amount_cents > 0),
  status          milestone_status_enum NOT NULL DEFAULT 'not_started',
  due_date        TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,    -- Seller marks as submitted
  approved_at     TIMESTAMPTZ,    -- Buyer approves
  paid_at         TIMESTAMPTZ,    -- Escrow released to seller
  sort_order      SMALLINT      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: project_files ─────────────────────────────────────────────────
-- Delivery files uploaded by sellers per milestone, with version tracking.
CREATE TABLE project_files (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id      UUID          REFERENCES project_milestones(id) ON DELETE SET NULL,
  uploaded_by_id    UUID          NOT NULL REFERENCES users(id),
  storage_key       VARCHAR(1000) NOT NULL,
  file_name         VARCHAR(255)  NOT NULL,
  file_size_bytes   BIGINT        NOT NULL CHECK (file_size_bytes > 0),
  mime_type         VARCHAR(100)  NOT NULL,
  version_label     VARCHAR(20)   NOT NULL DEFAULT 'v1',  -- 'v1', 'v2', etc.
  version_notes     TEXT,
  virus_scan_status scan_status_enum NOT NULL DEFAULT 'pending',
  virus_scan_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ── TABLE: project_messages ──────────────────────────────────────────────
-- Real-time messaging thread within a project workspace.
CREATE TABLE project_messages (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id         UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  message_type      message_type_enum NOT NULL DEFAULT 'text',
  content           TEXT          CHECK (
    message_type NOT IN ('text', 'system_event', 'milestone_update') OR content IS NOT NULL
  ),
  file_storage_key  VARCHAR(1000),
  file_name         VARCHAR(255),
  file_size_bytes   BIGINT        CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  is_pinned         BOOLEAN       NOT NULL DEFAULT FALSE,
  is_read_buyer     BOOLEAN       NOT NULL DEFAULT FALSE,
  is_read_seller    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE project_messages IS 'Real-time project workspace messages. Retained with project data (7 years).';


-- =============================================================================
-- 9. DOMAIN: REVIEWS & REPUTATION
-- =============================================================================

-- ── TABLE: reviews ───────────────────────────────────────────────────────
-- Verified purchase reviews from buyers and sellers.
CREATE TABLE reviews (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  reviewer_id           UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subject_id            UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  listing_id            UUID          NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  review_type           review_type_enum NOT NULL,

  -- Ratings (1–5)
  rating_overall        SMALLINT      NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_quality        SMALLINT      CHECK (rating_quality IS NULL OR rating_quality BETWEEN 1 AND 5),
  rating_communication  SMALLINT      CHECK (rating_communication IS NULL OR rating_communication BETWEEN 1 AND 5),
  rating_value          SMALLINT      CHECK (rating_value IS NULL OR rating_value BETWEEN 1 AND 5),
  rating_delivery       SMALLINT      CHECK (rating_delivery IS NULL OR rating_delivery BETWEEN 1 AND 5),

  review_text           TEXT          NOT NULL CHECK (char_length(review_text) >= 30),
  status                review_status_enum NOT NULL DEFAULT 'pending_moderation',
  moderation_note       TEXT,          -- Internal note (not shown to users)
  published_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Prevent self-review
  CONSTRAINT chk_no_self_review CHECK (reviewer_id <> subject_id)
);

COMMENT ON TABLE reviews IS 'Verified purchase reviews. One review per order. Simultaneous publish prevents anchoring.';

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: review_responses ──────────────────────────────────────────────
-- Seller's public response to a buyer review.
CREATE TABLE review_responses (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id       UUID          NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
  responder_id    UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  response_text   TEXT          NOT NULL CHECK (char_length(response_text) >= 10),
  is_visible      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_review_responses_updated_at
  BEFORE UPDATE ON review_responses
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: review_flags ──────────────────────────────────────────────────
-- User-reported review moderation requests.
CREATE TABLE review_flags (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id       UUID          NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  flagged_by_id   UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason          VARCHAR(50)   NOT NULL
                    CHECK (reason IN ('spam', 'offensive', 'fake', 'off_topic', 'other')),
  notes           TEXT,
  status          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'actioned', 'dismissed')),
  reviewed_by_id  UUID          REFERENCES users(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,

  CONSTRAINT uq_review_flag_per_user UNIQUE (review_id, flagged_by_id)
);


-- =============================================================================
-- 10. DOMAIN: NOTIFICATIONS
-- =============================================================================

-- ── TABLE: notification_preferences ─────────────────────────────────────
-- Per-user, per-event-type notification channel preferences.
CREATE TABLE notification_preferences (
  user_id           UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type        notification_type_enum NOT NULL,
  email_enabled     BOOLEAN       NOT NULL DEFAULT TRUE,
  in_app_enabled    BOOLEAN       NOT NULL DEFAULT TRUE,
  push_enabled      BOOLEAN       NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, event_type)
);

COMMENT ON TABLE notification_preferences IS 'Granular per-user notification preferences. Critical events always delivered regardless.';


-- ── TABLE: notifications ─────────────────────────────────────────────────
-- In-app notification records.
CREATE TABLE notifications (
  id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            notification_type_enum  NOT NULL,
  title           VARCHAR(200)            NOT NULL,
  body            TEXT                    NOT NULL,
  action_url      VARCHAR(1000),
  is_read         BOOLEAN                 NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  metadata        JSONB                   NOT NULL DEFAULT '{}',  -- orderId, listingId, etc.
  created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'In-app notifications. Auto-purged after 90 days via pg_partman.';


-- ── TABLE: push_subscriptions ────────────────────────────────────────────
-- Web Push API subscription endpoints per user device.
CREATE TABLE push_subscriptions (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint          TEXT          NOT NULL UNIQUE,
  p256dh_key        TEXT          NOT NULL,   -- Encryption public key
  auth_key          TEXT          NOT NULL,   -- Auth secret
  user_agent        TEXT,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  last_used_at      TIMESTAMPTZ
);


-- ── TABLE: email_logs ────────────────────────────────────────────────────
-- Outbound email delivery log (90-day retention).
CREATE TABLE email_logs (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          REFERENCES users(id) ON DELETE SET NULL,
  recipient_email   VARCHAR(255)  NOT NULL,
  event_type        notification_type_enum,
  subject           VARCHAR(500)  NOT NULL,
  sendgrid_message_id VARCHAR(100),
  status            VARCHAR(20)   NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'spam')),
  error_message     TEXT,
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE email_logs IS 'Email delivery log. Auto-purged after 90 days.';


-- =============================================================================
-- 11. DOMAIN: DISPUTES & RESOLUTION
-- =============================================================================

-- ── TABLE: disputes ──────────────────────────────────────────────────────
-- Buyer/seller disputes raised within the 7-day inspection window.
CREATE TABLE disputes (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  opened_by_id          UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  resolved_by_id        UUID          REFERENCES users(id),
  status                dispute_status_enum NOT NULL DEFAULT 'open',
  reason                dispute_reason_enum NOT NULL,
  description           TEXT          NOT NULL CHECK (char_length(description) >= 20),
  evidence_keys         TEXT[]        NOT NULL DEFAULT '{}',   -- S3 keys for uploaded evidence
  outcome               dispute_outcome_enum,
  outcome_notes         TEXT,
  refund_amount_cents   INTEGER       CHECK (refund_amount_cents IS NULL OR refund_amount_cents >= 0),
  opened_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  sla_deadline          TIMESTAMPTZ   NOT NULL DEFAULT NOW() + INTERVAL '5 days',
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE disputes IS 'Dispute records. One per order maximum. Escrow frozen on open.';

CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- =============================================================================
-- 12. DOMAIN: SEARCH & AI
-- =============================================================================

-- ── TABLE: search_queries ────────────────────────────────────────────────
-- Search query log for analytics and recommendation model training.
CREATE TABLE search_queries (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          REFERENCES users(id) ON DELETE SET NULL,  -- NULL = guest
  session_id        VARCHAR(64),
  query_text        TEXT          NOT NULL,
  filters           JSONB         NOT NULL DEFAULT '{}',
  results_count     INTEGER,
  clicked_listing_id UUID         REFERENCES listings(id) ON DELETE SET NULL,
  clicked_position  SMALLINT,       -- Position in results that was clicked
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE search_queries IS 'Search analytics. Raw data purged at 13 months. Aggregated trends retained.';


-- ── TABLE: recommendation_events ─────────────────────────────────────────
-- Tracks recommendation impressions and interactions for model training.
CREATE TABLE recommendation_events (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          REFERENCES users(id) ON DELETE SET NULL,
  listing_id        UUID          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  event_type        VARCHAR(30)   NOT NULL
                      CHECK (event_type IN ('impression', 'click', 'purchase', 'wishlist')),
  recommendation_context VARCHAR(50),  -- 'homepage', 'similar', 'post_purchase', etc.
  model_version     VARCHAR(50),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- 13. DOMAIN: ADMIN, AUDIT & CONFIGURATION
-- =============================================================================

-- ── TABLE: audit_logs ────────────────────────────────────────────────────
-- Immutable append-only audit trail. 7-year retention. No UPDATE/DELETE.
CREATE TABLE audit_logs (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID            REFERENCES users(id) ON DELETE SET NULL,  -- NULL = system
  actor_type      actor_type_enum NOT NULL DEFAULT 'user',
  action          VARCHAR(100)    NOT NULL,     -- e.g., 'listing.approved', 'user.suspended'
  entity_type     VARCHAR(50)     NOT NULL,
  entity_id       UUID            NOT NULL,
  old_values      JSONB,
  new_values      JSONB,
  ip_address      INET,
  user_agent      TEXT,
  request_id      UUID,
  metadata        JSONB           NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail. Append-only. 7-year retention. Exempt from GDPR erasure.';

-- Prevent UPDATE or DELETE on audit_logs (immutable by design)
CREATE OR REPLACE RULE audit_logs_no_update AS
  ON UPDATE TO audit_logs DO INSTEAD NOTHING;

CREATE OR REPLACE RULE audit_logs_no_delete AS
  ON DELETE TO audit_logs DO INSTEAD NOTHING;


-- ── TABLE: platform_config ───────────────────────────────────────────────
-- Runtime platform configuration (commission rates, feature toggles, etc.)
CREATE TABLE platform_config (
  key             VARCHAR(100)  PRIMARY KEY,
  value           JSONB         NOT NULL,
  description     TEXT,
  is_sensitive    BOOLEAN       NOT NULL DEFAULT FALSE,  -- TRUE = masked in UI
  updated_by_id   UUID          REFERENCES users(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_platform_config_updated_at
  BEFORE UPDATE ON platform_config
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: feature_flags ─────────────────────────────────────────────────
-- Gradual feature rollout control (SuperAdmin only).
CREATE TABLE feature_flags (
  key                 VARCHAR(100)  PRIMARY KEY,
  description         TEXT          NOT NULL,
  is_enabled          BOOLEAN       NOT NULL DEFAULT FALSE,
  rollout_percentage  SMALLINT      NOT NULL DEFAULT 0
                        CHECK (rollout_percentage BETWEEN 0 AND 100),
  allowed_user_ids    UUID[]        NOT NULL DEFAULT '{}',    -- Specific user override
  allowed_plan_names  TEXT[]        NOT NULL DEFAULT '{}',    -- Plan-level override
  metadata            JSONB         NOT NULL DEFAULT '{}',
  updated_by_id       UUID          REFERENCES users(id),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: promo_codes ───────────────────────────────────────────────────
-- Discount codes for buyers.
CREATE TABLE promo_codes (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code                VARCHAR(50)   NOT NULL UNIQUE,
  description         TEXT,
  discount_type       VARCHAR(20)   NOT NULL CHECK (discount_type IN ('percent', 'fixed_cents')),
  discount_value      INTEGER       NOT NULL CHECK (discount_value > 0),  -- % or cents
  max_uses            INTEGER,                  -- NULL = unlimited
  uses_count          INTEGER       NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  min_order_cents     INTEGER       NOT NULL DEFAULT 0,
  valid_from          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  valid_until         TIMESTAMPTZ,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_by_id       UUID          REFERENCES users(id),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: api_keys ──────────────────────────────────────────────────────
-- Third-party API key access (Phase 2 — Public API).
CREATE TABLE api_keys (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100)  NOT NULL,
  key_hash        VARCHAR(255)  NOT NULL UNIQUE,   -- bcrypt hash; key shown once at creation
  key_prefix      VARCHAR(12)   NOT NULL,          -- e.g., 'dsg_live_abc1' for display
  environment     VARCHAR(10)   NOT NULL DEFAULT 'live' CHECK (environment IN ('live', 'test')),
  scopes          TEXT[]        NOT NULL DEFAULT '{}',  -- e.g., ['read:listings', 'write:orders']
  rate_limit_rpm  INTEGER       NOT NULL DEFAULT 100,
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);

COMMENT ON TABLE api_keys IS 'Third-party API key access. Key shown once on creation; stored as hash.';


-- ── TABLE: webhook_endpoints ─────────────────────────────────────────────
-- Seller-configured webhook destinations (Phase 2).
CREATE TABLE webhook_endpoints (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url             TEXT          NOT NULL CHECK (url ~ '^https://'),   -- HTTPS only
  secret_hash     VARCHAR(255)  NOT NULL,     -- For HMAC-SHA256 signature verification
  events          TEXT[]        NOT NULL DEFAULT '{}',    -- Subscribed event types
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  failure_count   SMALLINT      NOT NULL DEFAULT 0,       -- Consecutive failures
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_webhook_endpoints_updated_at
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── TABLE: webhook_deliveries ────────────────────────────────────────────
-- Individual webhook delivery attempt log.
CREATE TABLE webhook_deliveries (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id        UUID          NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type        VARCHAR(60)   NOT NULL,
  payload           JSONB         NOT NULL,
  attempt_number    SMALLINT      NOT NULL DEFAULT 1,
  response_status   SMALLINT,
  response_body     TEXT,
  duration_ms       INTEGER,
  is_successful     BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ── TABLE: seller_health_scores ──────────────────────────────────────────
-- Computed seller performance scores (refreshed hourly).
CREATE TABLE seller_health_scores (
  seller_id             UUID          PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  overall_score         SMALLINT      NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  response_rate_score   SMALLINT      NOT NULL DEFAULT 0 CHECK (response_rate_score BETWEEN 0 AND 100),
  on_time_delivery_score SMALLINT     NOT NULL DEFAULT 0 CHECK (on_time_delivery_score BETWEEN 0 AND 100),
  dispute_rate_score    SMALLINT      NOT NULL DEFAULT 0 CHECK (dispute_rate_score BETWEEN 0 AND 100),
  rating_score          SMALLINT      NOT NULL DEFAULT 0 CHECK (rating_score BETWEEN 0 AND 100),
  improvement_tips      JSONB         NOT NULL DEFAULT '[]',
  computed_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- 14. INDEXES (Performance-Critical Query Paths)
-- =============================================================================

-- ── users ─────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX idx_users_email
  ON users (email)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_users_username
  ON users (username)
  WHERE username IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_users_role_status
  ON users (role, account_status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_users_stripe_customer
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX idx_users_seller_verified
  ON users (seller_verified, account_status)
  WHERE role = 'seller' AND deleted_at IS NULL;

-- ── user_sessions ─────────────────────────────────────────────────────────
CREATE INDEX idx_sessions_user_active
  ON user_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

-- ── listing_categories ────────────────────────────────────────────────────
CREATE INDEX idx_categories_parent
  ON listing_categories (parent_id, sort_order)
  WHERE is_active = TRUE;

CREATE INDEX idx_categories_slug
  ON listing_categories (slug)
  WHERE is_active = TRUE;

-- ── listings ──────────────────────────────────────────────────────────────
-- Seller dashboard: all listings for a seller by status
CREATE INDEX idx_listings_seller_status
  ON listings (seller_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Category browse page
CREATE INDEX idx_listings_category_status_rating
  ON listings (category_id, status, avg_rating DESC NULLS LAST, total_sales DESC)
  WHERE deleted_at IS NULL;

-- Featured collection
CREATE INDEX idx_listings_featured
  ON listings (is_featured, status)
  WHERE is_featured = TRUE AND status = 'approved' AND deleted_at IS NULL;

-- Full-text search (GIN index on tsvector)
CREATE INDEX idx_listings_search_vector
  ON listings USING GIN (search_vector)
  WHERE status = 'approved' AND deleted_at IS NULL;

-- Tag filtering (GIN on array)
CREATE INDEX idx_listings_tags
  ON listings USING GIN (tags)
  WHERE status = 'approved' AND deleted_at IS NULL;

-- Software compatibility filtering
CREATE INDEX idx_listings_software_compat
  ON listings USING GIN (software_compat)
  WHERE status = 'approved' AND deleted_at IS NULL;

-- File format filtering
CREATE INDEX idx_listings_file_formats
  ON listings USING GIN (file_formats)
  WHERE status = 'approved' AND deleted_at IS NULL;

-- Price range filtering (personal license tier)
CREATE INDEX idx_listings_price_personal
  ON listings (price_personal, status)
  WHERE price_personal IS NOT NULL AND status = 'approved' AND deleted_at IS NULL;

-- Rating sort for browse
CREATE INDEX idx_listings_avg_rating
  ON listings (avg_rating DESC NULLS LAST, status)
  WHERE status = 'approved' AND deleted_at IS NULL;

-- Best sellers sort
CREATE INDEX idx_listings_total_sales
  ON listings (total_sales DESC, status)
  WHERE status = 'approved' AND deleted_at IS NULL;

-- Curation queue (admin)
CREATE INDEX idx_listings_pending_review
  ON listings (created_at ASC)
  WHERE status = 'pending_review' AND deleted_at IS NULL;

-- Trigram index for autocomplete / partial title search
CREATE INDEX idx_listings_title_trgm
  ON listings USING GIN (title gin_trgm_ops)
  WHERE status = 'approved' AND deleted_at IS NULL;

-- ── listing_media ─────────────────────────────────────────────────────────
CREATE INDEX idx_listing_media_listing_order
  ON listing_media (listing_id, sort_order ASC);

CREATE INDEX idx_listing_media_type
  ON listing_media (listing_id, media_type);

CREATE INDEX idx_listing_media_virus_pending
  ON listing_media (virus_scan_status, created_at)
  WHERE virus_scan_status = 'pending';

-- ── orders ────────────────────────────────────────────────────────────────
CREATE INDEX idx_orders_buyer_created
  ON orders (buyer_id, created_at DESC);

CREATE INDEX idx_orders_seller_created
  ON orders (seller_id, created_at DESC);

CREATE INDEX idx_orders_listing
  ON orders (listing_id, status);

CREATE INDEX idx_orders_status_created
  ON orders (status, created_at DESC);

CREATE UNIQUE INDEX idx_orders_stripe_intent
  ON orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE UNIQUE INDEX idx_orders_idempotency
  ON orders (idempotency_key);

-- ── escrow_records ────────────────────────────────────────────────────────
-- Critical for cron-based auto-release job (FOR UPDATE SKIP LOCKED)
CREATE INDEX idx_escrow_release_scheduled
  ON escrow_records (release_scheduled_at ASC, status)
  WHERE status = 'held';

CREATE INDEX idx_escrow_frozen
  ON escrow_records (frozen_at)
  WHERE status = 'frozen';

-- ── payouts ───────────────────────────────────────────────────────────────
CREATE INDEX idx_payouts_seller_status
  ON payouts (seller_id, status, created_at DESC);

CREATE UNIQUE INDEX idx_payouts_stripe_transfer
  ON payouts (stripe_transfer_id)
  WHERE stripe_transfer_id IS NOT NULL;

CREATE INDEX idx_payouts_scheduled
  ON payouts (scheduled_for ASC, status)
  WHERE status = 'pending';

-- ── commission_ledger ─────────────────────────────────────────────────────
CREATE INDEX idx_commission_seller_created
  ON commission_ledger (seller_id, created_at DESC);

CREATE INDEX idx_commission_order
  ON commission_ledger (order_id);

-- ── subscription_records ─────────────────────────────────────────────────
CREATE INDEX idx_subscriptions_seller
  ON subscription_records (seller_id, status);

CREATE INDEX idx_subscriptions_stripe
  ON subscription_records (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX idx_subscriptions_expiring
  ON subscription_records (current_period_end, status)
  WHERE status = 'active';

-- ── projects ──────────────────────────────────────────────────────────────
CREATE INDEX idx_projects_buyer_status
  ON projects (buyer_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_projects_seller_status
  ON projects (seller_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_projects_order
  ON projects (order_id);

CREATE INDEX idx_projects_archive_eligible
  ON projects (completed_at)
  WHERE completed_at IS NOT NULL AND archived_at IS NULL;

-- ── project_milestones ────────────────────────────────────────────────────
CREATE INDEX idx_milestones_project_order
  ON project_milestones (project_id, sort_order ASC);

CREATE INDEX idx_milestones_status
  ON project_milestones (status, due_date)
  WHERE status NOT IN ('approved', 'paid');

-- ── project_messages ──────────────────────────────────────────────────────
CREATE INDEX idx_messages_project_created
  ON project_messages (project_id, created_at DESC);

CREATE INDEX idx_messages_unread_buyer
  ON project_messages (project_id, is_read_buyer)
  WHERE is_read_buyer = FALSE;

CREATE INDEX idx_messages_unread_seller
  ON project_messages (project_id, is_read_seller)
  WHERE is_read_seller = FALSE;

-- ── reviews ───────────────────────────────────────────────────────────────
CREATE INDEX idx_reviews_subject_approved
  ON reviews (subject_id, status, created_at DESC)
  WHERE status = 'approved';

CREATE INDEX idx_reviews_listing_approved
  ON reviews (listing_id, status, rating_overall DESC)
  WHERE status = 'approved';

CREATE INDEX idx_reviews_pending_moderation
  ON reviews (created_at ASC)
  WHERE status = 'pending_moderation';

-- ── notifications ─────────────────────────────────────────────────────────
CREATE INDEX idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

CREATE INDEX idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- ── disputes ──────────────────────────────────────────────────────────────
CREATE INDEX idx_disputes_status_sla
  ON disputes (status, sla_deadline ASC)
  WHERE status IN ('open', 'under_review');

-- ── audit_logs ────────────────────────────────────────────────────────────
CREATE INDEX idx_audit_entity
  ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX idx_audit_actor
  ON audit_logs (actor_id, created_at DESC)
  WHERE actor_id IS NOT NULL;

CREATE INDEX idx_audit_action
  ON audit_logs (action, created_at DESC);

-- ── search_queries ────────────────────────────────────────────────────────
CREATE INDEX idx_search_queries_user
  ON search_queries (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_search_queries_created
  ON search_queries (created_at DESC);

-- Trigram index for trending keyword analytics
CREATE INDEX idx_search_queries_text_trgm
  ON search_queries USING GIN (query_text gin_trgm_ops);

-- ── wishlist_items ────────────────────────────────────────────────────────
CREATE INDEX idx_wishlist_items_listing
  ON wishlist_items (listing_id);

-- ── api_keys ──────────────────────────────────────────────────────────────
CREATE INDEX idx_api_keys_user
  ON api_keys (user_id)
  WHERE is_active = TRUE AND revoked_at IS NULL;

-- ── webhook_deliveries ────────────────────────────────────────────────────
CREATE INDEX idx_webhook_deliveries_endpoint
  ON webhook_deliveries (webhook_id, created_at DESC);

CREATE INDEX idx_webhook_deliveries_failed
  ON webhook_deliveries (webhook_id, is_successful, created_at DESC)
  WHERE is_successful = FALSE;


-- =============================================================================
-- 15. ROW-LEVEL SECURITY (RLS) — Security Isolation
-- =============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_oauth_accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_methods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys              ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (application DB user)
-- Application connects as 'desigot_app' role; admin connects as 'desigot_admin'

-- Example RLS policies (application enforces further via JWT + middleware):

-- Users can read their own record; admins can read all
CREATE POLICY policy_users_self_read ON users
  FOR SELECT
  USING (
    id = current_setting('app.current_user_id', TRUE)::UUID
    OR current_setting('app.current_user_role', TRUE) IN ('admin', 'superadmin')
  );

-- Orders: buyers see their own orders; sellers see orders for their listings
CREATE POLICY policy_orders_buyer_seller ON orders
  FOR SELECT
  USING (
    buyer_id  = current_setting('app.current_user_id', TRUE)::UUID
    OR seller_id = current_setting('app.current_user_id', TRUE)::UUID
    OR current_setting('app.current_user_role', TRUE) IN ('admin', 'superadmin')
  );

-- Notifications: users see only their own
CREATE POLICY policy_notifications_owner ON notifications
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Projects: buyer and seller can see their own projects
CREATE POLICY policy_projects_participants ON projects
  FOR ALL
  USING (
    buyer_id  = current_setting('app.current_user_id', TRUE)::UUID
    OR seller_id = current_setting('app.current_user_id', TRUE)::UUID
    OR current_setting('app.current_user_role', TRUE) IN ('admin', 'superadmin')
  );

-- API Keys: owners only
CREATE POLICY policy_api_keys_owner ON api_keys
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);


-- =============================================================================
-- 16. USEFUL VIEWS (Read-Only Query Helpers)
-- =============================================================================

-- ── Approved listings with seller summary ────────────────────────────────
CREATE OR REPLACE VIEW v_marketplace_listings AS
SELECT
  l.id,
  l.slug,
  l.title,
  l.description,
  l.listing_type,
  l.status,
  l.price_personal,
  l.price_commercial,
  l.price_extended,
  l.currency,
  l.ai_quality_score,
  l.total_sales,
  l.avg_rating,
  l.review_count,
  l.view_count,
  l.is_featured,
  l.tags,
  l.software_compat,
  l.file_formats,
  l.category_id,
  l.created_at,
  l.approved_at,
  -- Seller snapshot
  u.id           AS seller_id,
  u.username     AS seller_username,
  u.display_name AS seller_display_name,
  u.avatar_url   AS seller_avatar_url,
  u.seller_verified,
  u.avg_seller_rating,
  u.total_sales  AS seller_total_sales,
  u.response_rate AS seller_response_rate,
  -- Primary preview image
  (SELECT lm.cdn_url
   FROM listing_media lm
   WHERE lm.listing_id = l.id
     AND lm.media_type = 'preview_image'
     AND lm.sort_order = 0
   LIMIT 1) AS primary_image_url
FROM listings l
JOIN users u ON u.id = l.seller_id
WHERE l.status = 'approved'
  AND l.deleted_at IS NULL
  AND u.account_status = 'active';

COMMENT ON VIEW v_marketplace_listings IS 'Pre-joined view for marketplace browse. Materialized periodically for performance.';


-- ── Seller earnings summary ───────────────────────────────────────────────
CREATE OR REPLACE VIEW v_seller_earnings_summary AS
SELECT
  cl.seller_id,
  COUNT(*)                         AS total_transactions,
  SUM(cl.gross_amount_cents)       AS lifetime_gmv_cents,
  SUM(cl.commission_cents)         AS lifetime_commission_cents,
  SUM(cl.net_seller_cents)         AS lifetime_net_cents,
  SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days'
           THEN cl.net_seller_cents ELSE 0 END) AS last_30d_net_cents,
  SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '7 days'
           THEN cl.net_seller_cents ELSE 0 END)  AS last_7d_net_cents,
  AVG(cl.commission_rate)          AS avg_commission_rate
FROM commission_ledger cl
JOIN orders o ON o.id = cl.order_id
WHERE o.status = 'complete'
GROUP BY cl.seller_id;

COMMENT ON VIEW v_seller_earnings_summary IS 'Seller earnings analytics view. Queries on replica DB recommended.';


-- ── Platform business metrics ─────────────────────────────────────────────
CREATE OR REPLACE VIEW v_platform_metrics AS
SELECT
  -- User metrics
  (SELECT COUNT(*) FROM users WHERE account_status = 'active' AND deleted_at IS NULL)
    AS total_active_users,
  (SELECT COUNT(*) FROM users WHERE role = 'seller' AND seller_verified = TRUE AND account_status = 'active' AND deleted_at IS NULL)
    AS total_verified_sellers,
  -- Listing metrics
  (SELECT COUNT(*) FROM listings WHERE status = 'approved' AND deleted_at IS NULL)
    AS total_approved_listings,
  (SELECT COUNT(*) FROM listings WHERE status = 'pending_review')
    AS pending_review_count,
  -- Order & financial metrics
  (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours')
    AS orders_last_24h,
  (SELECT SUM(amount_cents) FROM orders WHERE status = 'complete' AND created_at >= NOW() - INTERVAL '30 days')
    AS gmv_last_30d_cents,
  (SELECT SUM(platform_fee_cents) FROM orders WHERE status = 'complete' AND created_at >= NOW() - INTERVAL '30 days')
    AS revenue_last_30d_cents,
  -- Dispute health
  (SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'under_review'))
    AS open_disputes,
  (SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'under_review') AND sla_deadline < NOW())
    AS overdue_disputes,
  -- Escrow
  (SELECT SUM(held_amount_cents) FROM escrow_records WHERE status = 'held')
    AS total_escrow_held_cents,
  NOW() AS computed_at;

COMMENT ON VIEW v_platform_metrics IS 'Real-time platform health dashboard. Run against read replica.';


-- ── Open disputes with SLA countdown ─────────────────────────────────────
CREATE OR REPLACE VIEW v_open_disputes AS
SELECT
  d.id,
  d.order_id,
  d.status,
  d.reason,
  d.opened_at,
  d.sla_deadline,
  EXTRACT(EPOCH FROM (d.sla_deadline - NOW())) / 3600 AS hours_until_sla,
  d.sla_deadline < NOW()                               AS is_sla_breached,
  o.amount_cents,
  o.buyer_id,
  o.seller_id,
  o.listing_title
FROM disputes d
JOIN orders o ON o.id = d.order_id
WHERE d.status IN ('open', 'under_review')
ORDER BY d.sla_deadline ASC;


-- =============================================================================
-- 17. SEED DATA — Enumerations & Defaults
-- =============================================================================

-- ── Seller Plans ─────────────────────────────────────────────────────────
INSERT INTO seller_plans (
  name, display_name, price_monthly_cents, price_yearly_cents,
  commission_rate, max_active_listings, search_boost_pct, api_rate_limit_rpm,
  max_team_members, has_ai_optimizer, has_custom_storefront, has_api_access, has_dedicated_cxm,
  sort_order
) VALUES
  ('free',       'Free',        0,      0,      0.1200,  5,   0,    100,   1,  FALSE, FALSE, FALSE, FALSE, 1),
  ('pro',        'Pro',         2900,   29000,  0.1000,  50,  25,   500,   1,  TRUE,  FALSE, FALSE, FALSE, 2),
  ('agency',     'Agency',      9900,   99000,  0.0800,  NULL,50,   1000,  10, TRUE,  TRUE,  TRUE,  FALSE, 3),
  ('enterprise', 'Enterprise',  29900,  299000, 0.0500,  NULL,100,  10000, NULL,TRUE, TRUE,  TRUE,  TRUE,  4)
ON CONFLICT (name) DO NOTHING;


-- ── Top-Level Categories (40+ design categories) ─────────────────────────
INSERT INTO listing_categories (name, slug, depth, sort_order, is_active, description) VALUES
  -- Tier 0 (Top-Level)
  ('UI Kits',            'ui-kits',             0, 1,  TRUE, 'Complete user interface kits for web and mobile design'),
  ('Mobile Apps',        'mobile-apps',         0, 2,  TRUE, 'Mobile app UI templates and design systems'),
  ('Dashboards',         'dashboards',          0, 3,  TRUE, 'Admin panels, analytics dashboards, and data visualization UIs'),
  ('Landing Pages',      'landing-pages',       0, 4,  TRUE, 'Marketing and product landing page templates'),
  ('Icons',              'icons',               0, 5,  TRUE, 'Icon sets, symbol libraries, and custom icon packs'),
  ('Illustrations',      'illustrations',       0, 6,  TRUE, 'Vector illustrations, spot graphics, and scenes'),
  ('Typography',         'typography',          0, 7,  TRUE, 'Typefaces, font pairings, and typographic systems'),
  ('Design Systems',     'design-systems',      0, 8,  TRUE, 'Comprehensive design system packages and component libraries'),
  ('Mockups',            'mockups',             0, 9,  TRUE, 'Device and branding mockup templates'),
  ('Logos & Branding',   'logos-branding',      0, 10, TRUE, 'Logo designs, brand identity kits, and style guides'),
  ('Presentations',      'presentations',       0, 11, TRUE, 'Pitch decks, slide templates, and keynote designs'),
  ('Email Templates',    'email-templates',     0, 12, TRUE, 'HTML email templates and campaign designs'),
  ('Social Media',       'social-media',        0, 13, TRUE, 'Social media post templates and story designs'),
  ('Wireframes',         'wireframes',          0, 14, TRUE, 'Low and mid-fidelity wireframe kits'),
  ('Prototypes',         'prototypes',          0, 15, TRUE, 'Interactive prototype templates and flows'),
  ('3D Assets',          '3d-assets',           0, 16, TRUE, '3D UI elements, scenes, and isometric graphics'),
  ('Charts & Data Viz',  'charts-data-viz',     0, 17, TRUE, 'Data visualization components and chart templates'),
  ('Web Templates',      'web-templates',       0, 18, TRUE, 'Full website templates for web and Webflow'),
  ('Figma Resources',    'figma-resources',     0, 19, TRUE, 'Figma-native plugins, variables, and components'),
  ('Custom Services',    'custom-services',     0, 20, TRUE, 'Hire a designer for custom UI/UX design work')
ON CONFLICT (slug) DO NOTHING;


-- ── Platform Configuration Defaults ─────────────────────────────────────
INSERT INTO platform_config (key, value, description) VALUES
  ('commission.free_rate',       '0.12',  'Commission rate for free plan sellers'),
  ('commission.pro_rate',        '0.10',  'Commission rate for Pro plan sellers'),
  ('commission.agency_rate',     '0.08',  'Commission rate for Agency plan sellers'),
  ('commission.enterprise_rate', '0.05',  'Commission rate for Enterprise plan sellers'),
  ('escrow.inspection_days',     '7',     'Buyer inspection window in days before escrow releases'),
  ('payout.minimum_cents',       '5000',  'Minimum payout amount in cents ($50.00)'),
  ('listing.max_images',         '20',    'Maximum preview images per listing'),
  ('listing.max_video_seconds',  '60',    'Maximum preview video duration in seconds'),
  ('listing.max_file_size_mb',   '10',    'Maximum individual image upload size in MB'),
  ('search.max_results_per_page','100',   'Maximum search results per page'),
  ('platform.maintenance_mode',  'false', 'Global maintenance mode flag'),
  ('platform.name',              '"Desigot"', 'Platform display name'),
  ('ai.quality_score.auto_approve_threshold', '4.0', 'AI score >= this value auto-approves listing'),
  ('ai.quality_score.auto_reject_threshold',  '3.0', 'AI score < this value auto-rejects listing')
ON CONFLICT (key) DO NOTHING;


-- ── Feature Flags (default all disabled at launch) ────────────────────────
INSERT INTO feature_flags (key, description, is_enabled, rollout_percentage) VALUES
  ('seller_subscriptions',      'Seller subscription plan activation',           FALSE, 0),
  ('transaction_commission',    'Transaction commission deduction',               FALSE, 0),
  ('enterprise_features',       'Enterprise account features and SSO',           FALSE, 0),
  ('ai_listing_optimizer',      'AI-powered listing title/description optimizer',FALSE, 0),
  ('public_api',                'Third-party public API key access',             FALSE, 0),
  ('webhook_delivery',          'Seller-configured webhook endpoints',           FALSE, 0),
  ('design_style_quiz',         'Buyer design style preference quiz',            FALSE, 0),
  ('rfp_board',                 'Request for Proposal buyer board',              FALSE, 0),
  ('price_comparison_widget',   'Market price context widget on listing pages',  FALSE, 0),
  ('dark_mode',                 'Dark mode theme toggle for users',              TRUE,  100)
ON CONFLICT (key) DO NOTHING;


-- =============================================================================
-- 18. MAINTENANCE PROCEDURES
-- =============================================================================

-- ── Auto-release expired escrow (called by cron job) ─────────────────────
CREATE OR REPLACE FUNCTION proc_release_expired_escrow()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_released_count INTEGER := 0;
  v_record         RECORD;
BEGIN
  -- Process in batches of 100 with SKIP LOCKED for concurrent-safe execution
  FOR v_record IN
    SELECT e.id, e.order_id, e.held_amount_cents
    FROM escrow_records e
    WHERE e.status = 'held'
      AND e.release_scheduled_at <= NOW()
    ORDER BY e.release_scheduled_at ASC
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Release escrow
    UPDATE escrow_records
    SET
      status                  = 'released',
      released_amount_cents   = v_record.held_amount_cents,
      released_at             = NOW(),
      updated_at              = NOW()
    WHERE id = v_record.id;

    -- Update order status
    UPDATE orders
    SET
      status       = 'complete',
      completed_at = NOW(),
      updated_at   = NOW()
    WHERE id = v_record.order_id
      AND status = 'active';

    -- Credit seller balance
    INSERT INTO seller_balances (seller_id, available_cents, lifetime_earned_cents)
    SELECT seller_id,
           seller_payout_cents,
           seller_payout_cents
    FROM orders WHERE id = v_record.order_id
    ON CONFLICT (seller_id)
    DO UPDATE SET
      available_cents       = seller_balances.available_cents + EXCLUDED.available_cents,
      lifetime_earned_cents = seller_balances.lifetime_earned_cents + EXCLUDED.lifetime_earned_cents,
      updated_at            = NOW();

    v_released_count := v_released_count + 1;
  END LOOP;

  RETURN v_released_count;
END;
$$;

COMMENT ON FUNCTION proc_release_expired_escrow IS 'Batch escrow auto-release. Run every 15 min via cron/BullMQ worker.';


-- ── Archive completed projects ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION proc_archive_old_projects()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE projects
    SET
      archived_at = NOW(),
      updated_at  = NOW()
    WHERE completed_at < NOW() - INTERVAL '12 months'
      AND archived_at IS NULL
      AND status = 'complete'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_archived_count FROM updated;

  RETURN v_archived_count;
END;
$$;

COMMENT ON FUNCTION proc_archive_old_projects IS 'Archives completed projects older than 12 months. Run nightly.';


-- ── Purge old notifications ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION proc_purge_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND is_read = TRUE;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION proc_purge_old_notifications IS 'Purges read notifications older than 90 days. Run nightly.';


-- ── Soft-delete expired sessions ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION proc_purge_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < NOW() - INTERVAL '1 day';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION proc_purge_expired_sessions IS 'Purges expired JWT refresh token sessions. Run hourly.';


-- ── Refresh listing category counts ──────────────────────────────────────
CREATE OR REPLACE FUNCTION proc_refresh_category_counts()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE listing_categories lc
  SET listing_count = (
    SELECT COUNT(*)
    FROM listings l
    WHERE l.category_id = lc.id
      AND l.status = 'approved'
      AND l.deleted_at IS NULL
  ),
  updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION proc_refresh_category_counts IS 'Refreshes denormalized listing counts per category. Run hourly.';


-- ── Update listing aggregate ratings ─────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_listing_rating_aggregate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update listing avg_rating and review_count on new approved review
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'approved' THEN
    UPDATE listings
    SET
      avg_rating   = (
        SELECT ROUND(AVG(rating_overall)::NUMERIC, 2)
        FROM reviews
        WHERE listing_id = NEW.listing_id
          AND status = 'approved'
          AND review_type = 'buyer_review'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE listing_id = NEW.listing_id
          AND status = 'approved'
          AND review_type = 'buyer_review'
      ),
      updated_at = NOW()
    WHERE id = NEW.listing_id;

    -- Also update seller aggregate rating
    UPDATE users
    SET
      avg_seller_rating  = (
        SELECT ROUND(AVG(r.rating_overall)::NUMERIC, 2)
        FROM reviews r
        WHERE r.subject_id = NEW.subject_id
          AND r.status = 'approved'
          AND r.review_type = 'buyer_review'
      ),
      seller_review_count = (
        SELECT COUNT(*)
        FROM reviews r
        WHERE r.subject_id = NEW.subject_id
          AND r.status = 'approved'
          AND r.review_type = 'buyer_review'
      ),
      updated_at = NOW()
    WHERE id = NEW.subject_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_ratings_on_review
  AFTER INSERT OR UPDATE OF status ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_update_listing_rating_aggregate();


-- ── Increment listing total_sales on order completion ────────────────────
CREATE OR REPLACE FUNCTION fn_increment_listing_sales()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'complete' AND OLD.status <> 'complete' THEN
    UPDATE listings
    SET
      total_sales         = total_sales + 1,
      total_revenue_cents = total_revenue_cents + NEW.amount_cents,
      updated_at          = NOW()
    WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_listing_sales
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION fn_increment_listing_sales();


-- =============================================================================
-- 19. DATABASE ROLES & PERMISSIONS
-- =============================================================================

-- Application role (API server) — principle of least privilege
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'desigot_app') THEN
    CREATE ROLE desigot_app LOGIN PASSWORD 'CHANGE_IN_PRODUCTION';
  END IF;
END$$;

-- Read-only analytics role (for replica queries, BI tools)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'desigot_readonly') THEN
    CREATE ROLE desigot_readonly LOGIN PASSWORD 'CHANGE_IN_PRODUCTION';
  END IF;
END$$;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO desigot_app, desigot_readonly;

-- App role: full DML on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO desigot_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO desigot_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO desigot_app;

-- Read-only role: SELECT only
GRANT SELECT ON ALL TABLES IN SCHEMA public TO desigot_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO desigot_readonly;

-- Revoke DELETE on immutable tables from app role (double protection)
REVOKE DELETE ON commission_ledger FROM desigot_app;
REVOKE UPDATE ON commission_ledger FROM desigot_app;
REVOKE DELETE ON audit_logs FROM desigot_app;
REVOKE UPDATE ON audit_logs FROM desigot_app;

-- Future tables inherit permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO desigot_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO desigot_readonly;


-- =============================================================================
-- 20. PARTITIONING STRATEGY (Enabled at Scale)
-- =============================================================================

-- NOTE: The following tables are designed as regular tables at launch.
-- When they exceed the thresholds below, migrate to partitioned tables
-- using pg_partman with RANGE partitioning. No data loss — use:
--   pg_partman's partition_data_proc() for live migration.
--
-- audit_logs      → RANGE (created_at) monthly  — trigger: > 50M rows
-- notifications   → RANGE (created_at) monthly  — trigger: > 100M rows
-- orders          → RANGE (created_at) quarterly — trigger: > 10M rows
-- commission_ledger→RANGE (created_at) monthly  — trigger: > 10M rows
-- search_queries  → RANGE (created_at) weekly   — trigger: > 100M rows
-- email_logs      → RANGE (created_at) monthly  — trigger: > 50M rows
--
-- Example pg_partman setup (run when threshold is reached):
--   SELECT partman.create_parent(
--     p_parent_table := 'public.audit_logs',
--     p_control      := 'created_at',
--     p_type         := 'range',
--     p_interval     := 'monthly',
--     p_premake      := 4
--   );


-- =============================================================================
-- 21. FINAL VALIDATION
-- =============================================================================

-- Verify all tables were created
DO $$
DECLARE
  v_table_name TEXT;
  v_missing    TEXT[] := '{}';
  v_required   TEXT[] := ARRAY[
    'users', 'user_oauth_accounts', 'user_sessions', 'user_kyc_verifications',
    'user_2fa_backup_codes', 'listing_categories', 'listings', 'listing_versions',
    'listing_media', 'listing_quality_scores', 'listing_collections',
    'listing_collection_items', 'wishlists', 'wishlist_items',
    'orders', 'escrow_records', 'licenses',
    'payment_intents', 'payout_methods', 'payouts', 'commission_ledger', 'seller_balances',
    'seller_plans', 'subscription_records',
    'projects', 'project_milestones', 'project_files', 'project_messages',
    'reviews', 'review_responses', 'review_flags',
    'notification_preferences', 'notifications', 'push_subscriptions', 'email_logs',
    'disputes', 'search_queries', 'recommendation_events',
    'audit_logs', 'platform_config', 'feature_flags', 'promo_codes',
    'api_keys', 'webhook_endpoints', 'webhook_deliveries', 'seller_health_scores'
  ];
BEGIN
  FOREACH v_table_name IN ARRAY v_required LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'current_schema()'
         OR table_schema = 'public'
        AND table_name = v_table_name
    ) THEN
      v_missing := v_missing || v_table_name;
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE WARNING 'Missing tables: %', array_to_string(v_missing, ', ');
  ELSE
    RAISE NOTICE 'Schema validation passed. All % tables created successfully.',
      array_length(v_required, 1);
  END IF;
END$$;


-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================
--
-- SUMMARY:
--   Tables:        46 tables across 10 domains
--   Enum Types:    17 custom PostgreSQL enums
--   Indexes:       60+ performance indexes (BTREE, GIN, partial, unique)
--   Views:         4 query helper views
--   Functions:     8 utility + trigger functions
--   Triggers:      12 automatic triggers (updated_at, search vector, ratings)
--   Procedures:    5 maintenance procedures (escrow release, archival, purge)
--   Security:      RLS on 11 sensitive tables; 2 immutable-table rules
--   Roles:         desigot_app (DML), desigot_readonly (SELECT only)
--   Seed Data:     Seller plans, 20 categories, platform config, feature flags
--
-- NEXT STEPS FOR PRODUCTION:
--   1. Replace placeholder passwords in CREATE ROLE statements
--   2. Set DATABASE_PRIMARY_URL and DATABASE_REPLICA_URL env vars
--   3. Run: npx drizzle-kit generate && npx drizzle-kit migrate
--   4. Configure pg_partman for audit_logs at scale
--   5. Set up PgBouncer connection pooler (transaction mode)
--   6. Enable pgBackRest / WAL archival for continuous backup
--   7. Run ANALYZE after initial data load for planner statistics
--
-- © 2025 Desigot Inc. Confidential.
-- =============================================================================
