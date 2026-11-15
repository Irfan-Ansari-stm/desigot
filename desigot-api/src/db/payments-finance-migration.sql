-- Migration: Module 8 - Payments & Finance Management System
-- Schema for Gateways, Payment Methods, Transactions, Commissions, Seller Earnings, Payouts, Refunds, Tax, Invoices, Financial Ledger, Reconciliation, and Auditing.

-- 1. PAYMENT GATEWAYS
CREATE TABLE IF NOT EXISTS payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  environment VARCHAR(20) DEFAULT 'sandbox',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  public_key VARCHAR(255),
  encrypted_secret_key TEXT,
  webhook_secret TEXT,
  merchant_account_id VARCHAR(100),
  supported_currencies TEXT[] DEFAULT ARRAY['USD', 'EUR', 'INR', 'GBP'],
  supported_countries TEXT[] DEFAULT ARRAY['US', 'IN', 'GB', 'CA', 'AU', 'EU'],
  transaction_fee_percent NUMERIC(5,2) DEFAULT 2.90,
  transaction_fee_fixed_cents INTEGER DEFAULT 30,
  min_amount_cents INTEGER DEFAULT 100,
  max_amount_cents INTEGER DEFAULT 10000000,
  is_default BOOLEAN DEFAULT false,
  health_status VARCHAR(20) DEFAULT 'healthy',
  last_health_check_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PAYMENT METHODS CATALOG
CREATE TABLE IF NOT EXISTS payment_methods_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  gateway_id UUID REFERENCES payment_gateways(id) ON DELETE SET NULL,
  supported_countries TEXT[] DEFAULT ARRAY['ALL'],
  supported_currencies TEXT[] DEFAULT ARRAY['USD', 'INR', 'EUR', 'GBP'],
  processing_fee_percent NUMERIC(5,2) DEFAULT 0.00,
  min_transaction_cents INTEGER DEFAULT 100,
  max_transaction_cents INTEGER DEFAULT 10000000,
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  customer_visible BOOLEAN DEFAULT true,
  seller_eligible BOOLEAN DEFAULT true,
  icon_name VARCHAR(50) DEFAULT 'credit-card',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FINANCE TRANSACTIONS
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference VARCHAR(60) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  gateway_id UUID REFERENCES payment_gateways(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES payment_methods_catalog(id) ON DELETE SET NULL,
  transaction_type VARCHAR(40) NOT NULL DEFAULT 'service_payment',
  gross_amount_cents INTEGER NOT NULL DEFAULT 0,
  discount_amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_amount_cents INTEGER NOT NULL DEFAULT 0,
  commission_amount_cents INTEGER NOT NULL DEFAULT 0,
  gateway_fee_cents INTEGER NOT NULL DEFAULT 0,
  seller_net_amount_cents INTEGER NOT NULL DEFAULT 0,
  platform_revenue_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  status VARCHAR(30) NOT NULL DEFAULT 'initiated',
  provider_reference VARCHAR(150),
  idempotency_key VARCHAR(100) UNIQUE,
  failure_code VARCHAR(50),
  failure_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMMISSION RULES
CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  rule_type VARCHAR(50) NOT NULL DEFAULT 'global',
  category_id UUID REFERENCES listing_categories(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_type VARCHAR(50),
  percentage_rate NUMERIC(6,3) DEFAULT 15.000,
  fixed_fee_cents INTEGER DEFAULT 0,
  min_commission_cents INTEGER DEFAULT 0,
  max_commission_cents INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMMISSION RECORDS (HISTORICAL)
CREATE TABLE IF NOT EXISTS finance_commission_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_reference VARCHAR(60) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES listing_categories(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES commission_rules(id) ON DELETE SET NULL,
  rule_name VARCHAR(120),
  transaction_type VARCHAR(50),
  gross_amount_cents INTEGER NOT NULL,
  commission_base_cents INTEGER NOT NULL,
  commission_rate NUMERIC(6,3) NOT NULL,
  commission_amount_cents INTEGER NOT NULL,
  gateway_fee_cents INTEGER DEFAULT 0,
  seller_net_amount_cents INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(30) DEFAULT 'finalized',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SELLER FINANCIAL ACCOUNTS (EARNINGS)
CREATE TABLE IF NOT EXISTS seller_financial_accounts (
  seller_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_gross_cents BIGINT DEFAULT 0,
  total_commission_cents BIGINT DEFAULT 0,
  total_gateway_fees_cents BIGINT DEFAULT 0,
  total_tax_withheld_cents BIGINT DEFAULT 0,
  pending_earnings_cents BIGINT DEFAULT 0,
  available_earnings_cents BIGINT DEFAULT 0,
  processing_payouts_cents BIGINT DEFAULT 0,
  paid_earnings_cents BIGINT DEFAULT 0,
  refund_adjustments_cents BIGINT DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  last_payout_date TIMESTAMPTZ,
  is_payout_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FINANCE PAYOUT REQUESTS
CREATE TABLE IF NOT EXISTS finance_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_reference VARCHAR(60) UNIQUE NOT NULL,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_amount_cents INTEGER NOT NULL,
  approved_amount_cents INTEGER DEFAULT 0,
  fee_cents INTEGER DEFAULT 0,
  net_payout_cents INTEGER DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  payout_method_type VARCHAR(50) DEFAULT 'bank_transfer',
  destination_details JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(30) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  failure_reason TEXT,
  provider_reference VARCHAR(150),
  idempotency_key VARCHAR(100) UNIQUE,
  internal_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FINANCE REFUNDS
CREATE TABLE IF NOT EXISTS finance_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_reference VARCHAR(60) UNIQUE NOT NULL,
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  original_amount_cents INTEGER NOT NULL,
  refund_amount_cents INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  refund_reason TEXT NOT NULL,
  refund_type VARCHAR(40) NOT NULL DEFAULT 'full',
  status VARCHAR(30) DEFAULT 'requested',
  provider_reference VARCHAR(150),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  internal_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TAX RULES
CREATE TABLE IF NOT EXISTS tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  tax_type VARCHAR(40) NOT NULL,
  tax_percentage NUMERIC(6,3) NOT NULL,
  country_code VARCHAR(5) NOT NULL,
  state_region VARCHAR(80),
  applicable_product_type VARCHAR(50) DEFAULT 'all',
  is_inclusive BOOLEAN DEFAULT false,
  tax_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FINANCE INVOICES
CREATE TABLE IF NOT EXISTS finance_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(30) DEFAULT 'issued',
  invoice_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  billing_details JSONB DEFAULT '{}'::jsonb,
  line_items JSONB DEFAULT '[]'::jsonb,
  pdf_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. FINANCIAL LEDGER JOURNALS & ENTRIES (DOUBLE-ENTRY)
CREATE TABLE IF NOT EXISTS financial_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_reference VARCHAR(60) UNIQUE NOT NULL,
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  payout_id UUID REFERENCES finance_payout_requests(id) ON DELETE SET NULL,
  refund_id UUID REFERENCES finance_refunds(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  total_debit_cents BIGINT NOT NULL,
  total_credit_cents BIGINT NOT NULL,
  is_balanced BOOLEAN DEFAULT true,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES financial_journals(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL,
  account_name VARCHAR(80) NOT NULL,
  account_type VARCHAR(30) NOT NULL,
  debit_cents INTEGER DEFAULT 0,
  credit_cents INTEGER DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. FINANCIAL RECONCILIATIONS
CREATE TABLE IF NOT EXISTS finance_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_reference VARCHAR(60) UNIQUE NOT NULL,
  gateway_id UUID REFERENCES payment_gateways(id) ON DELETE SET NULL,
  reconciliation_date DATE NOT NULL,
  gateway_statement_ref VARCHAR(100),
  system_gross_cents BIGINT NOT NULL,
  gateway_gross_cents BIGINT NOT NULL,
  difference_cents BIGINT NOT NULL DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  unmatched_count INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'matched',
  notes TEXT,
  reconciled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. FINANCIAL AUDIT LOGS
CREATE TABLE IF NOT EXISTS financial_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email VARCHAR(100),
  actor_role VARCHAR(50),
  action VARCHAR(60) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_finance_txns_ref ON finance_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_finance_txns_order ON finance_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_finance_txns_seller ON finance_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_finance_txns_customer ON finance_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_finance_txns_status ON finance_transactions(status);
CREATE INDEX IF NOT EXISTS idx_finance_txns_created ON finance_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commission_records_seller ON finance_commission_records(seller_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_order ON finance_commission_records(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_rule ON finance_commission_records(rule_id);

CREATE INDEX IF NOT EXISTS idx_payouts_seller ON finance_payout_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON finance_payout_requests(status);

CREATE INDEX IF NOT EXISTS idx_refunds_tx ON finance_refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON finance_refunds(status);

CREATE INDEX IF NOT EXISTS idx_invoices_num ON finance_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON finance_invoices(order_id);

CREATE INDEX IF NOT EXISTS idx_ledger_journal ON financial_ledger_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON financial_ledger_entries(account_id);

CREATE INDEX IF NOT EXISTS idx_fin_audit_entity ON financial_audit_logs(entity_type, entity_id);

-- RBAC PERMISSIONS INSERTION
INSERT INTO permissions (id, name, slug, description, resource, action, is_system, created_at)
VALUES
  (gen_random_uuid(), 'View Financial Transactions', 'finance.transactions.read', 'View all financial transactions', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Search Financial Transactions', 'finance.transactions.search', 'Search financial transactions', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Export Financial Transactions', 'finance.transactions.export', 'Export financial transactions', 'finance', 'EXPORT', true, NOW()),
  (gen_random_uuid(), 'View Financial Breakdown', 'finance.transactions.view_details', 'View financial transaction breakdown', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Reconcile Transactions', 'finance.transactions.reconcile', 'Reconcile transactions with gateway records', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'View Payment Methods', 'finance.payment_methods.read', 'View payment methods', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Create Payment Method', 'finance.payment_methods.create', 'Add payment method', 'finance', 'CREATE', true, NOW()),
  (gen_random_uuid(), 'Update Payment Method', 'finance.payment_methods.update', 'Update payment method', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Delete Payment Method', 'finance.payment_methods.delete', 'Delete payment method', 'finance', 'DELETE', true, NOW()),
  (gen_random_uuid(), 'Enable Payment Method', 'finance.payment_methods.enable', 'Enable payment method', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Disable Payment Method', 'finance.payment_methods.disable', 'Disable payment method', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'View Gateways', 'finance.gateways.read', 'View payment gateways', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Create Gateway', 'finance.gateways.create', 'Add payment gateway', 'finance', 'CREATE', true, NOW()),
  (gen_random_uuid(), 'Update Gateway', 'finance.gateways.update', 'Update payment gateway', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Configure Gateway', 'finance.gateways.configure', 'Configure payment gateway credentials', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Enable Gateway', 'finance.gateways.enable', 'Enable gateway', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Disable Gateway', 'finance.gateways.disable', 'Disable gateway', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Test Gateway', 'finance.gateways.test', 'Test gateway health & connectivity', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'View Commission Rules', 'finance.commissions.read', 'View commission rules', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Create Commission Rule', 'finance.commissions.create', 'Create commission rule', 'finance', 'CREATE', true, NOW()),
  (gen_random_uuid(), 'Update Commission Rule', 'finance.commissions.update', 'Update commission rule', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Delete Commission Rule', 'finance.commissions.delete', 'Delete commission rule', 'finance', 'DELETE', true, NOW()),
  (gen_random_uuid(), 'Manage Commission Rules', 'finance.commissions.manage_rules', 'Configure commission priority', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Export Commission History', 'finance.commissions.export', 'Export commission history', 'finance', 'EXPORT', true, NOW()),
  (gen_random_uuid(), 'View Seller Earnings', 'finance.earnings.read', 'View all seller earnings', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'View Seller Statement', 'finance.earnings.view_seller', 'View specific seller financial statement', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Export Seller Statement', 'finance.earnings.export', 'Export seller earnings statement', 'finance', 'EXPORT', true, NOW()),
  (gen_random_uuid(), 'View Payout Requests', 'finance.payouts.read', 'View payout requests', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Approve Payout Requests', 'finance.payouts.approve', 'Approve payout requests', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Reject Payout Requests', 'finance.payouts.reject', 'Reject payout requests', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Process Payouts', 'finance.payouts.process', 'Process authorized payouts', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Cancel Payouts', 'finance.payouts.cancel', 'Cancel pending payouts', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Export Payout Reports', 'finance.payouts.export', 'Export payout reports', 'finance', 'EXPORT', true, NOW()),
  (gen_random_uuid(), 'View Refunds', 'finance.refunds.read', 'View refund requests', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Create Refund', 'finance.refunds.create', 'Create refund request', 'finance', 'CREATE', true, NOW()),
  (gen_random_uuid(), 'Approve Refund', 'finance.refunds.approve', 'Approve refund request', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Reject Refund', 'finance.refunds.reject', 'Reject refund request', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Process Refund', 'finance.refunds.process', 'Process gateway refund', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'View Tax Rules', 'finance.tax.read', 'View tax rules', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Create Tax Rule', 'finance.tax.create', 'Create tax rule', 'finance', 'CREATE', true, NOW()),
  (gen_random_uuid(), 'Update Tax Rule', 'finance.tax.update', 'Update tax rule', 'finance', 'UPDATE', true, NOW()),
  (gen_random_uuid(), 'Delete Tax Rule', 'finance.tax.delete', 'Delete tax rule', 'finance', 'DELETE', true, NOW()),
  (gen_random_uuid(), 'View Invoices', 'finance.invoices.read', 'View invoices', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Create Invoice', 'finance.invoices.create', 'Create invoice', 'finance', 'CREATE', true, NOW()),
  (gen_random_uuid(), 'Download Invoice', 'finance.invoices.download', 'Download invoice PDF', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Export Invoices', 'finance.invoices.export', 'Export invoice records', 'finance', 'EXPORT', true, NOW()),
  (gen_random_uuid(), 'View Financial Reports', 'finance.reports.read', 'View financial KPI reports', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Generate Financial Reports', 'finance.reports.generate', 'Generate on-demand financial reports', 'finance', 'CREATE', true, NOW()),
  (gen_random_uuid(), 'Export Financial Reports', 'finance.reports.export', 'Export financial reports', 'finance', 'EXPORT', true, NOW()),
  (gen_random_uuid(), 'View Audit Logs', 'finance.audit.read', 'View financial audit logs', 'finance', 'READ', true, NOW()),
  (gen_random_uuid(), 'Export Audit Logs', 'finance.audit.export', 'Export financial audit logs', 'finance', 'EXPORT', true, NOW()),
  (gen_random_uuid(), 'View Financial Ledger', 'finance.ledger.read', 'View double-entry financial ledger', 'finance', 'READ', true, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Assign all permissions to superadmin and admin roles
INSERT INTO role_permissions (id, role_id, permission_id, assigned_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('superadmin', 'admin', 'manager')
  AND p.resource = 'finance'
ON CONFLICT DO NOTHING;
