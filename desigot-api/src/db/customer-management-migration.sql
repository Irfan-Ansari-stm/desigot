-- ============================================================================
-- DESIGOT CUSTOMER MANAGEMENT EXTENSION MIGRATION
-- Supports all 9 customer management sections:
-- Profiles, Addresses, Bookings, Complaints & Messages, Notes, Tags, Activity,
-- Communication Logs, and granular Customer RBAC permissions.
-- ============================================================================

-- 1. Customer Profiles Table
CREATE TABLE IF NOT EXISTS customer_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_type               VARCHAR(32) NOT NULL DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business', 'guest', 'vip')),
  company_name                VARCHAR(150),
  vat_tax_id                 VARCHAR(50),
  date_of_birth               DATE,
  gender                      VARCHAR(20),
  country                     VARCHAR(100) DEFAULT 'United States',
  state                       VARCHAR(100),
  city                        VARCHAR(100),
  postal_code                 VARCHAR(20),
  address_line1               TEXT,
  address_line2               TEXT,
  preferred_language          VARCHAR(50) DEFAULT 'English',
  timezone                    VARCHAR(50) DEFAULT 'UTC',
  email_verified              BOOLEAN NOT NULL DEFAULT TRUE,
  phone_verified              BOOLEAN NOT NULL DEFAULT FALSE,
  lifetime_spending_cents     BIGINT NOT NULL DEFAULT 0,
  total_orders_count          INTEGER NOT NULL DEFAULT 0,
  total_bookings_count        INTEGER NOT NULL DEFAULT 0,
  total_refunds_cents         BIGINT NOT NULL DEFAULT 0,
  avg_rating_given            DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  risk_score                  INTEGER NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_user ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_country ON customer_profiles(country);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_type ON customer_profiles(customer_type);

-- 2. Customer Address Book
CREATE TABLE IF NOT EXISTS customer_addresses (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_type                VARCHAR(32) NOT NULL DEFAULT 'shipping' CHECK (address_type IN ('shipping', 'billing', 'both')),
  is_default                  BOOLEAN NOT NULL DEFAULT FALSE,
  recipient_name              VARCHAR(150) NOT NULL,
  phone                       VARCHAR(50),
  address_line1               TEXT NOT NULL,
  address_line2               TEXT,
  city                        VARCHAR(100) NOT NULL,
  state                       VARCHAR(100),
  postal_code                 VARCHAR(20) NOT NULL,
  country                     VARCHAR(100) NOT NULL DEFAULT 'United States',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_cust ON customer_addresses(customer_id);

-- 3. Customer Bookings Table
CREATE TABLE IF NOT EXISTS customer_bookings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number              VARCHAR(50) UNIQUE NOT NULL,
  customer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id                   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_id                  UUID REFERENCES services(id) ON DELETE SET NULL,
  service_title               VARCHAR(255) NOT NULL,
  appointment_date            DATE NOT NULL,
  start_time                  TIME NOT NULL,
  end_time                    TIME NOT NULL,
  timezone                    VARCHAR(50) DEFAULT 'UTC',
  amount_cents                INTEGER NOT NULL DEFAULT 0,
  currency                    CHAR(3) NOT NULL DEFAULT 'USD',
  payment_status              VARCHAR(32) NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'authorized', 'paid', 'refunded', 'disputed')),
  booking_status              VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('requested', 'pending_confirmation', 'confirmed', 'rescheduled', 'in_progress', 'completed', 'cancelled', 'rejected', 'no_show', 'disputed')),
  meeting_link                TEXT,
  customer_notes              TEXT,
  admin_notes                 TEXT,
  cancellation_reason         TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cust_bookings_cust ON customer_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_bookings_seller ON customer_bookings(seller_id);
CREATE INDEX IF NOT EXISTS idx_cust_bookings_status ON customer_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_cust_bookings_date ON customer_bookings(appointment_date);

-- 4. Customer Complaints / Support Tickets
CREATE TABLE IF NOT EXISTS customer_complaints (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number               VARCHAR(50) UNIQUE NOT NULL,
  customer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_agent_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  related_order_id            UUID REFERENCES orders(id) ON DELETE SET NULL,
  related_booking_id          UUID REFERENCES customer_bookings(id) ON DELETE SET NULL,
  related_seller_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  category                    VARCHAR(50) NOT NULL CHECK (category IN ('order', 'service', 'digital_product', 'seller', 'payment', 'refund', 'booking', 'account', 'technical', 'other')),
  priority                    VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status                      VARCHAR(32) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'assigned', 'in_progress', 'waiting_for_customer', 'waiting_for_seller', 'escalated', 'resolved', 'closed', 'reopened')),
  subject                     VARCHAR(255) NOT NULL,
  description                 TEXT NOT NULL,
  preferred_contact_method    VARCHAR(30) DEFAULT 'email',
  resolution_details          TEXT,
  resolved_at                 TIMESTAMPTZ,
  resolved_by                 UUID REFERENCES users(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cust_complaints_cust ON customer_complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_complaints_agent ON customer_complaints(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_cust_complaints_status ON customer_complaints(status);
CREATE INDEX IF NOT EXISTS idx_cust_complaints_priority ON customer_complaints(priority);

-- 5. Customer Complaint Messages & Internal Notes
CREATE TABLE IF NOT EXISTS customer_complaint_messages (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id                UUID NOT NULL REFERENCES customer_complaints(id) ON DELETE CASCADE,
  sender_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role                 VARCHAR(32) NOT NULL DEFAULT 'customer' CHECK (sender_role IN ('customer', 'support_agent', 'admin', 'system')),
  is_internal_note            BOOLEAN NOT NULL DEFAULT FALSE,
  message                     TEXT NOT NULL,
  attachment_urls             TEXT[] DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_messages_cid ON customer_complaint_messages(complaint_id);

-- 6. Customer Internal Notes (Private to Admin / Staff)
CREATE TABLE IF NOT EXISTS customer_internal_notes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id                    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note                        TEXT NOT NULL,
  visibility                  VARCHAR(32) NOT NULL DEFAULT 'staff_only',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cust_internal_notes_cid ON customer_internal_notes(customer_id);

-- 7. Customer Tags
CREATE TABLE IF NOT EXISTS customer_tags (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        VARCHAR(50) UNIQUE NOT NULL,
  slug                        VARCHAR(50) UNIQUE NOT NULL,
  color                       VARCHAR(20) DEFAULT '#6366f1',
  description                 TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Customer Tag Assignments
CREATE TABLE IF NOT EXISTS customer_tag_assignments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id                      UUID NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
  assigned_by                 UUID REFERENCES users(id),
  assigned_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cust_tag UNIQUE (customer_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_cust_tag_assign_cid ON customer_tag_assignments(customer_id);

-- 9. Customer Activity Events
CREATE TABLE IF NOT EXISTS customer_activity_events (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type                  VARCHAR(50) NOT NULL,
  description                 TEXT NOT NULL,
  related_entity_type         VARCHAR(50),
  related_entity_id           UUID,
  ip_address                  VARCHAR(45),
  user_agent                  TEXT,
  metadata                    JSONB DEFAULT '{}'::jsonb,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cust_activity_cid ON customer_activity_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_activity_type ON customer_activity_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cust_activity_time ON customer_activity_events(created_at DESC);

-- 10. Customer Communication History
CREATE TABLE IF NOT EXISTS customer_communication_history (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel                     VARCHAR(30) NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'in_app', 'push')),
  template                    VARCHAR(100) NOT NULL,
  subject                     VARCHAR(255) NOT NULL,
  body_preview                TEXT,
  delivery_status             VARCHAR(30) NOT NULL DEFAULT 'delivered' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'opened', 'clicked')),
  consent_status              VARCHAR(30) DEFAULT 'consented',
  sent_by                     UUID REFERENCES users(id),
  sent_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cust_comm_cid ON customer_communication_history(customer_id);
