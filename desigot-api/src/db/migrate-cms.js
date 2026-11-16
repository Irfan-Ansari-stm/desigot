'use strict';

const fs = require('fs');
const path = require('path');
const pool = require('./pool');

const CMS_PERMISSIONS = [
  // HOMEPAGE
  { name: 'Read Homepage Settings', slug: 'cms.homepage.read', resource: 'cms.homepage', action: 'read' },
  { name: 'Update Homepage Settings', slug: 'cms.homepage.update', resource: 'cms.homepage', action: 'update' },
  { name: 'Reorder Homepage Sections', slug: 'cms.homepage.reorder', resource: 'cms.homepage', action: 'reorder' },

  // HERO SECTION
  { name: 'Read Hero Sections', slug: 'cms.hero.read', resource: 'cms.hero', action: 'read' },
  { name: 'Create Hero Section', slug: 'cms.hero.create', resource: 'cms.hero', action: 'create' },
  { name: 'Update Hero Section', slug: 'cms.hero.update', resource: 'cms.hero', action: 'update' },
  { name: 'Delete Hero Section', slug: 'cms.hero.delete', resource: 'cms.hero', action: 'delete' },

  // NAVIGATION MENUS
  { name: 'Read Navigation Menus', slug: 'cms.navigation.read', resource: 'cms.navigation', action: 'read' },
  { name: 'Create Navigation Menu', slug: 'cms.navigation.create', resource: 'cms.navigation', action: 'create' },
  { name: 'Update Navigation Menu', slug: 'cms.navigation.update', resource: 'cms.navigation', action: 'update' },
  { name: 'Delete Navigation Menu', slug: 'cms.navigation.delete', resource: 'cms.navigation', action: 'delete' },
  { name: 'Reorder Menu Items', slug: 'cms.navigation.reorder', resource: 'cms.navigation', action: 'reorder' },

  // MEGA MENU
  { name: 'Read Mega Menu', slug: 'cms.mega_menu.read', resource: 'cms.mega_menu', action: 'read' },
  { name: 'Update Mega Menu', slug: 'cms.mega_menu.update', resource: 'cms.mega_menu', action: 'update' },

  // SERVICES PAGE
  { name: 'Read Services Page CMS', slug: 'cms.services_page.read', resource: 'cms.services_page', action: 'read' },
  { name: 'Update Services Page CMS', slug: 'cms.services_page.update', resource: 'cms.services_page', action: 'update' },

  // CATEGORIES PAGE
  { name: 'Read Categories Page CMS', slug: 'cms.categories_page.read', resource: 'cms.categories_page', action: 'read' },
  { name: 'Update Categories Page CMS', slug: 'cms.categories_page.update', resource: 'cms.categories_page', action: 'update' },

  // FEATURED SECTIONS
  { name: 'Read Featured Sections', slug: 'cms.featured_sections.read', resource: 'cms.featured_sections', action: 'read' },
  { name: 'Create Featured Section', slug: 'cms.featured_sections.create', resource: 'cms.featured_sections', action: 'create' },
  { name: 'Update Featured Section', slug: 'cms.featured_sections.update', resource: 'cms.featured_sections', action: 'update' },
  { name: 'Delete Featured Section', slug: 'cms.featured_sections.delete', resource: 'cms.featured_sections', action: 'delete' },

  // TRENDING SECTIONS
  { name: 'Read Trending Sections', slug: 'cms.trending_sections.read', resource: 'cms.trending_sections', action: 'read' },
  { name: 'Create Trending Section', slug: 'cms.trending_sections.create', resource: 'cms.trending_sections', action: 'create' },
  { name: 'Update Trending Section', slug: 'cms.trending_sections.update', resource: 'cms.trending_sections', action: 'update' },
  { name: 'Delete Trending Section', slug: 'cms.trending_sections.delete', resource: 'cms.trending_sections', action: 'delete' },

  // ABOUT US
  { name: 'Read About Us Content', slug: 'cms.about.read', resource: 'cms.about', action: 'read' },
  { name: 'Update About Us Content', slug: 'cms.about.update', resource: 'cms.about', action: 'update' },

  // CONTACT PAGE
  { name: 'Read Contact Settings', slug: 'cms.contact.read', resource: 'cms.contact', action: 'read' },
  { name: 'Update Contact Settings', slug: 'cms.contact.update', resource: 'cms.contact', action: 'update' },
  { name: 'Manage Contact Submissions', slug: 'cms.contact.submissions', resource: 'cms.contact', action: 'submissions' },

  // FAQ MANAGEMENT
  { name: 'Read FAQs', slug: 'cms.faqs.read', resource: 'cms.faqs', action: 'read' },
  { name: 'Create FAQ', slug: 'cms.faqs.create', resource: 'cms.faqs', action: 'create' },
  { name: 'Update FAQ', slug: 'cms.faqs.update', resource: 'cms.faqs', action: 'update' },
  { name: 'Delete FAQ', slug: 'cms.faqs.delete', resource: 'cms.faqs', action: 'delete' },

  // LEGAL DOCUMENTS
  { name: 'Read Legal Documents', slug: 'cms.legal.read', resource: 'cms.legal', action: 'read' },
  { name: 'Update Legal Documents', slug: 'cms.legal.update', resource: 'cms.legal', action: 'update' },
  { name: 'Publish Legal Document Version', slug: 'cms.legal.publish_version', resource: 'cms.legal', action: 'publish_version' },
  { name: 'Restore Legal Document Version', slug: 'cms.legal.restore', resource: 'cms.legal', action: 'restore' },

  // FOOTER MANAGEMENT
  { name: 'Read Footer Settings', slug: 'cms.footer.read', resource: 'cms.footer', action: 'read' },
  { name: 'Update Footer Settings', slug: 'cms.footer.update', resource: 'cms.footer', action: 'update' },

  // STATIC PAGES
  { name: 'Read Pages', slug: 'cms.pages.read', resource: 'cms.pages', action: 'read' },
  { name: 'Create Page', slug: 'cms.pages.create', resource: 'cms.pages', action: 'create' },
  { name: 'Update Page', slug: 'cms.pages.update', resource: 'cms.pages', action: 'update' },
  { name: 'Delete Page', slug: 'cms.pages.delete', resource: 'cms.pages', action: 'delete' },
  { name: 'Publish Page', slug: 'cms.pages.publish', resource: 'cms.pages', action: 'publish' },
  { name: 'Restore Page Version', slug: 'cms.pages.restore', resource: 'cms.pages', action: 'restore' },

  // BLOG MANAGEMENT
  { name: 'Read Blog Posts', slug: 'cms.blog.read', resource: 'cms.blog', action: 'read' },
  { name: 'Create Blog Post', slug: 'cms.blog.create', resource: 'cms.blog', action: 'create' },
  { name: 'Update Blog Post', slug: 'cms.blog.update', resource: 'cms.blog', action: 'update' },
  { name: 'Delete Blog Post', slug: 'cms.blog.delete', resource: 'cms.blog', action: 'delete' },
  { name: 'Publish Blog Post', slug: 'cms.blog.publish', resource: 'cms.blog', action: 'publish' },
  { name: 'Manage Blog Categories & Tags', slug: 'cms.blog.taxonomy', resource: 'cms.blog', action: 'taxonomy' },

  // MEDIA ASSETS
  { name: 'Read Media Assets', slug: 'cms.media.read', resource: 'cms.media', action: 'read' },
  { name: 'Upload Media Asset', slug: 'cms.media.upload', resource: 'cms.media', action: 'upload' },
  { name: 'Delete Media Asset', slug: 'cms.media.delete', resource: 'cms.media', action: 'delete' },

  // SEO & REDIRECTS
  { name: 'Read SEO Settings', slug: 'cms.seo.read', resource: 'cms.seo', action: 'read' },
  { name: 'Update SEO Settings', slug: 'cms.seo.update', resource: 'cms.seo', action: 'update' },
  { name: 'Manage Redirects', slug: 'cms.seo.redirects', resource: 'cms.seo', action: 'redirects' },

  // AUDIT LOGS
  { name: 'Read CMS Audit Logs', slug: 'cms.audit.read', resource: 'cms.audit', action: 'read' },

  // GENERAL CMS READ
  { name: 'Read CMS Module', slug: 'cms.read', resource: 'cms', action: 'read' },
];

async function migrateCMS() {
  console.log('⚡ Starting CMS & Website Management Migration...');
  const client = await pool.getClient();

  try {
    // 1. Run SQL schema
    const sqlPath = path.join(__dirname, 'cms-website-management-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('✅ Base CMS schema and tables created/updated successfully.');

    // 2. Register CMS Module in modules table
    const modRes = await client.query(`
      INSERT INTO modules (name, slug, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING id;
    `, ['CMS & Website Management', 'cms', 'Content management system, website builder, legal versioning, blog engine, media assets, navigation, and SEO engine.']);
    const moduleId = modRes.rows[0].id;
    console.log(`✅ Module "CMS & Website Management" registered (id: ${moduleId}).`);

    // 3. Register Permissions
    let permsAdded = 0;
    const permMap = {};
    for (const p of CMS_PERMISSIONS) {
      const res = await client.query(`
        INSERT INTO permissions (name, slug, resource, action, module_id, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO UPDATE 
          SET name = EXCLUDED.name, resource = EXCLUDED.resource, action = EXCLUDED.action, module_id = EXCLUDED.module_id
        RETURNING id, slug;
      `, [p.name, p.slug, p.resource, p.action, moduleId, p.name]);
      permMap[p.slug] = res.rows[0].id;
      permsAdded++;
    }
    console.log(`✅ ${permsAdded} permissions registered for CMS & Website Management.`);

    // 4. Create / Update Specific CMS Roles
    const rolesToCreate = [
      { name: 'CMS Manager', slug: 'cms_manager', description: 'Full administrative control over all website content, pages, navigation, and media.' },
      { name: 'Content Editor', slug: 'content_editor', description: 'Can edit static pages, hero sections, blog posts, and marketing content.' },
      { name: 'Blog Editor', slug: 'blog_editor', description: 'Can create, edit, publish, and manage blog posts and categories.' },
      { name: 'SEO Specialist', slug: 'seo_specialist', description: 'Can edit SEO metadata, sitemaps, robots.txt, and 301/302 redirects.' }
    ];

    const roleMap = {};
    for (const r of rolesToCreate) {
      const roleRes = await client.query(`
        INSERT INTO roles (name, slug, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
        RETURNING id, slug;
      `, [r.name, r.slug, r.description]);
      roleMap[r.slug] = roleRes.rows[0].id;
    }
    console.log('✅ CMS roles registered.');

    // 5. Assign Permissions to Roles
    // Superadmin & Admin get all permissions
    const superAdminRole = await client.query(`SELECT id FROM roles WHERE slug = 'superadmin' OR slug = 'admin' LIMIT 1`);
    if (superAdminRole.rows.length > 0) {
      const sAdminId = superAdminRole.rows[0].id;
      for (const permId of Object.values(permMap)) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [sAdminId, permId]);
      }
      console.log('✅ Super Admin role assigned all CMS permissions.');
    }

    // CMS Manager gets all CMS permissions
    for (const permId of Object.values(permMap)) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      `, [roleMap['cms_manager'], permId]);
    }

    // Content Editor
    for (const [slug, id] of Object.entries(permMap)) {
      if (slug.startsWith('cms.pages') || slug.startsWith('cms.blog') || slug.startsWith('cms.about') || 
          slug.startsWith('cms.faqs') || slug.startsWith('cms.media') || slug === 'cms.read') {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['content_editor'], id]);
      }
    }

    // Blog Editor
    for (const [slug, id] of Object.entries(permMap)) {
      if (slug.startsWith('cms.blog') || slug.startsWith('cms.media') || slug === 'cms.read') {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['blog_editor'], id]);
      }
    }

    // SEO Specialist
    for (const [slug, id] of Object.entries(permMap)) {
      if (slug.startsWith('cms.seo') || slug === 'cms.read') {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['seo_specialist'], id]);
      }
    }

    console.log('🎉 CMS & Website Management migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateCMS()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = migrateCMS;
