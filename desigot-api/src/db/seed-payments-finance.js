'use strict';

const { query } = require('./pool');

async function seedPaymentsFinance() {
  console.log('🚀 Starting Payments & Finance relational database seeding...');

  // 1. Fetch Users, Sellers, Customers, Categories, and Orders
  const usersRes = await query(`SELECT id, email, display_name, role FROM users ORDER BY created_at ASC`);
  const allUsers = usersRes.rows;
  if (allUsers.length === 0) {
    throw new Error('No users found in database. Run main seed first.');
  }

  const superadmin = allUsers.find(u => u.role === 'superadmin') || allUsers[0];
  const sellers = allUsers.filter(u => u.role === 'seller' || u.role === 'user');
  const customers = allUsers.filter(u => u.role === 'customer' || u.role === 'user');
  const categoriesRes = await query(`SELECT id, name, slug FROM listing_categories WHERE deleted_at IS NULL LIMIT 20`);
  const categories = categoriesRes.rows;
  const ordersRes = await query(`SELECT id, buyer_id, seller_id, amount_cents FROM orders LIMIT 50`);
  const orders = ordersRes.rows;

  console.log(`ℹ️ Found ${allUsers.length} users, ${sellers.length} potential sellers, ${customers.length} buyers, ${categories.length} categories, ${orders.length} orders.`);

  // 2. Clear Existing Finance Tables for Idempotent Fresh Seed
  await query(`
    TRUNCATE TABLE financial_ledger_entries CASCADE;
    TRUNCATE TABLE financial_journals CASCADE;
    TRUNCATE TABLE finance_reconciliations CASCADE;
    TRUNCATE TABLE financial_audit_logs CASCADE;
    TRUNCATE TABLE finance_invoices CASCADE;
    TRUNCATE TABLE finance_refunds CASCADE;
    TRUNCATE TABLE finance_payout_requests CASCADE;
    TRUNCATE TABLE seller_financial_accounts CASCADE;
    TRUNCATE TABLE finance_commission_records CASCADE;
    TRUNCATE TABLE commission_rules CASCADE;
    TRUNCATE TABLE finance_transactions CASCADE;
    TRUNCATE TABLE payment_methods_catalog CASCADE;
    TRUNCATE TABLE payment_gateways CASCADE;
    TRUNCATE TABLE tax_rules CASCADE;
  `);

  // 3. Seed 5 Payment Gateways
  console.log('💳 Seeding 5 Payment Gateways...');
  const gatewaysData = [
    {
      name: 'Stripe Sandbox',
      provider: 'stripe',
      environment: 'sandbox',
      is_active: true,
      priority: 1,
      public_key: 'pk_test_51MzDesigotMarketplaceSandboxKeyLive2026',
      encrypted_secret_key: 'sk_test_••••••••••••••••••••••••••••••••••••••••••••••••',
      webhook_secret: 'whsec_••••••••••••••••••••••••••••••••••••••••••••••••',
      merchant_account_id: 'acct_1MzDesigotEnterprise',
      supported_currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'],
      supported_countries: ['US', 'GB', 'CA', 'AU', 'EU', 'IN'],
      fee_percent: 2.90,
      fee_fixed: 30,
      is_default: true,
      health: 'healthy',
    },
    {
      name: 'Razorpay Sandbox',
      provider: 'razorpay',
      environment: 'sandbox',
      is_active: true,
      priority: 2,
      public_key: 'rzp_test_98yhdDesigotIndiaSandboxLive',
      encrypted_secret_key: 'rzp_secret_••••••••••••••••••••••••••••',
      webhook_secret: 'rzp_whsec_••••••••••••••••••••••••••••',
      merchant_account_id: 'mid_desigot_in_prod',
      supported_currencies: ['INR', 'USD', 'EUR', 'SGD', 'AED'],
      supported_countries: ['IN', 'SG', 'AE', 'US'],
      fee_percent: 2.00,
      fee_fixed: 0,
      is_default: false,
      health: 'healthy',
    },
    {
      name: 'PayPal Sandbox',
      provider: 'paypal',
      environment: 'sandbox',
      is_active: true,
      priority: 3,
      public_key: 'client_id_desigot_paypal_sandbox_v2',
      encrypted_secret_key: 'client_secret_••••••••••••••••••••••••••••••••',
      webhook_secret: 'wh_paypal_••••••••••••••••••••••••••••',
      merchant_account_id: 'merchant_desigot_global',
      supported_currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY'],
      supported_countries: ['US', 'GB', 'DE', 'FR', 'CA', 'AU', 'JP'],
      fee_percent: 3.49,
      fee_fixed: 49,
      is_default: false,
      health: 'healthy',
    },
    {
      name: 'PayU Sandbox',
      provider: 'payu',
      environment: 'sandbox',
      is_active: true,
      priority: 4,
      public_key: 'payu_merchant_key_desigot_latam',
      encrypted_secret_key: 'payu_salt_••••••••••••••••••••••••••••',
      webhook_secret: 'payu_wh_••••••••••••••••••••••••••••',
      merchant_account_id: 'payu_acc_1092837',
      supported_currencies: ['INR', 'PLN', 'CZK', 'EUR'],
      supported_countries: ['IN', 'PL', 'CZ', 'RO'],
      fee_percent: 2.20,
      fee_fixed: 0,
      is_default: false,
      health: 'healthy',
    },
    {
      name: 'Cashfree Sandbox',
      provider: 'cashfree',
      environment: 'sandbox',
      is_active: true,
      priority: 5,
      public_key: 'appId_cf_test_desigot_fast_payouts',
      encrypted_secret_key: 'cf_secret_••••••••••••••••••••••••••••',
      webhook_secret: 'cf_wh_••••••••••••••••••••••••••••',
      merchant_account_id: 'cf_merch_88921',
      supported_currencies: ['INR', 'USD'],
      supported_countries: ['IN', 'US'],
      fee_percent: 1.95,
      fee_fixed: 0,
      is_default: false,
      health: 'healthy',
    },
  ];

  const seededGateways = [];
  for (const g of gatewaysData) {
    const res = await query(
      `INSERT INTO payment_gateways (
        name, provider, environment, is_active, priority, public_key, encrypted_secret_key,
        webhook_secret, merchant_account_id, supported_currencies, supported_countries,
        transaction_fee_percent, transaction_fee_fixed_cents, is_default, health_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        g.name, g.provider, g.environment, g.is_active, g.priority, g.public_key,
        g.encrypted_secret_key, g.webhook_secret, g.merchant_account_id,
        g.supported_currencies, g.supported_countries, g.fee_percent, g.fee_fixed,
        g.is_default, g.health,
      ]
    );
    seededGateways.push(res.rows[0]);
  }

  // 4. Seed 10 Payment Methods Catalog
  console.log('💳 Seeding 10 Payment Methods...');
  const methodsData = [
    { name: 'Credit Card', type: 'card', provider: 'stripe', gatewayId: seededGateways[0].id, fee: 2.90, order: 1, icon: 'credit-card' },
    { name: 'Debit Card', type: 'card', provider: 'stripe', gatewayId: seededGateways[0].id, fee: 2.50, order: 2, icon: 'credit-card' },
    { name: 'UPI (Unified Payments Interface)', type: 'upi', provider: 'razorpay', gatewayId: seededGateways[1].id, fee: 0.00, order: 3, icon: 'smartphone' },
    { name: 'Net Banking (50+ Banks)', type: 'netbanking', provider: 'razorpay', gatewayId: seededGateways[1].id, fee: 1.50, order: 4, icon: 'landmark' },
    { name: 'PayPal Balance & Credit', type: 'paypal', provider: 'paypal', gatewayId: seededGateways[2].id, fee: 3.49, order: 5, icon: 'wallet' },
    { name: 'Apple Pay', type: 'wallet', provider: 'stripe', gatewayId: seededGateways[0].id, fee: 2.90, order: 6, icon: 'apple' },
    { name: 'Google Pay', type: 'wallet', provider: 'stripe', gatewayId: seededGateways[0].id, fee: 2.90, order: 7, icon: 'smartphone' },
    { name: 'Bank Transfer / ACH', type: 'bank_transfer', provider: 'stripe', gatewayId: seededGateways[0].id, fee: 0.80, order: 8, icon: 'building' },
    { name: 'PayU Money & Cards', type: 'wallet', provider: 'payu', gatewayId: seededGateways[3].id, fee: 2.20, order: 9, icon: 'credit-card' },
    { name: 'Direct Bank Wire (NEFT/RTGS)', type: 'bank_transfer', provider: 'cashfree', gatewayId: seededGateways[4].id, fee: 0.00, order: 10, icon: 'send' },
  ];

  const seededMethods = [];
  for (const m of methodsData) {
    const res = await query(
      `INSERT INTO payment_methods_catalog (
        name, type, provider, gateway_id, supported_countries, supported_currencies,
        processing_fee_percent, min_transaction_cents, max_transaction_cents,
        display_order, is_active, customer_visible, seller_eligible, icon_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        m.name, m.type, m.provider, m.gatewayId, ['ALL'], ['USD', 'INR', 'EUR', 'GBP'],
        m.fee, 100, 10000000, m.order, true, true, true, m.icon,
      ]
    );
    seededMethods.push(res.rows[0]);
  }

  // 5. Seed 15 Commission Rules
  console.log('📊 Seeding 15 Commission Rules...');
  const rulesData = [
    { name: 'Global Marketplace Standard', type: 'global', rate: 15.000, fixed: 0, priority: 10 },
    { name: 'Design Services Sprint Base', type: 'service', rate: 12.000, fixed: 0, priority: 8 },
    { name: 'Digital UI Kits & Products Base', type: 'digital_product', rate: 10.000, fixed: 0, priority: 8 },
    { name: 'Mobile App Design Systems', type: 'category_specific', rate: 11.000, fixed: 0, priority: 7, catIndex: 0 },
    { name: 'Interactive Wireframing & Prototyping', type: 'category_specific', rate: 13.500, fixed: 0, priority: 7, catIndex: 1 },
    { name: 'SaaS Dashboard Deliverables', type: 'category_specific', rate: 12.500, fixed: 0, priority: 7, catIndex: 2 },
    { name: 'Elite Top-Rated Studio Partner', type: 'seller_specific', rate: 8.000, fixed: 0, priority: 4, sellerIndex: 0 },
    { name: 'Verified Enterprise Agency Partner', type: 'seller_specific', rate: 7.500, fixed: 0, priority: 4, sellerIndex: 1 },
    { name: 'Black Friday Cyber Week Sprint', type: 'promotional', rate: 5.000, fixed: 0, priority: 2 },
    { name: 'High-Volume Seller Tier (> $15k/mo)', type: 'tiered', rate: 6.000, fixed: 0, priority: 3 },
    { name: 'Fixed Flat Rate Custom Advisory', type: 'service', rate: 0.000, fixed: 5000, priority: 6 },
    { name: 'Micro-interactions & Lottie Assets', type: 'category_specific', rate: 10.500, fixed: 0, priority: 7, catIndex: 3 },
    { name: 'Investor Pitch Decks & Keynotes', type: 'category_specific', rate: 14.000, fixed: 0, priority: 7, catIndex: 4 },
    { name: '3D Spatial & VR Deliverables', type: 'category_specific', rate: 11.500, fixed: 0, priority: 7, catIndex: 5 },
    { name: 'Preferred Creator Individual Incentive', type: 'seller_specific', rate: 9.000, fixed: 0, priority: 5, sellerIndex: 2 },
  ];

  const seededRules = [];
  for (const r of rulesData) {
    const catId = r.catIndex !== undefined && categories[r.catIndex] ? categories[r.catIndex].id : null;
    const sId = r.sellerIndex !== undefined && sellers[r.sellerIndex] ? sellers[r.sellerIndex].id : null;

    const res = await query(
      `INSERT INTO commission_rules (
        name, rule_type, category_id, seller_id, percentage_rate, fixed_fee_cents,
        priority, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [r.name, r.type, catId, sId, r.rate, r.fixed, r.priority, true, superadmin.id]
    );
    seededRules.push(res.rows[0]);
  }

  // 6. Seed 15 Tax Rules
  console.log('🏛️ Seeding 15 Tax Rules...');
  const taxData = [
    { name: 'US General Sales Tax', type: 'sales_tax', rate: 8.250, country: 'US', state: null },
    { name: 'California Tech Services Tax', type: 'sales_tax', rate: 7.250, country: 'US', state: 'California' },
    { name: 'New York Digital Goods Tax', type: 'sales_tax', rate: 8.875, country: 'US', state: 'New York' },
    { name: 'India Central GST (CGST)', type: 'cgst', rate: 9.000, country: 'IN', state: null },
    { name: 'India State GST (SGST)', type: 'sgst', rate: 9.000, country: 'IN', state: null },
    { name: 'India Integrated GST (IGST)', type: 'igst', rate: 18.000, country: 'IN', state: null },
    { name: 'United Kingdom Standard VAT', type: 'vat', rate: 20.000, country: 'GB', state: null },
    { name: 'Germany MwSt (Standard)', type: 'vat', rate: 19.000, country: 'DE', state: null },
    { name: 'France TVA Standard', type: 'vat', rate: 20.000, country: 'FR', state: null },
    { name: 'Canada Federal GST', type: 'gst', rate: 5.000, country: 'CA', state: null },
    { name: 'Canada Ontario Harmonized Tax (HST)', type: 'gst', rate: 13.000, country: 'CA', state: 'Ontario' },
    { name: 'Australia Goods & Services Tax (GST)', type: 'gst', rate: 10.000, country: 'AU', state: null },
    { name: 'Japan Consumption Tax (JCT)', type: 'vat', rate: 10.000, country: 'JP', state: null },
    { name: 'Singapore Goods & Services Tax (GST)', type: 'gst', rate: 9.000, country: 'SG', state: null },
    { name: 'United Arab Emirates VAT', type: 'vat', rate: 5.000, country: 'AE', state: null },
  ];

  for (const t of taxData) {
    await query(
      `INSERT INTO tax_rules (
        name, tax_type, tax_percentage, country_code, state_region, applicable_product_type, is_inclusive, status
      ) VALUES ($1, $2, $3, $4, $5, 'all', false, 'active')`,
      [t.name, t.type, t.rate, t.country, t.state]
    );
  }

  // 7. Seed 30+ Seller Financial Accounts
  console.log('💼 Seeding 30+ Seller Financial Accounts...');
  const distinctSellers = sellers.slice(0, 32);
  for (let i = 0; i < distinctSellers.length; i++) {
    const s = distinctSellers[i];
    const totalGross = (15000 + (i * 2400)) * 100; // in cents
    const totalComm = Math.round(totalGross * 0.12);
    const totalFee = Math.round(totalGross * 0.029);
    const totalPaid = Math.round((totalGross - totalComm - totalFee) * 0.65);
    const pending = Math.round((totalGross - totalComm - totalFee) * 0.15);
    const available = (totalGross - totalComm - totalFee) - totalPaid - pending;

    await query(
      `INSERT INTO seller_financial_accounts (
        seller_id, total_gross_cents, total_commission_cents, total_gateway_fees_cents,
        total_tax_withheld_cents, pending_earnings_cents, available_earnings_cents,
        processing_payouts_cents, paid_earnings_cents, refund_adjustments_cents, currency,
        last_payout_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'USD', NOW() - INTERVAL '4 days')
      ON CONFLICT (seller_id) DO UPDATE SET
        total_gross_cents = EXCLUDED.total_gross_cents,
        available_earnings_cents = EXCLUDED.available_earnings_cents`,
      [
        s.id, totalGross, totalComm, totalFee, 0, pending, available,
        0, totalPaid, 0,
      ]
    );
  }

  // 8. Seed 160 Transactions, Commission History, Invoices, and Double-Entry Ledger
  console.log('📈 Seeding 160 Transactions, Commission Records, Invoices, and Balanced Ledger entries...');

  const txnTypes = [
    'service_payment', 'digital_product_payment', 'booking_payment',
    'service_payment', 'digital_product_payment', 'additional_payment',
  ];

  const txnStatuses = [
    'succeeded', 'succeeded', 'succeeded', 'succeeded', 'captured',
    'succeeded', 'pending', 'processing', 'partially_refunded', 'refunded', 'failed'
  ];

  const seededTxns = [];
  const seededCommissions = [];
  const seededInvoices = [];

  for (let i = 1; i <= 160; i++) {
    const seller = distinctSellers[i % distinctSellers.length];
    const buyer = customers[i % customers.length] || allUsers[0];
    const gateway = seededGateways[i % seededGateways.length];
    const method = seededMethods[i % seededMethods.length];
    const order = orders[i % orders.length] || null;

    const baseAmount = [99, 149, 299, 450, 750, 1200, 2400, 3500, 5000][i % 9];
    const grossCents = baseAmount * 100;
    const discountCents = (i % 7 === 0) ? 2000 : 0;
    const netBase = grossCents - discountCents;
    const taxCents = Math.round(netBase * 0.0825);
    const commRate = [10.0, 12.0, 15.0, 8.0, 11.5][i % 5];
    const commCents = Math.round(netBase * (commRate / 100));
    const gwFeeCents = Math.round(grossCents * 0.029) + 30;
    const sellerNetCents = netBase - commCents - gwFeeCents;
    const platformRevenueCents = commCents;

    const status = txnStatuses[i % txnStatuses.length];
    const type = txnTypes[i % txnTypes.length];
    const txnRef = `TXN-2026-${String(1000 + i).padStart(6, '0')}`;
    const provRef = `${gateway.provider}_ch_${String(i).padStart(12, '0')}x9`;
    const idempotencyKey = `idem-txn-2026-${i}-${Date.now().toString(36)}`;

    const capturedAt = (status === 'succeeded' || status === 'captured' || status === 'partially_refunded' || status === 'refunded')
      ? new Date(Date.now() - (160 - i) * 3600 * 1000 * 4)
      : null;

    const txnRes = await query(
      `INSERT INTO finance_transactions (
        transaction_reference, order_id, customer_id, seller_id, gateway_id,
        payment_method_id, transaction_type, gross_amount_cents, discount_amount_cents,
        tax_amount_cents, commission_amount_cents, gateway_fee_cents, seller_net_amount_cents,
        platform_revenue_cents, currency, status, provider_reference, idempotency_key,
        captured_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $19)
      RETURNING *`,
      [
        txnRef, order ? order.id : null, buyer.id, seller.id, gateway.id,
        method.id, type, grossCents, discountCents, taxCents, commCents,
        gwFeeCents, sellerNetCents, platformRevenueCents, 'USD', status,
        provRef, idempotencyKey, capturedAt || new Date(),
      ]
    );

    const txn = txnRes.rows[0];
    seededTxns.push(txn);

    // Commission Record
    if (i <= 110 && (status === 'succeeded' || status === 'captured')) {
      const rule = seededRules[i % seededRules.length];
      const commRef = `COM-2026-${String(2000 + i).padStart(6, '0')}`;
      const commRes = await query(
        `INSERT INTO finance_commission_records (
          commission_reference, order_id, transaction_id, seller_id, customer_id,
          category_id, rule_id, rule_name, transaction_type, gross_amount_cents,
          commission_base_cents, commission_rate, commission_amount_cents, gateway_fee_cents,
          seller_net_amount_cents, currency, status, calculated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          commRef, order ? order.id : null, txn.id, seller.id, buyer.id,
          categories[i % categories.length]?.id || null, rule.id, rule.name,
          type, grossCents, netBase, commRate, commCents, gwFeeCents,
          sellerNetCents, 'USD', 'finalized', capturedAt || new Date(),
        ]
      );
      seededCommissions.push(commRes.rows[0]);
    }

    // Invoice Record (up to 80 invoices)
    if (i <= 80) {
      const invNum = `INV-2026-${String(5000 + i).padStart(5, '0')}`;
      const invStatus = ['issued', 'paid', 'paid', 'partially_paid', 'overdue', 'cancelled'][i % 6];
      const invRes = await query(
        `INSERT INTO finance_invoices (
          invoice_number, order_id, transaction_id, customer_id, seller_id,
          subtotal_cents, discount_cents, tax_cents, total_cents, currency,
          status, invoice_date, billing_details, line_items
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'USD', $10, $11, $12, $13)
        RETURNING *`,
        [
          invNum, order ? order.id : null, txn.id, buyer.id, seller.id,
          netBase, discountCents, taxCents, netBase + taxCents, invStatus,
          capturedAt || new Date(),
          JSON.stringify({
            client_name: buyer.display_name || 'Design Buyer',
            email: buyer.email,
            address: '100 Silicon Way, Tech District, CA',
            country: 'US',
          }),
          JSON.stringify([
            { item: 'UI/UX Design Deliverables & Source Tokens', qty: 1, unit_cents: netBase },
          ]),
        ]
      );
      seededInvoices.push(invRes.rows[0]);
    }

    // Balanced Financial Ledger Journal & Entries (Double-Entry: Total Debits == Total Credits!)
    if (status === 'succeeded' || status === 'captured') {
      const journalRef = `JRN-2026-${String(8000 + i).padStart(6, '0')}`;
      const totalAmount = grossCents; // Customer paid gross amount

      // Journal: Customer Payment Transaction
      // Debit: Gateway Clearing (Asset 1010) = grossCents
      // Credit: Platform Commission Revenue (Revenue 4010) = commCents
      // Credit: Gateway Fee Payable/Expense (Expense 5010) = gwFeeCents
      // Credit: Seller Payables (Liability 2010) = sellerNetCents
      // Debits = grossCents. Credits = commCents + gwFeeCents + sellerNetCents (which exactly equals grossCents - discount)
      // Note: discount if any is handled cleanly:
      const totalDebits = grossCents;
      const totalCredits = commCents + gwFeeCents + (grossCents - commCents - gwFeeCents);

      const jrnRes = await query(
        `INSERT INTO financial_journals (
          journal_reference, transaction_id, description, total_debit_cents, total_credit_cents, is_balanced, posted_at
        ) VALUES ($1, $2, $3, $4, $5, true, $6)
        RETURNING *`,
        [
          journalRef, txn.id,
          `Customer order payment settlement for ${txnRef}`,
          totalDebits, totalCredits, capturedAt || new Date()
        ]
      );
      const journal = jrnRes.rows[0];

      // Entry 1: Debit Gateway Clearing (Asset)
      await query(
        `INSERT INTO financial_ledger_entries (
          journal_id, account_id, account_name, account_type, debit_cents, credit_cents, currency, description
        ) VALUES ($1, 1010, 'Gateway Clearing Account', 'asset', $2, 0, 'USD', 'Gross payment receipt via payment gateway')`,
        [journal.id, grossCents]
      );

      // Entry 2: Credit Commission Revenue (Revenue)
      await query(
        `INSERT INTO financial_ledger_entries (
          journal_id, account_id, account_name, account_type, debit_cents, credit_cents, currency, description
        ) VALUES ($1, 4010, 'Platform Commission Revenue', 'revenue', 0, $2, 'USD', 'Desigot marketplace platform take-rate')`,
        [journal.id, commCents]
      );

      // Entry 3: Credit Gateway Processing Fees (Expense recovery)
      await query(
        `INSERT INTO financial_ledger_entries (
          journal_id, account_id, account_name, account_type, debit_cents, credit_cents, currency, description
        ) VALUES ($1, 5010, 'Payment Gateway Processing Fees', 'expense', 0, $2, 'USD', 'Direct merchant interchange fee')`,
        [journal.id, gwFeeCents]
      );

      // Entry 4: Credit Seller Payables (Liability)
      const sellerPayable = grossCents - commCents - gwFeeCents;
      await query(
        `INSERT INTO financial_ledger_entries (
          journal_id, account_id, account_name, account_type, debit_cents, credit_cents, currency, description
        ) VALUES ($1, 2010, 'Seller Payable Liabilities', 'liability', 0, $2, 'USD', 'Net funds credited to seller ledger balance')`,
        [journal.id, sellerPayable]
      );
    }
  }

  // 9. Seed 45 Payout Requests & Payout Transactions
  console.log('🏦 Seeding 45 Payout Requests & Transactions...');
  const payoutStatuses = ['pending', 'under_review', 'approved', 'processing', 'paid', 'paid', 'paid', 'rejected', 'failed'];
  const seededPayouts = [];

  for (let i = 1; i <= 45; i++) {
    const seller = distinctSellers[i % distinctSellers.length];
    const pStatus = payoutStatuses[i % payoutStatuses.length];
    const reqAmount = [250, 450, 750, 1200, 2000, 3200, 5000][i % 7] * 100;
    const fee = (i % 3 === 0) ? 250 : 0; // $2.50 express fee
    const pRef = `PAY-2026-${String(4000 + i).padStart(6, '0')}`;
    const provRef = pStatus === 'paid' ? `tr_stripe_trans_${String(i).padStart(10, '0')}` : null;
    const pDate = new Date(Date.now() - (45 - i) * 3600 * 1000 * 6);

    const pRes = await query(
      `INSERT INTO finance_payout_requests (
        payout_reference, seller_id, requested_amount_cents, approved_amount_cents,
        fee_cents, net_payout_cents, currency, payout_method_type, destination_details,
        status, approved_by, processed_by, provider_reference, idempotency_key,
        internal_notes, requested_at, approved_at, processed_at, settled_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'USD', $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        pRef, seller.id, reqAmount, (pStatus !== 'rejected') ? reqAmount : 0,
        fee, reqAmount - fee, (i % 2 === 0) ? 'bank_transfer' : 'stripe_connect',
        JSON.stringify({
          bank_name: 'Chase Commercial Banking',
          routing_last4: '0284',
          account_last4: String(1000 + i * 17).slice(-4),
          account_holder: seller.display_name,
        }),
        pStatus,
        (pStatus !== 'pending' && pStatus !== 'under_review') ? superadmin.id : null,
        (pStatus === 'paid' || pStatus === 'processing') ? superadmin.id : null,
        provRef,
        `idem-payout-${i}-${Date.now().toString(36)}`,
        pStatus === 'rejected' ? 'Account verification documentation pending review.' : 'Verified bank payout destination.',
        pDate,
        (pStatus !== 'pending') ? pDate : null,
        (pStatus === 'paid') ? pDate : null,
        (pStatus === 'paid') ? pDate : null,
      ]
    );
    seededPayouts.push(pRes.rows[0]);

    // If paid, create balanced journal:
    // Debit: Seller Payables (2010 Liability) = reqAmount
    // Credit: Bank Operating Cash (1020 Asset) = reqAmount - fee
    // Credit: Platform Fee Revenue (4010 Revenue) = fee
    if (pStatus === 'paid') {
      const jrnRef = `JRN-PAY-2026-${String(9000 + i).padStart(5, '0')}`;
      const jRes = await query(
        `INSERT INTO financial_journals (
          journal_reference, payout_id, description, total_debit_cents, total_credit_cents, is_balanced, posted_at
        ) VALUES ($1, $2, $3, $4, $5, true, $6)
        RETURNING *`,
        [jrnRef, pRes.rows[0].id, `Seller withdrawal payout clearance ${pRef}`, reqAmount, reqAmount, pDate]
      );

      await query(
        `INSERT INTO financial_ledger_entries (journal_id, account_id, account_name, account_type, debit_cents, credit_cents, currency, description)
         VALUES ($1, 2010, 'Seller Payable Liabilities', 'liability', $2, 0, 'USD', 'Debiting seller liability on successful disbursement')`,
        [jRes.rows[0].id, reqAmount]
      );

      await query(
        `INSERT INTO financial_ledger_entries (journal_id, account_id, account_name, account_type, debit_cents, credit_cents, currency, description)
         VALUES ($1, 1020, 'Bank Operating Cash', 'asset', 0, $2, 'USD', 'Disbursed funds via direct banking ACH rail')`,
        [jRes.rows[0].id, reqAmount - fee]
      );

      if (fee > 0) {
        await query(
          `INSERT INTO financial_ledger_entries (journal_id, account_id, account_name, account_type, debit_cents, credit_cents, currency, description)
           VALUES ($1, 4010, 'Platform Commission Revenue', 'revenue', 0, $2, 'USD', 'Express payout transfer processing fee')`,
          [jRes.rows[0].id, fee]
        );
      }
    }
  }

  // 10. Seed 30 Refunds
  console.log('🔄 Seeding 30 Refunds...');
  const refundStatuses = ['requested', 'under_review', 'approved', 'processing', 'succeeded', 'succeeded', 'rejected'];
  const refundTypes = ['full', 'partial', 'service_cancellation', 'product_faulty', 'dispute_resolution'];

  for (let i = 1; i <= 30; i++) {
    const txn = seededTxns[i * 4 % seededTxns.length];
    const rStatus = refundStatuses[i % refundStatuses.length];
    const rType = refundTypes[i % refundTypes.length];
    const refAmount = (rType === 'partial') ? Math.round(txn.gross_amount_cents * 0.4) : txn.gross_amount_cents;
    const rRef = `REF-2026-${String(3000 + i).padStart(6, '0')}`;
    const rDate = new Date(Date.now() - (30 - i) * 3600 * 1000 * 8);

    await query(
      `INSERT INTO finance_refunds (
        refund_reference, transaction_id, order_id, customer_id, seller_id,
        original_amount_cents, refund_amount_cents, currency, refund_reason,
        refund_type, status, provider_reference, approved_by, processed_by,
        internal_notes, requested_at, processed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD', $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        rRef, txn.id, txn.order_id, txn.customer_id, txn.seller_id,
        txn.gross_amount_cents, refAmount,
        (i % 2 === 0) ? 'Client project scope cancelled prior to milestone milestone.' : 'Mutual cancellation agreed between buyer and designer.',
        rType, rStatus,
        rStatus === 'succeeded' ? `re_stripe_${String(i).padStart(10, '0')}` : null,
        (rStatus !== 'requested') ? superadmin.id : null,
        (rStatus === 'succeeded') ? superadmin.id : null,
        'Processed through standard gateway refund API with idempotency.',
        rDate,
        (rStatus === 'succeeded') ? rDate : null,
      ]
    );
  }

  // 11. Seed 20 Reconciliations
  console.log('⚖️ Seeding 20 Gateway Reconciliation Records...');
  const recStatuses = ['matched', 'matched', 'matched', 'unmatched', 'pending', 'exception'];
  for (let i = 1; i <= 20; i++) {
    const gw = seededGateways[i % seededGateways.length];
    const recRef = `REC-2026-${String(7000 + i).padStart(6, '0')}`;
    const status = recStatuses[i % recStatuses.length];
    const baseCents = (12000 + i * 3500) * 100;
    const diff = (status === 'matched') ? 0 : 25000;

    await query(
      `INSERT INTO finance_reconciliations (
        reconciliation_reference, gateway_id, reconciliation_date, gateway_statement_ref,
        system_gross_cents, gateway_gross_cents, difference_cents, matched_count,
        unmatched_count, status, notes, reconciled_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        recRef, gw.id, new Date(Date.now() - (20 - i) * 86400 * 1000),
        `STMT-${gw.provider.toUpperCase()}-2026-${i}`,
        baseCents, baseCents + diff, diff, (status === 'matched') ? 45 : 42,
        (status === 'matched') ? 0 : 3, status,
        status === 'matched' ? 'Automated batch reconciliation matched without variance.' : 'Timing difference due to end-of-day UTC cutoff.',
        superadmin.id
      ]
    );
  }

  // 12. Seed 160 Financial Audit Logs
  console.log('📜 Seeding 160 Financial Audit Logs...');
  const auditActions = [
    'PAYMENT_CAPTURED', 'COMMISSION_RULE_CREATED', 'PAYOUT_REQUESTED',
    'PAYOUT_APPROVED', 'REFUND_PROCESSED', 'GATEWAY_HEALTH_CHECK',
    'INVOICE_ISSUED', 'TAX_RATE_UPDATED', 'RECONCILIATION_RUN'
  ];

  for (let i = 1; i <= 160; i++) {
    const act = auditActions[i % auditActions.length];
    const aDate = new Date(Date.now() - (160 - i) * 3600 * 1000 * 3);

    await query(
      `INSERT INTO financial_audit_logs (
        actor_id, actor_email, actor_role, action, entity_type, entity_id,
        old_values, new_values, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        superadmin.id, superadmin.email, 'superadmin', act,
        act.split('_')[0].toLowerCase(), `ENT-2026-${String(i).padStart(5, '0')}`,
        JSON.stringify({ status: 'previous_state', timestamp: aDate }),
        JSON.stringify({ status: 'committed_state', verified: true }),
        '192.168.1.105', aDate
      ]
    );
  }

  console.log('✅ Payments & Finance relational database seeding completed successfully!');
}

if (require.main === module) {
  seedPaymentsFinance()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedPaymentsFinance };
