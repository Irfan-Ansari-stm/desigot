'use strict';

const pool = require('../../db/pool');

class CMSService {
  // ── Helper: Audit Logging ──────────────────────────────────────────────────
  async logAction(clientOrPool, action, entity, entityId, userId, description, metadata = {}, ip = '127.0.0.1') {
    try {
      await (clientOrPool || pool).query(`
        INSERT INTO cms_audit_logs (action_type, entity_type, entity_id, user_id, description, metadata, ip_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [action, entity, entityId || null, userId || null, description, JSON.stringify(metadata), ip]);
    } catch (err) {
      console.error('Audit log failed:', err.message);
    }
  }

  // ===========================================================================
  // 0. KPI & SUMMARY STATS
  // ===========================================================================
  async getStatsSummary() {
    const pagesCount = await pool.query(`SELECT COUNT(*) FROM cms_static_pages WHERE status = 'published'`);
    const blogCount = await pool.query(`SELECT COUNT(*) FROM blog_posts WHERE status = 'published'`);
    const mediaCount = await pool.query(`SELECT COUNT(*) FROM cms_media_assets`);
    const faqsCount = await pool.query(`SELECT COUNT(*) FROM cms_faqs WHERE is_published = true`);
    const contactNew = await pool.query(`SELECT COUNT(*) FROM cms_contact_submissions WHERE status = 'new'`);
    const heroSlides = await pool.query(`SELECT COUNT(*) FROM cms_hero_sections WHERE is_active = true`);
    const totalViews = await pool.query(`SELECT COALESCE(SUM(views_count), 0) AS total FROM blog_posts`);

    return {
      activePages: parseInt(pagesCount.rows[0].count, 10),
      publishedBlogPosts: parseInt(blogCount.rows[0].count, 10),
      mediaAssets: parseInt(mediaCount.rows[0].count, 10),
      publishedFaqs: parseInt(faqsCount.rows[0].count, 10),
      pendingInquiries: parseInt(contactNew.rows[0].count, 10),
      activeHeroSlides: parseInt(heroSlides.rows[0].count, 10),
      totalBlogViews: parseInt(totalViews.rows[0].total, 10)
    };
  }

  // ===========================================================================
  // 1. HOMEPAGE MANAGEMENT
  // ===========================================================================
  async getHomepageSettings() {
    const res = await pool.query(`SELECT * FROM cms_homepage_settings LIMIT 1`);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async updateHomepageSettings(data, userId) {
    const current = await this.getHomepageSettings();
    if (!current) {
      const ins = await pool.query(`
        INSERT INTO cms_homepage_settings (
          page_title, meta_description, hero_id, announcement_bar_enabled, announcement_bar_text,
          announcement_bar_link, sections_order, is_published, updated_by_id, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *;
      `, [
        data.page_title || 'Desigot Marketplace',
        data.meta_description || '',
        data.hero_id || null,
        data.announcement_bar_enabled ?? true,
        data.announcement_bar_text || '',
        data.announcement_bar_link || '/browse',
        JSON.stringify(data.sections_order || []),
        data.is_published ?? true,
        userId
      ]);
      await this.logAction(pool, 'update', 'homepage', ins.rows[0].id, userId, 'Created initial homepage settings');
      return ins.rows[0];
    }

    const updated = await pool.query(`
      UPDATE cms_homepage_settings
      SET page_title = COALESCE($1, page_title),
          meta_description = COALESCE($2, meta_description),
          hero_id = $3,
          announcement_bar_enabled = COALESCE($4, announcement_bar_enabled),
          announcement_bar_text = COALESCE($5, announcement_bar_text),
          announcement_bar_link = COALESCE($6, announcement_bar_link),
          sections_order = COALESCE($7, sections_order),
          is_published = COALESCE($8, is_published),
          updated_by_id = $9,
          updated_at = NOW()
      WHERE id = $10
      RETURNING *;
    `, [
      data.page_title,
      data.meta_description,
      data.hero_id !== undefined ? data.hero_id : current.hero_id,
      data.announcement_bar_enabled,
      data.announcement_bar_text,
      data.announcement_bar_link,
      data.sections_order ? JSON.stringify(data.sections_order) : null,
      data.is_published,
      userId,
      current.id
    ]);

    await this.logAction(pool, 'update', 'homepage', current.id, userId, 'Updated homepage global settings');
    return updated.rows[0];
  }

  async getHomepageSections() {
    const res = await pool.query(`SELECT * FROM cms_homepage_sections ORDER BY sort_order ASC`);
    return res.rows;
  }

  async updateHomepageSectionsOrder(orderedKeys, userId) {
    for (let i = 0; i < orderedKeys.length; i++) {
      await pool.query(`
        UPDATE cms_homepage_sections
        SET sort_order = $1, updated_at = NOW()
        WHERE section_key = $2;
      `, [i + 1, orderedKeys[i]]);
    }
    await this.logAction(pool, 'reorder', 'homepage', null, userId, 'Reordered homepage sections', { orderedKeys });
    return this.getHomepageSections();
  }

  async updateHomepageSection(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_homepage_sections
      SET title = COALESCE($1, title),
          subtitle = COALESCE($2, subtitle),
          display_layout = COALESCE($3, display_layout),
          grid_columns = COALESCE($4, grid_columns),
          display_count = COALESCE($5, display_count),
          is_active = COALESCE($6, is_active),
          config = COALESCE($7, config),
          updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `, [
      data.title,
      data.subtitle,
      data.display_layout,
      data.grid_columns,
      data.display_count,
      data.is_active,
      data.config ? JSON.stringify(data.config) : null,
      id
    ]);
    if (res.rows.length === 0) throw new Error('Homepage section not found');
    await this.logAction(pool, 'update', 'homepage', id, userId, `Updated section ${res.rows[0].section_key}`);
    return res.rows[0];
  }

  // ===========================================================================
  // 2. HERO SECTION & SLIDES
  // ===========================================================================
  async getHeroSections(query = {}) {
    let sql = `SELECT * FROM cms_hero_sections WHERE 1=1`;
    const params = [];
    if (query.active !== undefined) {
      params.push(query.active === 'true' || query.active === true);
      sql += ` AND is_active = $${params.length}`;
    }
    sql += ` ORDER BY priority ASC, created_at DESC`;
    const res = await pool.query(sql, params);
    return res.rows;
  }

  async getHeroSectionById(id) {
    const res = await pool.query(`SELECT * FROM cms_hero_sections WHERE id = $1`, [id]);
    if (res.rows.length === 0) throw new Error('Hero slide not found');
    return res.rows[0];
  }

  async createHeroSection(data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_hero_sections (
        name, title, subtitle, description, desktop_image_url, tablet_image_url, mobile_image_url,
        primary_cta_text, primary_cta_url, secondary_cta_text, secondary_cta_url, text_align,
        text_color, overlay_color, overlay_opacity, priority, is_active, start_date, end_date, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *;
    `, [
      data.name,
      data.title,
      data.subtitle || null,
      data.description || null,
      data.desktop_image_url,
      data.tablet_image_url || null,
      data.mobile_image_url || null,
      data.primary_cta_text || 'Explore Marketplace',
      data.primary_cta_url || '/browse',
      data.secondary_cta_text || 'Hire Designers',
      data.secondary_cta_url || '/browse?listing_type=service',
      data.text_align || 'center',
      data.text_color || '#FFFFFF',
      data.overlay_color || '#0B0F19',
      data.overlay_opacity || 0.50,
      data.priority || 1,
      data.is_active ?? true,
      data.start_date || new Date(),
      data.end_date || null,
      userId
    ]);
    await this.logAction(pool, 'create', 'hero', res.rows[0].id, userId, `Created hero slide: ${data.name}`);
    return res.rows[0];
  }

  async updateHeroSection(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_hero_sections
      SET name = COALESCE($1, name),
          title = COALESCE($2, title),
          subtitle = COALESCE($3, subtitle),
          description = COALESCE($4, description),
          desktop_image_url = COALESCE($5, desktop_image_url),
          tablet_image_url = COALESCE($6, tablet_image_url),
          mobile_image_url = COALESCE($7, mobile_image_url),
          primary_cta_text = COALESCE($8, primary_cta_text),
          primary_cta_url = COALESCE($9, primary_cta_url),
          secondary_cta_text = COALESCE($10, secondary_cta_text),
          secondary_cta_url = COALESCE($11, secondary_cta_url),
          text_align = COALESCE($12, text_align),
          text_color = COALESCE($13, text_color),
          overlay_color = COALESCE($14, overlay_color),
          overlay_opacity = COALESCE($15, overlay_opacity),
          priority = COALESCE($16, priority),
          is_active = COALESCE($17, is_active),
          start_date = COALESCE($18, start_date),
          end_date = $19,
          updated_at = NOW()
      WHERE id = $20
      RETURNING *;
    `, [
      data.name, data.title, data.subtitle, data.description, data.desktop_image_url,
      data.tablet_image_url, data.mobile_image_url, data.primary_cta_text, data.primary_cta_url,
      data.secondary_cta_text, data.secondary_cta_url, data.text_align, data.text_color,
      data.overlay_color, data.overlay_opacity, data.priority, data.is_active,
      data.start_date, data.end_date, id
    ]);
    if (res.rows.length === 0) throw new Error('Hero slide not found');
    await this.logAction(pool, 'update', 'hero', id, userId, `Updated hero slide: ${res.rows[0].name}`);
    return res.rows[0];
  }

  async deleteHeroSection(id, userId) {
    const res = await pool.query(`DELETE FROM cms_hero_sections WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Hero slide not found');
    await this.logAction(pool, 'delete', 'hero', id, userId, `Deleted hero slide: ${res.rows[0].name}`);
    return { success: true, message: 'Hero slide deleted successfully' };
  }

  async toggleHeroStatus(id, userId) {
    const res = await pool.query(`
      UPDATE cms_hero_sections
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [id]);
    if (res.rows.length === 0) throw new Error('Hero slide not found');
    await this.logAction(pool, 'update', 'hero', id, userId, `Toggled hero slide status to ${res.rows[0].is_active}`);
    return res.rows[0];
  }

  // ===========================================================================
  // 3. NAVIGATION MENUS & ITEMS
  // ===========================================================================
  async getMenus() {
    const menus = await pool.query(`SELECT * FROM cms_menus ORDER BY created_at ASC`);
    for (const menu of menus.rows) {
      const items = await pool.query(`
        SELECT * FROM cms_menu_items
        WHERE menu_id = $1
        ORDER BY sort_order ASC
      `, [menu.id]);
      menu.items = items.rows;
    }
    return menus.rows;
  }

  async getMenuByKey(key) {
    const res = await pool.query(`SELECT * FROM cms_menus WHERE menu_key = $1`, [key]);
    if (res.rows.length === 0) return null;
    const menu = res.rows[0];
    const items = await pool.query(`
      SELECT * FROM cms_menu_items
      WHERE menu_id = $1
      ORDER BY sort_order ASC
    `, [menu.id]);
    menu.items = items.rows;
    return menu;
  }

  async createMenu(data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_menus (menu_key, title, location, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [data.menu_key, data.title, data.location || 'header', data.is_active ?? true]);
    await this.logAction(pool, 'create', 'navigation', res.rows[0].id, userId, `Created menu: ${data.title}`);
    return res.rows[0];
  }

  async updateMenu(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_menus
      SET title = COALESCE($1, title),
          location = COALESCE($2, location),
          is_active = COALESCE($3, is_active),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `, [data.title, data.location, data.is_active, id]);
    if (res.rows.length === 0) throw new Error('Menu not found');
    await this.logAction(pool, 'update', 'navigation', id, userId, `Updated menu: ${res.rows[0].title}`);
    return res.rows[0];
  }

  async deleteMenu(id, userId) {
    const res = await pool.query(`DELETE FROM cms_menus WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Menu not found');
    await this.logAction(pool, 'delete', 'navigation', id, userId, `Deleted menu: ${res.rows[0].title}`);
    return { success: true };
  }

  async createMenuItem(menuId, data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_menu_items (
        menu_id, parent_id, label, item_type, target_url, icon, sort_order,
        target_blank, desktop_visible, mobile_visible, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `, [
      menuId,
      data.parent_id || null,
      data.label,
      data.item_type || 'internal_page',
      data.target_url,
      data.icon || null,
      data.sort_order || 1,
      data.target_blank ?? false,
      data.desktop_visible ?? true,
      data.mobile_visible ?? true,
      data.is_active ?? true
    ]);
    await this.logAction(pool, 'create', 'navigation', res.rows[0].id, userId, `Created menu item: ${data.label}`);
    return res.rows[0];
  }

  async updateMenuItem(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_menu_items
      SET parent_id = $1,
          label = COALESCE($2, label),
          item_type = COALESCE($3, item_type),
          target_url = COALESCE($4, target_url),
          icon = COALESCE($5, icon),
          sort_order = COALESCE($6, sort_order),
          target_blank = COALESCE($7, target_blank),
          desktop_visible = COALESCE($8, desktop_visible),
          mobile_visible = COALESCE($9, mobile_visible),
          is_active = COALESCE($10, is_active),
          updated_at = NOW()
      WHERE id = $11
      RETURNING *;
    `, [
      data.parent_id !== undefined ? data.parent_id : null,
      data.label, data.item_type, data.target_url, data.icon, data.sort_order,
      data.target_blank, data.desktop_visible, data.mobile_visible, data.is_active, id
    ]);
    if (res.rows.length === 0) throw new Error('Menu item not found');
    await this.logAction(pool, 'update', 'navigation', id, userId, `Updated menu item: ${res.rows[0].label}`);
    return res.rows[0];
  }

  async deleteMenuItem(id, userId) {
    const res = await pool.query(`DELETE FROM cms_menu_items WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Menu item not found');
    await this.logAction(pool, 'delete', 'navigation', id, userId, `Deleted menu item: ${res.rows[0].label}`);
    return { success: true };
  }

  async reorderMenuItems(items, userId) {
    for (const item of items) {
      await pool.query(`
        UPDATE cms_menu_items
        SET sort_order = $1, parent_id = $2, updated_at = NOW()
        WHERE id = $3;
      `, [item.sort_order, item.parent_id || null, item.id]);
    }
    await this.logAction(pool, 'reorder', 'navigation', null, userId, 'Reordered menu items');
    return { success: true };
  }

  // ===========================================================================
  // 4. BROWSE MEGA MENU
  // ===========================================================================
  async getMegaMenu() {
    const cols = await pool.query(`SELECT * FROM cms_mega_menu_columns ORDER BY column_order ASC`);
    for (const col of cols.rows) {
      const items = await pool.query(`
        SELECT mmi.*, lc.name as category_name
        FROM cms_mega_menu_items mmi
        LEFT JOIN listing_categories lc ON mmi.category_id = lc.id
        WHERE mmi.column_id = $1
        ORDER BY mmi.sort_order ASC
      `, [col.id]);
      col.items = items.rows;
    }
    return cols.rows;
  }

  async createMegaMenuColumn(data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_mega_menu_columns (title, column_order, width_cols, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [data.title, data.column_order || 1, data.width_cols || 4, data.is_active ?? true]);
    await this.logAction(pool, 'create', 'mega_menu', res.rows[0].id, userId, `Created mega menu column: ${data.title}`);
    return res.rows[0];
  }

  async updateMegaMenuColumn(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_mega_menu_columns
      SET title = COALESCE($1, title),
          column_order = COALESCE($2, column_order),
          width_cols = COALESCE($3, width_cols),
          is_active = COALESCE($4, is_active)
      WHERE id = $5
      RETURNING *;
    `, [data.title, data.column_order, data.width_cols, data.is_active, id]);
    if (res.rows.length === 0) throw new Error('Mega menu column not found');
    await this.logAction(pool, 'update', 'mega_menu', id, userId, `Updated mega menu column: ${res.rows[0].title}`);
    return res.rows[0];
  }

  async deleteMegaMenuColumn(id, userId) {
    const res = await pool.query(`DELETE FROM cms_mega_menu_columns WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Mega menu column not found');
    await this.logAction(pool, 'delete', 'mega_menu', id, userId, `Deleted mega menu column: ${res.rows[0].title}`);
    return { success: true };
  }

  async createMegaMenuItem(columnId, data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_mega_menu_items (
        column_id, title, category_id, custom_url, icon, sort_order, is_featured, badge_text, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `, [
      columnId,
      data.title,
      data.category_id || null,
      data.custom_url || null,
      data.icon || null,
      data.sort_order || 1,
      data.is_featured ?? false,
      data.badge_text || null,
      data.is_active ?? true
    ]);
    await this.logAction(pool, 'create', 'mega_menu', res.rows[0].id, userId, `Created mega menu item: ${data.title}`);
    return res.rows[0];
  }

  async updateMegaMenuItem(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_mega_menu_items
      SET title = COALESCE($1, title),
          category_id = $2,
          custom_url = COALESCE($3, custom_url),
          icon = COALESCE($4, icon),
          sort_order = COALESCE($5, sort_order),
          is_featured = COALESCE($6, is_featured),
          badge_text = $7,
          is_active = COALESCE($8, is_active)
      WHERE id = $9
      RETURNING *;
    `, [
      data.title,
      data.category_id !== undefined ? data.category_id : null,
      data.custom_url,
      data.icon,
      data.sort_order,
      data.is_featured,
      data.badge_text !== undefined ? data.badge_text : null,
      data.is_active,
      id
    ]);
    if (res.rows.length === 0) throw new Error('Mega menu item not found');
    await this.logAction(pool, 'update', 'mega_menu', id, userId, `Updated mega menu item: ${res.rows[0].title}`);
    return res.rows[0];
  }

  async deleteMegaMenuItem(id, userId) {
    const res = await pool.query(`DELETE FROM cms_mega_menu_items WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Mega menu item not found');
    await this.logAction(pool, 'delete', 'mega_menu', id, userId, `Deleted mega menu item: ${res.rows[0].title}`);
    return { success: true };
  }

  // ===========================================================================
  // 5. SERVICES PAGE & CATEGORIES PAGE SETTINGS
  // ===========================================================================
  async getServicesPageSettings() {
    const res = await pool.query(`SELECT * FROM cms_services_page_settings LIMIT 1`);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async updateServicesPageSettings(data, userId) {
    const current = await this.getServicesPageSettings();
    if (!current) {
      const ins = await pool.query(`
        INSERT INTO cms_services_page_settings (
          page_title, subtitle, banner_url, featured_service_ids, faq_category_id, config, updated_by_id, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *;
      `, [
        data.page_title || 'Services',
        data.subtitle || '',
        data.banner_url || null,
        data.featured_service_ids || null,
        data.faq_category_id || null,
        JSON.stringify(data.config || {}),
        userId
      ]);
      await this.logAction(pool, 'update', 'services_page', ins.rows[0].id, userId, 'Created services page settings');
      return ins.rows[0];
    }

    const res = await pool.query(`
      UPDATE cms_services_page_settings
      SET page_title = COALESCE($1, page_title),
          subtitle = COALESCE($2, subtitle),
          banner_url = COALESCE($3, banner_url),
          featured_service_ids = COALESCE($4, featured_service_ids),
          faq_category_id = $5,
          config = COALESCE($6, config),
          updated_by_id = $7,
          updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `, [
      data.page_title,
      data.subtitle,
      data.banner_url,
      data.featured_service_ids,
      data.faq_category_id !== undefined ? data.faq_category_id : current.faq_category_id,
      data.config ? JSON.stringify(data.config) : null,
      userId,
      current.id
    ]);
    await this.logAction(pool, 'update', 'services_page', current.id, userId, 'Updated services page settings');
    return res.rows[0];
  }

  async getCategoriesPageSettings() {
    const res = await pool.query(`SELECT * FROM cms_categories_page_settings LIMIT 1`);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async updateCategoriesPageSettings(data, userId) {
    const current = await this.getCategoriesPageSettings();
    if (!current) {
      const ins = await pool.query(`
        INSERT INTO cms_categories_page_settings (
          page_title, description, banner_url, featured_category_ids, layout, config, updated_by_id, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *;
      `, [
        data.page_title || 'Categories',
        data.description || '',
        data.banner_url || null,
        data.featured_category_ids || null,
        data.layout || 'grid',
        JSON.stringify(data.config || {}),
        userId
      ]);
      await this.logAction(pool, 'update', 'categories_page', ins.rows[0].id, userId, 'Created categories page settings');
      return ins.rows[0];
    }

    const res = await pool.query(`
      UPDATE cms_categories_page_settings
      SET page_title = COALESCE($1, page_title),
          description = COALESCE($2, description),
          banner_url = COALESCE($3, banner_url),
          featured_category_ids = COALESCE($4, featured_category_ids),
          layout = COALESCE($5, layout),
          config = COALESCE($6, config),
          updated_by_id = $7,
          updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `, [
      data.page_title,
      data.description,
      data.banner_url,
      data.featured_category_ids,
      data.layout,
      data.config ? JSON.stringify(data.config) : null,
      userId,
      current.id
    ]);
    await this.logAction(pool, 'update', 'categories_page', current.id, userId, 'Updated categories page settings');
    return res.rows[0];
  }

  // ===========================================================================
  // 6. FEATURED SECTIONS & TRENDING SECTIONS
  // ===========================================================================
  async getFeaturedSections() {
    const res = await pool.query(`SELECT * FROM cms_featured_sections ORDER BY sort_order ASC`);
    return res.rows;
  }

  async createFeaturedSection(data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_featured_sections (
        name, heading, subtitle, section_type, item_ids, layout, grid_columns, sort_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `, [
      data.name, data.heading, data.subtitle || null, data.section_type,
      data.item_ids || null, data.layout || 'grid', data.grid_columns || 4,
      data.sort_order || 1, data.is_active ?? true
    ]);
    await this.logAction(pool, 'create', 'featured', res.rows[0].id, userId, `Created featured section: ${data.name}`);
    return res.rows[0];
  }

  async updateFeaturedSection(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_featured_sections
      SET name = COALESCE($1, name),
          heading = COALESCE($2, heading),
          subtitle = COALESCE($3, subtitle),
          section_type = COALESCE($4, section_type),
          item_ids = COALESCE($5, item_ids),
          layout = COALESCE($6, layout),
          grid_columns = COALESCE($7, grid_columns),
          sort_order = COALESCE($8, sort_order),
          is_active = COALESCE($9, is_active),
          updated_at = NOW()
      WHERE id = $10
      RETURNING *;
    `, [
      data.name, data.heading, data.subtitle, data.section_type,
      data.item_ids, data.layout, data.grid_columns, data.sort_order,
      data.is_active, id
    ]);
    if (res.rows.length === 0) throw new Error('Featured section not found');
    await this.logAction(pool, 'update', 'featured', id, userId, `Updated featured section: ${res.rows[0].name}`);
    return res.rows[0];
  }

  async deleteFeaturedSection(id, userId) {
    const res = await pool.query(`DELETE FROM cms_featured_sections WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Featured section not found');
    await this.logAction(pool, 'delete', 'featured', id, userId, `Deleted featured section: ${res.rows[0].name}`);
    return { success: true };
  }

  async getTrendingSections() {
    const res = await pool.query(`SELECT * FROM cms_trending_sections ORDER BY sort_order ASC`);
    return res.rows;
  }

  async createTrendingSection(data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_trending_sections (
        name, heading, subtitle, trending_type, ranking_method, min_activity_threshold,
        display_count, sort_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `, [
      data.name, data.heading, data.subtitle || null, data.trending_type,
      data.ranking_method || 'hybrid', data.min_activity_threshold || 10,
      data.display_count || 8, data.sort_order || 1, data.is_active ?? true
    ]);
    await this.logAction(pool, 'create', 'trending', res.rows[0].id, userId, `Created trending section: ${data.name}`);
    return res.rows[0];
  }

  async updateTrendingSection(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_trending_sections
      SET name = COALESCE($1, name),
          heading = COALESCE($2, heading),
          subtitle = COALESCE($3, subtitle),
          trending_type = COALESCE($4, trending_type),
          ranking_method = COALESCE($5, ranking_method),
          min_activity_threshold = COALESCE($6, min_activity_threshold),
          display_count = COALESCE($7, display_count),
          sort_order = COALESCE($8, sort_order),
          is_active = COALESCE($9, is_active),
          updated_at = NOW()
      WHERE id = $10
      RETURNING *;
    `, [
      data.name, data.heading, data.subtitle, data.trending_type,
      data.ranking_method, data.min_activity_threshold, data.display_count,
      data.sort_order, data.is_active, id
    ]);
    if (res.rows.length === 0) throw new Error('Trending section not found');
    await this.logAction(pool, 'update', 'trending', id, userId, `Updated trending section: ${res.rows[0].name}`);
    return res.rows[0];
  }

  async deleteTrendingSection(id, userId) {
    const res = await pool.query(`DELETE FROM cms_trending_sections WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Trending section not found');
    await this.logAction(pool, 'delete', 'trending', id, userId, `Deleted trending section: ${res.rows[0].name}`);
    return { success: true };
  }

  // ===========================================================================
  // 7. ABOUT US CONTENT & TEAM MEMBERS
  // ===========================================================================
  async getAboutContent() {
    const res = await pool.query(`SELECT * FROM cms_about_content LIMIT 1`);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async updateAboutContent(data, userId) {
    const current = await this.getAboutContent();
    if (!current) {
      const ins = await pool.query(`
        INSERT INTO cms_about_content (
          title, hero_image_url, intro, story_html, mission, vision, values_json, stats_json,
          is_published, version, updated_by_id, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 1, $9, NOW())
        RETURNING *;
      `, [
        data.title || 'About Us', data.hero_image_url || null, data.intro || null,
        data.story_html || null, data.mission || null, data.vision || null,
        JSON.stringify(data.values_json || []), JSON.stringify(data.stats_json || []), userId
      ]);
      await this.logAction(pool, 'update', 'about', ins.rows[0].id, userId, 'Created initial About Us content');
      return ins.rows[0];
    }

    const res = await pool.query(`
      UPDATE cms_about_content
      SET title = COALESCE($1, title),
          hero_image_url = COALESCE($2, hero_image_url),
          intro = COALESCE($3, intro),
          story_html = COALESCE($4, story_html),
          mission = COALESCE($5, mission),
          vision = COALESCE($6, vision),
          values_json = COALESCE($7, values_json),
          stats_json = COALESCE($8, stats_json),
          is_published = COALESCE($9, is_published),
          version = version + 1,
          updated_by_id = $10,
          updated_at = NOW()
      WHERE id = $11
      RETURNING *;
    `, [
      data.title, data.hero_image_url, data.intro, data.story_html, data.mission, data.vision,
      data.values_json ? JSON.stringify(data.values_json) : null,
      data.stats_json ? JSON.stringify(data.stats_json) : null,
      data.is_published, userId, current.id
    ]);
    await this.logAction(pool, 'update', 'about', current.id, userId, `Updated About Us content (version ${res.rows[0].version})`);
    return res.rows[0];
  }

  async getTeamMembers() {
    const res = await pool.query(`SELECT * FROM cms_team_members ORDER BY sort_order ASC`);
    return res.rows;
  }

  async createTeamMember(data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_team_members (name, role, bio, photo_url, social_links_json, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [
      data.name, data.role, data.bio || null, data.photo_url || null,
      JSON.stringify(data.social_links_json || {}), data.sort_order || 1, data.is_active ?? true
    ]);
    await this.logAction(pool, 'create', 'about', res.rows[0].id, userId, `Added team member: ${data.name}`);
    return res.rows[0];
  }

  async updateTeamMember(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_team_members
      SET name = COALESCE($1, name),
          role = COALESCE($2, role),
          bio = COALESCE($3, bio),
          photo_url = COALESCE($4, photo_url),
          social_links_json = COALESCE($5, social_links_json),
          sort_order = COALESCE($6, sort_order),
          is_active = COALESCE($7, is_active)
      WHERE id = $8
      RETURNING *;
    `, [
      data.name, data.role, data.bio, data.photo_url,
      data.social_links_json ? JSON.stringify(data.social_links_json) : null,
      data.sort_order, data.is_active, id
    ]);
    if (res.rows.length === 0) throw new Error('Team member not found');
    await this.logAction(pool, 'update', 'about', id, userId, `Updated team member: ${res.rows[0].name}`);
    return res.rows[0];
  }

  async deleteTeamMember(id, userId) {
    const res = await pool.query(`DELETE FROM cms_team_members WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Team member not found');
    await this.logAction(pool, 'delete', 'about', id, userId, `Deleted team member: ${res.rows[0].name}`);
    return { success: true };
  }

  // ===========================================================================
  // 8. CONTACT PAGE SETTINGS & SUBMISSIONS
  // ===========================================================================
  async getContactSettings() {
    const res = await pool.query(`SELECT * FROM cms_contact_settings LIMIT 1`);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async updateContactSettings(data, userId) {
    const current = await this.getContactSettings();
    if (!current) {
      const ins = await pool.query(`
        INSERT INTO cms_contact_settings (
          heading, description, support_email, phone, address, business_hours, social_links_json, form_fields_json, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *;
      `, [
        data.heading || 'Contact Us', data.description || '', data.support_email || 'support@desigot.com',
        data.phone || '', data.address || '', data.business_hours || '',
        JSON.stringify(data.social_links_json || {}), JSON.stringify(data.form_fields_json || [])
      ]);
      await this.logAction(pool, 'update', 'contact', ins.rows[0].id, userId, 'Created initial contact settings');
      return ins.rows[0];
    }

    const res = await pool.query(`
      UPDATE cms_contact_settings
      SET heading = COALESCE($1, heading),
          description = COALESCE($2, description),
          support_email = COALESCE($3, support_email),
          phone = COALESCE($4, phone),
          address = COALESCE($5, address),
          business_hours = COALESCE($6, business_hours),
          social_links_json = COALESCE($7, social_links_json),
          form_fields_json = COALESCE($8, form_fields_json),
          updated_at = NOW()
      WHERE id = $9
      RETURNING *;
    `, [
      data.heading, data.description, data.support_email, data.phone, data.address,
      data.business_hours, data.social_links_json ? JSON.stringify(data.social_links_json) : null,
      data.form_fields_json ? JSON.stringify(data.form_fields_json) : null, current.id
    ]);
    await this.logAction(pool, 'update', 'contact', current.id, userId, 'Updated contact settings');
    return res.rows[0];
  }

  async getContactSubmissions(query = {}) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 20, 10);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT cs.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
      FROM cms_contact_submissions cs
      LEFT JOIN users u ON cs.assigned_to_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (query.status) {
      params.push(query.status);
      sql += ` AND cs.status = $${params.length}`;
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (cs.name ILIKE $${params.length} OR cs.email ILIKE $${params.length} OR cs.subject ILIKE $${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM (${sql}) AS count_query`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    sql += ` ORDER BY cs.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rowsRes = await pool.query(sql, params);
    return { data: rowsRes.rows, total, page, limit };
  }

  async getContactSubmissionById(id) {
    const res = await pool.query(`
      SELECT cs.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
      FROM cms_contact_submissions cs
      LEFT JOIN users u ON cs.assigned_to_id = u.id
      WHERE cs.id = $1
    `, [id]);
    if (res.rows.length === 0) throw new Error('Submission not found');
    return res.rows[0];
  }

  async updateContactSubmissionStatus(id, status, adminNotes = null, assignedToId = null, userId = null) {
    const res = await pool.query(`
      UPDATE cms_contact_submissions
      SET status = COALESCE($1, status),
          admin_notes = COALESCE($2, admin_notes),
          assigned_to_id = COALESCE($3, assigned_to_id),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `, [status, adminNotes, assignedToId, id]);
    if (res.rows.length === 0) throw new Error('Submission not found');
    await this.logAction(pool, 'update', 'contact', id, userId, `Updated submission #${id} status to ${status}`);
    return res.rows[0];
  }

  async submitContactForm(data, ip = '127.0.0.1') {
    const res = await pool.query(`
      INSERT INTO cms_contact_submissions (
        name, email, phone, subject, message, attachment_url, status, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'new', $7, NOW())
      RETURNING *;
    `, [data.name, data.email, data.phone || null, data.subject, data.message, data.attachment_url || null, ip]);
    return res.rows[0];
  }

  // ===========================================================================
  // 9. FAQ MANAGEMENT
  // ===========================================================================
  async getFaqCategories() {
    const res = await pool.query(`
      SELECT c.*, COUNT(f.id)::int as faqs_count
      FROM cms_faq_categories c
      LEFT JOIN cms_faqs f ON c.id = f.category_id
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `);
    return res.rows;
  }

  async createFaqCategory(data, userId) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const res = await pool.query(`
      INSERT INTO cms_faq_categories (name, slug, sort_order, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [data.name, slug, data.sort_order || 1, data.is_active ?? true]);
    await this.logAction(pool, 'create', 'faq', res.rows[0].id, userId, `Created FAQ category: ${data.name}`);
    return res.rows[0];
  }

  async updateFaqCategory(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_faq_categories
      SET name = COALESCE($1, name),
          slug = COALESCE($2, slug),
          sort_order = COALESCE($3, sort_order),
          is_active = COALESCE($4, is_active)
      WHERE id = $5
      RETURNING *;
    `, [data.name, data.slug, data.sort_order, data.is_active, id]);
    if (res.rows.length === 0) throw new Error('FAQ category not found');
    await this.logAction(pool, 'update', 'faq', id, userId, `Updated FAQ category: ${res.rows[0].name}`);
    return res.rows[0];
  }

  async deleteFaqCategory(id, userId) {
    const res = await pool.query(`DELETE FROM cms_faq_categories WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('FAQ category not found');
    await this.logAction(pool, 'delete', 'faq', id, userId, `Deleted FAQ category: ${res.rows[0].name}`);
    return { success: true };
  }

  async getFaqs(query = {}) {
    let sql = `
      SELECT f.*, c.name as category_name, c.slug as category_slug
      FROM cms_faqs f
      LEFT JOIN cms_faq_categories c ON f.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (query.category_id) {
      params.push(query.category_id);
      sql += ` AND f.category_id = $${params.length}`;
    }
    if (query.page_association && query.page_association !== 'all') {
      params.push(query.page_association);
      sql += ` AND (f.page_association = $${params.length} OR f.page_association = 'all')`;
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (f.question ILIKE $${params.length} OR f.answer_html ILIKE $${params.length})`;
    }
    sql += ` ORDER BY f.display_position ASC, f.created_at ASC`;
    const res = await pool.query(sql, params);
    return res.rows;
  }

  async createFaq(data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_faqs (
        category_id, question, answer_html, display_position, is_published, page_association
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [
      data.category_id || null, data.question, data.answer_html,
      data.display_position || 1, data.is_published ?? true, data.page_association || 'all'
    ]);
    await this.logAction(pool, 'create', 'faq', res.rows[0].id, userId, `Created FAQ: ${data.question}`);
    return res.rows[0];
  }

  async updateFaq(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_faqs
      SET category_id = $1,
          question = COALESCE($2, question),
          answer_html = COALESCE($3, answer_html),
          display_position = COALESCE($4, display_position),
          is_published = COALESCE($5, is_published),
          page_association = COALESCE($6, page_association),
          updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `, [
      data.category_id !== undefined ? data.category_id : null,
      data.question, data.answer_html, data.display_position,
      data.is_published, data.page_association, id
    ]);
    if (res.rows.length === 0) throw new Error('FAQ not found');
    await this.logAction(pool, 'update', 'faq', id, userId, `Updated FAQ: ${res.rows[0].question}`);
    return res.rows[0];
  }

  async deleteFaq(id, userId) {
    const res = await pool.query(`DELETE FROM cms_faqs WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('FAQ not found');
    await this.logAction(pool, 'delete', 'faq', id, userId, `Deleted FAQ: ${res.rows[0].question}`);
    return { success: true };
  }

  // ===========================================================================
  // 10. LEGAL DOCUMENTS & VERSIONING (Terms, Privacy, Refund Policy)
  // ===========================================================================
  async getLegalDocuments() {
    const res = await pool.query(`SELECT * FROM cms_legal_documents ORDER BY doc_type ASC`);
    return res.rows;
  }

  async getLegalDocument(docType) {
    const res = await pool.query(`SELECT * FROM cms_legal_documents WHERE doc_type = $1`, [docType]);
    if (res.rows.length === 0) throw new Error(`Legal document '${docType}' not found`);
    const doc = res.rows[0];
    const versions = await pool.query(`
      SELECT v.*, u.first_name, u.last_name
      FROM cms_legal_document_versions v
      LEFT JOIN users u ON v.published_by_id = u.id
      WHERE v.document_id = $1
      ORDER BY v.published_at DESC
    `, [doc.id]);
    doc.versions = versions.rows;
    return doc;
  }

  async updateLegalDocument(docType, data, userId) {
    const current = await this.getLegalDocument(docType);
    const newVersion = data.version || `v${Date.now()}`;

    // 1. Update current published document
    const updated = await pool.query(`
      UPDATE cms_legal_documents
      SET title = COALESCE($1, title),
          content_html = COALESCE($2, content_html),
          version = $3,
          effective_date = COALESCE($4, effective_date),
          is_published = COALESCE($5, is_published),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `, [
      data.title, data.content_html, newVersion,
      data.effective_date || new Date(), data.is_published ?? true, current.id
    ]);

    // 2. Append revision to history table
    await pool.query(`
      INSERT INTO cms_legal_document_versions (
        document_id, doc_type, version, title, content_html, change_summary, published_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [
      current.id, docType, newVersion,
      data.title || current.title, data.content_html || current.content_html,
      data.change_summary || 'Updated legal content', userId
    ]);

    await this.logAction(pool, 'update', 'legal', current.id, userId, `Updated ${docType} to version ${newVersion}`);
    return this.getLegalDocument(docType);
  }

  async restoreLegalDocumentVersion(docType, versionId, userId) {
    const current = await this.getLegalDocument(docType);
    const versionRes = await pool.query(`
      SELECT * FROM cms_legal_document_versions WHERE id = $1 AND document_id = $2
    `, [versionId, current.id]);
    if (versionRes.rows.length === 0) throw new Error('Historical version not found');
    const v = versionRes.rows[0];

    const restoredVersion = `${v.version}.r${Date.now() % 10000}`;

    // Update current active document with historic content
    await pool.query(`
      UPDATE cms_legal_documents
      SET title = $1,
          content_html = $2,
          version = $3,
          updated_at = NOW()
      WHERE id = $4;
    `, [v.title, v.content_html, restoredVersion, current.id]);

    // Log new version representing the restoration
    await pool.query(`
      INSERT INTO cms_legal_document_versions (
        document_id, doc_type, version, title, content_html, change_summary, published_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [
      current.id, docType, restoredVersion, v.title, v.content_html,
      `Restored from historic version ${v.version}`, userId
    ]);

    await this.logAction(pool, 'restore', 'legal', current.id, userId, `Restored ${docType} to version ${v.version}`);
    return this.getLegalDocument(docType);
  }

  // ===========================================================================
  // 11. FOOTER MANAGEMENT (Settings, Columns, Links)
  // ===========================================================================
  async getFooterSettings() {
    const res = await pool.query(`SELECT * FROM cms_footer_settings LIMIT 1`);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async updateFooterSettings(data, userId) {
    const current = await this.getFooterSettings();
    if (!current) {
      const ins = await pool.query(`
        INSERT INTO cms_footer_settings (
          company_info, copyright_text, social_links_json, payment_icons_json, is_active, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *;
      `, [
        data.company_info || '', data.copyright_text || '',
        JSON.stringify(data.social_links_json || {}), JSON.stringify(data.payment_icons_json || []),
        data.is_active ?? true
      ]);
      await this.logAction(pool, 'update', 'footer', ins.rows[0].id, userId, 'Created footer settings');
      return ins.rows[0];
    }

    const res = await pool.query(`
      UPDATE cms_footer_settings
      SET company_info = COALESCE($1, company_info),
          copyright_text = COALESCE($2, copyright_text),
          social_links_json = COALESCE($3, social_links_json),
          payment_icons_json = COALESCE($4, payment_icons_json),
          is_active = COALESCE($5, is_active),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `, [
      data.company_info, data.copyright_text,
      data.social_links_json ? JSON.stringify(data.social_links_json) : null,
      data.payment_icons_json ? JSON.stringify(data.payment_icons_json) : null,
      data.is_active, current.id
    ]);
    await this.logAction(pool, 'update', 'footer', current.id, userId, 'Updated footer global settings');
    return res.rows[0];
  }

  async getFooterColumns() {
    const cols = await pool.query(`SELECT * FROM cms_footer_columns ORDER BY column_order ASC`);
    for (const col of cols.rows) {
      const links = await pool.query(`
        SELECT * FROM cms_footer_links
        WHERE column_id = $1
        ORDER BY sort_order ASC
      `, [col.id]);
      col.links = links.rows;
    }
    return cols.rows;
  }

  async createFooterColumn(data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_footer_columns (title, column_order, is_active)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [data.title, data.column_order || 1, data.is_active ?? true]);
    await this.logAction(pool, 'create', 'footer', res.rows[0].id, userId, `Created footer column: ${data.title}`);
    return res.rows[0];
  }

  async updateFooterColumn(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_footer_columns
      SET title = COALESCE($1, title),
          column_order = COALESCE($2, column_order),
          is_active = COALESCE($3, is_active)
      WHERE id = $4
      RETURNING *;
    `, [data.title, data.column_order, data.is_active, id]);
    if (res.rows.length === 0) throw new Error('Footer column not found');
    await this.logAction(pool, 'update', 'footer', id, userId, `Updated footer column: ${res.rows[0].title}`);
    return res.rows[0];
  }

  async deleteFooterColumn(id, userId) {
    const res = await pool.query(`DELETE FROM cms_footer_columns WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Footer column not found');
    await this.logAction(pool, 'delete', 'footer', id, userId, `Deleted footer column: ${res.rows[0].title}`);
    return { success: true };
  }

  async createFooterLink(columnId, data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_footer_links (column_id, label, url, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [columnId, data.label, data.url, data.sort_order || 1, data.is_active ?? true]);
    await this.logAction(pool, 'create', 'footer', res.rows[0].id, userId, `Created footer link: ${data.label}`);
    return res.rows[0];
  }

  async updateFooterLink(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_footer_links
      SET label = COALESCE($1, label),
          url = COALESCE($2, url),
          sort_order = COALESCE($3, sort_order),
          is_active = COALESCE($4, is_active)
      WHERE id = $5
      RETURNING *;
    `, [data.label, data.url, data.sort_order, data.is_active, id]);
    if (res.rows.length === 0) throw new Error('Footer link not found');
    await this.logAction(pool, 'update', 'footer', id, userId, `Updated footer link: ${res.rows[0].label}`);
    return res.rows[0];
  }

  async deleteFooterLink(id, userId) {
    const res = await pool.query(`DELETE FROM cms_footer_links WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Footer link not found');
    await this.logAction(pool, 'delete', 'footer', id, userId, `Deleted footer link: ${res.rows[0].label}`);
    return { success: true };
  }

  // ===========================================================================
  // 12. STATIC PAGES & DYNAMIC BUILDER
  // ===========================================================================
  async getStaticPages(query = {}) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 20, 10);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT sp.*, u.first_name as author_first_name, u.last_name as author_last_name
      FROM cms_static_pages sp
      LEFT JOIN users u ON sp.author_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (query.status) {
      params.push(query.status);
      sql += ` AND sp.status = $${params.length}`;
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (sp.title ILIKE $${params.length} OR sp.slug ILIKE $${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM (${sql}) AS count_query`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    sql += ` ORDER BY sp.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rowsRes = await pool.query(sql, params);
    return { data: rowsRes.rows, total, page, limit };
  }

  async getStaticPageById(id) {
    const res = await pool.query(`SELECT * FROM cms_static_pages WHERE id = $1`, [id]);
    if (res.rows.length === 0) throw new Error('Page not found');
    const page = res.rows[0];
    const versions = await pool.query(`
      SELECT pv.*, u.first_name, u.last_name
      FROM cms_static_page_versions pv
      LEFT JOIN users u ON pv.created_by_id = u.id
      WHERE pv.page_id = $1
      ORDER BY pv.version DESC
    `, [id]);
    page.versions = versions.rows;
    return page;
  }

  async getStaticPageBySlug(slug) {
    const res = await pool.query(`SELECT * FROM cms_static_pages WHERE slug = $1`, [slug]);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async createStaticPage(data, userId) {
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const res = await pool.query(`
      INSERT INTO cms_static_pages (
        title, slug, description, content_html, content_blocks_json, featured_image_url,
        seo_title, seo_description, status, scheduled_at, published_at, author_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `, [
      data.title, slug, data.description || null, data.content_html || '',
      JSON.stringify(data.content_blocks_json || []), data.featured_image_url || null,
      data.seo_title || data.title, data.seo_description || data.description,
      data.status || 'published', data.scheduled_at || null,
      data.status === 'published' ? new Date() : null, userId
    ]);
    const page = res.rows[0];

    // Create Initial Version 1
    await pool.query(`
      INSERT INTO cms_static_page_versions (page_id, version, title, content_html, content_blocks_json, change_notes, created_by_id)
      VALUES ($1, 1, $2, $3, $4, 'Initial page creation', $5);
    `, [page.id, data.title, data.content_html || '', JSON.stringify(data.content_blocks_json || []), userId]);

    await this.logAction(pool, 'create', 'page', page.id, userId, `Created static page: ${data.title}`);
    return page;
  }

  async updateStaticPage(id, data, userId) {
    const current = await this.getStaticPageById(id);
    const res = await pool.query(`
      UPDATE cms_static_pages
      SET title = COALESCE($1, title),
          slug = COALESCE($2, slug),
          description = COALESCE($3, description),
          content_html = COALESCE($4, content_html),
          content_blocks_json = COALESCE($5, content_blocks_json),
          featured_image_url = COALESCE($6, featured_image_url),
          seo_title = COALESCE($7, seo_title),
          seo_description = COALESCE($8, seo_description),
          status = COALESCE($9, status),
          scheduled_at = $10,
          published_at = COALESCE($11, published_at),
          updated_at = NOW()
      WHERE id = $12
      RETURNING *;
    `, [
      data.title, data.slug, data.description, data.content_html,
      data.content_blocks_json ? JSON.stringify(data.content_blocks_json) : null,
      data.featured_image_url, data.seo_title, data.seo_description, data.status,
      data.scheduled_at !== undefined ? data.scheduled_at : current.scheduled_at,
      data.status === 'published' && !current.published_at ? new Date() : current.published_at,
      id
    ]);
    const updated = res.rows[0];

    // Create incremented version in history
    const versionCount = current.versions ? current.versions.length + 1 : 2;
    await pool.query(`
      INSERT INTO cms_static_page_versions (page_id, version, title, content_html, content_blocks_json, change_notes, created_by_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [
      id, versionCount, updated.title, updated.content_html,
      JSON.stringify(updated.content_blocks_json), data.change_notes || 'Content updated', userId
    ]);

    await this.logAction(pool, 'update', 'page', id, userId, `Updated static page: ${updated.title}`);
    return this.getStaticPageById(id);
  }

  async deleteStaticPage(id, userId) {
    const res = await pool.query(`DELETE FROM cms_static_pages WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Page not found');
    await this.logAction(pool, 'delete', 'page', id, userId, `Deleted static page: ${res.rows[0].title}`);
    return { success: true };
  }

  async restoreStaticPageVersion(pageId, versionId, userId) {
    const page = await this.getStaticPageById(pageId);
    const verRes = await pool.query(`SELECT * FROM cms_static_page_versions WHERE id = $1 AND page_id = $2`, [versionId, pageId]);
    if (verRes.rows.length === 0) throw new Error('Version not found');
    const v = verRes.rows[0];

    await pool.query(`
      UPDATE cms_static_pages
      SET title = $1,
          content_html = $2,
          content_blocks_json = $3,
          updated_at = NOW()
      WHERE id = $4;
    `, [v.title, v.content_html, v.content_blocks_json, pageId]);

    const nextVer = (page.versions ? page.versions.length : 1) + 1;
    await pool.query(`
      INSERT INTO cms_static_page_versions (page_id, version, title, content_html, content_blocks_json, change_notes, created_by_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [pageId, nextVer, v.title, v.content_html, v.content_blocks_json, `Restored from version ${v.version}`, userId]);

    await this.logAction(pool, 'restore', 'page', pageId, userId, `Restored page ${page.title} to version ${v.version}`);
    return this.getStaticPageById(pageId);
  }

  // ===========================================================================
  // 13. BLOG SYSTEM (Categories, Tags, Posts, Revisions)
  // ===========================================================================
  async getBlogCategories() {
    const res = await pool.query(`
      SELECT bc.*, COUNT(bp.id)::int as posts_count
      FROM blog_categories bc
      LEFT JOIN blog_posts bp ON bc.id = bp.category_id
      GROUP BY bc.id
      ORDER BY bc.sort_order ASC, bc.name ASC
    `);
    return res.rows;
  }

  async createBlogCategory(data, userId) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const res = await pool.query(`
      INSERT INTO blog_categories (name, slug, description, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [data.name, slug, data.description || null, data.sort_order || 1]);
    await this.logAction(pool, 'create', 'blog', res.rows[0].id, userId, `Created blog category: ${data.name}`);
    return res.rows[0];
  }

  async updateBlogCategory(id, data, userId) {
    const res = await pool.query(`
      UPDATE blog_categories
      SET name = COALESCE($1, name),
          slug = COALESCE($2, slug),
          description = COALESCE($3, description),
          sort_order = COALESCE($4, sort_order)
      WHERE id = $5
      RETURNING *;
    `, [data.name, data.slug, data.description, data.sort_order, id]);
    if (res.rows.length === 0) throw new Error('Blog category not found');
    await this.logAction(pool, 'update', 'blog', id, userId, `Updated blog category: ${res.rows[0].name}`);
    return res.rows[0];
  }

  async deleteBlogCategory(id, userId) {
    const res = await pool.query(`DELETE FROM blog_categories WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Blog category not found');
    await this.logAction(pool, 'delete', 'blog', id, userId, `Deleted blog category: ${res.rows[0].name}`);
    return { success: true };
  }

  async getBlogTags() {
    const res = await pool.query(`
      SELECT bt.*, COUNT(bpt.post_id)::int as posts_count
      FROM blog_tags bt
      LEFT JOIN blog_post_tags bpt ON bt.id = bpt.tag_id
      GROUP BY bt.id
      ORDER BY bt.name ASC
    `);
    return res.rows;
  }

  async createBlogTag(data, userId) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const res = await pool.query(`
      INSERT INTO blog_tags (name, slug)
      VALUES ($1, $2)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING *;
    `, [data.name, slug]);
    await this.logAction(pool, 'create', 'blog', res.rows[0].id, userId, `Created blog tag: ${data.name}`);
    return res.rows[0];
  }

  async getBlogPosts(query = {}) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 20, 10);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT bp.*, bc.name as category_name, bc.slug as category_slug,
             u.first_name as author_first_name, u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (query.status) {
      params.push(query.status);
      sql += ` AND bp.status = $${params.length}`;
    }
    if (query.category_id) {
      params.push(query.category_id);
      sql += ` AND bp.category_id = $${params.length}`;
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (bp.title ILIKE $${params.length} OR bp.slug ILIKE $${params.length} OR bp.excerpt ILIKE $${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM (${sql}) AS count_query`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    sql += ` ORDER BY bp.published_at DESC, bp.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rowsRes = await pool.query(sql, params);

    // Attach tags
    for (const post of rowsRes.rows) {
      const tags = await pool.query(`
        SELECT bt.*
        FROM blog_tags bt
        JOIN blog_post_tags bpt ON bt.id = bpt.tag_id
        WHERE bpt.post_id = $1
      `, [post.id]);
      post.tags = tags.rows;
    }

    return { data: rowsRes.rows, total, page, limit };
  }

  async getBlogPostById(id) {
    const res = await pool.query(`
      SELECT bp.*, bc.name as category_name, bc.slug as category_slug,
             u.first_name as author_first_name, u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.id = $1
    `, [id]);
    if (res.rows.length === 0) throw new Error('Blog post not found');
    const post = res.rows[0];

    const tags = await pool.query(`
      SELECT bt.*
      FROM blog_tags bt
      JOIN blog_post_tags bpt ON bt.id = bpt.tag_id
      WHERE bpt.post_id = $1
    `, [id]);
    post.tags = tags.rows;

    const revs = await pool.query(`
      SELECT r.*, u.first_name, u.last_name
      FROM blog_post_revisions r
      LEFT JOIN users u ON r.created_by_id = u.id
      WHERE r.post_id = $1
      ORDER BY r.revision_num DESC
    `, [id]);
    post.revisions = revs.rows;

    return post;
  }

  async getBlogPostBySlug(slug) {
    const res = await pool.query(`
      SELECT bp.*, bc.name as category_name, bc.slug as category_slug,
             u.first_name as author_first_name, u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.slug = $1
    `, [slug]);
    if (res.rows.length === 0) return null;
    const post = res.rows[0];

    const tags = await pool.query(`
      SELECT bt.*
      FROM blog_tags bt
      JOIN blog_post_tags bpt ON bt.id = bpt.tag_id
      WHERE bpt.post_id = $1
    `, [post.id]);
    post.tags = tags.rows;

    // Increment views
    await pool.query(`UPDATE blog_posts SET views_count = views_count + 1 WHERE id = $1`, [post.id]);
    post.views_count += 1;

    return post;
  }

  async createBlogPost(data, userId) {
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const res = await pool.query(`
      INSERT INTO blog_posts (
        title, slug, excerpt, content_html, featured_image_url, category_id, author_id,
        reading_time_mins, seo_title, seo_description, canonical_url, status,
        scheduled_at, published_at, views_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0)
      RETURNING *;
    `, [
      data.title, slug, data.excerpt || null, data.content_html,
      data.featured_image_url || null, data.category_id || null, userId,
      data.reading_time_mins || 5, data.seo_title || data.title,
      data.seo_description || data.excerpt, data.canonical_url || null,
      data.status || 'published', data.scheduled_at || null,
      data.status === 'published' ? new Date() : null
    ]);
    const post = res.rows[0];

    // Link Tags
    if (Array.isArray(data.tag_ids)) {
      for (const tid of data.tag_ids) {
        await pool.query(`
          INSERT INTO blog_post_tags (post_id, tag_id)
          VALUES ($1, $2) ON CONFLICT DO NOTHING;
        `, [post.id, tid]);
      }
    }

    // Add Revision 1
    await pool.query(`
      INSERT INTO blog_post_revisions (post_id, revision_num, title, excerpt, content_html, created_by_id)
      VALUES ($1, 1, $2, $3, $4, $5);
    `, [post.id, post.title, post.excerpt, post.content_html, userId]);

    await this.logAction(pool, 'create', 'blog', post.id, userId, `Created blog post: ${post.title}`);
    return this.getBlogPostById(post.id);
  }

  async updateBlogPost(id, data, userId) {
    const current = await this.getBlogPostById(id);
    const res = await pool.query(`
      UPDATE blog_posts
      SET title = COALESCE($1, title),
          slug = COALESCE($2, slug),
          excerpt = COALESCE($3, excerpt),
          content_html = COALESCE($4, content_html),
          featured_image_url = COALESCE($5, featured_image_url),
          category_id = $6,
          reading_time_mins = COALESCE($7, reading_time_mins),
          seo_title = COALESCE($8, seo_title),
          seo_description = COALESCE($9, seo_description),
          canonical_url = COALESCE($10, canonical_url),
          status = COALESCE($11, status),
          scheduled_at = $12,
          published_at = COALESCE($13, published_at),
          updated_at = NOW()
      WHERE id = $14
      RETURNING *;
    `, [
      data.title, data.slug, data.excerpt, data.content_html, data.featured_image_url,
      data.category_id !== undefined ? data.category_id : current.category_id,
      data.reading_time_mins, data.seo_title, data.seo_description, data.canonical_url,
      data.status, data.scheduled_at !== undefined ? data.scheduled_at : current.scheduled_at,
      data.status === 'published' && !current.published_at ? new Date() : current.published_at,
      id
    ]);
    const updated = res.rows[0];

    // Update tags if provided
    if (Array.isArray(data.tag_ids)) {
      await pool.query(`DELETE FROM blog_post_tags WHERE post_id = $1`, [id]);
      for (const tid of data.tag_ids) {
        await pool.query(`INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, tid]);
      }
    }

    // Add revision
    const revCount = current.revisions ? current.revisions.length + 1 : 2;
    await pool.query(`
      INSERT INTO blog_post_revisions (post_id, revision_num, title, excerpt, content_html, created_by_id)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [id, revCount, updated.title, updated.excerpt, updated.content_html, userId]);

    await this.logAction(pool, 'update', 'blog', id, userId, `Updated blog post: ${updated.title}`);
    return this.getBlogPostById(id);
  }

  async deleteBlogPost(id, userId) {
    const res = await pool.query(`DELETE FROM blog_posts WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Blog post not found');
    await this.logAction(pool, 'delete', 'blog', id, userId, `Deleted blog post: ${res.rows[0].title}`);
    return { success: true };
  }

  // ===========================================================================
  // 14. MEDIA LIBRARY ASSETS
  // ===========================================================================
  async getMediaAssets(query = {}) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 24, 10);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT ma.*, u.first_name, u.last_name
      FROM cms_media_assets ma
      LEFT JOIN users u ON ma.uploaded_by_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (query.file_type) {
      params.push(query.file_type);
      sql += ` AND ma.file_type = $${params.length}`;
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (ma.file_name ILIKE $${params.length} OR ma.alt_text ILIKE $${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM (${sql}) AS count_query`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    sql += ` ORDER BY ma.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rowsRes = await pool.query(sql, params);
    return { data: rowsRes.rows, total, page, limit };
  }

  async uploadMediaAsset(data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_media_assets (
        file_name, original_name, file_url, file_type, mime_type, file_size_bytes, alt_text, caption, uploaded_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `, [
      data.file_name, data.original_name, data.file_url,
      data.file_type || 'image', data.mime_type || 'image/png',
      data.file_size_bytes || 1024, data.alt_text || null, data.caption || null, userId
    ]);
    await this.logAction(pool, 'upload', 'media', res.rows[0].id, userId, `Uploaded asset: ${data.file_name}`);
    return res.rows[0];
  }

  async deleteMediaAsset(id, userId) {
    const res = await pool.query(`DELETE FROM cms_media_assets WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Asset not found');
    await this.logAction(pool, 'delete', 'media', id, userId, `Deleted media asset: ${res.rows[0].file_name}`);
    return { success: true };
  }

  // ===========================================================================
  // 15. SEO SETTINGS & REDIRECTS
  // ===========================================================================
  async getSeoSettings() {
    const res = await pool.query(`SELECT * FROM cms_seo_settings LIMIT 1`);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  async updateSeoSettings(data, userId) {
    const current = await this.getSeoSettings();
    if (!current) {
      const ins = await pool.query(`
        INSERT INTO cms_seo_settings (
          default_meta_title, default_meta_description, default_og_image, favicon_url,
          canonical_base_url, sitemap_enabled, robots_txt_content, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *;
      `, [
        data.default_meta_title || 'Desigot', data.default_meta_description || '',
        data.default_og_image || '', data.favicon_url || '/favicon.ico',
        data.canonical_base_url || 'https://desigot.com', data.sitemap_enabled ?? true,
        data.robots_txt_content || 'User-agent: *\nAllow: /'
      ]);
      await this.logAction(pool, 'update', 'seo', ins.rows[0].id, userId, 'Created initial SEO settings');
      return ins.rows[0];
    }

    const res = await pool.query(`
      UPDATE cms_seo_settings
      SET default_meta_title = COALESCE($1, default_meta_title),
          default_meta_description = COALESCE($2, default_meta_description),
          default_og_image = COALESCE($3, default_og_image),
          favicon_url = COALESCE($4, favicon_url),
          canonical_base_url = COALESCE($5, canonical_base_url),
          sitemap_enabled = COALESCE($6, sitemap_enabled),
          robots_txt_content = COALESCE($7, robots_txt_content),
          updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `, [
      data.default_meta_title, data.default_meta_description, data.default_og_image,
      data.favicon_url, data.canonical_base_url, data.sitemap_enabled,
      data.robots_txt_content, current.id
    ]);
    await this.logAction(pool, 'update', 'seo', current.id, userId, 'Updated SEO global settings');
    return res.rows[0];
  }

  async getRedirects(query = {}) {
    let sql = `SELECT * FROM cms_redirects WHERE 1=1`;
    const params = [];
    if (query.active !== undefined) {
      params.push(query.active === 'true' || query.active === true);
      sql += ` AND is_active = $${params.length}`;
    }
    sql += ` ORDER BY created_at DESC`;
    const res = await pool.query(sql, params);
    return res.rows;
  }

  async createRedirect(data, userId) {
    const res = await pool.query(`
      INSERT INTO cms_redirects (source_path, destination_path, redirect_type, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [data.source_path, data.destination_path, data.redirect_type || 301, data.is_active ?? true]);
    await this.logAction(pool, 'create', 'seo', res.rows[0].id, userId, `Created redirect ${data.source_path} -> ${data.destination_path}`);
    return res.rows[0];
  }

  async updateRedirect(id, data, userId) {
    const res = await pool.query(`
      UPDATE cms_redirects
      SET source_path = COALESCE($1, source_path),
          destination_path = COALESCE($2, destination_path),
          redirect_type = COALESCE($3, redirect_type),
          is_active = COALESCE($4, is_active)
      WHERE id = $5
      RETURNING *;
    `, [data.source_path, data.destination_path, data.redirect_type, data.is_active, id]);
    if (res.rows.length === 0) throw new Error('Redirect not found');
    await this.logAction(pool, 'update', 'seo', id, userId, `Updated redirect: ${res.rows[0].source_path}`);
    return res.rows[0];
  }

  async deleteRedirect(id, userId) {
    const res = await pool.query(`DELETE FROM cms_redirects WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Redirect not found');
    await this.logAction(pool, 'delete', 'seo', id, userId, `Deleted redirect: ${res.rows[0].source_path}`);
    return { success: true };
  }

  // ===========================================================================
  // 16. CMS AUDIT LOGS
  // ===========================================================================
  async getAuditLogs(query = {}) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 30, 10);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT al.*, u.first_name, u.last_name, u.email
      FROM cms_audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (query.action_type) {
      params.push(query.action_type);
      sql += ` AND al.action_type = $${params.length}`;
    }
    if (query.entity_type) {
      params.push(query.entity_type);
      sql += ` AND al.entity_type = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM (${sql}) AS count_query`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    sql += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rowsRes = await pool.query(sql, params);
    return { data: rowsRes.rows, total, page, limit };
  }
}

module.exports = new CMSService();
