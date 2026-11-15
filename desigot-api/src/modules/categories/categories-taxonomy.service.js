'use strict';

const { primaryPool } = require('../../db/pool');
const { NotFoundError, ValidationError, ForbiddenError, ConflictError } = require('../../shared/errors/AppError');
const BadRequestError = ValidationError;
const logger = require('../../config/logger');
const { makeSlug } = require('../../shared/utils');

async function query(sql, params) {
  return primaryPool.query(sql, params);
}

async function recordCategoryHistory(categoryId, action, actorId, reason, oldData = null, newData = null) {
  try {
    await query(
      `INSERT INTO category_history (category_id, action, actor_id, reason, old_data, new_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        categoryId,
        action,
        actorId,
        reason || null,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
      ]
    );
  } catch (err) {
    logger.warn('Failed to record category history', { err: err.message });
  }
}

class CategoriesTaxonomyService {
  // ── 1. KPI STATS OVERVIEW ───────────────────────────────────────────────────
  async getStats() {
    const statsQuery = `
      SELECT
        COUNT(*) AS total_categories,
        COUNT(*) FILTER (WHERE status = 'published' AND deleted_at IS NULL) AS published_categories,
        COUNT(*) FILTER (WHERE status = 'draft' AND deleted_at IS NULL) AS draft_categories,
        COUNT(*) FILTER (WHERE status = 'archived' OR deleted_at IS NOT NULL) AS archived_categories,
        COUNT(*) FILTER (WHERE parent_id IS NULL AND deleted_at IS NULL) AS main_categories,
        COUNT(*) FILTER (WHERE parent_id IS NOT NULL AND deleted_at IS NULL) AS subcategories,
        COUNT(*) FILTER (WHERE category_type = 'service' AND deleted_at IS NULL) AS service_categories,
        COUNT(*) FILTER (WHERE category_type = 'product' AND deleted_at IS NULL) AS product_categories,
        COUNT(*) FILTER (WHERE category_type = 'shared' AND deleted_at IS NULL) AS shared_categories,
        COUNT(*) FILTER (WHERE is_featured = TRUE AND deleted_at IS NULL) AS featured_categories
      FROM listing_categories
    `;
    const res = await query(statsQuery);

    const srvCountRes = await query(`SELECT COUNT(*) FROM services WHERE deleted_at IS NULL`);
    const prodCountRes = await query(`SELECT COUNT(*) FROM digital_products WHERE deleted_at IS NULL`);
    const attrCountRes = await query(`SELECT COUNT(*) FROM category_attributes WHERE status = 'active'`);
    const iconCountRes = await query(`SELECT COUNT(*) FROM category_icons WHERE status = 'active'`);
    const bannerCountRes = await query(`SELECT COUNT(*) FROM category_banners WHERE status = 'active'`);

    const row = res.rows[0] || {};
    return {
      total_categories: parseInt(row.total_categories || 0, 10),
      published_categories: parseInt(row.published_categories || 0, 10),
      draft_categories: parseInt(row.draft_categories || 0, 10),
      archived_categories: parseInt(row.archived_categories || 0, 10),
      main_categories: parseInt(row.main_categories || 0, 10),
      subcategories: parseInt(row.subcategories || 0, 10),
      service_categories: parseInt(row.service_categories || 0, 10),
      product_categories: parseInt(row.product_categories || 0, 10),
      shared_categories: parseInt(row.shared_categories || 0, 10),
      featured_categories: parseInt(row.featured_categories || 0, 10),
      total_assigned_services: parseInt(srvCountRes.rows[0]?.count || 0, 10),
      total_assigned_products: parseInt(prodCountRes.rows[0]?.count || 0, 10),
      total_attributes: parseInt(attrCountRes.rows[0]?.count || 0, 10),
      total_icons: parseInt(iconCountRes.rows[0]?.count || 0, 10),
      total_banners: parseInt(bannerCountRes.rows[0]?.count || 0, 10),
    };
  }

  // ── 2. MASTER CATEGORY DIRECTORY ────────────────────────────────────────────
  async listCategories(filters = {}) {
    const {
      page = 1,
      limit = 15,
      search,
      category_type,
      status,
      visibility,
      parent_id,
      is_featured,
      depth,
      sort_by = 'display_order',
      order = 'asc',
      include_archived = false,
    } = filters;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const conditions = [];
    const params = [];

    if (!include_archived && status !== 'archived') {
      conditions.push(`c.deleted_at IS NULL`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(c.name) LIKE $${params.length} OR LOWER(c.slug) LIKE $${params.length} OR LOWER(COALESCE(c.description, '')) LIKE $${params.length})`);
    }

    if (category_type) {
      params.push(category_type);
      conditions.push(`c.category_type = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`c.status = $${params.length}`);
    }

    if (visibility) {
      params.push(visibility);
      conditions.push(`c.visibility = $${params.length}`);
    }

    if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
      if (parent_id === 'null' || parent_id === 'root') {
        conditions.push(`c.parent_id IS NULL`);
      } else {
        params.push(parent_id);
        conditions.push(`c.parent_id = $${params.length}`);
      }
    }

    if (is_featured !== undefined && is_featured !== '') {
      params.push(is_featured === 'true' || is_featured === true);
      conditions.push(`c.is_featured = $${params.length}`);
    }

    if (depth !== undefined && depth !== '') {
      params.push(parseInt(depth, 10));
      conditions.push(`c.depth = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields = {
      display_order: 'c.display_order',
      sort_order: 'c.sort_order',
      name: 'c.name',
      created_at: 'c.created_at',
      status: 'c.status',
      depth: 'c.depth',
    };
    const sortField = allowedSortFields[sort_by] || 'c.display_order';
    const sortDir = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const countQuery = `SELECT COUNT(*) FROM listing_categories c ${whereClause}`;
    const countRes = await query(countQuery, params);
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const dataQuery = `
      SELECT
        c.*,
        p.name AS parent_name,
        p.slug AS parent_slug,
        (SELECT COUNT(*) FROM listing_categories ch WHERE ch.parent_id = c.id AND ch.deleted_at IS NULL) AS child_count,
        (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id AND s.deleted_at IS NULL) AS service_count,
        (SELECT COUNT(*) FROM digital_products dp WHERE dp.category_id = c.id AND dp.deleted_at IS NULL) AS product_count,
        (SELECT COUNT(*) FROM category_attributes ca WHERE ca.category_id = c.id AND ca.status = 'active') AS attribute_count,
        (SELECT COUNT(*) FROM category_banners cb WHERE cb.category_id = c.id AND cb.status = 'active') AS banner_count
      FROM listing_categories c
      LEFT JOIN listing_categories p ON p.id = c.parent_id
      ${whereClause}
      ORDER BY ${sortField} ${sortDir}, c.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit, 10), offset);
    const dataRes = await query(dataQuery, params);

    return {
      categories: dataRes.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        total_pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  // ── 3. FULL RECURSIVE CATEGORY TREE ─────────────────────────────────────────
  async getTree(typeFilter = null) {
    let whereClause = `WHERE c.deleted_at IS NULL AND c.status = 'published'`;
    const params = [];
    if (typeFilter) {
      params.push(typeFilter);
      whereClause += ` AND (c.category_type = $1 OR c.category_type = 'shared')`;
    }

    const res = await query(
      `SELECT c.id, c.parent_id, c.name, c.slug, c.description, c.icon_name, c.depth, c.display_order,
              c.category_type, c.status, c.visibility, c.is_featured,
              (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id AND s.deleted_at IS NULL) AS service_count,
              (SELECT COUNT(*) FROM digital_products dp WHERE dp.category_id = c.id AND dp.deleted_at IS NULL) AS product_count
       FROM listing_categories c
       ${whereClause}
       ORDER BY c.depth ASC, c.display_order ASC, c.name ASC`,
      params
    );

    const map = {};
    const roots = [];

    res.rows.forEach((cat) => {
      map[cat.id] = { ...cat, children: [] };
    });

    res.rows.forEach((cat) => {
      if (cat.parent_id && map[cat.parent_id]) {
        map[cat.parent_id].children.push(map[cat.id]);
      } else {
        roots.push(map[cat.id]);
      }
    });

    return roots;
  }

  // ── 4. CATEGORY BY ID (HYDRATED WORKSPACE) ──────────────────────────────────
  async getCategoryById(id) {
    const res = await query(
      `SELECT c.*,
              p.name AS parent_name,
              p.slug AS parent_slug,
              u.display_name AS creator_name,
              u.email AS creator_email
       FROM listing_categories c
       LEFT JOIN listing_categories p ON p.id = c.parent_id
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1`,
      [id]
    );

    if (res.rows.length === 0) throw new NotFoundError('Category');
    const category = res.rows[0];

    // Children
    const childrenRes = await query(
      `SELECT ch.*,
              (SELECT COUNT(*) FROM services s WHERE s.category_id = ch.id) AS service_count,
              (SELECT COUNT(*) FROM digital_products dp WHERE dp.category_id = ch.id) AS product_count
       FROM listing_categories ch
       WHERE ch.parent_id = $1 AND ch.deleted_at IS NULL
       ORDER BY ch.display_order ASC, ch.name ASC`,
      [id]
    );

    // Breadcrumbs
    const breadcrumbs = await this.getBreadcrumbs(id);

    // Assigned Services
    const servicesRes = await query(
      `SELECT s.id, s.title, s.slug, s.status, s.starting_price_cents, s.created_at,
              u.display_name AS seller_name
       FROM services s
       LEFT JOIN users u ON u.id = s.seller_id
       WHERE s.category_id = $1 AND s.deleted_at IS NULL
       ORDER BY s.created_at DESC LIMIT 15`,
      [id]
    );

    // Assigned Digital Products
    const productsRes = await query(
      `SELECT dp.id, dp.title, dp.slug, dp.status, COALESCE(dp.price_commercial_cents, dp.price_personal_cents, 0) AS price_cents, dp.created_at,
              u.display_name AS seller_name
       FROM digital_products dp
       LEFT JOIN users u ON u.id = dp.seller_id
       WHERE dp.category_id = $1 AND dp.deleted_at IS NULL
       ORDER BY dp.created_at DESC LIMIT 15`,
      [id]
    );

    // Assigned Attributes
    const attributesRes = await query(
      `SELECT * FROM category_attributes
       WHERE category_id = $1 AND status = 'active'
       ORDER BY display_order ASC, name ASC`,
      [id]
    );

    // Banners
    const bannersRes = await query(
      `SELECT * FROM category_banners
       WHERE category_id = $1
       ORDER BY display_priority ASC, created_at DESC`,
      [id]
    );

    // Redirects
    const redirectsRes = await query(
      `SELECT * FROM category_redirects
       WHERE category_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // History
    const historyRes = await query(
      `SELECT h.*, u.display_name AS actor_name
       FROM category_history h
       LEFT JOIN users u ON u.id = h.actor_id
       WHERE h.category_id = $1
       ORDER BY h.created_at DESC LIMIT 50`,
      [id]
    );

    return {
      category,
      breadcrumbs,
      children: childrenRes.rows,
      services: servicesRes.rows,
      products: productsRes.rows,
      attributes: attributesRes.rows,
      banners: bannersRes.rows,
      redirects: redirectsRes.rows,
      history: historyRes.rows,
    };
  }

  // ── 5. BREADCRUMBS ANCESTOR LOOKUP ──────────────────────────────────────────
  async getBreadcrumbs(categoryId) {
    const breadcrumbs = [];
    let currentId = categoryId;
    let guard = 0;

    while (currentId && guard < 10) {
      guard++;
      const res = await query(
        `SELECT id, name, slug, parent_id, depth FROM listing_categories WHERE id = $1`,
        [currentId]
      );
      if (res.rows.length === 0) break;
      const item = res.rows[0];
      breadcrumbs.unshift(item);
      currentId = item.parent_id;
    }

    return breadcrumbs;
  }

  // ── 6. CREATE CATEGORY ──────────────────────────────────────────────────────
  async createCategory(data, actorId) {
    let {
      name,
      slug,
      description,
      short_description,
      parent_id,
      category_type = 'shared',
      status = 'published',
      visibility = 'public',
      icon_name = 'Folder',
      is_featured = false,
      show_on_homepage = true,
      show_in_navigation = true,
      show_in_marketplace = true,
      display_order = 0,
      seo_title,
      meta_description,
      canonical_url,
      og_title,
      og_description,
      og_image,
      index_status = 'index',
      follow_status = 'follow',
    } = data;

    if (!name || !name.trim()) throw new BadRequestError('Category name is required');
    slug = (slug || makeSlug(name, false)).toLowerCase().trim();

    // Check slug uniqueness
    const slugCheck = await query(`SELECT id FROM listing_categories WHERE slug = $1`, [slug]);
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Determine depth
    let depth = 0;
    if (parent_id) {
      const parentRes = await query(`SELECT id, depth FROM listing_categories WHERE id = $1`, [parent_id]);
      if (parentRes.rows.length === 0) throw new BadRequestError('Parent category not found');
      depth = (parentRes.rows[0].depth || 0) + 1;
      if (depth > 5) throw new BadRequestError('Maximum category nesting depth reached');
    }

    const res = await query(
      `INSERT INTO listing_categories (
        name, slug, description, short_description, parent_id, depth, sort_order, display_order,
        icon_name, category_type, status, visibility, is_featured, show_on_homepage, show_in_navigation,
        show_in_marketplace, seo_title, meta_description, canonical_url, og_title, og_description,
        og_image, index_status, follow_status, created_by, is_active, published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::smallint, $7::integer,
        $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, true, NOW()
      ) RETURNING *`,
      [
        name.trim(),
        slug,
        description || null,
        short_description || null,
        parent_id || null,
        depth,
        parseInt(display_order || 0, 10),
        icon_name || 'Folder',
        category_type,
        status,
        visibility,
        !!is_featured,
        !!show_on_homepage,
        !!show_in_navigation,
        !!show_in_marketplace,
        seo_title || `${name.trim()} | Desigot Marketplace`,
        meta_description || description?.slice(0, 160) || `Explore ${name.trim()} on Desigot.`,
        canonical_url || `https://desigot.com/categories/${slug}`,
        og_title || name.trim(),
        og_description || meta_description || null,
        og_image || null,
        index_status,
        follow_status,
        actorId,
      ]
    );

    const created = res.rows[0];
    await recordCategoryHistory(created.id, 'category.created', actorId, 'Category initialized', null, created);
    return created;
  }

  // ── 7. UPDATE CATEGORY ──────────────────────────────────────────────────────
  async updateCategory(id, data, actorId) {
    const existingRes = await query(`SELECT * FROM listing_categories WHERE id = $1`, [id]);
    if (existingRes.rows.length === 0) throw new NotFoundError('Category');
    const existing = existingRes.rows[0];

    let newSlug = data.slug ? data.slug.toLowerCase().trim() : existing.slug;
    if (newSlug !== existing.slug) {
      // Slug changed: create 301 redirect
      const slugCheck = await query(`SELECT id FROM listing_categories WHERE slug = $1 AND id != $2`, [newSlug, id]);
      if (slugCheck.rows.length > 0) throw new ConflictError('Slug is already in use by another category');

      await query(
        `INSERT INTO category_redirects (category_id, old_slug, new_slug, http_status_code)
         VALUES ($1, $2, $3, 301)`,
        [id, existing.slug, newSlug]
      );
      await recordCategoryHistory(id, 'category.slug_redirect_created', actorId, `Redirect from ${existing.slug} to ${newSlug}`);
    }

    // Prevent circular hierarchy
    let newParentId = data.parent_id !== undefined ? data.parent_id : existing.parent_id;
    if (newParentId === id) throw new BadRequestError('A category cannot be its own parent');

    let depth = existing.depth;
    if (newParentId !== existing.parent_id) {
      if (newParentId) {
        // Check not a descendant
        const descendants = await this.getDescendantIds(id);
        if (descendants.includes(newParentId)) {
          throw new BadRequestError('Cannot move a category into one of its own descendants');
        }
        const parentRes = await query(`SELECT depth FROM listing_categories WHERE id = $1`, [newParentId]);
        depth = (parentRes.rows[0]?.depth || 0) + 1;
      } else {
        depth = 0;
      }
    }

    const res = await query(
      `UPDATE listing_categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           short_description = COALESCE($4, short_description),
           parent_id = $5,
           depth = $6,
           category_type = COALESCE($7, category_type),
           status = COALESCE($8, status),
           visibility = COALESCE($9, visibility),
           icon_name = COALESCE($10, icon_name),
           is_featured = COALESCE($11, is_featured),
           show_on_homepage = COALESCE($12, show_on_homepage),
           show_in_navigation = COALESCE($13, show_in_navigation),
           show_in_marketplace = COALESCE($14, show_in_marketplace),
           display_order = COALESCE($15::integer, display_order),
           sort_order = COALESCE($15::smallint, sort_order),
           seo_title = COALESCE($16, seo_title),
           meta_description = COALESCE($17, meta_description),
           canonical_url = COALESCE($18, canonical_url),
           og_title = COALESCE($19, og_title),
           og_description = COALESCE($20, og_description),
           og_image = COALESCE($21, og_image),
           index_status = COALESCE($22, index_status),
           follow_status = COALESCE($23, follow_status),
           updated_by = $24,
           updated_at = NOW()
       WHERE id = $25 RETURNING *`,
      [
        data.name?.trim(),
        newSlug,
        data.description,
        data.short_description,
        newParentId || null,
        depth,
        data.category_type,
        data.status,
        data.visibility,
        data.icon_name,
        data.is_featured,
        data.show_on_homepage,
        data.show_in_navigation,
        data.show_in_marketplace,
        data.display_order,
        data.seo_title,
        data.meta_description,
        data.canonical_url,
        data.og_title,
        data.og_description,
        data.og_image,
        data.index_status,
        data.follow_status,
        actorId,
        id,
      ]
    );

    const updated = res.rows[0];
    await recordCategoryHistory(id, 'category.updated', actorId, 'Category attributes updated', existing, updated);
    return updated;
  }

  // ── 8. GET ALL DESCENDANT IDS (RECURSIVE) ───────────────────────────────────
  async getDescendantIds(categoryId) {
    const res = await query(
      `WITH RECURSIVE category_tree AS (
        SELECT id FROM listing_categories WHERE id = $1
        UNION ALL
        SELECT c.id FROM listing_categories c
        JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT id FROM category_tree WHERE id != $1`,
      [categoryId]
    );
    return res.rows.map((r) => r.id);
  }

  // ── 9. DELETE OR ARCHIVE CATEGORY ──────────────────────────────────────────
  async deleteCategory(id, actorId) {
    // Check if referenced by services or digital products
    const srvCheck = await query(`SELECT COUNT(*) FROM services WHERE category_id = $1 AND deleted_at IS NULL`, [id]);
    const prodCheck = await query(`SELECT COUNT(*) FROM digital_products WHERE category_id = $1 AND deleted_at IS NULL`, [id]);
    const childCheck = await query(`SELECT COUNT(*) FROM listing_categories WHERE parent_id = $1 AND deleted_at IS NULL`, [id]);

    const srvCount = parseInt(srvCheck.rows[0]?.count || 0, 10);
    const prodCount = parseInt(prodCheck.rows[0]?.count || 0, 10);
    const childCount = parseInt(childCheck.rows[0]?.count || 0, 10);

    if (srvCount > 0 || prodCount > 0 || childCount > 0) {
      // Cannot hard delete; soft-archive to preserve referential integrity
      const res = await query(
        `UPDATE listing_categories
         SET status = 'archived', is_active = FALSE, deleted_at = NOW(), updated_by = $1
         WHERE id = $2 RETURNING *`,
        [actorId, id]
      );
      await recordCategoryHistory(id, 'category.archived', actorId, `Referenced by ${srvCount} services, ${prodCount} products, ${childCount} children`);
      return { message: 'Category safely archived to protect active references', category: res.rows[0] };
    }

    // Not referenced: hard delete safely
    const oldCat = (await query(`SELECT * FROM listing_categories WHERE id = $1`, [id])).rows[0];
    await recordCategoryHistory(id, 'category.deleted', actorId, 'Unreferenced category permanently deleted', oldCat, null);
    await query(`DELETE FROM listing_categories WHERE id = $1`, [id]);
    return { message: 'Category deleted permanently' };
  }

  // ── 10. RESTORE ARCHIVED CATEGORY ──────────────────────────────────────────
  async restoreCategory(id, actorId) {
    const res = await query(
      `UPDATE listing_categories
       SET status = 'published', is_active = TRUE, deleted_at = NULL, updated_by = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [actorId, id]
    );
    if (res.rows.length === 0) throw new NotFoundError('Category');
    await recordCategoryHistory(id, 'category.restored', actorId, 'Restored to published marketplace state');
    return res.rows[0];
  }

  // ── 11. REORDER CATEGORIES ──────────────────────────────────────────────────
  async reorderCategories(orderedIds = [], actorId) {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new BadRequestError('orderedIds must be a non-empty array of UUIDs');
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await query(
        `UPDATE listing_categories
         SET display_order = $1::integer, sort_order = $1::smallint, updated_at = NOW()
         WHERE id = $2`,
        [i + 1, orderedIds[i]]
      );
    }

    await recordCategoryHistory(orderedIds[0], 'category.reordered', actorId, `Reordered ${orderedIds.length} categories`);
    return { success: true, count: orderedIds.length };
  }

  // ── 12. DYNAMIC ATTRIBUTES MANAGEMENT ───────────────────────────────────────
  async listAttributes(categoryId = null) {
    if (categoryId) {
      // Inherit ancestors' attributes as well
      const ancestors = await this.getBreadcrumbs(categoryId);
      const ancestorIds = ancestors.map((a) => a.id);

      const res = await query(
        `SELECT a.*, c.name AS category_name, c.slug AS category_slug
         FROM category_attributes a
         JOIN listing_categories c ON c.id = a.category_id
         WHERE a.category_id = ANY($1::UUID[]) AND a.status = 'active'
         ORDER BY a.display_order ASC, a.name ASC`,
        [ancestorIds]
      );
      return res.rows;
    }

    const res = await query(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug
       FROM category_attributes a
       JOIN listing_categories c ON c.id = a.category_id
       WHERE a.status = 'active'
       ORDER BY a.created_at DESC`
    );
    return res.rows;
  }

  async createAttribute(data, actorId) {
    const {
      category_id,
      name,
      key,
      type = 'text',
      description,
      placeholder,
      is_required = false,
      is_filterable = true,
      is_searchable = true,
      allowed_values = [],
      display_order = 0,
    } = data;

    if (!category_id || !name || !key) throw new BadRequestError('category_id, name, and key are required');

    const res = await query(
      `INSERT INTO category_attributes (
        category_id, name, key, type, description, placeholder, is_required, is_filterable,
        is_searchable, allowed_values, display_order, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
      RETURNING *`,
      [
        category_id,
        name.trim(),
        key.toLowerCase().trim(),
        type,
        description || null,
        placeholder || null,
        !!is_required,
        !!is_filterable,
        !!is_searchable,
        JSON.stringify(allowed_values || []),
        parseInt(display_order || 0, 10),
      ]
    );

    await recordCategoryHistory(category_id, 'category.attribute_created', actorId, `Added attribute ${name}`);
    return res.rows[0];
  }

  async deleteAttribute(id, actorId) {
    const res = await query(`DELETE FROM category_attributes WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new NotFoundError('Attribute');
    return { message: 'Attribute deleted successfully' };
  }

  // ── 13. ICONS LIBRARY ───────────────────────────────────────────────────────
  async listIcons() {
    const res = await query(`SELECT * FROM category_icons WHERE status = 'active' ORDER BY name ASC`);
    return res.rows;
  }

  async createIcon(data, actorId) {
    const { name, icon_type = 'library', icon_ref, svg_content, file_format = 'svg' } = data;
    if (!name || !icon_ref) throw new BadRequestError('name and icon_ref are required');

    const res = await query(
      `INSERT INTO category_icons (name, icon_type, icon_ref, svg_content, file_format, dimensions, status)
       VALUES ($1, $2, $3, $4, $5, '24x24', 'active')
       RETURNING *`,
      [name, icon_type, icon_ref, svg_content || null, file_format]
    );
    return res.rows[0];
  }

  // ── 14. BANNERS MANAGEMENT ──────────────────────────────────────────────────
  async listBanners(categoryId = null) {
    if (categoryId) {
      const res = await query(
        `SELECT b.*, c.name AS category_name, c.slug AS category_slug
         FROM category_banners b
         JOIN listing_categories c ON c.id = b.category_id
         WHERE b.category_id = $1
         ORDER BY b.display_priority ASC, b.created_at DESC`,
        [categoryId]
      );
      return res.rows;
    }

    const res = await query(
      `SELECT b.*, c.name AS category_name, c.slug AS category_slug
       FROM category_banners b
       JOIN listing_categories c ON c.id = b.category_id
       ORDER BY b.created_at DESC`
    );
    return res.rows;
  }

  async createBanner(data, actorId) {
    const {
      category_id,
      name,
      desktop_image_url,
      tablet_image_url,
      mobile_image_url,
      alt_text,
      banner_link,
      display_priority = 1,
    } = data;

    if (!category_id || !name || !desktop_image_url) {
      throw new BadRequestError('category_id, name, and desktop_image_url are required');
    }

    const res = await query(
      `INSERT INTO category_banners (
        category_id, name, desktop_image_url, tablet_image_url, mobile_image_url,
        alt_text, banner_link, display_priority, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
      RETURNING *`,
      [
        category_id,
        name,
        desktop_image_url,
        tablet_image_url || desktop_image_url,
        mobile_image_url || desktop_image_url,
        alt_text || null,
        banner_link || null,
        parseInt(display_priority || 1, 10),
      ]
    );

    await recordCategoryHistory(category_id, 'category.banner_uploaded', actorId, `Added banner ${name}`);
    return res.rows[0];
  }

  async deleteBanner(id, actorId) {
    const res = await query(`DELETE FROM category_banners WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new NotFoundError('Banner');
    return { message: 'Banner deleted successfully' };
  }

  // ── 15. SEO & REDIRECTS ─────────────────────────────────────────────────────
  async listRedirects() {
    const res = await query(
      `SELECT r.*, c.name AS category_name
       FROM category_redirects r
       JOIN listing_categories c ON c.id = r.category_id
       ORDER BY r.created_at DESC`
    );
    return res.rows;
  }

  async createRedirect(categoryId, oldSlug, newSlug) {
    const res = await query(
      `INSERT INTO category_redirects (category_id, old_slug, new_slug, http_status_code)
       VALUES ($1, $2, $3, 301)
       RETURNING *`,
      [categoryId, oldSlug.toLowerCase().trim(), newSlug.toLowerCase().trim()]
    );
    return res.rows[0];
  }

  // ── 16. CSV EXPORT ──────────────────────────────────────────────────────────
  async exportCsv() {
    const res = await query(
      `SELECT c.id, c.name, c.slug, c.category_type, c.status, c.visibility, c.depth, c.display_order,
              p.name AS parent_name, c.created_at, c.seo_title
       FROM listing_categories c
       LEFT JOIN listing_categories p ON p.id = c.parent_id
       WHERE c.deleted_at IS NULL
       ORDER BY c.depth ASC, c.display_order ASC`
    );

    const headers = ['ID', 'Name', 'Slug', 'Type', 'Status', 'Visibility', 'Depth', 'Display Order', 'Parent Category', 'SEO Title', 'Created At'];
    const rows = res.rows.map((r) => [
      r.id,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      r.slug,
      r.category_type,
      r.status,
      r.visibility,
      r.depth,
      r.display_order,
      `"${(r.parent_name || '').replace(/"/g, '""')}"`,
      `"${(r.seo_title || '').replace(/"/g, '""')}"`,
      r.created_at ? new Date(r.created_at).toISOString() : '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

module.exports = new CategoriesTaxonomyService();
