-- ==============================================================================
-- DESIGOT MODULE 6: ORDERS & BOOKINGS MANAGEMENT SYSTEM MIGRATION
-- ==============================================================================

-- 1. Order Items (Itemized breakdown for multi-item or detailed order views)
CREATE TABLE IF NOT EXISTS order_items (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type                   VARCHAR(32) NOT NULL DEFAULT 'asset' CHECK (item_type IN ('asset', 'service', 'custom_quote', 'package')),
  product_id                  UUID REFERENCES digital_products(id) ON DELETE SET NULL,
  service_id                  UUID REFERENCES services(id) ON DELETE SET NULL,
  item_title                  VARCHAR(255) NOT NULL,
  quantity                    INTEGER NOT NULL DEFAULT 1,
  unit_price_cents            INTEGER NOT NULL DEFAULT 0,
  total_price_cents           INTEGER NOT NULL DEFAULT 0,
  currency                    VARCHAR(3) NOT NULL DEFAULT 'USD',
  license_type                VARCHAR(64) DEFAULT 'personal',
  metadata                    JSONB DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service_id ON order_items(service_id);

-- 2. Order Status History (Append-only audit trail for all order lifecycle events)
CREATE TABLE IF NOT EXISTS order_status_history (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status             VARCHAR(64),
  new_status                  VARCHAR(64),
  action                      VARCHAR(64) NOT NULL,
  performed_by_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  reason                      TEXT,
  metadata                    JSONB DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_oid ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON order_status_history(created_at DESC);

-- 3. Order Operational Assignments
CREATE TABLE IF NOT EXISTS order_assignments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  assigned_by_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_type                   VARCHAR(64) NOT NULL DEFAULT 'order_manager',
  notes                       TEXT,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_assignments_oid ON order_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_assignments_user ON order_assignments(assigned_to_id);

-- 4. Order Internal Staff Notes
CREATE TABLE IF NOT EXISTS order_internal_notes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note                        TEXT NOT NULL,
  visibility                  VARCHAR(32) NOT NULL DEFAULT 'staff_only',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_internal_notes_oid ON order_internal_notes(order_id);

-- 5. Order Deliveries (Submitted by sellers on service orders/projects)
CREATE TABLE IF NOT EXISTS order_deliveries (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  project_id                  UUID REFERENCES projects(id) ON DELETE SET NULL,
  seller_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivery_version            INTEGER NOT NULL DEFAULT 1,
  title                       VARCHAR(255) NOT NULL,
  description                 TEXT NOT NULL,
  file_urls                   TEXT[] DEFAULT '{}',
  external_links              TEXT[] DEFAULT '{}',
  attachment_count            INTEGER NOT NULL DEFAULT 1,
  review_status               VARCHAR(32) NOT NULL DEFAULT 'submitted' CHECK (review_status IN ('submitted', 'under_review', 'approved', 'revision_requested', 'rejected', 'withdrawn')),
  reviewed_by_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes                TEXT,
  submitted_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at                 TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_deliveries_oid ON order_deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_pid ON order_deliveries(project_id);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_seller ON order_deliveries(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_status ON order_deliveries(review_status);

-- 6. Order Revisions (Requested by customer or administrator)
CREATE TABLE IF NOT EXISTS order_revisions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id                 UUID NOT NULL REFERENCES order_deliveries(id) ON DELETE CASCADE,
  order_id                    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  project_id                  UUID REFERENCES projects(id) ON DELETE SET NULL,
  requested_by_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revision_number             INTEGER NOT NULL DEFAULT 1,
  reason                      VARCHAR(128) NOT NULL,
  requested_changes           TEXT NOT NULL,
  status                      VARCHAR(32) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'in_progress', 'submitted', 'approved', 'rejected', 'closed')),
  due_date                    TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at                 TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_order_revisions_delivery ON order_revisions(delivery_id);
CREATE INDEX IF NOT EXISTS idx_order_revisions_order ON order_revisions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_revisions_status ON order_revisions(status);

-- 7. Order Cancellations
CREATE TABLE IF NOT EXISTS order_cancellations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  requested_by_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason_category             VARCHAR(64) NOT NULL,
  reason_details              TEXT,
  refund_eligible             BOOLEAN NOT NULL DEFAULT FALSE,
  refund_amount_cents         INTEGER DEFAULT 0,
  refund_processed            BOOLEAN NOT NULL DEFAULT FALSE,
  status                      VARCHAR(32) NOT NULL DEFAULT 'cancelled',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_cancellations_oid ON order_cancellations(order_id);

-- 8. Custom Quotes
CREATE TABLE IF NOT EXISTS custom_quotes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number                VARCHAR(64) NOT NULL UNIQUE,
  customer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_category            VARCHAR(128),
  project_title               VARCHAR(255) NOT NULL,
  project_description         TEXT NOT NULL,
  requirements                TEXT,
  proposed_amount_cents       INTEGER NOT NULL,
  currency                    VARCHAR(3) NOT NULL DEFAULT 'USD',
  delivery_days               INTEGER NOT NULL DEFAULT 7,
  revisions_included          INTEGER NOT NULL DEFAULT 2,
  status                      VARCHAR(32) NOT NULL DEFAULT 'sent' CHECK (status IN ('requested', 'under_review', 'draft', 'sent', 'viewed', 'negotiation', 'accepted', 'rejected', 'expired', 'cancelled', 'converted_to_order')),
  expires_at                  TIMESTAMPTZ NOT NULL,
  converted_order_id          UUID REFERENCES orders(id) ON DELETE SET NULL,
  admin_notes                 TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_quotes_customer ON custom_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_quotes_seller ON custom_quotes(seller_id);
CREATE INDEX IF NOT EXISTS idx_custom_quotes_status ON custom_quotes(status);

-- 9. Custom Quote Negotiation Messages
CREATE TABLE IF NOT EXISTS custom_quote_negotiations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id                    UUID NOT NULL REFERENCES custom_quotes(id) ON DELETE CASCADE,
  sender_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposed_price_cents        INTEGER,
  proposed_timeline_days      INTEGER,
  message                     TEXT NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_negotiations_qid ON custom_quote_negotiations(quote_id);

-- 10. Register RBAC Permissions for Orders & Bookings
INSERT INTO permissions (name, slug, resource, action, description, is_system)
VALUES
  ('Read Orders', 'orders.read', 'orders', 'READ', 'View all marketplace orders', true),
  ('Create Orders', 'orders.create', 'orders', 'CREATE', 'Create administrative orders', true),
  ('Update Orders', 'orders.update', 'orders', 'UPDATE', 'Modify order details and fields', true),
  ('Cancel Orders', 'orders.cancel', 'orders', 'DELETE', 'Cancel orders and manage refund eligibility', true),
  ('Export Orders', 'orders.export', 'orders', 'EXPORT', 'Export orders to CSV and reports', true),
  ('Assign Orders', 'orders.assign', 'orders', 'ASSIGN', 'Assign staff to manage orders', true),
  ('Manage Order Status', 'orders.manage_status', 'orders', 'MANAGE', 'Update and transition order statuses', true),
  ('View Order History', 'orders.view_history', 'orders', 'VIEW', 'Inspect order timeline and historical changes', true),
  ('View Financials', 'orders.view_financials', 'orders', 'VIEW', 'Inspect commission, seller payout, and margins', true),
  ('Read Digital Orders', 'digital_orders.read', 'digital_orders', 'READ', 'View digital product orders and files', true),
  ('Manage Digital Orders', 'digital_orders.manage', 'digital_orders', 'MANAGE', 'Manage digital licenses and entitlements', true),
  ('Read Fulfillment', 'digital_orders.fulfillment.read', 'digital_orders', 'READ', 'View download logs and fulfillment status', true),
  ('Read Service Orders', 'service_orders.read', 'service_orders', 'READ', 'View service orders and deliverables', true),
  ('Manage Service Orders', 'service_orders.manage', 'service_orders', 'MANAGE', 'Manage project scope and seller requirements', true),
  ('Assign Service Orders', 'service_orders.assign', 'service_orders', 'ASSIGN', 'Assign project managers to service orders', true),
  ('Read Bookings', 'bookings.read', 'bookings', 'READ', 'View scheduled customer bookings', true),
  ('Create Bookings', 'bookings.create', 'bookings', 'CREATE', 'Create appointments and consultation sessions', true),
  ('Update Bookings', 'bookings.update', 'bookings', 'UPDATE', 'Modify booking notes and meeting links', true),
  ('Confirm Bookings', 'bookings.confirm', 'bookings', 'APPROVE', 'Confirm or reject new bookings', true),
  ('Reschedule Bookings', 'bookings.reschedule', 'bookings', 'UPDATE', 'Change appointment date and time slot', true),
  ('Cancel Bookings', 'bookings.cancel', 'bookings', 'DELETE', 'Cancel appointments with reasons', true),
  ('Assign Bookings', 'bookings.assign', 'bookings', 'ASSIGN', 'Assign sellers or facilitators to bookings', true),
  ('Read Projects', 'projects.read', 'projects', 'READ', 'View active projects and timelines', true),
  ('Manage Projects', 'projects.manage', 'projects', 'MANAGE', 'Update project status and descriptions', true),
  ('Assign Projects', 'projects.assign', 'projects', 'ASSIGN', 'Assign project managers', true),
  ('Manage Milestones', 'projects.milestones.manage', 'projects', 'MANAGE', 'Create, update, and approve project milestones', true),
  ('Read Deliveries', 'deliveries.read', 'deliveries', 'READ', 'View submitted deliveries', true),
  ('Submit Deliveries', 'deliveries.submit', 'deliveries', 'CREATE', 'Submit project deliverables', true),
  ('Review Deliveries', 'deliveries.review', 'deliveries', 'VIEW', 'Review and inspect submitted deliverables', true),
  ('Approve Deliveries', 'deliveries.approve', 'deliveries', 'APPROVE', 'Approve deliverables for payout', true),
  ('Reject Deliveries', 'deliveries.reject', 'deliveries', 'REJECT', 'Reject deliveries with reasons', true),
  ('Read Revisions', 'revisions.read', 'revisions', 'READ', 'View revision requests and status', true),
  ('Request Revisions', 'revisions.request', 'revisions', 'CREATE', 'Request revisions on deliveries', true),
  ('Manage Revisions', 'revisions.manage', 'revisions', 'MANAGE', 'Assign and update revision requests', true),
  ('Approve Revisions', 'revisions.approve', 'revisions', 'APPROVE', 'Approve resolved revisions', true),
  ('Read Disputes', 'disputes.read', 'disputes', 'READ', 'View disputed orders and complaints', true),
  ('Manage Disputes', 'disputes.manage', 'disputes', 'MANAGE', 'Manage dispute investigations', true),
  ('Assign Disputes', 'disputes.assign', 'disputes', 'ASSIGN', 'Assign dispute investigators', true),
  ('Resolve Disputes', 'disputes.resolve', 'disputes', 'MANAGE', 'Resolve disputes in favor of customer or seller', true),
  ('Escalate Disputes', 'disputes.escalate', 'disputes', 'MANAGE', 'Escalate high-priority disputes', true),
  ('Read Quotes', 'quotes.read', 'quotes', 'READ', 'View custom quotes and requests', true),
  ('Create Quotes', 'quotes.create', 'quotes', 'CREATE', 'Create custom quotes for buyers', true),
  ('Update Quotes', 'quotes.update', 'quotes', 'UPDATE', 'Modify quote prices and deliverables', true),
  ('Send Quotes', 'quotes.send', 'quotes', 'MANAGE', 'Send custom quotes to customers', true),
  ('Approve Quotes', 'quotes.approve', 'quotes', 'APPROVE', 'Approve customer quote acceptance', true),
  ('Reject Quotes', 'quotes.reject', 'quotes', 'REJECT', 'Reject or cancel quotes', true),
  ('Convert Quotes', 'quotes.convert', 'quotes', 'MANAGE', 'Convert accepted quotes into active orders', true),
  ('Read Order Payments', 'order_payments.read', 'orders', 'READ', 'View transaction and payment details', true),
  ('Read Refunds', 'order_refunds.read', 'orders', 'READ', 'View refund status and histories', true),
  ('Manage Refunds', 'order_refunds.manage', 'orders', 'MANAGE', 'Authorize and process customer refunds', true),
  ('Read Order History', 'order_history.read', 'orders', 'READ', 'Inspect audit history of orders', true),
  ('Read Order Analytics', 'order_analytics.read', 'orders', 'READ', 'Access orders and revenue analytics', true),
  ('Read Order Audit', 'order_audit.read', 'orders', 'READ', 'Access administrative audit trail', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 11. Assign all permissions to Super Admin, Admin, and Manager roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug IN ('superadmin', 'admin', 'manager')
  AND p.slug IN (
    'orders.read', 'orders.create', 'orders.update', 'orders.cancel', 'orders.export', 'orders.assign', 'orders.manage_status', 'orders.view_history', 'orders.view_financials',
    'digital_orders.read', 'digital_orders.manage', 'digital_orders.fulfillment.read',
    'service_orders.read', 'service_orders.manage', 'service_orders.assign',
    'bookings.read', 'bookings.create', 'bookings.update', 'bookings.confirm', 'bookings.reschedule', 'bookings.cancel', 'bookings.assign',
    'projects.read', 'projects.manage', 'projects.assign', 'projects.milestones.manage',
    'deliveries.read', 'deliveries.submit', 'deliveries.review', 'deliveries.approve', 'deliveries.reject',
    'revisions.read', 'revisions.request', 'revisions.manage', 'revisions.approve',
    'disputes.read', 'disputes.manage', 'disputes.assign', 'disputes.resolve', 'disputes.escalate',
    'quotes.read', 'quotes.create', 'quotes.update', 'quotes.send', 'quotes.approve', 'quotes.reject', 'quotes.convert',
    'order_payments.read', 'order_refunds.read', 'order_refunds.manage',
    'order_history.read', 'order_analytics.read', 'order_audit.read'
  )
ON CONFLICT DO NOTHING;
