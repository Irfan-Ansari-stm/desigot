'use strict';

const pool = require('../../db/pool');
const { AppError, NotFoundError, ForbiddenError, ValidationError } = require('../../shared/errors/AppError');
const crypto = require('crypto');

class BadRequestError extends AppError {
  constructor(message) {
    super(message, 400, 'BAD_REQUEST');
  }
}

class MarketingPromotionsService {
  /**
   * Log an immutable marketing action into marketing_audit_logs.
   */
  async logMarketingAction({ entityType, entityId = null, actionType, actorId = null, prevData = null, newData = null, reason = '', ipAddress = '127.0.0.1' }) {
    try {
      const description = reason || `${actionType} on ${entityType} ${entityId || ''}`.trim();
      const metadata = {
        previous: prevData || null,
        new: newData || null
      };

      await pool.query(`
        INSERT INTO marketing_audit_logs (
          action_type, entity_type, entity_id, user_id, description, metadata, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [actionType, entityType, entityId, actorId, description, JSON.stringify(metadata), ipAddress]);
    } catch (err) {
      console.error('Error logging marketing action:', err);
    }
  }

  // ==========================================================================
  // 0. SUMMARY & KPI METRICS
  // ==========================================================================
  async getStatsSummary() {
    const couponsRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_coupons,
        COUNT(*) FILTER (WHERE status = 'active' AND (expiration_date IS NULL OR expiration_date > NOW())) AS active_coupons,
        COALESCE(SUM(uses_count), 0) AS total_redemptions
      FROM coupons
    `);

    const redemptionsRes = await pool.query(`
      SELECT COALESCE(SUM(discount_amount_cents), 0) AS total_discount_given_cents
      FROM coupon_redemptions
    `);

    const campaignsRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_campaigns,
        COUNT(*) FILTER (WHERE status = 'active') AS active_campaigns,
        COALESCE(SUM(total_revenue_cents), 0) AS campaigns_revenue_cents
      FROM marketing_campaigns
    `);

    const bannersRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_banners,
        COUNT(*) FILTER (WHERE status = 'published') AS active_banners,
        COALESCE(SUM(impressions), 0) AS banner_impressions,
        COALESCE(SUM(clicks), 0) AS banner_clicks
      FROM homepage_banners
    `);

    const affiliatesRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_affiliates,
        COUNT(*) FILTER (WHERE status = 'approved') AS active_affiliates,
        COALESCE(SUM(total_revenue_cents), 0) AS affiliate_revenue_cents,
        COALESCE(SUM(paid_commission_cents), 0) AS affiliate_paid_cents,
        COALESCE(SUM(pending_commission_cents + approved_commission_cents), 0) AS affiliate_pending_cents
      FROM affiliates
    `);

    const referralsRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_programs,
        COUNT(*) FILTER (WHERE status = 'active') AS active_programs
      FROM referral_programs
    `);

    const referralConvRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_referral_conversions,
        COALESCE(SUM(referrer_reward_cents + referee_reward_cents), 0) AS total_referral_rewards_cents
      FROM referral_conversions
    `);

    const adsRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_ads,
        COUNT(*) FILTER (WHERE status = 'active') AS active_ads,
        COALESCE(SUM(current_spend_cents), 0) AS total_ad_spend_cents,
        COALESCE(SUM(impressions), 0) AS ad_impressions,
        COALESCE(SUM(clicks), 0) AS ad_clicks
      FROM advertisements
    `);

    const subscribersRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_subscribers,
        COUNT(*) FILTER (WHERE status = 'subscribed' OR status = 'active') AS active_subscribers
      FROM newsletter_subscribers
    `);

    const featServicesRes = await pool.query(`SELECT COUNT(*) AS total FROM featured_services WHERE is_active = true`);
    const featProductsRes = await pool.query(`SELECT COUNT(*) AS total FROM featured_products WHERE is_active = true`);

    const cRow = couponsRes.rows[0];
    const redRow = redemptionsRes.rows[0];
    const campRow = campaignsRes.rows[0];
    const banRow = bannersRes.rows[0];
    const affRow = affiliatesRes.rows[0];
    const refRow = referralsRes.rows[0];
    const refConvRow = referralConvRes.rows[0];
    const adRow = adsRes.rows[0];
    const subRow = subscribersRes.rows[0];

    const bannerClicks = parseInt(banRow.banner_clicks, 10);
    const bannerImps = parseInt(banRow.banner_impressions, 10);
    const bannerCtr = bannerImps > 0 ? ((bannerClicks / bannerImps) * 100).toFixed(2) : 0;

    const adClicks = parseInt(adRow.ad_clicks, 10);
    const adImps = parseInt(adRow.ad_impressions, 10);
    const adCtr = adImps > 0 ? ((adClicks / adImps) * 100).toFixed(2) : 0;

    return {
      coupons: {
        total: parseInt(cRow.total_coupons, 10),
        active: parseInt(cRow.active_coupons, 10),
        total_redemptions: parseInt(cRow.total_redemptions, 10),
        total_discount_given_cents: parseInt(redRow.total_discount_given_cents, 10)
      },
      campaigns: {
        total: parseInt(campRow.total_campaigns, 10),
        active: parseInt(campRow.active_campaigns, 10),
        revenue_cents: parseInt(campRow.campaigns_revenue_cents, 10)
      },
      featured: {
        active_services: parseInt(featServicesRes.rows[0].total, 10),
        active_products: parseInt(featProductsRes.rows[0].total, 10)
      },
      banners: {
        total: parseInt(banRow.total_banners, 10),
        active: parseInt(banRow.active_banners, 10),
        impressions: bannerImps,
        clicks: bannerClicks,
        ctr: parseFloat(bannerCtr)
      },
      subscribers: {
        total: parseInt(subRow.total_subscribers, 10),
        active: parseInt(subRow.active_subscribers, 10)
      },
      affiliates: {
        total: parseInt(affRow.total_affiliates, 10),
        active: parseInt(affRow.active_affiliates, 10),
        revenue_cents: parseInt(affRow.affiliate_revenue_cents, 10),
        paid_cents: parseInt(affRow.affiliate_paid_cents, 10),
        pending_cents: parseInt(affRow.affiliate_pending_cents, 10)
      },
      referrals: {
        programs: parseInt(refRow.total_programs, 10),
        active_programs: parseInt(refRow.active_programs, 10),
        conversions: parseInt(refConvRow.total_referral_conversions, 10),
        rewards_spent_cents: parseInt(refConvRow.total_referral_rewards_cents, 10)
      },
      advertisements: {
        total: parseInt(adRow.total_ads, 10),
        active: parseInt(adRow.active_ads, 10),
        total_spend_cents: parseInt(adRow.total_ad_spend_cents, 10),
        impressions: adImps,
        clicks: adClicks,
        ctr: parseFloat(adCtr)
      }
    };
  }

  // ==========================================================================
  // 1. COUPONS
  // ==========================================================================
  async getCoupons({ page = 1, limit = 20, search = '', status = '', discount_type = '', coupon_type = '', sort_by = 'created_at', sort_dir = 'DESC' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      conditions.push(`(code ILIKE $${pIdx} OR name ILIKE $${pIdx} OR description ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (status && status !== 'all') {
      conditions.push(`status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (discount_type && discount_type !== 'all') {
      conditions.push(`discount_type = $${pIdx}`);
      params.push(discount_type);
      pIdx++;
    }

    if (coupon_type && coupon_type !== 'all') {
      conditions.push(`coupon_type = $${pIdx}`);
      params.push(coupon_type);
      pIdx++;
    }

    const validSortCols = ['created_at', 'code', 'discount_value', 'uses_count', 'start_date', 'expiration_date', 'status'];
    const safeSort = validSortCols.includes(sort_by) ? sort_by : 'created_at';
    const safeDir = sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM coupons WHERE ${conditions.join(' AND ')}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT *,
        uses_count AS current_uses,
        per_customer_limit AS max_uses_per_customer,
        new_customer_only AS is_new_customer_only,
        stackable AS is_stackable,
        expiration_date AS end_date
      FROM coupons
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${safeSort} ${safeDir}
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async getCouponById(id) {
    const { rows } = await pool.query(`
      SELECT *,
        uses_count AS current_uses,
        per_customer_limit AS max_uses_per_customer,
        new_customer_only AS is_new_customer_only,
        stackable AS is_stackable,
        expiration_date AS end_date
      FROM coupons WHERE id = $1
    `, [id]);
    if (rows.length === 0) throw new NotFoundError('Coupon not found');
    const coupon = rows[0];

    const redemptions = await pool.query(`
      SELECT cr.*, u.first_name, u.last_name, u.email, o.amount_cents
      FROM coupon_redemptions cr
      LEFT JOIN users u ON cr.user_id = u.id
      LEFT JOIN orders o ON cr.order_id = o.id
      WHERE cr.coupon_id = $1
      ORDER BY cr.redeemed_at DESC
      LIMIT 50
    `, [id]);

    return { ...coupon, redemptions: redemptions.rows };
  }

  async createCoupon(data, actorId) {
    const code = (data.code || '').trim().toUpperCase();
    if (!code) throw new BadRequestError('Coupon code is required.');

    const dup = await pool.query(`SELECT id FROM coupons WHERE UPPER(code) = $1`, [code]);
    if (dup.rows.length > 0) throw new BadRequestError(`Coupon code "${code}" already exists.`);

    const discountType = data.discount_type || 'percentage';
    const discountVal = parseFloat(data.discount_value);
    if (isNaN(discountVal) || discountVal <= 0) {
      throw new BadRequestError('Discount value must be greater than zero.');
    }
    if (discountType === 'percentage' && discountVal > 100) {
      throw new BadRequestError('Percentage discount cannot exceed 100%.');
    }

    const { rows } = await pool.query(`
      INSERT INTO coupons (
        code, name, description, coupon_type, discount_type, discount_value,
        max_discount_cents, min_order_cents, max_uses, per_customer_limit,
        new_customer_only, stackable, applicable_product_ids, applicable_service_ids,
        applicable_category_ids, applicable_seller_ids, start_date, expiration_date,
        status, created_by_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING *,
        uses_count AS current_uses,
        per_customer_limit AS max_uses_per_customer,
        new_customer_only AS is_new_customer_only,
        stackable AS is_stackable,
        expiration_date AS end_date;
    `, [
      code,
      data.name || code,
      data.description || null,
      data.coupon_type || 'percentage',
      discountType,
      discountVal,
      data.max_discount_cents ? parseInt(data.max_discount_cents, 10) : null,
      data.min_order_cents ? parseInt(data.min_order_cents, 10) : 0,
      data.max_uses ? parseInt(data.max_uses, 10) : null,
      data.max_uses_per_customer || data.per_customer_limit ? parseInt(data.max_uses_per_customer || data.per_customer_limit, 10) : 1,
      Boolean(data.is_new_customer_only !== undefined ? data.is_new_customer_only : data.new_customer_only),
      Boolean(data.is_stackable !== undefined ? data.is_stackable : data.stackable),
      Array.isArray(data.applicable_product_ids) ? data.applicable_product_ids : null,
      Array.isArray(data.applicable_service_ids) ? data.applicable_service_ids : null,
      Array.isArray(data.applicable_category_ids) ? data.applicable_category_ids : null,
      Array.isArray(data.applicable_seller_ids) ? data.applicable_seller_ids : null,
      data.start_date || new Date(),
      data.end_date || data.expiration_date || null,
      data.status || 'active',
      actorId
    ]);

    const created = rows[0];
    await this.logMarketingAction({
      entityType: 'coupon',
      entityId: created.id,
      actionType: 'create',
      actorId,
      newData: created,
      reason: `Created coupon ${created.code}`
    });

    return created;
  }

  async updateCoupon(id, data, actorId) {
    const existing = await this.getCouponById(id);

    const discountType = data.discount_type !== undefined ? data.discount_type : existing.discount_type;
    const discountVal = data.discount_value !== undefined ? parseFloat(data.discount_value) : existing.discount_value;
    if (discountType === 'percentage' && discountVal > 100) {
      throw new BadRequestError('Percentage discount cannot exceed 100%.');
    }

    const { rows } = await pool.query(`
      UPDATE coupons SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        coupon_type = COALESCE($3, coupon_type),
        discount_type = COALESCE($4, discount_type),
        discount_value = COALESCE($5, discount_value),
        max_discount_cents = $6,
        min_order_cents = COALESCE($7, min_order_cents),
        max_uses = $8,
        per_customer_limit = COALESCE($9, per_customer_limit),
        new_customer_only = COALESCE($10, new_customer_only),
        stackable = COALESCE($11, stackable),
        applicable_product_ids = $12,
        applicable_service_ids = $13,
        applicable_category_ids = $14,
        applicable_seller_ids = $15,
        start_date = COALESCE($16, start_date),
        expiration_date = $17,
        status = COALESCE($18, status),
        updated_at = NOW()
      WHERE id = $19
      RETURNING *,
        uses_count AS current_uses,
        per_customer_limit AS max_uses_per_customer,
        new_customer_only AS is_new_customer_only,
        stackable AS is_stackable,
        expiration_date AS end_date;
    `, [
      data.name,
      data.description,
      data.coupon_type,
      discountType,
      discountVal,
      data.max_discount_cents !== undefined ? (data.max_discount_cents ? parseInt(data.max_discount_cents, 10) : null) : existing.max_discount_cents,
      data.min_order_cents !== undefined ? parseInt(data.min_order_cents, 10) : existing.min_order_cents,
      data.max_uses !== undefined ? (data.max_uses ? parseInt(data.max_uses, 10) : null) : existing.max_uses,
      data.max_uses_per_customer !== undefined ? parseInt(data.max_uses_per_customer, 10) : existing.per_customer_limit,
      data.is_new_customer_only !== undefined ? Boolean(data.is_new_customer_only) : existing.new_customer_only,
      data.is_stackable !== undefined ? Boolean(data.is_stackable) : existing.stackable,
      data.applicable_product_ids !== undefined ? data.applicable_product_ids : existing.applicable_product_ids,
      data.applicable_service_ids !== undefined ? data.applicable_service_ids : existing.applicable_service_ids,
      data.applicable_category_ids !== undefined ? data.applicable_category_ids : existing.applicable_category_ids,
      data.applicable_seller_ids !== undefined ? data.applicable_seller_ids : existing.applicable_seller_ids,
      data.start_date,
      data.end_date !== undefined ? data.end_date : (data.expiration_date !== undefined ? data.expiration_date : existing.expiration_date),
      data.status,
      id
    ]);

    const updated = rows[0];
    await this.logMarketingAction({
      entityType: 'coupon',
      entityId: id,
      actionType: 'update',
      actorId,
      prevData: existing,
      newData: updated,
      reason: `Updated coupon ${updated.code}`
    });

    return updated;
  }

  async toggleCouponStatus(id, actorId) {
    const existing = await this.getCouponById(id);
    const newStatus = existing.status === 'active' ? 'disabled' : 'active';
    const { rows } = await pool.query(
      `UPDATE coupons SET status = $1, is_active = $2, updated_at = NOW() WHERE id = $3 RETURNING *,
        uses_count AS current_uses,
        per_customer_limit AS max_uses_per_customer,
        new_customer_only AS is_new_customer_only,
        stackable AS is_stackable,
        expiration_date AS end_date;`,
      [newStatus, newStatus === 'active', id]
    );

    await this.logMarketingAction({
      entityType: 'coupon',
      entityId: id,
      actionType: 'toggle_status',
      actorId,
      prevData: { status: existing.status },
      newData: { status: newStatus },
      reason: `Coupon status toggled to ${newStatus}`
    });

    return rows[0];
  }

  async deleteCoupon(id, actorId) {
    const existing = await this.getCouponById(id);
    const { rows: rRows } = await pool.query(`SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id = $1`, [id]);
    const redCount = parseInt(rRows[0].count, 10);
    if (redCount > 0) {
      const { rows } = await pool.query(
        `UPDATE coupons SET status = 'disabled', is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );
      await this.logMarketingAction({
        entityType: 'coupon',
        entityId: id,
        actionType: 'disable',
        actorId,
        reason: 'Disabled coupon because it has existing redemption records'
      });
      return { message: 'Coupon has existing redemptions and was disabled instead of deleted.', coupon: rows[0] };
    }

    await pool.query(`DELETE FROM coupons WHERE id = $1`, [id]);
    await this.logMarketingAction({
      entityType: 'coupon',
      entityId: id,
      actionType: 'delete',
      actorId,
      prevData: existing,
      reason: `Deleted coupon ${existing.code}`
    });

    return { message: 'Coupon deleted successfully.' };
  }

  /**
   * SERVER-SIDE COUPON VALIDATION & DISCOUNT CALCULATION ENGINE
   */
  async validateCoupon({ code, customerId = null, items = [], orderAmountCents = 0 }) {
    if (!code || !code.trim()) {
      throw new BadRequestError('Coupon code is required.');
    }

    const { rows } = await pool.query(
      `SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)`,
      [code.trim()]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Invalid coupon code.');
    }

    const coupon = rows[0];
    const now = new Date();

    if (coupon.status !== 'active') {
      throw new BadRequestError('This coupon is currently inactive.');
    }

    if (coupon.start_date && new Date(coupon.start_date) > now) {
      throw new BadRequestError('This promotional campaign has not started yet.');
    }

    if (coupon.expiration_date && new Date(coupon.expiration_date) < now) {
      throw new BadRequestError('This coupon code has expired.');
    }

    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
      throw new BadRequestError('This coupon has reached its maximum total usage limit.');
    }

    // Min order cents check
    if (coupon.min_order_cents && orderAmountCents < coupon.min_order_cents) {
      const minDollar = (coupon.min_order_cents / 100).toFixed(2);
      throw new BadRequestError(`Minimum order amount of $${minDollar} is required to apply this coupon.`);
    }

    // Customer specific checks
    if (customerId) {
      if (coupon.new_customer_only) {
        const orderHistory = await pool.query(
          `SELECT COUNT(*) FROM orders WHERE buyer_id = $1 AND status NOT IN ('cancelled', 'refunded')`,
          [customerId]
        );
        if (parseInt(orderHistory.rows[0].count, 10) > 0) {
          throw new BadRequestError('This coupon is only valid for first-time customers.');
        }
      }

      if (coupon.per_customer_limit) {
        const userRedemptions = await pool.query(
          `SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2`,
          [coupon.id, customerId]
        );
        if (parseInt(userRedemptions.rows[0].count, 10) >= coupon.per_customer_limit) {
          throw new BadRequestError(`You have already redeemed this coupon the maximum allowed times (${coupon.per_customer_limit}).`);
        }
      }
    }

    // Target restriction checks
    let eligibleAmountCents = orderAmountCents;
    if (items && items.length > 0) {
      const hasRestrictions = (coupon.applicable_product_ids && coupon.applicable_product_ids.length > 0) ||
        (coupon.applicable_service_ids && coupon.applicable_service_ids.length > 0) ||
        (coupon.applicable_category_ids && coupon.applicable_category_ids.length > 0) ||
        (coupon.applicable_seller_ids && coupon.applicable_seller_ids.length > 0);

      if (hasRestrictions) {
        let matchingSubtotal = 0;
        let matchedAny = false;

        for (const item of items) {
          const itemMatch = (
            (coupon.applicable_product_ids && coupon.applicable_product_ids.includes(item.product_id)) ||
            (coupon.applicable_service_ids && coupon.applicable_service_ids.includes(item.service_id)) ||
            (coupon.applicable_category_ids && coupon.applicable_category_ids.includes(item.category_id)) ||
            (coupon.applicable_seller_ids && coupon.applicable_seller_ids.includes(item.seller_id))
          );

          if (itemMatch) {
            matchedAny = true;
            matchingSubtotal += (item.amount_cents || item.price_cents || 0);
          }
        }

        if (!matchedAny) {
          throw new BadRequestError('This coupon is not applicable to any items in your cart.');
        }

        eligibleAmountCents = matchingSubtotal;
      }
    }

    // Calculate discount amount server-side strictly
    let discountCents = 0;
    if (coupon.discount_type === 'percentage') {
      discountCents = Math.round(eligibleAmountCents * (coupon.discount_value / 100));
    } else {
      discountCents = Math.round(coupon.discount_value);
    }

    // Enforce max discount cap if defined
    if (coupon.max_discount_cents && discountCents > coupon.max_discount_cents) {
      discountCents = coupon.max_discount_cents;
    }

    // Discount cannot exceed eligible amount
    if (discountCents > eligibleAmountCents) {
      discountCents = eligibleAmountCents;
    }

    const finalOrderAmountCents = Math.max(0, orderAmountCents - discountCents);

    return {
      valid: true,
      coupon_id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_cents: discountCents,
      original_amount_cents: orderAmountCents,
      final_amount_cents: finalOrderAmountCents,
      is_stackable: coupon.stackable
    };
  }

  // ==========================================================================
  // 2. DISCOUNT CAMPAIGNS
  // ==========================================================================
  async getCampaigns({ page = 1, limit = 20, search = '', status = '', campaign_type = '', sort_by = 'created_at', sort_dir = 'DESC' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      conditions.push(`(name ILIKE $${pIdx} OR description ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (status && status !== 'all') {
      conditions.push(`status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (campaign_type && campaign_type !== 'all') {
      conditions.push(`campaign_type = $${pIdx}`);
      params.push(campaign_type);
      pIdx++;
    }

    const validSort = ['created_at', 'name', 'start_date', 'end_date', 'discount_value', 'status'];
    const safeSort = validSort.includes(sort_by) ? sort_by : 'created_at';
    const safeDir = sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countRes = await pool.query(`SELECT COUNT(*) FROM marketing_campaigns WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT c.*,
        c.discount_value AS discount_percentage,
        c.banner_url AS banner_image_url,
        (SELECT COUNT(*) FROM campaign_items ci WHERE ci.campaign_id = c.id) AS items_count
      FROM marketing_campaigns c
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${safeSort} ${safeDir}
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async getCampaignById(id) {
    const { rows } = await pool.query(`
      SELECT *,
        discount_value AS discount_percentage,
        banner_url AS banner_image_url
      FROM marketing_campaigns WHERE id = $1
    `, [id]);
    if (rows.length === 0) throw new NotFoundError('Campaign not found');
    const campaign = rows[0];

    const items = await pool.query(`
      SELECT ci.*, 
        ci.custom_discount_value AS custom_discount_pct,
        dp.title AS product_title, dp.price_personal_cents AS product_price,
        srv.title AS service_title, srv.starting_price_cents AS service_price
      FROM campaign_items ci
      LEFT JOIN digital_products dp ON (ci.item_type = 'product' AND ci.item_id = dp.id)
      LEFT JOIN services srv ON (ci.item_type = 'service' AND ci.item_id = srv.id)
      WHERE ci.campaign_id = $1
    `, [id]);

    return { ...campaign, items: items.rows };
  }

  async createCampaign(data, actorId) {
    if (!data.name || !data.name.trim()) throw new BadRequestError('Campaign name is required.');

    const client = await pool.getClient();
    try {
      await client.query('BEGIN');

      const discVal = data.discount_percentage !== undefined ? parseFloat(data.discount_percentage) : (data.discount_value ? parseFloat(data.discount_value) : 10.00);

      const { rows } = await client.query(`
        INSERT INTO marketing_campaigns (
          name, description, campaign_type, discount_value,
          budget_cents, current_spend_cents, start_date, end_date,
          status, banner_url, created_by_id
        ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10)
        RETURNING *,
          discount_value AS discount_percentage,
          banner_url AS banner_image_url;
      `, [
        data.name.trim(),
        data.description || null,
        data.campaign_type || 'seasonal_sale',
        discVal,
        data.budget_cents ? parseInt(data.budget_cents, 10) : 100000,
        data.start_date || new Date(),
        data.end_date || new Date(Date.now() + 30 * 86400000),
        data.status === 'published' ? 'active' : (data.status || 'draft'),
        data.banner_image_url || data.banner_url || null,
        actorId
      ]);

      const campaign = rows[0];

      if (Array.isArray(data.items) && data.items.length > 0) {
        for (const it of data.items) {
          const itemType = it.product_id ? 'product' : (it.service_id ? 'service' : (it.item_type || 'product'));
          const itemId = it.product_id || it.service_id || it.item_id;
          if (itemId) {
            await client.query(`
              INSERT INTO campaign_items (campaign_id, item_type, item_id, custom_discount_value)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (campaign_id, item_type, item_id) DO NOTHING;
            `, [campaign.id, itemType, itemId, it.custom_discount_pct || it.custom_discount_value || null]);
          }
        }
      }

      await client.query('COMMIT');

      await this.logMarketingAction({
        entityType: 'campaign',
        entityId: campaign.id,
        actionType: 'create',
        actorId,
        newData: campaign,
        reason: `Created campaign ${campaign.name}`
      });

      return campaign;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateCampaign(id, data, actorId) {
    const existing = await this.getCampaignById(id);

    const discVal = data.discount_percentage !== undefined ? parseFloat(data.discount_percentage) : (data.discount_value !== undefined ? parseFloat(data.discount_value) : existing.discount_value);

    const { rows } = await pool.query(`
      UPDATE marketing_campaigns SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        campaign_type = COALESCE($3, campaign_type),
        discount_value = $4,
        budget_cents = COALESCE($5, budget_cents),
        start_date = COALESCE($6, start_date),
        end_date = COALESCE($7, end_date),
        status = COALESCE($8, status),
        banner_url = COALESCE($9, banner_url),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *,
        discount_value AS discount_percentage,
        banner_url AS banner_image_url;
    `, [
      data.name,
      data.description,
      data.campaign_type,
      discVal,
      data.budget_cents !== undefined ? parseInt(data.budget_cents, 10) : existing.budget_cents,
      data.start_date,
      data.end_date,
      data.status,
      data.banner_image_url || data.banner_url,
      id
    ]);

    const updated = rows[0];
    await this.logMarketingAction({
      entityType: 'campaign',
      entityId: id,
      actionType: 'update',
      actorId,
      prevData: existing,
      newData: updated,
      reason: `Updated campaign ${updated.name}`
    });

    return updated;
  }

  async updateCampaignStatus(id, status, actorId) {
    const valid = ['draft', 'scheduled', 'active', 'published', 'paused', 'completed', 'cancelled'];
    if (!valid.includes(status)) throw new BadRequestError(`Invalid status: ${status}`);

    const existing = await this.getCampaignById(id);
    const dbStatus = status === 'published' ? 'active' : status;

    const { rows } = await pool.query(
      `UPDATE marketing_campaigns SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *,
        discount_value AS discount_percentage,
        banner_url AS banner_image_url;`,
      [dbStatus, id]
    );

    await this.logMarketingAction({
      entityType: 'campaign',
      entityId: id,
      actionType: 'status_change',
      actorId,
      prevData: { status: existing.status },
      newData: { status: dbStatus },
      reason: `Campaign status changed to ${dbStatus}`
    });

    return rows[0];
  }

  async deleteCampaign(id, actorId) {
    const existing = await this.getCampaignById(id);
    await pool.query(`DELETE FROM campaign_items WHERE campaign_id = $1`, [id]);
    await pool.query(`DELETE FROM marketing_campaigns WHERE id = $1`, [id]);

    await this.logMarketingAction({
      entityType: 'campaign',
      entityId: id,
      actionType: 'delete',
      actorId,
      prevData: existing,
      reason: `Deleted campaign ${existing.name}`
    });

    return { message: 'Campaign deleted successfully.' };
  }

  // ==========================================================================
  // 3. FEATURED SERVICES
  // ==========================================================================
  async getFeaturedServices({ page = 1, limit = 20, placement = '', active = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (placement && placement !== 'all') {
      conditions.push(`fs.placement = $${pIdx}`);
      params.push(placement);
      pIdx++;
    }

    if (active === 'true') {
      conditions.push(`fs.is_active = true AND (fs.end_date IS NULL OR fs.end_date > NOW())`);
    } else if (active === 'false') {
      conditions.push(`(fs.is_active = false OR (fs.end_date IS NOT NULL AND fs.end_date <= NOW()))`);
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM featured_services fs WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT fs.*, 
        fs.impressions_count AS impressions,
        fs.clicks_count AS clicks,
        s.title AS service_title, s.slug AS service_slug, s.starting_price_cents,
        s.seller_id, u.first_name AS seller_first_name, u.last_name AS seller_last_name
      FROM featured_services fs
      JOIN services s ON fs.service_id = s.id
      JOIN users u ON s.seller_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY fs.priority DESC, fs.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async featureService(data, actorId) {
    if (!data.service_id) throw new BadRequestError('Service ID is required.');

    const checkService = await pool.query(`SELECT id, title FROM services WHERE id = $1`, [data.service_id]);
    if (checkService.rows.length === 0) throw new NotFoundError('Service not found.');

    const placement = data.placement || 'homepage_hero';
    const priority = data.priority ? parseInt(data.priority, 10) : 10;

    const { rows } = await pool.query(`
      INSERT INTO featured_services (
        service_id, placement, priority, position, start_date, end_date,
        is_active, created_by_id
      ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7)
      RETURNING *,
        impressions_count AS impressions,
        clicks_count AS clicks;
    `, [
      data.service_id,
      placement,
      priority,
      data.start_date || new Date(),
      data.end_date || null,
      data.is_active !== undefined ? Boolean(data.is_active) : true,
      actorId
    ]);

    const featured = rows[0];
    await this.logMarketingAction({
      entityType: 'featured_service',
      entityId: featured.id,
      actionType: 'feature',
      actorId,
      newData: featured,
      reason: `Featured service ${checkService.rows[0].title} in ${placement}`
    });

    return featured;
  }

  async updateFeaturedService(id, data, actorId) {
    const { rows: existing } = await pool.query(`SELECT * FROM featured_services WHERE id = $1`, [id]);
    if (existing.length === 0) throw new NotFoundError('Featured service record not found.');

    const { rows } = await pool.query(`
      UPDATE featured_services SET
        placement = COALESCE($1, placement),
        priority = COALESCE($2, priority),
        position = COALESCE($2, position),
        start_date = COALESCE($3, start_date),
        end_date = $4,
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *,
        impressions_count AS impressions,
        clicks_count AS clicks;
    `, [
      data.placement,
      data.priority !== undefined ? parseInt(data.priority, 10) : existing[0].priority,
      data.start_date,
      data.end_date !== undefined ? data.end_date : existing[0].end_date,
      data.is_active !== undefined ? Boolean(data.is_active) : existing[0].is_active,
      id
    ]);

    await this.logMarketingAction({
      entityType: 'featured_service',
      entityId: id,
      actionType: 'update',
      actorId,
      prevData: existing[0],
      newData: rows[0]
    });

    return rows[0];
  }

  async unfeatureService(id, actorId) {
    const { rows: existing } = await pool.query(`SELECT * FROM featured_services WHERE id = $1`, [id]);
    if (existing.length === 0) throw new NotFoundError('Featured service record not found.');

    await pool.query(`DELETE FROM featured_services WHERE id = $1`, [id]);
    await this.logMarketingAction({
      entityType: 'featured_service',
      entityId: id,
      actionType: 'unfeature',
      actorId,
      prevData: existing[0]
    });

    return { message: 'Service unfeatured successfully.' };
  }

  async reorderFeaturedServices(items, actorId) {
    if (!Array.isArray(items)) throw new BadRequestError('Items array required.');
    for (const it of items) {
      if (it.id && it.priority !== undefined) {
        await pool.query(`UPDATE featured_services SET priority = $1, position = $1 WHERE id = $2`, [parseInt(it.priority, 10), it.id]);
      }
    }
    return { message: 'Priorities updated successfully.' };
  }

  // ==========================================================================
  // 4. FEATURED PRODUCTS
  // ==========================================================================
  async getFeaturedProducts({ page = 1, limit = 20, placement = '', active = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (placement && placement !== 'all') {
      conditions.push(`fp.placement = $${pIdx}`);
      params.push(placement);
      pIdx++;
    }

    if (active === 'true') {
      conditions.push(`fp.is_active = true AND (fp.end_date IS NULL OR fp.end_date > NOW())`);
    } else if (active === 'false') {
      conditions.push(`(fp.is_active = false OR (fp.end_date IS NOT NULL AND fp.end_date <= NOW()))`);
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM featured_products fp WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT fp.*, 
        dp.title AS product_title, dp.slug AS product_slug, dp.price_personal_cents, dp.price_commercial_cents,
        dp.seller_id, u.first_name AS seller_first_name, u.last_name AS seller_last_name
      FROM featured_products fp
      JOIN digital_products dp ON fp.product_id = dp.id
      JOIN users u ON dp.seller_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY fp.priority DESC, fp.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async featureProduct(data, actorId) {
    if (!data.product_id) throw new BadRequestError('Product ID is required.');

    const checkProduct = await pool.query(`SELECT id, title FROM digital_products WHERE id = $1`, [data.product_id]);
    if (checkProduct.rows.length === 0) throw new NotFoundError('Product not found.');

    const placement = data.placement || 'homepage_hero';
    const priority = data.priority ? parseInt(data.priority, 10) : 10;

    const { rows } = await pool.query(`
      INSERT INTO featured_products (
        product_id, placement, priority, position, start_date, end_date,
        is_active, created_by_id
      ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [
      data.product_id,
      placement,
      priority,
      data.start_date || new Date(),
      data.end_date || null,
      data.is_active !== undefined ? Boolean(data.is_active) : true,
      actorId
    ]);

    const featured = rows[0];
    await this.logMarketingAction({
      entityType: 'featured_product',
      entityId: featured.id,
      actionType: 'feature',
      actorId,
      newData: featured,
      reason: `Featured product ${checkProduct.rows[0].title} in ${placement}`
    });

    return featured;
  }

  async updateFeaturedProduct(id, data, actorId) {
    const { rows: existing } = await pool.query(`SELECT * FROM featured_products WHERE id = $1`, [id]);
    if (existing.length === 0) throw new NotFoundError('Featured product record not found.');

    const { rows } = await pool.query(`
      UPDATE featured_products SET
        placement = COALESCE($1, placement),
        priority = COALESCE($2, priority),
        position = COALESCE($2, position),
        start_date = COALESCE($3, start_date),
        end_date = $4,
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `, [
      data.placement,
      data.priority !== undefined ? parseInt(data.priority, 10) : existing[0].priority,
      data.start_date,
      data.end_date !== undefined ? data.end_date : existing[0].end_date,
      data.is_active !== undefined ? Boolean(data.is_active) : existing[0].is_active,
      id
    ]);

    await this.logMarketingAction({
      entityType: 'featured_product',
      entityId: id,
      actionType: 'update',
      actorId,
      prevData: existing[0],
      newData: rows[0]
    });

    return rows[0];
  }

  async unfeatureProduct(id, actorId) {
    const { rows: existing } = await pool.query(`SELECT * FROM featured_products WHERE id = $1`, [id]);
    if (existing.length === 0) throw new NotFoundError('Featured product record not found.');

    await pool.query(`DELETE FROM featured_products WHERE id = $1`, [id]);
    await this.logMarketingAction({
      entityType: 'featured_product',
      entityId: id,
      actionType: 'unfeature',
      actorId,
      prevData: existing[0]
    });

    return { message: 'Product unfeatured successfully.' };
  }

  async reorderFeaturedProducts(items, actorId) {
    if (!Array.isArray(items)) throw new BadRequestError('Items array required.');
    for (const it of items) {
      if (it.id && it.priority !== undefined) {
        await pool.query(`UPDATE featured_products SET priority = $1, position = $1 WHERE id = $2`, [parseInt(it.priority, 10), it.id]);
      }
    }
    return { message: 'Priorities updated successfully.' };
  }

  // ==========================================================================
  // 5. HOMEPAGE BANNERS
  // ==========================================================================
  async getBanners({ page = 1, limit = 20, placement = '', active = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (placement && placement !== 'all') {
      conditions.push(`(banner_type = $${pIdx})`);
      params.push(placement);
      pIdx++;
    }

    if (active === 'true') {
      conditions.push(`status = 'published' AND (end_date IS NULL OR end_date > NOW())`);
    } else if (active === 'false') {
      conditions.push(`(status != 'published' OR (end_date IS NOT NULL AND end_date <= NOW()))`);
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM homepage_banners WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT *,
        banner_type AS placement,
        desktop_image_url AS image_desktop_url,
        tablet_image_url AS image_tablet_url,
        mobile_image_url AS image_mobile_url,
        cta_url AS cta_link,
        display_priority AS priority,
        (status = 'published') AS is_active
      FROM homepage_banners
      WHERE ${conditions.join(' AND ')}
      ORDER BY display_priority DESC, created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async getBannerById(id) {
    const { rows } = await pool.query(`
      SELECT *,
        banner_type AS placement,
        desktop_image_url AS image_desktop_url,
        tablet_image_url AS image_tablet_url,
        mobile_image_url AS image_mobile_url,
        cta_url AS cta_link,
        display_priority AS priority,
        (status = 'published') AS is_active
      FROM homepage_banners WHERE id = $1
    `, [id]);
    if (rows.length === 0) throw new NotFoundError('Banner not found.');
    return rows[0];
  }

  async createBanner(data, actorId) {
    const title = (data.title || data.name || '').trim();
    if (!title) throw new BadRequestError('Banner title is required.');
    const desktopImg = data.image_desktop_url || data.desktop_image_url;
    if (!desktopImg) throw new BadRequestError('Desktop banner image is required.');

    const { rows } = await pool.query(`
      INSERT INTO homepage_banners (
        name, title, subtitle, banner_type, desktop_image_url, tablet_image_url,
        mobile_image_url, cta_text, cta_url, display_priority, position, start_date, end_date,
        status, target_audience, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13, $14, $15)
      RETURNING *,
        banner_type AS placement,
        desktop_image_url AS image_desktop_url,
        tablet_image_url AS image_tablet_url,
        mobile_image_url AS image_mobile_url,
        cta_url AS cta_link,
        display_priority AS priority,
        (status = 'published') AS is_active;
    `, [
      data.name || title,
      title,
      data.subtitle || null,
      data.placement || data.banner_type || 'hero',
      desktopImg,
      data.image_tablet_url || data.tablet_image_url || desktopImg,
      data.image_mobile_url || data.mobile_image_url || desktopImg,
      data.cta_text || 'Explore Now',
      data.cta_link || data.cta_url || '/browse',
      data.priority || data.display_priority ? parseInt(data.priority || data.display_priority, 10) : 10,
      data.start_date || new Date(),
      data.end_date || null,
      data.is_active !== undefined ? (data.is_active ? 'published' : 'draft') : (data.status || 'published'),
      data.target_audience || 'all',
      actorId
    ]);

    const banner = rows[0];
    await this.logMarketingAction({
      entityType: 'banner',
      entityId: banner.id,
      actionType: 'create',
      actorId,
      newData: banner,
      reason: `Created banner ${banner.title}`
    });

    return banner;
  }

  async updateBanner(id, data, actorId) {
    const existing = await this.getBannerById(id);

    const title = data.title || data.name;
    const desktopImg = data.image_desktop_url || data.desktop_image_url;
    const bannerType = data.placement || data.banner_type;
    const ctaUrl = data.cta_link || data.cta_url;
    const priority = data.priority || data.display_priority;
    const statusVal = data.is_active !== undefined ? (data.is_active ? 'published' : 'draft') : data.status;

    const { rows } = await pool.query(`
      UPDATE homepage_banners SET
        name = COALESCE($1, name),
        title = COALESCE($1, title),
        subtitle = COALESCE($2, subtitle),
        banner_type = COALESCE($3, banner_type),
        desktop_image_url = COALESCE($4, desktop_image_url),
        tablet_image_url = COALESCE($5, tablet_image_url),
        mobile_image_url = COALESCE($6, mobile_image_url),
        cta_text = COALESCE($7, cta_text),
        cta_url = COALESCE($8, cta_url),
        display_priority = COALESCE($9, display_priority),
        position = COALESCE($9, position),
        start_date = COALESCE($10, start_date),
        end_date = $11,
        status = COALESCE($12, status),
        target_audience = COALESCE($13, target_audience),
        updated_at = NOW()
      WHERE id = $14
      RETURNING *,
        banner_type AS placement,
        desktop_image_url AS image_desktop_url,
        tablet_image_url AS image_tablet_url,
        mobile_image_url AS image_mobile_url,
        cta_url AS cta_link,
        display_priority AS priority,
        (status = 'published') AS is_active;
    `, [
      title,
      data.subtitle,
      bannerType,
      desktopImg,
      data.image_tablet_url || data.tablet_image_url,
      data.image_mobile_url || data.mobile_image_url,
      data.cta_text,
      ctaUrl,
      priority !== undefined ? parseInt(priority, 10) : undefined,
      data.start_date,
      data.end_date !== undefined ? data.end_date : existing.end_date,
      statusVal,
      data.target_audience,
      id
    ]);

    const updated = rows[0];
    await this.logMarketingAction({
      entityType: 'banner',
      entityId: id,
      actionType: 'update',
      actorId,
      prevData: existing,
      newData: updated
    });

    return updated;
  }

  async toggleBannerStatus(id, actorId) {
    const existing = await this.getBannerById(id);
    const newStatus = existing.status === 'published' ? 'draft' : 'published';

    const { rows } = await pool.query(`
      UPDATE homepage_banners SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *,
        banner_type AS placement,
        desktop_image_url AS image_desktop_url,
        tablet_image_url AS image_tablet_url,
        mobile_image_url AS image_mobile_url,
        cta_url AS cta_link,
        display_priority AS priority,
        (status = 'published') AS is_active;
    `, [newStatus, id]);

    await this.logMarketingAction({
      entityType: 'banner',
      entityId: id,
      actionType: 'toggle_active',
      actorId,
      prevData: { status: existing.status },
      newData: { status: newStatus }
    });

    return rows[0];
  }

  async deleteBanner(id, actorId) {
    const existing = await this.getBannerById(id);
    await pool.query(`DELETE FROM homepage_banners WHERE id = $1`, [id]);

    await this.logMarketingAction({
      entityType: 'banner',
      entityId: id,
      actionType: 'delete',
      actorId,
      prevData: existing,
      reason: `Deleted banner ${existing.title}`
    });

    return { message: 'Banner deleted successfully.' };
  }

  // ==========================================================================
  // 6. PROMOTIONAL SECTIONS
  // ==========================================================================
  async getSections({ page = 1, limit = 20, active = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (active === 'true') {
      conditions.push(`is_active = true`);
    } else if (active === 'false') {
      conditions.push(`is_active = false`);
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM promotional_sections WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT *,
        display_layout AS layout,
        grid_columns AS columns_count,
        display_count AS max_items_count,
        sort_order AS priority,
        (SELECT COUNT(*) FROM promotional_section_items psi WHERE psi.section_id = s.id) AS items_count
      FROM promotional_sections s
      WHERE ${conditions.join(' AND ')}
      ORDER BY sort_order DESC, created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async getSectionById(id) {
    const { rows } = await pool.query(`
      SELECT *,
        display_layout AS layout,
        grid_columns AS columns_count,
        display_count AS max_items_count,
        sort_order AS priority
      FROM promotional_sections WHERE id = $1
    `, [id]);
    if (rows.length === 0) throw new NotFoundError('Section not found.');
    const section = rows[0];

    const items = await pool.query(`
      SELECT psi.*,
        psi.position AS priority,
        dp.title AS product_title, dp.price_personal_cents AS product_price,
        srv.title AS service_title, srv.starting_price_cents AS service_price,
        cat.name AS category_name
      FROM promotional_section_items psi
      LEFT JOIN digital_products dp ON (psi.item_type = 'product' AND psi.item_id = dp.id)
      LEFT JOIN services srv ON (psi.item_type = 'service' AND psi.item_id = srv.id)
      LEFT JOIN listing_categories cat ON (psi.item_type = 'category' AND psi.item_id = cat.id)
      WHERE psi.section_id = $1
      ORDER BY psi.position DESC
    `, [id]);

    return { ...section, items: items.rows };
  }

  async createSection(data, actorId) {
    if (!data.title || !data.title.trim()) throw new BadRequestError('Section title is required.');

    const client = await pool.getClient();
    try {
      await client.query('BEGIN');

      const layout = data.layout || data.display_layout || 'grid';
      const cols = data.columns_count || data.grid_columns ? parseInt(data.columns_count || data.grid_columns, 10) : 4;
      const count = data.max_items_count || data.display_count ? parseInt(data.max_items_count || data.display_count, 10) : 8;
      const prio = data.priority || data.sort_order ? parseInt(data.priority || data.sort_order, 10) : 10;

      const { rows } = await client.query(`
        INSERT INTO promotional_sections (
          title, subtitle, section_type, display_layout, grid_columns,
          display_count, sort_order, is_active, status, created_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', $9)
        RETURNING *,
          display_layout AS layout,
          grid_columns AS columns_count,
          display_count AS max_items_count,
          sort_order AS priority;
      `, [
        data.title.trim(),
        data.subtitle || null,
        data.section_type || 'featured_products',
        layout,
        cols,
        count,
        prio,
        data.is_active !== undefined ? Boolean(data.is_active) : true,
        actorId
      ]);

      const section = rows[0];

      if (Array.isArray(data.items) && data.items.length > 0) {
        for (let i = 0; i < data.items.length; i++) {
          const it = data.items[i];
          const itemType = it.product_id ? 'product' : (it.service_id ? 'service' : (it.category_id ? 'category' : (it.item_type || 'product')));
          const itemId = it.product_id || it.service_id || it.category_id || it.item_id;
          if (itemId) {
            await client.query(`
              INSERT INTO promotional_section_items (section_id, item_type, item_id, position)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (section_id, item_type, item_id) DO NOTHING;
            `, [section.id, itemType, itemId, it.priority || it.position || (data.items.length - i)]);
          }
        }
      }

      await client.query('COMMIT');

      await this.logMarketingAction({
        entityType: 'promotional_section',
        entityId: section.id,
        actionType: 'create',
        actorId,
        newData: section,
        reason: `Created section ${section.title}`
      });

      return section;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateSection(id, data, actorId) {
    const existing = await this.getSectionById(id);

    const client = await pool.getClient();
    try {
      await client.query('BEGIN');

      const layout = data.layout || data.display_layout;
      const cols = data.columns_count || data.grid_columns;
      const count = data.max_items_count || data.display_count;
      const prio = data.priority || data.sort_order;

      const { rows } = await client.query(`
        UPDATE promotional_sections SET
          title = COALESCE($1, title),
          subtitle = COALESCE($2, subtitle),
          section_type = COALESCE($3, section_type),
          display_layout = COALESCE($4, display_layout),
          grid_columns = COALESCE($5, grid_columns),
          display_count = COALESCE($6, display_count),
          sort_order = COALESCE($7, sort_order),
          is_active = COALESCE($8, is_active),
          updated_at = NOW()
        WHERE id = $9
        RETURNING *,
          display_layout AS layout,
          grid_columns AS columns_count,
          display_count AS max_items_count,
          sort_order AS priority;
      `, [
        data.title,
        data.subtitle,
        data.section_type,
        layout,
        cols !== undefined ? parseInt(cols, 10) : undefined,
        count !== undefined ? parseInt(count, 10) : undefined,
        prio !== undefined ? parseInt(prio, 10) : undefined,
        data.is_active !== undefined ? Boolean(data.is_active) : undefined,
        id
      ]);

      const updated = rows[0];

      if (Array.isArray(data.items)) {
        await client.query(`DELETE FROM promotional_section_items WHERE section_id = $1`, [id]);
        for (let i = 0; i < data.items.length; i++) {
          const it = data.items[i];
          const itemType = it.product_id ? 'product' : (it.service_id ? 'service' : (it.category_id ? 'category' : (it.item_type || 'product')));
          const itemId = it.product_id || it.service_id || it.category_id || it.item_id;
          if (itemId) {
            await client.query(`
              INSERT INTO promotional_section_items (section_id, item_type, item_id, position)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (section_id, item_type, item_id) DO NOTHING;
            `, [id, itemType, itemId, it.priority || it.position || (data.items.length - i)]);
          }
        }
      }

      await client.query('COMMIT');

      await this.logMarketingAction({
        entityType: 'promotional_section',
        entityId: id,
        actionType: 'update',
        actorId,
        prevData: existing,
        newData: updated
      });

      return updated;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteSection(id, actorId) {
    const existing = await this.getSectionById(id);
    await pool.query(`DELETE FROM promotional_section_items WHERE section_id = $1`, [id]);
    await pool.query(`DELETE FROM promotional_sections WHERE id = $1`, [id]);

    await this.logMarketingAction({
      entityType: 'promotional_section',
      entityId: id,
      actionType: 'delete',
      actorId,
      prevData: existing,
      reason: `Deleted section ${existing.title}`
    });

    return { message: 'Promotional section deleted successfully.' };
  }

  // ==========================================================================
  // 7. NEWSLETTER CAMPAIGNS & SUBSCRIBERS
  // ==========================================================================
  async getNewsletters({ page = 1, limit = 20, search = '', status = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      conditions.push(`(subject ILIKE $${pIdx} OR name ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (status && status !== 'all') {
      conditions.push(`status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM newsletter_campaigns WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT *,
        content_html AS html_content,
        target_segment AS audience_segment,
        recipient_count AS total_recipients
      FROM newsletter_campaigns
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async getNewsletterById(id) {
    const { rows } = await pool.query(`
      SELECT *,
        content_html AS html_content,
        target_segment AS audience_segment,
        recipient_count AS total_recipients
      FROM newsletter_campaigns WHERE id = $1
    `, [id]);
    if (rows.length === 0) throw new NotFoundError('Newsletter not found.');
    return rows[0];
  }

  async createNewsletter(data, actorId) {
    const subject = (data.subject || '').trim();
    if (!subject) throw new BadRequestError('Newsletter subject is required.');
    const htmlContent = data.html_content || data.content_html;
    if (!htmlContent) throw new BadRequestError('HTML content is required.');

    const { rows } = await pool.query(`
      INSERT INTO newsletter_campaigns (
        name, subject, sender_name, sender_email, content_html, target_segment,
        status, scheduled_at, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *,
        content_html AS html_content,
        target_segment AS audience_segment,
        recipient_count AS total_recipients;
    `, [
      data.name || subject,
      subject,
      data.sender_name || 'Desigot Marketplace',
      data.sender_email || 'newsletter@desigot.com',
      htmlContent,
      data.audience_segment || data.target_segment || 'all_customers',
      data.status || 'draft',
      data.scheduled_at || null,
      actorId
    ]);

    const created = rows[0];
    await this.logMarketingAction({
      entityType: 'newsletter',
      entityId: created.id,
      actionType: 'create',
      actorId,
      newData: created
    });

    return created;
  }

  async updateNewsletter(id, data, actorId) {
    const existing = await this.getNewsletterById(id);
    if (existing.status === 'sent') {
      throw new BadRequestError('Cannot update an already sent newsletter campaign.');
    }

    const { rows } = await pool.query(`
      UPDATE newsletter_campaigns SET
        subject = COALESCE($1, subject),
        name = COALESCE($1, name),
        content_html = COALESCE($2, content_html),
        target_segment = COALESCE($3, target_segment),
        status = COALESCE($4, status),
        scheduled_at = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *,
        content_html AS html_content,
        target_segment AS audience_segment,
        recipient_count AS total_recipients;
    `, [
      data.subject,
      data.html_content || data.content_html,
      data.audience_segment || data.target_segment,
      data.status,
      data.scheduled_at !== undefined ? data.scheduled_at : existing.scheduled_at,
      id
    ]);

    const updated = rows[0];
    await this.logMarketingAction({
      entityType: 'newsletter',
      entityId: id,
      actionType: 'update',
      actorId,
      prevData: existing,
      newData: updated
    });

    return updated;
  }

  async sendNewsletterSimulation(id, actorId) {
    const existing = await this.getNewsletterById(id);
    if (existing.status === 'sent') {
      throw new BadRequestError('This campaign has already been sent.');
    }

    const subRes = await pool.query(`SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'subscribed' OR status = 'active'`);
    const totalRecipients = parseInt(subRes.rows[0].count, 10);
    const openCount = Math.round(totalRecipients * 0.42);
    const clickCount = Math.round(totalRecipients * 0.14);

    const { rows } = await pool.query(`
      UPDATE newsletter_campaigns SET
        status = 'sent',
        recipient_count = $1,
        open_count = $2,
        click_count = $3,
        sent_at = NOW(),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *,
        content_html AS html_content,
        target_segment AS audience_segment,
        recipient_count AS total_recipients;
    `, [totalRecipients, openCount, clickCount, id]);

    await this.logMarketingAction({
      entityType: 'newsletter',
      entityId: id,
      actionType: 'send',
      actorId,
      reason: `Sent newsletter to ${totalRecipients} subscribers`
    });

    return rows[0];
  }

  async deleteNewsletter(id, actorId) {
    const existing = await this.getNewsletterById(id);
    await pool.query(`DELETE FROM newsletter_campaigns WHERE id = $1`, [id]);
    await this.logMarketingAction({
      entityType: 'newsletter',
      entityId: id,
      actionType: 'delete',
      actorId,
      prevData: existing
    });

    return { message: 'Newsletter campaign deleted successfully.' };
  }

  async getNewsletterSubscribers({ page = 1, limit = 20, search = '', status = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      conditions.push(`email ILIKE $${pIdx}`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (status && status !== 'all') {
      conditions.push(`status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM newsletter_subscribers WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT *
      FROM newsletter_subscribers
      WHERE ${conditions.join(' AND ')}
      ORDER BY subscribed_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async subscribeNewsletter(email, source = 'footer_form') {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new BadRequestError('Valid email address is required.');
    }

    const { rows } = await pool.query(`
      INSERT INTO newsletter_subscribers (email, source, status, consent_given, subscribed_at)
      VALUES ($1, $2, 'subscribed', true, NOW())
      ON CONFLICT (email) DO UPDATE SET
        status = 'subscribed',
        unsubscribed_at = NULL
      RETURNING *;
    `, [cleanEmail, source]);

    return { message: 'Successfully subscribed to the Desigot newsletter.', subscriber: rows[0] };
  }

  async updateSubscriberStatus(id, status, actorId) {
    const valid = ['subscribed', 'active', 'unsubscribed', 'bounced'];
    if (!valid.includes(status)) throw new BadRequestError(`Invalid subscriber status: ${status}`);

    const unsubAt = status === 'unsubscribed' ? 'NOW()' : 'NULL';

    const { rows } = await pool.query(`
      UPDATE newsletter_subscribers SET
        status = $1,
        unsubscribed_at = ${unsubAt}
      WHERE id = $2
      RETURNING *;
    `, [status, id]);

    if (rows.length === 0) throw new NotFoundError('Subscriber not found.');

    await this.logMarketingAction({
      entityType: 'newsletter_subscriber',
      entityId: id,
      actionType: 'update_status',
      actorId,
      newData: { status }
    });

    return rows[0];
  }

  // ==========================================================================
  // 8. AFFILIATES & COMMISSIONS
  // ==========================================================================
  async getAffiliates({ page = 1, limit = 20, search = '', status = '', type = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      conditions.push(`(a.affiliate_code ILIKE $${pIdx} OR a.affiliate_name ILIKE $${pIdx} OR a.email ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (status && status !== 'all') {
      conditions.push(`a.status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (type && type !== 'all') {
      conditions.push(`a.affiliate_type = $${pIdx}`);
      params.push(type);
      pIdx++;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM affiliates a WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT a.*, u.first_name, u.last_name, u.role AS user_role
      FROM affiliates a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async getAffiliateById(id) {
    const { rows } = await pool.query(`SELECT * FROM affiliates WHERE id = $1`, [id]);
    if (rows.length === 0) throw new NotFoundError('Affiliate not found.');
    const affiliate = rows[0];

    const clicks = await pool.query(`SELECT * FROM affiliate_clicks WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 20`, [id]);
    const conversions = await pool.query(`SELECT * FROM affiliate_conversions WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 20`, [id]);
    const payouts = await pool.query(`SELECT * FROM affiliate_payouts WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 20`, [id]);

    return { ...affiliate, recent_clicks: clicks.rows, recent_conversions: conversions.rows, recent_payouts: payouts.rows };
  }

  async createAffiliate(data, actorId) {
    if (!data.email || !data.email.trim()) throw new BadRequestError('Affiliate email is required.');

    const cleanCode = (data.affiliate_code || `AFF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`).trim().toUpperCase();

    const dup = await pool.query(`SELECT id FROM affiliates WHERE UPPER(affiliate_code) = $1`, [cleanCode]);
    if (dup.rows.length > 0) throw new BadRequestError(`Affiliate code "${cleanCode}" already exists.`);

    const referralLink = `https://desigot.com/ref/${cleanCode}`;

    let userId = data.user_id;
    if (!userId) {
      const uRes = await pool.query(`SELECT id FROM users WHERE email = $1`, [data.email.trim().toLowerCase()]);
      if (uRes.rows.length > 0) {
        userId = uRes.rows[0].id;
      } else {
        const availableUser = await pool.query(`
          SELECT id FROM users
          WHERE id NOT IN (SELECT user_id FROM affiliates WHERE user_id IS NOT NULL)
          LIMIT 1;
        `);
        userId = availableUser.rows[0]?.id;
      }
    }

    const { rows } = await pool.query(`
      INSERT INTO affiliates (
        user_id, affiliate_code, affiliate_name, email, affiliate_type,
        referral_link, commission_type, commission_rate, status, approved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `, [
      userId,
      cleanCode,
      data.affiliate_name || cleanCode,
      data.email.trim().toLowerCase(),
      data.affiliate_type || 'creator',
      referralLink,
      data.commission_type || 'percentage',
      data.commission_rate ? parseFloat(data.commission_rate) : 10.00,
      data.status || 'approved',
      data.status === 'approved' ? new Date() : null
    ]);

    const created = rows[0];
    await this.logMarketingAction({
      entityType: 'affiliate',
      entityId: created.id,
      actionType: 'create',
      actorId,
      newData: created
    });

    return created;
  }

  async updateAffiliateStatus(id, status, actorId) {
    const valid = ['pending', 'approved', 'suspended', 'rejected'];
    if (!valid.includes(status)) throw new BadRequestError(`Invalid affiliate status: ${status}`);

    const existing = await this.getAffiliateById(id);

    const { rows } = await pool.query(`
      UPDATE affiliates SET
        status = $1,
        approved_at = ${status === 'approved' ? 'COALESCE(approved_at, NOW())' : 'approved_at'},
        updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `, [status, id]);

    await this.logMarketingAction({
      entityType: 'affiliate',
      entityId: id,
      actionType: 'status_change',
      actorId,
      prevData: { status: existing.status },
      newData: { status }
    });

    return rows[0];
  }

  async processAffiliatePayout({ affiliateId, amountCents, payoutMethod = 'stripe', notes = '' }, actorId) {
    const affiliate = await this.getAffiliateById(affiliateId);
    const amt = parseInt(amountCents, 10);
    if (isNaN(amt) || amt <= 0) throw new BadRequestError('Payout amount must be greater than zero.');

    const client = await pool.getClient();
    try {
      await client.query('BEGIN');

      const ref = `PAY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const { rows: payoutRows } = await client.query(`
        INSERT INTO affiliate_payouts (
          affiliate_id, payout_reference, amount_cents, payout_method,
          status, processed_by_id, paid_at
        ) VALUES ($1, $2, $3, $4, 'paid', $5, NOW())
        RETURNING *;
      `, [affiliateId, ref, amt, payoutMethod, actorId]);

      await client.query(`
        UPDATE affiliates SET
          approved_commission_cents = GREATEST(0, approved_commission_cents - $1),
          paid_commission_cents = paid_commission_cents + $1,
          updated_at = NOW()
        WHERE id = $2;
      `, [amt, affiliateId]);

      await client.query('COMMIT');

      await this.logMarketingAction({
        entityType: 'affiliate_payout',
        entityId: payoutRows[0].id,
        actionType: 'payout_processed',
        actorId,
        newData: payoutRows[0],
        reason: `Processed payout of $${(amt / 100).toFixed(2)} to ${affiliate.affiliate_name}`
      });

      return payoutRows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ==========================================================================
  // 9. REFERRAL PROGRAMS
  // ==========================================================================
  async getReferralPrograms({ page = 1, limit = 20, status = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (status && status !== 'all') {
      conditions.push(`status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM referral_programs WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT rp.*,
        (SELECT COUNT(*) FROM referral_codes rc WHERE rc.program_id = rp.id) AS total_participants,
        (SELECT COUNT(*) FROM referral_conversions rc2 WHERE rc2.program_id = rp.id) AS total_conversions
      FROM referral_programs rp
      WHERE ${conditions.join(' AND ')}
      ORDER BY rp.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async getReferralProgramById(id) {
    const { rows } = await pool.query(`SELECT * FROM referral_programs WHERE id = $1`, [id]);
    if (rows.length === 0) throw new NotFoundError('Referral program not found.');
    const prog = rows[0];

    const codes = await pool.query(`
      SELECT rc.*, u.first_name, u.last_name, u.email
      FROM referral_codes rc
      JOIN users u ON rc.user_id = u.id
      WHERE rc.program_id = $1
      ORDER BY rc.total_conversions DESC
      LIMIT 20
    `, [id]);

    const conversions = await pool.query(`
      SELECT rc.*, 
        r.first_name AS referrer_first_name, r.last_name AS referrer_last_name,
        e.first_name AS referee_first_name, e.last_name AS referee_last_name,
        o.amount_cents
      FROM referral_conversions rc
      JOIN users r ON rc.referrer_id = r.id
      JOIN users e ON rc.referee_id = e.id
      LEFT JOIN orders o ON rc.order_id = o.id
      WHERE rc.program_id = $1
      ORDER BY rc.created_at DESC
      LIMIT 20
    `, [id]);

    return { ...prog, codes: codes.rows, recent_conversions: conversions.rows };
  }

  async createReferralProgram(data, actorId) {
    if (!data.name || !data.name.trim()) throw new BadRequestError('Program name is required.');

    const { rows } = await pool.query(`
      INSERT INTO referral_programs (
        name, description, referral_type, referrer_reward_type, referrer_reward_value,
        referred_reward_type, referred_reward_value, min_order_cents, max_referrals_per_user,
        budget_cents, current_spend_cents, start_date, end_date, status, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $12, $13, $14)
      RETURNING *;
    `, [
      data.name.trim(),
      data.description || null,
      data.referral_type || 'customer_referral',
      data.referrer_reward_type || 'fixed',
      data.referrer_reward_value ? parseFloat(data.referrer_reward_value) : 1500,
      data.referred_reward_type || 'fixed',
      data.referred_reward_value ? parseFloat(data.referred_reward_value) : 1500,
      data.min_order_cents ? parseInt(data.min_order_cents, 10) : 3000,
      data.max_referrals_per_user ? parseInt(data.max_referrals_per_user, 10) : 20,
      data.budget_cents ? parseInt(data.budget_cents, 10) : 500000,
      data.start_date || new Date(),
      data.end_date || null,
      data.status || 'active',
      actorId
    ]);

    const created = rows[0];
    await this.logMarketingAction({
      entityType: 'referral_program',
      entityId: created.id,
      actionType: 'create',
      actorId,
      newData: created
    });

    return created;
  }

  async updateReferralProgram(id, data, actorId) {
    const existing = await this.getReferralProgramById(id);

    const { rows } = await pool.query(`
      UPDATE referral_programs SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        referrer_reward_type = COALESCE($3, referrer_reward_type),
        referrer_reward_value = COALESCE($4, referrer_reward_value),
        referred_reward_type = COALESCE($5, referred_reward_type),
        referred_reward_value = COALESCE($6, referred_reward_value),
        min_order_cents = COALESCE($7, min_order_cents),
        max_referrals_per_user = COALESCE($8, max_referrals_per_user),
        budget_cents = COALESCE($9, budget_cents),
        start_date = COALESCE($10, start_date),
        end_date = $11,
        status = COALESCE($12, status),
        updated_at = NOW()
      WHERE id = $13
      RETURNING *;
    `, [
      data.name,
      data.description,
      data.referrer_reward_type,
      data.referrer_reward_value !== undefined ? parseFloat(data.referrer_reward_value) : existing.referrer_reward_value,
      data.referred_reward_type,
      data.referred_reward_value !== undefined ? parseFloat(data.referred_reward_value) : existing.referred_reward_value,
      data.min_order_cents !== undefined ? parseInt(data.min_order_cents, 10) : existing.min_order_cents,
      data.max_referrals_per_user !== undefined ? parseInt(data.max_referrals_per_user, 10) : existing.max_referrals_per_user,
      data.budget_cents !== undefined ? parseInt(data.budget_cents, 10) : existing.budget_cents,
      data.start_date,
      data.end_date !== undefined ? data.end_date : existing.end_date,
      data.status,
      id
    ]);

    const updated = rows[0];
    await this.logMarketingAction({
      entityType: 'referral_program',
      entityId: id,
      actionType: 'update',
      actorId,
      prevData: existing,
      newData: updated
    });

    return updated;
  }

  async approveReferralConversion(id, actorId) {
    const { rows: conv } = await pool.query(`SELECT * FROM referral_conversions WHERE id = $1`, [id]);
    if (conv.length === 0) throw new NotFoundError('Referral conversion not found.');

    const c = conv[0];
    if (c.status === 'approved') throw new BadRequestError('Referral conversion already approved.');

    const { rows } = await pool.query(`
      UPDATE referral_conversions SET
        status = 'approved',
        approved_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [id]);

    const rewardTotal = (c.referrer_reward_cents || 0) + (c.referee_reward_cents || 0);
    await pool.query(`
      UPDATE referral_programs SET
        current_spend_cents = current_spend_cents + $1,
        updated_at = NOW()
      WHERE id = $2;
    `, [rewardTotal, c.program_id]);

    await this.logMarketingAction({
      entityType: 'referral_conversion',
      entityId: id,
      actionType: 'approve',
      actorId,
      newData: rows[0],
      reason: 'Approved referral conversion reward'
    });

    return rows[0];
  }

  // ==========================================================================
  // 10. ADVERTISEMENT MANAGEMENT & BUDGET ENGINE
  // ==========================================================================
  async getAdvertisements({ page = 1, limit = 20, search = '', status = '', placement = '', ad_type = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (search && search.trim()) {
      conditions.push(`(a.name ILIKE $${pIdx} OR a.headline ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (status && status !== 'all') {
      conditions.push(`a.status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (placement && placement !== 'all') {
      conditions.push(`a.placement = $${pIdx}`);
      params.push(placement);
      pIdx++;
    }

    if (ad_type && ad_type !== 'all') {
      conditions.push(`a.ad_type = $${pIdx}`);
      params.push(ad_type);
      pIdx++;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM advertisements a WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT a.*, u.first_name AS advertiser_first_name, u.last_name AS advertiser_last_name, u.email AS advertiser_email
      FROM advertisements a
      LEFT JOIN users u ON a.advertiser_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async getAdvertisementById(id) {
    const { rows } = await pool.query(`
      SELECT a.*, u.first_name AS advertiser_first_name, u.last_name AS advertiser_last_name, u.email AS advertiser_email
      FROM advertisements a
      LEFT JOIN users u ON a.advertiser_id = u.id
      WHERE a.id = $1
    `, [id]);
    if (rows.length === 0) throw new NotFoundError('Advertisement not found.');
    return rows[0];
  }

  async createAdvertisement(data, actorId) {
    if (!data.name || !data.name.trim()) throw new BadRequestError('Advertisement campaign name is required.');
    if (!data.headline) throw new BadRequestError('Headline is required.');

    const totalBudget = data.total_budget_cents ? parseInt(data.total_budget_cents, 10) : 50000;
    const dailyBudget = data.daily_budget_cents ? parseInt(data.daily_budget_cents, 10) : 5000;
    const bid = data.bid_amount_cents ? parseInt(data.bid_amount_cents, 10) : 50;

    const { rows } = await pool.query(`
      INSERT INTO advertisements (
        name, advertiser_id, ad_type, placement, creative_url, headline,
        description, cta_text, destination_url, billing_model, bid_amount_cents,
        total_budget_cents, daily_budget_cents, current_spend_cents,
        start_date, end_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, $14, $15, $16)
      RETURNING *;
    `, [
      data.name.trim(),
      data.advertiser_id || actorId,
      data.ad_type || 'homepage_banner',
      data.placement || 'homepage_top',
      data.creative_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      data.headline.trim(),
      data.description || null,
      data.cta_text || 'Learn More',
      data.destination_url || '/browse',
      data.billing_model || 'cpc',
      bid,
      totalBudget,
      dailyBudget,
      data.start_date || new Date(),
      data.end_date || null,
      data.status || 'active'
    ]);

    const created = rows[0];
    await this.logMarketingAction({
      entityType: 'advertisement',
      entityId: created.id,
      actionType: 'create',
      actorId,
      newData: created
    });

    return created;
  }

  async updateAdvertisementStatus(id, { status, rejectionReason = null }, actorId) {
    const valid = ['draft', 'pending_approval', 'approved', 'active', 'paused', 'completed', 'rejected'];
    if (!valid.includes(status)) throw new BadRequestError(`Invalid ad status: ${status}`);

    const existing = await this.getAdvertisementById(id);

    const { rows } = await pool.query(`
      UPDATE advertisements SET
        status = $1,
        rejection_reason = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `, [status, rejectionReason, id]);

    await this.logMarketingAction({
      entityType: 'advertisement',
      entityId: id,
      actionType: 'status_change',
      actorId,
      prevData: { status: existing.status },
      newData: { status, rejection_reason: rejectionReason }
    });

    return rows[0];
  }

  async recordAdClick(id) {
    const { rows: ad } = await pool.query(`SELECT * FROM advertisements WHERE id = $1`, [id]);
    if (ad.length === 0) throw new NotFoundError('Ad not found.');

    const a = ad[0];
    if (a.status !== 'active') return { message: 'Ad is not active.' };

    const newSpend = a.current_spend_cents + a.bid_amount_cents;
    const isBudgetExhausted = newSpend >= a.total_budget_cents;
    const newStatus = isBudgetExhausted ? 'completed' : 'active';

    const { rows: updated } = await pool.query(`
      UPDATE advertisements SET
        clicks = clicks + 1,
        current_spend_cents = $1,
        status = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `, [newSpend, newStatus, id]);

    return updated[0];
  }

  // ==========================================================================
  // 11. AUDIT LOGS & SETTINGS
  // ==========================================================================
  async getAuditLogs({ page = 1, limit = 20, entity_type = '', action_type = '' }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['1=1'];
    const params = [];
    let pIdx = 1;

    if (entity_type && entity_type !== 'all') {
      conditions.push(`l.entity_type = $${pIdx}`);
      params.push(entity_type);
      pIdx++;
    }

    if (action_type && action_type !== 'all') {
      conditions.push(`l.action_type = $${pIdx}`);
      params.push(action_type);
      pIdx++;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM marketing_audit_logs l WHERE ${conditions.join(' AND ')}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT l.*, 
        l.description AS notes,
        u.first_name AS actor_first_name, u.last_name AS actor_last_name, u.email AS actor_email
      FROM marketing_audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY l.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await pool.query(query, params);
    return { data: rows, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  async getSettings() {
    const { rows } = await pool.query(`SELECT key, value, description FROM marketing_settings`);
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    return settings;
  }

  async updateSettings(settingsObj, actorId) {
    for (const [key, val] of Object.entries(settingsObj)) {
      await pool.query(`
        INSERT INTO marketing_settings (key, value, updated_by, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW();
      `, [key, JSON.stringify(val), actorId]);
    }

    await this.logMarketingAction({
      entityType: 'marketing_settings',
      actionType: 'update',
      actorId,
      newData: settingsObj,
      reason: 'Updated marketing global settings'
    });

    return this.getSettings();
  }

  // ==========================================================================
  // 12. PUBLIC MARKETPLACE INTEGRATION APIS
  // ==========================================================================
  async getMarketplaceBanners(placement = 'hero') {
    const { rows } = await pool.query(`
      SELECT id, name, title, subtitle, banner_type AS placement,
             desktop_image_url AS image_desktop_url,
             tablet_image_url AS image_tablet_url,
             mobile_image_url AS image_mobile_url,
             cta_text, cta_url AS cta_link, display_priority AS priority
      FROM homepage_banners
      WHERE status = 'published' 
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date > NOW())
        AND (banner_type = $1 OR $1 = 'all')
      ORDER BY display_priority DESC, created_at DESC
    `, [placement]);
    return rows;
  }

  async getMarketplaceSections() {
    const { rows: sections } = await pool.query(`
      SELECT id, title, subtitle, section_type,
             display_layout AS layout,
             grid_columns AS columns_count,
             display_count AS max_items_count
      FROM promotional_sections
      WHERE is_active = true
      ORDER BY sort_order DESC, created_at DESC
    `);

    for (const sec of sections) {
      const itemsRes = await pool.query(`
        SELECT psi.*,
          psi.position AS priority,
          dp.title AS product_title, dp.slug AS product_slug, dp.price_personal_cents,
          srv.title AS service_title, srv.slug AS service_slug, srv.starting_price_cents,
          cat.name AS category_name, cat.slug AS category_slug
        FROM promotional_section_items psi
        LEFT JOIN digital_products dp ON (psi.item_type = 'product' AND psi.item_id = dp.id)
        LEFT JOIN services srv ON (psi.item_type = 'service' AND psi.item_id = srv.id)
        LEFT JOIN listing_categories cat ON (psi.item_type = 'category' AND psi.item_id = cat.id)
        WHERE psi.section_id = $1
        ORDER BY psi.position DESC
        LIMIT $2
      `, [sec.id, sec.max_items_count || 8]);
      sec.items = itemsRes.rows;
    }

    return sections;
  }

  async getMarketplaceFeaturedProducts(placement = 'homepage_hero') {
    const { rows } = await pool.query(`
      SELECT fp.id AS featured_id, fp.priority, fp.placement,
        dp.id, dp.title, dp.slug, dp.price_personal_cents, dp.price_commercial_cents,
        dp.seller_id, u.first_name AS seller_first_name, u.last_name AS seller_last_name
      FROM featured_products fp
      JOIN digital_products dp ON fp.product_id = dp.id
      JOIN users u ON dp.seller_id = u.id
      WHERE fp.is_active = true
        AND (fp.start_date IS NULL OR fp.start_date <= NOW())
        AND (fp.end_date IS NULL OR fp.end_date > NOW())
        AND (fp.placement = $1 OR $1 = 'all')
      ORDER BY fp.priority DESC
      LIMIT 12
    `, [placement]);
    return rows;
  }

  async getMarketplaceFeaturedServices(placement = 'homepage_hero') {
    const { rows } = await pool.query(`
      SELECT fs.id AS featured_id, fs.priority, fs.placement,
        s.id, s.title, s.slug, s.starting_price_cents,
        s.seller_id, u.first_name AS seller_first_name, u.last_name AS seller_last_name
      FROM featured_services fs
      JOIN services s ON fs.service_id = s.id
      JOIN users u ON s.seller_id = u.id
      WHERE fs.is_active = true
        AND (fs.start_date IS NULL OR fs.start_date <= NOW())
        AND (fs.end_date IS NULL OR fs.end_date > NOW())
        AND (fs.placement = $1 OR $1 = 'all')
      ORDER BY fs.priority DESC
      LIMIT 12
    `, [placement]);
    return rows;
  }

  async trackAffiliateClick({ affiliateCode, landingPage = '/', referrerUrl = '', ipAddress = '127.0.0.1', userAgent = '' }) {
    const { rows } = await pool.query(
      `SELECT id, status FROM affiliates WHERE UPPER(affiliate_code) = UPPER($1)`,
      [affiliateCode]
    );
    if (rows.length === 0 || rows[0].status !== 'approved') return { tracked: false };

    const affId = rows[0].id;
    await pool.query(`
      INSERT INTO affiliate_clicks (affiliate_id, ip_address, landing_page, referrer_url, user_agent)
      VALUES ($1, $2, $3, $4, $5);
    `, [affId, ipAddress, landingPage, referrerUrl, userAgent]);

    await pool.query(`
      UPDATE affiliates SET total_clicks = total_clicks + 1 WHERE id = $1;
    `, [affId]);

    return { tracked: true, affiliate_id: affId };
  }
}

module.exports = new MarketingPromotionsService();
