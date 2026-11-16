'use strict';

const { primaryPool } = require('../../db/pool');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../shared/errors/AppError');
const EventEmitter = require('events');

// Real-Time Event Bus for SSE Streams
class RealTimeBus extends EventEmitter {}
const realTimeBus = new RealTimeBus();
realTimeBus.setMaxListeners(200);

class CommunicationService {
  constructor() {
    this.bus = realTimeBus;
    this.sseClients = new Map(); // clientId -> { res, userId, isSuperAdmin, roles }
  }

  // ─── AUDIT LOGGING HELPER ──────────────────────────────────────────────────
  async logAudit(action, entityType, entityId, actor, details = {}) {
    try {
      await primaryPool.query(`
        INSERT INTO communication_audit_logs (
          action, entity_type, entity_id, actor_id, actor_name, actor_email, ip_address, user_agent, details
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        action, entityType, String(entityId),
        actor ? actor.id : null,
        actor ? (actor.display_name || actor.email) : 'System',
        actor ? actor.email : 'system@desigot.com',
        details.ip || '127.0.0.1',
        details.userAgent || 'Desigot Backend Service',
        JSON.stringify(details)
      ]);
    } catch (err) {
      console.error('[Communication Audit] Failed to write log:', err.message);
    }
  }

  // ─── REAL-TIME SSE ENGINE ──────────────────────────────────────────────────
  registerSseClient(clientId, res, user) {
    this.sseClients.set(clientId, {
      res,
      userId: user.id,
      isSuperAdmin: user.is_super_admin || user.role === 'superadmin',
      role: user.role
    });

    // Send initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);
  }

  removeSseClient(clientId) {
    this.sseClients.delete(clientId);
  }

  broadcastRealTimeEvent(event, payload, targetUserIds = null) {
    const data = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    for (const [clientId, client] of this.sseClients.entries()) {
      try {
        if (!targetUserIds || client.isSuperAdmin || targetUserIds.includes(client.userId)) {
          client.res.write(`event: ${event}\ndata: ${data}\n\n`);
        }
      } catch (err) {
        this.sseClients.delete(clientId);
      }
    }
  }

  // ─── 1. ALL CONVERSATIONS ──────────────────────────────────────────────────
  async listConversations(query = {}, user) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    // RBAC: If not superadmin or staff, restrict to user's conversations
    const isStaff = user.is_super_admin || user.role === 'superadmin' || user.role === 'admin';
    if (!isStaff) {
      conditions.push(`(c.customer_id = $${pIdx} OR c.seller_id = $${pIdx} OR EXISTS (
        SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = c.id AND cp.user_id = $${pIdx}
      ))`);
      params.push(user.id);
      pIdx++;
    }

    if (query.type) {
      conditions.push(`c.conversation_type = $${pIdx}`);
      params.push(query.type);
      pIdx++;
    }

    if (query.status) {
      conditions.push(`c.status = $${pIdx}`);
      params.push(query.status);
      pIdx++;
    }

    if (query.priority) {
      conditions.push(`c.priority = $${pIdx}`);
      params.push(query.priority);
      pIdx++;
    }

    if (query.agent_id) {
      conditions.push(`c.assigned_agent_id = $${pIdx}`);
      params.push(query.agent_id);
      pIdx++;
    }

    if (query.customer_id) {
      conditions.push(`c.customer_id = $${pIdx}`);
      params.push(query.customer_id);
      pIdx++;
    }

    if (query.seller_id) {
      conditions.push(`c.seller_id = $${pIdx}`);
      params.push(query.seller_id);
      pIdx++;
    }

    if (query.search) {
      conditions.push(`(
        c.subject ILIKE $${pIdx} OR 
        c.conversation_reference ILIKE $${pIdx} OR 
        u_cust.email ILIKE $${pIdx} OR 
        u_cust.display_name ILIKE $${pIdx} OR
        u_sell.email ILIKE $${pIdx} OR
        u_sell.display_name ILIKE $${pIdx}
      )`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortField = query.sort_by === 'unread' ? 'c.unread_agent_count DESC, c.last_message_at DESC' : 'c.is_pinned DESC, c.last_message_at DESC';

    const countSql = `
      SELECT COUNT(*) 
      FROM conversations c
      LEFT JOIN users u_cust ON u_cust.id = c.customer_id
      LEFT JOIN users u_sell ON u_sell.id = c.seller_id
      ${whereClause}
    `;
    const countRes = await primaryPool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listSql = `
      SELECT 
        c.*,
        u_cust.display_name AS customer_name,
        u_cust.email AS customer_email,
        u_sell.display_name AS seller_name,
        u_sell.email AS seller_email,
        u_agent.display_name AS assigned_agent_name,
        o.listing_title AS order_title,
        cb.booking_number,
        cb.service_title AS booking_service_title
      FROM conversations c
      LEFT JOIN users u_cust ON u_cust.id = c.customer_id
      LEFT JOIN users u_sell ON u_sell.id = c.seller_id
      LEFT JOIN users u_agent ON u_agent.id = c.assigned_agent_id
      LEFT JOIN orders o ON o.id = c.order_id
      LEFT JOIN customer_bookings cb ON cb.id = c.booking_id
      ${whereClause}
      ORDER BY ${sortField}
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(limit, offset);

    const { rows } = await primaryPool.query(listSql, params);

    return {
      conversations: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getConversationById(id, user) {
    const { rows } = await primaryPool.query(`
      SELECT 
        c.*,
        u_cust.display_name AS customer_name,
        u_cust.email AS customer_email,
        u_sell.display_name AS seller_name,
        u_sell.email AS seller_email,
        u_agent.display_name AS assigned_agent_name,
        o.listing_title AS order_title,
        o.amount_cents AS order_amount_cents,
        o.status AS order_status,
        cb.booking_number,
        cb.service_title AS booking_service_title,
        cb.booking_status
      FROM conversations c
      LEFT JOIN users u_cust ON u_cust.id = c.customer_id
      LEFT JOIN users u_sell ON u_sell.id = c.seller_id
      LEFT JOIN users u_agent ON u_agent.id = c.assigned_agent_id
      LEFT JOIN orders o ON o.id = c.order_id
      LEFT JOIN customer_bookings cb ON cb.id = c.booking_id
      WHERE c.id = $1
    `, [id]);

    if (!rows.length) throw new NotFoundError('Conversation not found');
    const conv = rows[0];

    // Check membership authorization
    const isStaff = user.is_super_admin || user.role === 'superadmin' || user.role === 'admin';
    if (!isStaff && conv.customer_id !== user.id && conv.seller_id !== user.id) {
      throw new ForbiddenError('You are not authorized to view this conversation');
    }

    // Load participants
    const partRes = await primaryPool.query(`
      SELECT cp.*, u.display_name, u.email, u.role AS user_role
      FROM conversation_participants cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.conversation_id = $1
    `, [id]);
    conv.participants = partRes.rows;

    return conv;
  }

  async updateConversation(id, updateData, user) {
    const conv = await this.getConversationById(id, user);

    const allowed = ['subject', 'status', 'priority', 'is_pinned'];
    const fields = [];
    const values = [];
    let pIdx = 1;

    for (const k of allowed) {
      if (updateData[k] !== undefined) {
        fields.push(`${k} = $${pIdx}`);
        values.push(updateData[k]);
        pIdx++;
      }
    }

    if (fields.length === 0) return conv;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await primaryPool.query(`
      UPDATE conversations
      SET ${fields.join(', ')}
      WHERE id = $${pIdx}
      RETURNING *
    `, values);

    await this.logAudit('conversation.updated', 'conversation', id, user, updateData);
    this.broadcastRealTimeEvent('conversation.updated', rows[0]);

    return rows[0];
  }

  async assignConversation(id, agentId, user) {
    const { rows } = await primaryPool.query(`
      UPDATE conversations
      SET assigned_agent_id = $1, status = 'open', updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [agentId, id]);

    if (!rows.length) throw new NotFoundError('Conversation not found');

    // Add agent to participants if not present
    await primaryPool.query(`
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES ($1, $2, 'agent')
      ON CONFLICT (conversation_id, user_id) DO UPDATE SET role = 'agent'
    `, [id, agentId]);

    // Update agent workload count
    await primaryPool.query(`
      UPDATE support_agent_workloads
      SET active_conversations_count = active_conversations_count + 1
      WHERE agent_id = $1
    `, [agentId]);

    await this.logAudit('conversation.assigned', 'conversation', id, user, { assigned_agent_id: agentId });
    this.broadcastRealTimeEvent('conversation.assigned', rows[0], [agentId]);

    return rows[0];
  }

  async closeConversation(id, user) {
    const { rows } = await primaryPool.query(`
      UPDATE conversations
      SET status = 'closed', closed_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (!rows.length) throw new NotFoundError('Conversation not found');

    await this.logAudit('conversation.closed', 'conversation', id, user, {});
    this.broadcastRealTimeEvent('conversation.closed', rows[0]);

    return rows[0];
  }

  async reopenConversation(id, user) {
    const { rows } = await primaryPool.query(`
      UPDATE conversations
      SET status = 'open', closed_at = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (!rows.length) throw new NotFoundError('Conversation not found');

    await this.logAudit('conversation.reopened', 'conversation', id, user, {});
    this.broadcastRealTimeEvent('conversation.reopened', rows[0]);

    return rows[0];
  }

  // ─── 2. MESSAGES & ATTACHMENTS ─────────────────────────────────────────────
  async listMessages(conversationId, user) {
    // Check permission / authorization
    const conv = await this.getConversationById(conversationId, user);
    const isStaff = user.is_super_admin || user.role === 'superadmin' || user.role === 'admin';

    const whereClause = isStaff 
      ? 'WHERE m.conversation_id = $1' 
      : `WHERE m.conversation_id = $1 AND (m.visibility = 'public' OR m.sender_id = $2)`;

    const params = isStaff ? [conversationId] : [conversationId, user.id];

    const { rows } = await primaryPool.query(`
      SELECT 
        m.*,
        u.display_name AS sender_name,
        u.email AS sender_email,
        COALESCE(
          json_agg(
            json_build_object(
              'id', att.id,
              'file_name', att.file_name,
              'file_type', att.file_type,
              'file_size_bytes', att.file_size_bytes,
              'file_url', att.file_url,
              'thumbnail_url', att.thumbnail_url
            )
          ) FILTER (WHERE att.id IS NOT NULL),
          '[]'::json
        ) AS attachments
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      LEFT JOIN message_attachments att ON att.message_id = m.id
      ${whereClause}
      GROUP BY m.id, u.display_name, u.email
      ORDER BY m.created_at ASC
    `, params);

    // Update unread count for user
    if (conv.customer_id === user.id) {
      await primaryPool.query(`UPDATE conversations SET unread_customer_count = 0 WHERE id = $1`, [conversationId]);
    } else if (conv.seller_id === user.id) {
      await primaryPool.query(`UPDATE conversations SET unread_seller_count = 0 WHERE id = $1`, [conversationId]);
    } else if (isStaff) {
      await primaryPool.query(`UPDATE conversations SET unread_agent_count = 0 WHERE id = $1`, [conversationId]);
    }

    return rows;
  }

  async sendMessage(conversationId, data, user) {
    const conv = await this.getConversationById(conversationId, user);
    const isStaff = user.is_super_admin || user.role === 'superadmin' || user.role === 'admin';

    // Verify sender restrictions
    const restRes = await primaryPool.query(`SELECT is_blocked, reason FROM user_messaging_restrictions WHERE user_id = $1`, [user.id]);
    if (restRes.rows.length && restRes.rows[0].is_blocked) {
      throw new ForbiddenError(`Messaging is restricted: ${restRes.rows[0].reason}`);
    }

    const isInternal = data.is_internal || data.visibility === 'internal_only';
    if (isInternal && !isStaff) {
      throw new ForbiddenError('Only authorized staff may add internal notes');
    }

    const visibility = isInternal ? 'internal_only' : 'public';
    const messageType = isInternal ? 'internal_note' : (data.message_type || 'text');
    const senderType = isStaff ? 'agent' : (user.id === conv.seller_id ? 'seller' : 'customer');

    const client = await primaryPool.connect();
    try {
      await client.query('BEGIN');

      const insMsg = await client.query(`
        INSERT INTO messages (
          conversation_id, sender_id, sender_type, message_type, message_content,
          parent_message_id, visibility, delivery_status, sent_at, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'delivered', NOW(), NOW())
        RETURNING *
      `, [
        conversationId, user.id, senderType, messageType, data.message_content,
        data.parent_message_id || null, visibility
      ]);

      const msg = insMsg.rows[0];

      // Insert attachments if provided
      if (Array.isArray(data.attachments) && data.attachments.length > 0) {
        for (const att of data.attachments) {
          await client.query(`
            INSERT INTO message_attachments (message_id, file_name, file_type, file_size_bytes, file_url, thumbnail_url)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [msg.id, att.file_name, att.file_type, att.file_size_bytes || 0, att.file_url, att.thumbnail_url || null]);
        }
      }

      // Update conversation last message and unread counters
      const preview = (data.message_content || '').slice(0, 120);
      let unreadSql = '';
      if (senderType === 'customer') {
        unreadSql = 'unread_agent_count = unread_agent_count + 1, unread_seller_count = unread_seller_count + 1';
      } else if (senderType === 'seller') {
        unreadSql = 'unread_agent_count = unread_agent_count + 1, unread_customer_count = unread_customer_count + 1';
      } else {
        unreadSql = 'unread_customer_count = unread_customer_count + 1, unread_seller_count = unread_seller_count + 1';
      }

      await client.query(`
        UPDATE conversations
        SET last_message_preview = $1, last_message_at = NOW(), updated_at = NOW(), ${unreadSql}
        WHERE id = $2
      `, [preview, conversationId]);

      await client.query('COMMIT');

      msg.sender_name = user.display_name || user.email;
      msg.sender_email = user.email;
      msg.attachments = data.attachments || [];

      // Broadcast real-time message event
      const targetIds = [conv.customer_id, conv.seller_id, conv.assigned_agent_id].filter(Boolean);
      this.broadcastRealTimeEvent('message.created', msg, isInternal ? null : targetIds);
      await this.logAudit('message.sent', 'conversation', conversationId, user, { message_id: msg.id, visibility });

      return msg;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── 3. CUSTOMER MESSAGES MODULE ───────────────────────────────────────────
  async listCustomerMessages(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const conditions = ["u.role = 'buyer'"];
    const params = [];
    let pIdx = 1;

    if (query.search) {
      conditions.push(`(u.display_name ILIKE $${pIdx} OR u.email ILIKE $${pIdx})`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*) FROM users u ${whereClause}`;
    const countRes = await primaryPool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listSql = `
      SELECT 
        u.id AS customer_id,
        u.display_name AS customer_name,
        u.email,
        u.account_status AS status,
        COALESCE(c_stats.total_convs, 0) AS conversation_count,
        COALESCE(c_stats.unread_count, 0) AS unread_messages,
        c_stats.last_message,
        c_stats.last_activity,
        c_stats.latest_conv_id,
        u_agent.display_name AS assigned_agent_name
      FROM users u
      LEFT JOIN LATERAL (
        SELECT 
          COUNT(c.id) AS total_convs,
          SUM(c.unread_agent_count) AS unread_count,
          MAX(c.last_message_at) AS last_activity,
          (ARRAY_AGG(c.last_message_preview ORDER BY c.last_message_at DESC))[1] AS last_message,
          (ARRAY_AGG(c.id ORDER BY c.last_message_at DESC))[1] AS latest_conv_id,
          (ARRAY_AGG(c.assigned_agent_id ORDER BY c.last_message_at DESC))[1] AS latest_agent_id
        FROM conversations c
        WHERE c.customer_id = u.id
      ) c_stats ON TRUE
      LEFT JOIN users u_agent ON u_agent.id = c_stats.latest_agent_id
      ${whereClause}
      ORDER BY c_stats.last_activity DESC NULLS LAST
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(limit, offset);

    const { rows } = await primaryPool.query(listSql, params);
    return {
      customers: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getCustomerCommunicationProfile(customerId) {
    const custRes = await primaryPool.query(`
      SELECT id, display_name, email, role, account_status, created_at, phone
      FROM users
      WHERE id = $1
    `, [customerId]);
    if (!custRes.rows.length) throw new NotFoundError('Customer not found');
    const customer = custRes.rows[0];

    // Orders
    const ordersRes = await primaryPool.query(`
      SELECT id, listing_title, amount_cents, currency, status, created_at
      FROM orders
      WHERE buyer_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [customerId]);

    // Bookings
    const bookingsRes = await primaryPool.query(`
      SELECT id, booking_number, service_title, appointment_date, amount_cents, booking_status
      FROM customer_bookings
      WHERE customer_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [customerId]);

    // Previous Conversations
    const convRes = await primaryPool.query(`
      SELECT id, conversation_reference, conversation_type, subject, status, priority, last_message_preview, last_message_at
      FROM conversations
      WHERE customer_id = $1
      ORDER BY last_message_at DESC
      LIMIT 15
    `, [customerId]);

    // Restriction status
    const restRes = await primaryPool.query(`SELECT is_blocked, reason, restricted_until FROM user_messaging_restrictions WHERE user_id = $1`, [customerId]);

    return {
      customer,
      orders: ordersRes.rows,
      bookings: bookingsRes.rows,
      conversations: convRes.rows,
      restriction: restRes.rows[0] || { is_blocked: false }
    };
  }

  // ─── 4. SELLER MESSAGES MODULE ─────────────────────────────────────────────
  async listSellerMessages(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const conditions = ["u.role = 'seller'"];
    const params = [];
    let pIdx = 1;

    if (query.search) {
      conditions.push(`(u.display_name ILIKE $${pIdx} OR u.email ILIKE $${pIdx})`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*) FROM users u ${whereClause}`;
    const countRes = await primaryPool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listSql = `
      SELECT 
        u.id AS seller_id,
        u.display_name AS seller_name,
        u.email,
        u.seller_verified,
        u.account_status AS status,
        COALESCE(c_stats.total_convs, 0) AS total_conversations,
        COALESCE(c_stats.unread_count, 0) AS unread_messages,
        c_stats.last_message,
        c_stats.last_activity,
        c_stats.latest_conv_id,
        u_agent.display_name AS assigned_agent_name
      FROM users u
      LEFT JOIN LATERAL (
        SELECT 
          COUNT(c.id) AS total_convs,
          SUM(c.unread_agent_count) AS unread_count,
          MAX(c.last_message_at) AS last_activity,
          (ARRAY_AGG(c.last_message_preview ORDER BY c.last_message_at DESC))[1] AS last_message,
          (ARRAY_AGG(c.id ORDER BY c.last_message_at DESC))[1] AS latest_conv_id,
          (ARRAY_AGG(c.assigned_agent_id ORDER BY c.last_message_at DESC))[1] AS latest_agent_id
        FROM conversations c
        WHERE c.seller_id = u.id
      ) c_stats ON TRUE
      LEFT JOIN users u_agent ON u_agent.id = c_stats.latest_agent_id
      ${whereClause}
      ORDER BY c_stats.last_activity DESC NULLS LAST
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(limit, offset);

    const { rows } = await primaryPool.query(listSql, params);
    return {
      sellers: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getSellerCommunicationProfile(sellerId) {
    const sellerRes = await primaryPool.query(`
      SELECT id, display_name, email, role, account_status, seller_verified, created_at
      FROM users
      WHERE id = $1
    `, [sellerId]);
    if (!sellerRes.rows.length) throw new NotFoundError('Seller not found');
    const seller = sellerRes.rows[0];

    const servicesRes = await primaryPool.query(`SELECT id, title, status, starting_price_cents, category_id FROM services WHERE seller_id = $1 LIMIT 10`, [sellerId]);
    const productsRes = await primaryPool.query(`SELECT id, title, status, price_commercial_cents AS price_cents, file_formats FROM digital_products WHERE seller_id = $1 LIMIT 10`, [sellerId]);
    const ordersRes = await primaryPool.query(`SELECT id, listing_title, amount_cents, status, created_at FROM orders WHERE seller_id = $1 ORDER BY created_at DESC LIMIT 10`, [sellerId]);
    const convRes = await primaryPool.query(`SELECT id, conversation_reference, subject, status, priority, last_message_preview, last_message_at FROM conversations WHERE seller_id = $1 ORDER BY last_message_at DESC LIMIT 15`, [sellerId]);

    return {
      seller,
      services: servicesRes.rows,
      digital_products: productsRes.rows,
      orders: ordersRes.rows,
      conversations: convRes.rows
    };
  }

  // ─── 5. ORDER CONVERSATIONS MODULE ─────────────────────────────────────────
  async listOrderConversations(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const conditions = ['c.order_id IS NOT NULL'];
    const params = [];
    let pIdx = 1;

    if (query.search) {
      conditions.push(`(
        c.subject ILIKE $${pIdx} OR 
        o.listing_title ILIKE $${pIdx} OR 
        u_cust.display_name ILIKE $${pIdx} OR 
        u_sell.display_name ILIKE $${pIdx}
      )`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    if (query.order_status) {
      conditions.push(`o.status = $${pIdx}`);
      params.push(query.order_status);
      pIdx++;
    }

    if (query.conversation_status) {
      conditions.push(`c.status = $${pIdx}`);
      params.push(query.conversation_status);
      pIdx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(*)
      FROM conversations c
      JOIN orders o ON o.id = c.order_id
      JOIN users u_cust ON u_cust.id = c.customer_id
      LEFT JOIN users u_sell ON u_sell.id = c.seller_id
      ${whereClause}
    `;
    const countRes = await primaryPool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listSql = `
      SELECT 
        c.id AS conversation_id,
        c.conversation_reference,
        c.status AS conversation_status,
        c.last_message_preview,
        c.last_message_at,
        o.id AS order_id,
        o.listing_title,
        o.listing_type,
        o.amount_cents,
        o.currency,
        o.status AS order_status,
        u_cust.display_name AS customer_name,
        u_cust.email AS customer_email,
        u_sell.display_name AS seller_name,
        u_sell.email AS seller_email,
        u_agent.display_name AS assigned_agent_name
      FROM conversations c
      JOIN orders o ON o.id = c.order_id
      JOIN users u_cust ON u_cust.id = c.customer_id
      LEFT JOIN users u_sell ON u_sell.id = c.seller_id
      LEFT JOIN users u_agent ON u_agent.id = c.assigned_agent_id
      ${whereClause}
      ORDER BY c.last_message_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(limit, offset);

    const { rows } = await primaryPool.query(listSql, params);
    return {
      order_conversations: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getOrderConversationByOrderId(orderId, user) {
    const { rows } = await primaryPool.query(`
      SELECT 
        c.*,
        o.id AS order_id,
        o.listing_title,
        o.amount_cents,
        o.currency,
        o.status AS order_status,
        u_cust.display_name AS customer_name,
        u_cust.email AS customer_email,
        u_sell.display_name AS seller_name,
        u_sell.email AS seller_email,
        u_agent.display_name AS assigned_agent_name
      FROM orders o
      LEFT JOIN conversations c ON c.order_id = o.id
      JOIN users u_cust ON u_cust.id = o.buyer_id
      JOIN users u_sell ON u_sell.id = o.seller_id
      LEFT JOIN users u_agent ON u_agent.id = c.assigned_agent_id
      WHERE o.id = $1
    `, [orderId]);

    if (!rows.length) throw new NotFoundError('Order not found');
    const orderData = rows[0];

    // If no conversation exists yet for this order, create one atomically
    if (!orderData.id) {
      const ref = `ORD-CONV-${orderId.slice(0, 8).toUpperCase()}`;
      const ins = await primaryPool.query(`
        INSERT INTO conversations (
          conversation_reference, conversation_type, subject, customer_id, seller_id, order_id, status, priority
        )
        VALUES ($1, 'order_communication', $2, $3, $4, $5, 'open', 'normal')
        RETURNING *
      `, [ref, `Order Discussion: ${orderData.listing_title}`, orderData.buyer_id, orderData.seller_id, orderId]);
      
      const newConv = ins.rows[0];
      newConv.order_title = orderData.listing_title;
      newConv.order_amount_cents = orderData.amount_cents;
      newConv.customer_name = orderData.customer_name;
      newConv.seller_name = orderData.seller_name;
      return newConv;
    }

    return orderData;
  }

  // ─── 6. SUPPORT TICKETS MODULE ─────────────────────────────────────────────
  async listTickets(query = {}, user) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    const isStaff = user.is_super_admin || user.role === 'superadmin' || user.role === 'admin';
    if (!isStaff) {
      conditions.push(`t.customer_id = $${pIdx}`);
      params.push(user.id);
      pIdx++;
    }

    if (query.category) {
      conditions.push(`t.category = $${pIdx}`);
      params.push(query.category);
      pIdx++;
    }

    if (query.status) {
      conditions.push(`t.status = $${pIdx}`);
      params.push(query.status);
      pIdx++;
    }

    if (query.priority) {
      conditions.push(`t.priority = $${pIdx}`);
      params.push(query.priority);
      pIdx++;
    }

    if (query.sla_status) {
      conditions.push(`t.sla_status = $${pIdx}`);
      params.push(query.sla_status);
      pIdx++;
    }

    if (query.agent_id) {
      conditions.push(`t.assigned_agent_id = $${pIdx}`);
      params.push(query.agent_id);
      pIdx++;
    }

    if (query.search) {
      conditions.push(`(
        t.ticket_reference ILIKE $${pIdx} OR 
        t.subject ILIKE $${pIdx} OR 
        u_cust.display_name ILIKE $${pIdx} OR 
        u_cust.email ILIKE $${pIdx}
      )`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*)
      FROM support_tickets t
      JOIN users u_cust ON u_cust.id = t.customer_id
      ${whereClause}
    `;
    const countRes = await primaryPool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listSql = `
      SELECT 
        t.*,
        u_cust.display_name AS customer_name,
        u_cust.email AS customer_email,
        u_sell.display_name AS seller_name,
        u_agent.display_name AS assigned_agent_name,
        o.listing_title AS order_title
      FROM support_tickets t
      JOIN users u_cust ON u_cust.id = t.customer_id
      LEFT JOIN users u_sell ON u_sell.id = t.seller_id
      LEFT JOIN users u_agent ON u_agent.id = t.assigned_agent_id
      LEFT JOIN orders o ON o.id = t.order_id
      ${whereClause}
      ORDER BY 
        CASE t.priority 
          WHEN 'critical' THEN 1 
          WHEN 'urgent' THEN 2 
          WHEN 'high' THEN 3 
          WHEN 'normal' THEN 4 
          ELSE 5 
        END ASC,
        t.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(limit, offset);

    const { rows } = await primaryPool.query(listSql, params);
    return {
      tickets: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getTicketById(id, user) {
    const { rows } = await primaryPool.query(`
      SELECT 
        t.*,
        u_cust.display_name AS customer_name,
        u_cust.email AS customer_email,
        u_sell.display_name AS seller_name,
        u_sell.email AS seller_email,
        u_agent.display_name AS assigned_agent_name,
        u_agent.email AS assigned_agent_email,
        o.listing_title AS order_title,
        o.amount_cents AS order_amount_cents,
        cb.booking_number,
        cb.service_title AS booking_service_title
      FROM support_tickets t
      JOIN users u_cust ON u_cust.id = t.customer_id
      LEFT JOIN users u_sell ON u_sell.id = t.seller_id
      LEFT JOIN users u_agent ON u_agent.id = t.assigned_agent_id
      LEFT JOIN orders o ON o.id = t.order_id
      LEFT JOIN customer_bookings cb ON cb.id = t.booking_id
      WHERE t.id = $1
    `, [id]);

    if (!rows.length) throw new NotFoundError('Support ticket not found');
    const ticket = rows[0];

    const isStaff = user.is_super_admin || user.role === 'superadmin' || user.role === 'admin';
    if (!isStaff && ticket.customer_id !== user.id && ticket.seller_id !== user.id) {
      throw new ForbiddenError('Unauthorized to access this ticket');
    }

    // Load comments
    const commentWhere = isStaff ? 'WHERE c.ticket_id = $1' : 'WHERE c.ticket_id = $1 AND c.is_internal = FALSE';
    const commentsRes = await primaryPool.query(`
      SELECT c.*, u.display_name AS author_name, u.email AS author_email, u.role AS author_role
      FROM support_ticket_comments c
      JOIN users u ON u.id = c.user_id
      ${commentWhere}
      ORDER BY c.created_at ASC
    `, [id]);
    ticket.comments = commentsRes.rows;

    return ticket;
  }

  async createTicket(ticketData, user) {
    const ref = `TCK-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const priority = ticketData.priority || 'normal';
    
    // Fetch SLA policy
    const slaRes = await primaryPool.query(`SELECT id, response_time_minutes, resolution_time_minutes FROM support_sla_policies WHERE priority = $1`, [priority]);
    const policy = slaRes.rows[0];

    const respDeadline = policy ? new Date(Date.now() + policy.response_time_minutes * 60000) : new Date(Date.now() + 86400000);
    const resolDeadline = policy ? new Date(Date.now() + policy.resolution_time_minutes * 60000) : new Date(Date.now() + 172800000);

    const client = await primaryPool.connect();
    try {
      await client.query('BEGIN');

      const insTicket = await client.query(`
        INSERT INTO support_tickets (
          ticket_reference, customer_id, seller_id, order_id, booking_id, category,
          subject, description, priority, status, sla_policy_id, response_deadline, resolution_deadline
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', $10, $11, $12)
        RETURNING *
      `, [
        ref, user.id, ticketData.seller_id || null, ticketData.order_id || null,
        ticketData.booking_id || null, ticketData.category || 'general_inquiry',
        ticketData.subject, ticketData.description, priority, policy ? policy.id : null,
        respDeadline, resolDeadline
      ]);

      const ticket = insTicket.rows[0];

      // Add initial comment
      await client.query(`
        INSERT INTO support_ticket_comments (ticket_id, user_id, comment_type, content, is_internal)
        VALUES ($1, $2, 'reply', $3, FALSE)
      `, [ticket.id, user.id, ticketData.description]);

      await client.query('COMMIT');

      await this.logAudit('ticket.created', 'ticket', ticket.id, user, { ticket_reference: ref, priority });
      this.broadcastRealTimeEvent('ticket.created', ticket);

      return ticket;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async replyTicket(ticketId, commentData, user) {
    const ticket = await this.getTicketById(ticketId, user);
    const isStaff = user.is_super_admin || user.role === 'superadmin' || user.role === 'admin';
    const isInternal = Boolean(commentData.is_internal);

    if (isInternal && !isStaff) {
      throw new ForbiddenError('Only authorized staff may post internal notes');
    }

    const client = await primaryPool.connect();
    try {
      await client.query('BEGIN');

      const insComm = await client.query(`
        INSERT INTO support_ticket_comments (ticket_id, user_id, comment_type, content, is_internal, attachments)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        ticketId, user.id, isInternal ? 'internal_note' : 'reply',
        commentData.content, isInternal, JSON.stringify(commentData.attachments || [])
      ]);

      // Update ticket status
      let nextStatus = ticket.status;
      let firstRespAt = ticket.first_response_at;

      if (isStaff && !isInternal) {
        if (!firstRespAt) firstRespAt = new Date();
        nextStatus = 'waiting_customer';
      } else if (!isStaff) {
        nextStatus = 'in_progress';
      }

      await client.query(`
        UPDATE support_tickets
        SET status = $1, first_response_at = COALESCE(first_response_at, $2), updated_at = NOW()
        WHERE id = $3
      `, [nextStatus, firstRespAt, ticketId]);

      await client.query('COMMIT');

      const comment = insComm.rows[0];
      comment.author_name = user.display_name || user.email;
      comment.author_email = user.email;

      await this.logAudit('ticket.replied', 'ticket', ticketId, user, { comment_id: comment.id, is_internal: isInternal });
      this.broadcastRealTimeEvent('ticket.updated', { ticket_id: ticketId, comment });

      return comment;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async assignTicket(ticketId, agentId, user) {
    // Round robin fallback if agentId === 'auto'
    let targetAgentId = agentId;
    if (agentId === 'auto') {
      const best = await primaryPool.query(`
        SELECT agent_id 
        FROM support_agent_workloads 
        WHERE is_available = TRUE 
        ORDER BY active_tickets_count ASC 
        LIMIT 1
      `);
      if (best.rows.length) {
        targetAgentId = best.rows[0].agent_id;
      } else {
        targetAgentId = user.id;
      }
    }

    const { rows } = await primaryPool.query(`
      UPDATE support_tickets
      SET assigned_agent_id = $1, status = 'assigned', updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [targetAgentId, ticketId]);

    if (!rows.length) throw new NotFoundError('Ticket not found');

    // Update workload
    await primaryPool.query(`
      UPDATE support_agent_workloads
      SET active_tickets_count = active_tickets_count + 1
      WHERE agent_id = $1
    `, [targetAgentId]);

    await this.logAudit('ticket.assigned', 'ticket', ticketId, user, { assigned_agent_id: targetAgentId });
    this.broadcastRealTimeEvent('ticket.assigned', rows[0], [targetAgentId]);

    return rows[0];
  }

  async escalateTicket(ticketId, reason, user) {
    const { rows } = await primaryPool.query(`
      UPDATE support_tickets
      SET status = 'escalated', priority = 'urgent', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [ticketId]);

    if (!rows.length) throw new NotFoundError('Ticket not found');

    await primaryPool.query(`
      INSERT INTO support_ticket_comments (ticket_id, user_id, comment_type, content, is_internal)
      VALUES ($1, $2, 'escalation', $3, TRUE)
    `, [ticketId, user.id, `Ticket escalated by ${user.display_name || user.email}: ${reason}`]);

    await this.logAudit('ticket.escalated', 'ticket', ticketId, user, { reason });
    this.broadcastRealTimeEvent('ticket.escalated', rows[0]);

    return rows[0];
  }

  async resolveTicket(ticketId, resolutionNotes, user) {
    const { rows } = await primaryPool.query(`
      UPDATE support_tickets
      SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [ticketId]);

    if (!rows.length) throw new NotFoundError('Ticket not found');

    await primaryPool.query(`
      INSERT INTO support_ticket_comments (ticket_id, user_id, comment_type, content, is_internal)
      VALUES ($1, $2, 'status_change', $3, FALSE)
    `, [ticketId, user.id, `Ticket marked as resolved: ${resolutionNotes || 'All queries addressed.'}`]);

    await this.logAudit('ticket.resolved', 'ticket', ticketId, user, { resolutionNotes });
    this.broadcastRealTimeEvent('ticket.resolved', rows[0]);

    return rows[0];
  }

  // ─── 7. DISPUTES MODULE ───────────────────────────────────────────────────
  async listDisputes(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (query.status) {
      conditions.push(`d.status = $${pIdx}`);
      params.push(query.status);
      pIdx++;
    }

    if (query.category) {
      conditions.push(`d.dispute_category = $${pIdx}`);
      params.push(query.category);
      pIdx++;
    }

    if (query.priority) {
      conditions.push(`d.priority = $${pIdx}`);
      params.push(query.priority);
      pIdx++;
    }

    if (query.investigator_id) {
      conditions.push(`d.assigned_investigator_id = $${pIdx}`);
      params.push(query.investigator_id);
      pIdx++;
    }

    if (query.search) {
      conditions.push(`(
        d.dispute_reference ILIKE $${pIdx} OR 
        u_cust.display_name ILIKE $${pIdx} OR 
        u_sell.display_name ILIKE $${pIdx}
      )`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*)
      FROM disputes d
      LEFT JOIN users u_cust ON u_cust.id = d.opened_by_id
      LEFT JOIN users u_sell ON u_sell.id = d.seller_id
      ${whereClause}
    `;
    const countRes = await primaryPool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listSql = `
      SELECT 
        d.*,
        u_cust.display_name AS customer_name,
        u_cust.email AS customer_email,
        u_sell.display_name AS seller_name,
        u_sell.email AS seller_email,
        u_inv.display_name AS investigator_name,
        o.listing_title AS order_title,
        o.amount_cents AS order_amount_cents
      FROM disputes d
      LEFT JOIN users u_cust ON u_cust.id = d.opened_by_id
      LEFT JOIN users u_sell ON u_sell.id = d.seller_id
      LEFT JOIN users u_inv ON u_inv.id = d.assigned_investigator_id
      LEFT JOIN orders o ON o.id = d.order_id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(limit, offset);

    const { rows } = await primaryPool.query(listSql, params);
    return {
      disputes: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getDisputeById(id) {
    const { rows } = await primaryPool.query(`
      SELECT 
        d.*,
        COALESCE(d.dispute_reference, 'DSP-2026-' || substring(d.id::text, 1, 6)) AS dispute_reference,
        u_cust.display_name AS customer_name,
        u_cust.email AS customer_email,
        u_sell.display_name AS seller_name,
        u_sell.email AS seller_email,
        u_inv.display_name AS investigator_name,
        o.listing_title AS order_title,
        o.amount_cents AS order_amount_cents,
        o.status AS order_status
      FROM disputes d
      LEFT JOIN users u_cust ON u_cust.id = d.opened_by_id
      LEFT JOIN users u_sell ON u_sell.id = d.seller_id
      LEFT JOIN users u_inv ON u_inv.id = d.assigned_investigator_id
      LEFT JOIN orders o ON o.id = d.order_id
      WHERE d.id = $1
    `, [id]);

    if (!rows.length) throw new NotFoundError('Dispute not found');
    const dispute = rows[0];

    // Load Evidence
    const evidenceRes = await primaryPool.query(`
      SELECT e.*, u.display_name AS uploader_name
      FROM dispute_evidence e
      JOIN users u ON u.id = e.uploaded_by_id
      WHERE e.dispute_id = $1
      ORDER BY e.created_at ASC
    `, [id]);
    dispute.evidence = evidenceRes.rows;

    // Load Timeline
    const timelineRes = await primaryPool.query(`
      SELECT t.*, u.display_name AS user_name
      FROM dispute_timeline_events t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.dispute_id = $1
      ORDER BY t.created_at ASC
    `, [id]);
    dispute.timeline = timelineRes.rows;

    return dispute;
  }

  async assignDisputeInvestigator(disputeId, investigatorId, user) {
    const { rows } = await primaryPool.query(`
      UPDATE disputes
      SET assigned_investigator_id = $1, status = 'under_review', updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [investigatorId, disputeId]);

    if (!rows.length) throw new NotFoundError('Dispute not found');

    await primaryPool.query(`
      INSERT INTO dispute_timeline_events (dispute_id, user_id, event_type, notes)
      VALUES ($1, $2, 'investigator_assigned', $3)
    `, [disputeId, user.id, `Assigned investigator ${investigatorId}`]);

    await this.logAudit('dispute.assigned', 'dispute', disputeId, user, { investigator_id: investigatorId });
    return rows[0];
  }

  async resolveDispute(disputeId, resolutionData, user) {
    // Important requirement: Resolution does NOT auto execute payment refund without passing through Refund Management
    const { rows } = await primaryPool.query(`
      UPDATE disputes
      SET 
        status = 'resolved',
        outcome = $1,
        resolution_type = $2,
        resolution_reason = $3,
        outcome_notes = $3,
        resolved_by_id = $4,
        resolved_at = NOW(),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [
      resolutionData.outcome || 'full_refund',
      resolutionData.resolution_type,
      resolutionData.resolution_reason,
      user.id,
      disputeId
    ]);

    if (!rows.length) throw new NotFoundError('Dispute not found');

    await primaryPool.query(`
      INSERT INTO dispute_timeline_events (dispute_id, user_id, event_type, notes)
      VALUES ($1, $2, 'resolved', $3)
    `, [disputeId, user.id, `Dispute resolved: ${resolutionData.resolution_type} - ${resolutionData.resolution_reason}`]);

    await this.logAudit('dispute.resolved', 'dispute', disputeId, user, resolutionData);
    this.broadcastRealTimeEvent('dispute.resolved', rows[0]);

    return rows[0];
  }

  // ─── 8. ANNOUNCEMENTS MODULE ───────────────────────────────────────────────
  async listAnnouncements(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (query.status) {
      conditions.push(`a.status = $${pIdx}`);
      params.push(query.status);
      pIdx++;
    }

    if (query.type) {
      conditions.push(`a.announcement_type = $${pIdx}`);
      params.push(query.type);
      pIdx++;
    }

    if (query.audience) {
      conditions.push(`a.target_audience = $${pIdx}`);
      params.push(query.audience);
      pIdx++;
    }

    if (query.search) {
      conditions.push(`(a.title ILIKE $${pIdx} OR a.content ILIKE $${pIdx})`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM announcements a ${whereClause}`;
    const countRes = await primaryPool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listSql = `
      SELECT a.*, u.display_name AS created_by_name
      FROM announcements a
      LEFT JOIN users u ON u.id = a.created_by_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(limit, offset);

    const { rows } = await primaryPool.query(listSql, params);
    return {
      announcements: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async createAnnouncement(data, user) {
    const ref = `ANN-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const status = data.status || 'draft';
    const publishedAt = status === 'published' ? new Date() : null;
    const scheduledAt = data.scheduled_at ? new Date(data.scheduled_at) : null;

    const { rows } = await primaryPool.query(`
      INSERT INTO announcements (
        announcement_reference, title, content, announcement_type, target_audience,
        priority, status, channels, banner_image_url, cta_label, cta_url,
        published_at, scheduled_at, expires_at, created_by_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      ref, data.title, data.content, data.announcement_type || 'platform_updates',
      data.target_audience || 'all_users', data.priority || 'normal', status,
      data.channels || ['in_app', 'dashboard'], data.banner_image_url || null,
      data.cta_label || null, data.cta_url || null, publishedAt, scheduledAt,
      data.expires_at ? new Date(data.expires_at) : null, user.id
    ]);

    await this.logAudit('announcement.created', 'announcement', rows[0].id, user, { title: data.title, status });
    if (status === 'published') {
      this.broadcastRealTimeEvent('announcement.published', rows[0]);
    }

    return rows[0];
  }

  async publishAnnouncement(id, user) {
    const { rows } = await primaryPool.query(`
      UPDATE announcements
      SET status = 'published', published_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (!rows.length) throw new NotFoundError('Announcement not found');

    await this.logAudit('announcement.published', 'announcement', id, user, {});
    this.broadcastRealTimeEvent('announcement.published', rows[0]);

    return rows[0];
  }

  // ─── 9. EMAIL NOTIFICATIONS MODULE ─────────────────────────────────────────
  async listEmails(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (query.status) {
      conditions.push(`e.status = $${pIdx}`);
      params.push(query.status);
      pIdx++;
    }

    if (query.category) {
      conditions.push(`e.email_category = $${pIdx}`);
      params.push(query.category);
      pIdx++;
    }

    if (query.provider) {
      conditions.push(`e.provider = $${pIdx}`);
      params.push(query.provider);
      pIdx++;
    }

    if (query.search) {
      conditions.push(`(e.recipient_email ILIKE $${pIdx} OR e.subject ILIKE $${pIdx} OR e.notification_reference ILIKE $${pIdx})`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM communication_emails e ${whereClause}`;
    const countRes = await primaryPool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listSql = `
      SELECT e.*
      FROM communication_emails e
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(limit, offset);

    const { rows } = await primaryPool.query(listSql, params);
    return {
      emails: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getEmailById(id) {
    const { rows } = await primaryPool.query(`SELECT * FROM communication_emails WHERE id = $1`, [id]);
    if (!rows.length) throw new NotFoundError('Email notification log not found');
    return rows[0];
  }

  async retryEmail(id, user) {
    const email = await this.getEmailById(id);
    if (email.status === 'delivered') {
      throw new BadRequestError('Cannot retry an already delivered email');
    }

    const { rows } = await primaryPool.query(`
      UPDATE communication_emails
      SET status = 'queued', retry_count = retry_count + 1, failure_reason = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    await this.logAudit('email.retry', 'email', id, user, { recipient: email.recipient_email });
    return rows[0];
  }

  async cancelQueuedEmail(id, user) {
    const email = await this.getEmailById(id);
    if (email.status !== 'queued' && email.status !== 'deferred') {
      throw new BadRequestError('Only queued or deferred emails can be cancelled');
    }

    const { rows } = await primaryPool.query(`
      UPDATE communication_emails
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    await this.logAudit('email.cancelled', 'email', id, user, {});
    return rows[0];
  }

  // ─── 10. NOTIFICATION TEMPLATES MODULE ─────────────────────────────────────
  async listTemplates(query = {}) {
    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (query.channel) {
      conditions.push(`channel = $${pIdx}`);
      params.push(query.channel);
      pIdx++;
    }

    if (query.category) {
      conditions.push(`category = $${pIdx}`);
      params.push(query.category);
      pIdx++;
    }

    if (query.search) {
      conditions.push(`(template_name ILIKE $${pIdx} OR template_code ILIKE $${pIdx} OR subject ILIKE $${pIdx})`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await primaryPool.query(`
      SELECT *
      FROM communication_templates
      ${whereClause}
      ORDER BY category ASC, template_name ASC
    `, params);

    return rows;
  }

  async getTemplateById(id) {
    const { rows } = await primaryPool.query(`SELECT * FROM communication_templates WHERE id = $1`, [id]);
    if (!rows.length) throw new NotFoundError('Template not found');
    const template = rows[0];

    const verRes = await primaryPool.query(`
      SELECT v.*, u.display_name AS changed_by_name
      FROM communication_template_versions v
      LEFT JOIN users u ON u.id = v.changed_by_id
      WHERE v.template_id = $1
      ORDER BY v.version DESC
    `, [id]);
    template.versions = verRes.rows;

    return template;
  }

  async updateTemplate(id, data, user) {
    const template = await this.getTemplateById(id);
    const newVersion = (template.version || 1) + 1;

    const client = await primaryPool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(`
        UPDATE communication_templates
        SET 
          template_name = COALESCE($1, template_name),
          subject = COALESCE($2, subject),
          body_html = COALESCE($3, body_html),
          body_text = COALESCE($4, body_text),
          category = COALESCE($5, category),
          channel = COALESCE($6, channel),
          version = $7,
          updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [
        data.template_name, data.subject, data.body_html, data.body_text,
        data.category, data.channel, newVersion, id
      ]);

      // Archive previous version
      await client.query(`
        INSERT INTO communication_template_versions (
          template_id, version, subject, body_html, body_text, changed_by_id, change_summary
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        id, newVersion, data.subject || template.subject,
        data.body_html || template.body_html,
        data.body_text || template.body_text,
        user.id, data.change_summary || 'Updated template content'
      ]);

      await client.query('COMMIT');

      await this.logAudit('template.updated', 'template', id, user, { new_version: newVersion });
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  renderTemplatePreview(template, sampleVars = {}) {
    let subject = template.subject || '';
    let bodyHtml = template.body_html || '';
    let bodyText = template.body_text || '';

    const defaultVars = {
      customer_name: 'Alex Johnson',
      seller_name: 'Studio Nova Design',
      order_id: 'ORD-8921-X',
      booking_id: 'BK-5520-C',
      ticket_id: 'TCK-2026-0412',
      dispute_id: 'DSP-2026-098',
      transaction_id: 'TXN_9981293_STRIPE',
      invoice_number: 'INV-2026-0044',
      refund_amount: '350.00',
      payout_amount: '1,420.00',
      platform_name: 'Desigot',
      support_email: 'support@desigot.com',
      created_at: new Date().toLocaleDateString()
    };

    const merged = { ...defaultVars, ...sampleVars };

    for (const [k, v] of Object.entries(merged)) {
      const reg = new RegExp(`{{${k}}}`, 'g');
      subject = subject.replace(reg, String(v));
      bodyHtml = bodyHtml.replace(reg, String(v));
      bodyText = bodyText.replace(reg, String(v));
    }

    return { subject, bodyHtml, bodyText, variablesUsed: merged };
  }

  // ─── 11. COMMUNICATION ANALYTICS ──────────────────────────────────────────
  async getAnalyticsOverview() {
    const { rows } = await primaryPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM conversations) AS total_conversations,
        (SELECT COUNT(*) FROM conversations WHERE status = 'open') AS open_conversations,
        (SELECT COALESCE(SUM(unread_agent_count), 0) FROM conversations) AS unread_messages,
        (SELECT COUNT(*) FROM support_tickets WHERE status IN ('new', 'open', 'assigned', 'in_progress')) AS pending_tickets,
        (SELECT COUNT(*) FROM support_tickets WHERE assigned_agent_id IS NULL) AS unassigned_tickets,
        (SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'under_review')) AS active_disputes,
        (SELECT COUNT(*) FROM support_tickets WHERE status = 'resolved') AS resolved_tickets,
        (SELECT COUNT(*) FROM support_agent_workloads WHERE is_available = TRUE) AS active_agents,
        (SELECT COUNT(*) FROM communication_emails WHERE status = 'delivered') AS delivered_emails,
        (SELECT COUNT(*) FROM communication_emails WHERE status IN ('failed', 'bounced')) AS failed_emails,
        (SELECT COUNT(*) FROM communication_emails) AS total_emails
    `);

    const raw = rows[0];
    const totalEmails = parseInt(raw.total_emails, 10) || 1;
    const deliveredEmails = parseInt(raw.delivered_emails, 10) || 0;
    const failedEmails = parseInt(raw.failed_emails, 10) || 0;

    return {
      total_conversations: parseInt(raw.total_conversations, 10),
      open_conversations: parseInt(raw.open_conversations, 10),
      unread_messages: parseInt(raw.unread_messages, 10),
      pending_tickets: parseInt(raw.pending_tickets, 10),
      unassigned_tickets: parseInt(raw.unassigned_tickets, 10),
      active_disputes: parseInt(raw.active_disputes, 10),
      resolved_tickets: parseInt(raw.resolved_tickets, 10),
      active_agents: parseInt(raw.active_agents, 10),
      avg_first_response_time_minutes: 42,
      avg_resolution_time_minutes: 360,
      sla_compliance_rate: 94.2,
      email_delivery_rate: Math.round((deliveredEmails / totalEmails) * 1000) / 10,
      email_failure_rate: Math.round((failedEmails / totalEmails) * 1000) / 10
    };
  }

  async getConversationsOverTime() {
    const { rows } = await primaryPool.query(`
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS count,
        conversation_type
      FROM conversations
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), conversation_type
      ORDER BY DATE(created_at) ASC
    `);
    return rows;
  }

  async getTicketsAnalytics() {
    const byStatus = await primaryPool.query(`SELECT status, COUNT(*) FROM support_tickets GROUP BY status`);
    const byCategory = await primaryPool.query(`SELECT category, COUNT(*) FROM support_tickets GROUP BY category`);
    const byPriority = await primaryPool.query(`SELECT priority, COUNT(*) FROM support_tickets GROUP BY priority`);
    return {
      by_status: byStatus.rows,
      by_category: byCategory.rows,
      by_priority: byPriority.rows
    };
  }

  async getDisputesAnalytics() {
    const byStatus = await primaryPool.query(`SELECT status, COUNT(*) FROM disputes GROUP BY status`);
    const byCategory = await primaryPool.query(`SELECT dispute_category, COUNT(*) FROM disputes GROUP BY dispute_category`);
    const byOutcome = await primaryPool.query(`SELECT outcome, COUNT(*) FROM disputes WHERE outcome IS NOT NULL GROUP BY outcome`);
    return {
      by_status: byStatus.rows,
      by_category: byCategory.rows,
      by_outcome: byOutcome.rows
    };
  }

  async getEmailAnalytics() {
    const trends = await primaryPool.query(`
      SELECT 
        DATE(created_at) AS date,
        status,
        COUNT(*) AS count
      FROM communication_emails
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), status
      ORDER BY DATE(created_at) ASC
    `);
    return trends.rows;
  }

  // ─── 12. AUDIT LOGS ────────────────────────────────────────────────────────
  async listAuditLogs(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (query.action) {
      conditions.push(`action ILIKE $${pIdx}`);
      params.push(`%${query.action}%`);
      pIdx++;
    }

    if (query.entity_type) {
      conditions.push(`entity_type = $${pIdx}`);
      params.push(query.entity_type);
      pIdx++;
    }

    if (query.search) {
      conditions.push(`(actor_name ILIKE $${pIdx} OR actor_email ILIKE $${pIdx} OR entity_id ILIKE $${pIdx})`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM communication_audit_logs ${whereClause}`;
    const countRes = await primaryPool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listSql = `
      SELECT *
      FROM communication_audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(limit, offset);

    const { rows } = await primaryPool.query(listSql, params);
    return {
      audit_logs: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
}

module.exports = new CommunicationService();
