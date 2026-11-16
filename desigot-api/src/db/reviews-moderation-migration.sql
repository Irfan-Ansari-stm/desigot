-- ============================================================================
-- DESIGOT REVIEWS & MODERATION MANAGEMENT SYSTEM MIGRATION
-- ============================================================================

-- 1. Ensure Enum Values for review_status_enum
DO $$
BEGIN
  BEGIN
    ALTER TYPE review_status_enum ADD VALUE IF NOT EXISTS 'pending_moderation';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE review_status_enum ADD VALUE IF NOT EXISTS 'approved';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE review_status_enum ADD VALUE IF NOT EXISTS 'rejected';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE review_status_enum ADD VALUE IF NOT EXISTS 'hidden';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE review_status_enum ADD VALUE IF NOT EXISTS 'under_investigation';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE review_status_enum ADD VALUE IF NOT EXISTS 'removed';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE review_status_enum ADD VALUE IF NOT EXISTS 'pending';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 2. Alter Reviews Table to accommodate full-featured reviews
ALTER TABLE reviews ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE reviews ALTER COLUMN listing_id DROP NOT NULL;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS review_reference VARCHAR(32) UNIQUE,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES digital_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES customer_bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS visibility_status VARCHAR(20) DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS assigned_moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderator_notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reported_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unhelpful_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(3,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS risk_score NUMERIC(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- 3. Review Attachments
CREATE TABLE IF NOT EXISTS review_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  thumbnail_url TEXT,
  moderation_status VARCHAR(50) DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Review Reports
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_reference VARCHAR(32) UNIQUE NOT NULL,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, investigating, resolved_dismissed, resolved_removed, escalated
  assigned_moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  investigation_notes TEXT,
  resolution_action VARCHAR(50) DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Seller Review Responses Enhancement
ALTER TABLE review_responses
  ADD COLUMN IF NOT EXISTS response_reference VARCHAR(32) UNIQUE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved', -- pending_approval, approved, rejected, hidden
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderator_notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 6. Review Moderation Rules
CREATE TABLE IF NOT EXISTS review_moderation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(120) NOT NULL,
  rule_code VARCHAR(60) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  condition_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  parameters JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  matches_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Review Moderation Actions (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS review_moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  report_id UUID REFERENCES review_reports(id) ON DELETE SET NULL,
  response_id UUID REFERENCES review_responses(id) ON DELETE SET NULL,
  moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Review Appeals
CREATE TABLE IF NOT EXISTS review_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appeal_reference VARCHAR(32) UNIQUE NOT NULL,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  appellant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appellant_type VARCHAR(20) DEFAULT 'buyer',
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, under_review, granted, denied
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  decision_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

-- 9. Rating Aggregates Table
CREATE TABLE IF NOT EXISTS rating_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL, -- 'product', 'service', 'seller'
  entity_id UUID NOT NULL,
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  total_reviews INT DEFAULT 0,
  verified_reviews INT DEFAULT 0,
  star_1_count INT DEFAULT 0,
  star_2_count INT DEFAULT 0,
  star_3_count INT DEFAULT 0,
  star_4_count INT DEFAULT 0,
  star_5_count INT DEFAULT 0,
  avg_quality NUMERIC(3,2) DEFAULT 0.00,
  avg_communication NUMERIC(3,2) DEFAULT 0.00,
  avg_value NUMERIC(3,2) DEFAULT 0.00,
  avg_delivery NUMERIC(3,2) DEFAULT 0.00,
  recommendation_percentage NUMERIC(5,2) DEFAULT 0.00,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

-- 10. Review Settings Table
CREATE TABLE IF NOT EXISTS review_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating_overall ON reviews(rating_overall);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ref ON reviews(review_reference);

CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reporter_id ON review_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_status ON review_responses(status);

CREATE INDEX IF NOT EXISTS idx_review_actions_review_id ON review_moderation_actions(review_id);
CREATE INDEX IF NOT EXISTS idx_review_actions_moderator_id ON review_moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_review_actions_created_at ON review_moderation_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rating_aggregates_entity ON rating_aggregates(entity_type, entity_id);
