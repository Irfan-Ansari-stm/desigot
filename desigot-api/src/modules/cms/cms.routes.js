'use strict';

const router = require('express').Router();
const svc = require('./cms.service');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/authorize');
const { successResponse, paginatedResponse } = require('../../shared/utils');

// ============================================================================
// 0. KPI & SUMMARY STATS
// ============================================================================
router.get('/stats/summary', authenticate, requirePermission('cms.read'), async (req, res) => {
  const stats = await svc.getStatsSummary();
  successResponse(res, stats);
});

// ============================================================================
// 1. HOMEPAGE MANAGEMENT
// ============================================================================
router.get('/homepage', authenticate, requirePermission('cms.homepage.read'), async (req, res) => {
  const settings = await svc.getHomepageSettings();
  const sections = await svc.getHomepageSections();
  successResponse(res, { settings, sections });
});

router.put('/homepage', authenticate, requirePermission('cms.homepage.update'), async (req, res) => {
  const settings = await svc.updateHomepageSettings(req.body, req.user.id);
  successResponse(res, settings, 200, { message: 'Homepage settings updated successfully.' });
});

router.put('/homepage/sections/reorder', authenticate, requirePermission('cms.homepage.reorder'), async (req, res) => {
  const sections = await svc.updateHomepageSectionsOrder(req.body.orderedKeys, req.user.id);
  successResponse(res, sections, 200, { message: 'Homepage sections reordered successfully.' });
});

router.put('/homepage/sections/:id', authenticate, requirePermission('cms.homepage.update'), async (req, res) => {
  const section = await svc.updateHomepageSection(req.params.id, req.body, req.user.id);
  successResponse(res, section, 200, { message: 'Homepage section updated successfully.' });
});

// ============================================================================
// 2. HERO SECTIONS & SLIDES
// ============================================================================
router.get('/hero', authenticate, requirePermission('cms.hero.read'), async (req, res) => {
  const slides = await svc.getHeroSections(req.query);
  successResponse(res, slides);
});

router.get('/hero/:id', authenticate, requirePermission('cms.hero.read'), async (req, res) => {
  const slide = await svc.getHeroSectionById(req.params.id);
  successResponse(res, slide);
});

router.post('/hero', authenticate, requirePermission('cms.hero.create'), async (req, res) => {
  const slide = await svc.createHeroSection(req.body, req.user.id);
  successResponse(res, slide, 201, { message: 'Hero slide created successfully.' });
});

router.put('/hero/:id', authenticate, requirePermission('cms.hero.update'), async (req, res) => {
  const slide = await svc.updateHeroSection(req.params.id, req.body, req.user.id);
  successResponse(res, slide, 200, { message: 'Hero slide updated successfully.' });
});

router.patch('/hero/:id/toggle-status', authenticate, requirePermission('cms.hero.update'), async (req, res) => {
  const slide = await svc.toggleHeroStatus(req.params.id, req.user.id);
  successResponse(res, slide, 200, { message: `Hero slide is now ${slide.is_active ? 'active' : 'inactive'}.` });
});

router.delete('/hero/:id', authenticate, requirePermission('cms.hero.delete'), async (req, res) => {
  const result = await svc.deleteHeroSection(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 3. NAVIGATION MENUS
// ============================================================================
router.get('/navigation', authenticate, requirePermission('cms.navigation.read'), async (req, res) => {
  const menus = await svc.getMenus();
  successResponse(res, menus);
});

router.post('/navigation', authenticate, requirePermission('cms.navigation.create'), async (req, res) => {
  const menu = await svc.createMenu(req.body, req.user.id);
  successResponse(res, menu, 201, { message: 'Navigation menu created successfully.' });
});

router.put('/navigation/:id', authenticate, requirePermission('cms.navigation.update'), async (req, res) => {
  const menu = await svc.updateMenu(req.params.id, req.body, req.user.id);
  successResponse(res, menu, 200, { message: 'Navigation menu updated successfully.' });
});

router.delete('/navigation/:id', authenticate, requirePermission('cms.navigation.delete'), async (req, res) => {
  const result = await svc.deleteMenu(req.params.id, req.user.id);
  successResponse(res, result);
});

router.post('/navigation/:menuId/items', authenticate, requirePermission('cms.navigation.create'), async (req, res) => {
  const item = await svc.createMenuItem(req.params.menuId, req.body, req.user.id);
  successResponse(res, item, 201, { message: 'Menu item created successfully.' });
});

router.put('/navigation/items/:id', authenticate, requirePermission('cms.navigation.update'), async (req, res) => {
  const item = await svc.updateMenuItem(req.params.id, req.body, req.user.id);
  successResponse(res, item, 200, { message: 'Menu item updated successfully.' });
});

router.delete('/navigation/items/:id', authenticate, requirePermission('cms.navigation.delete'), async (req, res) => {
  const result = await svc.deleteMenuItem(req.params.id, req.user.id);
  successResponse(res, result);
});

router.put('/navigation/items/reorder', authenticate, requirePermission('cms.navigation.reorder'), async (req, res) => {
  const result = await svc.reorderMenuItems(req.body.items, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 4. MEGA MENU
// ============================================================================
router.get('/mega-menu', authenticate, requirePermission('cms.mega_menu.read'), async (req, res) => {
  const columns = await svc.getMegaMenu();
  successResponse(res, columns);
});

router.post('/mega-menu/columns', authenticate, requirePermission('cms.mega_menu.update'), async (req, res) => {
  const column = await svc.createMegaMenuColumn(req.body, req.user.id);
  successResponse(res, column, 201);
});

router.put('/mega-menu/columns/:id', authenticate, requirePermission('cms.mega_menu.update'), async (req, res) => {
  const column = await svc.updateMegaMenuColumn(req.params.id, req.body, req.user.id);
  successResponse(res, column);
});

router.delete('/mega-menu/columns/:id', authenticate, requirePermission('cms.mega_menu.update'), async (req, res) => {
  const result = await svc.deleteMegaMenuColumn(req.params.id, req.user.id);
  successResponse(res, result);
});

router.post('/mega-menu/columns/:columnId/items', authenticate, requirePermission('cms.mega_menu.update'), async (req, res) => {
  const item = await svc.createMegaMenuItem(req.params.columnId, req.body, req.user.id);
  successResponse(res, item, 201);
});

router.put('/mega-menu/items/:id', authenticate, requirePermission('cms.mega_menu.update'), async (req, res) => {
  const item = await svc.updateMegaMenuItem(req.params.id, req.body, req.user.id);
  successResponse(res, item);
});

router.delete('/mega-menu/items/:id', authenticate, requirePermission('cms.mega_menu.update'), async (req, res) => {
  const result = await svc.deleteMegaMenuItem(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 5. SERVICES PAGE & CATEGORIES PAGE
// ============================================================================
router.get('/services-page', authenticate, requirePermission('cms.services_page.read'), async (req, res) => {
  const settings = await svc.getServicesPageSettings();
  successResponse(res, settings);
});

router.put('/services-page', authenticate, requirePermission('cms.services_page.update'), async (req, res) => {
  const settings = await svc.updateServicesPageSettings(req.body, req.user.id);
  successResponse(res, settings, 200, { message: 'Services page settings updated.' });
});

router.get('/categories-page', authenticate, requirePermission('cms.categories_page.read'), async (req, res) => {
  const settings = await svc.getCategoriesPageSettings();
  successResponse(res, settings);
});

router.put('/categories-page', authenticate, requirePermission('cms.categories_page.update'), async (req, res) => {
  const settings = await svc.updateCategoriesPageSettings(req.body, req.user.id);
  successResponse(res, settings, 200, { message: 'Categories page settings updated.' });
});

// ============================================================================
// 6. FEATURED & TRENDING SECTIONS
// ============================================================================
router.get('/featured-sections', authenticate, requirePermission('cms.featured_sections.read'), async (req, res) => {
  const sections = await svc.getFeaturedSections();
  successResponse(res, sections);
});

router.post('/featured-sections', authenticate, requirePermission('cms.featured_sections.create'), async (req, res) => {
  const section = await svc.createFeaturedSection(req.body, req.user.id);
  successResponse(res, section, 201);
});

router.put('/featured-sections/:id', authenticate, requirePermission('cms.featured_sections.update'), async (req, res) => {
  const section = await svc.updateFeaturedSection(req.params.id, req.body, req.user.id);
  successResponse(res, section);
});

router.delete('/featured-sections/:id', authenticate, requirePermission('cms.featured_sections.delete'), async (req, res) => {
  const result = await svc.deleteFeaturedSection(req.params.id, req.user.id);
  successResponse(res, result);
});

router.get('/trending-sections', authenticate, requirePermission('cms.trending_sections.read'), async (req, res) => {
  const sections = await svc.getTrendingSections();
  successResponse(res, sections);
});

router.post('/trending-sections', authenticate, requirePermission('cms.trending_sections.create'), async (req, res) => {
  const section = await svc.createTrendingSection(req.body, req.user.id);
  successResponse(res, section, 201);
});

router.put('/trending-sections/:id', authenticate, requirePermission('cms.trending_sections.update'), async (req, res) => {
  const section = await svc.updateTrendingSection(req.params.id, req.body, req.user.id);
  successResponse(res, section);
});

router.delete('/trending-sections/:id', authenticate, requirePermission('cms.trending_sections.delete'), async (req, res) => {
  const result = await svc.deleteTrendingSection(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 7. ABOUT US CONTENT & TEAM MEMBERS
// ============================================================================
router.get('/about', authenticate, requirePermission('cms.about.read'), async (req, res) => {
  const content = await svc.getAboutContent();
  const team = await svc.getTeamMembers();
  successResponse(res, { content, team });
});

router.put('/about', authenticate, requirePermission('cms.about.update'), async (req, res) => {
  const content = await svc.updateAboutContent(req.body, req.user.id);
  successResponse(res, content, 200, { message: 'About Us content updated successfully.' });
});

router.post('/about/team', authenticate, requirePermission('cms.about.update'), async (req, res) => {
  const member = await svc.createTeamMember(req.body, req.user.id);
  successResponse(res, member, 201);
});

router.put('/about/team/:id', authenticate, requirePermission('cms.about.update'), async (req, res) => {
  const member = await svc.updateTeamMember(req.params.id, req.body, req.user.id);
  successResponse(res, member);
});

router.delete('/about/team/:id', authenticate, requirePermission('cms.about.update'), async (req, res) => {
  const result = await svc.deleteTeamMember(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 8. CONTACT PAGE & SUBMISSIONS
// ============================================================================
router.get('/contact/settings', authenticate, requirePermission('cms.contact.read'), async (req, res) => {
  const settings = await svc.getContactSettings();
  successResponse(res, settings);
});

router.put('/contact/settings', authenticate, requirePermission('cms.contact.update'), async (req, res) => {
  const settings = await svc.updateContactSettings(req.body, req.user.id);
  successResponse(res, settings, 200, { message: 'Contact settings updated.' });
});

router.get('/contact/submissions', authenticate, requirePermission('cms.contact.submissions'), async (req, res) => {
  const result = await svc.getContactSubmissions(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/contact/submissions/:id', authenticate, requirePermission('cms.contact.submissions'), async (req, res) => {
  const sub = await svc.getContactSubmissionById(req.params.id);
  successResponse(res, sub);
});

router.patch('/contact/submissions/:id/status', authenticate, requirePermission('cms.contact.submissions'), async (req, res) => {
  const { status, adminNotes, assignedToId } = req.body;
  const sub = await svc.updateContactSubmissionStatus(req.params.id, status, adminNotes, assignedToId, req.user.id);
  successResponse(res, sub, 200, { message: 'Submission status updated.' });
});

// ============================================================================
// 9. FAQ MANAGEMENT
// ============================================================================
router.get('/faqs/categories', authenticate, requirePermission('cms.faqs.read'), async (req, res) => {
  const categories = await svc.getFaqCategories();
  successResponse(res, categories);
});

router.post('/faqs/categories', authenticate, requirePermission('cms.faqs.create'), async (req, res) => {
  const cat = await svc.createFaqCategory(req.body, req.user.id);
  successResponse(res, cat, 201);
});

router.put('/faqs/categories/:id', authenticate, requirePermission('cms.faqs.update'), async (req, res) => {
  const cat = await svc.updateFaqCategory(req.params.id, req.body, req.user.id);
  successResponse(res, cat);
});

router.delete('/faqs/categories/:id', authenticate, requirePermission('cms.faqs.delete'), async (req, res) => {
  const result = await svc.deleteFaqCategory(req.params.id, req.user.id);
  successResponse(res, result);
});

router.get('/faqs', authenticate, requirePermission('cms.faqs.read'), async (req, res) => {
  const faqs = await svc.getFaqs(req.query);
  successResponse(res, faqs);
});

router.post('/faqs', authenticate, requirePermission('cms.faqs.create'), async (req, res) => {
  const faq = await svc.createFaq(req.body, req.user.id);
  successResponse(res, faq, 201);
});

router.put('/faqs/:id', authenticate, requirePermission('cms.faqs.update'), async (req, res) => {
  const faq = await svc.updateFaq(req.params.id, req.body, req.user.id);
  successResponse(res, faq);
});

router.delete('/faqs/:id', authenticate, requirePermission('cms.faqs.delete'), async (req, res) => {
  const result = await svc.deleteFaq(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 10. LEGAL DOCUMENTS & VERSIONING
// ============================================================================
router.get('/legal', authenticate, requirePermission('cms.legal.read'), async (req, res) => {
  const docs = await svc.getLegalDocuments();
  successResponse(res, docs);
});

router.get('/legal/:docType', authenticate, requirePermission('cms.legal.read'), async (req, res) => {
  const doc = await svc.getLegalDocument(req.params.docType);
  successResponse(res, doc);
});

router.put('/legal/:docType', authenticate, requirePermission('cms.legal.update'), async (req, res) => {
  const doc = await svc.updateLegalDocument(req.params.docType, req.body, req.user.id);
  successResponse(res, doc, 200, { message: `${req.params.docType} updated and new version archived.` });
});

router.post('/legal/:docType/restore/:versionId', authenticate, requirePermission('cms.legal.restore'), async (req, res) => {
  const doc = await svc.restoreLegalDocumentVersion(req.params.docType, req.params.versionId, req.user.id);
  successResponse(res, doc, 200, { message: `Restored ${req.params.docType} version successfully.` });
});

// ============================================================================
// 11. FOOTER MANAGEMENT
// ============================================================================
router.get('/footer', authenticate, requirePermission('cms.footer.read'), async (req, res) => {
  const settings = await svc.getFooterSettings();
  const columns = await svc.getFooterColumns();
  successResponse(res, { settings, columns });
});

router.put('/footer/settings', authenticate, requirePermission('cms.footer.update'), async (req, res) => {
  const settings = await svc.updateFooterSettings(req.body, req.user.id);
  successResponse(res, settings, 200, { message: 'Footer settings updated.' });
});

router.post('/footer/columns', authenticate, requirePermission('cms.footer.update'), async (req, res) => {
  const col = await svc.createFooterColumn(req.body, req.user.id);
  successResponse(res, col, 201);
});

router.put('/footer/columns/:id', authenticate, requirePermission('cms.footer.update'), async (req, res) => {
  const col = await svc.updateFooterColumn(req.params.id, req.body, req.user.id);
  successResponse(res, col);
});

router.delete('/footer/columns/:id', authenticate, requirePermission('cms.footer.update'), async (req, res) => {
  const result = await svc.deleteFooterColumn(req.params.id, req.user.id);
  successResponse(res, result);
});

router.post('/footer/columns/:colId/links', authenticate, requirePermission('cms.footer.update'), async (req, res) => {
  const link = await svc.createFooterLink(req.params.colId, req.body, req.user.id);
  successResponse(res, link, 201);
});

router.put('/footer/links/:id', authenticate, requirePermission('cms.footer.update'), async (req, res) => {
  const link = await svc.updateFooterLink(req.params.id, req.body, req.user.id);
  successResponse(res, link);
});

router.delete('/footer/links/:id', authenticate, requirePermission('cms.footer.update'), async (req, res) => {
  const result = await svc.deleteFooterLink(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 12. STATIC PAGES & VERSIONING
// ============================================================================
router.get('/pages', authenticate, requirePermission('cms.pages.read'), async (req, res) => {
  const result = await svc.getStaticPages(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/pages/:id', authenticate, requirePermission('cms.pages.read'), async (req, res) => {
  const page = await svc.getStaticPageById(req.params.id);
  successResponse(res, page);
});

router.post('/pages', authenticate, requirePermission('cms.pages.create'), async (req, res) => {
  const page = await svc.createStaticPage(req.body, req.user.id);
  successResponse(res, page, 201, { message: 'Static page created successfully.' });
});

router.put('/pages/:id', authenticate, requirePermission('cms.pages.update'), async (req, res) => {
  const page = await svc.updateStaticPage(req.params.id, req.body, req.user.id);
  successResponse(res, page, 200, { message: 'Static page updated and new version saved.' });
});

router.delete('/pages/:id', authenticate, requirePermission('cms.pages.delete'), async (req, res) => {
  const result = await svc.deleteStaticPage(req.params.id, req.user.id);
  successResponse(res, result);
});

router.post('/pages/:id/restore/:versionId', authenticate, requirePermission('cms.pages.restore'), async (req, res) => {
  const page = await svc.restoreStaticPageVersion(req.params.id, req.params.versionId, req.user.id);
  successResponse(res, page, 200, { message: 'Page version restored successfully.' });
});

// ============================================================================
// 13. BLOG SYSTEM
// ============================================================================
router.get('/blog/categories', authenticate, requirePermission('cms.blog.read'), async (req, res) => {
  const cats = await svc.getBlogCategories();
  successResponse(res, cats);
});

router.post('/blog/categories', authenticate, requirePermission('cms.blog.taxonomy'), async (req, res) => {
  const cat = await svc.createBlogCategory(req.body, req.user.id);
  successResponse(res, cat, 201);
});

router.put('/blog/categories/:id', authenticate, requirePermission('cms.blog.taxonomy'), async (req, res) => {
  const cat = await svc.updateBlogCategory(req.params.id, req.body, req.user.id);
  successResponse(res, cat);
});

router.delete('/blog/categories/:id', authenticate, requirePermission('cms.blog.taxonomy'), async (req, res) => {
  const result = await svc.deleteBlogCategory(req.params.id, req.user.id);
  successResponse(res, result);
});

router.get('/blog/tags', authenticate, requirePermission('cms.blog.read'), async (req, res) => {
  const tags = await svc.getBlogTags();
  successResponse(res, tags);
});

router.post('/blog/tags', authenticate, requirePermission('cms.blog.taxonomy'), async (req, res) => {
  const tag = await svc.createBlogTag(req.body, req.user.id);
  successResponse(res, tag, 201);
});

router.get('/blog/posts', authenticate, requirePermission('cms.blog.read'), async (req, res) => {
  const result = await svc.getBlogPosts(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.get('/blog/posts/:id', authenticate, requirePermission('cms.blog.read'), async (req, res) => {
  const post = await svc.getBlogPostById(req.params.id);
  successResponse(res, post);
});

router.post('/blog/posts', authenticate, requirePermission('cms.blog.create'), async (req, res) => {
  const post = await svc.createBlogPost(req.body, req.user.id);
  successResponse(res, post, 201, { message: 'Blog post created successfully.' });
});

router.put('/blog/posts/:id', authenticate, requirePermission('cms.blog.update'), async (req, res) => {
  const post = await svc.updateBlogPost(req.params.id, req.body, req.user.id);
  successResponse(res, post, 200, { message: 'Blog post updated and revision saved.' });
});

router.delete('/blog/posts/:id', authenticate, requirePermission('cms.blog.delete'), async (req, res) => {
  const result = await svc.deleteBlogPost(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 14. MEDIA LIBRARY ASSETS
// ============================================================================
router.get('/media', authenticate, requirePermission('cms.media.read'), async (req, res) => {
  const result = await svc.getMediaAssets(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

router.post('/media', authenticate, requirePermission('cms.media.upload'), async (req, res) => {
  const asset = await svc.uploadMediaAsset(req.body, req.user.id);
  successResponse(res, asset, 201, { message: 'Media asset uploaded successfully.' });
});

router.delete('/media/:id', authenticate, requirePermission('cms.media.delete'), async (req, res) => {
  const result = await svc.deleteMediaAsset(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 15. SEO SETTINGS & REDIRECTS
// ============================================================================
router.get('/seo', authenticate, requirePermission('cms.seo.read'), async (req, res) => {
  const settings = await svc.getSeoSettings();
  const redirects = await svc.getRedirects();
  successResponse(res, { settings, redirects });
});

router.put('/seo', authenticate, requirePermission('cms.seo.update'), async (req, res) => {
  const settings = await svc.updateSeoSettings(req.body, req.user.id);
  successResponse(res, settings, 200, { message: 'Global SEO settings updated.' });
});

router.get('/seo/redirects', authenticate, requirePermission('cms.seo.read'), async (req, res) => {
  const redirects = await svc.getRedirects(req.query);
  successResponse(res, redirects);
});

router.post('/seo/redirects', authenticate, requirePermission('cms.seo.redirects'), async (req, res) => {
  const redir = await svc.createRedirect(req.body, req.user.id);
  successResponse(res, redir, 201);
});

router.put('/seo/redirects/:id', authenticate, requirePermission('cms.seo.redirects'), async (req, res) => {
  const redir = await svc.updateRedirect(req.params.id, req.body, req.user.id);
  successResponse(res, redir);
});

router.delete('/seo/redirects/:id', authenticate, requirePermission('cms.seo.redirects'), async (req, res) => {
  const result = await svc.deleteRedirect(req.params.id, req.user.id);
  successResponse(res, result);
});

// ============================================================================
// 16. AUDIT LOGS
// ============================================================================
router.get('/audit-logs', authenticate, requirePermission('cms.audit.read'), async (req, res) => {
  const result = await svc.getAuditLogs(req.query);
  paginatedResponse(res, result.data, result.total, result.page, result.limit);
});

module.exports = router;
