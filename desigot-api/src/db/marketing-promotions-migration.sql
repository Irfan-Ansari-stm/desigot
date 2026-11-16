-- ============================================================================
-- DESIGOT MARKETING & PROMOTIONS MANAGEMENT SYSTEM MIGRATION
-- ============================================================================

-- 1. Coupons & Redemptions
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  coupon_type VARCHAR(50) DEFAULT 'percentage', -- percentage, fixed_amount, first_order, product_specific, service_specific, category_specific, seller_specific, referral, affiliate
  discount_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_cents INT DEFAULT 0,
  max_discount_cents INT DEFAULT NULL,
  max_uses INT DEFAULT NULL,
  uses_count INT DEFAULT 0,
  per_customer_limit INT DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiration_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, scheduled, expired
  applicable_product_ids UUID[] DEFAULT NULL,
  applicable_service_ids UUID[] DEFAULT NULL,
  applicable_category_ids UUID[] DEFAULT NULL,
  applicable_seller_ids UUID[] DEFAULT NULL,
  new_customer_only BOOLEAN DEFAULT false,
  stackable BOOLEAN DEFAULT false,
  campaign_id UUID DEFAULT NULL,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_amount_cents INT NOT NULL,
  discount_amount_cents INT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Discount Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) DEFAULT 'flash_sale', -- flash_sale, seasonal_sale, festival_sale, weekend_sale, product_discount, service_discount, category_discount, marketplace_wide
  banner_url TEXT,
  thumbnail_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  discount_type VARCHAR(20) DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 10,
  max_discount_cents INT,
  budget_cents INT DEFAULT 0,
  current_spend_cents INT DEFAULT 0,
  total_revenue_cents INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  priority INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active', -- draft, scheduled, active, paused, completed, cancelled
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL, -- product, service, category, seller
  item_id UUID NOT NULL,
  custom_discount_value NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, item_type, item_id)
);

-- 3. Featured Products Table (extend or create)
CREATE TABLE IF NOT EXISTS featured_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  position INT DEFAULT 1,
  priority INT DEFAULT 1,
  placement VARCHAR(50) DEFAULT 'homepage_hero',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue_cents BIGINT DEFAULT 0,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Featured Services Table (extend or create)
CREATE TABLE IF NOT EXISTS featured_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  position INT DEFAULT 1,
  priority INT DEFAULT 1,
  placement VARCHAR(50) DEFAULT 'homepage_hero',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  impressions_count INT DEFAULT 0,
  clicks_count INT DEFAULT 0,
  orders_count INT DEFAULT 0,
  revenue_cents BIGINT DEFAULT 0,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Homepage Banners Table
CREATE TABLE IF NOT EXISTS homepage_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  title VARCHAR(200),
  subtitle VARCHAR(255),
  description TEXT,
  banner_type VARCHAR(50) DEFAULT 'hero', -- hero, promotional, seasonal, category, product, service
  desktop_image_url TEXT NOT NULL,
  tablet_image_url TEXT,
  mobile_image_url TEXT,
  cta_text VARCHAR(80) DEFAULT 'Explore Now',
  cta_url TEXT DEFAULT '/browse',
  target_audience VARCHAR(50) DEFAULT 'all', -- all, new_users, returning_customers, sellers
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  display_priority INT DEFAULT 1,
  position INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'published', -- draft, scheduled, published, paused, expired
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Promotional Sections & Items
CREATE TABLE IF NOT EXISTS promotional_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  subtitle VARCHAR(255),
  section_type VARCHAR(50) NOT NULL, -- trending_products, trending_services, best_sellers, new_arrivals, top_rated_products, top_rated_services, limited_time_offers, featured_categories, custom_collection
  display_layout VARCHAR(50) DEFAULT 'grid', -- grid, carousel, highlight
  grid_columns INT DEFAULT 4,
  display_count INT DEFAULT 8,
  sort_order INT DEFAULT 1,
  background_style VARCHAR(50) DEFAULT 'default', -- default, subtle, dark, gradient
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'published', -- draft, published, paused
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotional_section_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES promotional_sections(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL, -- product, service, category
  item_id UUID NOT NULL,
  position INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, item_type, item_id)
);

-- 7. Newsletter Campaigns & Subscribers
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  sender_name VARCHAR(100) DEFAULT 'Desigot Marketplace',
  sender_email VARCHAR(150) DEFAULT 'newsletter@desigot.com',
  header_image_url TEXT,
  content_html TEXT NOT NULL,
  cta_text VARCHAR(80),
  cta_url TEXT,
  target_segment VARCHAR(50) DEFAULT 'all_customers', -- all_customers, active_buyers, sellers, new_users
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sending, sent, cancelled
  recipient_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  bounce_count INT DEFAULT 0,
  unsubscribe_count INT DEFAULT 0,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'subscribed', -- subscribed, unsubscribed, bounced
  consent_given BOOLEAN DEFAULT true,
  source VARCHAR(50) DEFAULT 'footer_form', -- footer_form, checkout, registration, modal
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- 8. Affiliates, Clicks, Conversions & Payouts
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affiliate_code VARCHAR(50) UNIQUE NOT NULL,
  affiliate_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  affiliate_type VARCHAR(50) DEFAULT 'influencer', -- creator, influencer, agency, partner
  referral_link TEXT NOT NULL,
  commission_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed
  commission_rate NUMERIC(5,2) DEFAULT 10.00,
  status VARCHAR(20) DEFAULT 'approved', -- pending, approved, suspended, rejected
  total_clicks INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  total_revenue_cents BIGINT DEFAULT 0,
  pending_commission_cents BIGINT DEFAULT 0,
  approved_commission_cents BIGINT DEFAULT 0,
  paid_commission_cents BIGINT DEFAULT 0,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  landing_page TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_amount_cents INT NOT NULL,
  commission_amount_cents INT NOT NULL,
  status VARCHAR(20) DEFAULT 'approved', -- pending, approved, paid, reversed
  qualification_ends_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  payout_reference VARCHAR(50) UNIQUE NOT NULL,
  amount_cents BIGINT NOT NULL,
  payout_method VARCHAR(50) DEFAULT 'stripe', -- stripe, bank_transfer, paypal
  status VARCHAR(20) DEFAULT 'paid', -- pending, processing, paid, rejected
  processed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Referral Programs, Codes & Conversions
CREATE TABLE IF NOT EXISTS referral_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  referral_type VARCHAR(50) DEFAULT 'customer_referral', -- customer_referral, seller_referral, first_purchase, service_booking
  referrer_reward_type VARCHAR(20) DEFAULT 'fixed', -- fixed, percentage, credit
  referrer_reward_value NUMERIC(10,2) DEFAULT 1500, -- $15.00
  referred_reward_type VARCHAR(20) DEFAULT 'fixed',
  referred_reward_value NUMERIC(10,2) DEFAULT 1000, -- $10.00
  min_order_cents INT DEFAULT 3000,
  max_referrals_per_user INT DEFAULT 20,
  budget_cents BIGINT DEFAULT 1000000,
  current_spend_cents BIGINT DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active', -- active, paused, expired
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES referral_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  total_clicks INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, user_id)
);

CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES referral_programs(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_amount_cents INT NOT NULL,
  referrer_reward_cents INT NOT NULL,
  referee_reward_cents INT NOT NULL,
  status VARCHAR(20) DEFAULT 'approved', -- pending, qualified, approved, paid, reversed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Advertisements Management
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  advertiser_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ad_type VARCHAR(50) DEFAULT 'homepage_banner', -- homepage_banner, sidebar, sponsored_listing, search_result
  placement VARCHAR(50) DEFAULT 'homepage_top', -- homepage_top, sidebar_top, browse_grid, search_top
  creative_url TEXT NOT NULL,
  headline VARCHAR(150),
  description TEXT,
  cta_text VARCHAR(60) DEFAULT 'Learn More',
  destination_url TEXT NOT NULL,
  billing_model VARCHAR(20) DEFAULT 'cpc', -- cpc, cpm, flat
  bid_amount_cents INT DEFAULT 50, -- $0.50
  total_budget_cents BIGINT DEFAULT 50000, -- $500.00
  daily_budget_cents BIGINT DEFAULT 5000, -- $50.00
  current_spend_cents BIGINT DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active', -- draft, pending_approval, approved, active, paused, rejected, completed
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Marketing Audit Logs & Settings
CREATE TABLE IF NOT EXISTS marketing_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_dates ON coupons(start_date, expiration_date);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON marketing_campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_featured_prod_active ON featured_products(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_srv_active ON featured_services(is_active);

CREATE INDEX IF NOT EXISTS idx_banners_status ON homepage_banners(status);
CREATE INDEX IF NOT EXISTS idx_promosec_active ON promotional_sections(is_active);

CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON newsletter_subscribers(email);

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

CREATE INDEX IF NOT EXISTS idx_referrals_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conv_status ON referral_conversions(status);

CREATE INDEX IF NOT EXISTS idx_ads_status ON advertisements(status);
CREATE INDEX IF NOT EXISTS idx_ads_type ON advertisements(ad_type);

CREATE INDEX IF NOT EXISTS idx_marketing_audit_created ON marketing_audit_logs(created_at DESC);
