'use strict';

const { primaryPool } = require('../../db/pool');
const { NotFoundError, ValidationError, ForbiddenError, ConflictError } = require('../../shared/errors/AppError');
const BadRequestError = ValidationError;
const logger = require('../../config/logger');
const crypto = require('crypto');

async function query(sql, params) {
  return primaryPool.query(sql, params);
}

async function recordAudit(actorId, action, entityType, entityId, oldVal = null, newVal = null, req = {}) {
  try {
    await query(
      `INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, ip_address, user_agent, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        actorId,
        actorId ? 'user' : 'system',
        action,
        entityType,
        entityId,
        req.ip || '127.0.0.1',
        req.headers?.['user-agent'] || null,
        oldVal ? JSON.stringify(oldVal) : null,
        newVal ? JSON.stringify(newVal) : null,
      ]
    );
  } catch (err) {
    logger.warn('Failed to record audit log', { err: err.message });
  }
}

async function recordOrderHistory(orderId, prevStatus, nextStatus, action, actorId, reason, metadata = {}) {
  try {
    await query(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, action, performed_by_id, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        orderId,
        prevStatus,
        nextStatus,
        action,
        actorId,
        reason || null,
        JSON.stringify(metadata)
      ]
    );
  } catch (err) {
    logger.warn('Failed to record order history', { err: err.message });
  }
}

class OrdersBookingsService {
  // ── 1. STATS & ANALYTICS OVERVIEW ──────────────────────────────────────────
  async getStats() {
    const ordersStatsQuery = `
      SELECT
        COUNT(*) AS total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
        COUNT(*) FILTER (WHERE status = 'active') AS in_progress_orders,
        COUNT(*) FILTER (WHERE status = 'complete') AS completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
        COUNT(*) FILTER (WHERE status = 'disputed') AS disputed_orders,
        COUNT(*) FILTER (WHERE status = 'refunded') AS refunded_orders,
        COUNT(*) FILTER (WHERE listing_type = 'asset') AS digital_orders,
        COUNT(*) FILTER (WHERE listing_type = 'service') AS service_orders,
        COALESCE(SUM(amount_cents), 0) AS total_gross_cents,
        COALESCE(SUM(platform_fee_cents), 0) AS total_commission_cents,
        COALESCE(SUM(seller_payout_cents), 0) AS total_seller_earnings_cents,
        COALESCE(SUM(amount_cents) FILTER (WHERE status = 'refunded'), 0) AS total_refunds_cents
      FROM orders;
    `;

    const bookingsStatsQuery = `
      SELECT
        COUNT(*) AS total_bookings,
        COUNT(*) FILTER (WHERE booking_status IN ('requested', 'new')) AS new_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'pending_confirmation') AS pending_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'confirmed') AS confirmed_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'in_progress') AS in_progress_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'completed') AS completed_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'cancelled') AS cancelled_bookings
      FROM customer_bookings;
    `;

    const projectsStatsQuery = `
      SELECT
        COUNT(*) AS total_projects,
        COUNT(*) FILTER (WHERE status IN ('active', 'in_revision', 'proposal', 'briefing')) AS active_projects
      FROM projects;
    `;

    const deliveriesStatsQuery = `
      SELECT
        COUNT(*) AS total_deliveries,
        COUNT(*) FILTER (WHERE review_status IN ('submitted', 'under_review')) AS pending_deliveries,
        COUNT(*) FILTER (WHERE review_status = 'approved') AS approved_deliveries,
        COUNT(*) FILTER (WHERE review_status = 'revision_requested') AS revision_deliveries
      FROM order_deliveries;
    `;

    const quotesStatsQuery = `
      SELECT
        COUNT(*) AS total_quotes,
        COUNT(*) FILTER (WHERE status = 'sent') AS sent_quotes,
        COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_quotes,
        COUNT(*) FILTER (WHERE status = 'converted_to_order') AS converted_quotes
      FROM custom_quotes;
    `;

    const [ordRes, bookRes, projRes, delRes, quoRes] = await Promise.all([
      query(ordersStatsQuery),
      query(bookingsStatsQuery),
      query(projectsStatsQuery),
      query(deliveriesStatsQuery),
      query(quotesStatsQuery),
    ]);

    const o = ordRes.rows[0];
    const b = bookRes.rows[0];
    const p = projRes.rows[0];
    const d = delRes.rows[0];
    const q = quoRes.rows[0];

    const totalOrders = parseInt(o.total_orders || 0, 10);
    const completedOrders = parseInt(o.completed_orders || 0, 10);
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    return {
      totalOrders,
      total_orders: totalOrders,
      pendingOrders: parseInt(o.pending_orders || 0, 10),
      pending_orders: parseInt(o.pending_orders || 0, 10),
      inProgressOrders: parseInt(o.in_progress_orders || 0, 10),
      in_progress_orders: parseInt(o.in_progress_orders || 0, 10),
      completedOrders,
      completed_orders: completedOrders,
      cancelledOrders: parseInt(o.cancelled_orders || 0, 10),
      cancelled_orders: parseInt(o.cancelled_orders || 0, 10),
      disputedOrders: parseInt(o.disputed_orders || 0, 10),
      disputed_orders: parseInt(o.disputed_orders || 0, 10),
      refundedOrders: parseInt(o.refunded_orders || 0, 10),
      digitalOrders: parseInt(o.digital_orders || 0, 10),
      serviceOrders: parseInt(o.service_orders || 0, 10),
      totalGrossCents: parseInt(o.total_gross_cents || 0, 10),
      totalCommissionCents: parseInt(o.total_commission_cents || 0, 10),
      totalSellerEarningsCents: parseInt(o.total_seller_earnings_cents || 0, 10),
      totalRefundsCents: parseInt(o.total_refunds_cents || 0, 10),
      completionRate,

      totalBookings: parseInt(b.total_bookings || 0, 10),
      total_bookings: parseInt(b.total_bookings || 0, 10),
      newBookings: parseInt(b.new_bookings || 0, 10),
      new_bookings: parseInt(b.new_bookings || 0, 10),
      pendingBookings: parseInt(b.pending_bookings || 0, 10),
      confirmedBookings: parseInt(b.confirmed_bookings || 0, 10),
      inProgressBookings: parseInt(b.in_progress_bookings || 0, 10),
      completedBookings: parseInt(b.completed_bookings || 0, 10),
      cancelledBookings: parseInt(b.cancelled_bookings || 0, 10),

      totalProjects: parseInt(p.total_projects || 0, 10),
      activeProjects: parseInt(p.active_projects || 0, 10),
      active_projects: parseInt(p.active_projects || 0, 10),

      totalDeliveries: parseInt(d.total_deliveries || 0, 10),
      pendingDeliveries: parseInt(d.pending_deliveries || 0, 10),
      approvedDeliveries: parseInt(d.approved_deliveries || 0, 10),

      totalQuotes: parseInt(q.total_quotes || 0, 10),
      acceptedQuotes: parseInt(q.accepted_quotes || 0, 10),
      convertedQuotes: parseInt(q.converted_quotes || 0, 10),
    };
  }

  // ── 2. LIST ORDERS (MASTER & FILTERED) ──────────────────────────────────────
  async listOrders(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      order_type, // 'asset', 'service'
      status, // 'pending', 'active', 'complete', 'disputed', 'refunded', 'cancelled'
      customer_id,
      seller_id,
      min_amount,
      max_amount,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = filters;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const conditions = ['1=1'];
    const values = [];

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(
        o.id::text ILIKE $${values.length} OR 
        o.listing_title ILIKE $${values.length} OR 
        buyer.display_name ILIKE $${values.length} OR 
        buyer.email ILIKE $${values.length} OR 
        seller.display_name ILIKE $${values.length} OR 
        seller.email ILIKE $${values.length} OR
        o.stripe_payment_intent_id ILIKE $${values.length}
      )`);
    }

    if (order_type && order_type !== 'all') {
      values.push(order_type);
      conditions.push(`o.listing_type = $${values.length}::listing_type_enum`);
    }

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`o.status = $${values.length}::order_status_enum`);
    }

    if (customer_id) {
      values.push(customer_id);
      conditions.push(`o.buyer_id = $${values.length}`);
    }

    if (seller_id) {
      values.push(seller_id);
      conditions.push(`o.seller_id = $${values.length}`);
    }

    if (min_amount) {
      values.push(parseInt(min_amount, 10));
      conditions.push(`o.amount_cents >= $${values.length}`);
    }

    if (max_amount) {
      values.push(parseInt(max_amount, 10));
      conditions.push(`o.amount_cents <= $${values.length}`);
    }

    if (start_date) {
      values.push(new Date(start_date));
      conditions.push(`o.created_at >= $${values.length}`);
    }

    if (end_date) {
      values.push(new Date(end_date));
      conditions.push(`o.created_at <= $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');

    const allowedSort = {
      created_at: 'o.created_at',
      amount_cents: 'o.amount_cents',
      status: 'o.status',
      listing_title: 'o.listing_title',
      completed_at: 'o.completed_at',
    };
    const sortField = allowedSort[sort_by] || 'o.created_at';
    const sortDir = (sort_order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM orders o
      JOIN users buyer ON buyer.id = o.buyer_id
      JOIN users seller ON seller.id = o.seller_id
      WHERE ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT
        o.id,
        o.buyer_id,
        o.seller_id,
        o.listing_id,
        o.listing_title,
        o.listing_type,
        o.license_type,
        o.amount_cents,
        o.discount_cents,
        o.platform_fee_cents,
        o.seller_payout_cents,
        o.currency,
        o.status,
        o.stripe_payment_intent_id,
        o.idempotency_key,
        o.promo_code_used,
        o.inspection_ends_at,
        o.download_expires_at,
        o.created_at,
        o.updated_at,
        o.completed_at,
        o.cancelled_at,
        o.refunded_at,
        buyer.display_name AS customer_name,
        buyer.email AS customer_email,
        buyer.avatar_url AS customer_avatar,
        seller.display_name AS seller_name,
        seller.email AS seller_email,
        seller.avatar_url AS seller_avatar,
        (
          SELECT json_agg(json_build_object(
            'id', oi.id,
            'title', oi.item_title,
            'type', oi.item_type,
            'quantity', oi.quantity,
            'price_cents', oi.total_price_cents
          ))
          FROM order_items oi
          WHERE oi.order_id = o.id
        ) AS items,
        (SELECT COUNT(*) FROM order_deliveries od WHERE od.order_id = o.id) AS deliveries_count,
        (SELECT COUNT(*) FROM projects p WHERE p.order_id = o.id) AS has_project
      FROM orders o
      JOIN users buyer ON buyer.id = o.buyer_id
      JOIN users seller ON seller.id = o.seller_id
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, values);

    return {
      orders: listRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  // ── 3. GET ORDER BY ID (CENTRAL 16-TAB WORKSPACE) ──────────────────────────
  async getOrderById(id) {
    const orderSql = `
      SELECT
        o.*,
        buyer.display_name AS customer_name,
        buyer.email AS customer_email,
        buyer.phone AS customer_phone,
        buyer.avatar_url AS customer_avatar,
        seller.display_name AS seller_name,
        seller.email AS seller_email,
        seller.phone AS seller_phone,
        seller.avatar_url AS seller_avatar
      FROM orders o
      JOIN users buyer ON buyer.id = o.buyer_id
      JOIN users seller ON seller.id = o.seller_id
      WHERE o.id = $1
    `;
    const orderRes = await query(orderSql, [id]);
    if (orderRes.rows.length === 0) {
      throw new NotFoundError('Order');
    }

    const order = orderRes.rows[0];

    // Fetch related tab sub-entities in parallel
    const [
      itemsRes,
      projectRes,
      milestonesRes,
      deliveriesRes,
      revisionsRes,
      disputeRes,
      notesRes,
      assignmentsRes,
      historyRes,
      paymentRes,
      cancellationRes,
      bookingsRes,
    ] = await Promise.all([
      query(`SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`, [id]),
      query(`SELECT * FROM projects WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]),
      query(
        `SELECT pm.* 
         FROM project_milestones pm
         JOIN projects p ON p.id = pm.project_id
         WHERE p.order_id = $1
         ORDER BY pm.sort_order ASC`,
        [id]
      ),
      query(`SELECT od.*, u.display_name AS reviewer_name FROM order_deliveries od LEFT JOIN users u ON u.id = od.reviewed_by_id WHERE od.order_id = $1 ORDER BY od.delivery_version DESC`, [id]),
      query(`SELECT r.*, u.display_name AS requester_name FROM order_revisions r LEFT JOIN users u ON u.id = r.requested_by_id WHERE r.order_id = $1 ORDER BY r.revision_number DESC`, [id]),
      query(`SELECT d.*, u.display_name AS opener_name, r.display_name AS resolver_name FROM disputes d LEFT JOIN users u ON u.id = d.opened_by_id LEFT JOIN users r ON r.id = d.resolved_by_id WHERE d.order_id = $1 LIMIT 1`, [id]),
      query(`SELECT n.*, u.display_name AS author_name FROM order_internal_notes n JOIN users u ON u.id = n.author_id WHERE n.order_id = $1 ORDER BY n.created_at DESC`, [id]),
      query(`SELECT a.*, by_u.display_name AS assigner_name, to_u.display_name AS assignee_name FROM order_assignments a JOIN users by_u ON by_u.id = a.assigned_by_id JOIN users to_u ON to_u.id = a.assigned_to_id WHERE a.order_id = $1 ORDER BY a.created_at DESC`, [id]),
      query(`SELECT h.*, u.display_name AS actor_name FROM order_status_history h LEFT JOIN users u ON u.id = h.performed_by_id WHERE h.order_id = $1 ORDER BY h.created_at DESC LIMIT 100`, [id]),
      query(`SELECT * FROM payment_intents WHERE order_id = $1 ORDER BY created_at DESC`, [id]),
      query(`SELECT c.*, u.display_name AS requester_name FROM order_cancellations c LEFT JOIN users u ON u.id = c.requested_by_id WHERE c.order_id = $1 LIMIT 1`, [id]),
      query(`SELECT cb.*, s.display_name AS seller_name FROM customer_bookings cb LEFT JOIN users s ON s.id = cb.seller_id WHERE cb.customer_id = $1 ORDER BY cb.appointment_date DESC LIMIT 5`, [order.buyer_id]),
    ]);

    order.items = itemsRes.rows;
    order.project = projectRes.rows[0] || null;
    order.milestones = milestonesRes.rows;
    order.deliveries = deliveriesRes.rows;
    order.revisions = revisionsRes.rows;
    order.dispute = disputeRes.rows[0] || null;
    order.notes = notesRes.rows;
    order.assignments = assignmentsRes.rows;
    order.history = historyRes.rows;
    order.payments = paymentRes.rows;
    order.cancellation = cancellationRes.rows[0] || null;
    order.bookings = bookingsRes.rows;

    return order;
  }

  // ── 4. ORDER STATUS TRANSITION (CONFIRM, PROCESS, COMPLETE, CANCEL) ────────
  async updateOrderStatus(orderId, newStatus, reason = null, actorId, req = {}) {
    const existingRes = await query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    if (existingRes.rows.length === 0) throw new NotFoundError('Order');
    const existing = existingRes.rows[0];

    const prevStatus = existing.status;
    const completedDate = newStatus === 'complete' ? new Date() : (newStatus === 'cancelled' ? null : existing.completed_at);
    const cancelledDate = newStatus === 'cancelled' ? new Date() : existing.cancelled_at;
    const refundedDate = newStatus === 'refunded' ? new Date() : existing.refunded_at;

    const res = await query(
      `UPDATE orders
       SET status = $2::order_status_enum,
           completed_at = $3,
           cancelled_at = $4,
           refunded_at = $5,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [orderId, newStatus, completedDate, cancelledDate, refundedDate]
    );

    const updated = res.rows[0];

    await recordOrderHistory(orderId, prevStatus, newStatus, `order.status_${newStatus}`, actorId, reason);
    await recordAudit(actorId, `order.status_update`, 'order', orderId, { status: prevStatus }, { status: newStatus, reason }, req);

    return this.getOrderById(orderId);
  }

  // ── 5. OPERATIONAL ASSIGNMENTS ─────────────────────────────────────────────
  async assignOrder(orderId, staffId, roleType = 'order_manager', notes = null, actorId, req = {}) {
    const orderRes = await query(`SELECT id FROM orders WHERE id = $1`, [orderId]);
    if (orderRes.rows.length === 0) throw new NotFoundError('Order');

    const staffRes = await query(`SELECT id, display_name FROM users WHERE id = $1`, [staffId]);
    if (staffRes.rows.length === 0) throw new NotFoundError('Staff user');

    const res = await query(
      `INSERT INTO order_assignments (order_id, assigned_by_id, assigned_to_id, role_type, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orderId, actorId, staffId, roleType, notes]
    );

    await recordOrderHistory(orderId, null, null, 'order.assigned', actorId, `Assigned to ${staffRes.rows[0].display_name} (${roleType})`);
    await recordAudit(actorId, 'order.assigned', 'order_assignment', res.rows[0].id, null, res.rows[0], req);

    return res.rows[0];
  }

  // ── 6. ORDER INTERNAL STAFF NOTES ──────────────────────────────────────────
  async addOrderInternalNote(orderId, note, authorId, req = {}) {
    if (!note?.trim()) throw new BadRequestError('Note text cannot be empty');

    const res = await query(
      `INSERT INTO order_internal_notes (order_id, author_id, note, visibility)
       VALUES ($1, $2, $3, 'staff_only')
       RETURNING *`,
      [orderId, authorId, note.trim()]
    );

    await recordAudit(authorId, 'order.internal_note', 'order_internal_note', res.rows[0].id, null, res.rows[0], req);
    return res.rows[0];
  }

  // ── 7. ORDER CANCELLATION & REFUND PROCESSING ──────────────────────────────
  async cancelOrder(orderId, reasonCategory, reasonDetails, refundEligible = false, actorId, req = {}) {
    const existingRes = await query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    if (existingRes.rows.length === 0) throw new NotFoundError('Order');
    const existing = existingRes.rows[0];

    const refundAmount = refundEligible ? existing.amount_cents : 0;

    await query(
      `INSERT INTO order_cancellations (order_id, requested_by_id, reason_category, reason_details, refund_eligible, refund_amount_cents, refund_processed, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'cancelled')`,
      [orderId, actorId, reasonCategory || 'Administrative Cancellation', reasonDetails || null, refundEligible, refundAmount, refundEligible]
    );

    const targetStatus = refundEligible ? 'refunded' : 'cancelled';
    return this.updateOrderStatus(orderId, targetStatus, `Cancelled: ${reasonCategory}. ${reasonDetails || ''}`.trim(), actorId, req);
  }

  // ── 8. LIST BOOKINGS ───────────────────────────────────────────────────────
  async listBookings(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      booking_status, // 'requested', 'pending_confirmation', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'
      seller_id,
      customer_id,
      date_from,
      date_to,
      sort_by = 'appointment_date',
      sort_order = 'DESC',
    } = filters;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const conditions = ['1=1'];
    const values = [];

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(
        cb.booking_number ILIKE $${values.length} OR 
        cb.service_title ILIKE $${values.length} OR 
        u.display_name ILIKE $${values.length} OR 
        u.email ILIKE $${values.length} OR 
        s.display_name ILIKE $${values.length}
      )`);
    }

    if (booking_status && booking_status !== 'all') {
      values.push(booking_status);
      conditions.push(`cb.booking_status = $${values.length}`);
    }

    if (seller_id) {
      values.push(seller_id);
      conditions.push(`cb.seller_id = $${values.length}`);
    }

    if (customer_id) {
      values.push(customer_id);
      conditions.push(`cb.customer_id = $${values.length}`);
    }

    if (date_from) {
      values.push(date_from);
      conditions.push(`cb.appointment_date >= $${values.length}`);
    }

    if (date_to) {
      values.push(date_to);
      conditions.push(`cb.appointment_date <= $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const countSql = `SELECT COUNT(*) AS total FROM customer_bookings cb JOIN users u ON u.id = cb.customer_id JOIN users s ON s.id = cb.seller_id WHERE ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT
        cb.*,
        u.display_name AS customer_name,
        u.email AS customer_email,
        u.avatar_url AS customer_avatar,
        s.display_name AS seller_name,
        s.email AS seller_email,
        s.avatar_url AS seller_avatar
      FROM customer_bookings cb
      JOIN users u ON u.id = cb.customer_id
      JOIN users s ON s.id = cb.seller_id
      WHERE ${whereClause}
      ORDER BY cb.${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, values);

    return {
      bookings: listRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  // ── 9. UPDATE BOOKING STATUS & RESCHEDULE ───────────────────────────────────
  async updateBookingStatus(bookingId, targetStatus, notes = null, actorId, req = {}) {
    const existing = await query(`SELECT * FROM customer_bookings WHERE id = $1`, [bookingId]);
    if (existing.rows.length === 0) throw new NotFoundError('Booking');

    const res = await query(
      `UPDATE customer_bookings
       SET booking_status = $2,
           admin_notes = COALESCE($3, admin_notes),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [bookingId, targetStatus, notes]
    );

    const updated = res.rows[0];
    await recordAudit(actorId, `booking.${targetStatus}`, 'customer_booking', bookingId, existing.rows[0], updated, req);
    return updated;
  }

  async rescheduleBooking(bookingId, newDate, newStartTime, newEndTime, reason = null, actorId, req = {}) {
    const existing = await query(`SELECT * FROM customer_bookings WHERE id = $1`, [bookingId]);
    if (existing.rows.length === 0) throw new NotFoundError('Booking');

    const res = await query(
      `UPDATE customer_bookings
       SET appointment_date = $2,
           start_time = $3,
           end_time = $4,
           booking_status = 'rescheduled',
           admin_notes = COALESCE($5, admin_notes),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [bookingId, newDate, newStartTime, newEndTime, reason]
    );

    const updated = res.rows[0];
    await recordAudit(actorId, 'booking.rescheduled', 'customer_booking', bookingId, existing.rows[0], updated, req);
    return updated;
  }

  // ── 10. LIST ACTIVE PROJECTS ───────────────────────────────────────────────
  async listActiveProjects(filters = {}) {
    const { page = 1, limit = 20, search, status, sort_by = 'created_at', sort_order = 'DESC' } = filters;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const conditions = ['1=1'];
    const values = [];

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(p.title ILIKE $${values.length} OR buyer.display_name ILIKE $${values.length} OR seller.display_name ILIKE $${values.length})`);
    }

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`p.status = $${values.length}::project_status_enum`);
    }

    const whereClause = conditions.join(' AND ');
    const countSql = `SELECT COUNT(*) AS total FROM projects p JOIN users buyer ON buyer.id = p.buyer_id JOIN users seller ON seller.id = p.seller_id WHERE ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT
        p.*,
        buyer.display_name AS customer_name,
        buyer.email AS customer_email,
        seller.display_name AS seller_name,
        seller.email AS seller_email,
        (
          SELECT json_agg(json_build_object(
            'id', pm.id,
            'title', pm.title,
            'status', pm.status,
            'amount_cents', pm.amount_cents,
            'due_date', pm.due_date
          ))
          FROM project_milestones pm
          WHERE pm.project_id = p.id
        ) AS milestones,
        (
          SELECT COUNT(*)
          FROM project_milestones pm
          WHERE pm.project_id = p.id AND pm.status = 'approved'
        ) AS completed_milestones,
        (
          SELECT COUNT(*)
          FROM project_milestones pm
          WHERE pm.project_id = p.id
        ) AS total_milestones
      FROM projects p
      JOIN users buyer ON buyer.id = p.buyer_id
      JOIN users seller ON seller.id = p.seller_id
      WHERE ${whereClause}
      ORDER BY p.${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, values);

    // Calculate progress percentage dynamically
    const projects = listRes.rows.map(p => {
      const total = parseInt(p.total_milestones || 0, 10);
      const completed = parseInt(p.completed_milestones || 0, 10);
      const progress = total > 0 ? Math.round((completed / total) * 100) : (p.status === 'complete' ? 100 : 25);
      return { ...p, progress };
    });

    return {
      projects,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  // ── 11. LIST SUBMITTED DELIVERIES ──────────────────────────────────────────
  async listDeliveries(filters = {}) {
    const { page = 1, limit = 20, search, review_status } = filters;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const conditions = ['1=1'];
    const values = [];

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(od.title ILIKE $${values.length} OR s.display_name ILIKE $${values.length} OR o.listing_title ILIKE $${values.length})`);
    }

    if (review_status && review_status !== 'all') {
      values.push(review_status);
      conditions.push(`od.review_status = $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const countRes = await query(`SELECT COUNT(*) AS total FROM order_deliveries od JOIN orders o ON o.id = od.order_id JOIN users s ON s.id = od.seller_id WHERE ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT
        od.*,
        o.listing_title,
        o.amount_cents,
        s.display_name AS seller_name,
        s.email AS seller_email,
        buyer.display_name AS customer_name,
        buyer.email AS customer_email,
        u.display_name AS reviewer_name
      FROM order_deliveries od
      JOIN orders o ON o.id = od.order_id
      JOIN users s ON s.id = od.seller_id
      JOIN users buyer ON buyer.id = o.buyer_id
      LEFT JOIN users u ON u.id = od.reviewed_by_id
      WHERE ${whereClause}
      ORDER BY od.submitted_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, values);

    return {
      deliveries: listRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  async reviewDelivery(deliveryId, reviewStatus, notes = null, reviewerId, req = {}) {
    const existing = await query(`SELECT * FROM order_deliveries WHERE id = $1`, [deliveryId]);
    if (existing.rows.length === 0) throw new NotFoundError('Delivery');

    const res = await query(
      `UPDATE order_deliveries
       SET review_status = $2,
           review_notes = COALESCE($3, review_notes),
           reviewed_by_id = $4,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [deliveryId, reviewStatus, notes, reviewerId]
    );

    const updated = res.rows[0];

    // If approved, update order status to complete
    if (reviewStatus === 'approved') {
      await this.updateOrderStatus(updated.order_id, 'complete', 'Delivery approved by platform moderator.', reviewerId, req);
    }

    await recordAudit(reviewerId, `delivery.${reviewStatus}`, 'order_delivery', deliveryId, existing.rows[0], updated, req);
    return updated;
  }

  // ── 12. LIST REVISION REQUESTS ─────────────────────────────────────────────
  async listRevisions(filters = {}) {
    const { page = 1, limit = 20, status } = filters;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const conditions = ['1=1'];
    const values = [];

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`r.status = $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const countRes = await query(`SELECT COUNT(*) AS total FROM order_revisions r WHERE ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT
        r.*,
        o.listing_title,
        u.display_name AS requester_name,
        u.email AS requester_email,
        s.display_name AS seller_name
      FROM order_revisions r
      JOIN orders o ON o.id = r.order_id
      JOIN users u ON u.id = r.requested_by_id
      JOIN users s ON s.id = o.seller_id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, values);

    return {
      revisions: listRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  // ── 13. LIST DISPUTES ──────────────────────────────────────────────────────
  async listDisputes(filters = {}) {
    const { page = 1, limit = 20, status } = filters;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const conditions = ['1=1'];
    const values = [];

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`d.status = $${values.length}::dispute_status_enum`);
    }

    const whereClause = conditions.join(' AND ');
    const countRes = await query(`SELECT COUNT(*) AS total FROM disputes d WHERE ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT
        d.*,
        o.listing_title,
        o.amount_cents,
        buyer.display_name AS customer_name,
        buyer.email AS customer_email,
        seller.display_name AS seller_name,
        seller.email AS seller_email,
        resolver.display_name AS resolver_name
      FROM disputes d
      JOIN orders o ON o.id = d.order_id
      JOIN users buyer ON buyer.id = d.opened_by_id
      JOIN users seller ON seller.id = o.seller_id
      LEFT JOIN users resolver ON resolver.id = d.resolved_by_id
      WHERE ${whereClause}
      ORDER BY d.opened_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, values);

    return {
      disputes: listRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  async resolveDispute(disputeId, resolutionData, actorId, req = {}) {
    const { outcome, outcome_notes, refund_amount_cents } = resolutionData;
    const existing = await query(`SELECT * FROM disputes WHERE id = $1`, [disputeId]);
    if (existing.rows.length === 0) throw new NotFoundError('Dispute');

    const res = await query(
      `UPDATE disputes
       SET status = 'resolved',
           outcome = $2::dispute_outcome_enum,
           outcome_notes = $3,
           refund_amount_cents = $4,
           resolved_by_id = $5,
           resolved_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [disputeId, outcome, outcome_notes, refund_amount_cents || 0, actorId]
    );

    const updated = res.rows[0];

    // If refund outcome, adjust order status
    if (outcome === 'full_refund' || outcome === 'partial_refund') {
      await this.updateOrderStatus(updated.order_id, 'refunded', `Dispute resolved with ${outcome}: ${outcome_notes || ''}`, actorId, req);
    }

    await recordAudit(actorId, 'dispute.resolved', 'dispute', disputeId, existing.rows[0], updated, req);
    return updated;
  }

  // ── 14. LIST CUSTOM QUOTES ─────────────────────────────────────────────────
  async listCustomQuotes(filters = {}) {
    const { page = 1, limit = 20, status, search } = filters;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const conditions = ['1=1'];
    const values = [];

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(q.quote_number ILIKE $${values.length} OR q.project_title ILIKE $${values.length} OR c.display_name ILIKE $${values.length} OR s.display_name ILIKE $${values.length})`);
    }

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`q.status = $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const countRes = await query(`SELECT COUNT(*) AS total FROM custom_quotes q JOIN users c ON c.id = q.customer_id JOIN users s ON s.id = q.seller_id WHERE ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT
        q.*,
        c.display_name AS customer_name,
        c.email AS customer_email,
        s.display_name AS seller_name,
        s.email AS seller_email,
        (
          SELECT json_agg(json_build_object(
            'id', n.id,
            'sender_id', n.sender_id,
            'message', n.message,
            'proposed_price_cents', n.proposed_price_cents,
            'created_at', n.created_at
          ))
          FROM custom_quote_negotiations n
          WHERE n.quote_id = q.id
        ) AS negotiations
      FROM custom_quotes q
      JOIN users c ON c.id = q.customer_id
      JOIN users s ON s.id = q.seller_id
      WHERE ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, values);

    return {
      quotes: listRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  async convertQuoteToOrder(quoteId, actorId, req = {}) {
    const quoteRes = await query(`SELECT * FROM custom_quotes WHERE id = $1`, [quoteId]);
    if (quoteRes.rows.length === 0) throw new NotFoundError('Custom quote');
    const quote = quoteRes.rows[0];

    if (quote.converted_order_id) {
      throw new ConflictError('This quote has already been converted into an order.');
    }

    // Find a valid listing or default listing for constraint
    const listingRes = await query(`SELECT id FROM listings LIMIT 1`);
    const listingId = listingRes.rows[0]?.id;

    const grossCents = quote.proposed_amount_cents;
    const platformFeeCents = Math.round(grossCents * 0.12);
    const sellerPayoutCents = grossCents - platformFeeCents;

    const orderRes = await query(
      `INSERT INTO orders (
        buyer_id, seller_id, listing_id, listing_title, listing_type, license_type,
        amount_cents, discount_cents, platform_fee_cents, seller_payout_cents, currency,
        status, stripe_payment_intent_id, idempotency_key,
        inspection_ends_at, download_expires_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, 'service', 'commercial',
        $5, 0, $6, $7, 'USD',
        'active', $8, $9,
        NOW() + INTERVAL '30 days', NOW() + INTERVAL '365 days', NOW(), NOW()
      ) RETURNING *`,
      [
        quote.customer_id,
        quote.seller_id,
        listingId,
        quote.project_title,
        grossCents,
        platformFeeCents,
        sellerPayoutCents,
        `pi_quote_${crypto.randomBytes(8).toString('hex')}`,
        crypto.randomUUID(),
      ]
    );

    const order = orderRes.rows[0];

    // Seed order item
    await query(
      `INSERT INTO order_items (order_id, item_type, item_title, quantity, unit_price_cents, total_price_cents, currency, license_type)
       VALUES ($1, 'custom_quote', $2, 1, $3, $3, 'USD', 'commercial')`,
      [order.id, quote.project_title, grossCents]
    );

    // Link converted order in quote
    await query(
      `UPDATE custom_quotes
       SET status = 'converted_to_order',
           converted_order_id = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [quoteId, order.id]
    );

    await recordOrderHistory(order.id, null, 'active', 'quote.converted', actorId, `Order created from custom quote #${quote.quote_number}`);
    await recordAudit(actorId, 'quote.converted', 'custom_quote', quoteId, { status: quote.status }, { status: 'converted_to_order', order_id: order.id }, req);

    return this.getOrderById(order.id);
  }

  // ── 15. LIST ORDER HISTORY EVENTS ──────────────────────────────────────────
  async listOrderHistory(filters = {}) {
    const { page = 1, limit = 50, order_id, action } = filters;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const conditions = ['1=1'];
    const values = [];

    if (order_id) {
      values.push(order_id);
      conditions.push(`h.order_id = $${values.length}`);
    }

    if (action) {
      values.push(action);
      conditions.push(`h.action = $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const countRes = await query(`SELECT COUNT(*) AS total FROM order_status_history h WHERE ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT
        h.*,
        o.listing_title,
        u.display_name AS actor_name,
        u.email AS actor_email
      FROM order_status_history h
      JOIN orders o ON o.id = h.order_id
      LEFT JOIN users u ON u.id = h.performed_by_id
      WHERE ${whereClause}
      ORDER BY h.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, values);

    return {
      history: listRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }
}

module.exports = new OrdersBookingsService();
