'use strict';
const crypto = require('crypto');
const { query, withTransaction } = require('../../db/pool');
const { NotFoundError, BadRequestError } = require('../../shared/errors/AppError');
const logger = require('../../config/logger');

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

class DigitalProductsService {
  // ── 1. PRODUCT STATS ────────────────────────────────────────────────────────
  async getProductStats() {
    const statsQuery = `
      SELECT
        COUNT(*) AS total_products,
        COUNT(*) FILTER (WHERE status = 'published') AS published_count,
        COUNT(*) FILTER (WHERE status = 'pending_review') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
        COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_count,
        COUNT(*) FILTER (WHERE status = 'archived') AS archived_count,
        COUNT(*) FILTER (WHERE is_featured = TRUE) AS featured_count,
        COALESCE(SUM(total_revenue_cents), 0) AS total_revenue_cents,
        COALESCE(SUM(total_sales), 0) AS total_sales,
        COALESCE(SUM(total_downloads), 0) AS total_downloads,
        COALESCE(SUM(view_count), 0) AS total_views
      FROM digital_products
      WHERE deleted_at IS NULL;
    `;

    const downloadsQuery = `SELECT COUNT(*) AS total_download_events FROM digital_product_downloads;`;
    const refundsQuery = `
      SELECT 
        COUNT(*) AS total_refund_requests,
        COUNT(*) FILTER (WHERE status = 'requested') AS pending_refunds,
        COUNT(*) FILTER (WHERE status = 'refunded') AS completed_refunds,
        COALESCE(SUM(amount_cents) FILTER (WHERE status = 'refunded'), 0) AS refunded_cents
      FROM digital_product_refund_requests;
    `;
    const licensesQuery = `SELECT COUNT(*) AS total_licenses FROM digital_product_licenses WHERE is_active = TRUE;`;
    const filesQuery = `SELECT COUNT(*) AS total_files, COALESCE(SUM(file_size_bytes), 0) AS total_storage_bytes FROM digital_product_files;`;

    const [statsRes, dlRes, refRes, licRes, filesRes] = await Promise.all([
      query(statsQuery),
      query(downloadsQuery),
      query(refundsQuery),
      query(licensesQuery),
      query(filesQuery)
    ]);

    const s = statsRes.rows[0];
    const ref = refRes.rows[0];
    const fl = filesRes.rows[0];

    return {
      totalProducts: parseInt(s.total_products || 0, 10),
      publishedProducts: parseInt(s.published_count || 0, 10),
      pendingProducts: parseInt(s.pending_count || 0, 10),
      draftProducts: parseInt(s.draft_count || 0, 10),
      rejectedProducts: parseInt(s.rejected_count || 0, 10),
      suspendedProducts: parseInt(s.suspended_count || 0, 10),
      archivedProducts: parseInt(s.archived_count || 0, 10),
      featuredProducts: parseInt(s.featured_count || 0, 10),
      totalRevenueCents: parseInt(s.total_revenue_cents || 0, 10),
      totalSales: parseInt(s.total_sales || 0, 10),
      totalDownloads: parseInt(s.total_downloads || 0, 10),
      totalViews: parseInt(s.total_views || 0, 10),
      totalDownloadEvents: parseInt(dlRes.rows[0]?.total_download_events || 0, 10),
      totalRefundRequests: parseInt(ref.total_refund_requests || 0, 10),
      pendingRefunds: parseInt(ref.pending_refunds || 0, 10),
      completedRefunds: parseInt(ref.completed_refunds || 0, 10),
      refundedCents: parseInt(ref.refunded_cents || 0, 10),
      totalLicenses: parseInt(licRes.rows[0]?.total_licenses || 0, 10),
      totalFiles: parseInt(fl.total_files || 0, 10),
      totalStorageBytes: parseInt(fl.total_storage_bytes || 0, 10),
    };
  }

  // ── 2. LIST PRODUCTS ────────────────────────────────────────────────────────
  async listProducts(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      category_id,
      seller_id,
      is_featured,
      software,
      format,
      min_price,
      max_price,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = filters;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const conditions = ['dp.deleted_at IS NULL'];
    const values = [];

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(dp.title ILIKE $${values.length} OR dp.slug ILIKE $${values.length} OR dp.short_description ILIKE $${values.length})`);
    }

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`dp.status = $${values.length}`);
    }

    if (category_id) {
      values.push(category_id);
      conditions.push(`dp.category_id = $${values.length}`);
    }

    if (seller_id) {
      values.push(seller_id);
      conditions.push(`dp.seller_id = $${values.length}`);
    }

    if (is_featured !== undefined && is_featured !== '' && is_featured !== null) {
      values.push(is_featured === 'true' || is_featured === true);
      conditions.push(`dp.is_featured = $${values.length}`);
    }

    if (software) {
      values.push(`%${software}%`);
      conditions.push(`EXISTS (SELECT 1 FROM unnest(dp.software_compatibility) sc WHERE sc ILIKE $${values.length})`);
    }

    if (format) {
      values.push(`%${format}%`);
      conditions.push(`EXISTS (SELECT 1 FROM unnest(dp.file_formats) ff WHERE ff ILIKE $${values.length})`);
    }

    if (min_price) {
      values.push(parseInt(min_price, 10));
      conditions.push(`dp.price_personal_cents >= $${values.length}`);
    }

    if (max_price) {
      values.push(parseInt(max_price, 10));
      conditions.push(`dp.price_personal_cents <= $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const allowedSortFields = ['created_at', 'title', 'price_personal_cents', 'total_sales', 'total_revenue_cents', 'total_downloads', 'view_count', 'avg_rating', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by) ? `dp.${sort_by}` : 'dp.created_at';
    const sortDir = (sort_order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countSql = `SELECT COUNT(*) AS total FROM digital_products dp WHERE ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT
        dp.*,
        c.name AS category_name,
        c.slug AS category_slug,
        u.display_name AS seller_name,
        u.email AS seller_email,
        u.avatar_url AS seller_avatar,
        (SELECT COUNT(*) FROM digital_product_files f WHERE f.product_id = dp.id) AS files_count,
        (SELECT COUNT(*) FROM digital_product_versions v WHERE v.product_id = dp.id) AS versions_count
      FROM digital_products dp
      LEFT JOIN listing_categories c ON c.id = dp.category_id
      LEFT JOIN users u ON u.id = dp.seller_id
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const listRes = await query(listSql, values);

    return {
      products: listRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  // ── 3. GET PRODUCT BY ID ───────────────────────────────────────────────────
  async getProductById(id) {
    const prodRes = await query(
      `SELECT
        dp.*,
        c.name AS category_name,
        c.slug AS category_slug,
        u.display_name AS seller_name,
        u.email AS seller_email,
        u.avatar_url AS seller_avatar
       FROM digital_products dp
       LEFT JOIN listing_categories c ON c.id = dp.category_id
       LEFT JOIN users u ON u.id = dp.seller_id
       WHERE dp.id = $1 AND dp.deleted_at IS NULL`,
      [id]
    );

    if (prodRes.rows.length === 0) {
      throw new NotFoundError('Digital product not found');
    }

    const product = prodRes.rows[0];

    // Fetch related files, licenses, versions, moderation history
    const [filesRes, licRes, verRes, modRes, dlRes, refRes] = await Promise.all([
      query(`SELECT * FROM digital_product_files WHERE product_id = $1 ORDER BY is_primary DESC, created_at ASC`, [id]),
      query(
        `SELECT dla.*, dpl.name AS license_name, dpl.slug AS license_slug, dpl.terms_summary, dpl.allowed_uses, dpl.prohibited_uses, dpl.price_multiplier
         FROM digital_product_license_assignments dla
         JOIN digital_product_licenses dpl ON dpl.id = dla.license_id
         WHERE dla.product_id = $1
         ORDER BY dpl.sort_order ASC`,
        [id]
      ),
      query(`SELECT * FROM digital_product_versions WHERE product_id = $1 ORDER BY released_at DESC, created_at DESC`, [id]),
      query(
        `SELECT mh.*, u.display_name AS moderator_name, u.email AS moderator_email
         FROM digital_product_moderation_history mh
         LEFT JOIN users u ON u.id = mh.moderator_id
         WHERE mh.product_id = $1
         ORDER BY mh.created_at DESC`,
        [id]
      ),
      query(`SELECT * FROM digital_product_downloads WHERE product_id = $1 ORDER BY downloaded_at DESC LIMIT 50`, [id]),
      query(`SELECT * FROM digital_product_refund_requests WHERE product_id = $1 ORDER BY created_at DESC`, [id]),
    ]);

    product.files = filesRes.rows;
    product.licenses = licRes.rows;
    product.versions = verRes.rows;
    product.moderation_history = modRes.rows;
    product.recent_downloads = dlRes.rows;
    product.refund_requests = refRes.rows;

    return product;
  }

  // ── 4. CREATE PRODUCT ──────────────────────────────────────────────────────
  async createProduct(data, actorId, req = {}) {
    const title = data.title?.trim();
    if (!title) throw new BadRequestError('Product title is required');

    let baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const check = await query(`SELECT id FROM digital_products WHERE slug = $1`, [slug]);
      if (check.rows.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const sellerId = data.seller_id || actorId;
    const status = data.status || 'draft';

    const insertRes = await query(
      `INSERT INTO digital_products
       (seller_id, category_id, title, slug, short_description, description, version, status,
        price_personal_cents, price_commercial_cents, price_extended_cents, price_enterprise_cents,
        currency, is_featured, featured_position, file_formats, software_compatibility, tags,
        thumbnail_url, preview_images, demo_url, documentation_url, included_assets, changelog)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
       RETURNING *`,
      [
        sellerId,
        data.category_id || null,
        title,
        slug,
        data.short_description || null,
        data.description || 'Professional design asset.',
        data.version || '1.0.0',
        status,
        data.price_personal_cents || 0,
        data.price_commercial_cents || 0,
        data.price_extended_cents || 0,
        data.price_enterprise_cents || 0,
        data.currency || 'USD',
        data.is_featured || false,
        data.featured_position || 0,
        data.file_formats || [],
        data.software_compatibility || [],
        data.tags || [],
        data.thumbnail_url || null,
        data.preview_images || [],
        data.demo_url || null,
        data.documentation_url || null,
        data.included_assets || [],
        data.changelog || null,
      ]
    );

    const product = insertRes.rows[0];

    // Seed default version
    await query(
      `INSERT INTO digital_product_versions (product_id, version_string, release_notes, changelog, is_current)
       VALUES ($1, $2, 'Initial release', 'Initial release', true)`,
      [product.id, product.version]
    );

    // If files provided in create payload
    if (Array.isArray(data.files) && data.files.length > 0) {
      for (const f of data.files) {
        await query(
          `INSERT INTO digital_product_files
           (product_id, file_name, file_size_bytes, mime_type, file_format, storage_path, storage_provider, checksum_sha256, is_primary)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            product.id,
            f.file_name,
            f.file_size_bytes || 1024,
            f.mime_type || 'application/octet-stream',
            f.file_format || '.zip',
            f.storage_path || `vault/products/${product.id}/${f.file_name}`,
            f.storage_provider || 's3',
            f.checksum_sha256 || crypto.createHash('sha256').update(f.file_name).digest('hex'),
            f.is_primary ?? false,
          ]
        );
      }
    }

    // Assign default licenses
    const defaultLicenses = await query(`SELECT id, slug FROM digital_product_licenses WHERE is_active = TRUE`);
    for (const lic of defaultLicenses.rows) {
      let price = product.price_personal_cents;
      if (lic.slug === 'commercial') price = product.price_commercial_cents;
      if (lic.slug === 'extended') price = product.price_extended_cents;
      if (lic.slug === 'enterprise') price = product.price_enterprise_cents;
      await query(
        `INSERT INTO digital_product_license_assignments (product_id, license_id, custom_price_cents, is_enabled)
         VALUES ($1, $2, $3, true)
         ON CONFLICT DO NOTHING`,
        [product.id, lic.id, price]
      );
    }

    // Log moderation action
    await query(
      `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, new_status)
       VALUES ($1, $2, 'submitted', 'Product created by user/admin', $3)`,
      [product.id, actorId, status]
    );

    await recordAudit(actorId, 'product.created', 'digital_product', product.id, null, product, req);

    return this.getProductById(product.id);
  }

  // ── 5. UPDATE PRODUCT ──────────────────────────────────────────────────────
  async updateProduct(id, data, actorId, req = {}) {
    const existing = await this.getProductById(id);

    const updateFields = [];
    const values = [];

    const fieldMap = {
      title: 'title',
      category_id: 'category_id',
      short_description: 'short_description',
      description: 'description',
      version: 'version',
      status: 'status',
      price_personal_cents: 'price_personal_cents',
      price_commercial_cents: 'price_commercial_cents',
      price_extended_cents: 'price_extended_cents',
      price_enterprise_cents: 'price_enterprise_cents',
      currency: 'currency',
      is_featured: 'is_featured',
      featured_position: 'featured_position',
      file_formats: 'file_formats',
      software_compatibility: 'software_compatibility',
      tags: 'tags',
      thumbnail_url: 'thumbnail_url',
      preview_images: 'preview_images',
      demo_url: 'demo_url',
      documentation_url: 'documentation_url',
      included_assets: 'included_assets',
      changelog: 'changelog',
      rejection_reason: 'rejection_reason',
      moderator_notes: 'moderator_notes',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        values.push(data[key]);
        updateFields.push(`${col} = $${values.length}`);
      }
    }

    if (updateFields.length === 0) return existing;

    values.push(id);
    const sql = `
      UPDATE digital_products
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length} AND deleted_at IS NULL
      RETURNING *
    `;

    const res = await query(sql, values);
    const updated = res.rows[0];

    // Status change moderation log
    if (data.status && data.status !== existing.status) {
      await query(
        `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, previous_status, new_status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, actorId, data.status === 'published' ? 'published' : 'submitted', data.moderator_notes || `Status changed to ${data.status}`, existing.status, data.status]
      );
    }

    await recordAudit(actorId, 'product.updated', 'digital_product', id, existing, updated, req);

    return this.getProductById(id);
  }

  // ── 6. DUPLICATE PRODUCT ───────────────────────────────────────────────────
  async duplicateProduct(id, actorId, req = {}) {
    const orig = await this.getProductById(id);
    const newTitle = `${orig.title} (Copy)`;
    let baseSlug = slugify(newTitle);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const check = await query(`SELECT id FROM digital_products WHERE slug = $1`, [slug]);
      if (check.rows.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const insertRes = await query(
      `INSERT INTO digital_products
       (seller_id, category_id, title, slug, short_description, description, version, status,
        price_personal_cents, price_commercial_cents, price_extended_cents, price_enterprise_cents,
        currency, is_featured, featured_position, file_formats, software_compatibility, tags,
        thumbnail_url, preview_images, demo_url, documentation_url, included_assets, changelog)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, $9, $10, $11, $12, false, 0, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        actorId,
        orig.category_id,
        newTitle,
        slug,
        orig.short_description,
        orig.description,
        orig.version,
        orig.price_personal_cents,
        orig.price_commercial_cents,
        orig.price_extended_cents,
        orig.price_enterprise_cents,
        orig.currency,
        orig.file_formats,
        orig.software_compatibility,
        orig.tags,
        orig.thumbnail_url,
        orig.preview_images,
        orig.demo_url,
        orig.documentation_url,
        orig.included_assets,
        orig.changelog,
      ]
    );

    const cloned = insertRes.rows[0];

    // Duplicate files
    for (const f of orig.files) {
      await query(
        `INSERT INTO digital_product_files
         (product_id, file_name, file_size_bytes, mime_type, file_format, storage_path, storage_provider, checksum_sha256, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [cloned.id, f.file_name, f.file_size_bytes, f.mime_type, f.file_format, f.storage_path, f.storage_provider, f.checksum_sha256, f.is_primary]
      );
    }

    // Duplicate license assignments
    for (const lic of orig.licenses) {
      await query(
        `INSERT INTO digital_product_license_assignments (product_id, license_id, custom_price_cents, is_enabled)
         VALUES ($1, $2, $3, $4)`,
        [cloned.id, lic.license_id, lic.custom_price_cents, lic.is_enabled]
      );
    }

    await recordAudit(actorId, 'product.duplicated', 'digital_product', cloned.id, { source_id: id }, cloned, req);

    return this.getProductById(cloned.id);
  }

  // ── 7. DELETE / ARCHIVE PRODUCT ────────────────────────────────────────────
  async deleteProduct(id, actorId, req = {}) {
    const product = await this.getProductById(id);

    // If has sales or downloads, soft-delete archive
    if (product.total_sales > 0 || product.total_downloads > 0) {
      await query(
        `UPDATE digital_products SET deleted_at = NOW(), status = 'archived' WHERE id = $1`,
        [id]
      );
      await recordAudit(actorId, 'product.archived', 'digital_product', id, product, { status: 'archived' }, req);
      return { message: 'Product has active purchase history; archived safely.' };
    } else {
      await query(`DELETE FROM digital_products WHERE id = $1`, [id]);
      await recordAudit(actorId, 'product.deleted', 'digital_product', id, product, null, req);
      return { message: 'Product deleted permanently.' };
    }
  }

  // ── 8. LIFECYCLE & MODERATION TRANSITIONS ──────────────────────────────────
  async approveProduct(id, moderatorId, notes = '', req = {}) {
    const product = await this.getProductById(id);
    await query(
      `UPDATE digital_products 
       SET status = 'published', approved_at = NOW(), published_at = COALESCE(published_at, NOW()), rejection_reason = NULL, moderator_notes = $2
       WHERE id = $1`,
      [id, notes]
    );

    await query(
      `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, previous_status, new_status)
       VALUES ($1, $2, 'approved', $3, $4, 'published')`,
      [id, moderatorId, notes || 'Product approved for marketplace publishing.', product.status]
    );

    await recordAudit(moderatorId, 'product.approved', 'digital_product', id, { status: product.status }, { status: 'published' }, req);
    return this.getProductById(id);
  }

  async rejectProduct(id, moderatorId, reason, notes = '', req = {}) {
    if (!reason) throw new BadRequestError('Rejection reason is required');
    const product = await this.getProductById(id);

    await query(
      `UPDATE digital_products 
       SET status = 'rejected', rejection_reason = $2, moderator_notes = $3
       WHERE id = $1`,
      [id, reason, notes]
    );

    await query(
      `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, previous_status, new_status)
       VALUES ($1, $2, 'rejected', $3, $4, 'rejected')`,
      [id, moderatorId, reason, product.status]
    );

    await recordAudit(moderatorId, 'product.rejected', 'digital_product', id, { status: product.status }, { status: 'rejected', reason }, req);
    return this.getProductById(id);
  }

  async publishProduct(id, actorId, req = {}) {
    const product = await this.getProductById(id);
    await query(
      `UPDATE digital_products 
       SET status = 'published', published_at = COALESCE(published_at, NOW())
       WHERE id = $1`,
      [id]
    );

    await query(
      `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, previous_status, new_status)
       VALUES ($1, $2, 'published', 'Product published to store.', $3, 'published')`,
      [id, actorId, product.status]
    );

    await recordAudit(actorId, 'product.published', 'digital_product', id, { status: product.status }, { status: 'published' }, req);
    return this.getProductById(id);
  }

  async unpublishProduct(id, actorId, req = {}) {
    const product = await this.getProductById(id);
    await query(`UPDATE digital_products SET status = 'draft' WHERE id = $1`, [id]);

    await query(
      `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, previous_status, new_status)
       VALUES ($1, $2, 'unpublished', 'Product reverted to draft.', $3, 'draft')`,
      [id, actorId, product.status]
    );

    await recordAudit(actorId, 'product.unpublished', 'digital_product', id, { status: product.status }, { status: 'draft' }, req);
    return this.getProductById(id);
  }

  async suspendProduct(id, actorId, reason = 'Platform compliance review', req = {}) {
    const product = await this.getProductById(id);
    await query(
      `UPDATE digital_products SET status = 'suspended', rejection_reason = $2 WHERE id = $1`,
      [id, reason]
    );

    await query(
      `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, previous_status, new_status)
       VALUES ($1, $2, 'suspended', $3, $4, 'suspended')`,
      [id, actorId, reason, product.status]
    );

    await recordAudit(actorId, 'product.suspended', 'digital_product', id, { status: product.status }, { status: 'suspended', reason }, req);
    return this.getProductById(id);
  }

  async toggleFeatured(id, isFeatured, position = 1, featuredType = 'badge', actorId, req = {}) {
    const product = await this.getProductById(id);
    const targetState = isFeatured === 'true' || isFeatured === true;

    await query(
      `UPDATE digital_products SET is_featured = $2, featured_position = $3 WHERE id = $1`,
      [id, targetState, targetState ? position : 0]
    );

    if (targetState) {
      await query(
        `INSERT INTO digital_product_featured (product_id, position, featured_type)
         VALUES ($1, $2, $3)`,
        [id, position, featuredType]
      );
    } else {
      await query(`DELETE FROM digital_product_featured WHERE product_id = $1`, [id]);
    }

    await query(
      `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, previous_status, new_status)
       VALUES ($1, $2, $3, $4, $5, $5)`,
      [id, actorId, targetState ? 'featured' : 'unfeatured', `Featured set to ${targetState}`, product.status]
    );

    await recordAudit(actorId, 'product.featured_toggled', 'digital_product', id, { is_featured: product.is_featured }, { is_featured: targetState }, req);
    return this.getProductById(id);
  }

  // ── 9. PRODUCT FILES ───────────────────────────────────────────────────────
  async listAllFiles(params = {}) {
    const { product_id, format, search, page = 1, limit = 50 } = params;
    const conditions = [];
    const values = [];

    if (product_id) {
      values.push(product_id);
      conditions.push(`f.product_id = $${values.length}`);
    }

    if (format) {
      values.push(format);
      conditions.push(`f.file_format = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(f.file_name ILIKE $${values.length} OR dp.title ILIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const countRes = await query(
      `SELECT COUNT(*) AS total FROM digital_product_files f JOIN digital_products dp ON dp.id = f.product_id ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const listSql = `
      SELECT f.*, dp.title AS product_title, dp.slug AS product_slug, dp.thumbnail_url AS product_thumbnail
      FROM digital_product_files f
      JOIN digital_products dp ON dp.id = f.product_id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const filesRes = await query(listSql, values);

    return {
      files: filesRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  async addFile(productId, fileData, actorId, req = {}) {
    await this.getProductById(productId);

    const checksum = fileData.checksum_sha256 || crypto.createHash('sha256').update(fileData.file_name + Date.now()).digest('hex');

    const res = await query(
      `INSERT INTO digital_product_files
       (product_id, file_name, file_size_bytes, mime_type, file_format, storage_path, storage_provider, checksum_sha256, virus_scan_status, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'clean', $9)
       RETURNING *`,
      [
        productId,
        fileData.file_name,
        fileData.file_size_bytes || 1024,
        fileData.mime_type || 'application/octet-stream',
        fileData.file_format || '.zip',
        fileData.storage_path || `vault/products/${productId}/${fileData.file_name}`,
        fileData.storage_provider || 's3',
        checksum,
        fileData.is_primary || false,
      ]
    );

    const newFile = res.rows[0];
    await recordAudit(actorId, 'product.file_added', 'digital_product_file', newFile.id, null, newFile, req);
    return newFile;
  }

  async deleteFile(fileId, actorId, req = {}) {
    const res = await query(`SELECT * FROM digital_product_files WHERE id = $1`, [fileId]);
    if (res.rows.length === 0) throw new NotFoundError('File not found');
    const file = res.rows[0];

    await query(`DELETE FROM digital_product_files WHERE id = $1`, [fileId]);
    await recordAudit(actorId, 'product.file_deleted', 'digital_product_file', fileId, file, null, req);
    return { message: 'File deleted successfully' };
  }

  // ── 10. PRODUCT LICENSES ───────────────────────────────────────────────────
  async listLicenses() {
    const res = await query(`SELECT * FROM digital_product_licenses ORDER BY sort_order ASC, created_at ASC`);
    return res.rows;
  }

  async createLicense(data, actorId, req = {}) {
    const slug = slugify(data.name);
    const res = await query(
      `INSERT INTO digital_product_licenses
       (name, slug, description, terms_summary, allowed_uses, prohibited_uses, max_end_products, can_resell, can_modify, is_default, price_multiplier, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        data.name,
        slug,
        data.description || null,
        data.terms_summary || null,
        data.allowed_uses || [],
        data.prohibited_uses || [],
        data.max_end_products || 1,
        data.can_resell || false,
        data.can_modify ?? true,
        data.is_default || false,
        data.price_multiplier || 1.0,
        data.is_active ?? true,
        data.sort_order || 0,
      ]
    );

    const lic = res.rows[0];
    await recordAudit(actorId, 'license.created', 'digital_product_license', lic.id, null, lic, req);
    return lic;
  }

  async updateLicense(id, data, actorId, req = {}) {
    const existing = await query(`SELECT * FROM digital_product_licenses WHERE id = $1`, [id]);
    if (existing.rows.length === 0) throw new NotFoundError('License not found');

    const res = await query(
      `UPDATE digital_product_licenses
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           terms_summary = COALESCE($4, terms_summary),
           allowed_uses = COALESCE($5, allowed_uses),
           prohibited_uses = COALESCE($6, prohibited_uses),
           max_end_products = COALESCE($7, max_end_products),
           can_resell = COALESCE($8, can_resell),
           can_modify = COALESCE($9, can_modify),
           is_default = COALESCE($10, is_default),
           price_multiplier = COALESCE($11, price_multiplier),
           is_active = COALESCE($12, is_active),
           sort_order = COALESCE($13, sort_order),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        data.name,
        data.description,
        data.terms_summary,
        data.allowed_uses,
        data.prohibited_uses,
        data.max_end_products,
        data.can_resell,
        data.can_modify,
        data.is_default,
        data.price_multiplier,
        data.is_active,
        data.sort_order,
      ]
    );

    const updated = res.rows[0];
    await recordAudit(actorId, 'license.updated', 'digital_product_license', id, existing.rows[0], updated, req);
    return updated;
  }

  // ── 11. PRODUCT VERSIONS ───────────────────────────────────────────────────
  async listAllVersions(params = {}) {
    const { product_id, page = 1, limit = 50 } = params;
    const conditions = [];
    const values = [];

    if (product_id) {
      values.push(product_id);
      conditions.push(`v.product_id = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const countRes = await query(
      `SELECT COUNT(*) AS total FROM digital_product_versions v ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const sql = `
      SELECT v.*, dp.title AS product_title, dp.slug AS product_slug
      FROM digital_product_versions v
      JOIN digital_products dp ON dp.id = v.product_id
      ${whereClause}
      ORDER BY v.released_at DESC, v.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const verRes = await query(sql, values);

    return {
      versions: verRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  async createVersion(productId, data, actorId, req = {}) {
    await this.getProductById(productId);

    if (data.is_current) {
      await query(`UPDATE digital_product_versions SET is_current = FALSE WHERE product_id = $1`, [productId]);
      await query(`UPDATE digital_products SET version = $2 WHERE id = $1`, [productId, data.version_string]);
    }

    const res = await query(
      `INSERT INTO digital_product_versions
       (product_id, version_string, release_notes, changelog, file_url, file_size_bytes, is_current, released_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        productId,
        data.version_string,
        data.release_notes || null,
        data.changelog || null,
        data.file_url || null,
        data.file_size_bytes || 0,
        data.is_current ?? true,
      ]
    );

    const version = res.rows[0];
    await recordAudit(actorId, 'version.created', 'digital_product_version', version.id, null, version, req);
    return version;
  }

  // ── 12. DOWNLOADS & ENTITLEMENTS ───────────────────────────────────────────
  async listDownloads(params = {}) {
    const { product_id, user_id, status, page = 1, limit = 50 } = params;
    const conditions = [];
    const values = [];

    if (product_id) {
      values.push(product_id);
      conditions.push(`d.product_id = $${values.length}`);
    }

    if (user_id) {
      values.push(user_id);
      conditions.push(`d.user_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`d.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const countRes = await query(
      `SELECT COUNT(*) AS total FROM digital_product_downloads d ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const sql = `
      SELECT d.*, dp.title AS product_title, dp.slug AS product_slug,
             f.file_name, f.file_format,
             u.display_name AS user_name, u.email AS user_email
      FROM digital_product_downloads d
      JOIN digital_products dp ON dp.id = d.product_id
      LEFT JOIN digital_product_files f ON f.id = d.file_id
      LEFT JOIN users u ON u.id = d.user_id
      ${whereClause}
      ORDER BY d.downloaded_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const dlRes = await query(sql, values);

    return {
      downloads: dlRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  async generateSignedDownloadUrl(productId, fileId, userId, req = {}) {
    const product = await this.getProductById(productId);
    const fileRes = await query(`SELECT * FROM digital_product_files WHERE id = $1 AND product_id = $2`, [fileId, productId]);
    if (fileRes.rows.length === 0) throw new NotFoundError('File not found for this product');
    const file = fileRes.rows[0];

    // Check entitlement if not super admin
    const entRes = await query(
      `SELECT * FROM digital_product_download_entitlements 
       WHERE product_id = $1 AND user_id = $2 AND is_revoked = FALSE`,
      [productId, userId]
    );

    // If entitlement exists, increment downloads used
    if (entRes.rows.length > 0) {
      const ent = entRes.rows[0];
      if (ent.max_downloads > 0 && ent.downloads_used >= ent.max_downloads) {
        throw new BadRequestError('Maximum download limit reached for your license entitlement.');
      }
      await query(`UPDATE digital_product_download_entitlements SET downloads_used = downloads_used + 1 WHERE id = $1`, [ent.id]);
    }

    // Log the download attempt
    await query(
      `INSERT INTO digital_product_downloads (product_id, file_id, user_id, ip_address, user_agent, status, file_version)
       VALUES ($1, $2, $3, $4, $5, 'success', $6)`,
      [productId, fileId, userId || null, req.ip || '127.0.0.1', req.headers?.['user-agent'] || null, product.version]
    );

    // Increment download counter on product and file
    await query(`UPDATE digital_products SET total_downloads = total_downloads + 1 WHERE id = $1`, [productId]);
    await query(`UPDATE digital_product_files SET download_count = download_count + 1 WHERE id = $1`, [fileId]);

    // Generate secure simulated signed URL (valid for 15 minutes)
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const downloadUrl = `https://vault.desigot.com/stream/${productId}/${file.id}?token=${token}&expires=${expiresAt}`;

    return {
      downloadUrl,
      fileName: file.file_name,
      fileSize: file.file_size_bytes,
      expiresAt,
    };
  }

  // ── 13. PRODUCT SALES & ORDERS ─────────────────────────────────────────────
  async listSales(params = {}) {
    const { product_id, page = 1, limit = 50 } = params;
    const conditions = ["o.listing_type = 'asset' OR o.listing_id IS NOT NULL"];
    const values = [];

    if (product_id) {
      values.push(product_id);
      conditions.push(`dp.id = $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const countRes = await query(
      `SELECT COUNT(*) AS total 
       FROM orders o
       LEFT JOIN digital_products dp ON dp.listing_id = o.listing_id OR dp.title ILIKE o.listing_title
       WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const sql = `
      SELECT o.*, 
             COALESCE(dp.title, o.listing_title) AS product_title,
             dp.id AS digital_product_id,
             dp.slug AS digital_product_slug,
             dp.thumbnail_url AS product_thumbnail,
             b.display_name AS buyer_name,
             b.email AS buyer_email,
             s.display_name AS seller_name,
             s.email AS seller_email
      FROM orders o
      LEFT JOIN digital_products dp ON dp.listing_id = o.listing_id OR dp.title ILIKE o.listing_title
      LEFT JOIN users b ON b.id = o.buyer_id
      LEFT JOIN users s ON s.id = o.seller_id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const salesRes = await query(sql, values);

    return {
      sales: salesRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  // ── 14. REFUNDS MANAGEMENT ─────────────────────────────────────────────────
  async listRefunds(params = {}) {
    const { status, product_id, page = 1, limit = 50 } = params;
    const conditions = [];
    const values = [];

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`r.status = $${values.length}`);
    }

    if (product_id) {
      values.push(product_id);
      conditions.push(`r.product_id = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    const countRes = await query(
      `SELECT COUNT(*) AS total FROM digital_product_refund_requests r ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const sql = `
      SELECT r.*,
             dp.title AS product_title, dp.slug AS product_slug, dp.thumbnail_url AS product_thumbnail,
             b.display_name AS buyer_name, b.email AS buyer_email,
             s.display_name AS seller_name, s.email AS seller_email,
             res.display_name AS resolver_name
      FROM digital_product_refund_requests r
      JOIN digital_products dp ON dp.id = r.product_id
      LEFT JOIN users b ON b.id = r.buyer_id
      LEFT JOIN users s ON s.id = r.seller_id
      LEFT JOIN users res ON res.id = r.resolved_by
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(parseInt(limit, 10), offset);
    const refRes = await query(sql, values);

    return {
      refunds: refRes.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / Math.max(1, parseInt(limit, 10))),
      },
    };
  }

  async resolveRefund(id, resolution, moderatorId, notes = '', req = {}) {
    const existing = await query(`SELECT * FROM digital_product_refund_requests WHERE id = $1`, [id]);
    if (existing.rows.length === 0) throw new NotFoundError('Refund request not found');
    const refund = existing.rows[0];

    const targetStatus = resolution === 'approve' ? 'refunded' : 'rejected';

    await query(
      `UPDATE digital_product_refund_requests
       SET status = $2, resolution_notes = $3, resolved_by = $4, resolved_at = NOW()
       WHERE id = $1`,
      [id, targetStatus, notes, moderatorId]
    );

    // If approved/refunded, revoke any active download entitlements for this order/product
    if (targetStatus === 'refunded') {
      await query(
        `UPDATE digital_product_download_entitlements
         SET is_revoked = TRUE, revoked_reason = 'Refund authorized by moderation team'
         WHERE product_id = $1 AND user_id = $2`,
        [refund.product_id, refund.buyer_id]
      );
    }

    await recordAudit(moderatorId, `refund.${targetStatus}`, 'digital_product_refund_request', id, refund, { status: targetStatus, notes }, req);

    return {
      id,
      status: targetStatus,
      resolution_notes: notes,
      resolved_at: new Date().toISOString(),
    };
  }
}

module.exports = new DigitalProductsService();
