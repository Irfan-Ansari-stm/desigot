'use strict';
const { query, queryRead, withTransaction } = require('../../db/pool');
const { NotFoundError, ForbiddenError, ValidationError, PaymentError } = require('../../shared/errors/AppError');
const { paginate } = require('../../shared/utils');
const config = require('../../config');

// ── Create order (pre-payment) ────────────────────────────────────────────────
const createOrder = async (buyerId, { listing_id, license_type, promo_code }) => {
  return withTransaction(async (client) => {
    // Load listing
    const { rows: ls } = await client.query(
      `SELECT l.*, u.id AS seller_id FROM listings l JOIN users u ON u.id=l.seller_id
        WHERE l.id=$1 AND l.status='approved' AND l.deleted_at IS NULL`,
      [listing_id]
    );
    if (!ls.length) throw new NotFoundError('Listing');
    const listing = ls[0];
    if (listing.seller_id === buyerId) throw new ForbiddenError('Cannot purchase your own listing');

    // Resolve price
    const priceMap = { personal: listing.price_personal, commercial: listing.price_commercial, extended: listing.price_extended };
    const basePrice = priceMap[license_type];
    if (!basePrice) throw new ValidationError(`License type '${license_type}' not available for this listing`);

    // Resolve promo code
    let discountCents = 0;
    if (promo_code) {
      const { rows: promo } = await client.query(
        `SELECT * FROM promo_codes WHERE code=$1 AND is_active=TRUE AND valid_from<=NOW()
           AND (valid_until IS NULL OR valid_until>=NOW())
           AND (max_uses IS NULL OR uses_count < max_uses)`,
        [promo_code]
      );
      if (promo.length) {
        discountCents = promo[0].discount_type === 'percent'
          ? Math.floor(basePrice * promo[0].discount_value / 100)
          : Math.min(promo[0].discount_value, basePrice);
        await client.query(`UPDATE promo_codes SET uses_count=uses_count+1 WHERE id=$1`, [promo[0].id]);
      }
    }

    // Get seller commission rate from active subscription plan
    const { rows: sub } = await client.query(
      `SELECT sp.commission_rate FROM subscription_records sr
         JOIN seller_plans sp ON sp.id=sr.plan_id
        WHERE sr.seller_id=$1 AND sr.status='active'
        ORDER BY sr.created_at DESC LIMIT 1`,
      [listing.seller_id]
    );
    const commissionRate = sub.length ? parseFloat(sub[0].commission_rate) : 0.12;

    const amountCents        = basePrice - discountCents;
    const platformFeeCents   = Math.round(amountCents * commissionRate);
    const sellerPayoutCents  = amountCents - platformFeeCents;

    const inspectionEndsAt   = new Date(Date.now() + config.escrow.inspectionDays * 24 * 60 * 60 * 1000);
    const downloadExpiresAt  = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const { rows: order } = await client.query(
      `INSERT INTO orders
         (buyer_id, seller_id, listing_id, listing_title, listing_type, license_type,
          amount_cents, discount_cents, platform_fee_cents, seller_payout_cents,
          currency, status, promo_code_used, inspection_ends_at, download_expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12,$13,$14)
       RETURNING *`,
      [buyerId, listing.seller_id, listing.id, listing.title, listing.listing_type,
       license_type, amountCents, discountCents, platformFeeCents, sellerPayoutCents,
       'USD', promo_code || null, inspectionEndsAt, downloadExpiresAt]
    );

    // Seed commission ledger row (pre-completion)
    await client.query(
      `INSERT INTO commission_ledger
         (order_id, seller_id, gross_amount_cents, commission_rate, commission_cents, net_seller_cents, seller_plan)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [order[0].id, listing.seller_id, amountCents, commissionRate, platformFeeCents, sellerPayoutCents,
       sub.length ? 'pro' : 'free']
    );

    return order[0];
  });
};

// ── Complete order (called after Stripe confirms payment) ─────────────────────
const completeOrder = async (orderId) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE orders SET status='active', updated_at=NOW() WHERE id=$1 AND status='pending' RETURNING *`,
      [orderId]
    );
    if (!rows.length) return null;
    const order = rows[0];

    // Create escrow record
    const releaseAt = new Date(Date.now() + config.escrow.inspectionDays * 24 * 60 * 60 * 1000);
    await client.query(
      `INSERT INTO escrow_records (order_id, held_amount_cents, release_scheduled_at)
       VALUES ($1,$2,$3)`,
      [orderId, order.seller_payout_cents, releaseAt]
    );

    // Update seller pending balance
    await client.query(
      `INSERT INTO seller_balances (seller_id, pending_escrow_cents)
       VALUES ($1,$2)
       ON CONFLICT (seller_id) DO UPDATE
       SET pending_escrow_cents=seller_balances.pending_escrow_cents+EXCLUDED.pending_escrow_cents,
           updated_at=NOW()`,
      [order.seller_id, order.seller_payout_cents]
    );

    // Issue license
    await client.query(
      `INSERT INTO licenses (order_id, buyer_id, listing_id, license_type)
       VALUES ($1,$2,$3,$4)`,
      [orderId, order.buyer_id, order.listing_id, order.license_type]
    );

    return order;
  });
};

// ── Get order ─────────────────────────────────────────────────────────────────
const getOrder = async (orderId, userId, isAdmin = false) => {
  const { rows } = await queryRead(
    `SELECT o.*,
            buyer.display_name AS buyer_name, buyer.email AS buyer_email,
            seller.display_name AS seller_name, seller.email AS seller_email,
            e.status AS escrow_status, e.release_scheduled_at,
            l.slug AS listing_slug
       FROM orders o
       JOIN users buyer  ON buyer.id=o.buyer_id
       JOIN users seller ON seller.id=o.seller_id
       LEFT JOIN escrow_records e ON e.order_id=o.id
       LEFT JOIN listings l ON l.id=o.listing_id
      WHERE o.id=$1`,
    [orderId]
  );
  if (!rows.length) throw new NotFoundError('Order');
  const order = rows[0];
  if (!isAdmin && order.buyer_id !== userId && order.seller_id !== userId) {
    throw new ForbiddenError('Access denied');
  }
  return order;
};

// ── List orders ────────────────────────────────────────────────────────────────
const listOrders = async (userId, role, filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { status } = filters;
  const column = role === 'seller' ? 'seller_id' : 'buyer_id';
  const { rows } = await queryRead(
    `SELECT o.id, o.listing_title, o.license_type, o.amount_cents, o.status,
            o.created_at, o.completed_at,
            u.display_name AS ${role === 'seller' ? 'buyer' : 'seller'}_name
       FROM orders o
       JOIN users u ON u.id=o.${role === 'seller' ? 'buyer_id' : 'seller_id'}
      WHERE o.${column}=$1 AND ($2::TEXT IS NULL OR o.status=$2)
      ORDER BY o.created_at DESC LIMIT $3 OFFSET $4`,
    [userId, status || null, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM orders WHERE ${column}=$1 AND ($2::TEXT IS NULL OR status=$2)`,
    [userId, status || null]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Download URL (signed) ──────────────────────────────────────────────────────
const getDownloadUrl = async (orderId, buyerId) => {
  const { rows } = await queryRead(
    `SELECT o.download_expires_at, lm.storage_key, lm.file_name
       FROM orders o
       JOIN listing_media lm ON lm.listing_id=o.listing_id AND lm.media_type='delivery_file'
      WHERE o.id=$1 AND o.buyer_id=$2 AND o.status IN ('active','complete')
        AND o.download_expires_at > NOW()`,
    [orderId, buyerId]
  );
  if (!rows.length) throw new NotFoundError('Order or download expired');
  // In production: generate S3 presigned URL
  const signedUrl = `https://storage.desigot.com/${rows[0].storage_key}?token=SIGNED&expires=${rows[0].download_expires_at}`;
  return { url: signedUrl, fileName: rows[0].file_name, expiresAt: rows[0].download_expires_at };
};

// ── Cancel order ──────────────────────────────────────────────────────────────
const cancelOrder = async (orderId, userId, reason) => {
  const { rows } = await query(
    `UPDATE orders SET status='cancelled', cancelled_at=NOW(), updated_at=NOW()
      WHERE id=$1 AND buyer_id=$2 AND status='pending' RETURNING id`,
    [orderId, userId]
  );
  if (!rows.length) throw new NotFoundError('Order or cannot cancel');
  return { message: 'Order cancelled' };
};

// ── License lookup ────────────────────────────────────────────────────────────
const getLicense = async (licenseKey, buyerId) => {
  const { rows } = await queryRead(
    `SELECT l.*, listing.title AS listing_title, listing.slug AS listing_slug
       FROM licenses l JOIN listings listing ON listing.id=l.listing_id
      WHERE l.license_key=$1 AND l.buyer_id=$2`,
    [licenseKey, buyerId]
  );
  if (!rows.length) throw new NotFoundError('License');
  return rows[0];
};

const listLicenses = async (buyerId, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT l.*, listing.title, listing.slug FROM licenses l
       JOIN listings listing ON listing.id=l.listing_id
      WHERE l.buyer_id=$1 AND l.is_active=TRUE
      ORDER BY l.created_at DESC LIMIT $2 OFFSET $3`,
    [buyerId, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM licenses WHERE buyer_id=$1 AND is_active=TRUE`, [buyerId]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Admin ─────────────────────────────────────────────────────────────────────
const adminListOrders = async (filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { status, buyer_id, seller_id } = filters;
  const { rows } = await queryRead(
    `SELECT o.*, buyer.email AS buyer_email, seller.email AS seller_email
       FROM orders o
       JOIN users buyer  ON buyer.id=o.buyer_id
       JOIN users seller ON seller.id=o.seller_id
      WHERE ($1::TEXT IS NULL OR o.status=$1)
        AND ($2::UUID IS NULL OR o.buyer_id=$2)
        AND ($3::UUID IS NULL OR o.seller_id=$3)
      ORDER BY o.created_at DESC LIMIT $4 OFFSET $5`,
    [status || null, buyer_id || null, seller_id || null, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM orders WHERE ($1::TEXT IS NULL OR status=$1) AND ($2::UUID IS NULL OR buyer_id=$2) AND ($3::UUID IS NULL OR seller_id=$3)`,
    [status || null, buyer_id || null, seller_id || null]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

module.exports = {
  createOrder, completeOrder, getOrder, listOrders, getDownloadUrl,
  cancelOrder, getLicense, listLicenses, adminListOrders,
};
