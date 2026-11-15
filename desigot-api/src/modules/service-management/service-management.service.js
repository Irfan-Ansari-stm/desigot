'use strict';
const { query } = require('../../db/pool');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../shared/errors/AppError');
const logger = require('../../config/logger');

// Helper for generating slugs
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Audit log helper
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

class ServiceManagementService {
  // ── 1. SERVICE STATS & OVERVIEW ──────────────────────────────────────────
  async getServiceStats() {
    const statsQuery = `
      SELECT
        COUNT(*) AS total_services,
        COUNT(*) FILTER (WHERE status = 'published') AS published_count,
        COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
        COUNT(*) FILTER (WHERE status = 'changes_requested') AS changes_requested_count,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
        COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_count,
        COUNT(*) FILTER (WHERE status = 'archived') AS archived_count,
        COUNT(*) FILTER (WHERE is_featured = true) AS featured_count,
        COALESCE(SUM(total_orders), 0) AS total_orders_sum,
        COALESCE(SUM(total_revenue_cents), 0) AS total_revenue_cents,
        COALESCE(AVG(avg_rating), 5.0) AS overall_avg_rating
      FROM services
      WHERE deleted_at IS NULL
    `;
    const reportsQuery = `
      SELECT COUNT(*) AS total_reports,
             COUNT(*) FILTER (WHERE status = 'new') AS open_reports
      FROM service_reports
    `;
    const requestsQuery = `
      SELECT COUNT(*) AS total_custom_requests,
             COUNT(*) FILTER (WHERE status IN ('new', 'under_review')) AS pending_requests
      FROM service_custom_requests
    `;

    const [statsRes, reportsRes, requestsRes] = await Promise.all([
      query(statsQuery),
      query(reportsQuery),
      query(requestsQuery),
    ]);

    const s = statsRes.rows[0];
    const r = reportsRes.rows[0];
    const cr = requestsRes.rows[0];

    return {
      totalServices: parseInt(s.total_services, 10),
      publishedCount: parseInt(s.published_count, 10),
      pendingCount: parseInt(s.pending_count, 10),
      draftCount: parseInt(s.draft_count, 10),
      changesRequestedCount: parseInt(s.changes_requested_count, 10),
      rejectedCount: parseInt(s.rejected_count, 10),
      suspendedCount: parseInt(s.suspended_count, 10),
      archivedCount: parseInt(s.archived_count, 10),
      featuredCount: parseInt(s.featured_count, 10),
      totalOrders: parseInt(s.total_orders_sum, 10),
      totalRevenueCents: parseInt(s.total_revenue_cents, 10),
      totalRevenueUsd: (parseInt(s.total_revenue_cents, 10) / 100).toFixed(2),
      overallAvgRating: parseFloat(s.overall_avg_rating).toFixed(2),
      totalReports: parseInt(r.total_reports, 10),
      openReports: parseInt(r.open_reports, 10),
      totalCustomRequests: parseInt(cr.total_custom_requests, 10),
      pendingCustomRequests: parseInt(cr.pending_requests, 10),
    };
  }

  // ── 2. LIST SERVICES (PAGINATED & ADVANCED FILTERS) ──────────────────────
  async listServices(filters = {}, user = null) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      categoryId = '',
      sellerId = '',
      isFeatured = '',
      minPrice = '',
      maxPrice = '',
      minRating = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filters;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = ['s.deleted_at IS NULL'];
    const params = [];

    // If caller is seller (and not admin), restrict to their own services
    const isSuperAdmin = user?.is_super_admin || user?.role === 'superadmin';
    const hasAdminAccess = isSuperAdmin || user?.permissions?.includes('services.read') || user?.permissions?.includes('*');

    if (!hasAdminAccess && user?.id) {
      params.push(user.id);
      conditions.push(`s.seller_id = $${params.length}`);
    } else if (sellerId) {
      params.push(sellerId);
      conditions.push(`s.seller_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const pIdx = params.length;
      conditions.push(`(s.title ILIKE $${pIdx} OR s.description ILIKE $${pIdx} OR u.display_name ILIKE $${pIdx} OR u.email ILIKE $${pIdx} OR s.id::text ILIKE $${pIdx})`);
    }

    if (status) {
      params.push(status);
      conditions.push(`s.status = $${params.length}`);
    }

    if (categoryId) {
      params.push(categoryId);
      conditions.push(`s.category_id = $${params.length}`);
    }

    if (isFeatured !== '' && isFeatured !== undefined) {
      params.push(isFeatured === 'true' || isFeatured === true);
      conditions.push(`s.is_featured = $${params.length}`);
    }

    if (minPrice) {
      params.push(parseInt(minPrice, 10));
      conditions.push(`s.starting_price_cents >= $${params.length}`);
    }

    if (maxPrice) {
      params.push(parseInt(maxPrice, 10));
      conditions.push(`s.starting_price_cents <= $${params.length}`);
    }

    if (minRating) {
      params.push(parseFloat(minRating));
      conditions.push(`s.avg_rating >= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Allowed sort columns to prevent SQL injection
    const allowedSort = {
      created_at: 's.created_at',
      updated_at: 's.updated_at',
      title: 's.title',
      starting_price_cents: 's.starting_price_cents',
      total_orders: 's.total_orders',
      total_revenue_cents: 's.total_revenue_cents',
      avg_rating: 's.avg_rating',
      status: 's.status',
    };
    const sortCol = allowedSort[sortBy] || 's.created_at';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(*)
      FROM services s
      JOIN users u ON u.id = s.seller_id
      LEFT JOIN listing_categories c ON c.id = s.category_id
      ${whereClause}
    `;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listSql = `
      SELECT
        s.id,
        s.listing_id,
        s.seller_id,
        s.category_id,
        s.title,
        s.slug,
        s.short_description,
        s.status,
        s.is_featured,
        s.featured_priority,
        s.featured_until,
        s.starting_price_cents,
        s.currency,
        s.delivery_time_days,
        s.revision_limit,
        s.total_orders,
        s.total_revenue_cents,
        s.avg_rating,
        s.review_count,
        s.view_count,
        s.inquiry_count,
        s.created_at,
        s.updated_at,
        s.approved_at,
        s.published_at,
        -- Seller details
        u.display_name AS seller_name,
        u.email AS seller_email,
        u.avatar_url AS seller_avatar,
        u.seller_verified AS seller_verified,
        -- Category details
        c.name AS category_name,
        c.slug AS category_slug,
        -- Primary Thumbnail
        (SELECT file_url FROM service_media WHERE service_id = s.id AND is_primary = true LIMIT 1) AS thumbnail_url,
        -- Package count
        (SELECT COUNT(*) FROM service_packages WHERE service_id = s.id) AS package_count
      FROM services s
      JOIN users u ON u.id = s.seller_id
      LEFT JOIN listing_categories c ON c.id = s.category_id
      ${whereClause}
      ORDER BY ${sortCol} ${orderDir}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, params);

    return {
      services: listRes.rows.map((row) => ({
        ...row,
        starting_price_usd: (row.starting_price_cents / 100).toFixed(2),
        total_revenue_usd: (row.total_revenue_cents / 100).toFixed(2),
        package_count: parseInt(row.package_count || 0, 10),
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  // ── 3. GET SERVICE BY ID OR SLUG WITH ALL RELATIONS ──────────────────────
  async getServiceById(idOrSlug, user = null) {
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(idOrSlug);
    const condition = isUuid ? 's.id = $1' : 's.slug = $1';

    const sql = `
      SELECT
        s.*,
        u.id AS seller_user_id,
        u.display_name AS seller_name,
        u.email AS seller_email,
        u.avatar_url AS seller_avatar,
        u.seller_verified,
        COALESCE(u.avg_seller_rating, 5.0) AS seller_rating,
        COALESCE(u.seller_review_count, 0) AS seller_total_reviews,
        u.response_rate,
        u.total_sales,
        c.name AS category_name,
        c.slug AS category_slug,
        c.icon_name AS category_icon
      FROM services s
      JOIN users u ON u.id = s.seller_id
      LEFT JOIN listing_categories c ON c.id = s.category_id
      WHERE ${condition} AND s.deleted_at IS NULL
    `;
    const res = await query(sql, [idOrSlug]);
    if (!res.rows.length) throw new NotFoundError('Service not found');

    const service = res.rows[0];

    // Check authorization: if draft/rejected/suspended, only seller or admin can view
    const isSuperAdmin = user?.is_super_admin || user?.role === 'superadmin';
    const hasAdminAccess = isSuperAdmin || user?.permissions?.includes('services.read') || user?.permissions?.includes('*');
    const isOwner = user?.id === service.seller_id;

    if (service.status !== 'published' && !hasAdminAccess && !isOwner) {
      throw new ForbiddenError('You do not have permission to view this non-published service');
    }

    // Load related data in parallel
    const [mediaRes, packagesRes, addonsRes, tagsRes, attrRes, modHistoryRes, availabilityRes] = await Promise.all([
      query(`SELECT * FROM service_media WHERE service_id = $1 ORDER BY display_order ASC, created_at ASC`, [service.id]),
      query(`SELECT * FROM service_packages WHERE service_id = $1 ORDER BY display_order ASC`, [service.id]),
      query(`SELECT * FROM service_addons WHERE service_id = $1 ORDER BY price_cents ASC`, [service.id]),
      query(`
        SELECT t.id, t.name, t.slug
        FROM service_tags t
        JOIN service_tag_assignments a ON a.tag_id = t.id
        WHERE a.service_id = $1
      `, [service.id]),
      query(`
        SELECT v.id AS value_id, v.attribute_id, v.option_id, v.custom_value,
               a.name AS attribute_name, a.input_type,
               o.label AS option_label, o.value AS option_value
        FROM service_attribute_values v
        JOIN service_attributes a ON a.id = v.attribute_id
        LEFT JOIN service_attribute_options o ON o.id = v.option_id
        WHERE v.service_id = $1
      `, [service.id]),
      query(`
        SELECT h.*, u.display_name AS moderator_name, u.avatar_url AS moderator_avatar
        FROM service_moderation_history h
        LEFT JOIN users u ON u.id = h.moderator_id
        WHERE h.service_id = $1
        ORDER BY h.created_at DESC
      `, [service.id]),
      query(`SELECT * FROM service_availability WHERE seller_id = $1`, [service.seller_id]),
    ]);

    // Attach features to packages
    const pkgIds = packagesRes.rows.map((p) => p.id);
    let featuresByPkg = {};
    if (pkgIds.length) {
      const featRes = await query(
        `SELECT * FROM service_package_features WHERE package_id = ANY($1) ORDER BY display_order ASC`,
        [pkgIds]
      );
      featRes.rows.forEach((f) => {
        if (!featuresByPkg[f.package_id]) featuresByPkg[f.package_id] = [];
        featuresByPkg[f.package_id].push(f);
      });
    }

    const packagesWithFeatures = packagesRes.rows.map((pkg) => ({
      ...pkg,
      price_usd: (pkg.price_cents / 100).toFixed(2),
      express_price_usd: pkg.express_price_cents ? (pkg.express_price_cents / 100).toFixed(2) : null,
      features: featuresByPkg[pkg.id] || [],
    }));

    // Increment view count if public call
    if (!user || (!hasAdminAccess && !isOwner)) {
      query(`UPDATE services SET view_count = view_count + 1 WHERE id = $1`, [service.id]).catch(() => {});
    }

    return {
      ...service,
      starting_price_usd: (service.starting_price_cents / 100).toFixed(2),
      total_revenue_usd: (service.total_revenue_cents / 100).toFixed(2),
      media: mediaRes.rows,
      packages: packagesWithFeatures,
      addons: addonsRes.rows.map((a) => ({ ...a, price_usd: (a.price_cents / 100).toFixed(2) })),
      tags: tagsRes.rows,
      attributes: attrRes.rows,
      moderation_history: modHistoryRes.rows,
      availability: availabilityRes.rows[0] || null,
    };
  }

  // ── 4. CREATE SERVICE (MULTI-STEP WIZARD SUPPORT) ────────────────────────
  async createService(data, user, req = {}) {
    const sellerId = data.seller_id || user.id;
    if (!sellerId) throw new BadRequestError('Seller ID required');

    const title = data.title?.trim();
    if (!title || title.length < 5) throw new BadRequestError('Title must be at least 5 characters');

    // Generate unique slug
    let baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let counter = 1;
    while (true) {
      const check = await query(`SELECT id FROM services WHERE slug = $1`, [finalSlug]);
      if (!check.rows.length) break;
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const categoryId = data.category_id;
    if (!categoryId) throw new BadRequestError('Category ID is required');

    const initialStatus = data.status || 'draft';
    const startingPriceCents = parseInt(data.starting_price_cents || 0, 10);
    const deliveryDays = parseInt(data.delivery_time_days || 3, 10);
    const revisionLimit = parseInt(data.revision_limit || 2, 10);

    // Insert into services table
    const insertSql = `
      INSERT INTO services (
        seller_id, category_id, title, slug, short_description, description,
        target_audience, language, status, starting_price_cents, currency,
        delivery_time_days, revision_limit, what_is_included, what_is_not_included,
        deliverables, customer_requirements, design_process, faqs, seo_title,
        seo_description, seo_keywords
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22
      )
      RETURNING *
    `;

    const serviceRes = await query(insertSql, [
      sellerId,
      categoryId,
      title,
      finalSlug,
      data.short_description || null,
      data.description || 'Full professional service description.',
      data.target_audience || 'All businesses',
      data.language || 'English',
      initialStatus,
      startingPriceCents,
      data.currency || 'USD',
      deliveryDays,
      revisionLimit,
      data.what_is_included || [],
      data.what_is_not_included || [],
      data.deliverables || [],
      data.customer_requirements || null,
      JSON.stringify(data.design_process || []),
      JSON.stringify(data.faqs || []),
      data.seo_title || title,
      data.seo_description || data.short_description || null,
      data.seo_keywords || [],
    ]);

    const createdService = serviceRes.rows[0];

    // Create synchronized listing in `listings` table for global unity
    try {
      const listingRes = await query(
        `INSERT INTO listings (
          seller_id, category_id, listing_type, title, slug, description,
          price_personal, price_commercial, currency, status, published_at
         ) VALUES ($1, $2, 'service', $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          sellerId,
          categoryId,
          title,
          finalSlug,
          data.description || 'Full professional service description.',
          startingPriceCents,
          startingPriceCents * 2,
          'USD',
          initialStatus === 'published' ? 'active' : 'draft',
          initialStatus === 'published' ? new Date() : null,
        ]
      );
      if (listingRes.rows[0]) {
        await query(`UPDATE services SET listing_id = $1 WHERE id = $2`, [listingRes.rows[0].id, createdService.id]);
        createdService.listing_id = listingRes.rows[0].id;
      }
    } catch (err) {
      logger.warn('Listing sync during service creation non-fatal error:', { err: err.message });
    }

    // Save Media
    if (data.media && Array.isArray(data.media)) {
      for (let i = 0; i < data.media.length; i++) {
        const m = data.media[i];
        if (m.file_url) {
          await query(
            `INSERT INTO service_media (service_id, media_type, file_url, thumbnail_url, caption, display_order, is_primary)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              createdService.id,
              m.media_type || 'gallery_image',
              m.file_url,
              m.thumbnail_url || m.file_url,
              m.caption || null,
              i,
              m.is_primary ?? i === 0,
            ]
          );
        }
      }
    }

    // Save Packages
    if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
      for (let i = 0; i < data.packages.length; i++) {
        const pkg = data.packages[i];
        const pkgRes = await query(
          `INSERT INTO service_packages (
            service_id, package_type, name, description, price_cents, delivery_days, revisions, express_delivery_days, express_price_cents, display_order
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            createdService.id,
            pkg.package_type || 'basic',
            pkg.name || 'Basic Package',
            pkg.description || 'Basic deliverables',
            parseInt(pkg.price_cents || startingPriceCents || 1000, 10),
            parseInt(pkg.delivery_days || deliveryDays, 10),
            parseInt(pkg.revisions || revisionLimit, 10),
            pkg.express_delivery_days ? parseInt(pkg.express_delivery_days, 10) : null,
            pkg.express_price_cents ? parseInt(pkg.express_price_cents, 10) : null,
            i,
          ]
        );

        if (pkg.features && Array.isArray(pkg.features)) {
          for (let fIdx = 0; fIdx < pkg.features.length; fIdx++) {
            const f = pkg.features[fIdx];
            await query(
              `INSERT INTO service_package_features (package_id, feature_name, is_included, value_text, display_order)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                pkgRes.rows[0].id,
                typeof f === 'string' ? f : f.feature_name || 'Feature',
                f.is_included !== undefined ? f.is_included : true,
                f.value_text || null,
                fIdx,
              ]
            );
          }
        }
      }
    } else {
      // Default Basic Package
      const defPkg = await query(
        `INSERT INTO service_packages (service_id, package_type, name, description, price_cents, delivery_days, revisions, display_order)
         VALUES ($1, 'basic', 'Standard Package', 'Complete design deliverables', $2, $3, $4, 0)
         RETURNING id`,
        [createdService.id, startingPriceCents || 5000, deliveryDays, revisionLimit]
      );
      await query(
        `INSERT INTO service_package_features (package_id, feature_name, is_included, display_order)
         VALUES ($1, 'Source Files Included', true, 0), ($1, 'Commercial Use', true, 1)`,
        [defPkg.rows[0].id]
      );
    }

    // Save Add-ons
    if (data.addons && Array.isArray(data.addons)) {
      for (const a of data.addons) {
        if (a.name && a.price_cents !== undefined) {
          await query(
            `INSERT INTO service_addons (service_id, name, description, price_cents, delivery_days_added)
             VALUES ($1, $2, $3, $4, $5)`,
            [createdService.id, a.name, a.description || null, parseInt(a.price_cents, 10), parseInt(a.delivery_days_added || 0, 10)]
          );
        }
      }
    }

    // Save Tags
    if (data.tag_ids && Array.isArray(data.tag_ids)) {
      for (const tId of data.tag_ids) {
        await query(
          `INSERT INTO service_tag_assignments (service_id, tag_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [createdService.id, tId]
        );
        await query(`UPDATE service_tags SET usage_count = usage_count + 1 WHERE id = $1`, [tId]);
      }
    }

    // Save Attributes
    if (data.attribute_values && Array.isArray(data.attribute_values)) {
      for (const av of data.attribute_values) {
        if (av.attribute_id) {
          await query(
            `INSERT INTO service_attribute_values (service_id, attribute_id, option_id, custom_value)
             VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
            [createdService.id, av.attribute_id, av.option_id || null, av.custom_value || null]
          );
        }
      }
    }

    // Record moderation initial log
    await query(
      `INSERT INTO service_moderation_history (service_id, moderator_id, action, internal_notes)
       VALUES ($1, $2, 'created', 'Service created initial draft')`,
      [createdService.id, user.id]
    );

    // Audit log
    await recordAudit(user.id, 'service.create', 'services', createdService.id, null, createdService, req);

    return this.getServiceById(createdService.id, user);
  }

  // ── 5. UPDATE SERVICE ────────────────────────────────────────────────────
  async updateService(id, data, user, req = {}) {
    const existing = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!existing.rows.length) throw new NotFoundError('Service not found');
    const prev = existing.rows[0];

    const isSuperAdmin = user.is_super_admin || user.role === 'superadmin';
    const hasAdminAccess = isSuperAdmin || user.permissions?.includes('services.update') || user.permissions?.includes('*');
    const isOwner = user.id === prev.seller_id;

    if (!hasAdminAccess && !isOwner) {
      throw new ForbiddenError('You do not have permission to update this service');
    }

    // If owner is updating an approved/published service, non-admin updates may revert to pending_approval if required by policy
    const fields = [];
    const params = [id];

    const updatable = [
      'title', 'short_description', 'description', 'target_audience', 'language',
      'category_id', 'starting_price_cents', 'currency', 'delivery_time_days',
      'revision_limit', 'what_is_included', 'what_is_not_included', 'deliverables',
      'customer_requirements', 'design_process', 'faqs', 'seo_title', 'seo_description', 'seo_keywords'
    ];

    updatable.forEach((field) => {
      if (data[field] !== undefined) {
        params.push(
          field === 'design_process' || field === 'faqs'
            ? JSON.stringify(data[field])
            : data[field]
        );
        fields.push(`${field} = $${params.length}`);
      }
    });

    fields.push(`updated_at = NOW()`);

    const updateSql = `
      UPDATE services
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    const res = await query(updateSql, params);
    const updated = res.rows[0];

    // Synchronize title, description, price with `listings`
    if (updated.listing_id) {
      await query(
        `UPDATE listings
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             price_personal = COALESCE($3, price_personal),
             category_id = COALESCE($4, category_id),
             updated_at = NOW()
         WHERE id = $5`,
        [data.title, data.description, data.starting_price_cents, data.category_id, updated.listing_id]
      ).catch(() => {});
    }

    // Update Packages if provided
    if (data.packages && Array.isArray(data.packages)) {
      await query(`DELETE FROM service_packages WHERE service_id = $1`, [id]);
      for (let i = 0; i < data.packages.length; i++) {
        const pkg = data.packages[i];
        const pkgRes = await query(
          `INSERT INTO service_packages (
            service_id, package_type, name, description, price_cents, delivery_days, revisions, express_delivery_days, express_price_cents, display_order
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            id,
            pkg.package_type || 'basic',
            pkg.name || 'Package',
            pkg.description || '',
            parseInt(pkg.price_cents || updated.starting_price_cents, 10),
            parseInt(pkg.delivery_days || updated.delivery_time_days, 10),
            parseInt(pkg.revisions || updated.revision_limit, 10),
            pkg.express_delivery_days ? parseInt(pkg.express_delivery_days, 10) : null,
            pkg.express_price_cents ? parseInt(pkg.express_price_cents, 10) : null,
            i,
          ]
        );
        if (pkg.features && Array.isArray(pkg.features)) {
          for (let fIdx = 0; fIdx < pkg.features.length; fIdx++) {
            const f = pkg.features[fIdx];
            await query(
              `INSERT INTO service_package_features (package_id, feature_name, is_included, value_text, display_order)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                pkgRes.rows[0].id,
                typeof f === 'string' ? f : f.feature_name || 'Feature',
                f.is_included !== undefined ? f.is_included : true,
                f.value_text || null,
                fIdx,
              ]
            );
          }
        }
      }
    }

    // Update Media if provided
    if (data.media && Array.isArray(data.media)) {
      await query(`DELETE FROM service_media WHERE service_id = $1`, [id]);
      for (let i = 0; i < data.media.length; i++) {
        const m = data.media[i];
        if (m.file_url) {
          await query(
            `INSERT INTO service_media (service_id, media_type, file_url, thumbnail_url, caption, display_order, is_primary)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, m.media_type || 'gallery_image', m.file_url, m.thumbnail_url || m.file_url, m.caption || null, i, m.is_primary ?? i === 0]
          );
        }
      }
    }

    // Update Add-ons if provided
    if (data.addons && Array.isArray(data.addons)) {
      await query(`DELETE FROM service_addons WHERE service_id = $1`, [id]);
      for (const a of data.addons) {
        if (a.name && a.price_cents !== undefined) {
          await query(
            `INSERT INTO service_addons (service_id, name, description, price_cents, delivery_days_added)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, a.name, a.description || null, parseInt(a.price_cents, 10), parseInt(a.delivery_days_added || 0, 10)]
          );
        }
      }
    }

    // Update Tags if provided
    if (data.tag_ids && Array.isArray(data.tag_ids)) {
      await query(`DELETE FROM service_tag_assignments WHERE service_id = $1`, [id]);
      for (const tId of data.tag_ids) {
        await query(
          `INSERT INTO service_tag_assignments (service_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, tId]
        );
      }
    }

    // Audit log
    await recordAudit(user.id, 'service.update', 'services', id, prev, updated, req);

    return this.getServiceById(id, user);
  }

  // ── 6. DUPLICATE SERVICE ─────────────────────────────────────────────────
  async duplicateService(id, user, req = {}) {
    const orig = await this.getServiceById(id, user);
    const newTitle = `Copy of ${orig.title}`.slice(0, 195);
    const baseSlug = slugify(newTitle);
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const res = await query(
      `INSERT INTO services (
        seller_id, category_id, title, slug, short_description, description,
        target_audience, language, status, starting_price_cents, currency,
        delivery_time_days, revision_limit, what_is_included, what_is_not_included,
        deliverables, customer_requirements, design_process, faqs, seo_title,
        seo_description, seo_keywords
       ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, 'draft', $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21
       ) RETURNING id`,
      [
        user.id, // Assigned to current user or can keep orig.seller_id
        orig.category_id,
        newTitle,
        uniqueSlug,
        orig.short_description,
        orig.description,
        orig.target_audience,
        orig.language,
        orig.starting_price_cents,
        orig.currency,
        orig.delivery_time_days,
        orig.revision_limit,
        orig.what_is_included,
        orig.what_is_not_included,
        orig.deliverables,
        orig.customer_requirements,
        JSON.stringify(orig.design_process || []),
        JSON.stringify(orig.faqs || []),
        `Copy of ${orig.seo_title || orig.title}`.slice(0, 150),
        orig.seo_description,
        orig.seo_keywords,
      ]
    );

    const newId = res.rows[0].id;

    // Duplicate media
    if (orig.media?.length) {
      for (const m of orig.media) {
        await query(
          `INSERT INTO service_media (service_id, media_type, file_url, thumbnail_url, caption, display_order, is_primary)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [newId, m.media_type, m.file_url, m.thumbnail_url, m.caption, m.display_order, m.is_primary]
        );
      }
    }

    // Duplicate packages & features
    if (orig.packages?.length) {
      for (const p of orig.packages) {
        const pRes = await query(
          `INSERT INTO service_packages (service_id, package_type, name, description, price_cents, delivery_days, revisions, express_delivery_days, express_price_cents, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [newId, p.package_type, p.name, p.description, p.price_cents, p.delivery_days, p.revisions, p.express_delivery_days, p.express_price_cents, p.display_order]
        );
        if (p.features?.length) {
          for (const f of p.features) {
            await query(
              `INSERT INTO service_package_features (package_id, feature_name, is_included, value_text, display_order)
               VALUES ($1, $2, $3, $4, $5)`,
              [pRes.rows[0].id, f.feature_name, f.is_included, f.value_text, f.display_order]
            );
          }
        }
      }
    }

    // Duplicate addons
    if (orig.addons?.length) {
      for (const a of orig.addons) {
        await query(
          `INSERT INTO service_addons (service_id, name, description, price_cents, delivery_days_added)
           VALUES ($1, $2, $3, $4, $5)`,
          [newId, a.name, a.description, a.price_cents, a.delivery_days_added]
        );
      }
    }

    // Duplicate tags
    if (orig.tags?.length) {
      for (const t of orig.tags) {
        await query(
          `INSERT INTO service_tag_assignments (service_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newId, t.id]
        );
      }
    }

    await recordAudit(user.id, 'service.duplicate', 'services', newId, { source_id: id }, { new_id: newId }, req);

    return this.getServiceById(newId, user);
  }

  // ── 7. DELETE SERVICE ────────────────────────────────────────────────────
  async deleteService(id, user, req = {}) {
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!s.rows.length) throw new NotFoundError('Service not found');
    const service = s.rows[0];

    const isSuperAdmin = user.is_super_admin || user.role === 'superadmin';
    const hasAdminAccess = isSuperAdmin || user.permissions?.includes('services.delete') || user.permissions?.includes('*');
    const isOwner = user.id === service.seller_id;

    if (!hasAdminAccess && !isOwner) {
      throw new ForbiddenError('You do not have permission to delete this service');
    }

    // If draft, can hard delete or soft delete. We soft-delete for audit trail.
    await query(`UPDATE services SET deleted_at = NOW(), status = 'archived' WHERE id = $1`, [id]);

    // Unpublish from listings if synchronized
    if (service.listing_id) {
      await query(`UPDATE listings SET status = 'deleted', deleted_at = NOW() WHERE id = $1`, [service.listing_id]).catch(() => {});
    }

    await recordAudit(user.id, 'service.delete', 'services', id, service, { status: 'archived', deleted_at: new Date() }, req);

    return { success: true, message: 'Service successfully deleted' };
  }

  // ── 8. LIFECYCLE & MODERATION STATE TRANSITIONS ─────────────────────────
  async submitService(id, user, req = {}) {
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!s.rows.length) throw new NotFoundError('Service not found');
    const service = s.rows[0];

    if (!['draft', 'changes_requested'].includes(service.status)) {
      throw new BadRequestError(`Cannot submit service currently in '${service.status}' status`);
    }

    await query(`UPDATE services SET status = 'pending_approval', updated_at = NOW() WHERE id = $1`, [id]);
    await query(
      `INSERT INTO service_moderation_history (service_id, moderator_id, action, internal_notes)
       VALUES ($1, $2, 'submitted', 'Seller submitted service for review')`,
      [id, user.id]
    );

    await recordAudit(user.id, 'service.submit', 'services', id, { status: service.status }, { status: 'pending_approval' }, req);
    return this.getServiceById(id, user);
  }

  async approveService(id, user, notes = '', autoPublish = true, req = {}) {
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!s.rows.length) throw new NotFoundError('Service not found');
    const service = s.rows[0];

    const newStatus = autoPublish ? 'published' : 'approved';
    const publishedAt = autoPublish ? new Date() : null;

    await query(
      `UPDATE services
       SET status = $1, approved_at = NOW(), published_at = COALESCE($2, published_at), rejection_reason = NULL, updated_at = NOW()
       WHERE id = $3`,
      [newStatus, publishedAt, id]
    );

    // Sync listing
    if (service.listing_id) {
      await query(
        `UPDATE listings SET status = $1, published_at = COALESCE($2, published_at), updated_at = NOW() WHERE id = $3`,
        [autoPublish ? 'active' : 'inactive', publishedAt, service.listing_id]
      ).catch(() => {});
    }

    await query(
      `INSERT INTO service_moderation_history (service_id, moderator_id, action, internal_notes)
       VALUES ($1, $2, 'approved', $3)`,
      [id, user.id, notes || (autoPublish ? 'Service approved and published' : 'Service approved')]
    );

    await recordAudit(user.id, 'service.approve', 'services', id, { status: service.status }, { status: newStatus }, req);
    return this.getServiceById(id, user);
  }

  async rejectService(id, user, reason, notes = '', req = {}) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestError('A specific rejection reason (min 5 chars) is required');
    }
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!s.rows.length) throw new NotFoundError('Service not found');
    const service = s.rows[0];

    await query(
      `UPDATE services SET status = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
      [reason, id]
    );

    if (service.listing_id) {
      await query(`UPDATE listings SET status = 'inactive', updated_at = NOW() WHERE id = $1`, [service.listing_id]).catch(() => {});
    }

    await query(
      `INSERT INTO service_moderation_history (service_id, moderator_id, action, reason, internal_notes)
       VALUES ($1, $2, 'rejected', $3, $4)`,
      [id, user.id, reason, notes || null]
    );

    await recordAudit(user.id, 'service.reject', 'services', id, { status: service.status }, { status: 'rejected', reason }, req);
    return this.getServiceById(id, user);
  }

  async requestChanges(id, user, feedback, notes = '', req = {}) {
    if (!feedback || feedback.trim().length < 5) {
      throw new BadRequestError('Revision feedback description is required');
    }
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!s.rows.length) throw new NotFoundError('Service not found');
    const service = s.rows[0];

    await query(
      `UPDATE services SET status = 'changes_requested', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
      [feedback, id]
    );

    await query(
      `INSERT INTO service_moderation_history (service_id, moderator_id, action, reason, internal_notes)
       VALUES ($1, $2, 'changes_requested', $3, $4)`,
      [id, user.id, feedback, notes || null]
    );

    await recordAudit(user.id, 'service.request_changes', 'services', id, { status: service.status }, { status: 'changes_requested', feedback }, req);
    return this.getServiceById(id, user);
  }

  async publishService(id, user, req = {}) {
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!s.rows.length) throw new NotFoundError('Service not found');
    const service = s.rows[0];

    await query(
      `UPDATE services SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW() WHERE id = $1`,
      [id]
    );

    if (service.listing_id) {
      await query(
        `UPDATE listings SET status = 'active', published_at = COALESCE(published_at, NOW()), updated_at = NOW() WHERE id = $1`,
        [service.listing_id]
      ).catch(() => {});
    }

    await query(
      `INSERT INTO service_moderation_history (service_id, moderator_id, action, internal_notes)
       VALUES ($1, $2, 'published', 'Service published live to marketplace')`,
      [id, user.id]
    );

    await recordAudit(user.id, 'service.publish', 'services', id, { status: service.status }, { status: 'published' }, req);
    return this.getServiceById(id, user);
  }

  async unpublishService(id, user, reason = '', req = {}) {
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!s.rows.length) throw new NotFoundError('Service not found');
    const service = s.rows[0];

    await query(`UPDATE services SET status = 'approved', updated_at = NOW() WHERE id = $1`, [id]);

    if (service.listing_id) {
      await query(`UPDATE listings SET status = 'inactive', updated_at = NOW() WHERE id = $1`, [service.listing_id]).catch(() => {});
    }

    await query(
      `INSERT INTO service_moderation_history (service_id, moderator_id, action, reason, internal_notes)
       VALUES ($1, $2, 'unpublished', $3, 'Service unpublished from marketplace')`,
      [id, user.id, reason || null]
    );

    await recordAudit(user.id, 'service.unpublish', 'services', id, { status: service.status }, { status: 'approved' }, req);
    return this.getServiceById(id, user);
  }

  async suspendService(id, user, reason, notes = '', req = {}) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestError('Suspension reason (min 5 chars) is mandatory');
    }
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!s.rows.length) throw new NotFoundError('Service not found');
    const service = s.rows[0];

    await query(
      `UPDATE services SET status = 'suspended', suspension_reason = $1, updated_at = NOW() WHERE id = $2`,
      [reason, id]
    );

    if (service.listing_id) {
      await query(`UPDATE listings SET status = 'suspended', updated_at = NOW() WHERE id = $1`, [service.listing_id]).catch(() => {});
    }

    await query(
      `INSERT INTO service_moderation_history (service_id, moderator_id, action, reason, internal_notes)
       VALUES ($1, $2, 'suspended', $3, $4)`,
      [id, user.id, reason, notes || null]
    );

    await recordAudit(user.id, 'service.suspend', 'services', id, { status: service.status }, { status: 'suspended', reason }, req);
    return this.getServiceById(id, user);
  }

  async restoreService(id, user, notes = '', req = {}) {
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!s.rows.length) throw new NotFoundError('Service not found');
    const service = s.rows[0];

    // Restore to approved or published based on whether it had published_at
    const restoredStatus = service.published_at ? 'published' : 'approved';

    await query(
      `UPDATE services SET status = $1, suspension_reason = NULL, updated_at = NOW() WHERE id = $2`,
      [restoredStatus, id]
    );

    if (service.listing_id) {
      await query(
        `UPDATE listings SET status = $1, updated_at = NOW() WHERE id = $2`,
        [restoredStatus === 'published' ? 'active' : 'inactive', service.listing_id]
      ).catch(() => {});
    }

    await query(
      `INSERT INTO service_moderation_history (service_id, moderator_id, action, internal_notes)
       VALUES ($1, $2, 'restored', $3)`,
      [id, user.id, notes || 'Service restored by administrator']
    );

    await recordAudit(user.id, 'service.restore', 'services', id, { status: service.status }, { status: restoredStatus }, req);
    return this.getServiceById(id, user);
  }

  // ── 9. BULK ACTIONS ──────────────────────────────────────────────────────
  async bulkUpdateStatus(serviceIds = [], action, user, options = {}, req = {}) {
    if (!Array.isArray(serviceIds) || !serviceIds.length) {
      throw new BadRequestError('At least one service ID is required for bulk action');
    }

    const results = { successful: [], failed: [] };

    for (const sid of serviceIds) {
      try {
        switch (action) {
          case 'approve':
            await this.approveService(sid, user, options.notes || 'Bulk approved', options.autoPublish ?? true, req);
            break;
          case 'reject':
            await this.rejectService(sid, user, options.reason || 'Bulk rejected by administrator policy', options.notes || '', req);
            break;
          case 'suspend':
            await this.suspendService(sid, user, options.reason || 'Bulk administrative suspension', options.notes || '', req);
            break;
          case 'restore':
            await this.restoreService(sid, user, options.notes || 'Bulk restored by administrator', req);
            break;
          case 'feature':
            await this.setFeatured(sid, true, options.priority || 10, options.days || 30, options.placement || 'homepage_hero', user, req);
            break;
          case 'unfeature':
            await this.setFeatured(sid, false, 0, null, null, user, req);
            break;
          case 'delete':
            await this.deleteService(sid, user, req);
            break;
          default:
            throw new BadRequestError(`Unsupported bulk action: ${action}`);
        }
        results.successful.push(sid);
      } catch (err) {
        results.failed.push({ id: sid, error: err.message });
      }
    }

    return results;
  }

  // ── 10. FEATURED SERVICES MANAGEMENT ─────────────────────────────────────
  async listFeaturedServices(params = {}) {
    const sql = `
      SELECT
        f.id AS campaign_id,
        f.service_id,
        f.priority,
        f.placement,
        f.start_date,
        f.end_date,
        f.is_active,
        f.impressions_count,
        f.clicks_count,
        f.orders_count,
        f.revenue_cents,
        s.title AS service_title,
        s.slug AS service_slug,
        s.starting_price_cents,
        s.avg_rating,
        s.status AS service_status,
        u.display_name AS seller_name,
        u.avatar_url AS seller_avatar,
        (SELECT file_url FROM service_media WHERE service_id = s.id AND is_primary = true LIMIT 1) AS thumbnail_url
      FROM service_featured_listings f
      JOIN services s ON s.id = f.service_id
      JOIN users u ON u.id = s.seller_id
      WHERE s.deleted_at IS NULL
      ORDER BY f.is_active DESC, f.priority DESC, f.end_date DESC
    `;
    const res = await query(sql);
    return res.rows.map((row) => ({
      ...row,
      starting_price_usd: (row.starting_price_cents / 100).toFixed(2),
      revenue_usd: (row.revenue_cents / 100).toFixed(2),
      ctr: row.impressions_count > 0 ? ((row.clicks_count / row.impressions_count) * 100).toFixed(2) + '%' : '0.00%',
    }));
  }

  async setFeatured(serviceId, isFeatured, priority = 10, durationDays = 30, placement = 'homepage_hero', user = null, req = {}) {
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [serviceId]);
    if (!s.rows.length) throw new NotFoundError('Service not found');

    const until = isFeatured ? new Date(Date.now() + (parseInt(durationDays, 10) || 30) * 86400000) : null;

    await query(
      `UPDATE services
       SET is_featured = $1, featured_priority = $2, featured_until = $3, updated_at = NOW()
       WHERE id = $4`,
      [isFeatured, isFeatured ? priority : 0, until, serviceId]
    );

    if (isFeatured) {
      await query(
        `INSERT INTO service_featured_listings (service_id, priority, placement, start_date, end_date, is_active, created_by_id)
         VALUES ($1, $2, $3, NOW(), $4, TRUE, $5)`,
        [serviceId, priority, placement, until, user?.id || null]
      );
    } else {
      await query(
        `UPDATE service_featured_listings SET is_active = FALSE WHERE service_id = $1`,
        [serviceId]
      );
    }

    if (user) {
      await recordAudit(user.id, isFeatured ? 'service.feature' : 'service.unfeature', 'services', serviceId, null, { is_featured: isFeatured, priority, until }, req);
    }

    return { success: true, serviceId, isFeatured, priority, until };
  }

  // ── 11. CATEGORIES MANAGEMENT ────────────────────────────────────────────
  async listCategories() {
    const sql = `
      SELECT
        c.*,
        p.name AS parent_name,
        (SELECT COUNT(*) FROM services WHERE category_id = c.id AND deleted_at IS NULL) AS service_count,
        (SELECT COUNT(*) FROM listing_categories WHERE parent_id = c.id) AS subcategory_count
      FROM listing_categories c
      LEFT JOIN listing_categories p ON p.id = c.parent_id
      ORDER BY c.parent_id NULLS FIRST, c.sort_order ASC, c.name ASC
    `;
    const res = await query(sql);
    return res.rows.map((row) => ({
      ...row,
      service_count: parseInt(row.service_count || 0, 10),
      subcategory_count: parseInt(row.subcategory_count || 0, 10),
    }));
  }

  async createCategory(data, user, req = {}) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestError('Category name is required');
    const slug = data.slug ? slugify(data.slug) : slugify(name);

    const res = await query(
      `INSERT INTO listing_categories (name, slug, description, parent_id, icon_name, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        slug,
        data.description || null,
        data.parent_id || null,
        data.icon_name || data.icon || 'Sparkles',
        data.sort_order || data.display_order || 0,
        data.is_active ?? true,
      ]
    );

    const created = res.rows[0];
    await recordAudit(user.id, 'category.create', 'listing_categories', created.id, null, created, req);
    return created;
  }

  async updateCategory(id, data, user, req = {}) {
    const cur = await query(`SELECT * FROM listing_categories WHERE id = $1`, [id]);
    if (!cur.rows.length) throw new NotFoundError('Category not found');

    const res = await query(
      `UPDATE listing_categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           parent_id = $4,
           icon_name = COALESCE($5, icon_name),
           sort_order = COALESCE($6, sort_order),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [
        data.name?.trim(),
        data.slug ? slugify(data.slug) : undefined,
        data.description,
        data.parent_id !== undefined ? data.parent_id : cur.rows[0].parent_id,
        data.icon_name || data.icon,
        data.sort_order || data.display_order,
        data.is_active,
        id,
      ]
    );

    const updated = res.rows[0];
    await recordAudit(user.id, 'category.update', 'listing_categories', id, cur.rows[0], updated, req);
    return updated;
  }

  async deleteCategory(id, user, req = {}) {
    const cur = await query(`SELECT * FROM listing_categories WHERE id = $1`, [id]);
    if (!cur.rows.length) throw new NotFoundError('Category not found');

    const sCheck = await query(`SELECT COUNT(*) FROM services WHERE category_id = $1 AND deleted_at IS NULL`, [id]);
    if (parseInt(sCheck.rows[0].count, 10) > 0) {
      throw new BadRequestError('Cannot delete category with associated active services');
    }

    await query(`DELETE FROM listing_categories WHERE id = $1`, [id]);
    await recordAudit(user.id, 'category.delete', 'listing_categories', id, cur.rows[0], null, req);
    return { success: true, message: 'Category deleted successfully' };
  }

  // ── 12. ATTRIBUTES MANAGEMENT ────────────────────────────────────────────
  async listAttributes(categoryId = null) {
    let sql = `
      SELECT
        a.*,
        c.name AS applicable_category_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', o.id,
              'label', o.label,
              'value', o.value,
              'display_order', o.display_order,
              'is_active', o.is_active
            ) ORDER BY o.display_order ASC
          ) FILTER (WHERE o.id IS NOT NULL), '[]'
        ) AS options
      FROM service_attributes a
      LEFT JOIN listing_categories c ON c.id = a.applicable_category_id
      LEFT JOIN service_attribute_options o ON o.attribute_id = a.id
    `;
    const params = [];
    if (categoryId) {
      sql += ` WHERE (a.applicable_category_id = $1 OR a.applicable_category_id IS NULL)`;
      params.push(categoryId);
    }
    sql += ` GROUP BY a.id, c.name ORDER BY a.display_order ASC, a.name ASC`;

    const res = await query(sql, params);
    return res.rows;
  }

  async createAttribute(data, user, req = {}) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestError('Attribute name is required');
    const slug = data.slug ? slugify(data.slug) : slugify(name);

    const res = await query(
      `INSERT INTO service_attributes (name, slug, description, input_type, is_required, is_searchable, is_filterable, is_active, display_order, applicable_category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        slug,
        data.description || null,
        data.input_type || 'select',
        data.is_required ?? false,
        data.is_searchable ?? true,
        data.is_filterable ?? true,
        data.is_active ?? true,
        data.display_order || 0,
        data.applicable_category_id || null,
      ]
    );

    const attr = res.rows[0];

    // If options provided
    if (data.options && Array.isArray(data.options)) {
      for (let i = 0; i < data.options.length; i++) {
        const opt = data.options[i];
        await query(
          `INSERT INTO service_attribute_options (attribute_id, label, value, display_order, is_active)
           VALUES ($1, $2, $3, $4, $5)`,
          [attr.id, opt.label || opt, opt.value || slugify(opt.label || opt), i, opt.is_active ?? true]
        );
      }
    }

    await recordAudit(user.id, 'attribute.create', 'service_attributes', attr.id, null, attr, req);
    return (await this.listAttributes()).find((a) => a.id === attr.id);
  }

  async updateAttribute(id, data, user, req = {}) {
    const cur = await query(`SELECT * FROM service_attributes WHERE id = $1`, [id]);
    if (!cur.rows.length) throw new NotFoundError('Attribute not found');

    await query(
      `UPDATE service_attributes
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           input_type = COALESCE($3, input_type),
           is_required = COALESCE($4, is_required),
           is_searchable = COALESCE($5, is_searchable),
           is_filterable = COALESCE($6, is_filterable),
           is_active = COALESCE($7, is_active),
           display_order = COALESCE($8, display_order),
           applicable_category_id = $9
       WHERE id = $10`,
      [
        data.name?.trim(),
        data.description,
        data.input_type,
        data.is_required,
        data.is_searchable,
        data.is_filterable,
        data.is_active,
        data.display_order,
        data.applicable_category_id !== undefined ? data.applicable_category_id : cur.rows[0].applicable_category_id,
        id,
      ]
    );

    // If options replaced
    if (data.options && Array.isArray(data.options)) {
      await query(`DELETE FROM service_attribute_options WHERE attribute_id = $1`, [id]);
      for (let i = 0; i < data.options.length; i++) {
        const opt = data.options[i];
        await query(
          `INSERT INTO service_attribute_options (attribute_id, label, value, display_order, is_active)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, opt.label || opt, opt.value || slugify(opt.label || opt), i, opt.is_active ?? true]
        );
      }
    }

    await recordAudit(user.id, 'attribute.update', 'service_attributes', id, cur.rows[0], data, req);
    return (await this.listAttributes()).find((a) => a.id === id);
  }

  async deleteAttribute(id, user, req = {}) {
    await query(`DELETE FROM service_attributes WHERE id = $1`, [id]);
    await recordAudit(user.id, 'attribute.delete', 'service_attributes', id, null, null, req);
    return { success: true, message: 'Attribute deleted successfully' };
  }

  // ── 13. TAGS MANAGEMENT ──────────────────────────────────────────────────
  async listTags(search = '', activeOnly = false) {
    let sql = `
      SELECT t.*, (SELECT COUNT(*) FROM service_tag_assignments WHERE tag_id = t.id) AS assigned_count
      FROM service_tags t
    `;
    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(t.name ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
    }

    if (activeOnly) {
      conditions.push(`t.is_active = true`);
    }

    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY t.usage_count DESC, t.name ASC`;
    const res = await query(sql, params);
    return res.rows.map((row) => ({
      ...row,
      assigned_count: parseInt(row.assigned_count || 0, 10),
    }));
  }

  async createTag(data, user, req = {}) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestError('Tag name is required');
    const slug = data.slug ? slugify(data.slug) : slugify(name);

    const res = await query(
      `INSERT INTO service_tags (name, slug, description, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug, data.description || null, data.is_active ?? true]
    );

    const created = res.rows[0];
    await recordAudit(user.id, 'tag.create', 'service_tags', created.id, null, created, req);
    return created;
  }

  async updateTag(id, data, user, req = {}) {
    const cur = await query(`SELECT * FROM service_tags WHERE id = $1`, [id]);
    if (!cur.rows.length) throw new NotFoundError('Tag not found');

    const res = await query(
      `UPDATE service_tags
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [
        data.name?.trim(),
        data.slug ? slugify(data.slug) : undefined,
        data.description,
        data.is_active,
        id,
      ]
    );

    const updated = res.rows[0];
    await recordAudit(user.id, 'tag.update', 'service_tags', id, cur.rows[0], updated, req);
    return updated;
  }

  async deleteTag(id, user, req = {}) {
    await query(`DELETE FROM service_tags WHERE id = $1`, [id]);
    await recordAudit(user.id, 'tag.delete', 'service_tags', id, null, null, req);
    return { success: true, message: 'Tag deleted successfully' };
  }

  // ── 14. SERVICE PACKAGES & ADD-ONS ──────────────────────────────────────
  async listAllPackages(filters = {}) {
    const sql = `
      SELECT
        p.*,
        s.title AS service_title,
        s.slug AS service_slug,
        u.display_name AS seller_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', f.id,
              'feature_name', f.feature_name,
              'is_included', f.is_included,
              'value_text', f.value_text
            ) ORDER BY f.display_order ASC
          ) FILTER (WHERE f.id IS NOT NULL), '[]'
        ) AS features
      FROM service_packages p
      JOIN services s ON s.id = p.service_id
      JOIN users u ON u.id = s.seller_id
      LEFT JOIN service_package_features f ON f.package_id = p.id
      WHERE s.deleted_at IS NULL
      GROUP BY p.id, s.title, s.slug, u.display_name
      ORDER BY p.price_cents ASC
    `;
    const res = await query(sql);
    return res.rows.map((row) => ({
      ...row,
      price_usd: (row.price_cents / 100).toFixed(2),
    }));
  }

  // ── 15. CUSTOM SERVICE REQUESTS & QUOTES ─────────────────────────────────
  async listCustomRequests(filters = {}, user = null) {
    const { status = '', search = '' } = filters;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(r.title ILIKE $${params.length} OR r.description ILIKE $${params.length} OR c.display_name ILIKE $${params.length})`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        r.*,
        c.display_name AS customer_name,
        c.email AS customer_email,
        c.avatar_url AS customer_avatar,
        cat.name AS category_name,
        s.display_name AS preferred_seller_name,
        asgn.display_name AS assigned_seller_name,
        (SELECT COUNT(*) FROM service_quotes WHERE request_id = r.id) AS quotes_count
      FROM service_custom_requests r
      JOIN users c ON c.id = r.customer_id
      LEFT JOIN listing_categories cat ON cat.id = r.category_id
      LEFT JOIN users s ON s.id = r.preferred_seller_id
      LEFT JOIN users asgn ON asgn.id = r.assigned_seller_id
      ${whereClause}
      ORDER BY r.created_at DESC
    `;

    const res = await query(sql, params);
    return res.rows.map((row) => ({
      ...row,
      budget_min_usd: (row.budget_min_cents / 100).toFixed(2),
      budget_max_usd: (row.budget_max_cents / 100).toFixed(2),
      quotes_count: parseInt(row.quotes_count || 0, 10),
    }));
  }

  async getCustomRequestById(id) {
    const rRes = await query(
      `SELECT r.*,
              c.display_name AS customer_name, c.email AS customer_email, c.avatar_url AS customer_avatar,
              cat.name AS category_name
       FROM service_custom_requests r
       JOIN users c ON c.id = r.customer_id
       LEFT JOIN listing_categories cat ON cat.id = r.category_id
       WHERE r.id = $1`,
      [id]
    );
    if (!rRes.rows.length) throw new NotFoundError('Custom request not found');

    const quotesRes = await query(
      `SELECT q.*, u.display_name AS seller_name, u.email AS seller_email, u.avatar_url AS seller_avatar, COALESCE(u.avg_seller_rating, 5.0) AS seller_rating
       FROM service_quotes q
       JOIN users u ON u.id = q.seller_id
       WHERE q.request_id = $1
       ORDER BY q.created_at DESC`,
      [id]
    );

    const req = rRes.rows[0];
    return {
      ...req,
      budget_min_usd: (req.budget_min_cents / 100).toFixed(2),
      budget_max_usd: (req.budget_max_cents / 100).toFixed(2),
      quotes: quotesRes.rows.map((q) => ({
        ...q,
        price_usd: (q.price_cents / 100).toFixed(2),
      })),
    };
  }

  async createCustomRequest(data, user, req = {}) {
    const title = data.title?.trim();
    if (!title) throw new BadRequestError('Title is required');

    const res = await query(
      `INSERT INTO service_custom_requests (
        customer_id, category_id, preferred_seller_id, title, description,
        budget_min_cents, budget_max_cents, expected_delivery_date, required_skills, reference_files
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user.id,
        data.category_id || null,
        data.preferred_seller_id || null,
        title,
        data.description || '',
        parseInt(data.budget_min_cents || 0, 10),
        parseInt(data.budget_max_cents || 0, 10),
        data.expected_delivery_date || null,
        data.required_skills || [],
        JSON.stringify(data.reference_files || []),
      ]
    );

    const created = res.rows[0];
    await recordAudit(user.id, 'custom_request.create', 'service_custom_requests', created.id, null, created, req);
    return created;
  }

  async submitQuote(requestId, data, user, req = {}) {
    const r = await query(`SELECT * FROM service_custom_requests WHERE id = $1`, [requestId]);
    if (!r.rows.length) throw new NotFoundError('Custom request not found');

    const priceCents = parseInt(data.price_cents, 10);
    if (!priceCents || priceCents <= 0) throw new BadRequestError('Valid quote price is required');

    const deliveryDays = parseInt(data.delivery_days || 3, 10);
    const expiresAt = new Date(Date.now() + (parseInt(data.valid_days || 7, 10)) * 86400000);

    const res = await query(
      `INSERT INTO service_quotes (
        request_id, seller_id, price_cents, delivery_days, deliverables, revisions, terms, expires_at, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [
        requestId,
        user.id,
        priceCents,
        deliveryDays,
        data.deliverables || [],
        parseInt(data.revisions || 1, 10),
        data.terms || null,
        expiresAt,
      ]
    );

    await query(`UPDATE service_custom_requests SET status = 'quote_submitted', updated_at = NOW() WHERE id = $1`, [requestId]);
    await recordAudit(user.id, 'quote.submit', 'service_quotes', res.rows[0].id, null, res.rows[0], req);

    return res.rows[0];
  }

  async updateCustomRequestStatus(id, status, assignedSellerId = null, adminNotes = '', user = null, req = {}) {
    const res = await query(
      `UPDATE service_custom_requests
       SET status = $1,
           assigned_seller_id = COALESCE($2, assigned_seller_id),
           admin_notes = COALESCE($3, admin_notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, assignedSellerId, adminNotes, id]
    );
    if (!res.rows.length) throw new NotFoundError('Custom request not found');

    if (user) {
      await recordAudit(user.id, 'custom_request.update_status', 'service_custom_requests', id, null, { status, assignedSellerId }, req);
    }
    return res.rows[0];
  }

  // ── 16. SERVICE MODERATION REPORTS ──────────────────────────────────────
  async listReports(filters = {}) {
    const { status = '', reason = '' } = filters;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }

    if (reason) {
      params.push(reason);
      conditions.push(`r.reason = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        r.*,
        s.title AS service_title,
        s.slug AS service_slug,
        s.status AS service_status,
        rep.display_name AS reporter_name,
        rep.email AS reporter_email,
        sel.display_name AS seller_name,
        sel.email AS seller_email,
        mod.display_name AS moderator_name
      FROM service_reports r
      JOIN services s ON s.id = r.service_id
      JOIN users rep ON rep.id = r.reporter_id
      JOIN users sel ON sel.id = r.seller_id
      LEFT JOIN users mod ON mod.id = r.assigned_moderator_id
      ${whereClause}
      ORDER BY (r.status = 'new') DESC, r.created_at DESC
    `;

    const res = await query(sql, params);
    return res.rows;
  }

  async updateReport(id, data, user, req = {}) {
    const cur = await query(`SELECT * FROM service_reports WHERE id = $1`, [id]);
    if (!cur.rows.length) throw new NotFoundError('Report not found');

    const { status, resolution_notes, action_taken } = data;

    const res = await query(
      `UPDATE service_reports
       SET status = COALESCE($1, status),
           resolution_notes = COALESCE($2, resolution_notes),
           assigned_moderator_id = $3,
           resolved_at = CASE WHEN $1 IN ('resolved', 'dismissed') THEN NOW() ELSE resolved_at END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, resolution_notes, user.id, id]
    );

    // If moderator chose to suspend or reject service right from the report
    if (action_taken === 'suspend_service') {
      await this.suspendService(cur.rows[0].service_id, user, `Suspended due to report resolution: ${resolution_notes}`, 'Resolved from report', req);
    } else if (action_taken === 'reject_service') {
      await this.rejectService(cur.rows[0].service_id, user, `Rejected due to report resolution: ${resolution_notes}`, 'Resolved from report', req);
    }

    await recordAudit(user.id, 'report.resolve', 'service_reports', id, cur.rows[0], res.rows[0], req);
    return res.rows[0];
  }

  // ── 17. SERVICE PRICING RULES & CALCULATOR ──────────────────────────────
  async listPricingRules() {
    const sql = `
      SELECT
        r.*,
        c.name AS category_name,
        u.display_name AS seller_name
      FROM service_pricing_rules r
      LEFT JOIN listing_categories c ON c.id = r.category_id
      LEFT JOIN users u ON u.id = r.seller_id
      ORDER BY r.updated_at DESC
    `;
    const res = await query(sql);
    return res.rows.map((row) => ({
      ...row,
      min_price_usd: (row.min_price_cents / 100).toFixed(2),
      max_price_usd: (row.max_price_cents / 100).toFixed(2),
      commission_percentage: (parseFloat(row.commission_rate) * 100).toFixed(1) + '%',
    }));
  }

  async savePricingRule(data, user, req = {}) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestError('Rule name is required');

    let res;
    if (data.id) {
      res = await query(
        `UPDATE service_pricing_rules
         SET name = $1,
             category_id = $2,
             seller_id = $3,
             min_price_cents = $4,
             max_price_cents = $5,
             commission_rate = $6,
             allow_hourly = $7,
             allow_packages = $8,
             allow_custom_quotes = $9,
             is_active = $10,
             updated_at = NOW()
         WHERE id = $11
         RETURNING *`,
        [
          name,
          data.category_id || null,
          data.seller_id || null,
          parseInt(data.min_price_cents || 500, 10),
          parseInt(data.max_price_cents || 10000000, 10),
          parseFloat(data.commission_rate || 0.15),
          data.allow_hourly ?? true,
          data.allow_packages ?? true,
          data.allow_custom_quotes ?? true,
          data.is_active ?? true,
          data.id,
        ]
      );
    } else {
      res = await query(
        `INSERT INTO service_pricing_rules (
          name, category_id, seller_id, min_price_cents, max_price_cents, commission_rate,
          allow_hourly, allow_packages, allow_custom_quotes, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          name,
          data.category_id || null,
          data.seller_id || null,
          parseInt(data.min_price_cents || 500, 10),
          parseInt(data.max_price_cents || 10000000, 10),
          parseFloat(data.commission_rate || 0.15),
          data.allow_hourly ?? true,
          data.allow_packages ?? true,
          data.allow_custom_quotes ?? true,
          data.is_active ?? true,
        ]
      );
    }

    const saved = res.rows[0];
    await recordAudit(user.id, 'pricing_rule.save', 'service_pricing_rules', saved.id, null, saved, req);
    return saved;
  }

  async calculateServicePrice(serviceId, packageId = null, addonIds = [], isExpress = false) {
    const s = await query(`SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL`, [serviceId]);
    if (!s.rows.length) throw new NotFoundError('Service not found');
    const service = s.rows[0];

    let baseCents = service.starting_price_cents;
    let deliveryDays = service.delivery_time_days;
    let packageName = 'Starting Base';

    if (packageId) {
      const p = await query(`SELECT * FROM service_packages WHERE id = $1 AND service_id = $2`, [packageId, serviceId]);
      if (p.rows.length) {
        const pkg = p.rows[0];
        packageName = pkg.name;
        if (isExpress && pkg.express_price_cents) {
          baseCents = pkg.express_price_cents;
          deliveryDays = pkg.express_delivery_days || Math.max(1, Math.floor(pkg.delivery_days / 2));
        } else {
          baseCents = pkg.price_cents;
          deliveryDays = pkg.delivery_days;
        }
      }
    }

    let addonsTotalCents = 0;
    const selectedAddons = [];
    if (addonIds && addonIds.length) {
      const aRes = await query(`SELECT * FROM service_addons WHERE id = ANY($1) AND service_id = $2`, [addonIds, serviceId]);
      aRes.rows.forEach((a) => {
        addonsTotalCents += a.price_cents;
        deliveryDays += a.delivery_days_added;
        selectedAddons.push(a);
      });
    }

    // Lookup applicable commission rate from pricing rules
    const ruleRes = await query(
      `SELECT commission_rate
       FROM service_pricing_rules
       WHERE is_active = true AND (category_id = $1 OR category_id IS NULL)
       ORDER BY category_id NULLS LAST
       LIMIT 1`,
      [service.category_id]
    );
    const commissionRate = ruleRes.rows.length ? parseFloat(ruleRes.rows[0].commission_rate) : 0.15;

    const subtotalCents = baseCents + addonsTotalCents;
    const platformFeeCents = Math.round(subtotalCents * commissionRate);
    const sellerEarningsCents = subtotalCents - platformFeeCents;

    return {
      serviceId,
      packageName,
      basePriceCents: baseCents,
      basePriceUsd: (baseCents / 100).toFixed(2),
      addonsTotalCents,
      addonsTotalUsd: (addonsTotalCents / 100).toFixed(2),
      subtotalCents,
      subtotalUsd: (subtotalCents / 100).toFixed(2),
      commissionRate,
      platformFeeCents,
      platformFeeUsd: (platformFeeCents / 100).toFixed(2),
      sellerEarningsCents,
      sellerEarningsUsd: (sellerEarningsCents / 100).toFixed(2),
      estimatedDeliveryDays: deliveryDays,
      selectedAddons,
    };
  }

  // ── 18. SERVICE AVAILABILITY & CALENDAR ───────────────────────────────────
  async getSellerAvailability(sellerId) {
    const res = await query(`SELECT * FROM service_availability WHERE seller_id = $1`, [sellerId]);
    if (!res.rows.length) {
      // Return default configuration
      return {
        seller_id: sellerId,
        timezone: 'UTC',
        weekly_schedule: {
          mon: { active: true, start: '09:00', end: '17:00' },
          tue: { active: true, start: '09:00', end: '17:00' },
          wed: { active: true, start: '09:00', end: '17:00' },
          thu: { active: true, start: '09:00', end: '17:00' },
          fri: { active: true, start: '09:00', end: '17:00' },
          sat: { active: false },
          sun: { active: false },
        },
        vacation_mode: false,
        max_active_orders: 5,
        booking_notice_days: 1,
        max_advance_days: 60,
        expected_response_hours: 4,
      };
    }
    return res.rows[0];
  }

  async updateSellerAvailability(sellerId, data, user, req = {}) {
    const res = await query(
      `INSERT INTO service_availability (
        seller_id, timezone, weekly_schedule, vacation_mode, vacation_start, vacation_end,
        vacation_message, max_active_orders, booking_notice_days, max_advance_days,
        expected_response_hours, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (seller_id) DO UPDATE SET
        timezone = EXCLUDED.timezone,
        weekly_schedule = EXCLUDED.weekly_schedule,
        vacation_mode = EXCLUDED.vacation_mode,
        vacation_start = EXCLUDED.vacation_start,
        vacation_end = EXCLUDED.vacation_end,
        vacation_message = EXCLUDED.vacation_message,
        max_active_orders = EXCLUDED.max_active_orders,
        booking_notice_days = EXCLUDED.booking_notice_days,
        max_advance_days = EXCLUDED.max_advance_days,
        expected_response_hours = EXCLUDED.expected_response_hours,
        updated_at = NOW()
       RETURNING *`,
      [
        sellerId,
        data.timezone || 'UTC',
        JSON.stringify(data.weekly_schedule || {}),
        data.vacation_mode ?? false,
        data.vacation_start || null,
        data.vacation_end || null,
        data.vacation_message || null,
        parseInt(data.max_active_orders || 5, 10),
        parseInt(data.booking_notice_days || 1, 10),
        parseInt(data.max_advance_days || 60, 10),
        parseInt(data.expected_response_hours || 4, 10),
      ]
    );

    const saved = res.rows[0];
    await recordAudit(user.id, 'availability.update', 'service_availability', saved.id, null, saved, req);
    return saved;
  }

  // ── 19. SERVICE PERFORMANCE ANALYTICS ────────────────────────────────────
  async getServicePerformance(filters = {}) {
    const { period = '30d', limit = 10 } = filters;

    const topServicesSql = `
      SELECT
        s.id,
        s.title,
        s.slug,
        s.status,
        s.total_orders,
        s.total_revenue_cents,
        s.avg_rating,
        s.review_count,
        s.view_count,
        u.display_name AS seller_name,
        c.name AS category_name,
        (SELECT file_url FROM service_media WHERE service_id = s.id AND is_primary = true LIMIT 1) AS thumbnail_url
      FROM services s
      JOIN users u ON u.id = s.seller_id
      LEFT JOIN listing_categories c ON c.id = s.category_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.total_revenue_cents DESC, s.total_orders DESC
      LIMIT $1
    `;

    const categoryPerformanceSql = `
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        COUNT(s.id) AS service_count,
        COALESCE(SUM(s.total_orders), 0) AS total_orders,
        COALESCE(SUM(s.total_revenue_cents), 0) AS total_revenue_cents,
        COALESCE(AVG(s.avg_rating), 5.0) AS avg_rating
      FROM listing_categories c
      JOIN services s ON s.category_id = c.id AND s.deleted_at IS NULL
      GROUP BY c.id, c.name
      ORDER BY total_revenue_cents DESC
      LIMIT 10
    `;

    const [topRes, catRes] = await Promise.all([
      query(topServicesSql, [parseInt(limit, 10)]),
      query(categoryPerformanceSql),
    ]);

    return {
      topServices: topRes.rows.map((row) => ({
        ...row,
        total_revenue_usd: (row.total_revenue_cents / 100).toFixed(2),
        conversion_rate: row.view_count > 0 ? ((row.total_orders / row.view_count) * 100).toFixed(2) + '%' : '0.00%',
      })),
      categoryPerformance: catRes.rows.map((row) => ({
        ...row,
        service_count: parseInt(row.service_count, 10),
        total_orders: parseInt(row.total_orders, 10),
        total_revenue_cents: parseInt(row.total_revenue_cents, 10),
        total_revenue_usd: (parseInt(row.total_revenue_cents, 10) / 100).toFixed(2),
        avg_rating: parseFloat(row.avg_rating).toFixed(2),
      })),
    };
  }
}

module.exports = new ServiceManagementService();
