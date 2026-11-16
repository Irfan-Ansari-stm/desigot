'use strict';

const router = require('express').Router();
const svc = require('./cms.service');
const pool = require('../../db/pool');
const { successResponse, paginatedResponse } = require('../../shared/utils');

// 1. Homepage data
router.get('/homepage', async (req, res) => {
  const settings = await svc.getHomepageSettings();
  const sections = await pool.query(`SELECT * FROM cms_homepage_sections WHERE is_active = true ORDER BY sort_order ASC`);
  const heroSlides = await svc.getHeroSections({ active: true });
  successResponse(res, {
    settings,
    hero: heroSlides.length > 0 ? heroSlides[0] : null,
    heroSlides,
    sections: sections.rows
  });
});

// 2. Hero slides
router.get('/hero', async (req, res) => {
  const slides = await svc.getHeroSections({ active: true });
  successResponse(res, slides);
});

// 3. Navigation menus
router.get('/navigation', async (req, res) => {
  const menus = await svc.getMenus();
  const activeMenus = menus.filter(m => m.is_active);
  for (const m of activeMenus) {
    m.items = (m.items || []).filter(item => item.is_active);
  }
  successResponse(res, activeMenus);
});

// 4. Browse Mega Menu
router.get('/mega-menu', async (req, res) => {
  const columns = await svc.getMegaMenu();
  const activeCols = columns.filter(c => c.is_active);
  for (const c of activeCols) {
    c.items = (c.items || []).filter(i => i.is_active);
  }
  successResponse(res, activeCols);
});

// 5. Services Page & Categories Page
router.get('/services-page', async (req, res) => {
  const settings = await svc.getServicesPageSettings();
  let featuredServices = [];
  if (settings && Array.isArray(settings.featured_service_ids) && settings.featured_service_ids.length > 0) {
    const sRes = await pool.query(`
      SELECT s.*, u.first_name, u.last_name, u.avatar_url
      FROM services s
      JOIN users u ON s.seller_id = u.id
      WHERE s.id = ANY($1)
    `, [settings.featured_service_ids]);
    featuredServices = sRes.rows;
  }
  successResponse(res, { settings, featuredServices });
});

router.get('/categories-page', async (req, res) => {
  const settings = await svc.getCategoriesPageSettings();
  const cats = await pool.query(`SELECT * FROM listing_categories WHERE is_active = true ORDER BY sort_order ASC`);
  successResponse(res, { settings, categories: cats.rows });
});

// 6. Featured & Trending
router.get('/featured-sections', async (req, res) => {
  const sections = await pool.query(`SELECT * FROM cms_featured_sections WHERE is_active = true ORDER BY sort_order ASC`);
  successResponse(res, sections.rows);
});

router.get('/trending-sections', async (req, res) => {
  const sections = await pool.query(`SELECT * FROM cms_trending_sections WHERE is_active = true ORDER BY sort_order ASC`);
  successResponse(res, sections.rows);
});

// 7. About Us
router.get('/about', async (req, res) => {
  const content = await svc.getAboutContent();
  const team = await pool.query(`SELECT * FROM cms_team_members WHERE is_active = true ORDER BY sort_order ASC`);
  successResponse(res, { content, team: team.rows });
});

// 8. Contact Settings & Public Submission
router.get('/contact', async (req, res) => {
  const settings = await svc.getContactSettings();
  successResponse(res, settings);
});

router.post('/contact', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const sub = await svc.submitContactForm(req.body, ip);
  successResponse(res, sub, 201, { message: 'Inquiry received. We will respond within 24 hours.' });
});

// 9. FAQ
router.get('/faqs', async (req, res) => {
  const categories = await svc.getFaqCategories();
  const faqs = await svc.getFaqs({ page_association: req.query.page || 'all' });
  successResponse(res, { categories, faqs: faqs.filter(f => f.is_published) });
});

// 10. Legal Document
router.get('/legal/:docType', async (req, res) => {
  const doc = await pool.query(`
    SELECT doc_type, title, content_html, version, effective_date, updated_at
    FROM cms_legal_documents
    WHERE doc_type = $1 AND is_published = true
  `, [req.params.docType]);
  if (doc.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }
  successResponse(res, doc.rows[0]);
});

// 11. Footer
router.get('/footer', async (req, res) => {
  const settings = await svc.getFooterSettings();
  const columns = await svc.getFooterColumns();
  const activeCols = columns.filter(c => c.is_active);
  for (const col of activeCols) {
    col.links = (col.links || []).filter(l => l.is_active);
  }
  successResponse(res, { settings, columns: activeCols });
});

// 12. Static Pages
router.get('/pages/:slug', async (req, res) => {
  const page = await pool.query(`
    SELECT * FROM cms_static_pages
    WHERE slug = $1 AND status = 'published'
  `, [req.params.slug]);
  if (page.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Page not found' });
  }
  successResponse(res, page.rows[0]);
});

// 13. Blog
router.get('/blog/posts', async (req, res) => {
  const result = await svc.getBlogPosts({ ...req.query, status: 'published' });
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/blog/posts/:slug', async (req, res) => {
  const post = await svc.getBlogPostBySlug(req.params.slug);
  if (!post || post.status !== 'published') {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }
  successResponse(res, post);
});

router.get('/blog/categories', async (req, res) => {
  const cats = await svc.getBlogCategories();
  successResponse(res, cats);
});

// 14. SEO
router.get('/seo', async (req, res) => {
  const settings = await svc.getSeoSettings();
  successResponse(res, settings);
});

module.exports = router;
