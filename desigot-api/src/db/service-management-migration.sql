-- ============================================================================
-- DESIGOT SERVICE MANAGEMENT EXTENSION MIGRATION
-- Adds complete schema for all 17 service management modules:
-- Services, Media, Attributes, Tags, Packages, Add-ons, Pricing, Availability,
-- Moderation, Featured Campaigns, Reports, Custom Requests, Quotes, and RBAC.
-- ============================================================================

-- 1. Services Table (Dedicated entity for professional custom design services)
CREATE TABLE IF NOT EXISTS services (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id            UUID REFERENCES listings(id) ON DELETE SET NULL, -- Unified with global marketplace listings
  seller_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id           UUID NOT NULL REFERENCES listing_categories(id) ON DELETE RESTRICT,
  title                 VARCHAR(200) NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  slug                  VARCHAR(230) NOT NULL UNIQUE,
  short_description     TEXT,
  description           TEXT NOT NULL,
  target_audience       VARCHAR(100),
  language              VARCHAR(50) DEFAULT 'English',
  status                VARCHAR(32) NOT NULL DEFAULT 'draft', -- 'draft', 'pending_approval', 'changes_requested', 'approved', 'published', 'rejected', 'suspended', 'archived'
  is_featured           BOOLEAN NOT NULL DEFAULT FALSE,
  featured_priority     INTEGER NOT NULL DEFAULT 0,
  featured_until        TIMESTAMPTZ,
  starting_price_cents  INTEGER NOT NULL DEFAULT 0 CHECK (starting_price_cents >= 0),
  currency              CHAR(3) NOT NULL DEFAULT 'USD',
  delivery_time_days    INTEGER NOT NULL DEFAULT 3 CHECK (delivery_time_days > 0),
  revision_limit        INTEGER NOT NULL DEFAULT 2 CHECK (revision_limit >= 0),
  what_is_included      TEXT[] DEFAULT '{}',
  what_is_not_included  TEXT[] DEFAULT '{}',
  deliverables          TEXT[] DEFAULT '{}',
  customer_requirements TEXT,
  design_process        JSONB DEFAULT '[]',
  faqs                  JSONB DEFAULT '[]',
  seo_title             VARCHAR(150),
  seo_description       TEXT,
  seo_keywords          TEXT[] DEFAULT '{}',
  rejection_reason      TEXT,
  suspension_reason     TEXT,
  moderator_notes       TEXT,
  total_orders          INTEGER NOT NULL DEFAULT 0,
  total_revenue_cents   BIGINT NOT NULL DEFAULT 0,
  avg_rating            DECIMAL(3,2) DEFAULT 5.00,
  review_count          INTEGER NOT NULL DEFAULT 0,
  view_count            INTEGER NOT NULL DEFAULT 0,
  inquiry_count         INTEGER NOT NULL DEFAULT 0,
  approved_at           TIMESTAMPTZ,
  published_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_services_seller ON services(seller_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_featured ON services(is_featured, featured_priority DESC);
CREATE INDEX IF NOT EXISTS idx_services_sales_rev ON services(total_orders DESC, total_revenue_cents DESC);
CREATE INDEX IF NOT EXISTS idx_services_created ON services(created_at DESC);

-- 2. Service Media
CREATE TABLE IF NOT EXISTS service_media (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id            UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  media_type            VARCHAR(32) NOT NULL DEFAULT 'gallery_image', -- 'thumbnail', 'gallery_image', 'video_presentation', 'portfolio_item'
  file_url              TEXT NOT NULL,
  thumbnail_url         TEXT,
  caption               VARCHAR(200),
  display_order         INTEGER NOT NULL DEFAULT 0,
  file_size_bytes       BIGINT,
  mime_type             VARCHAR(64),
  is_primary            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_media_service ON service_media(service_id, display_order ASC);

-- 3. Service Tags & Tag Assignments
CREATE TABLE IF NOT EXISTS service_tags (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(60) NOT NULL UNIQUE,
  slug                  VARCHAR(80) NOT NULL UNIQUE,
  description           TEXT,
  usage_count           INTEGER NOT NULL DEFAULT 0,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_tag_assignments (
  service_id            UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  tag_id                UUID NOT NULL REFERENCES service_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tag_assignments_tag ON service_tag_assignments(tag_id);

-- 4. Service Attributes & Attribute Options & Values
CREATE TABLE IF NOT EXISTS service_attributes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(100) NOT NULL,
  slug                  VARCHAR(100) NOT NULL UNIQUE,
  description           TEXT,
  input_type            VARCHAR(32) NOT NULL DEFAULT 'select', -- 'text', 'select', 'multi_select', 'checkbox', 'radio', 'number', 'boolean'
  is_required           BOOLEAN NOT NULL DEFAULT FALSE,
  is_searchable         BOOLEAN NOT NULL DEFAULT TRUE,
  is_filterable         BOOLEAN NOT NULL DEFAULT TRUE,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  display_order         INTEGER NOT NULL DEFAULT 0,
  applicable_category_id UUID REFERENCES listing_categories(id) ON DELETE SET NULL, -- NULL = all categories
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_attribute_options (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id          UUID NOT NULL REFERENCES service_attributes(id) ON DELETE CASCADE,
  label                 VARCHAR(100) NOT NULL,
  value                 VARCHAR(100) NOT NULL,
  display_order         INTEGER NOT NULL DEFAULT 0,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_attr_options_attr ON service_attribute_options(attribute_id, display_order ASC);

CREATE TABLE IF NOT EXISTS service_attribute_values (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id            UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  attribute_id          UUID NOT NULL REFERENCES service_attributes(id) ON DELETE CASCADE,
  option_id             UUID REFERENCES service_attribute_options(id) ON DELETE SET NULL,
  custom_value          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_id, attribute_id, option_id)
);

CREATE INDEX IF NOT EXISTS idx_attr_values_service ON service_attribute_values(service_id);

-- 5. Service Packages & Features
CREATE TABLE IF NOT EXISTS service_packages (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id            UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  package_type          VARCHAR(32) NOT NULL DEFAULT 'basic', -- 'basic', 'standard', 'premium', 'custom'
  name                  VARCHAR(100) NOT NULL,
  description           TEXT NOT NULL,
  price_cents           INTEGER NOT NULL CHECK (price_cents > 0),
  delivery_days         INTEGER NOT NULL CHECK (delivery_days > 0),
  revisions             INTEGER NOT NULL DEFAULT 1 CHECK (revisions >= 0),
  express_delivery_days INTEGER,
  express_price_cents   INTEGER,
  display_order         INTEGER NOT NULL DEFAULT 0,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_packages_service ON service_packages(service_id, display_order ASC);

CREATE TABLE IF NOT EXISTS service_package_features (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id            UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  feature_name          VARCHAR(150) NOT NULL,
  is_included           BOOLEAN NOT NULL DEFAULT TRUE,
  value_text            VARCHAR(100),
  display_order         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_package_features_pkg ON service_package_features(package_id, display_order ASC);

-- 6. Service Add-ons
CREATE TABLE IF NOT EXISTS service_addons (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id            UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name                  VARCHAR(120) NOT NULL,
  description           TEXT,
  price_cents           INTEGER NOT NULL CHECK (price_cents >= 0),
  delivery_days_added   INTEGER NOT NULL DEFAULT 0 CHECK (delivery_days_added >= 0),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_addons_service ON service_addons(service_id);

-- 7. Service Availability & Booking Slots
CREATE TABLE IF NOT EXISTS service_availability (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  timezone              VARCHAR(50) NOT NULL DEFAULT 'UTC',
  weekly_schedule       JSONB NOT NULL DEFAULT '{"mon": {"active": true, "start": "09:00", "end": "17:00"}, "tue": {"active": true, "start": "09:00", "end": "17:00"}, "wed": {"active": true, "start": "09:00", "end": "17:00"}, "thu": {"active": true, "start": "09:00", "end": "17:00"}, "fri": {"active": true, "start": "09:00", "end": "17:00"}, "sat": {"active": false}, "sun": {"active": false}}',
  vacation_mode         BOOLEAN NOT NULL DEFAULT FALSE,
  vacation_start        DATE,
  vacation_end          DATE,
  vacation_message      TEXT,
  max_active_orders     INTEGER NOT NULL DEFAULT 5 CHECK (max_active_orders > 0),
  booking_notice_days   INTEGER NOT NULL DEFAULT 1 CHECK (booking_notice_days >= 0),
  max_advance_days      INTEGER NOT NULL DEFAULT 60 CHECK (max_advance_days > 0),
  expected_response_hours INTEGER NOT NULL DEFAULT 4,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_availability_exceptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exception_date        DATE NOT NULL,
  is_available          BOOLEAN NOT NULL DEFAULT FALSE,
  reason                VARCHAR(200),
  start_time            TIME,
  end_time              TIME,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (seller_id, exception_date)
);

CREATE TABLE IF NOT EXISTS service_booking_slots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_id            UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  order_id              UUID REFERENCES orders(id) ON DELETE SET NULL,
  slot_date             DATE NOT NULL,
  slot_time             TIME,
  status                VARCHAR(24) NOT NULL DEFAULT 'reserved', -- 'reserved', 'confirmed', 'completed', 'cancelled'
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_slots_seller_date ON service_booking_slots(seller_id, slot_date);

-- 8. Featured Campaigns
CREATE TABLE IF NOT EXISTS service_featured_listings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id            UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  priority              INTEGER NOT NULL DEFAULT 0,
  start_date            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date              TIMESTAMPTZ NOT NULL,
  placement             VARCHAR(32) NOT NULL DEFAULT 'homepage_hero', -- 'homepage_hero', 'category_top', 'search_spotlight'
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  impressions_count     INTEGER NOT NULL DEFAULT 0,
  clicks_count          INTEGER NOT NULL DEFAULT 0,
  orders_count          INTEGER NOT NULL DEFAULT 0,
  revenue_cents         BIGINT NOT NULL DEFAULT 0,
  created_by_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_listings_active ON service_featured_listings(is_active, priority DESC, end_date);

-- 9. Service Reports
CREATE TABLE IF NOT EXISTS service_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id            UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  reporter_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason                VARCHAR(64) NOT NULL, -- 'copyright_infringement', 'misleading_description', 'fraudulent_listing', 'inappropriate_content', 'seller_misconduct', 'other'
  description           TEXT NOT NULL,
  status                VARCHAR(24) NOT NULL DEFAULT 'new', -- 'new', 'under_review', 'awaiting_info', 'resolved', 'dismissed', 'escalated'
  assigned_moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes      TEXT,
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_reports_status ON service_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_reports_service ON service_reports(service_id);

-- 10. Custom Service Requests & Seller Quotations
CREATE TABLE IF NOT EXISTS service_custom_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id           UUID REFERENCES listing_categories(id) ON DELETE SET NULL,
  preferred_seller_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  title                 VARCHAR(200) NOT NULL,
  description           TEXT NOT NULL,
  budget_min_cents      INTEGER NOT NULL DEFAULT 0,
  budget_max_cents      INTEGER NOT NULL DEFAULT 0,
  expected_delivery_date DATE,
  required_skills       TEXT[] DEFAULT '{}',
  reference_files       JSONB DEFAULT '[]',
  status                VARCHAR(32) NOT NULL DEFAULT 'new', -- 'new', 'under_review', 'matched', 'quote_submitted', 'accepted', 'converted_to_order', 'rejected', 'cancelled'
  assigned_seller_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  converted_order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  admin_notes           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_requests_customer ON service_custom_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON service_custom_requests(status);

CREATE TABLE IF NOT EXISTS service_quotes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id            UUID NOT NULL REFERENCES service_custom_requests(id) ON DELETE CASCADE,
  seller_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  price_cents           INTEGER NOT NULL CHECK (price_cents > 0),
  delivery_days         INTEGER NOT NULL CHECK (delivery_days > 0),
  deliverables          TEXT[] NOT NULL DEFAULT '{}',
  revisions             INTEGER NOT NULL DEFAULT 1,
  terms                 TEXT,
  expires_at            TIMESTAMPTZ NOT NULL,
  status                VARCHAR(24) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_quotes_req ON service_quotes(request_id);

-- 11. Service Moderation & Status History
CREATE TABLE IF NOT EXISTS service_moderation_history (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id            UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  moderator_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  action                VARCHAR(32) NOT NULL, -- 'approved', 'rejected', 'changes_requested', 'suspended', 'restored', 'published', 'unpublished'
  reason                TEXT,
  internal_notes        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mod_history_service ON service_moderation_history(service_id, created_at DESC);

-- 12. Service Pricing Rules Config Table
CREATE TABLE IF NOT EXISTS service_pricing_rules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(100) NOT NULL,
  category_id           UUID REFERENCES listing_categories(id) ON DELETE CASCADE, -- NULL = platform default
  seller_id             UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = all sellers
  min_price_cents       INTEGER NOT NULL DEFAULT 500, -- $5.00 min
  max_price_cents       INTEGER NOT NULL DEFAULT 10000000, -- $100,000 max
  commission_rate       DECIMAL(5,4) NOT NULL DEFAULT 0.1500, -- 15% platform fee
  allow_hourly          BOOLEAN NOT NULL DEFAULT TRUE,
  allow_packages        BOOLEAN NOT NULL DEFAULT TRUE,
  allow_custom_quotes   BOOLEAN NOT NULL DEFAULT TRUE,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Seed Granular RBAC Permissions for Service Management
DO $$
DECLARE
  v_group_id UUID;
  v_admin_role_id UUID;
  v_manager_role_id UUID;
  v_module_id UUID;
BEGIN
  -- Ensure permission group exists
  SELECT id INTO v_group_id FROM permission_groups WHERE slug = 'group-services';
  IF v_group_id IS NULL THEN
    INSERT INTO permission_groups (name, slug, description, display_order)
    VALUES ('Service Management', 'group-services', 'Controls for catalog services, moderation, packages, availability, and pricing', 2)
    RETURNING id INTO v_group_id;
  END IF;

  SELECT id INTO v_module_id FROM modules WHERE slug = 'services';
  IF v_module_id IS NULL THEN
    INSERT INTO modules (name, slug, description, icon, route, display_order)
    VALUES ('Service Management', 'services', 'Complete lifecycle management of professional custom design services', 'Briefcase', '/dashboard/service-management', 2)
    RETURNING id INTO v_module_id;
  END IF;

  -- Add Granular Service Permissions
  INSERT INTO permissions (name, slug, resource, action, module_id, group_id, is_system)
  VALUES
    ('View All Services', 'services.read', 'services', 'READ', v_module_id, v_group_id, FALSE),
    ('Create New Service', 'services.create', 'services', 'CREATE', v_module_id, v_group_id, FALSE),
    ('Update Service Details', 'services.update', 'services', 'UPDATE', v_module_id, v_group_id, FALSE),
    ('Delete Service', 'services.delete', 'services', 'DELETE', v_module_id, v_group_id, FALSE),
    ('Duplicate Service', 'services.duplicate', 'services', 'CREATE', v_module_id, v_group_id, FALSE),
    ('Submit Service For Review', 'services.submit', 'services', 'UPDATE', v_module_id, v_group_id, FALSE),
    ('Approve Service', 'services.approve', 'services', 'APPROVE', v_module_id, v_group_id, FALSE),
    ('Reject Service', 'services.reject', 'services', 'REJECT', v_module_id, v_group_id, FALSE),
    ('Request Changes on Service', 'services.request_changes', 'services', 'UPDATE', v_module_id, v_group_id, FALSE),
    ('Publish Service', 'services.publish', 'services', 'UPDATE', v_module_id, v_group_id, FALSE),
    ('Unpublish Service', 'services.unpublish', 'services', 'UPDATE', v_module_id, v_group_id, FALSE),
    ('Suspend Service', 'services.suspend', 'services', 'MANAGE', v_module_id, v_group_id, FALSE),
    ('Restore Service', 'services.restore', 'services', 'MANAGE', v_module_id, v_group_id, FALSE),
    ('Archive Service', 'services.archive', 'services', 'DELETE', v_module_id, v_group_id, FALSE),
    ('Manage Featured Services', 'services.feature', 'services', 'MANAGE', v_module_id, v_group_id, FALSE),
    ('Manage Service Categories', 'services.manage_categories', 'services', 'MANAGE', v_module_id, v_group_id, FALSE),
    ('Manage Service Attributes', 'services.manage_attributes', 'services', 'MANAGE', v_module_id, v_group_id, FALSE),
    ('Manage Service Tags', 'services.manage_tags', 'services', 'MANAGE', v_module_id, v_group_id, FALSE),
    ('Manage Service Packages', 'services.manage_packages', 'services', 'MANAGE', v_module_id, v_group_id, FALSE),
    ('Configure Service Pricing', 'services.manage_pricing', 'services', 'CONFIGURE', v_module_id, v_group_id, FALSE),
    ('Manage Service Availability', 'services.manage_availability', 'services', 'CONFIGURE', v_module_id, v_group_id, FALSE),
    ('Moderate Service Reports', 'services.manage_reports', 'services', 'MANAGE', v_module_id, v_group_id, FALSE),
    ('Manage Custom Requests', 'services.manage_custom_requests', 'services', 'MANAGE', v_module_id, v_group_id, FALSE),
    ('View Service Performance', 'services.view_performance', 'services', 'READ', v_module_id, v_group_id, FALSE),
    ('Export Service Data', 'services.export', 'services', 'EXPORT', v_module_id, v_group_id, FALSE)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action;

  -- Role mapping
  SELECT id INTO v_admin_role_id FROM roles WHERE slug = 'admin';
  SELECT id INTO v_manager_role_id FROM roles WHERE slug = 'manager';

  IF v_admin_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, id FROM permissions WHERE slug LIKE 'services.%'
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_manager_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_manager_role_id, id FROM permissions
    WHERE slug IN (
      'services.read', 'services.create', 'services.update', 'services.approve',
      'services.reject', 'services.request_changes', 'services.publish', 'services.unpublish',
      'services.manage_categories', 'services.manage_packages', 'services.manage_tags',
      'services.manage_reports', 'services.manage_custom_requests', 'services.view_performance',
      'services.export'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
