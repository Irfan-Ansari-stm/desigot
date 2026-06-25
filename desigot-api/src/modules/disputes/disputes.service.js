'use strict';
const { query, queryRead, withTransaction } = require('../../db/pool');
const { NotFoundError, ForbiddenError, ConflictError, ValidationError } = require('../../shared/errors/AppError');
const { paginate } = require('../../shared/utils');

// ── Open a dispute ─────────────────────────────────────────────────────────────
const openDispute = async (buyerId, data) => {
  const { order_id, reason, description } = data;

  return withTransaction(async (client) => {
    const { rows: order } = await client.query(
      `SELECT * FROM orders WHERE id=$1 AND buyer_id=$2 AND status='active'`,
      [order_id, buyerId]
    );
    if (!order.length) throw new NotFoundError('Active order');

    // Check within inspection window
    if (new Date() > new Date(order[0].inspection_ends_at)) {
      throw new ValidationError('Dispute window has expired (7 days after purchase)');
    }

    // Check no existing open dispute
    const { rows: existing } = await client.query(
      `SELECT id FROM disputes WHERE order_id=$1`, [order_id]
    );
    if (existing.length) throw new ConflictError('Dispute already exists for this order');

    // Create dispute
    const { rows } = await client.query(
      `INSERT INTO disputes (order_id, opened_by_id, reason, description)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [order_id, buyerId, reason, description]
    );

    // Freeze escrow
    await client.query(
      `UPDATE escrow_records SET status='frozen', frozen_at=NOW(), updated_at=NOW()
        WHERE order_id=$1 AND status='held'`,
      [order_id]
    );

    // Update order status
    await client.query(
      `UPDATE orders SET status='disputed', updated_at=NOW() WHERE id=$1`, [order_id]
    );

    return rows[0];
  });
};

// ── Get dispute ────────────────────────────────────────────────────────────────
const getDispute = async (disputeId, userId, isAdmin = false) => {
  const { rows } = await queryRead(
    `SELECT d.*,
            o.buyer_id, o.seller_id, o.listing_title, o.amount_cents,
            opener.display_name AS opened_by_name,
            resolver.display_name AS resolved_by_name,
            e.status AS escrow_status
       FROM disputes d
       JOIN orders o ON o.id=d.order_id
       JOIN users opener ON opener.id=d.opened_by_id
       LEFT JOIN users resolver ON resolver.id=d.resolved_by_id
       LEFT JOIN escrow_records e ON e.order_id=d.order_id
      WHERE d.id=$1`,
    [disputeId]
  );
  if (!rows.length) throw new NotFoundError('Dispute');
  const dispute = rows[0];
  if (!isAdmin && dispute.buyer_id !== userId && dispute.seller_id !== userId) {
    throw new ForbiddenError('Access denied');
  }
  return dispute;
};

// ── List disputes ─────────────────────────────────────────────────────────────
const listDisputes = async (userId, role, filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { status } = filters;
  const col = role === 'seller' ? 'o.seller_id' : 'o.buyer_id';

  const { rows } = await queryRead(
    `SELECT d.id, d.reason, d.status, d.opened_at, d.sla_deadline, d.outcome,
            o.listing_title, o.amount_cents
       FROM disputes d JOIN orders o ON o.id=d.order_id
      WHERE ${col}=$1 AND ($2::TEXT IS NULL OR d.status=$2)
      ORDER BY d.opened_at DESC LIMIT $3 OFFSET $4`,
    [userId, status || null, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM disputes d JOIN orders o ON o.id=d.order_id
      WHERE ${col}=$1 AND ($2::TEXT IS NULL OR d.status=$2)`,
    [userId, status || null]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Add evidence ───────────────────────────────────────────────────────────────
const addEvidence = async (disputeId, userId, evidenceKey) => {
  const { rows } = await queryRead(
    `SELECT d.*, o.buyer_id, o.seller_id FROM disputes d
       JOIN orders o ON o.id=d.order_id WHERE d.id=$1`,
    [disputeId]
  );
  if (!rows.length) throw new NotFoundError('Dispute');
  if (rows[0].buyer_id !== userId && rows[0].seller_id !== userId) throw new ForbiddenError('Access denied');
  if (!['open', 'under_review'].includes(rows[0].status)) throw new ValidationError('Dispute not in evidence submission phase');

  await query(
    `UPDATE disputes
        SET evidence_keys=array_append(evidence_keys, $1), updated_at=NOW()
      WHERE id=$2`,
    [evidenceKey, disputeId]
  );
  return { message: 'Evidence added', key: evidenceKey };
};

// ── Admin: resolve dispute ─────────────────────────────────────────────────────
const resolveDispute = async (disputeId, adminId, outcome, refundAmountCents, notes) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT d.*, o.seller_id, o.buyer_id, o.seller_payout_cents
         FROM disputes d JOIN orders o ON o.id=d.order_id
        WHERE d.id=$1 AND d.status IN ('open','under_review')
        FOR UPDATE`,
      [disputeId]
    );
    if (!rows.length) throw new NotFoundError('Dispute or already resolved');
    const dispute = rows[0];

    // Resolve dispute
    await client.query(
      `UPDATE disputes
          SET status='resolved', resolved_by_id=$1, outcome=$2,
              refund_amount_cents=$3, outcome_notes=$4,
              resolved_at=NOW(), updated_at=NOW()
        WHERE id=$5`,
      [adminId, outcome, refundAmountCents || 0, notes || null, disputeId]
    );

    // Handle escrow release based on outcome
    if (outcome === 'full_refund') {
      await client.query(
        `UPDATE escrow_records
            SET status='refunded', refunded_amount_cents=held_amount_cents,
                updated_at=NOW()
          WHERE order_id=$1`,
        [dispute.order_id]
      );
      await client.query(
        `UPDATE orders SET status='refunded', refunded_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [dispute.order_id]
      );
    } else if (outcome === 'partial_refund') {
      const sellerAmount = dispute.seller_payout_cents - (refundAmountCents || 0);
      await client.query(
        `UPDATE escrow_records
            SET status='partial_refund',
                refunded_amount_cents=$1,
                released_amount_cents=$2,
                released_at=NOW(), updated_at=NOW()
          WHERE order_id=$3`,
        [refundAmountCents, sellerAmount, dispute.order_id]
      );
      // Credit seller for their portion
      await client.query(
        `UPDATE seller_balances
            SET available_cents=available_cents+$1,
                pending_escrow_cents=GREATEST(0,pending_escrow_cents-$2),
                updated_at=NOW()
          WHERE seller_id=$3`,
        [sellerAmount, dispute.seller_payout_cents, dispute.seller_id]
      );
      await client.query(
        `UPDATE orders SET status='complete', completed_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [dispute.order_id]
      );
    } else {
      // no_refund — release to seller
      await client.query(
        `UPDATE escrow_records
            SET status='released', released_amount_cents=held_amount_cents,
                released_at=NOW(), updated_at=NOW()
          WHERE order_id=$1`,
        [dispute.order_id]
      );
      await client.query(
        `UPDATE seller_balances
            SET available_cents=available_cents+$1,
                pending_escrow_cents=GREATEST(0,pending_escrow_cents-$1),
                lifetime_earned_cents=lifetime_earned_cents+$1,
                updated_at=NOW()
          WHERE seller_id=$2`,
        [dispute.seller_payout_cents, dispute.seller_id]
      );
      await client.query(
        `UPDATE orders SET status='complete', completed_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [dispute.order_id]
      );
    }

    return { message: 'Dispute resolved', outcome };
  });
};

// ── Admin: move to under_review ───────────────────────────────────────────────
const reviewDispute = async (disputeId, adminId) => {
  const { rows } = await query(
    `UPDATE disputes SET status='under_review', updated_at=NOW()
      WHERE id=$1 AND status='open' RETURNING *`,
    [disputeId]
  );
  if (!rows.length) throw new NotFoundError('Open dispute');
  return rows[0];
};

// ── Admin: list all disputes ───────────────────────────────────────────────────
const adminListDisputes = async (filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { status } = filters;
  const { rows } = await queryRead(
    `SELECT d.*, o.buyer_id, o.seller_id, o.listing_title, o.amount_cents,
            EXTRACT(EPOCH FROM (d.sla_deadline - NOW())) / 3600 AS hours_until_sla,
            d.sla_deadline < NOW() AS sla_breached
       FROM disputes d JOIN orders o ON o.id=d.order_id
      WHERE ($1::TEXT IS NULL OR d.status=$1)
      ORDER BY d.sla_deadline ASC NULLS LAST LIMIT $2 OFFSET $3`,
    [status || null, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM disputes WHERE ($1::TEXT IS NULL OR status=$1)`,
    [status || null]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Cancel dispute (buyer withdraws) ──────────────────────────────────────────
const cancelDispute = async (disputeId, buyerId) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT d.*, o.buyer_id, o.seller_payout_cents FROM disputes d
         JOIN orders o ON o.id=d.order_id
        WHERE d.id=$1 AND d.status='open'`,
      [disputeId]
    );
    if (!rows.length) throw new NotFoundError('Open dispute');
    if (rows[0].buyer_id !== buyerId) throw new ForbiddenError('Only buyer can cancel dispute');

    await client.query(
      `UPDATE disputes SET status='cancelled', updated_at=NOW() WHERE id=$1`, [disputeId]
    );
    // Unfreeze escrow
    await client.query(
      `UPDATE escrow_records SET status='held', unfrozen_at=NOW(), frozen_at=NULL, updated_at=NOW()
        WHERE order_id=$1 AND status='frozen'`,
      [rows[0].order_id]
    );
    await client.query(
      `UPDATE orders SET status='active', updated_at=NOW() WHERE id=$1`, [rows[0].order_id]
    );
    return { message: 'Dispute cancelled' };
  });
};

module.exports = {
  openDispute, getDispute, listDisputes, addEvidence,
  resolveDispute, reviewDispute, adminListDisputes, cancelDispute,
};
