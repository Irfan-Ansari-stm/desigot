'use strict';

const express = require('express');
const router = express.Router();
const financeService = require('./payments-finance.service');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');

// Protect all finance admin endpoints
router.use(authenticate);

// ─── OVERVIEW & STATS ─────────────────────────────────────────────────────────
router.get('/stats', requirePermission('finance.reports.read'), async (req, res, next) => {
  try {
    const stats = await financeService.getOverviewStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

router.get('/reports/overview', requirePermission('finance.reports.read'), async (req, res, next) => {
  try {
    const stats = await financeService.getOverviewStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────
router.get('/transactions', requirePermission('finance.transactions.read'), async (req, res, next) => {
  try {
    const result = await financeService.listTransactions(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/transactions/export', requirePermission('finance.transactions.export'), async (req, res, next) => {
  try {
    const result = await financeService.listTransactions({ limit: 500 });
    const txns = result.transactions;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="desigot_finance_transactions.csv"');

    const headers = ['Transaction Ref', 'Provider Ref', 'Customer', 'Seller', 'Type', 'Gross Cents', 'Commission Cents', 'Fee Cents', 'Seller Net Cents', 'Currency', 'Status', 'Date'];
    res.write(headers.join(',') + '\n');

    txns.forEach((t) => {
      const row = [
        t.transaction_reference,
        t.provider_reference || '',
        `"${(t.customer_name || '').replace(/"/g, '""')}"`,
        `"${(t.seller_name || '').replace(/"/g, '""')}"`,
        t.transaction_type,
        t.gross_amount_cents,
        t.commission_amount_cents,
        t.gateway_fee_cents,
        t.seller_net_amount_cents,
        t.currency,
        t.status,
        t.created_at,
      ];
      res.write(row.join(',') + '\n');
    });

    res.end();
  } catch (err) {
    next(err);
  }
});

router.get('/transactions/:id', requirePermission('finance.transactions.read'), async (req, res, next) => {
  try {
    const txn = await financeService.getTransactionById(req.params.id);
    res.json({ success: true, data: txn });
  } catch (err) {
    next(err);
  }
});

// ─── PAYMENT METHODS ─────────────────────────────────────────────────────────
router.get('/payment-methods', requirePermission('finance.payment_methods.read'), async (req, res, next) => {
  try {
    const methods = await financeService.listPaymentMethods();
    res.json({ success: true, data: methods });
  } catch (err) {
    next(err);
  }
});

router.post('/payment-methods', requirePermission('finance.payment_methods.create'), async (req, res, next) => {
  try {
    const method = await financeService.createPaymentMethod(req.body, req.user);
    res.status(201).json({ success: true, data: method });
  } catch (err) {
    next(err);
  }
});

router.put('/payment-methods/:id', requirePermission('finance.payment_methods.update'), async (req, res, next) => {
  try {
    const method = await financeService.updatePaymentMethod(req.params.id, req.body, req.user);
    res.json({ success: true, data: method });
  } catch (err) {
    next(err);
  }
});

router.post('/payment-methods/:id/enable', requirePermission('finance.payment_methods.enable'), async (req, res, next) => {
  try {
    const method = await financeService.togglePaymentMethod(req.params.id, true, req.user);
    res.json({ success: true, data: method });
  } catch (err) {
    next(err);
  }
});

router.post('/payment-methods/:id/disable', requirePermission('finance.payment_methods.disable'), async (req, res, next) => {
  try {
    const method = await financeService.togglePaymentMethod(req.params.id, false, req.user);
    res.json({ success: true, data: method });
  } catch (err) {
    next(err);
  }
});

// ─── PAYMENT GATEWAYS ────────────────────────────────────────────────────────
router.get('/gateways', requirePermission('finance.gateways.read'), async (req, res, next) => {
  try {
    const gateways = await financeService.listGateways();
    res.json({ success: true, data: gateways });
  } catch (err) {
    next(err);
  }
});

router.post('/gateways', requirePermission('finance.gateways.create'), async (req, res, next) => {
  try {
    const gateway = await financeService.createGateway(req.body, req.user);
    res.status(201).json({ success: true, data: gateway });
  } catch (err) {
    next(err);
  }
});

router.put('/gateways/:id', requirePermission('finance.gateways.update'), async (req, res, next) => {
  try {
    const gateway = await financeService.updateGateway(req.params.id, req.body, req.user);
    res.json({ success: true, data: gateway });
  } catch (err) {
    next(err);
  }
});

router.post('/gateways/:id/test', requirePermission('finance.gateways.test'), async (req, res, next) => {
  try {
    const result = await financeService.testGateway(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ─── COMMISSIONS ─────────────────────────────────────────────────────────────
router.get('/commission-rules', requirePermission('finance.commissions.read'), async (req, res, next) => {
  try {
    const rules = await financeService.listCommissionRules();
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

router.post('/commission-rules', requirePermission('finance.commissions.create'), async (req, res, next) => {
  try {
    const rule = await financeService.createCommissionRule(req.body, req.user);
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
});

router.get('/commission-history', requirePermission('finance.commissions.read'), async (req, res, next) => {
  try {
    const result = await financeService.listCommissionHistory(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// ─── SELLER EARNINGS ─────────────────────────────────────────────────────────
router.get('/seller-earnings', requirePermission('finance.earnings.read'), async (req, res, next) => {
  try {
    const result = await financeService.listSellerEarnings(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/seller-earnings/:sellerId/statement', requirePermission('finance.earnings.view_seller'), async (req, res, next) => {
  try {
    const statement = await financeService.getSellerStatement(req.params.sellerId);
    res.json({ success: true, data: statement });
  } catch (err) {
    next(err);
  }
});

// ─── PAYOUT REQUESTS & PROCESSING ───────────────────────────────────────────
router.get('/payout-requests', requirePermission('finance.payouts.read'), async (req, res, next) => {
  try {
    const result = await financeService.listPayoutRequests(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/payout-requests/:id/approve', requirePermission('finance.payouts.approve'), async (req, res, next) => {
  try {
    const payout = await financeService.approvePayout(req.params.id, req.user);
    res.json({ success: true, data: payout });
  } catch (err) {
    next(err);
  }
});

router.post('/payout-requests/:id/reject', requirePermission('finance.payouts.reject'), async (req, res, next) => {
  try {
    const payout = await financeService.rejectPayout(req.params.id, req.body.reason, req.user);
    res.json({ success: true, data: payout });
  } catch (err) {
    next(err);
  }
});

router.get('/payout-processing', requirePermission('finance.payouts.read'), async (req, res, next) => {
  try {
    const result = await financeService.listPayoutRequests({ status: 'approved' });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/payout-processing/:id/process', requirePermission('finance.payouts.process'), async (req, res, next) => {
  try {
    const payout = await financeService.processPayout(req.params.id, req.user);
    res.json({ success: true, data: payout });
  } catch (err) {
    next(err);
  }
});

// ─── REFUNDS ─────────────────────────────────────────────────────────────────
router.get('/refunds', requirePermission('finance.refunds.read'), async (req, res, next) => {
  try {
    const result = await financeService.listRefunds(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/refunds/:id/process', requirePermission('finance.refunds.process'), async (req, res, next) => {
  try {
    const refund = await financeService.processRefund(req.params.id, req.user);
    res.json({ success: true, data: refund });
  } catch (err) {
    next(err);
  }
});

// ─── TAX RULES ───────────────────────────────────────────────────────────────
router.get('/tax-rules', requirePermission('finance.tax.read'), async (req, res, next) => {
  try {
    const rules = await financeService.listTaxRules();
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

router.post('/tax-rules', requirePermission('finance.tax.create'), async (req, res, next) => {
  try {
    const rule = await financeService.createTaxRule(req.body, req.user);
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
});

router.delete('/tax-rules/:id', requirePermission('finance.tax.delete'), async (req, res, next) => {
  try {
    const result = await financeService.deleteTaxRule(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ─── INVOICES ────────────────────────────────────────────────────────────────
router.get('/invoices', requirePermission('finance.invoices.read'), async (req, res, next) => {
  try {
    const result = await financeService.listInvoices(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices/:id', requirePermission('finance.invoices.read'), async (req, res, next) => {
  try {
    const invoice = await financeService.getInvoiceById(req.params.id);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

// ─── FINANCIAL LEDGER ────────────────────────────────────────────────────────
router.get('/ledger/summary', requirePermission('finance.ledger.read'), async (req, res, next) => {
  try {
    const summary = await financeService.getLedgerSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

router.get('/ledger/journals', requirePermission('finance.ledger.read'), async (req, res, next) => {
  try {
    const journals = await financeService.listJournals(req.query);
    res.json({ success: true, ...journals });
  } catch (err) {
    next(err);
  }
});

// ─── RECONCILIATIONS ─────────────────────────────────────────────────────────
router.get('/reconciliations', requirePermission('finance.transactions.reconcile'), async (req, res, next) => {
  try {
    const recs = await financeService.listReconciliations();
    res.json({ success: true, data: recs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
