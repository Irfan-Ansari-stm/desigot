'use strict';

const pool = require('../../db/pool');
const { AppError, NotFoundError, ForbiddenError, ValidationError } = require('../../shared/errors/AppError');
const crypto = require('crypto');

class BadRequestError extends AppError {
  constructor(message) {
    super(message, 400, 'BAD_REQUEST');
  }
}

class ReviewsModerationService {
  /**
   * Generates a unique reference code.
   */
  generateReference(prefix = 'REV') {
    const year = new Date().getFullYear();
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${year}-${rand}`;
  }

  /**
   * Log an immutable moderation action into review_moderation_actions.
   */
  async logModerationAction({ reviewId = null, reportId = null, responseId = null, moderatorId, actionType, prevStatus = null, newStatus = null, reason = '', metadata = {}, ipAddress = '127.0.0.1' }) {
    try {
      await pool.query(`
        INSERT INTO review_moderation_actions (
          review_id, report_id, response_id, moderator_id, action_type,
          previous_status, new_status, reason, metadata, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `, [reviewId, reportId, responseId, moderatorId, actionType, prevStatus, newStatus, reason, JSON.stringify(metadata), ipAddress]);
    } catch (err) {
      console.error('Error logging moderation action:', err);
    }
  }

  /**
   * 1. GET ALL REVIEWS with rich filtering, search, and pagination.
   */
  async getReviews({ page = 1, limit = 20, search = '', status = '', rating = '', entity_type = '', verified = '', sort_by = 'created_at', sort_dir = 'DESC' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      conditions.push(`(
        r.review_reference ILIKE $${pIdx} OR
        r.title ILIKE $${pIdx} OR
        r.review_text ILIKE $${pIdx} OR
        u.first_name ILIKE $${pIdx} OR
        u.last_name ILIKE $${pIdx} OR
        u.email ILIKE $${pIdx} OR
        s.first_name ILIKE $${pIdx} OR
        s.last_name ILIKE $${pIdx} OR
        l.title ILIKE $${pIdx} OR
        dp.title ILIKE $${pIdx} OR
        srv.title ILIKE $${pIdx}
      )`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (status && status !== 'all') {
      conditions.push(`r.status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (rating && rating !== 'all') {
      conditions.push(`r.rating_overall = $${pIdx}`);
      params.push(parseInt(rating, 10));
      pIdx++;
    }

    if (verified === 'true') {
      conditions.push(`r.is_verified_purchase = true`);
    } else if (verified === 'false') {
      conditions.push(`r.is_verified_purchase = false`);
    }

    if (entity_type === 'product') {
      conditions.push(`(r.product_id IS NOT NULL OR l.listing_type = 'asset')`);
    } else if (entity_type === 'service') {
      conditions.push(`(r.service_id IS NOT NULL OR l.listing_type = 'service' OR r.booking_id IS NOT NULL)`);
    }

    const allowedSort = ['created_at', 'rating_overall', 'helpful_count', 'reported_count', 'risk_score'];
    const sortField = allowedSort.includes(sort_by) ? `r.${sort_by}` : 'r.created_at';
    const sortDirection = sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = conditions.join(' AND ');

    const countRes = await pool.query(`
      SELECT COUNT(DISTINCT r.id)::int as total
      FROM reviews r
      LEFT JOIN users u ON u.id = r.customer_id OR u.id = r.reviewer_id
      LEFT JOIN users s ON s.id = r.seller_id OR s.id = r.subject_id
      LEFT JOIN listings l ON l.id = r.listing_id
      LEFT JOIN digital_products dp ON dp.id = r.product_id OR dp.listing_id = r.listing_id
      LEFT JOIN services srv ON srv.id = r.service_id OR srv.id = r.listing_id
      WHERE ${whereClause}
    `, params);

    const total = countRes.rows[0]?.total || 0;

    const dataRes = await pool.query(`
      SELECT 
        r.id,
        r.review_reference,
        r.title,
        r.review_text,
        r.rating_overall,
        r.rating_quality,
        r.rating_communication,
        r.rating_value,
        r.rating_delivery,
        r.status,
        r.visibility_status,
        r.is_verified_purchase,
        r.rejection_reason,
        r.moderator_notes,
        r.reported_count,
        r.helpful_count,
        r.unhelpful_count,
        r.sentiment_score,
        r.risk_score,
        r.pinned,
        r.created_at,
        r.approved_at,
        r.rejected_at,
        r.order_id,
        r.booking_id,
        r.customer_id,
        r.seller_id,
        r.product_id,
        r.service_id,
        r.listing_id,
        -- Customer details
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.email as customer_email,
        u.avatar_url as customer_avatar,
        -- Seller details
        s.first_name as seller_first_name,
        s.last_name as seller_last_name,
        s.email as seller_email,
        s.avatar_url as seller_avatar,
        -- Target item title and type
        COALESCE(dp.title, srv.title, l.title, 'Marketplace Purchase') as item_title,
        CASE 
          WHEN r.service_id IS NOT NULL OR l.listing_type = 'service' OR r.booking_id IS NOT NULL THEN 'service'
          ELSE 'product'
        END as item_type,
        -- Attachments count
        (SELECT COUNT(*)::int FROM review_attachments ra WHERE ra.review_id = r.id) as attachments_count,
        -- Seller response preview
        (SELECT json_build_object(
            'id', resp.id,
            'response_text', resp.response_text,
            'status', resp.status,
            'is_visible', resp.is_visible,
            'created_at', resp.created_at
          ) FROM review_responses resp WHERE resp.review_id = r.id LIMIT 1) as seller_response
      FROM reviews r
      LEFT JOIN users u ON u.id = r.customer_id OR u.id = r.reviewer_id
      LEFT JOIN users s ON s.id = r.seller_id OR s.id = r.subject_id
      LEFT JOIN listings l ON l.id = r.listing_id
      LEFT JOIN digital_products dp ON dp.id = r.product_id OR dp.listing_id = r.listing_id
      LEFT JOIN services srv ON srv.id = r.service_id OR srv.id = r.listing_id
      WHERE ${whereClause}
      ORDER BY r.pinned DESC, ${sortField} ${sortDirection}
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `, [...params, parseInt(limit, 10), offset]);

    return {
      data: dataRes.rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * 2. GET STATS SUMMARY for KPI Banner Cards
   */
  async getStatsSummary() {
    const statsRes = await pool.query(`
      SELECT
        COUNT(*)::int as total_reviews,
        COUNT(CASE WHEN status IN ('pending_moderation', 'pending') THEN 1 END)::int as pending_reviews,
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::int as approved_reviews,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::int as rejected_reviews,
        COUNT(CASE WHEN status = 'hidden' THEN 1 END)::int as hidden_reviews,
        COUNT(CASE WHEN status = 'under_investigation' THEN 1 END)::int as investigating_reviews,
        COUNT(CASE WHEN status = 'removed' THEN 1 END)::int as removed_reviews,
        COALESCE(ROUND(AVG(CASE WHEN status = 'approved' THEN rating_overall END), 2), 0) as average_rating,
        COUNT(CASE WHEN status = 'approved' AND rating_overall = 5 THEN 1 END)::int as five_star_count,
        COUNT(CASE WHEN is_verified_purchase = true THEN 1 END)::int as verified_count,
        (SELECT COUNT(*)::int FROM review_reports WHERE status IN ('pending', 'investigating')) as active_reports_count,
        (SELECT COUNT(*)::int FROM review_responses) as total_responses,
        (SELECT COUNT(*)::int FROM review_responses WHERE status = 'pending_approval') as pending_responses,
        (SELECT COUNT(*)::int FROM review_moderation_rules WHERE is_active = true) as active_rules_count,
        (SELECT COUNT(*)::int FROM review_appeals WHERE status = 'pending') as pending_appeals_count
      FROM reviews;
    `);

    const s = statsRes.rows[0];
    const total = s.total_reviews || 1;
    const approved = s.approved_reviews || 1;
    const fiveStarPct = approved > 0 ? parseFloat(((s.five_star_count / approved) * 100).toFixed(1)) : 0;
    const verifiedPct = total > 0 ? parseFloat(((s.verified_count / total) * 100).toFixed(1)) : 0;

    return {
      total_reviews: s.total_reviews,
      pending_reviews: s.pending_reviews,
      approved_reviews: s.approved_reviews,
      rejected_reviews: s.rejected_reviews,
      hidden_reviews: s.hidden_reviews,
      investigating_reviews: s.investigating_reviews,
      removed_reviews: s.removed_reviews,
      average_rating: parseFloat(s.average_rating),
      five_star_percentage: fiveStarPct,
      verified_purchase_percentage: verifiedPct,
      active_reports_count: s.active_reports_count,
      total_responses: s.total_responses,
      pending_responses: s.pending_responses,
      active_rules_count: s.active_rules_count,
      pending_appeals_count: s.pending_appeals_count
    };
  }

  /**
   * 3. GET SINGLE REVIEW DETAILS with attachments, responses, reports, audit history.
   */
  async getReviewById(id) {
    const res = await pool.query(`
      SELECT 
        r.*,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.email as customer_email,
        u.avatar_url as customer_avatar,
        s.first_name as seller_first_name,
        s.last_name as seller_last_name,
        s.email as seller_email,
        s.avatar_url as seller_avatar,
        COALESCE(dp.title, srv.title, l.title, 'Marketplace Purchase') as item_title,
        CASE 
          WHEN r.service_id IS NOT NULL OR l.listing_type = 'service' OR r.booking_id IS NOT NULL THEN 'service'
          ELSE 'product'
        END as item_type,
        dp.price_personal_cents,
        dp.price_commercial_cents,
        srv.starting_price_cents
      FROM reviews r
      LEFT JOIN users u ON u.id = r.customer_id OR u.id = r.reviewer_id
      LEFT JOIN users s ON s.id = r.seller_id OR s.id = r.subject_id
      LEFT JOIN listings l ON l.id = r.listing_id
      LEFT JOIN digital_products dp ON dp.id = r.product_id OR dp.listing_id = r.listing_id
      LEFT JOIN services srv ON srv.id = r.service_id OR srv.id = r.listing_id
      WHERE r.id = $1;
    `, [id]);

    if (res.rows.length === 0) {
      throw new NotFoundError('Review not found.');
    }

    const review = res.rows[0];

    // Fetch attachments
    const attachRes = await pool.query(`
      SELECT * FROM review_attachments WHERE review_id = $1 ORDER BY created_at ASC;
    `, [id]);
    review.attachments = attachRes.rows;

    // Fetch seller responses
    const respRes = await pool.query(`
      SELECT resp.*, u.first_name, u.last_name, u.avatar_url, u.email
      FROM review_responses resp
      LEFT JOIN users u ON u.id = resp.responder_id
      WHERE resp.review_id = $1
      ORDER BY resp.created_at DESC;
    `, [id]);
    review.responses = respRes.rows;

    // Fetch reports on this review
    const repRes = await pool.query(`
      SELECT rr.*, u.first_name as reporter_first_name, u.last_name as reporter_last_name, u.email as reporter_email
      FROM review_reports rr
      LEFT JOIN users u ON u.id = rr.reporter_id
      WHERE rr.review_id = $1
      ORDER BY rr.created_at DESC;
    `, [id]);
    review.reports = repRes.rows;

    // Fetch moderation audit actions
    const auditRes = await pool.query(`
      SELECT ma.*, u.first_name as mod_first_name, u.last_name as mod_last_name, u.email as mod_email
      FROM review_moderation_actions ma
      LEFT JOIN users u ON u.id = ma.moderator_id
      WHERE ma.review_id = $1
      ORDER BY ma.created_at DESC;
    `, [id]);
    review.audit_actions = auditRes.rows;

    // Fetch appeals if any
    const appealRes = await pool.query(`
      SELECT ra.*, u.first_name as appellant_first_name, u.last_name as appellant_last_name
      FROM review_appeals ra
      LEFT JOIN users u ON u.id = ra.appellant_id
      WHERE ra.review_id = $1
      ORDER BY ra.created_at DESC;
    `, [id]);
    review.appeals = appealRes.rows;

    return review;
  }

  /**
   * 4. GET PENDING REVIEWS with prioritization
   */
  async getPendingReviews(query = {}) {
    return this.getReviews({ ...query, status: 'pending_moderation' });
  }

  /**
   * 5. APPROVE REVIEW
   */
  async approveReview(id, moderatorId, note = '') {
    const revCheck = await pool.query(`SELECT * FROM reviews WHERE id = $1`, [id]);
    if (revCheck.rows.length === 0) throw new NotFoundError('Review not found.');
    const prev = revCheck.rows[0];

    const updatedRes = await pool.query(`
      UPDATE reviews
      SET status = 'approved',
          visibility_status = 'visible',
          approved_at = NOW(),
          assigned_moderator_id = $2,
          moderator_notes = COALESCE($3, moderator_notes),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [id, moderatorId, note || 'Review approved by administrator.']);

    const updated = updatedRes.rows[0];

    // Log moderation action
    await this.logModerationAction({
      reviewId: id,
      moderatorId,
      actionType: 'approve',
      prevStatus: prev.status,
      newStatus: 'approved',
      reason: note || 'Approved for public marketplace display'
    });

    // Recalculate aggregates for parent entity and seller
    if (updated.product_id) await this.recalculateEntityRating('product', updated.product_id);
    if (updated.service_id) await this.recalculateEntityRating('service', updated.service_id);
    if (updated.listing_id) {
      await this.recalculateListingRating(updated.listing_id);
    }
    if (updated.seller_id) await this.recalculateEntityRating('seller', updated.seller_id);

    return updated;
  }

  /**
   * 6. REJECT REVIEW
   */
  async rejectReview(id, moderatorId, reason, note = '') {
    if (!reason) throw new BadRequestError('Rejection reason is required.');
    const revCheck = await pool.query(`SELECT * FROM reviews WHERE id = $1`, [id]);
    if (revCheck.rows.length === 0) throw new NotFoundError('Review not found.');
    const prev = revCheck.rows[0];

    const updatedRes = await pool.query(`
      UPDATE reviews
      SET status = 'rejected',
          visibility_status = 'hidden',
          rejected_at = NOW(),
          assigned_moderator_id = $2,
          rejection_reason = $3,
          moderator_notes = COALESCE($4, moderator_notes),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [id, moderatorId, reason, note]);

    const updated = updatedRes.rows[0];

    await this.logModerationAction({
      reviewId: id,
      moderatorId,
      actionType: 'reject',
      prevStatus: prev.status,
      newStatus: 'rejected',
      reason
    });

    // If it was previously approved, recalculate aggregates to exclude it
    if (prev.status === 'approved') {
      if (updated.product_id) await this.recalculateEntityRating('product', updated.product_id);
      if (updated.service_id) await this.recalculateEntityRating('service', updated.service_id);
      if (updated.listing_id) await this.recalculateListingRating(updated.listing_id);
      if (updated.seller_id) await this.recalculateEntityRating('seller', updated.seller_id);
    }

    return updated;
  }

  /**
   * 7. HIDE APPROVED REVIEW
   */
  async hideReview(id, moderatorId, reason) {
    const revCheck = await pool.query(`SELECT * FROM reviews WHERE id = $1`, [id]);
    if (revCheck.rows.length === 0) throw new NotFoundError('Review not found.');
    const prev = revCheck.rows[0];

    const updatedRes = await pool.query(`
      UPDATE reviews
      SET status = 'hidden',
          visibility_status = 'hidden',
          assigned_moderator_id = $2,
          moderator_notes = COALESCE($3, moderator_notes),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [id, moderatorId, reason || 'Review hidden by administrator']);

    const updated = updatedRes.rows[0];

    await this.logModerationAction({
      reviewId: id,
      moderatorId,
      actionType: 'hide',
      prevStatus: prev.status,
      newStatus: 'hidden',
      reason: reason || 'Administratively hidden from marketplace'
    });

    // Recalculate aggregates without this review
    if (updated.product_id) await this.recalculateEntityRating('product', updated.product_id);
    if (updated.service_id) await this.recalculateEntityRating('service', updated.service_id);
    if (updated.listing_id) await this.recalculateListingRating(updated.listing_id);
    if (updated.seller_id) await this.recalculateEntityRating('seller', updated.seller_id);

    return updated;
  }

  /**
   * 8. RESTORE REVIEW (From Hidden or Rejected to Approved)
   */
  async restoreReview(id, moderatorId, reason) {
    const revCheck = await pool.query(`SELECT * FROM reviews WHERE id = $1`, [id]);
    if (revCheck.rows.length === 0) throw new NotFoundError('Review not found.');
    const prev = revCheck.rows[0];

    const updatedRes = await pool.query(`
      UPDATE reviews
      SET status = 'approved',
          visibility_status = 'visible',
          approved_at = NOW(),
          assigned_moderator_id = $2,
          rejection_reason = NULL,
          moderator_notes = COALESCE($3, moderator_notes),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [id, moderatorId, reason || 'Review restored by administrator']);

    const updated = updatedRes.rows[0];

    await this.logModerationAction({
      reviewId: id,
      moderatorId,
      actionType: 'restore',
      prevStatus: prev.status,
      newStatus: 'approved',
      reason: reason || 'Review restored to active published state'
    });

    if (updated.product_id) await this.recalculateEntityRating('product', updated.product_id);
    if (updated.service_id) await this.recalculateEntityRating('service', updated.service_id);
    if (updated.listing_id) await this.recalculateListingRating(updated.listing_id);
    if (updated.seller_id) await this.recalculateEntityRating('seller', updated.seller_id);

    return updated;
  }

  /**
   * 9. BATCH APPROVE REVIEWS
   */
  async batchApprove(ids, moderatorId, note = 'Batch approved by administrator') {
    if (!Array.isArray(ids) || ids.length === 0) throw new BadRequestError('Ids array required.');
    const results = [];
    for (const id of ids) {
      try {
        const r = await this.approveReview(id, moderatorId, note);
        results.push({ id, success: true });
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return results;
  }

  /**
   * 10. BATCH REJECT REVIEWS
   */
  async batchReject(ids, moderatorId, reason, note = '') {
    if (!Array.isArray(ids) || ids.length === 0) throw new BadRequestError('Ids array required.');
    if (!reason) throw new BadRequestError('Rejection reason required.');
    const results = [];
    for (const id of ids) {
      try {
        const r = await this.rejectReview(id, moderatorId, reason, note);
        results.push({ id, success: true });
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return results;
  }

  /**
   * 11. GET REPORTED REVIEWS / REPORTS QUEUE
   */
  async getReportedReviews({ page = 1, limit = 20, status = '', reason = '', search = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (status && status !== 'all') {
      conditions.push(`rr.status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (reason && reason !== 'all') {
      conditions.push(`rr.reason ILIKE $${pIdx}`);
      params.push(`%${reason}%`);
      pIdx++;
    }

    if (search && search.trim()) {
      conditions.push(`(
        rr.report_reference ILIKE $${pIdx} OR
        rr.description ILIKE $${pIdx} OR
        r.review_reference ILIKE $${pIdx} OR
        r.title ILIKE $${pIdx} OR
        r.review_text ILIKE $${pIdx} OR
        u.email ILIKE $${pIdx}
      )`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM review_reports rr
      JOIN reviews r ON r.id = rr.review_id
      LEFT JOIN users u ON u.id = rr.reporter_id
      WHERE ${whereClause}
    `, params);

    const total = countRes.rows[0]?.total || 0;

    const dataRes = await pool.query(`
      SELECT 
        rr.id,
        rr.report_reference,
        rr.reason,
        rr.description,
        rr.status as report_status,
        rr.resolution_action,
        rr.investigation_notes,
        rr.created_at as reported_at,
        rr.resolved_at,
        -- Review details
        r.id as review_id,
        r.review_reference,
        r.title as review_title,
        r.review_text,
        r.rating_overall,
        r.status as review_status,
        r.visibility_status,
        r.is_verified_purchase,
        r.reported_count,
        r.created_at as review_created_at,
        -- Reporter info
        u.id as reporter_id,
        u.first_name as reporter_first_name,
        u.last_name as reporter_last_name,
        u.email as reporter_email,
        -- Moderator info
        m.first_name as mod_first_name,
        m.last_name as mod_last_name,
        -- Target item
        COALESCE(dp.title, srv.title, l.title, 'Marketplace Purchase') as item_title
      FROM review_reports rr
      JOIN reviews r ON r.id = rr.review_id
      LEFT JOIN users u ON u.id = rr.reporter_id
      LEFT JOIN users m ON m.id = rr.assigned_moderator_id
      LEFT JOIN listings l ON l.id = r.listing_id
      LEFT JOIN digital_products dp ON dp.id = r.product_id OR dp.listing_id = r.listing_id
      LEFT JOIN services srv ON srv.id = r.service_id OR srv.id = r.listing_id
      WHERE ${whereClause}
      ORDER BY rr.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `, [...params, parseInt(limit, 10), offset]);

    return {
      data: dataRes.rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * 12. INVESTIGATE REPORT
   */
  async investigateReport(reportId, moderatorId, notes = '') {
    const repRes = await pool.query(`SELECT * FROM review_reports WHERE id = $1`, [reportId]);
    if (repRes.rows.length === 0) throw new NotFoundError('Report not found.');
    const rep = repRes.rows[0];

    const updated = await pool.query(`
      UPDATE review_reports
      SET status = 'investigating',
          assigned_moderator_id = $2,
          investigation_notes = COALESCE($3, investigation_notes),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [reportId, moderatorId, notes || 'Investigation opened by moderator']);

    // Set review to under_investigation
    await pool.query(`
      UPDATE reviews
      SET status = 'under_investigation',
          assigned_moderator_id = $2,
          updated_at = NOW()
      WHERE id = $1;
    `, [rep.review_id, moderatorId]);

    await this.logModerationAction({
      reviewId: rep.review_id,
      reportId,
      moderatorId,
      actionType: 'investigate',
      prevStatus: rep.status,
      newStatus: 'investigating',
      reason: notes || 'Initiated formal investigation into reported violation'
    });

    return updated.rows[0];
  }

  /**
   * 13. DISMISS REPORT
   */
  async dismissReport(reportId, moderatorId, notes = 'Report dismissed as non-violating') {
    const repRes = await pool.query(`SELECT * FROM review_reports WHERE id = $1`, [reportId]);
    if (repRes.rows.length === 0) throw new NotFoundError('Report not found.');
    const rep = repRes.rows[0];

    const updated = await pool.query(`
      UPDATE review_reports
      SET status = 'resolved_dismissed',
          assigned_moderator_id = $2,
          resolution_action = 'dismissed',
          investigation_notes = $3,
          resolved_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [reportId, moderatorId, notes]);

    // Check if review has any other open reports; if not, restore status to approved
    const openReports = await pool.query(`
      SELECT count(*)::int as count FROM review_reports 
      WHERE review_id = $1 AND status IN ('pending', 'investigating') AND id != $2;
    `, [rep.review_id, reportId]);

    if (openReports.rows[0].count === 0) {
      await pool.query(`
        UPDATE reviews
        SET status = 'approved', visibility_status = 'visible', updated_at = NOW()
        WHERE id = $1 AND status = 'under_investigation';
      `, [rep.review_id]);
    }

    await this.logModerationAction({
      reviewId: rep.review_id,
      reportId,
      moderatorId,
      actionType: 'dismiss_report',
      prevStatus: rep.status,
      newStatus: 'resolved_dismissed',
      reason: notes
    });

    return updated.rows[0];
  }

  /**
   * 14. REMOVE REPORTED REVIEW
   */
  async removeReportedReview(reportId, moderatorId, reason) {
    if (!reason) throw new BadRequestError('Removal reason is required.');
    const repRes = await pool.query(`SELECT * FROM review_reports WHERE id = $1`, [reportId]);
    if (repRes.rows.length === 0) throw new NotFoundError('Report not found.');
    const rep = repRes.rows[0];

    // Mark report resolved_removed
    await pool.query(`
      UPDATE review_reports
      SET status = 'resolved_removed',
          assigned_moderator_id = $2,
          resolution_action = 'review_removed',
          investigation_notes = $3,
          resolved_at = NOW(),
          updated_at = NOW()
      WHERE id = $1;
    `, [reportId, moderatorId, reason]);

    // Mark review removed and hidden
    const revUpdate = await pool.query(`
      UPDATE reviews
      SET status = 'removed',
          visibility_status = 'hidden',
          rejection_reason = $2,
          moderator_notes = $3,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [rep.review_id, reason, `Removed due to validated violation in report #${rep.report_reference}`]);

    const updatedRev = revUpdate.rows[0];

    await this.logModerationAction({
      reviewId: rep.review_id,
      reportId,
      moderatorId,
      actionType: 'remove',
      prevStatus: 'under_investigation',
      newStatus: 'removed',
      reason
    });

    // Recalculate aggregates without this review
    if (updatedRev.product_id) await this.recalculateEntityRating('product', updatedRev.product_id);
    if (updatedRev.service_id) await this.recalculateEntityRating('service', updatedRev.service_id);
    if (updatedRev.listing_id) await this.recalculateListingRating(updatedRev.listing_id);
    if (updatedRev.seller_id) await this.recalculateEntityRating('seller', updatedRev.seller_id);

    return updatedRev;
  }

  /**
   * 15. ESCALATE REPORT
   */
  async escalateReport(reportId, moderatorId, notes = 'Escalated to Legal & Trust team') {
    const repRes = await pool.query(`SELECT * FROM review_reports WHERE id = $1`, [reportId]);
    if (repRes.rows.length === 0) throw new NotFoundError('Report not found.');
    const rep = repRes.rows[0];

    const updated = await pool.query(`
      UPDATE review_reports
      SET status = 'escalated',
          assigned_moderator_id = $2,
          investigation_notes = $3,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [reportId, moderatorId, notes]);

    await pool.query(`
      UPDATE reviews
      SET status = 'under_investigation', updated_at = NOW()
      WHERE id = $1;
    `, [rep.review_id]);

    await this.logModerationAction({
      reviewId: rep.review_id,
      reportId,
      moderatorId,
      actionType: 'escalate',
      prevStatus: rep.status,
      newStatus: 'escalated',
      reason: notes
    });

    return updated.rows[0];
  }

  /**
   * 16. GET SELLER RESPONSES QUEUE
   */
  async getSellerResponses({ page = 1, limit = 20, status = '', search = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (status && status !== 'all') {
      conditions.push(`resp.status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (search && search.trim()) {
      conditions.push(`(
        resp.response_text ILIKE $${pIdx} OR
        resp.response_reference ILIKE $${pIdx} OR
        r.review_reference ILIKE $${pIdx} OR
        r.title ILIKE $${pIdx} OR
        u.email ILIKE $${pIdx} OR
        u.first_name ILIKE $${pIdx} OR
        u.last_name ILIKE $${pIdx}
      )`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM review_responses resp
      JOIN reviews r ON r.id = resp.review_id
      LEFT JOIN users u ON u.id = resp.responder_id
      WHERE ${whereClause}
    `, params);

    const total = countRes.rows[0]?.total || 0;

    const dataRes = await pool.query(`
      SELECT 
        resp.id,
        resp.response_reference,
        resp.response_text,
        resp.status,
        resp.is_visible,
        resp.rejection_reason,
        resp.moderator_notes,
        resp.created_at,
        resp.updated_at,
        resp.approved_at,
        -- Seller / responder
        u.id as seller_id,
        u.first_name as seller_first_name,
        u.last_name as seller_last_name,
        u.email as seller_email,
        u.avatar_url as seller_avatar,
        -- Associated review
        r.id as review_id,
        r.review_reference,
        r.title as review_title,
        r.review_text,
        r.rating_overall,
        r.created_at as review_created_at,
        -- Customer who received response
        cu.first_name as customer_first_name,
        cu.last_name as customer_last_name,
        cu.email as customer_email,
        -- Target item
        COALESCE(dp.title, srv.title, l.title, 'Marketplace Listing') as item_title
      FROM review_responses resp
      JOIN reviews r ON r.id = resp.review_id
      LEFT JOIN users u ON u.id = resp.responder_id
      LEFT JOIN users cu ON cu.id = r.customer_id OR cu.id = r.reviewer_id
      LEFT JOIN listings l ON l.id = r.listing_id
      LEFT JOIN digital_products dp ON dp.id = r.product_id OR dp.listing_id = r.listing_id
      LEFT JOIN services srv ON srv.id = r.service_id OR srv.id = r.listing_id
      WHERE ${whereClause}
      ORDER BY resp.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `, [...params, parseInt(limit, 10), offset]);

    return {
      data: dataRes.rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * 17. APPROVE SELLER RESPONSE
   */
  async approveSellerResponse(responseId, moderatorId, note = '') {
    const respCheck = await pool.query(`SELECT * FROM review_responses WHERE id = $1`, [responseId]);
    if (respCheck.rows.length === 0) throw new NotFoundError('Response not found.');
    const prev = respCheck.rows[0];

    const updated = await pool.query(`
      UPDATE review_responses
      SET status = 'approved',
          is_visible = true,
          approved_by_id = $2,
          approved_at = NOW(),
          moderator_notes = COALESCE($3, moderator_notes),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [responseId, moderatorId, note]);

    await this.logModerationAction({
      reviewId: prev.review_id,
      responseId,
      moderatorId,
      actionType: 'approve_response',
      prevStatus: prev.status,
      newStatus: 'approved',
      reason: note || 'Seller response approved for public view'
    });

    return updated.rows[0];
  }

  /**
   * 18. REJECT SELLER RESPONSE
   */
  async rejectSellerResponse(responseId, moderatorId, reason, note = '') {
    if (!reason) throw new BadRequestError('Rejection reason required.');
    const respCheck = await pool.query(`SELECT * FROM review_responses WHERE id = $1`, [responseId]);
    if (respCheck.rows.length === 0) throw new NotFoundError('Response not found.');
    const prev = respCheck.rows[0];

    const updated = await pool.query(`
      UPDATE review_responses
      SET status = 'rejected',
          is_visible = false,
          rejection_reason = $2,
          moderator_notes = COALESCE($3, moderator_notes),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [responseId, reason, note]);

    await this.logModerationAction({
      reviewId: prev.review_id,
      responseId,
      moderatorId,
      actionType: 'reject_response',
      prevStatus: prev.status,
      newStatus: 'rejected',
      reason
    });

    return updated.rows[0];
  }

  /**
   * 19. GET MODERATION RULES
   */
  async getModerationRules() {
    const res = await pool.query(`
      SELECT * FROM review_moderation_rules ORDER BY severity DESC, rule_code ASC;
    `);
    return res.rows;
  }

  /**
   * 20. CREATE MODERATION RULE
   */
  async createModerationRule(ruleData, moderatorId) {
    const { rule_name, rule_code, category, condition_type, action, severity = 'medium', parameters = {} } = ruleData;
    if (!rule_name || !rule_code || !category || !condition_type || !action) {
      throw new BadRequestError('Missing required rule configuration fields.');
    }

    const res = await pool.query(`
      INSERT INTO review_moderation_rules (
        rule_name, rule_code, category, condition_type, action, severity, parameters, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *;
    `, [rule_name, rule_code, category, condition_type, action, severity, JSON.stringify(parameters)]);

    await this.logModerationAction({
      moderatorId,
      actionType: 'create_rule',
      reason: `Created moderation rule: ${rule_name} (${rule_code})`,
      metadata: { rule: res.rows[0] }
    });

    return res.rows[0];
  }

  /**
   * 21. UPDATE MODERATION RULE
   */
  async updateModerationRule(ruleId, ruleData, moderatorId) {
    const { rule_name, category, condition_type, action, severity, parameters } = ruleData;
    const res = await pool.query(`
      UPDATE review_moderation_rules
      SET rule_name = COALESCE($2, rule_name),
          category = COALESCE($3, category),
          condition_type = COALESCE($4, condition_type),
          action = COALESCE($5, action),
          severity = COALESCE($6, severity),
          parameters = COALESCE($7, parameters),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [ruleId, rule_name, category, condition_type, action, severity, parameters ? JSON.stringify(parameters) : null]);

    if (res.rows.length === 0) throw new NotFoundError('Rule not found.');

    await this.logModerationAction({
      moderatorId,
      actionType: 'update_rule',
      reason: `Updated moderation rule: ${res.rows[0].rule_code}`,
      metadata: { rule: res.rows[0] }
    });

    return res.rows[0];
  }

  /**
   * 22. TOGGLE MODERATION RULE
   */
  async toggleModerationRule(ruleId, moderatorId) {
    const res = await pool.query(`
      UPDATE review_moderation_rules
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [ruleId]);
    if (res.rows.length === 0) throw new NotFoundError('Rule not found.');

    await this.logModerationAction({
      moderatorId,
      actionType: 'toggle_rule',
      reason: `Toggled rule ${res.rows[0].rule_code} to active=${res.rows[0].is_active}`
    });

    return res.rows[0];
  }

  /**
   * 23. DELETE MODERATION RULE
   */
  async deleteModerationRule(ruleId, moderatorId) {
    const res = await pool.query(`DELETE FROM review_moderation_rules WHERE id = $1 RETURNING *;`, [ruleId]);
    if (res.rows.length === 0) throw new NotFoundError('Rule not found.');

    await this.logModerationAction({
      moderatorId,
      actionType: 'delete_rule',
      reason: `Deleted rule ${res.rows[0].rule_code}`
    });

    return { success: true, deleted: res.rows[0] };
  }

  /**
   * 24. GET MODERATION AUDIT TRAIL
   */
  async getModerationAuditTrail({ page = 1, limit = 25, search = '', action_type = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (action_type && action_type !== 'all') {
      conditions.push(`ma.action_type = $${pIdx}`);
      params.push(action_type);
      pIdx++;
    }

    if (search && search.trim()) {
      conditions.push(`(
        ma.reason ILIKE $${pIdx} OR
        r.review_reference ILIKE $${pIdx} OR
        u.email ILIKE $${pIdx} OR
        u.first_name ILIKE $${pIdx} OR
        u.last_name ILIKE $${pIdx}
      )`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM review_moderation_actions ma
      LEFT JOIN reviews r ON r.id = ma.review_id
      LEFT JOIN users u ON u.id = ma.moderator_id
      WHERE ${whereClause}
    `, params);

    const total = countRes.rows[0]?.total || 0;

    const dataRes = await pool.query(`
      SELECT 
        ma.*,
        r.review_reference,
        r.title as review_title,
        u.first_name as mod_first_name,
        u.last_name as mod_last_name,
        u.email as mod_email,
        u.avatar_url as mod_avatar
      FROM review_moderation_actions ma
      LEFT JOIN reviews r ON r.id = ma.review_id
      LEFT JOIN users u ON u.id = ma.moderator_id
      WHERE ${whereClause}
      ORDER BY ma.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `, [...params, parseInt(limit, 10), offset]);

    return {
      data: dataRes.rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * 25. GET & UPDATE REVIEW SETTINGS
   */
  async getReviewSettings() {
    const res = await pool.query(`SELECT * FROM review_settings ORDER BY key ASC;`);
    const settings = {};
    for (const row of res.rows) {
      settings[row.key] = { value: row.value, description: row.description, updated_at: row.updated_at };
    }
    return settings;
  }

  async updateReviewSettings(settingsObject, moderatorId) {
    for (const [key, val] of Object.entries(settingsObject)) {
      await pool.query(`
        INSERT INTO review_settings (key, value, updated_by, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (key) DO UPDATE
          SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW();
      `, [key, JSON.stringify(val), moderatorId]);
    }

    await this.logModerationAction({
      moderatorId,
      actionType: 'update_settings',
      reason: 'Updated system-wide review & moderation settings',
      metadata: { settings: settingsObject }
    });

    return this.getReviewSettings();
  }

  /**
   * 26. GET PRODUCT RATINGS LIST
   */
  async getProductRatings({ page = 1, limit = 20, search = '', min_rating = '', sort_by = 'average_rating', sort_dir = 'DESC' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      conditions.push(`(
        dp.title ILIKE $${pIdx} OR
        dp.slug ILIKE $${pIdx} OR
        u.email ILIKE $${pIdx} OR
        u.first_name ILIKE $${pIdx} OR
        u.last_name ILIKE $${pIdx}
      )`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (min_rating && min_rating !== 'all') {
      conditions.push(`COALESCE(ra.average_rating, dp.avg_rating, 0) >= $${pIdx}`);
      params.push(parseFloat(min_rating));
      pIdx++;
    }

    const allowedSort = ['average_rating', 'total_reviews', 'total_sales', 'total_revenue_cents'];
    const sortCol = allowedSort.includes(sort_by) ? sort_by : 'average_rating';
    const sortDir = sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = conditions.join(' AND ');

    const countRes = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM digital_products dp
      LEFT JOIN rating_aggregates ra ON ra.entity_type = 'product' AND ra.entity_id = dp.id
      LEFT JOIN users u ON u.id = dp.seller_id
      WHERE ${whereClause}
    `, params);

    const total = countRes.rows[0]?.total || 0;

    const dataRes = await pool.query(`
      SELECT 
        dp.id,
        dp.title,
        dp.slug,
        dp.thumbnail_url,
        dp.price_personal_cents,
        dp.price_commercial_cents,
        dp.total_sales,
        dp.total_revenue_cents,
        dp.total_downloads,
        dp.created_at,
        -- Aggregates
        COALESCE(ra.average_rating, dp.avg_rating, 0) as average_rating,
        COALESCE(ra.total_reviews, dp.review_count, 0) as total_reviews,
        COALESCE(ra.verified_reviews, dp.review_count, 0) as verified_reviews,
        COALESCE(ra.star_5_count, 0) as star_5_count,
        COALESCE(ra.star_4_count, 0) as star_4_count,
        COALESCE(ra.star_3_count, 0) as star_3_count,
        COALESCE(ra.star_2_count, 0) as star_2_count,
        COALESCE(ra.star_1_count, 0) as star_1_count,
        COALESCE(ra.avg_quality, 0) as avg_quality,
        COALESCE(ra.avg_communication, 0) as avg_communication,
        COALESCE(ra.avg_value, 0) as avg_value,
        COALESCE(ra.avg_delivery, 0) as avg_delivery,
        COALESCE(ra.recommendation_percentage, 95.0) as recommendation_percentage,
        -- Seller details
        u.id as seller_id,
        u.first_name as seller_first_name,
        u.last_name as seller_last_name,
        u.email as seller_email,
        u.avatar_url as seller_avatar
      FROM digital_products dp
      LEFT JOIN rating_aggregates ra ON ra.entity_type = 'product' AND ra.entity_id = dp.id
      LEFT JOIN users u ON u.id = dp.seller_id
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${sortDir} NULLS LAST
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `, [...params, parseInt(limit, 10), offset]);

    return {
      data: dataRes.rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * 27. GET SERVICE RATINGS LIST
   */
  async getServiceRatings({ page = 1, limit = 20, search = '', min_rating = '', sort_by = 'average_rating', sort_dir = 'DESC' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      conditions.push(`(
        s.title ILIKE $${pIdx} OR
        s.slug ILIKE $${pIdx} OR
        u.email ILIKE $${pIdx} OR
        u.first_name ILIKE $${pIdx} OR
        u.last_name ILIKE $${pIdx}
      )`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (min_rating && min_rating !== 'all') {
      conditions.push(`COALESCE(ra.average_rating, s.avg_rating, 0) >= $${pIdx}`);
      params.push(parseFloat(min_rating));
      pIdx++;
    }

    const allowedSort = ['average_rating', 'total_reviews', 'total_orders', 'total_revenue_cents'];
    const sortCol = allowedSort.includes(sort_by) ? sort_by : 'average_rating';
    const sortDir = sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = conditions.join(' AND ');

    const countRes = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM services s
      LEFT JOIN rating_aggregates ra ON ra.entity_type = 'service' AND ra.entity_id = s.id
      LEFT JOIN users u ON u.id = s.seller_id
      WHERE ${whereClause}
    `, params);

    const total = countRes.rows[0]?.total || 0;

    const dataRes = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.slug,
        s.starting_price_cents,
        s.total_orders,
        s.total_revenue_cents,
        s.delivery_time_days,
        s.created_at,
        -- Aggregates
        COALESCE(ra.average_rating, s.avg_rating, 0) as average_rating,
        COALESCE(ra.total_reviews, s.review_count, 0) as total_reviews,
        COALESCE(ra.verified_reviews, s.review_count, 0) as verified_reviews,
        COALESCE(ra.star_5_count, 0) as star_5_count,
        COALESCE(ra.star_4_count, 0) as star_4_count,
        COALESCE(ra.star_3_count, 0) as star_3_count,
        COALESCE(ra.star_2_count, 0) as star_2_count,
        COALESCE(ra.star_1_count, 0) as star_1_count,
        COALESCE(ra.avg_quality, 0) as avg_quality,
        COALESCE(ra.avg_communication, 0) as avg_communication,
        COALESCE(ra.avg_value, 0) as avg_value,
        COALESCE(ra.avg_delivery, 0) as avg_delivery,
        COALESCE(ra.recommendation_percentage, 96.0) as recommendation_percentage,
        -- Seller details
        u.id as seller_id,
        u.first_name as seller_first_name,
        u.last_name as seller_last_name,
        u.email as seller_email,
        u.avatar_url as seller_avatar
      FROM services s
      LEFT JOIN rating_aggregates ra ON ra.entity_type = 'service' AND ra.entity_id = s.id
      LEFT JOIN users u ON u.id = s.seller_id
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${sortDir} NULLS LAST
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `, [...params, parseInt(limit, 10), offset]);

    return {
      data: dataRes.rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * 28. RATING CALCULATION ENGINE
   * Server-side calculation only from eligible published approved reviews.
   */
  async recalculateEntityRating(entityType, entityId) {
    let whereCondition = '';
    if (entityType === 'product') {
      whereCondition = `(product_id = $1 OR listing_id = $1)`;
    } else if (entityType === 'service') {
      whereCondition = `(service_id = $1 OR listing_id = $1)`;
    } else if (entityType === 'seller') {
      whereCondition = `seller_id = $1`;
    } else {
      throw new BadRequestError('Invalid entity type for rating recalculation.');
    }

    const calcRes = await pool.query(`
      SELECT 
        COUNT(*)::int as total_reviews,
        COUNT(CASE WHEN is_verified_purchase THEN 1 END)::int as verified_reviews,
        COALESCE(ROUND(AVG(rating_overall), 2), 0) as avg_rating,
        COUNT(CASE WHEN rating_overall = 5 THEN 1 END)::int as s5,
        COUNT(CASE WHEN rating_overall = 4 THEN 1 END)::int as s4,
        COUNT(CASE WHEN rating_overall = 3 THEN 1 END)::int as s3,
        COUNT(CASE WHEN rating_overall = 2 THEN 1 END)::int as s2,
        COUNT(CASE WHEN rating_overall = 1 THEN 1 END)::int as s1,
        COALESCE(ROUND(AVG(rating_quality), 2), 0) as avg_quality,
        COALESCE(ROUND(AVG(rating_communication), 2), 0) as avg_communication,
        COALESCE(ROUND(AVG(rating_value), 2), 0) as avg_value,
        COALESCE(ROUND(AVG(rating_delivery), 2), 0) as avg_delivery
      FROM reviews
      WHERE ${whereCondition}
        AND status = 'approved'
        AND visibility_status = 'visible';
    `, [entityId]);

    const d = calcRes.rows[0];
    const total = d.total_reviews || 0;
    const avg = parseFloat(d.avg_rating) || 0.00;
    const recPct = total > 0 ? parseFloat((((d.s5 + d.s4) / total) * 100).toFixed(2)) : 0.00;

    // Upsert into rating_aggregates
    await pool.query(`
      INSERT INTO rating_aggregates (
        entity_type, entity_id, average_rating, total_reviews, verified_reviews,
        star_1_count, star_2_count, star_3_count, star_4_count, star_5_count,
        avg_quality, avg_communication, avg_value, avg_delivery, recommendation_percentage, last_calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      ON CONFLICT (entity_type, entity_id) DO UPDATE
        SET average_rating = EXCLUDED.average_rating,
            total_reviews = EXCLUDED.total_reviews,
            verified_reviews = EXCLUDED.verified_reviews,
            star_1_count = EXCLUDED.star_1_count,
            star_2_count = EXCLUDED.star_2_count,
            star_3_count = EXCLUDED.star_3_count,
            star_4_count = EXCLUDED.star_4_count,
            star_5_count = EXCLUDED.star_5_count,
            avg_quality = EXCLUDED.avg_quality,
            avg_communication = EXCLUDED.avg_communication,
            avg_value = EXCLUDED.avg_value,
            avg_delivery = EXCLUDED.avg_delivery,
            recommendation_percentage = EXCLUDED.recommendation_percentage,
            last_calculated_at = NOW();
    `, [entityType, entityId, avg, total, d.verified_reviews, d.s1, d.s2, d.s3, d.s4, d.s5, d.avg_quality, d.avg_communication, d.avg_value, d.avg_delivery, recPct]);

    // Update parent entity directly
    if (entityType === 'product') {
      await pool.query(`UPDATE digital_products SET avg_rating = $1, review_count = $2 WHERE id = $3;`, [avg, total, entityId]);
    } else if (entityType === 'service') {
      await pool.query(`UPDATE services SET avg_rating = $1, review_count = $2 WHERE id = $3;`, [avg, total, entityId]);
    } else if (entityType === 'seller') {
      await pool.query(`UPDATE users SET avg_seller_rating = $1, seller_review_count = $2 WHERE id = $3;`, [avg, total, entityId]);
    }

    return { entityType, entityId, average_rating: avg, total_reviews: total, recommendation_percentage: recPct };
  }

  /**
   * Recalculate listing rating when listing_id is provided
   */
  async recalculateListingRating(listingId) {
    const calcRes = await pool.query(`
      SELECT 
        COUNT(*)::int as total_reviews,
        COALESCE(ROUND(AVG(rating_overall), 2), 0) as avg_rating
      FROM reviews
      WHERE listing_id = $1
        AND status = 'approved'
        AND visibility_status = 'visible';
    `, [listingId]);

    const d = calcRes.rows[0];
    await pool.query(`
      UPDATE listings
      SET avg_rating = $1, review_count = $2
      WHERE id = $3;
    `, [parseFloat(d.avg_rating) || 0.00, d.total_reviews || 0, listingId]);
  }

  /**
   * 29. CUSTOMER SUBMISSION ENGINE
   * Server-side purchase verification, duplicate prevention, and moderation rules check.
   */
  async submitReview(userId, data) {
    const { order_id, booking_id, title = '', review_text, rating_overall, rating_quality, rating_communication, rating_value, rating_delivery, attachments = [] } = data;

    if (!rating_overall || rating_overall < 1 || rating_overall > 5) {
      throw new BadRequestError('Rating overall must be between 1 and 5.');
    }
    if (!review_text || review_text.trim().length < 15) {
      throw new BadRequestError('Review text must be at least 15 characters.');
    }

    let sellerId = null;
    let productId = null;
    let serviceId = null;
    let listingId = null;
    let isVerifiedPurchase = false;

    // Verify order or booking completion
    if (order_id) {
      const orderRes = await pool.query(`
        SELECT id, buyer_id, seller_id, listing_id, status FROM orders WHERE id = $1;
      `, [order_id]);

      if (orderRes.rows.length === 0) throw new NotFoundError('Order not found.');
      const order = orderRes.rows[0];

      if (order.buyer_id !== userId) {
        throw new ForbiddenError('You can only review orders that you have purchased.');
      }
      if (!['completed', 'delivered'].includes(order.status)) {
        throw new BadRequestError('Order must be completed before leaving a review.');
      }

      // Check duplicate
      const dupCheck = await pool.query(`SELECT id FROM reviews WHERE order_id = $1 AND customer_id = $2;`, [order_id, userId]);
      if (dupCheck.rows.length > 0) {
        throw new BadRequestError('You have already submitted a review for this order.');
      }

      sellerId = order.seller_id;
      listingId = order.listing_id;
      isVerifiedPurchase = true;

      // Check if listing is asset or service
      if (listingId) {
        const lRes = await pool.query(`SELECT id, listing_type FROM listings WHERE id = $1;`, [listingId]);
        if (lRes.rows.length > 0) {
          if (lRes.rows[0].listing_type === 'asset') {
            const pCheck = await pool.query(`SELECT id FROM digital_products WHERE id = $1 OR listing_id = $1 LIMIT 1;`, [listingId]);
            if (pCheck.rows.length > 0) productId = pCheck.rows[0].id;
          } else {
            const sCheck = await pool.query(`SELECT id FROM services WHERE id = $1 OR listing_id = $1 LIMIT 1;`, [listingId]);
            if (sCheck.rows.length > 0) serviceId = sCheck.rows[0].id;
          }
        }
      }
    } else if (booking_id) {
      const bookRes = await pool.query(`
        SELECT id, customer_id, seller_id, service_id, booking_status FROM customer_bookings WHERE id = $1;
      `, [booking_id]);

      if (bookRes.rows.length === 0) throw new NotFoundError('Booking not found.');
      const booking = bookRes.rows[0];

      if (booking.customer_id !== userId) {
        throw new ForbiddenError('You can only review bookings that you have created.');
      }
      if (!['completed', 'confirmed'].includes(booking.booking_status)) {
        throw new BadRequestError('Booking must be completed before leaving a review.');
      }

      const dupCheck = await pool.query(`SELECT id FROM reviews WHERE booking_id = $1 AND customer_id = $2;`, [booking_id, userId]);
      if (dupCheck.rows.length > 0) {
        throw new BadRequestError('You have already submitted a review for this booking.');
      }

      sellerId = booking.seller_id;
      serviceId = booking.service_id;
      isVerifiedPurchase = true;
    } else {
      throw new BadRequestError('Either order_id or booking_id is required.');
    }

    // Run Moderation Rules Engine
    const rulesRes = await pool.query(`SELECT * FROM review_moderation_rules WHERE is_active = true;`);
    let initialStatus = 'approved';
    let riskScore = 0.05;
    let autoNotes = [];

    const fullText = `${title} ${review_text}`.toLowerCase();

    for (const rule of rulesRes.rows) {
      const params = rule.parameters || {};
      if (rule.condition_type === 'contains_keywords' && Array.isArray(params.keywords)) {
        const found = params.keywords.some(kw => fullText.includes(kw.toLowerCase()));
        if (found) {
          riskScore = Math.max(riskScore, 0.85);
          initialStatus = rule.action === 'auto_reject' ? 'rejected' : 'pending_moderation';
          autoNotes.push(`Triggered ${rule.rule_code}: matched flagged keywords`);
          await pool.query(`UPDATE review_moderation_rules SET matches_count = matches_count + 1 WHERE id = $1;`, [rule.id]);
        }
      } else if (rule.condition_type === 'contains_phone_email') {
        const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(fullText);
        const hasPhone = /(\+?[0-9]{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/.test(fullText);
        if (hasEmail || hasPhone) {
          riskScore = Math.max(riskScore, 0.90);
          initialStatus = 'pending_moderation';
          autoNotes.push(`Triggered ${rule.rule_code}: PII detected`);
          await pool.query(`UPDATE review_moderation_rules SET matches_count = matches_count + 1 WHERE id = $1;`, [rule.id]);
        }
      } else if (rule.condition_type === 'text_length_below' && params.min_characters) {
        if (review_text.trim().length < params.min_characters && rating_overall <= (params.rating_threshold || 1)) {
          riskScore = Math.max(riskScore, 0.65);
          initialStatus = 'pending_moderation';
          autoNotes.push(`Triggered ${rule.rule_code}: short low-star text`);
          await pool.query(`UPDATE review_moderation_rules SET matches_count = matches_count + 1 WHERE id = $1;`, [rule.id]);
        }
      }
    }

    const ref = this.generateReference('REV');
    const note = autoNotes.length > 0 ? autoNotes.join('; ') : 'Auto-approved verified customer submission';
    const approvedAt = initialStatus === 'approved' ? new Date() : null;

    const insertRes = await pool.query(`
      INSERT INTO reviews (
        review_reference, order_id, booking_id, reviewer_id, customer_id, subject_id, seller_id,
        listing_id, product_id, service_id, review_type, rating_overall, rating_quality,
        rating_communication, rating_value, rating_delivery, title, review_text, status,
        visibility_status, is_verified_purchase, risk_score, moderator_notes, approved_at,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $4, $5, $5, $6, $7, $8, 'buyer_review', $9, $10, $11, $12, $13, $14, $15, $16, 'visible', $17, $18, $19, $20, NOW(), NOW())
      RETURNING *;
    `, [ref, order_id, booking_id, userId, sellerId, listingId, productId, serviceId, rating_overall, rating_quality || rating_overall, rating_communication || rating_overall, rating_value || rating_overall, rating_delivery || rating_overall, title, review_text, initialStatus, isVerifiedPurchase, riskScore, note, approvedAt]);

    const createdReview = insertRes.rows[0];

    // Save attachments
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        if (att.file_url) {
          await pool.query(`
            INSERT INTO review_attachments (
              review_id, file_name, file_url, file_type, file_size_bytes, thumbnail_url, moderation_status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'approved');
          `, [createdReview.id, att.file_name || 'attachment.png', att.file_url, att.file_type || 'image/png', att.file_size_bytes || 102400, att.file_url]);
        }
      }
    }

    // Recalculate ratings if approved
    if (initialStatus === 'approved') {
      if (productId) await this.recalculateEntityRating('product', productId);
      if (serviceId) await this.recalculateEntityRating('service', serviceId);
      if (listingId) await this.recalculateListingRating(listingId);
      if (sellerId) await this.recalculateEntityRating('seller', sellerId);
    }

    return createdReview;
  }

  /**
   * 30. SELLER SUBMIT RESPONSE
   */
  async submitSellerResponse(sellerId, reviewId, responseText) {
    if (!responseText || responseText.trim().length < 10) {
      throw new BadRequestError('Response text must be at least 10 characters.');
    }

    const revCheck = await pool.query(`SELECT * FROM reviews WHERE id = $1;`, [reviewId]);
    if (revCheck.rows.length === 0) throw new NotFoundError('Review not found.');
    const review = revCheck.rows[0];

    if (review.seller_id !== sellerId && review.subject_id !== sellerId) {
      throw new ForbiddenError('You can only respond to reviews left for your own listings/services.');
    }

    const ref = this.generateReference('RSP');
    
    // Check if seller response moderation is enabled
    const settingRes = await pool.query(`SELECT value FROM review_settings WHERE key = 'seller_response_moderation';`);
    const requireModeration = settingRes.rows.length > 0 ? settingRes.rows[0].value : true;

    const status = requireModeration ? 'pending_approval' : 'approved';
    const isVisible = !requireModeration;
    const approvedAt = !requireModeration ? new Date() : null;

    const res = await pool.query(`
      INSERT INTO review_responses (
        review_id, responder_id, response_text, is_visible, response_reference,
        status, approved_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *;
    `, [reviewId, sellerId, responseText, isVisible, ref, status, approvedAt]);

    return res.rows[0];
  }
}

module.exports = new ReviewsModerationService();
