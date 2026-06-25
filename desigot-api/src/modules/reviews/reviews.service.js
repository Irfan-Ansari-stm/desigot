'use strict';
const { query, queryRead, withTransaction } = require('../../db/pool');
const { NotFoundError, ForbiddenError, ConflictError, ValidationError } = require('../../shared/errors/AppError');
const { paginate } = require('../../shared/utils');

// ── Create review ─────────────────────────────────────────────────────────────
const createReview = async (reviewerId, data) => {
  const { order_id, rating_overall, rating_quality, rating_communication,
          rating_value, rating_delivery, review_text } = data;

  return withTransaction(async (client) => {
    // Validate order belongs to reviewer and is complete
    const { rows: order } = await client.query(
      `SELECT o.*, l.id AS listing_id
         FROM orders o JOIN listings l ON l.id=o.listing_id
        WHERE o.id=$1 AND o.status='complete'`,
      [order_id]
    );
    if (!order.length) throw new NotFoundError('Completed order');

    const o = order[0];
    const isBuyer  = o.buyer_id  === reviewerId;
    const isSeller = o.seller_id === reviewerId;
    if (!isBuyer && !isSeller) throw new ForbiddenError('Not your order');

    // Determine review type and subject
    const reviewType = isBuyer ? 'buyer_review' : 'seller_review';
    const subjectId  = isBuyer ? o.seller_id : o.buyer_id;

    // Check duplicate
    const { rows: dup } = await client.query(
      `SELECT id FROM reviews WHERE order_id=$1 AND reviewer_id=$2`, [order_id, reviewerId]
    );
    if (dup.length) throw new ConflictError('You have already reviewed this order');

    const { rows } = await client.query(
      `INSERT INTO reviews
         (order_id, reviewer_id, subject_id, listing_id, review_type,
          rating_overall, rating_quality, rating_communication, rating_value, rating_delivery,
          review_text, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending_moderation')
       RETURNING *`,
      [order_id, reviewerId, subjectId, o.listing_id, reviewType,
       rating_overall, rating_quality || null, rating_communication || null,
       rating_value || null, rating_delivery || null, review_text]
    );
    return rows[0];
  });
};

// ── Get review ────────────────────────────────────────────────────────────────
const getReview = async (reviewId) => {
  const { rows } = await queryRead(
    `SELECT r.*,
            reviewer.display_name AS reviewer_name, reviewer.avatar_url AS reviewer_avatar,
            subject.display_name  AS subject_name,
            l.title AS listing_title, l.slug AS listing_slug,
            rr.response_text, rr.created_at AS response_at
       FROM reviews r
       JOIN users reviewer ON reviewer.id=r.reviewer_id
       JOIN users subject  ON subject.id=r.subject_id
       JOIN listings l     ON l.id=r.listing_id
       LEFT JOIN review_responses rr ON rr.review_id=r.id
      WHERE r.id=$1`,
    [reviewId]
  );
  if (!rows.length) throw new NotFoundError('Review');
  return rows[0];
};

// ── List reviews for a listing ────────────────────────────────────────────────
const getListingReviews = async (listingId, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT r.id, r.rating_overall, r.rating_quality, r.rating_communication,
            r.rating_value, r.rating_delivery, r.review_text, r.published_at,
            reviewer.display_name AS reviewer_name, reviewer.avatar_url AS reviewer_avatar,
            rr.response_text, rr.created_at AS response_at
       FROM reviews r
       JOIN users reviewer ON reviewer.id=r.reviewer_id
       LEFT JOIN review_responses rr ON rr.review_id=r.id
      WHERE r.listing_id=$1 AND r.status='approved' AND r.review_type='buyer_review'
      ORDER BY r.published_at DESC LIMIT $2 OFFSET $3`,
    [listingId, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM reviews WHERE listing_id=$1 AND status='approved' AND review_type='buyer_review'`,
    [listingId]
  );
  // Rating breakdown
  const { rows: breakdown } = await queryRead(
    `SELECT rating_overall, COUNT(*) AS count
       FROM reviews WHERE listing_id=$1 AND status='approved' AND review_type='buyer_review'
       GROUP BY rating_overall ORDER BY rating_overall DESC`,
    [listingId]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit, breakdown };
};

// ── List reviews for a seller ─────────────────────────────────────────────────
const getSellerReviews = async (sellerId, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT r.id, r.rating_overall, r.review_text, r.published_at,
            r.listing_id, l.title AS listing_title,
            reviewer.display_name AS reviewer_name, reviewer.avatar_url AS reviewer_avatar,
            rr.response_text
       FROM reviews r
       JOIN listings l    ON l.id=r.listing_id
       JOIN users reviewer ON reviewer.id=r.reviewer_id
       LEFT JOIN review_responses rr ON rr.review_id=r.id
      WHERE r.subject_id=$1 AND r.status='approved' AND r.review_type='buyer_review'
      ORDER BY r.published_at DESC LIMIT $2 OFFSET $3`,
    [sellerId, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM reviews WHERE subject_id=$1 AND status='approved' AND review_type='buyer_review'`,
    [sellerId]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── My reviews (as reviewer) ──────────────────────────────────────────────────
const getMyReviews = async (userId, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT r.*, l.title AS listing_title, l.slug AS listing_slug
       FROM reviews r JOIN listings l ON l.id=r.listing_id
      WHERE r.reviewer_id=$1
      ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM reviews WHERE reviewer_id=$1`, [userId]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Respond to review ─────────────────────────────────────────────────────────
const respondToReview = async (reviewId, responderId, responseText) => {
  // Verify responder is the subject of the review
  const { rows: rev } = await queryRead(
    `SELECT r.subject_id FROM reviews r WHERE r.id=$1 AND r.status='approved'`, [reviewId]
  );
  if (!rev.length) throw new NotFoundError('Review');
  if (rev[0].subject_id !== responderId) throw new ForbiddenError('Only the review subject can respond');

  // Check no duplicate response
  const { rows: dup } = await queryRead(
    `SELECT id FROM review_responses WHERE review_id=$1`, [reviewId]
  );
  if (dup.length) throw new ConflictError('Already responded to this review');

  const { rows } = await query(
    `INSERT INTO review_responses (review_id, responder_id, response_text)
     VALUES ($1,$2,$3) RETURNING *`,
    [reviewId, responderId, responseText]
  );
  return rows[0];
};

const updateResponse = async (responseId, responderId, responseText) => {
  const { rows } = await query(
    `UPDATE review_responses SET response_text=$1, updated_at=NOW()
      WHERE id=$2 AND responder_id=$3 RETURNING *`,
    [responseText, responseId, responderId]
  );
  if (!rows.length) throw new NotFoundError('Response');
  return rows[0];
};

// ── Flag review ────────────────────────────────────────────────────────────────
const flagReview = async (reviewId, flaggedById, reason, notes) => {
  const { rows: rev } = await queryRead(`SELECT id FROM reviews WHERE id=$1`, [reviewId]);
  if (!rev.length) throw new NotFoundError('Review');

  const { rows } = await query(
    `INSERT INTO review_flags (review_id, flagged_by_id, reason, notes)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (review_id, flagged_by_id) DO UPDATE SET reason=$3, notes=$4, status='pending'
     RETURNING *`,
    [reviewId, flaggedById, reason, notes || null]
  );
  return rows[0];
};

// ── Admin: moderation queue ────────────────────────────────────────────────────
const getPendingReviews = async (pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT r.*, reviewer.email AS reviewer_email, l.title AS listing_title
       FROM reviews r
       JOIN users reviewer ON reviewer.id=r.reviewer_id
       JOIN listings l ON l.id=r.listing_id
      WHERE r.status='pending_moderation'
      ORDER BY r.created_at ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM reviews WHERE status='pending_moderation'`
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

const moderateReview = async (reviewId, adminId, action, note) => {
  const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'hidden';
  const publishedAt = action === 'approve' ? 'NOW()' : 'NULL';

  const { rows } = await query(
    `UPDATE reviews
        SET status=$1, moderation_note=$2,
            published_at=${action === 'approve' ? 'NOW()' : 'NULL'},
            updated_at=NOW()
      WHERE id=$3 RETURNING *`,
    [newStatus, note || null, reviewId]
  );
  if (!rows.length) throw new NotFoundError('Review');
  return rows[0];
};

const getFlaggedReviews = async (pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT rf.*, r.review_text, r.rating_overall, r.status AS review_status,
            u.display_name AS flagged_by_name
       FROM review_flags rf
       JOIN reviews r ON r.id=rf.review_id
       JOIN users u ON u.id=rf.flagged_by_id
      WHERE rf.status='pending'
      ORDER BY rf.created_at ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM review_flags WHERE status='pending'`
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

const resolveFlaggedReview = async (flagId, adminId, action, note) => {
  const flagStatus = action === 'action' ? 'actioned' : 'dismissed';
  const { rows: flag } = await query(
    `UPDATE review_flags
        SET status=$1, reviewed_by_id=$2, reviewed_at=NOW()
      WHERE id=$3 RETURNING *`,
    [flagStatus, adminId, flagId]
  );
  if (!flag.length) throw new NotFoundError('Flag');

  if (action === 'action') {
    // Hide the review
    await query(
      `UPDATE reviews SET status='hidden', moderation_note=$1, updated_at=NOW() WHERE id=$2`,
      [note || 'Hidden due to flag', flag[0].review_id]
    );
  }
  return flag[0];
};

module.exports = {
  createReview, getReview, getListingReviews, getSellerReviews, getMyReviews,
  respondToReview, updateResponse, flagReview,
  getPendingReviews, moderateReview, getFlaggedReviews, resolveFlaggedReview,
};
