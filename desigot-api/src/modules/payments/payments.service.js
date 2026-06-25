'use strict';
const config  = require('../../config');
const { query, queryRead, withTransaction } = require('../../db/pool');
const { NotFoundError, ForbiddenError, PaymentError, ValidationError } = require('../../shared/errors/AppError');
const { paginate } = require('../../shared/utils');
const ordersSvc = require('../orders/orders.service');

let stripe;
try { stripe = require('stripe')(config.stripe.secretKey); } catch { stripe = null; }

// ── Create Stripe PaymentIntent ───────────────────────────────────────────────
const createPaymentIntent = async (orderId, buyerId) => {
  const order = await ordersSvc.getOrder(orderId, buyerId);
  if (order.buyer_id !== buyerId) throw new ForbiddenError('Not your order');
  if (order.status !== 'pending') throw new ValidationError('Order already processed');

  if (!stripe) {
    // Dev mode: simulate payment intent
    const fakeId = `pi_dev_${Date.now()}`;
    await query(`UPDATE orders SET stripe_payment_intent_id=$1 WHERE id=$2`, [fakeId, orderId]);
    await query(
      `INSERT INTO payment_intents (order_id, stripe_intent_id, status, amount_cents, currency)
       VALUES ($1,$2,'requires_payment_method',$3,$4)`,
      [orderId, fakeId, order.amount_cents, order.currency]
    );
    return { clientSecret: 'dev_client_secret', intentId: fakeId, amount: order.amount_cents };
  }

  const intent = await stripe.paymentIntents.create({
    amount: order.amount_cents,
    currency: order.currency.toLowerCase(),
    metadata: { orderId, buyerId, listingId: order.listing_id },
  });

  await query(`UPDATE orders SET stripe_payment_intent_id=$1 WHERE id=$2`, [intent.id, orderId]);
  await query(
    `INSERT INTO payment_intents (order_id, stripe_intent_id, status, amount_cents, currency)
     VALUES ($1,$2,$3,$4,$5)`,
    [orderId, intent.id, intent.status, order.amount_cents, order.currency]
  );

  return { clientSecret: intent.client_secret, intentId: intent.id, amount: order.amount_cents };
};

// ── Stripe Webhook handler ────────────────────────────────────────────────────
const handleStripeWebhook = async (rawBody, signature) => {
  let event;
  if (stripe && config.stripe.webhookSecret) {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } else {
    event = JSON.parse(rawBody.toString());
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      await query(
        `UPDATE payment_intents SET status='succeeded', updated_at=NOW() WHERE stripe_intent_id=$1`,
        [pi.id]
      );
      const { rows } = await query(
        `SELECT id FROM orders WHERE stripe_payment_intent_id=$1`, [pi.id]
      );
      if (rows.length) await ordersSvc.completeOrder(rows[0].id);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await query(
        `UPDATE payment_intents
           SET status='failed', failure_code=$1, failure_message=$2, updated_at=NOW()
         WHERE stripe_intent_id=$3`,
        [pi.last_payment_error?.code, pi.last_payment_error?.message, pi.id]
      );
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const newStatus = event.type.includes('deleted') ? 'cancelled' : sub.status;
      await query(
        `UPDATE subscription_records SET status=$1, updated_at=NOW()
          WHERE stripe_subscription_id=$2`,
        [newStatus, sub.id]
      );
      break;
    }
    default:
      break;
  }
  return { received: true };
};

// ── Simulate payment (dev-only) ────────────────────────────────────────────────
const simulatePayment = async (orderId, buyerId) => {
  const { rows } = await query(
    `SELECT * FROM orders WHERE id=$1 AND buyer_id=$2 AND status='pending'`, [orderId, buyerId]
  );
  if (!rows.length) throw new NotFoundError('Order');
  await query(
    `UPDATE payment_intents SET status='succeeded' WHERE order_id=$1`, [orderId]
  );
  return ordersSvc.completeOrder(orderId);
};

// ── Escrow management ─────────────────────────────────────────────────────────
const getEscrow = async (orderId, userId, isAdmin) => {
  const { rows } = await queryRead(
    `SELECT e.*, o.seller_id, o.buyer_id FROM escrow_records e
       JOIN orders o ON o.id=e.order_id WHERE e.order_id=$1`,
    [orderId]
  );
  if (!rows.length) throw new NotFoundError('Escrow');
  if (!isAdmin && rows[0].seller_id !== userId && rows[0].buyer_id !== userId) throw new ForbiddenError('Access denied');
  return rows[0];
};

const releaseEscrowManual = async (orderId, adminId, reason) => {
  return withTransaction(async (client) => {
    const { rows: escrow } = await client.query(
      `SELECT * FROM escrow_records WHERE order_id=$1 AND status='held' FOR UPDATE`, [orderId]
    );
    if (!escrow.length) throw new NotFoundError('Escrow or not in held state');

    await client.query(
      `UPDATE escrow_records
         SET status='released', released_amount_cents=$1, released_at=NOW(), updated_at=NOW()
       WHERE order_id=$2`,
      [escrow[0].held_amount_cents, orderId]
    );
    await client.query(
      `UPDATE orders SET status='complete', completed_at=NOW(), updated_at=NOW() WHERE id=$1`, [orderId]
    );
    await client.query(
      `UPDATE seller_balances
         SET available_cents=available_cents+$1,
             pending_escrow_cents=GREATEST(0,pending_escrow_cents-$1),
             lifetime_earned_cents=lifetime_earned_cents+$1,
             updated_at=NOW()
       WHERE seller_id=$2`,
      [escrow[0].held_amount_cents, escrow[0].order_id]
    );
    return { message: 'Escrow released' };
  });
};

// ── Payout methods ────────────────────────────────────────────────────────────
const addPayoutMethod = async (sellerId, data) => {
  if (data.is_default) {
    await query(`UPDATE payout_methods SET is_default=FALSE WHERE seller_id=$1`, [sellerId]);
  }
  const { rows } = await query(
    `INSERT INTO payout_methods (seller_id, method_type, display_name, is_default, stripe_account_id, paypal_email)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [sellerId, data.method_type, data.display_name, data.is_default || false, data.stripe_account_id || null, data.paypal_email || null]
  );
  return rows[0];
};

const listPayoutMethods = async (sellerId) => {
  const { rows } = await queryRead(
    `SELECT id, method_type, display_name, is_default, is_verified, created_at
       FROM payout_methods WHERE seller_id=$1 AND deleted_at IS NULL`,
    [sellerId]
  );
  return rows;
};

const deletePayoutMethod = async (sellerId, methodId) => {
  await query(`UPDATE payout_methods SET deleted_at=NOW() WHERE id=$1 AND seller_id=$2`, [methodId, sellerId]);
  return { message: 'Payout method removed' };
};

// ── Payouts ───────────────────────────────────────────────────────────────────
const requestPayout = async (sellerId, methodId, amountCents) => {
  if (amountCents < config.payout.minimumCents) {
    throw new ValidationError(`Minimum payout is $${config.payout.minimumCents / 100}`);
  }
  const { rows: bal } = await query('SELECT available_cents FROM seller_balances WHERE seller_id=$1', [sellerId]);
  if (!bal.length || bal[0].available_cents < amountCents) {
    throw new PaymentError('Insufficient balance');
  }

  return withTransaction(async (client) => {
    await client.query(
      `UPDATE seller_balances SET available_cents=available_cents-$1, updated_at=NOW() WHERE seller_id=$2`,
      [amountCents, sellerId]
    );
    const scheduledFor = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // T+2 business days
    const { rows } = await client.query(
      `INSERT INTO payouts (seller_id, payout_method_id, amount_cents, scheduled_for)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [sellerId, methodId, amountCents, scheduledFor]
    );
    return rows[0];
  });
};

const listPayouts = async (sellerId, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT p.*, pm.method_type, pm.display_name FROM payouts p
       JOIN payout_methods pm ON pm.id=p.payout_method_id
      WHERE p.seller_id=$1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`,
    [sellerId, limit, offset]
  );
  const { rows: cnt } = await queryRead(`SELECT COUNT(*) FROM payouts WHERE seller_id=$1`, [sellerId]);
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Commission ledger ─────────────────────────────────────────────────────────
const getCommissionLedger = async (sellerId, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT cl.*, o.listing_title FROM commission_ledger cl
       JOIN orders o ON o.id=cl.order_id
      WHERE cl.seller_id=$1 ORDER BY cl.created_at DESC LIMIT $2 OFFSET $3`,
    [sellerId, limit, offset]
  );
  const { rows: cnt } = await queryRead(`SELECT COUNT(*) FROM commission_ledger WHERE seller_id=$1`, [sellerId]);
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Subscriptions ─────────────────────────────────────────────────────────────
const listPlans = async () => {
  const { rows } = await queryRead(`SELECT * FROM seller_plans WHERE is_active=TRUE ORDER BY sort_order`);
  return rows;
};

const subscribeToPlan = async (sellerId, planId, billingCycle) => {
  const { rows: plan } = await query('SELECT * FROM seller_plans WHERE id=$1', [planId]);
  if (!plan.length) throw new NotFoundError('Plan');

  // Cancel any existing active subscription
  await query(
    `UPDATE subscription_records SET status='cancelled', cancelled_at=NOW()
      WHERE seller_id=$1 AND status IN ('active','trialing')`,
    [sellerId]
  );

  const now  = new Date();
  const end  = new Date(now);
  end.setMonth(end.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

  const { rows } = await query(
    `INSERT INTO subscription_records
       (seller_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
     VALUES ($1,$2,'active',$3,$4,$5) RETURNING *`,
    [sellerId, planId, billingCycle, now, end]
  );
  return rows[0];
};

const cancelSubscription = async (sellerId) => {
  const { rows } = await query(
    `UPDATE subscription_records
       SET status='cancelled', cancelled_at=NOW(), updated_at=NOW()
      WHERE seller_id=$1 AND status='active' RETURNING id`,
    [sellerId]
  );
  if (!rows.length) throw new NotFoundError('Active subscription');
  return { message: 'Subscription cancelled' };
};

const getMySubscription = async (sellerId) => {
  const { rows } = await queryRead(
    `SELECT sr.*, sp.name AS plan_name, sp.display_name, sp.commission_rate, sp.features
       FROM subscription_records sr JOIN seller_plans sp ON sp.id=sr.plan_id
      WHERE sr.seller_id=$1 AND sr.status IN ('active','trialing')
      ORDER BY sr.created_at DESC LIMIT 1`,
    [sellerId]
  );
  return rows[0] || null;
};

// ── Promo codes (admin) ────────────────────────────────────────────────────────
const createPromoCode = async (adminId, data) => {
  const { rows } = await query(
    `INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses, min_order_cents, valid_from, valid_until, created_by_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.code, data.description, data.discount_type, data.discount_value,
     data.max_uses || null, data.min_order_cents || 0, data.valid_from || new Date(),
     data.valid_until || null, adminId]
  );
  return rows[0];
};

const listPromoCodes = async (pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(`SELECT * FROM promo_codes ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  const { rows: cnt } = await queryRead('SELECT COUNT(*) FROM promo_codes');
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

module.exports = {
  createPaymentIntent, handleStripeWebhook, simulatePayment,
  getEscrow, releaseEscrowManual,
  addPayoutMethod, listPayoutMethods, deletePayoutMethod,
  requestPayout, listPayouts, getCommissionLedger,
  listPlans, subscribeToPlan, cancelSubscription, getMySubscription,
  createPromoCode, listPromoCodes,
};
