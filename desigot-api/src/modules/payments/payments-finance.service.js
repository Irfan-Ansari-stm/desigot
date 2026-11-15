'use strict';

const { query } = require('../../db/pool');
const { NotFoundError, ValidationError: BadRequestError } = require('../../shared/errors/AppError');

class PaymentsFinanceService {
  // ─── 1. OVERVIEW & KPI METRICS ───────────────────────────────────────────────
  async getOverviewStats() {
    const grossRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status IN ('succeeded', 'captured') THEN gross_amount_cents ELSE 0 END), 0) AS gross_sales_cents,
        COALESCE(SUM(CASE WHEN status IN ('succeeded', 'captured') THEN platform_revenue_cents ELSE 0 END), 0) AS platform_revenue_cents,
        COALESCE(SUM(CASE WHEN status IN ('succeeded', 'captured') THEN gateway_fee_cents ELSE 0 END), 0) AS gateway_fees_cents,
        COALESCE(SUM(CASE WHEN status IN ('succeeded', 'captured') THEN tax_amount_cents ELSE 0 END), 0) AS tax_collected_cents,
        COALESCE(SUM(CASE WHEN status IN ('succeeded', 'captured') THEN seller_net_amount_cents ELSE 0 END), 0) AS seller_earnings_cents,
        COUNT(*) AS total_transactions,
        COUNT(CASE WHEN status IN ('succeeded', 'captured') THEN 1 END) AS successful_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_transactions
      FROM finance_transactions
    `);

    const payoutRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' THEN requested_amount_cents ELSE 0 END), 0) AS total_payouts_cents,
        COALESCE(SUM(CASE WHEN status IN ('pending', 'under_review', 'approved') THEN requested_amount_cents ELSE 0 END), 0) AS pending_payouts_cents,
        COUNT(CASE WHEN status IN ('pending', 'under_review') THEN 1 END) AS pending_payout_requests
      FROM finance_payout_requests
    `);

    const refundRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN refund_amount_cents ELSE 0 END), 0) AS total_refunds_cents,
        COUNT(CASE WHEN status = 'requested' THEN 1 END) AS pending_refunds_count
      FROM finance_refunds
    `);

    const sellerBalanceRes = await query(`
      SELECT 
        COALESCE(SUM(available_earnings_cents), 0) AS outstanding_seller_balance_cents,
        COALESCE(SUM(pending_earnings_cents), 0) AS pending_escrow_cents
      FROM seller_financial_accounts
    `);

    const gwRes = await query(`SELECT COUNT(*) AS active_gateways FROM payment_gateways WHERE is_active = true`);
    const invRes = await query(`SELECT COUNT(*) AS total_invoices FROM finance_invoices`);

    const stats = grossRes.rows[0];
    const payouts = payoutRes.rows[0];
    const refunds = refundRes.rows[0];
    const balances = sellerBalanceRes.rows[0];

    return {
      gross_sales_cents: parseInt(stats.gross_sales_cents, 10),
      platform_revenue_cents: parseInt(stats.platform_revenue_cents, 10),
      net_platform_profit_cents: parseInt(stats.platform_revenue_cents, 10) - parseInt(stats.gateway_fees_cents, 10),
      gateway_fees_cents: parseInt(stats.gateway_fees_cents, 10),
      tax_collected_cents: parseInt(stats.tax_collected_cents, 10),
      seller_earnings_cents: parseInt(stats.seller_earnings_cents, 10),
      total_payouts_cents: parseInt(payouts.total_payouts_cents, 10),
      pending_payouts_cents: parseInt(payouts.pending_payouts_cents, 10),
      pending_payout_requests: parseInt(payouts.pending_payout_requests, 10),
      total_refunds_cents: parseInt(refunds.total_refunds_cents, 10),
      pending_refunds_count: parseInt(refunds.pending_refunds_count, 10),
      outstanding_seller_balance_cents: parseInt(balances.outstanding_seller_balance_cents, 10),
      pending_escrow_cents: parseInt(balances.pending_escrow_cents, 10),
      total_transactions: parseInt(stats.total_transactions, 10),
      successful_transactions: parseInt(stats.successful_transactions, 10),
      failed_transactions: parseInt(stats.failed_transactions, 10),
      success_rate: stats.total_transactions > 0
        ? parseFloat(((stats.successful_transactions / stats.total_transactions) * 100).toFixed(1))
        : 100.0,
      active_gateways: parseInt(gwRes.rows[0].active_gateways, 10),
      total_invoices: parseInt(invRes.rows[0].total_invoices, 10),
    };
  }

  // ─── 2. TRANSACTIONS ────────────────────────────────────────────────────────
  async listTransactions(filters = {}) {
    const {
      page = 1,
      limit = 15,
      search = '',
      status,
      type,
      gatewayId,
      currency,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filters;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(t.transaction_reference) LIKE $${pIdx} OR 
        LOWER(t.provider_reference) LIKE $${pIdx} OR
        LOWER(c.display_name) LIKE $${pIdx} OR 
        LOWER(c.email) LIKE $${pIdx} OR 
        LOWER(s.display_name) LIKE $${pIdx} OR 
        LOWER(s.email) LIKE $${pIdx}
      )`);
      pIdx++;
    }

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`t.status = $${pIdx++}`);
    }

    if (type && type !== 'all') {
      params.push(type);
      conditions.push(`t.transaction_type = $${pIdx++}`);
    }

    if (gatewayId && gatewayId !== 'all') {
      params.push(gatewayId);
      conditions.push(`t.gateway_id = $${pIdx++}`);
    }

    if (currency) {
      params.push(currency.toUpperCase());
      conditions.push(`t.currency = $${pIdx++}`);
    }

    if (startDate) {
      params.push(startDate);
      conditions.push(`t.created_at >= $${pIdx++}`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`t.created_at <= $${pIdx++}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) FROM finance_transactions t
       LEFT JOIN users c ON c.id = t.customer_id
       LEFT JOIN users s ON s.id = t.seller_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const safeSort = ['created_at', 'gross_amount_cents', 'status', 'transaction_reference'].includes(sortBy)
      ? sortBy
      : 'created_at';
    const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const dataRes = await query(
      `SELECT t.*,
              c.display_name AS customer_name,
              c.email AS customer_email,
              s.display_name AS seller_name,
              s.email AS seller_email,
              gw.name AS gateway_name,
              gw.provider AS gateway_provider,
              pm.name AS payment_method_name,
              pm.type AS payment_method_type,
              pm.icon_name AS payment_method_icon
       FROM finance_transactions t
       LEFT JOIN users c ON c.id = t.customer_id
       LEFT JOIN users s ON s.id = t.seller_id
       LEFT JOIN payment_gateways gw ON gw.id = t.gateway_id
       LEFT JOIN payment_methods_catalog pm ON pm.id = t.payment_method_id
       ${whereClause}
       ORDER BY t.${safeSort} ${safeOrder}
       LIMIT $${pIdx++} OFFSET $${pIdx}`,
      params
    );

    return {
      transactions: dataRes.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        total_pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  async getTransactionById(id) {
    const res = await query(
      `SELECT t.*,
              c.display_name AS customer_name,
              c.email AS customer_email,
              s.display_name AS seller_name,
              s.email AS seller_email,
              gw.name AS gateway_name,
              gw.provider AS gateway_provider,
              pm.name AS payment_method_name,
              pm.type AS payment_method_type,
              o.status AS order_status
       FROM finance_transactions t
       LEFT JOIN users c ON c.id = t.customer_id
       LEFT JOIN users s ON s.id = t.seller_id
       LEFT JOIN payment_gateways gw ON gw.id = t.gateway_id
       LEFT JOIN payment_methods_catalog pm ON pm.id = t.payment_method_id
       LEFT JOIN orders o ON o.id = t.order_id
       WHERE t.id::text = $1 OR t.transaction_reference = $1`,
      [String(id)]
    );

    if (res.rows.length === 0) throw new NotFoundError('Transaction');
    const transaction = res.rows[0];

    // Related refunds
    const refundsRes = await query(
      `SELECT * FROM finance_refunds WHERE transaction_id = $1 ORDER BY created_at DESC`,
      [transaction.id]
    );

    // Commission record
    const commRes = await query(
      `SELECT * FROM finance_commission_records WHERE transaction_id = $1 LIMIT 1`,
      [transaction.id]
    );

    // Ledger journals
    const ledgerRes = await query(
      `SELECT j.*, 
              json_agg(json_build_object(
                'id', e.id, 'account_id', e.account_id, 'account_name', e.account_name,
                'account_type', e.account_type, 'debit_cents', e.debit_cents, 'credit_cents', e.credit_cents
              )) AS entries
       FROM financial_journals j
       LEFT JOIN financial_ledger_entries e ON e.journal_id = j.id
       WHERE j.transaction_id = $1
       GROUP BY j.id`,
      [transaction.id]
    );

    // Audit logs
    const auditRes = await query(
      `SELECT * FROM financial_audit_logs WHERE entity_id = $1 OR entity_id = $2 ORDER BY created_at DESC`,
      [transaction.id, transaction.transaction_reference]
    );

    return {
      transaction,
      refunds: refundsRes.rows,
      commission: commRes.rows[0] || null,
      journals: ledgerRes.rows,
      audit_logs: auditRes.rows,
    };
  }

  // ─── 3. PAYMENT METHODS ─────────────────────────────────────────────────────
  async listPaymentMethods() {
    const res = await query(
      `SELECT pm.*, gw.name AS gateway_name, gw.provider AS gateway_provider
       FROM payment_methods_catalog pm
       LEFT JOIN payment_gateways gw ON gw.id = pm.gateway_id
       ORDER BY pm.display_order ASC, pm.name ASC`
    );
    return res.rows;
  }

  async createPaymentMethod(data, actor) {
    const {
      name, type, provider, gateway_id, supported_countries = ['ALL'],
      supported_currencies = ['USD'], processing_fee_percent = 0.00,
      min_transaction_cents = 100, max_transaction_cents = 10000000,
      display_order = 1, is_active = true, icon_name = 'credit-card'
    } = data;

    if (!name || !type || !provider) {
      throw new BadRequestError('Name, type, and provider are required');
    }

    const res = await query(
      `INSERT INTO payment_methods_catalog (
        name, type, provider, gateway_id, supported_countries, supported_currencies,
        processing_fee_percent, min_transaction_cents, max_transaction_cents,
        display_order, is_active, icon_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        name, type, provider, gateway_id || null, supported_countries, supported_currencies,
        processing_fee_percent, min_transaction_cents, max_transaction_cents,
        display_order, is_active, icon_name
      ]
    );

    await this.recordAudit(actor, 'PAYMENT_METHOD_CREATED', 'payment_method', res.rows[0].id, null, res.rows[0]);
    return res.rows[0];
  }

  async updatePaymentMethod(id, data, actor) {
    const prev = (await query(`SELECT * FROM payment_methods_catalog WHERE id = $1`, [id])).rows[0];
    if (!prev) throw new NotFoundError('Payment Method');

    const res = await query(
      `UPDATE payment_methods_catalog SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        gateway_id = COALESCE($3, gateway_id),
        processing_fee_percent = COALESCE($4, processing_fee_percent),
        min_transaction_cents = COALESCE($5, min_transaction_cents),
        max_transaction_cents = COALESCE($6, max_transaction_cents),
        display_order = COALESCE($7, display_order),
        is_active = COALESCE($8, is_active),
        customer_visible = COALESCE($9, customer_visible),
        seller_eligible = COALESCE($10, seller_eligible),
        icon_name = COALESCE($11, icon_name),
        updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        data.name, data.type, data.gateway_id, data.processing_fee_percent,
        data.min_transaction_cents, data.max_transaction_cents, data.display_order,
        data.is_active, data.customer_visible, data.seller_eligible, data.icon_name, id
      ]
    );

    await this.recordAudit(actor, 'PAYMENT_METHOD_UPDATED', 'payment_method', id, prev, res.rows[0]);
    return res.rows[0];
  }

  async togglePaymentMethod(id, activeState, actor) {
    const res = await query(
      `UPDATE payment_methods_catalog SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [activeState, id]
    );
    if (res.rows.length === 0) throw new NotFoundError('Payment Method');
    await this.recordAudit(actor, activeState ? 'PAYMENT_METHOD_ENABLED' : 'PAYMENT_METHOD_DISABLED', 'payment_method', id, null, { is_active: activeState });
    return res.rows[0];
  }

  // ─── 4. PAYMENT GATEWAYS ────────────────────────────────────────────────────
  async listGateways() {
    const res = await query(`
      SELECT id, name, provider, environment, is_active, priority, public_key,
             merchant_account_id, supported_currencies, supported_countries,
             transaction_fee_percent, transaction_fee_fixed_cents, min_amount_cents,
             max_amount_cents, is_default, health_status, last_health_check_at,
             created_at, updated_at
      FROM payment_gateways
      ORDER BY priority ASC, name ASC
    `);
    return res.rows;
  }

  async createGateway(data, actor) {
    const {
      name, provider, environment = 'sandbox', is_active = true, priority = 1,
      public_key, secret_key, webhook_secret, merchant_account_id,
      supported_currencies = ['USD'], supported_countries = ['US'],
      transaction_fee_percent = 2.90, transaction_fee_fixed_cents = 30,
      is_default = false
    } = data;

    if (!name || !provider) throw new BadRequestError('Name and provider are required');

    const res = await query(
      `INSERT INTO payment_gateways (
        name, provider, environment, is_active, priority, public_key, encrypted_secret_key,
        webhook_secret, merchant_account_id, supported_currencies, supported_countries,
        transaction_fee_percent, transaction_fee_fixed_cents, is_default, health_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'healthy')
      RETURNING id, name, provider, environment, is_active, priority, public_key, merchant_account_id, health_status`,
      [
        name, provider, environment, is_active, priority, public_key,
        secret_key ? 'enc_key_••••••••' : null,
        webhook_secret ? 'whsec_••••••••' : null,
        merchant_account_id, supported_currencies, supported_countries,
        transaction_fee_percent, transaction_fee_fixed_cents, is_default
      ]
    );

    await this.recordAudit(actor, 'GATEWAY_CREATED', 'payment_gateway', res.rows[0].id, null, res.rows[0]);
    return res.rows[0];
  }

  async updateGateway(id, data, actor) {
    const prev = (await query(`SELECT * FROM payment_gateways WHERE id = $1`, [id])).rows[0];
    if (!prev) throw new NotFoundError('Gateway');

    const res = await query(
      `UPDATE payment_gateways SET
        name = COALESCE($1, name),
        environment = COALESCE($2, environment),
        is_active = COALESCE($3, is_active),
        priority = COALESCE($4, priority),
        public_key = COALESCE($5, public_key),
        merchant_account_id = COALESCE($6, merchant_account_id),
        transaction_fee_percent = COALESCE($7, transaction_fee_percent),
        transaction_fee_fixed_cents = COALESCE($8, transaction_fee_fixed_cents),
        is_default = COALESCE($9, is_default),
        updated_at = NOW()
       WHERE id = $10
       RETURNING id, name, provider, environment, is_active, priority, public_key, merchant_account_id, health_status, updated_at`,
      [
        data.name, data.environment, data.is_active, data.priority,
        data.public_key, data.merchant_account_id, data.transaction_fee_percent,
        data.transaction_fee_fixed_cents, data.is_default, id
      ]
    );

    await this.recordAudit(actor, 'GATEWAY_UPDATED', 'payment_gateway', id, prev, res.rows[0]);
    return res.rows[0];
  }

  async testGateway(id, actor) {
    const gw = (await query(`SELECT * FROM payment_gateways WHERE id = $1`, [id])).rows[0];
    if (!gw) throw new NotFoundError('Gateway');

    // Perform sandbox API ping simulation
    const latencyMs = Math.floor(Math.random() * 80) + 40;
    const isHealthy = true;

    await query(
      `UPDATE payment_gateways SET health_status = 'healthy', last_health_check_at = NOW() WHERE id = $1`,
      [id]
    );

    await this.recordAudit(actor, 'GATEWAY_HEALTH_CHECK', 'payment_gateway', id, null, { status: 'healthy', latencyMs });

    return {
      success: true,
      gateway: gw.name,
      provider: gw.provider,
      environment: gw.environment,
      latency_ms: latencyMs,
      health_status: 'healthy',
      checked_at: new Date().toISOString(),
    };
  }

  // ─── 5. COMMISSION RULES & HISTORY ──────────────────────────────────────────
  async listCommissionRules() {
    const res = await query(`
      SELECT r.*, c.name AS category_name, u.display_name AS seller_name
      FROM commission_rules r
      LEFT JOIN listing_categories c ON c.id = r.category_id
      LEFT JOIN users u ON u.id = r.seller_id
      ORDER BY r.priority ASC, r.created_at DESC
    `);
    return res.rows;
  }

  async createCommissionRule(data, actor) {
    const {
      name, rule_type = 'global', category_id, seller_id, product_type,
      percentage_rate = 15.0, fixed_fee_cents = 0, priority = 10,
      min_commission_cents = 0, max_commission_cents = 0
    } = data;

    if (!name) throw new BadRequestError('Rule name is required');

    const res = await query(
      `INSERT INTO commission_rules (
        name, rule_type, category_id, seller_id, product_type, percentage_rate,
        fixed_fee_cents, priority, min_commission_cents, max_commission_cents,
        is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
      RETURNING *`,
      [
        name, rule_type, category_id || null, seller_id || null, product_type || null,
        percentage_rate, fixed_fee_cents, priority, min_commission_cents,
        max_commission_cents, actor.id
      ]
    );

    await this.recordAudit(actor, 'COMMISSION_RULE_CREATED', 'commission_rule', res.rows[0].id, null, res.rows[0]);
    return res.rows[0];
  }

  async listCommissionHistory(filters = {}) {
    const { page = 1, limit = 15, search = '', sellerId } = filters;
    const params = [];
    const conditions = [];
    let pIdx = 1;

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(cr.commission_reference) LIKE $${pIdx} OR 
        LOWER(cr.rule_name) LIKE $${pIdx} OR 
        LOWER(s.display_name) LIKE $${pIdx}
      )`);
      pIdx++;
    }

    if (sellerId) {
      params.push(sellerId);
      conditions.push(`cr.seller_id = $${pIdx++}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT COUNT(*) FROM finance_commission_records cr LEFT JOIN users s ON s.id = cr.seller_id ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const dataRes = await query(
      `SELECT cr.*, s.display_name AS seller_name, s.email AS seller_email, c.display_name AS customer_name
       FROM finance_commission_records cr
       LEFT JOIN users s ON s.id = cr.seller_id
       LEFT JOIN users c ON c.id = cr.customer_id
       ${whereClause}
       ORDER BY cr.calculated_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx}`,
      params
    );

    return {
      commissions: dataRes.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        total_pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  // ─── 6. SELLER EARNINGS ─────────────────────────────────────────────────────
  async listSellerEarnings(filters = {}) {
    const { page = 1, limit = 15, search = '' } = filters;
    const params = [];
    let whereClause = '';

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      whereClause = `WHERE LOWER(u.display_name) LIKE $1 OR LOWER(u.email) LIKE $1`;
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM seller_financial_accounts sfa JOIN users u ON u.id = sfa.seller_id ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const dataRes = await query(
      `SELECT sfa.*, u.display_name AS seller_name, u.email AS seller_email, u.avatar_url
       FROM seller_financial_accounts sfa
       JOIN users u ON u.id = sfa.seller_id
       ${whereClause}
       ORDER BY sfa.total_gross_cents DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      sellers: dataRes.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        total_pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  async getSellerStatement(sellerId) {
    const account = (await query(
      `SELECT sfa.*, u.display_name AS seller_name, u.email AS seller_email
       FROM seller_financial_accounts sfa
       JOIN users u ON u.id = sfa.seller_id
       WHERE sfa.seller_id = $1`,
      [sellerId]
    )).rows[0];

    if (!account) throw new NotFoundError('Seller Financial Account');

    const txns = (await query(
      `SELECT * FROM finance_transactions WHERE seller_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [sellerId]
    )).rows;

    const payouts = (await query(
      `SELECT * FROM finance_payout_requests WHERE seller_id = $1 ORDER BY created_at DESC LIMIT 15`,
      [sellerId]
    )).rows;

    return { account, recent_transactions: txns, recent_payouts: payouts };
  }

  // ─── 7. PAYOUT REQUESTS & PROCESSING ────────────────────────────────────────
  async listPayoutRequests(filters = {}) {
    const { page = 1, limit = 15, search = '', status } = filters;
    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(p.payout_reference) LIKE $${pIdx} OR 
        LOWER(s.display_name) LIKE $${pIdx} OR 
        LOWER(s.email) LIKE $${pIdx}
      )`);
      pIdx++;
    }

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`p.status = $${pIdx++}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT COUNT(*) FROM finance_payout_requests p JOIN users s ON s.id = p.seller_id ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const dataRes = await query(
      `SELECT p.*, s.display_name AS seller_name, s.email AS seller_email,
              u_app.display_name AS approved_by_name,
              u_proc.display_name AS processed_by_name
       FROM finance_payout_requests p
       JOIN users s ON s.id = p.seller_id
       LEFT JOIN users u_app ON u_app.id = p.approved_by
       LEFT JOIN users u_proc ON u_proc.id = p.processed_by
       ${whereClause}
       ORDER BY p.requested_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx}`,
      params
    );

    return {
      payouts: dataRes.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        total_pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  async approvePayout(id, actor) {
    const prev = (await query(`SELECT * FROM finance_payout_requests WHERE id = $1`, [id])).rows[0];
    if (!prev) throw new NotFoundError('Payout Request');
    if (prev.status !== 'pending' && prev.status !== 'under_review') {
      throw new BadRequestError(`Cannot approve payout in '${prev.status}' state`);
    }

    const res = await query(
      `UPDATE finance_payout_requests SET
        status = 'approved',
        approved_by = $1,
        approved_at = NOW(),
        approved_amount_cents = requested_amount_cents,
        net_payout_cents = requested_amount_cents - fee_cents,
        updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [actor.id, id]
    );

    await this.recordAudit(actor, 'PAYOUT_APPROVED', 'payout_request', id, prev, res.rows[0]);
    return res.rows[0];
  }

  async rejectPayout(id, reason, actor) {
    const prev = (await query(`SELECT * FROM finance_payout_requests WHERE id = $1`, [id])).rows[0];
    if (!prev) throw new NotFoundError('Payout Request');

    const res = await query(
      `UPDATE finance_payout_requests SET
        status = 'rejected',
        rejected_by = $1,
        rejection_reason = $2,
        updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [actor.id, reason || 'Rejected by compliance administrator', id]
    );

    await this.recordAudit(actor, 'PAYOUT_REJECTED', 'payout_request', id, prev, res.rows[0]);
    return res.rows[0];
  }

  async processPayout(id, actor) {
    const prev = (await query(`SELECT * FROM finance_payout_requests WHERE id = $1`, [id])).rows[0];
    if (!prev) throw new NotFoundError('Payout Request');
    if (prev.status !== 'approved') {
      throw new BadRequestError('Only approved payouts can be processed to settlement rail');
    }

    const provRef = `tr_live_disburse_${Date.now().toString(36)}`;
    const res = await query(
      `UPDATE finance_payout_requests SET
        status = 'paid',
        processed_by = $1,
        processed_at = NOW(),
        settled_at = NOW(),
        provider_reference = $2,
        updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [actor.id, provRef, id]
    );

    // Record double-entry balanced journal entry:
    const jrnRef = `JRN-PAY-${Date.now().toString(36).toUpperCase()}`;
    const reqAmount = prev.requested_amount_cents;
    const fee = prev.fee_cents || 0;

    const jRes = await query(
      `INSERT INTO financial_journals (
        journal_reference, payout_id, description, total_debit_cents, total_credit_cents, is_balanced, posted_at
      ) VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING *`,
      [jrnRef, id, `Disbursement of payout ${prev.payout_reference}`, reqAmount, reqAmount]
    );

    await query(
      `INSERT INTO financial_ledger_entries (journal_id, account_id, account_name, account_type, debit_cents, credit_cents, currency, description)
       VALUES ($1, 2010, 'Seller Payable Liabilities', 'liability', $2, 0, 'USD', 'Debiting seller liability for approved payout')`,
      [jRes.rows[0].id, reqAmount]
    );

    await query(
      `INSERT INTO financial_ledger_entries (journal_id, account_id, account_name, account_type, debit_cents, credit_cents, currency, description)
       VALUES ($1, 1020, 'Bank Operating Cash', 'asset', 0, $2, 'USD', 'Credit bank operating cash via automated payout processor')`,
      [jRes.rows[0].id, reqAmount - fee]
    );

    if (fee > 0) {
      await query(
        `INSERT INTO financial_ledger_entries (journal_id, account_id, account_name, account_type, debit_cents, credit_cents, currency, description)
         VALUES ($1, 4010, 'Platform Commission Revenue', 'revenue', 0, $2, 'USD', 'Express disbursement transaction fee')`,
        [jRes.rows[0].id, fee]
      );
    }

    // Deduct from seller financial account available balance
    await query(
      `UPDATE seller_financial_accounts SET
        available_earnings_cents = GREATEST(0, available_earnings_cents - $1),
        paid_earnings_cents = paid_earnings_cents + $1,
        last_payout_date = NOW(),
        updated_at = NOW()
       WHERE seller_id = $2`,
      [reqAmount, prev.seller_id]
    );

    await this.recordAudit(actor, 'PAYOUT_PROCESSED', 'payout_request', id, prev, res.rows[0]);
    return res.rows[0];
  }

  // ─── 8. REFUNDS ─────────────────────────────────────────────────────────────
  async listRefunds(filters = {}) {
    const { page = 1, limit = 15, search = '', status } = filters;
    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(r.refund_reference) LIKE $${pIdx} OR 
        LOWER(c.display_name) LIKE $${pIdx} OR 
        LOWER(s.display_name) LIKE $${pIdx}
      )`);
      pIdx++;
    }

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`r.status = $${pIdx++}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT COUNT(*) FROM finance_refunds r
       LEFT JOIN users c ON c.id = r.customer_id
       LEFT JOIN users s ON s.id = r.seller_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const dataRes = await query(
      `SELECT r.*, c.display_name AS customer_name, c.email AS customer_email,
              s.display_name AS seller_name, s.email AS seller_email,
              t.transaction_reference, t.provider_reference AS txn_provider_ref
       FROM finance_refunds r
       LEFT JOIN users c ON c.id = r.customer_id
       LEFT JOIN users s ON s.id = r.seller_id
       LEFT JOIN finance_transactions t ON t.id = r.transaction_id
       ${whereClause}
       ORDER BY r.requested_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx}`,
      params
    );

    return {
      refunds: dataRes.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        total_pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  async processRefund(id, actor) {
    const prev = (await query(`SELECT * FROM finance_refunds WHERE id = $1`, [id])).rows[0];
    if (!prev) throw new NotFoundError('Refund Request');

    const provRef = `re_gw_${Date.now().toString(36)}`;
    const res = await query(
      `UPDATE finance_refunds SET
        status = 'succeeded',
        processed_by = $1,
        processed_at = NOW(),
        provider_reference = $2,
        updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [actor.id, provRef, id]
    );

    // Update original transaction status to refunded or partially_refunded
    if (prev.transaction_id) {
      await query(
        `UPDATE finance_transactions SET status = 'refunded', updated_at = NOW() WHERE id = $1`,
        [prev.transaction_id]
      );
    }

    await this.recordAudit(actor, 'REFUND_PROCESSED', 'refund', id, prev, res.rows[0]);
    return res.rows[0];
  }

  // ─── 9. TAX RULES ───────────────────────────────────────────────────────────
  async listTaxRules() {
    const res = await query(`SELECT * FROM tax_rules ORDER BY country_code ASC, name ASC`);
    return res.rows;
  }

  async createTaxRule(data, actor) {
    const { name, tax_type, tax_percentage, country_code, state_region, is_inclusive = false } = data;
    if (!name || !tax_type || tax_percentage === undefined || !country_code) {
      throw new BadRequestError('Name, tax type, percentage, and country are required');
    }

    const res = await query(
      `INSERT INTO tax_rules (
        name, tax_type, tax_percentage, country_code, state_region, is_inclusive, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *`,
      [name, tax_type, tax_percentage, country_code, state_region || null, is_inclusive]
    );

    await this.recordAudit(actor, 'TAX_RULE_CREATED', 'tax_rule', res.rows[0].id, null, res.rows[0]);
    return res.rows[0];
  }

  async deleteTaxRule(id, actor) {
    const prev = (await query(`SELECT * FROM tax_rules WHERE id = $1`, [id])).rows[0];
    if (!prev) throw new NotFoundError('Tax Rule');
    await query(`DELETE FROM tax_rules WHERE id = $1`, [id]);
    await this.recordAudit(actor, 'TAX_RULE_DELETED', 'tax_rule', id, prev, null);
    return { success: true };
  }

  // ─── 10. INVOICES ───────────────────────────────────────────────────────────
  async listInvoices(filters = {}) {
    const { page = 1, limit = 15, search = '', status } = filters;
    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(inv.invoice_number) LIKE $${pIdx} OR 
        LOWER(c.display_name) LIKE $${pIdx} OR 
        LOWER(s.display_name) LIKE $${pIdx}
      )`);
      pIdx++;
    }

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`inv.status = $${pIdx++}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT COUNT(*) FROM finance_invoices inv
       LEFT JOIN users c ON c.id = inv.customer_id
       LEFT JOIN users s ON s.id = inv.seller_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const dataRes = await query(
      `SELECT inv.*, c.display_name AS customer_name, c.email AS customer_email,
              s.display_name AS seller_name, s.email AS seller_email
       FROM finance_invoices inv
       LEFT JOIN users c ON c.id = inv.customer_id
       LEFT JOIN users s ON s.id = inv.seller_id
       ${whereClause}
       ORDER BY inv.invoice_date DESC
       LIMIT $${pIdx++} OFFSET $${pIdx}`,
      params
    );

    return {
      invoices: dataRes.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        total_pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  async getInvoiceById(id) {
    const res = await query(
      `SELECT inv.*, c.display_name AS customer_name, c.email AS customer_email,
              s.display_name AS seller_name, s.email AS seller_email,
              t.transaction_reference, t.provider_reference
       FROM finance_invoices inv
       LEFT JOIN users c ON c.id = inv.customer_id
       LEFT JOIN users s ON s.id = inv.seller_id
       LEFT JOIN finance_transactions t ON t.id = inv.transaction_id
       WHERE inv.id::text = $1 OR inv.invoice_number = $1`,
      [String(id)]
    );

    if (res.rows.length === 0) throw new NotFoundError('Invoice');
    return res.rows[0];
  }

  // ─── 11. FINANCIAL LEDGER & DOUBLE-ENTRY ACCOUNTS ───────────────────────────
  async getLedgerSummary() {
    const accountsRes = await query(`
      SELECT account_id, account_name, account_type,
             SUM(debit_cents) AS total_debit_cents,
             SUM(credit_cents) AS total_credit_cents,
             COUNT(*) AS entry_count
      FROM financial_ledger_entries
      GROUP BY account_id, account_name, account_type
      ORDER BY account_id ASC
    `);

    const balanceCheck = await query(`
      SELECT SUM(total_debit_cents) AS total_debits,
             SUM(total_credit_cents) AS total_credits,
             COUNT(*) AS total_journals,
             BOOL_AND(is_balanced) AS is_all_balanced
      FROM financial_journals
    `);

    return {
      accounts: accountsRes.rows,
      trial_balance: balanceCheck.rows[0],
    };
  }

  async listJournals(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const countRes = await query(`SELECT COUNT(*) FROM financial_journals`);
    const total = parseInt(countRes.rows[0].count, 10);

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const dataRes = await query(
      `SELECT j.*,
              json_agg(json_build_object(
                'account_id', e.account_id, 'account_name', e.account_name,
                'account_type', e.account_type, 'debit_cents', e.debit_cents, 'credit_cents', e.credit_cents
              )) AS entries
       FROM financial_journals j
       LEFT JOIN financial_ledger_entries e ON e.journal_id = j.id
       GROUP BY j.id
       ORDER BY j.posted_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit, 10), offset]
    );

    return {
      journals: dataRes.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        total_pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  // ─── 12. RECONCILIATIONS ───────────────────────────────────────────────────
  async listReconciliations() {
    const res = await query(`
      SELECT r.*, gw.name AS gateway_name, gw.provider AS gateway_provider,
             u.display_name AS reconciled_by_name
      FROM finance_reconciliations r
      LEFT JOIN payment_gateways gw ON gw.id = r.gateway_id
      LEFT JOIN users u ON u.id = r.reconciled_by
      ORDER BY r.reconciliation_date DESC
    `);
    return res.rows;
  }

  // ─── 13. AUDIT LOGGER HELPER ───────────────────────────────────────────────
  async recordAudit(actor, action, entityType, entityId, oldValues, newValues) {
    try {
      await query(
        `INSERT INTO financial_audit_logs (
          actor_id, actor_email, actor_role, action, entity_type, entity_id,
          old_values, new_values, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '127.0.0.1')`,
        [
          actor?.id || null,
          actor?.email || 'system@desigot.com',
          actor?.role || 'system',
          action,
          entityType,
          String(entityId),
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
        ]
      );
    } catch (e) {
      console.error('Failed to write financial audit log:', e.message);
    }
  }
}

module.exports = new PaymentsFinanceService();
