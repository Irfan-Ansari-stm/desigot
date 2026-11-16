-- ==============================================================================
-- DESIGOT COMMUNICATION MANAGEMENT SYSTEM MIGRATION
-- Enterprise Messages, Tickets, Disputes, Announcements, Emails & Templates
-- ==============================================================================

-- 1. Create enum/check types safely if needed
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_type_enum') THEN
    CREATE TYPE conversation_type_enum AS ENUM (
      'customer_support',
      'seller_support',
      'customer_seller',
      'order_communication',
      'booking_communication',
      'product_communication',
      'service_communication',
      'general_inquiry'
    );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Master Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_reference VARCHAR(64) UNIQUE NOT NULL,
  conversation_type VARCHAR(64) NOT NULL DEFAULT 'general_inquiry',
  subject VARCHAR(255) NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES customer_bookings(id) ON DELETE SET NULL,
  product_id UUID REFERENCES digital_products(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  priority VARCHAR(24) NOT NULL DEFAULT 'normal',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  unread_customer_count INT NOT NULL DEFAULT 0,
  unread_seller_count INT NOT NULL DEFAULT 0,
  unread_agent_count INT NOT NULL DEFAULT 0,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_order ON conversations(order_id);
CREATE INDEX IF NOT EXISTS idx_conversations_booking ON conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);

-- 3. Conversation Participants Table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL DEFAULT 'participant', -- customer, seller, agent, investigator, admin, system
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_type VARCHAR(32) NOT NULL DEFAULT 'customer', -- customer, seller, agent, admin, system
  message_type VARCHAR(32) NOT NULL DEFAULT 'text', -- text, image, document, file, system, internal_note, event
  message_content TEXT NOT NULL,
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  visibility VARCHAR(32) NOT NULL DEFAULT 'public', -- public, internal_only, system
  delivery_status VARCHAR(24) NOT NULL DEFAULT 'sent', -- sending, sent, delivered, read, failed
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_date ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_visibility ON messages(visibility);

-- 5. Message Attachments Table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(128) NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  file_url VARCHAR(1024) NOT NULL,
  thumbnail_url VARCHAR(1024),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_msg ON message_attachments(message_id);

-- 6. Message Receipts Table
CREATE TABLE IF NOT EXISTS message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  UNIQUE(message_id, user_id)
);

-- 7. Support Ticket Categories Table
CREATE TABLE IF NOT EXISTS support_ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) UNIQUE NOT NULL,
  description TEXT,
  sla_response_hours INT NOT NULL DEFAULT 24,
  sla_resolution_hours INT NOT NULL DEFAULT 72,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Support SLA Policies Table
CREATE TABLE IF NOT EXISTS support_sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority VARCHAR(32) UNIQUE NOT NULL, -- low, normal, high, urgent, critical
  response_time_minutes INT NOT NULL,
  resolution_time_minutes INT NOT NULL,
  business_hours_only BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_reference VARCHAR(64) UNIQUE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES customer_bookings(id) ON DELETE SET NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'general_inquiry',
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(24) NOT NULL DEFAULT 'normal',
  status VARCHAR(32) NOT NULL DEFAULT 'new', -- new, open, assigned, in_progress, waiting_customer, waiting_seller, escalated, resolved, closed
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sla_policy_id UUID REFERENCES support_sla_policies(id) ON DELETE SET NULL,
  response_deadline TIMESTAMPTZ,
  resolution_deadline TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  sla_status VARCHAR(24) NOT NULL DEFAULT 'compliant', -- compliant, warning, breached
  reopen_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_seller ON support_tickets(seller_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent ON support_tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON support_tickets(category);

-- 10. Support Ticket Comments & Notes Table
CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_type VARCHAR(32) NOT NULL DEFAULT 'reply', -- reply, internal_note, status_change, assignment, escalation
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON support_ticket_comments(ticket_id, created_at ASC);

-- 11. Support Agent Workloads
CREATE TABLE IF NOT EXISTS support_agent_workloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active_tickets_count INT NOT NULL DEFAULT 0,
  active_conversations_count INT NOT NULL DEFAULT 0,
  max_ticket_capacity INT NOT NULL DEFAULT 20,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Extend existing disputes table safely
DO $$ BEGIN
  -- Add columns to disputes table if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'dispute_reference') THEN
    ALTER TABLE disputes ADD COLUMN dispute_reference VARCHAR(64) UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'customer_id') THEN
    ALTER TABLE disputes ADD COLUMN customer_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'seller_id') THEN
    ALTER TABLE disputes ADD COLUMN seller_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'booking_id') THEN
    ALTER TABLE disputes ADD COLUMN booking_id UUID REFERENCES customer_bookings(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'dispute_category') THEN
    ALTER TABLE disputes ADD COLUMN dispute_category VARCHAR(64) DEFAULT 'order_cancellation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'dispute_amount_cents') THEN
    ALTER TABLE disputes ADD COLUMN dispute_amount_cents INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'currency') THEN
    ALTER TABLE disputes ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'assigned_investigator_id') THEN
    ALTER TABLE disputes ADD COLUMN assigned_investigator_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'priority') THEN
    ALTER TABLE disputes ADD COLUMN priority VARCHAR(24) DEFAULT 'normal';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'resolution_type') THEN
    ALTER TABLE disputes ADD COLUMN resolution_type VARCHAR(64);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'resolution_reason') THEN
    ALTER TABLE disputes ADD COLUMN resolution_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'evidence_requested_from') THEN
    ALTER TABLE disputes ADD COLUMN evidence_requested_from VARCHAR(32) DEFAULT 'none';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disputes' AND column_name = 'evidence_deadline') THEN
    ALTER TABLE disputes ADD COLUMN evidence_deadline TIMESTAMPTZ;
  END IF;
END $$;

-- 13. Dispute Evidence Table
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  party_type VARCHAR(32) NOT NULL DEFAULT 'customer', -- customer, seller, investigator, admin
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(1024) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  file_type VARCHAR(128) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute ON dispute_evidence(dispute_id);

-- 14. Dispute Timeline & Notes Table
CREATE TABLE IF NOT EXISTS dispute_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  notes TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_timeline_disp ON dispute_timeline_events(dispute_id, created_at ASC);

-- 15. Master Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_reference VARCHAR(64) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  announcement_type VARCHAR(64) NOT NULL DEFAULT 'platform_updates',
  target_audience VARCHAR(64) NOT NULL DEFAULT 'all_users',
  target_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority VARCHAR(24) NOT NULL DEFAULT 'normal',
  status VARCHAR(32) NOT NULL DEFAULT 'draft', -- draft, scheduled, published, paused, expired, archived
  channels TEXT[] NOT NULL DEFAULT '{in_app,dashboard}'::text[],
  banner_image_url VARCHAR(1024),
  cta_label VARCHAR(128),
  cta_url VARCHAR(1024),
  views_count INT NOT NULL DEFAULT 0,
  clicks_count INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(announcement_type);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON announcements(target_audience);

-- 16. Announcement Reads Table
CREATE TABLE IF NOT EXISTS announcement_user_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  UNIQUE(announcement_id, user_id)
);

-- 17. Master Communication Emails Table
CREATE TABLE IF NOT EXISTS communication_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_reference VARCHAR(64) UNIQUE NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  recipient_type VARCHAR(32) NOT NULL DEFAULT 'customer',
  template_id UUID,
  template_code VARCHAR(128),
  email_category VARCHAR(64) NOT NULL DEFAULT 'general_notification',
  subject VARCHAR(255) NOT NULL,
  body_html TEXT,
  body_text TEXT,
  provider VARCHAR(32) NOT NULL DEFAULT 'smtp',
  provider_message_id VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'queued', -- queued, processing, sent, delivered, bounced, failed, deferred, suppressed, cancelled
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  failure_reason TEXT,
  delivery_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_emails_status ON communication_emails(status);
CREATE INDEX IF NOT EXISTS idx_comm_emails_recipient ON communication_emails(recipient_email);
CREATE INDEX IF NOT EXISTS idx_comm_emails_cat ON communication_emails(email_category);
CREATE INDEX IF NOT EXISTS idx_comm_emails_queued ON communication_emails(queued_at DESC);

-- 18. Communication Templates Table
CREATE TABLE IF NOT EXISTS communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(128) NOT NULL,
  template_code VARCHAR(128) UNIQUE NOT NULL,
  category VARCHAR(64) NOT NULL,
  channel VARCHAR(32) NOT NULL DEFAULT 'email', -- email, in_app, push, sms
  subject VARCHAR(255) NOT NULL,
  body_html TEXT,
  body_text TEXT NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  variables_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_templates_code ON communication_templates(template_code);
CREATE INDEX IF NOT EXISTS idx_comm_templates_cat ON communication_templates(category);

-- 19. Communication Template Versions Table
CREATE TABLE IF NOT EXISTS communication_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES communication_templates(id) ON DELETE CASCADE,
  version INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT,
  body_text TEXT NOT NULL,
  changed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Communication Audit Logs Table
CREATE TABLE IF NOT EXISTS communication_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(128) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(128) NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name VARCHAR(255),
  actor_email VARCHAR(255),
  ip_address VARCHAR(64),
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_audit_actor ON communication_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_comm_audit_entity ON communication_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comm_audit_action ON communication_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_comm_audit_created ON communication_audit_logs(created_at DESC);

-- 21. User Messaging Restrictions Table
CREATE TABLE IF NOT EXISTS user_messaging_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  reason TEXT,
  restricted_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  restricted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. Seed Default SLA Policies
INSERT INTO support_sla_policies (priority, response_time_minutes, resolution_time_minutes, business_hours_only, is_active)
VALUES
  ('critical', 60, 240, FALSE, TRUE),
  ('urgent', 120, 480, FALSE, TRUE),
  ('high', 240, 1440, FALSE, TRUE),
  ('normal', 480, 2880, FALSE, TRUE),
  ('low', 1440, 4320, FALSE, TRUE)
ON CONFLICT (priority) DO UPDATE
SET response_time_minutes = EXCLUDED.response_time_minutes,
    resolution_time_minutes = EXCLUDED.resolution_time_minutes;

-- 23. Seed Default Ticket Categories
INSERT INTO support_ticket_categories (name, slug, description, sla_response_hours, sla_resolution_hours, is_active)
VALUES
  ('General Inquiry', 'general_inquiry', 'General questions about platform features and policies', 24, 72, TRUE),
  ('Account Issues', 'account_issues', 'Account access, profile modifications, and verification requests', 12, 48, TRUE),
  ('Login Problems', 'login_problems', '2FA resets, locked accounts, and password recovery issues', 4, 24, TRUE),
  ('Payment Issues', 'payment_issues', 'Failed transactions, gateway errors, and checkout issues', 4, 24, TRUE),
  ('Refund Requests', 'refund_requests', 'Escalated customer refund reviews and order cancellations', 8, 48, TRUE),
  ('Order Issues', 'order_issues', 'Missing files, download link expiration, and order processing stalls', 8, 24, TRUE),
  ('Booking Issues', 'booking_issues', 'Rescheduling, calendar conflicts, and appointment cancellations', 12, 48, TRUE),
  ('Service Delivery', 'service_delivery', 'Scope disputes, milestone completion, and delivery delays', 8, 48, TRUE),
  ('Digital Product Issues', 'digital_product_issues', 'Asset corruption, license keys, and package extraction errors', 12, 48, TRUE),
  ('Seller Issues', 'seller_issues', 'Seller onboarding, portfolio approval, and seller policy appeals', 24, 72, TRUE),
  ('Payout Issues', 'payout_issues', 'Stripe Connect, bank payout holds, and ledger discrepancies', 8, 48, TRUE),
  ('Technical Problems', 'technical_problems', 'Platform bugs, API issues, and unexpected UI behaviors', 12, 48, TRUE),
  ('Billing Issues', 'billing_issues', 'Invoice requests, tax calculation disputes, and VAT receipts', 24, 72, TRUE),
  ('Other', 'other', 'Miscellaneous support inquiries', 24, 72, TRUE)
ON CONFLICT (slug) DO NOTHING;
