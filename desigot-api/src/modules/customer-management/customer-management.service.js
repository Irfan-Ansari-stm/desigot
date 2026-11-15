'use strict';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../../db/pool');
const { NotFoundError, BadRequestError } = require('../../shared/errors/AppError');
const logger = require('../../config/logger');

async function recordAudit(actorId, action, entityType, entityId, oldVal = null, newVal = null, req = {}) {
  try {
    await query(
      `INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, ip_address, user_agent, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        actorId || null,
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

async function recordCustomerActivity(customerId, eventType, description, req = {}, relatedType = null, relatedId = null, metadata = {}) {
  try {
    await query(
      `INSERT INTO customer_activity_events (customer_id, event_type, description, related_entity_type, related_entity_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        customerId,
        eventType,
        description,
        relatedType,
        relatedId,
        req.ip || '127.0.0.1',
        req.headers?.['user-agent'] || null,
        JSON.stringify(metadata),
      ]
    );
  } catch (err) {
    logger.warn('Failed to record customer activity event', { err: err.message });
  }
}

class CustomerManagementService {
  // ── 1. STATS & KPIS ────────────────────────────────────────────────────────
  async getCustomerStats() {
    const statsQuery = `
      SELECT
        COUNT(*) AS total_customers,
        COUNT(*) FILTER (WHERE u.account_status = 'active' AND (u.last_login_at >= NOW() - INTERVAL '30 days' OR u.created_at >= NOW() - INTERVAL '30 days')) AS active_customers,
        COUNT(*) FILTER (WHERE u.account_status = 'active' AND (u.last_login_at < NOW() - INTERVAL '30 days' OR (u.last_login_at IS NULL AND u.created_at < NOW() - INTERVAL '30 days'))) AS inactive_customers,
        COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '14 days') AS new_customers,
        COUNT(*) FILTER (WHERE u.account_status = 'suspended') AS suspended_customers,
        COUNT(*) FILTER (WHERE u.email_verified_at IS NOT NULL) AS verified_customers,
        COALESCE(SUM(cp.lifetime_spending_cents), 0) AS total_spending_cents,
        COALESCE(SUM(cp.total_orders_count), 0) AS total_orders,
        COALESCE(SUM(cp.total_bookings_count), 0) AS total_bookings,
        COALESCE(SUM(cp.total_refunds_cents), 0) AS total_refunds_cents
      FROM users u
      LEFT JOIN customer_profiles cp ON cp.user_id = u.id
      WHERE u.role = 'buyer' AND u.deleted_at IS NULL;
    `;

    const complaintsQuery = `
      SELECT
        COUNT(*) AS total_complaints,
        COUNT(*) FILTER (WHERE status IN ('open', 'pending', 'assigned', 'in_progress', 'waiting_for_customer', 'waiting_for_seller', 'escalated')) AS open_complaints,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_complaints
      FROM customer_complaints;
    `;

    const bookingsQuery = `
      SELECT
        COUNT(*) AS total_bookings_system,
        COUNT(*) FILTER (WHERE booking_status = 'confirmed') AS confirmed_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'completed') AS completed_bookings
      FROM customer_bookings;
    `;

    const [statsRes, compRes, bookRes] = await Promise.all([
      query(statsQuery),
      query(complaintsQuery),
      query(bookingsQuery),
    ]);

    const s = statsRes.rows[0];
    const c = compRes.rows[0];
    const b = bookRes.rows[0];

    const totalCust = parseInt(s.total_customers || 0, 10);
    const spending = parseInt(s.total_spending_cents || 0, 10);
    const avgLTV = totalCust > 0 ? Math.round(spending / totalCust) : 0;

    return {
      totalCustomers: totalCust,
      total_customers: totalCust,
      activeCustomers: parseInt(s.active_customers || 0, 10),
      active_customers: parseInt(s.active_customers || 0, 10),
      inactiveCustomers: parseInt(s.inactive_customers || 0, 10),
      inactive_customers: parseInt(s.inactive_customers || 0, 10),
      newCustomers: parseInt(s.new_customers || 0, 10),
      new_customers: parseInt(s.new_customers || 0, 10),
      suspendedCustomers: parseInt(s.suspended_customers || 0, 10),
      suspended_customers: parseInt(s.suspended_customers || 0, 10),
      verifiedCustomers: parseInt(s.verified_customers || 0, 10),
      verified_customers: parseInt(s.verified_customers || 0, 10),
      totalSpendingCents: spending,
      total_spending_cents: spending,
      totalOrders: parseInt(s.total_orders || 0, 10),
      total_orders: parseInt(s.total_orders || 0, 10),
      totalBookings: parseInt(b.total_bookings_system || s.total_bookings || 0, 10),
      total_bookings: parseInt(b.total_bookings_system || s.total_bookings || 0, 10),
      totalRefundsCents: parseInt(s.total_refunds_cents || 0, 10),
      total_refunds_cents: parseInt(s.total_refunds_cents || 0, 10),
      avgLTVCents: avgLTV,
      avg_ltv_cents: avgLTV,
      totalComplaints: parseInt(c.total_complaints || 0, 10),
      total_complaints: parseInt(c.total_complaints || 0, 10),
      openComplaints: parseInt(c.open_complaints || 0, 10),
      open_complaints: parseInt(c.open_complaints || 0, 10),
      resolvedComplaints: parseInt(c.resolved_complaints || 0, 10),
      resolved_complaints: parseInt(c.resolved_complaints || 0, 10),
      confirmedBookings: parseInt(b.confirmed_bookings || 0, 10),
      completedBookings: parseInt(b.completed_bookings || 0, 10),
      retentionRate: totalCust > 0 ? Math.min(100, Math.round(((parseInt(s.active_customers || 0, 10)) / totalCust) * 100)) : 85,
    };
  }

  // ── 2. LIST CUSTOMERS ──────────────────────────────────────────────────────
  async listCustomers(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status, // 'active', 'inactive', 'new', 'suspended'
      customer_type, // 'individual', 'business', 'vip'
      country,
      city,
      min_spending,
      max_spending,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = filters;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const conditions = ["u.role = 'buyer'", "u.deleted_at IS NULL"];
    const values = [];

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(u.display_name ILIKE $${values.length} OR u.email ILIKE $${values.length} OR u.phone ILIKE $${values.length} OR cp.company_name ILIKE $${values.length})`);
    }

    if (status) {
      if (status === 'active') {
        conditions.push(`u.account_status = 'active' AND (u.last_login_at >= NOW() - INTERVAL '30 days' OR u.created_at >= NOW() - INTERVAL '30 days')`);
      } else if (status === 'inactive') {
        conditions.push(`u.account_status = 'active' AND (u.last_login_at < NOW() - INTERVAL '30 days' OR (u.last_login_at IS NULL AND u.created_at < NOW() - INTERVAL '30 days'))`);
      } else if (status === 'new') {
        conditions.push(`u.created_at >= NOW() - INTERVAL '14 days'`);
      } else if (status === 'suspended') {
        conditions.push(`u.account_status = 'suspended'`);
      } else if (status !== 'all') {
        values.push(status);
        conditions.push(`u.account_status = $${values.length}`);
      }
    }

    if (customer_type) {
      values.push(customer_type);
      conditions.push(`cp.customer_type = $${values.length}`);
    }

    if (country) {
      values.push(`%${country.trim()}%`);
      conditions.push(`cp.country ILIKE $${values.length}`);
    }

    if (city) {
      values.push(`%${city.trim()}%`);
      conditions.push(`cp.city ILIKE $${values.length}`);
    }

    if (min_spending) {
      values.push(parseInt(min_spending, 10));
      conditions.push(`cp.lifetime_spending_cents >= $${values.length}`);
    }

    if (max_spending) {
      values.push(parseInt(max_spending, 10));
      conditions.push(`cp.lifetime_spending_cents <= $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = {
      created_at: 'u.created_at',
      display_name: 'u.display_name',
      last_login_at: 'u.last_login_at',
      lifetime_spending_cents: 'cp.lifetime_spending_cents',
      total_orders_count: 'cp.total_orders_count',
      total_bookings_count: 'cp.total_bookings_count',
    };
    const sortField = allowedSort[sort_by] || 'u.created_at';
    const sortDir = (sort_order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM users u
      LEFT JOIN customer_profiles cp ON cp.user_id = u.id
      WHERE ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT
        u.id,
        u.email,
        COALESCE(u.display_name, TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.username, u.email) AS name,
        u.display_name,
        u.first_name,
        u.last_name,
        u.phone,
        u.avatar_url,
        u.account_status,
        CASE
          WHEN u.account_status = 'suspended' THEN 'suspended'
          WHEN u.account_status = 'active' AND (u.last_login_at < NOW() - INTERVAL '30 days' OR (u.last_login_at IS NULL AND u.created_at < NOW() - INTERVAL '30 days')) THEN 'inactive'
          WHEN u.created_at >= NOW() - INTERVAL '14 days' THEN 'new'
          ELSE 'active'
        END AS customer_lifecycle_status,
        u.email_verified_at,
        u.last_login_at,
        u.created_at,
        u.suspension_reason,
        cp.customer_type,
        cp.company_name,
        cp.country,
        cp.state,
        cp.city,
        cp.postal_code,
        cp.preferred_language,
        cp.timezone,
        cp.lifetime_spending_cents,
        cp.total_orders_count,
        cp.total_bookings_count,
        cp.avg_rating_given,
        cp.risk_score,
        CASE 
          WHEN u.last_login_at IS NOT NULL THEN EXTRACT(DAY FROM NOW() - u.last_login_at)::INTEGER
          ELSE EXTRACT(DAY FROM NOW() - u.created_at)::INTEGER
        END AS days_inactive,
        (
          SELECT json_agg(json_build_object('name', ct.name, 'slug', ct.slug, 'color', ct.color))
          FROM customer_tag_assignments cta
          JOIN customer_tags ct ON ct.id = cta.tag_id
          WHERE cta.customer_id = u.id
        ) AS tags
      FROM users u
      LEFT JOIN customer_profiles cp ON cp.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, values);

    return {
      customers: listRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  // ── 3. GET CUSTOMER BY ID (CENTRAL 13-TAB DATA) ───────────────────────────
  async getCustomerById(id) {
    const userRes = await query(
      `SELECT
        u.id, u.email,
        COALESCE(u.display_name, TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.username, u.email) AS name,
        u.display_name, u.first_name, u.last_name, u.phone,
        u.avatar_url, u.bio, u.account_status,
        CASE
          WHEN u.account_status = 'suspended' THEN 'suspended'
          WHEN u.account_status = 'active' AND (u.last_login_at < NOW() - INTERVAL '30 days' OR (u.last_login_at IS NULL AND u.created_at < NOW() - INTERVAL '30 days')) THEN 'inactive'
          WHEN u.created_at >= NOW() - INTERVAL '14 days' THEN 'new'
          ELSE 'active'
        END AS customer_lifecycle_status,
        u.email_verified_at, u.last_login_at,
        u.created_at, u.updated_at, u.suspension_reason,
        cp.customer_type, cp.company_name, cp.vat_tax_id, cp.date_of_birth, cp.gender,
        cp.country, cp.state, cp.city, cp.postal_code, cp.address_line1, cp.address_line2,
        cp.preferred_language, cp.timezone, cp.email_verified, cp.phone_verified,
        cp.lifetime_spending_cents, cp.total_orders_count, cp.total_bookings_count,
        cp.total_refunds_cents, cp.avg_rating_given, cp.risk_score,
        CASE 
          WHEN u.last_login_at IS NOT NULL THEN EXTRACT(DAY FROM NOW() - u.last_login_at)::INTEGER
          ELSE EXTRACT(DAY FROM NOW() - u.created_at)::INTEGER
        END AS days_inactive
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id]
    );

    if (userRes.rows.length === 0) {
      throw new NotFoundError('Customer not found');
    }

    const customer = userRes.rows[0];

    // Fetch related tab sub-entities
    const [addrRes, ordRes, bookRes, revRes, compRes, actRes, notesRes, tagsRes, commRes, auditRes] = await Promise.all([
      query(`SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at ASC`, [id]),
      query(
        `SELECT o.*, 
                s.display_name AS seller_name, s.email AS seller_email
         FROM orders o
         LEFT JOIN users s ON s.id = o.seller_id
         WHERE o.buyer_id = $1
         ORDER BY o.created_at DESC`,
        [id]
      ),
      query(
        `SELECT cb.*, 
                s.display_name AS seller_name, s.email AS seller_email
         FROM customer_bookings cb
         LEFT JOIN users s ON s.id = cb.seller_id
         WHERE cb.customer_id = $1
         ORDER BY cb.appointment_date DESC, cb.start_time DESC`,
        [id]
      ),
      query(
        `SELECT r.*,
                s.display_name AS seller_name,
                l.title AS listing_title
         FROM reviews r
         LEFT JOIN users s ON s.id = r.subject_id
         LEFT JOIN listings l ON l.id = r.listing_id
         WHERE r.reviewer_id = $1
         ORDER BY r.created_at DESC`,
        [id]
      ),
      query(
        `SELECT c.*,
                a.display_name AS assigned_agent_name,
                s.display_name AS seller_name
         FROM customer_complaints c
         LEFT JOIN users a ON a.id = c.assigned_agent_id
         LEFT JOIN users s ON s.id = c.related_seller_id
         WHERE c.customer_id = $1
         ORDER BY c.created_at DESC`,
        [id]
      ),
      query(`SELECT * FROM customer_activity_events WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
      query(
        `SELECT cn.*, a.display_name AS admin_name
         FROM customer_internal_notes cn
         LEFT JOIN users a ON a.id = cn.admin_id
         WHERE cn.customer_id = $1
         ORDER BY cn.created_at DESC`,
        [id]
      ),
      query(
        `SELECT ct.*
         FROM customer_tag_assignments cta
         JOIN customer_tags ct ON ct.id = cta.tag_id
         WHERE cta.customer_id = $1
         ORDER BY ct.name ASC`,
        [id]
      ),
      query(`SELECT * FROM customer_communication_history WHERE customer_id = $1 ORDER BY sent_at DESC LIMIT 50`, [id]),
      query(
        `SELECT al.*, u.display_name AS actor_name
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.actor_id
         WHERE al.entity_id = $1 OR al.new_values::text LIKE $2
         ORDER BY al.created_at DESC LIMIT 50`,
        [id, `%${id}%`]
      ),
    ]);

    customer.addresses = addrRes.rows;
    customer.orders = ordRes.rows;
    customer.bookings = bookRes.rows;
    customer.reviews = revRes.rows;
    customer.complaints = compRes.rows;
    customer.activity = actRes.rows;
    customer.notes = notesRes.rows;
    customer.tags = tagsRes.rows;
    customer.communications = commRes.rows;
    customer.audit_logs = auditRes.rows;

    return customer;
  }

  // ── 4. CREATE CUSTOMER ─────────────────────────────────────────────────────
  async createCustomer(data, actorId, req = {}) {
    const email = data.email?.toLowerCase().trim();
    if (!email) throw new BadRequestError('Email address is required');

    const check = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (check.rows.length > 0) throw new BadRequestError('User with this email already exists');

    const first = data.first_name?.trim() || 'Valued';
    const last = data.last_name?.trim() || 'Customer';
    const displayName = data.display_name?.trim() || `${first} ${last}`;
    const username = data.username?.trim() || `${first.toLowerCase()}_${Date.now().toString(36)}`;
    const phone = data.phone?.trim() || null;
    const password = data.password || 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);

    const userRes = await query(
      `INSERT INTO users
       (email, display_name, username, first_name, last_name, phone, role, account_status,
        password_hash, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'buyer', 'active', $7, NOW(), NOW(), NOW())
       RETURNING *`,
      [email, displayName, username, first, last, phone, passwordHash]
    );
    const user = userRes.rows[0];

    // Create profile
    await query(
      `INSERT INTO customer_profiles
       (user_id, customer_type, company_name, country, state, city, postal_code, address_line1,
        preferred_language, timezone, email_verified, phone_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, false)`,
      [
        user.id,
        data.customer_type || 'individual',
        data.company_name || null,
        data.country || 'United States',
        data.state || null,
        data.city || null,
        data.postal_code || null,
        data.address_line1 || null,
        data.preferred_language || 'English',
        data.timezone || 'UTC',
      ]
    );

    // Initial address if supplied
    if (data.address_line1 && data.city && data.postal_code) {
      await query(
        `INSERT INTO customer_addresses (customer_id, address_type, is_default, recipient_name, phone, address_line1, city, state, postal_code, country)
         VALUES ($1, 'shipping', true, $2, $3, $4, $5, $6, $7, $8)`,
        [user.id, displayName, phone, data.address_line1, data.city, data.state, data.postal_code, data.country || 'United States']
      );
    }

    await recordAudit(actorId, 'customer.created', 'user', user.id, null, user, req);
    await recordCustomerActivity(user.id, 'customer.registered', 'Customer account registered by admin.', req);

    return this.getCustomerById(user.id);
  }

  // ── 5. UPDATE CUSTOMER PROFILE ─────────────────────────────────────────────
  async updateCustomer(id, data, actorId, req = {}) {
    const existing = await this.getCustomerById(id);

    // Update users table fields
    const newFirst = data.first_name !== undefined ? data.first_name : existing.first_name;
    const newLast = data.last_name !== undefined ? data.last_name : existing.last_name;
    const computedName = data.display_name || (newFirst ? `${newFirst} ${newLast || ''}`.trim() : null);

    if (data.display_name || data.first_name || data.last_name || data.phone) {
      await query(
        `UPDATE users
         SET display_name = COALESCE($2, display_name),
             first_name = COALESCE($3, first_name),
             last_name = COALESCE($4, last_name),
             phone = COALESCE($5, phone),
             updated_at = NOW()
         WHERE id = $1`,
        [id, computedName, data.first_name, data.last_name, data.phone]
      );
    }

    // Update customer_profiles table fields
    await query(
      `UPDATE customer_profiles
       SET customer_type = COALESCE($2, customer_type),
           company_name = COALESCE($3, company_name),
           vat_tax_id = COALESCE($4, vat_tax_id),
           country = COALESCE($5, country),
           state = COALESCE($6, state),
           city = COALESCE($7, city),
           postal_code = COALESCE($8, postal_code),
           address_line1 = COALESCE($9, address_line1),
           preferred_language = COALESCE($10, preferred_language),
           timezone = COALESCE($11, timezone),
           risk_score = COALESCE($12, risk_score),
           updated_at = NOW()
       WHERE user_id = $1`,
      [
        id,
        data.customer_type,
        data.company_name,
        data.vat_tax_id,
        data.country,
        data.state,
        data.city,
        data.postal_code,
        data.address_line1,
        data.preferred_language,
        data.timezone,
        data.risk_score,
      ]
    );

    await recordAudit(actorId, 'customer.updated', 'user', id, existing, data, req);
    await recordCustomerActivity(id, 'customer.profile_updated', 'Customer profile attributes updated.', req);

    return this.getCustomerById(id);
  }

  // ── 6. LIFECYCLE & ACCOUNT STATUS (ACTIVATE, SUSPEND, REACTIVATE) ───────────
  async setAccountStatus(id, targetStatus, reason = null, actorId, req = {}) {
    const existing = await this.getCustomerById(id);

    await query(
      `UPDATE users
       SET account_status = $2, suspension_reason = $3, updated_at = NOW()
       WHERE id = $1`,
      [id, targetStatus, reason]
    );

    await recordAudit(actorId, `customer.${targetStatus}`, 'user', id, { status: existing.account_status }, { status: targetStatus, reason }, req);
    await recordCustomerActivity(id, `account.${targetStatus}`, `Customer account status updated to ${targetStatus}: ${reason || 'Admin action'}`, req);

    return this.getCustomerById(id);
  }

  // ── 7. INTERNAL NOTES ──────────────────────────────────────────────────────
  async addInternalNote(customerId, note, adminId, req = {}) {
    if (!note?.trim()) throw new BadRequestError('Note content cannot be empty');

    const res = await query(
      `INSERT INTO customer_internal_notes (customer_id, admin_id, note, visibility)
       VALUES ($1, $2, $3, 'staff_only')
       RETURNING *`,
      [customerId, adminId, note.trim()]
    );

    const saved = res.rows[0];
    await recordAudit(adminId, 'customer.note_added', 'customer_internal_note', saved.id, null, saved, req);
    return saved;
  }

  async deleteInternalNote(noteId, adminId, req = {}) {
    const res = await query(`SELECT * FROM customer_internal_notes WHERE id = $1`, [noteId]);
    if (res.rows.length === 0) throw new NotFoundError('Note not found');

    await query(`DELETE FROM customer_internal_notes WHERE id = $1`, [noteId]);
    await recordAudit(adminId, 'customer.note_deleted', 'customer_internal_note', noteId, res.rows[0], null, req);
    return { message: 'Internal note deleted' };
  }

  // ── 8. ADDRESSES ───────────────────────────────────────────────────────────
  async addAddress(customerId, addressData, actorId, req = {}) {
    if (addressData.is_default) {
      await query(`UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1`, [customerId]);
    }

    let recipientName = addressData.recipient_name;
    if (!recipientName) {
      const uRes = await query(`SELECT display_name, first_name, last_name FROM users WHERE id = $1`, [customerId]);
      recipientName = uRes.rows[0]?.display_name || `${uRes.rows[0]?.first_name || ''} ${uRes.rows[0]?.last_name || ''}`.trim() || 'Valued Customer';
    }

    const line1 = addressData.address_line1 || addressData.street_address || '123 Main Street';

    const res = await query(
      `INSERT INTO customer_addresses
       (customer_id, address_type, is_default, recipient_name, phone, address_line1, address_line2, city, state, postal_code, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        customerId,
        addressData.address_type || 'shipping',
        addressData.is_default || false,
        recipientName,
        addressData.phone || null,
        line1,
        addressData.address_line2 || null,
        addressData.city || 'City',
        addressData.state || null,
        addressData.postal_code || '10001',
        addressData.country || 'United States',
      ]
    );

    const addr = res.rows[0];
    await recordAudit(actorId, 'customer.address_added', 'customer_address', addr.id, null, addr, req);
    return addr;
  }

  async deleteAddress(addressId, actorId, req = {}) {
    const res = await query(`SELECT * FROM customer_addresses WHERE id = $1`, [addressId]);
    if (res.rows.length === 0) throw new NotFoundError('Address not found');

    await query(`DELETE FROM customer_addresses WHERE id = $1`, [addressId]);
    await recordAudit(actorId, 'customer.address_deleted', 'customer_address', addressId, res.rows[0], null, req);
    return { message: 'Address removed' };
  }

  // ── 9. TAGS MANAGEMENT ─────────────────────────────────────────────────────
  async listAllTags() {
    const res = await query(`SELECT * FROM customer_tags ORDER BY name ASC`);
    return res.rows;
  }

  async assignTag(customerId, tagId, adminId, req = {}) {
    await query(
      `INSERT INTO customer_tag_assignments (customer_id, tag_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [customerId, tagId, adminId]
    );
    await recordAudit(adminId, 'customer.tag_assigned', 'customer_tag_assignment', `${customerId}:${tagId}`, null, { customerId, tagId }, req);
    return { message: 'Tag assigned successfully' };
  }

  async removeTag(customerId, tagId, adminId, req = {}) {
    await query(`DELETE FROM customer_tag_assignments WHERE customer_id = $1 AND tag_id = $2`, [customerId, tagId]);
    await recordAudit(adminId, 'customer.tag_removed', 'customer_tag_assignment', `${customerId}:${tagId}`, null, null, req);
    return { message: 'Tag removed successfully' };
  }

  // ── 10. CUSTOMER ORDERS DIRECTORY ──────────────────────────────────────────
  async listCustomerOrders(params = {}) {
    const { page = 1, limit = 20, search, customer_id, status } = params;
    const conditions = ['1=1'];
    const values = [];

    if (customer_id) {
      values.push(customer_id);
      conditions.push(`o.buyer_id = $${values.length}`);
    }

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`o.status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(o.listing_title ILIKE $${values.length} OR b.display_name ILIKE $${values.length} OR b.email ILIKE $${values.length} OR o.id::text ILIKE $${values.length})`);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const countRes = await query(
      `SELECT COUNT(*) AS total
       FROM orders o
       JOIN users b ON b.id = o.buyer_id
       WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const sql = `
      SELECT o.*,
             b.display_name AS customer_name,
             b.email AS customer_email,
             s.display_name AS seller_name,
             s.email AS seller_email
      FROM orders o
      JOIN users b ON b.id = o.buyer_id
      LEFT JOIN users s ON s.id = o.seller_id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const ordRes = await query(sql, values);

    return {
      orders: ordRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  // ── 11. CUSTOMER BOOKINGS DIRECTORY ────────────────────────────────────────
  async listCustomerBookings(params = {}) {
    const { page = 1, limit = 20, search, customer_id, status } = params;
    const conditions = ['1=1'];
    const values = [];

    if (customer_id) {
      values.push(customer_id);
      conditions.push(`cb.customer_id = $${values.length}`);
    }

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`cb.booking_status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(cb.booking_number ILIKE $${values.length} OR cb.service_title ILIKE $${values.length} OR u.display_name ILIKE $${values.length} OR s.display_name ILIKE $${values.length})`);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const countRes = await query(
      `SELECT COUNT(*) AS total
       FROM customer_bookings cb
       JOIN users u ON u.id = cb.customer_id
       JOIN users s ON s.id = cb.seller_id
       WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const sql = `
      SELECT cb.*,
             u.display_name AS customer_name,
             u.email AS customer_email,
             s.display_name AS seller_name,
             s.email AS seller_email
      FROM customer_bookings cb
      JOIN users u ON u.id = cb.customer_id
      JOIN users s ON s.id = cb.seller_id
      WHERE ${whereClause}
      ORDER BY cb.appointment_date DESC, cb.start_time DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const bookRes = await query(sql, values);

    return {
      bookings: bookRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  async updateBookingStatus(bookingId, targetStatus, notes = null, actorId, req = {}) {
    const existing = await query(`SELECT * FROM customer_bookings WHERE id = $1`, [bookingId]);
    if (existing.rows.length === 0) throw new NotFoundError('Booking not found');

    const res = await query(
      `UPDATE customer_bookings
       SET booking_status = $2, admin_notes = COALESCE($3, admin_notes), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [bookingId, targetStatus, notes]
    );

    const updated = res.rows[0];
    updated.status = updated.booking_status;
    await recordAudit(actorId, `booking.${targetStatus}`, 'customer_booking', bookingId, existing.rows[0], updated, req);
    await recordCustomerActivity(updated.customer_id, `booking.${targetStatus}`, `Booking #${updated.booking_number} status updated to ${targetStatus}`, req, 'booking', bookingId);

    return updated;
  }

  // ── 12. CUSTOMER REVIEWS DIRECTORY ─────────────────────────────────────────
  async listCustomerReviews(params = {}) {
    const { page = 1, limit = 20, search, customer_id, status } = params;
    const conditions = ['1=1'];
    const values = [];

    if (customer_id) {
      values.push(customer_id);
      conditions.push(`r.reviewer_id = $${values.length}`);
    }

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`r.status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(r.review_text ILIKE $${values.length} OR u.display_name ILIKE $${values.length} OR s.display_name ILIKE $${values.length})`);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const countRes = await query(
      `SELECT COUNT(*) AS total
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       LEFT JOIN users s ON s.id = r.subject_id
       WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const sql = `
      SELECT r.*,
             u.display_name AS customer_name,
             u.email AS customer_email,
             s.display_name AS seller_name,
             s.email AS seller_email,
             l.title AS listing_title
      FROM reviews r
      JOIN users u ON u.id = r.reviewer_id
      LEFT JOIN users s ON s.id = r.subject_id
      LEFT JOIN listings l ON l.id = r.listing_id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const revRes = await query(sql, values);

    return {
      reviews: revRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  async moderateReview(reviewId, targetStatus, moderationNote = '', actorId, req = {}) {
    const existing = await query(`SELECT * FROM reviews WHERE id = $1`, [reviewId]);
    if (existing.rows.length === 0) throw new NotFoundError('Review not found');

    const res = await query(
      `UPDATE reviews
       SET status = $2, moderation_note = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [reviewId, targetStatus, moderationNote]
    );

    const updated = res.rows[0];
    await recordAudit(actorId, `review.${targetStatus}`, 'review', reviewId, existing.rows[0], updated, req);
    return updated;
  }

  // ── 13. CUSTOMER COMPLAINTS / TICKETING DIRECTORY ──────────────────────────
  async listComplaints(params = {}) {
    const { page = 1, limit = 20, search, customer_id, status, priority, category } = params;
    const conditions = ['1=1'];
    const values = [];

    if (customer_id) {
      values.push(customer_id);
      conditions.push(`c.customer_id = $${values.length}`);
    }

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`c.status = $${values.length}`);
    }

    if (priority && priority !== 'all') {
      values.push(priority);
      conditions.push(`c.priority = $${values.length}`);
    }

    if (category && category !== 'all') {
      values.push(category);
      conditions.push(`c.category = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(c.ticket_number ILIKE $${values.length} OR c.subject ILIKE $${values.length} OR u.display_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const countRes = await query(
      `SELECT COUNT(*) AS total
       FROM customer_complaints c
       JOIN users u ON u.id = c.customer_id
       WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const sql = `
      SELECT c.*,
             u.display_name AS customer_name,
             u.email AS customer_email,
             a.display_name AS assigned_agent_name,
             s.display_name AS seller_name,
             (SELECT COUNT(*) FROM customer_complaint_messages m WHERE m.complaint_id = c.id) AS message_count
      FROM customer_complaints c
      JOIN users u ON u.id = c.customer_id
      LEFT JOIN users a ON a.id = c.assigned_agent_id
      LEFT JOIN users s ON s.id = c.related_seller_id
      WHERE ${whereClause}
      ORDER BY 
        CASE WHEN c.priority = 'urgent' THEN 1 WHEN c.priority = 'high' THEN 2 WHEN c.priority = 'normal' THEN 3 ELSE 4 END ASC,
        c.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const compRes = await query(sql, values);

    return {
      complaints: compRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  async getComplaintById(complaintId) {
    const compRes = await query(
      `SELECT c.*,
              u.display_name AS customer_name,
              u.email AS customer_email,
              u.phone AS customer_phone,
              a.display_name AS assigned_agent_name,
              s.display_name AS seller_name
       FROM customer_complaints c
       JOIN users u ON u.id = c.customer_id
       LEFT JOIN users a ON a.id = c.assigned_agent_id
       LEFT JOIN users s ON s.id = c.related_seller_id
       WHERE c.id = $1`,
      [complaintId]
    );

    if (compRes.rows.length === 0) throw new NotFoundError('Complaint ticket not found');
    const complaint = compRes.rows[0];

    const messagesRes = await query(
      `SELECT m.*, u.display_name AS sender_name, u.avatar_url AS sender_avatar
       FROM customer_complaint_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.complaint_id = $1
       ORDER BY m.created_at ASC`,
      [complaintId]
    );

    complaint.messages = messagesRes.rows;
    return complaint;
  }

  async addComplaintMessage(complaintId, message, isInternalNote, senderId, senderRole = 'support_agent', req = {}) {
    if (!message?.trim()) throw new BadRequestError('Message cannot be empty');

    const role = ['customer', 'support_agent', 'admin', 'system'].includes(senderRole) ? senderRole : 'admin';

    const res = await query(
      `INSERT INTO customer_complaint_messages
       (complaint_id, sender_id, sender_role, is_internal_note, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [complaintId, senderId, role, isInternalNote, message.trim()]
    );

    // Update complaint updated_at timestamp
    await query(`UPDATE customer_complaints SET updated_at = NOW() WHERE id = $1`, [complaintId]);

    const saved = res.rows[0];
    await recordAudit(senderId, isInternalNote ? 'complaint.internal_note' : 'complaint.replied', 'customer_complaint', complaintId, null, saved, req);
    return saved;
  }

  async updateComplaintStatus(complaintId, status, resolutionDetails = null, actorId, req = {}) {
    const existing = await query(`SELECT * FROM customer_complaints WHERE id = $1`, [complaintId]);
    if (existing.rows.length === 0) throw new NotFoundError('Complaint not found');

    const res = await query(
      `UPDATE customer_complaints
       SET status = $2,
           resolution_details = COALESCE($3, resolution_details),
           resolved_at = CASE WHEN $2 = 'resolved' THEN NOW() ELSE resolved_at END,
           resolved_by = CASE WHEN $2 = 'resolved' THEN $4 ELSE resolved_by END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [complaintId, status, resolutionDetails, actorId]
    );

    const updated = res.rows[0];
    await recordAudit(actorId, `complaint.${status}`, 'customer_complaint', complaintId, existing.rows[0], updated, req);
    await recordCustomerActivity(updated.customer_id, `complaint.${status}`, `Support ticket #${updated.ticket_number} marked ${status}`, req, 'complaint', complaintId);

    return updated;
  }

  async assignComplaint(complaintId, agentId, actorId, req = {}) {
    const res = await query(
      `UPDATE customer_complaints
       SET assigned_agent_id = $2, status = CASE WHEN status = 'open' THEN 'assigned' ELSE status END, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [complaintId, agentId]
    );

    if (res.rows.length === 0) throw new NotFoundError('Complaint not found');
    const updated = res.rows[0];
    await recordAudit(actorId, 'complaint.assigned', 'customer_complaint', complaintId, null, { agentId }, req);
    return updated;
  }

  // ── 14. CUSTOMER ACTIVITY TIMELINE ─────────────────────────────────────────
  async listCustomerActivity(params = {}) {
    const { page = 1, limit = 50, customer_id, event_type, search } = params;
    const conditions = ['1=1'];
    const values = [];

    if (customer_id) {
      values.push(customer_id);
      conditions.push(`ca.customer_id = $${values.length}`);
    }

    if (event_type && event_type !== 'all') {
      values.push(event_type);
      conditions.push(`ca.event_type = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(ca.description ILIKE $${values.length} OR u.display_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const countRes = await query(
      `SELECT COUNT(*) AS total
       FROM customer_activity_events ca
       JOIN users u ON u.id = ca.customer_id
       WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const sql = `
      SELECT ca.*,
             u.display_name AS customer_name,
             u.email AS customer_email
      FROM customer_activity_events ca
      JOIN users u ON u.id = ca.customer_id
      WHERE ${whereClause}
      ORDER BY ca.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const actRes = await query(sql, values);

    return {
      activities: actRes.rows,
      events: actRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }
}

module.exports = new CustomerManagementService();
