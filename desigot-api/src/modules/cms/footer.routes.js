'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../../db/pool');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');
const { successResponse } = require('../../shared/utils');

// Helper to log audit trail
async function logAudit(action, entityId, userId, details) {
  try {
    await pool.query(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_values, created_at)
      VALUES (gen_random_uuid(), $1, $2, 'footer', $3, $4, NOW())
    `, [userId || null, action, entityId ? String(entityId) : null, JSON.stringify(details || {})]);
  } catch (err) {
    console.error('Audit log error (footer):', err.message);
  }
}

// ============================================================================
// 1. GET COMPLETE FOOTER CONFIGURATION (Admin)
// ============================================================================
router.get('/', authenticate, requirePermission('cms.read'), async (req, res, next) => {
  try {
    const sRes = await pool.query(`SELECT * FROM cms_footer_settings LIMIT 1`);
    const cRes = await pool.query(`SELECT * FROM cms_footer_columns ORDER BY column_order ASC`);
    const lRes = await pool.query(`SELECT * FROM cms_footer_links ORDER BY sort_order ASC`);
    const socRes = await pool.query(`SELECT * FROM footer_social_links ORDER BY display_order ASC`);
    const legRes = await pool.query(`SELECT * FROM footer_legal_links ORDER BY display_order ASC`);

    const columns = cRes.rows.map(col => ({
      ...col,
      links: lRes.rows.filter(l => l.column_id === col.id)
    }));

    successResponse(res, {
      settings: sRes.rows[0] || null,
      columns,
      social_links: socRes.rows,
      legal_links: legRes.rows
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 2. UPDATE FOOTER SETTINGS
// ============================================================================
router.put('/settings', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const data = req.body;
    const current = await pool.query(`SELECT id FROM cms_footer_settings LIMIT 1`);

    let result;
    if (current.rows.length === 0) {
      const ins = await pool.query(`
        INSERT INTO cms_footer_settings (
          brand_name, brand_description, company_info, copyright_owner, copyright_text,
          copyright_year_mode, manual_copyright_year, background_color, heading_color,
          text_color, link_color, hover_color, border_color, max_width, desktop_visibility,
          tablet_visibility, mobile_visibility, newsletter_enabled, newsletter_title,
          newsletter_description, cta_enabled, cta_heading, cta_description, cta_button_text,
          cta_button_url, publication_status, social_links_json, payment_icons_json, is_active, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,NOW())
        RETURNING *;
      `, [
        data.brand_name || 'Desigot', data.brand_description || '', data.company_info || data.brand_description || '',
        data.copyright_owner || 'Desigot Inc.', data.copyright_text || '', data.copyright_year_mode || 'auto',
        data.manual_copyright_year || 2026, data.background_color || '#0B0F19', data.heading_color || '#FFFFFF',
        data.text_color || '#91A8C7', data.link_color || '#91A8C7', data.hover_color || '#FFFFFF',
        data.border_color || '#263144', data.max_width || '1280px', data.desktop_visibility ?? true,
        data.tablet_visibility ?? true, data.mobile_visibility ?? true, data.newsletter_enabled ?? true,
        data.newsletter_title || '', data.newsletter_description || '', data.cta_enabled ?? false,
        data.cta_heading || '', data.cta_description || '', data.cta_button_text || '',
        data.cta_button_url || '', data.publication_status || 'published',
        JSON.stringify(data.social_links_json || {}), JSON.stringify(data.payment_icons_json || []),
        data.is_active ?? true
      ]);
      result = ins.rows[0];
    } else {
      const upd = await pool.query(`
        UPDATE cms_footer_settings
        SET brand_name = COALESCE($1, brand_name),
            brand_description = COALESCE($2, brand_description),
            company_info = COALESCE($3, company_info),
            copyright_owner = COALESCE($4, copyright_owner),
            copyright_text = COALESCE($5, copyright_text),
            copyright_year_mode = COALESCE($6, copyright_year_mode),
            manual_copyright_year = COALESCE($7, manual_copyright_year),
            background_color = COALESCE($8, background_color),
            heading_color = COALESCE($9, heading_color),
            text_color = COALESCE($10, text_color),
            link_color = COALESCE($11, link_color),
            hover_color = COALESCE($12, hover_color),
            border_color = COALESCE($13, border_color),
            newsletter_enabled = COALESCE($14, newsletter_enabled),
            newsletter_title = COALESCE($15, newsletter_title),
            newsletter_description = COALESCE($16, newsletter_description),
            cta_enabled = COALESCE($17, cta_enabled),
            cta_heading = COALESCE($18, cta_heading),
            cta_description = COALESCE($19, cta_description),
            cta_button_text = COALESCE($20, cta_button_text),
            cta_button_url = COALESCE($21, cta_button_url),
            social_links_json = COALESCE($22, social_links_json),
            is_active = COALESCE($23, is_active),
            updated_at = NOW()
        WHERE id = $24
        RETURNING *;
      `, [
        data.brand_name, data.brand_description, data.company_info, data.copyright_owner,
        data.copyright_text, data.copyright_year_mode, data.manual_copyright_year,
        data.background_color, data.heading_color, data.text_color, data.link_color,
        data.hover_color, data.border_color, data.newsletter_enabled, data.newsletter_title,
        data.newsletter_description, data.cta_enabled, data.cta_heading, data.cta_description,
        data.cta_button_text, data.cta_button_url,
        data.social_links_json ? JSON.stringify(data.social_links_json) : null,
        data.is_active, current.rows[0].id
      ]);
      result = upd.rows[0];
    }

    await logAudit('update_settings', result.id, req.user.id, data);
    successResponse(res, result, 200, { message: 'Footer settings updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 3. COLUMNS CRUD
// ============================================================================
router.get('/columns', authenticate, requirePermission('cms.read'), async (req, res, next) => {
  try {
    const cols = await pool.query(`SELECT * FROM cms_footer_columns ORDER BY column_order ASC`);
    const links = await pool.query(`SELECT * FROM cms_footer_links ORDER BY sort_order ASC`);
    const data = cols.rows.map(col => ({
      ...col,
      links: links.rows.filter(l => l.column_id === col.id)
    }));
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
});

router.get('/columns/:id', authenticate, requirePermission('cms.read'), async (req, res, next) => {
  try {
    const col = await pool.query(`SELECT * FROM cms_footer_columns WHERE id = $1`, [req.params.id]);
    if (col.rows.length === 0) return res.status(404).json({ success: false, message: 'Column not found' });
    const links = await pool.query(`SELECT * FROM cms_footer_links WHERE column_id = $1 ORDER BY sort_order ASC`, [req.params.id]);
    successResponse(res, { ...col.rows[0], links: links.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/columns', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const { title, slug, description, column_order, is_active } = req.body;
    const ins = await pool.query(`
      INSERT INTO cms_footer_columns (title, slug, description, column_order, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [title, slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description || '', column_order || 1, is_active ?? true]);
    await logAudit('create_column', ins.rows[0].id, req.user.id, req.body);
    successResponse(res, ins.rows[0], 201);
  } catch (err) {
    next(err);
  }
});

router.put('/columns/:id', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const { title, slug, description, column_order, is_active } = req.body;
    const upd = await pool.query(`
      UPDATE cms_footer_columns
      SET title = COALESCE($1, title),
          slug = COALESCE($2, slug),
          description = COALESCE($3, description),
          column_order = COALESCE($4, column_order),
          is_active = COALESCE($5, is_active)
      WHERE id = $6
      RETURNING *;
    `, [title, slug, description, column_order, is_active, req.params.id]);
    if (upd.rows.length === 0) return res.status(404).json({ success: false, message: 'Column not found' });
    await logAudit('update_column', req.params.id, req.user.id, req.body);
    successResponse(res, upd.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/columns/:id', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const del = await pool.query(`DELETE FROM cms_footer_columns WHERE id = $1 RETURNING *`, [req.params.id]);
    if (del.rows.length === 0) return res.status(404).json({ success: false, message: 'Column not found' });
    await logAudit('delete_column', req.params.id, req.user.id, { title: del.rows[0].title });
    successResponse(res, { success: true, message: 'Column deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 4. LINKS CRUD
// ============================================================================
router.get('/links', authenticate, requirePermission('cms.read'), async (req, res, next) => {
  try {
    const links = await pool.query(`SELECT * FROM cms_footer_links ORDER BY sort_order ASC`);
    successResponse(res, links.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/links', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const { column_id, label, url, sort_order, is_active, route_type, open_behavior } = req.body;
    const ins = await pool.query(`
      INSERT INTO cms_footer_links (column_id, label, url, sort_order, is_active, route_type, open_behavior)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [column_id, label, url, sort_order || 1, is_active ?? true, route_type || 'internal', open_behavior || 'same_tab']);
    await logAudit('create_link', ins.rows[0].id, req.user.id, req.body);
    successResponse(res, ins.rows[0], 201);
  } catch (err) {
    next(err);
  }
});

router.put('/links/:id', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const { label, url, sort_order, is_active, column_id, route_type, open_behavior } = req.body;
    const upd = await pool.query(`
      UPDATE cms_footer_links
      SET label = COALESCE($1, label),
          url = COALESCE($2, url),
          sort_order = COALESCE($3, sort_order),
          is_active = COALESCE($4, is_active),
          column_id = COALESCE($5, column_id),
          route_type = COALESCE($6, route_type),
          open_behavior = COALESCE($7, open_behavior)
      WHERE id = $8
      RETURNING *;
    `, [label, url, sort_order, is_active, column_id, route_type, open_behavior, req.params.id]);
    if (upd.rows.length === 0) return res.status(404).json({ success: false, message: 'Link not found' });
    await logAudit('update_link', req.params.id, req.user.id, req.body);
    successResponse(res, upd.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/links/:id', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const del = await pool.query(`DELETE FROM cms_footer_links WHERE id = $1 RETURNING *`, [req.params.id]);
    if (del.rows.length === 0) return res.status(404).json({ success: false, message: 'Link not found' });
    await logAudit('delete_link', req.params.id, req.user.id, { label: del.rows[0].label });
    successResponse(res, { success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 5. SOCIAL LINKS CRUD
// ============================================================================
router.post('/social-links', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const { platform, profile_url, icon, display_order, enabled } = req.body;
    const ins = await pool.query(`
      INSERT INTO footer_social_links (platform, profile_url, icon, display_order, enabled)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [platform, profile_url, icon || platform, display_order || 1, enabled ?? true]);
    await logAudit('create_social_link', ins.rows[0].id, req.user.id, req.body);
    successResponse(res, ins.rows[0], 201);
  } catch (err) {
    next(err);
  }
});

router.put('/social-links/:id', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const { platform, profile_url, icon, display_order, enabled } = req.body;
    const upd = await pool.query(`
      UPDATE footer_social_links
      SET platform = COALESCE($1, platform),
          profile_url = COALESCE($2, profile_url),
          icon = COALESCE($3, icon),
          display_order = COALESCE($4, display_order),
          enabled = COALESCE($5, enabled),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `, [platform, profile_url, icon, display_order, enabled, req.params.id]);
    if (upd.rows.length === 0) return res.status(404).json({ success: false, message: 'Social link not found' });
    await logAudit('update_social_link', req.params.id, req.user.id, req.body);
    successResponse(res, upd.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/social-links/:id', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const del = await pool.query(`DELETE FROM footer_social_links WHERE id = $1 RETURNING *`, [req.params.id]);
    if (del.rows.length === 0) return res.status(404).json({ success: false, message: 'Social link not found' });
    await logAudit('delete_social_link', req.params.id, req.user.id, { platform: del.rows[0].platform });
    successResponse(res, { success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 6. LEGAL LINKS CRUD
// ============================================================================
router.post('/legal-links', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const { title, url, display_order, enabled } = req.body;
    const ins = await pool.query(`
      INSERT INTO footer_legal_links (title, url, display_order, enabled)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [title, url, display_order || 1, enabled ?? true]);
    await logAudit('create_legal_link', ins.rows[0].id, req.user.id, req.body);
    successResponse(res, ins.rows[0], 201);
  } catch (err) {
    next(err);
  }
});

router.put('/legal-links/:id', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const { title, url, display_order, enabled } = req.body;
    const upd = await pool.query(`
      UPDATE footer_legal_links
      SET title = COALESCE($1, title),
          url = COALESCE($2, url),
          display_order = COALESCE($3, display_order),
          enabled = COALESCE($4, enabled),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *;
    `, [title, url, display_order, enabled, req.params.id]);
    if (upd.rows.length === 0) return res.status(404).json({ success: false, message: 'Legal link not found' });
    await logAudit('update_legal_link', req.params.id, req.user.id, req.body);
    successResponse(res, upd.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/legal-links/:id', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const del = await pool.query(`DELETE FROM footer_legal_links WHERE id = $1 RETURNING *`, [req.params.id]);
    if (del.rows.length === 0) return res.status(404).json({ success: false, message: 'Legal link not found' });
    await logAudit('delete_legal_link', req.params.id, req.user.id, { title: del.rows[0].title });
    successResponse(res, { success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 7. PUBLISHING, HISTORY & RESTORE
// ============================================================================
router.post('/publish', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    await pool.query(`UPDATE cms_footer_settings SET publication_status = 'published', published_at = NOW()`);
    
    // Save version snapshot
    const sRes = await pool.query(`SELECT * FROM cms_footer_settings LIMIT 1`);
    const cRes = await pool.query(`SELECT * FROM cms_footer_columns ORDER BY column_order ASC`);
    const lRes = await pool.query(`SELECT * FROM cms_footer_links ORDER BY sort_order ASC`);
    const socRes = await pool.query(`SELECT * FROM footer_social_links ORDER BY display_order ASC`);
    const legRes = await pool.query(`SELECT * FROM footer_legal_links ORDER BY display_order ASC`);

    const countRes = await pool.query(`SELECT COALESCE(MAX(version_number), 0) + 1 AS next_ver FROM footer_versions`);
    const nextVer = countRes.rows[0].next_ver;

    await pool.query(`
      INSERT INTO footer_versions (version_number, configuration_snapshot, changed_by, change_summary)
      VALUES ($1, $2, $3, $4)
    `, [nextVer, JSON.stringify({ settings: sRes.rows[0], columns: cRes.rows, links: lRes.rows, social_links: socRes.rows, legal_links: legRes.rows }), req.user.id, req.body.summary || 'Published footer update']);

    await logAudit('publish_footer', sRes.rows[0]?.id, req.user.id, { version: nextVer });
    successResponse(res, { success: true, version: nextVer, message: 'Footer configuration published successfully.' });
  } catch (err) {
    next(err);
  }
});

router.post('/unpublish', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    await pool.query(`UPDATE cms_footer_settings SET publication_status = 'draft'`);
    await logAudit('unpublish_footer', null, req.user.id, {});
    successResponse(res, { success: true, message: 'Footer configuration set to draft.' });
  } catch (err) {
    next(err);
  }
});

router.get('/history', authenticate, requirePermission('cms.read'), async (req, res, next) => {
  try {
    const vers = await pool.query(`
      SELECT fv.*, u.first_name, u.last_name, u.email
      FROM footer_versions fv
      LEFT JOIN users u ON fv.changed_by = u.id
      ORDER BY fv.version_number DESC
      LIMIT 20
    `);
    successResponse(res, vers.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/restore/:versionId', authenticate, requirePermission('cms.homepage.update'), async (req, res, next) => {
  try {
    const vRes = await pool.query(`SELECT * FROM footer_versions WHERE id = $1`, [req.params.versionId]);
    if (vRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Version not found' });
    
    const snap = vRes.rows[0].configuration_snapshot;
    if (snap.settings) {
      await pool.query(`
        UPDATE cms_footer_settings
        SET brand_name = $1, brand_description = $2, company_info = $3,
            copyright_owner = $4, copyright_text = $5, background_color = $6,
            heading_color = $7, text_color = $8, link_color = $9, hover_color = $10,
            border_color = $11, updated_at = NOW()
        WHERE id = $12
      `, [
        snap.settings.brand_name, snap.settings.brand_description, snap.settings.company_info,
        snap.settings.copyright_owner, snap.settings.copyright_text, snap.settings.background_color,
        snap.settings.heading_color, snap.settings.text_color, snap.settings.link_color,
        snap.settings.hover_color, snap.settings.border_color, snap.settings.id
      ]);
    }
    await logAudit('restore_version', req.params.versionId, req.user.id, { version: vRes.rows[0].version_number });
    successResponse(res, { success: true, message: `Restored to version ${vRes.rows[0].version_number}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
