'use strict';

const pool = require('./pool');

async function seedCMS() {
  console.log('🌱 Starting Comprehensive CMS & Website Management Seeding...');
  const client = await pool.getClient();

  try {
    // 0. Fetch existing context entities
    const adminRes = await client.query(`SELECT id FROM users WHERE is_super_admin = true OR role = 'admin' ORDER BY created_at ASC LIMIT 1`);
    const adminId = adminRes.rows.length > 0 ? adminRes.rows[0].id : null;

    const allUsersRes = await client.query(`SELECT id FROM users LIMIT 10`);
    const userIds = allUsersRes.rows.map(r => r.id);

    const categoriesRes = await client.query(`SELECT id, name, slug FROM listing_categories ORDER BY sort_order ASC, name ASC LIMIT 30`);
    const categories = categoriesRes.rows;

    const servicesRes = await client.query(`SELECT id, title FROM services LIMIT 20`);
    const serviceIds = servicesRes.rows.map(r => r.id);

    const productsRes = await client.query(`SELECT id, title FROM digital_products LIMIT 20`);
    const productIds = productsRes.rows.map(r => r.id);

    console.log(`Found context: Admin: ${adminId}, Categories: ${categories.length}, Services: ${serviceIds.length}, Products: ${productIds.length}`);

    // Clean existing CMS records for clean idempotency
    await client.query(`
      DELETE FROM cms_audit_logs;
      DELETE FROM cms_redirects;
      DELETE FROM cms_seo_settings;
      DELETE FROM cms_media_assets;
      DELETE FROM blog_post_revisions;
      DELETE FROM blog_post_tags;
      DELETE FROM blog_posts;
      DELETE FROM blog_tags;
      DELETE FROM blog_categories;
      DELETE FROM cms_static_page_versions;
      DELETE FROM cms_static_pages;
      DELETE FROM cms_footer_links;
      DELETE FROM cms_footer_columns;
      DELETE FROM cms_footer_settings;
      DELETE FROM cms_legal_document_versions;
      DELETE FROM cms_legal_documents;
      DELETE FROM cms_faqs;
      DELETE FROM cms_faq_categories;
      DELETE FROM cms_contact_submissions;
      DELETE FROM cms_contact_settings;
      DELETE FROM cms_team_members;
      DELETE FROM cms_about_content;
      DELETE FROM cms_trending_sections;
      DELETE FROM cms_featured_sections;
      DELETE FROM cms_categories_page_settings;
      DELETE FROM cms_services_page_settings;
      DELETE FROM cms_mega_menu_items;
      DELETE FROM cms_mega_menu_columns;
      DELETE FROM cms_menu_items;
      DELETE FROM cms_menus;
      DELETE FROM cms_hero_sections;
      DELETE FROM cms_homepage_sections;
      DELETE FROM cms_homepage_settings;
    `);

    // =========================================================================
    // 1. HERO SECTIONS & SLIDES (Minimum 5 slides)
    // =========================================================================
    const heroSlides = [
      {
        name: 'Main Brand Hero 2026',
        title: 'Craft The Future of Digital Products',
        subtitle: 'World-Class UI/UX Design & Engineering Marketplace',
        description: 'Connect with elite designers, verified design systems, and turnkey creative services engineered for scale.',
        desktop_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&auto=format&fit=crop&q=80',
        tablet_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&auto=format&fit=crop&q=80',
        mobile_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=640&auto=format&fit=crop&q=80',
        primary_cta_text: 'Explore Assets',
        primary_cta_url: '/browse',
        secondary_cta_text: 'Hire Top Talent',
        secondary_cta_url: '/browse?listing_type=service',
        priority: 1,
        overlay_opacity: 0.55
      },
      {
        name: 'Design Systems Showcase',
        title: 'Production-Ready Figma Systems & React Kits',
        subtitle: 'Enterprise-grade Component Libraries',
        description: 'Accelerate design cycles with tokens, dark mode variants, accessible components, and complete Figma documentation.',
        desktop_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1920&auto=format&fit=crop&q=80',
        tablet_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1024&auto=format&fit=crop&q=80',
        mobile_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=640&auto=format&fit=crop&q=80',
        primary_cta_text: 'Browse Design Systems',
        primary_cta_url: '/browse?category=design-systems',
        secondary_cta_text: 'View Demo',
        secondary_cta_url: '/pages/how-it-works',
        priority: 2,
        overlay_opacity: 0.60
      },
      {
        name: 'Custom Agency Services',
        title: 'Bespoke UI/UX & Web Development On Demand',
        subtitle: 'Top 1% Vetted Freelance Studios',
        description: 'Fixed-price sprints, dedicated design teams, and milestone-backed escrow protection for your venture.',
        desktop_image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&auto=format&fit=crop&q=80',
        tablet_image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1024&auto=format&fit=crop&q=80',
        mobile_image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&auto=format&fit=crop&q=80',
        primary_cta_text: 'Explore Services',
        primary_cta_url: '/services',
        secondary_cta_text: 'Post a Brief',
        secondary_cta_url: '/contact',
        priority: 3,
        overlay_opacity: 0.50
      },
      {
        name: 'Mobile App Mastery',
        title: 'iOS & Android Screen Architecture',
        subtitle: 'Native Interactions, Flow Maps, and Micro-Animations',
        description: 'Complete Figma app kits optimized for iOS HIG and Google Material Design 3 guidelines.',
        desktop_image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1920&auto=format&fit=crop&q=80',
        tablet_image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1024&auto=format&fit=crop&q=80',
        mobile_image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=640&auto=format&fit=crop&q=80',
        primary_cta_text: 'Shop Mobile Kits',
        primary_cta_url: '/browse?category=mobile-apps',
        secondary_cta_text: 'Read App Guide',
        secondary_cta_url: '/blog',
        priority: 4,
        overlay_opacity: 0.65
      },
      {
        name: 'Creator Economy & Earnings',
        title: 'Monetize Your Creative Assets on Desigot',
        subtitle: 'Keep Up To 90% of Every Sale',
        description: 'Join over 4,500 elite designers distributing templates, wireframes, and SaaS dashboards to global teams.',
        desktop_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&auto=format&fit=crop&q=80',
        tablet_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1024&auto=format&fit=crop&q=80',
        mobile_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&auto=format&fit=crop&q=80',
        primary_cta_text: 'Become a Seller',
        primary_cta_url: '/become-seller',
        secondary_cta_text: 'Seller Handbook',
        secondary_cta_url: '/pages/creators-program',
        priority: 5,
        overlay_opacity: 0.55
      }
    ];

    const heroIds = [];
    for (const h of heroSlides) {
      const res = await client.query(`
        INSERT INTO cms_hero_sections (
          name, title, subtitle, description, desktop_image_url, tablet_image_url, mobile_image_url,
          primary_cta_text, primary_cta_url, secondary_cta_text, secondary_cta_url, priority, overlay_opacity,
          created_by_id, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
        RETURNING id;
      `, [
        h.name, h.title, h.subtitle, h.description, h.desktop_image_url, h.tablet_image_url, h.mobile_image_url,
        h.primary_cta_text, h.primary_cta_url, h.secondary_cta_text, h.secondary_cta_url, h.priority, h.overlay_opacity,
        adminId
      ]);
      heroIds.push(res.rows[0].id);
    }
    console.log(`✅ Seeded ${heroIds.length} Hero slides.`);

    // =========================================================================
    // 2. HOMEPAGE SETTINGS & 12 HOMEPAGE SECTIONS
    // =========================================================================
    const homeSections = [
      { key: 'hero', title: 'Dynamic Hero Showcase', subtitle: 'Curated hero rotator', type: 'hero', layout: 'carousel', cols: 1, count: 5, sort: 1 },
      { key: 'promotions', title: 'Active Flash Deals & Banners', subtitle: 'Limited time offers', type: 'banners', layout: 'grid', cols: 2, count: 2, sort: 2 },
      { key: 'featured_products', title: 'Staff Pick Digital Assets', subtitle: 'Handcrafted Figma kits & templates', type: 'featured_products', layout: 'grid', cols: 4, count: 8, sort: 3 },
      { key: 'categories', title: 'Explore Popular Categories', subtitle: 'Find assets across disciplines', type: 'categories', layout: 'grid', cols: 6, count: 6, sort: 4 },
      { key: 'trending_services', title: 'Top-Rated Design Agencies', subtitle: 'Verified studios ready for hire', type: 'trending_services', layout: 'grid', cols: 3, count: 6, sort: 5 },
      { key: 'trending_products', title: 'Trending This Week', subtitle: 'Highest sales momentum', type: 'trending_products', layout: 'grid', cols: 4, count: 8, sort: 6 },
      { key: 'testimonials', title: 'Loved by Product Teams', subtitle: 'Feedback from startups to Fortune 500', type: 'testimonials', layout: 'carousel', cols: 3, count: 6, sort: 7 },
      { key: 'stats', title: 'Desigot Marketplace by Numbers', subtitle: 'Global community metrics', type: 'stats', layout: 'grid', cols: 4, count: 4, sort: 8 },
      { key: 'custom_banner', title: 'Design Community Spotlight', subtitle: 'Join our Discord and live workshops', type: 'custom_content', layout: 'highlight', cols: 1, count: 1, sort: 9 },
      { key: 'featured_services', title: 'Featured Bespoke Services', subtitle: 'Sprint-based deliverables', type: 'featured_services', layout: 'grid', cols: 3, count: 6, sort: 10 },
      { key: 'creators_spotlight', title: 'Featured Creators of the Month', subtitle: 'Elite verified sellers', type: 'custom_content', layout: 'grid', cols: 4, count: 4, sort: 11 },
      { key: 'newsletter', title: 'Stay Ahead of Design Trends', subtitle: 'Receive free weekly UI kits and tutorials', type: 'newsletter', layout: 'split', cols: 1, count: 1, sort: 12 }
    ];

    for (const sec of homeSections) {
      await client.query(`
        INSERT INTO cms_homepage_sections (
          section_key, title, subtitle, section_type, display_layout, grid_columns, display_count, sort_order, is_active, config
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9);
      `, [sec.key, sec.title, sec.subtitle, sec.type, sec.layout, sec.cols, sec.count, sec.sort, JSON.stringify({ autoSlide: true, showBadges: true })]);
    }

    await client.query(`
      INSERT INTO cms_homepage_settings (
        page_title, meta_description, hero_id, announcement_bar_enabled, announcement_bar_text, announcement_bar_link,
        sections_order, is_published, updated_by_id
      ) VALUES ($1, $2, $3, true, $4, $5, $6, true, $7);
    `, [
      'Desigot – Premium UI/UX Marketplace & Creative Talent Network',
      'Download production-grade Figma design systems, web templates, and hire verified freelance designers.',
      heroIds[0],
      '🎉 Welcome to Desigot 2.0! Use promo code LAUNCH20 for 20% off all digital products this week.',
      '/browse',
      JSON.stringify(homeSections.map(s => s.key)),
      adminId
    ]);
    console.log('✅ Seeded Homepage Settings and 12 Sections.');

    // =========================================================================
    // 3. NAVIGATION MENUS & NESTED MENU ITEMS (Minimum 3 menus, 25+ items)
    // =========================================================================
    const menus = [
      { key: 'header_primary', title: 'Primary Header Navigation', location: 'header' },
      { key: 'header_secondary', title: 'Secondary Utility Navigation', location: 'header_top' },
      { key: 'mobile_drawer', title: 'Mobile Slide Drawer Menu', location: 'mobile' }
    ];

    const menuIdMap = {};
    for (const m of menus) {
      const res = await client.query(`
        INSERT INTO cms_menus (menu_key, title, location, is_active)
        VALUES ($1, $2, $3, true)
        RETURNING id;
      `, [m.key, m.title, m.location]);
      menuIdMap[m.key] = res.rows[0].id;
    }

    // Insert 25+ menu items into primary and mobile menus
    const primaryMenuId = menuIdMap['header_primary'];
    
    // Top Level 1: Products
    const p1 = await client.query(`
      INSERT INTO cms_menu_items (menu_id, label, item_type, target_url, sort_order, icon)
      VALUES ($1, 'Digital Assets', 'category', '/browse', 1, 'Layers') RETURNING id;
    `, [primaryMenuId]);
    const p1Id = p1.rows[0].id;

    // Children of Digital Assets
    const p1Children = [
      { label: 'UI Kits & Design Systems', url: '/browse?category=ui-kits', icon: 'Layout' },
      { label: 'Figma Templates', url: '/browse?category=figma-templates', icon: 'Figma' },
      { label: 'Mobile App Screens', url: '/browse?category=mobile-apps', icon: 'Smartphone' },
      { label: 'Iconography & 3D Assets', url: '/browse?category=icons', icon: 'Sparkles' },
      { label: 'Dashboard SaaS Themes', url: '/browse?category=dashboards', icon: 'PieChart' }
    ];
    let sort = 1;
    for (const c of p1Children) {
      await client.query(`
        INSERT INTO cms_menu_items (menu_id, parent_id, label, item_type, target_url, sort_order, icon)
        VALUES ($1, $2, $3, 'category', $4, $5, $6);
      `, [primaryMenuId, p1Id, c.label, c.url, sort++, c.icon]);
    }

    // Top Level 2: Services
    const p2 = await client.query(`
      INSERT INTO cms_menu_items (menu_id, label, item_type, target_url, sort_order, icon)
      VALUES ($1, 'Creative Services', 'internal_page', '/services', 2, 'Briefcase') RETURNING id;
    `, [primaryMenuId]);
    const p2Id = p2.rows[0].id;

    const p2Children = [
      { label: 'Web & Landing Page Design', url: '/services?sub=web-design', icon: 'Monitor' },
      { label: 'Mobile App UX/UI', url: '/services?sub=mobile-ux', icon: 'Smartphone' },
      { label: 'Design System Architecture', url: '/services?sub=design-systems', icon: 'Box' },
      { label: 'SaaS UX Audit & Redesign', url: '/services?sub=ux-audit', icon: 'CheckCircle' },
      { label: 'Custom Brand Identity', url: '/services?sub=branding', icon: 'Feather' }
    ];
    sort = 1;
    for (const c of p2Children) {
      await client.query(`
        INSERT INTO cms_menu_items (menu_id, parent_id, label, item_type, target_url, sort_order, icon)
        VALUES ($1, $2, $3, 'service', $4, $5, $6);
      `, [primaryMenuId, p2Id, c.label, c.url, sort++, c.icon]);
    }

    // Top Level 3: Explore & Community
    const p3 = await client.query(`
      INSERT INTO cms_menu_items (menu_id, label, item_type, target_url, sort_order, icon)
      VALUES ($1, 'Explore', 'internal_page', '/categories', 3, 'Compass') RETURNING id;
    `, [primaryMenuId]);
    const p3Id = p3.rows[0].id;

    const p3Children = [
      { label: 'All Categories', url: '/categories', icon: 'Grid' },
      { label: 'Top Rated Sellers', url: '/browse?filter=top-rated', icon: 'Star' },
      { label: 'Blog & Design Insights', url: '/blog', icon: 'BookOpen' },
      { label: 'How Desigot Works', url: '/pages/how-it-works', icon: 'HelpCircle' }
    ];
    sort = 1;
    for (const c of p3Children) {
      await client.query(`
        INSERT INTO cms_menu_items (menu_id, parent_id, label, item_type, target_url, sort_order, icon)
        VALUES ($1, $2, $3, 'internal_page', $4, $5, $6);
      `, [primaryMenuId, p3Id, c.label, c.url, sort++, c.icon]);
    }

    // Single standalone links
    await client.query(`
      INSERT INTO cms_menu_items (menu_id, label, item_type, target_url, sort_order, icon)
      VALUES 
      ($1, 'Enterprise', 'internal_page', '/pages/enterprise', 4, 'ShieldCheck'),
      ($1, 'Sell on Desigot', 'internal_page', '/become-seller', 5, 'DollarSign');
    `, [primaryMenuId]);

    // Mobile Drawer Menu (10 items)
    const mobileMenuId = menuIdMap['mobile_drawer'];
    const mobileItems = [
      { label: 'Home', url: '/', icon: 'Home' },
      { label: 'Browse Products', url: '/browse', icon: 'ShoppingBag' },
      { label: 'Hire Designers', url: '/services', icon: 'UserCheck' },
      { label: 'Browse Categories', url: '/categories', icon: 'Grid' },
      { label: 'About Desigot', url: '/about', icon: 'Info' },
      { label: 'Blog & Articles', url: '/blog', icon: 'Book' },
      { label: 'Help & FAQs', url: '/faq', icon: 'HelpCircle' },
      { label: 'Contact Us', url: '/contact', icon: 'Mail' },
      { label: 'Become a Seller', url: '/become-seller', icon: 'Zap' },
      { label: 'Terms & Conditions', url: '/terms', icon: 'FileText' }
    ];
    sort = 1;
    for (const m of mobileItems) {
      await client.query(`
        INSERT INTO cms_menu_items (menu_id, label, item_type, target_url, sort_order, icon)
        VALUES ($1, $2, 'internal_page', $3, $4, $5);
      `, [mobileMenuId, m.label, m.url, sort++, m.icon]);
    }
    console.log('✅ Seeded 3 Menus and 27 Menu Items.');

    // =========================================================================
    // 4. BROWSE MEGA MENU (3 Columns, 18+ items)
    // =========================================================================
    const megaCols = [
      { title: 'Digital Asset Collections', order: 1, width: 4 },
      { title: 'Specialized Freelance Services', order: 2, width: 4 },
      { title: 'Industry & Technology Frameworks', order: 3, width: 4 }
    ];

    const megaColIds = [];
    for (const col of megaCols) {
      const res = await client.query(`
        INSERT INTO cms_mega_menu_columns (title, column_order, width_cols, is_active)
        VALUES ($1, $2, $3, true) RETURNING id;
      `, [col.title, col.order, col.width]);
      megaColIds.push(res.rows[0].id);
    }

    // Column 1 items
    const col1Items = [
      { title: 'Enterprise Design Systems', badge: 'Popular', is_featured: true },
      { title: 'SaaS Admin Dashboards', badge: 'Hot', is_featured: true },
      { title: 'Mobile App Wireframe Kits', badge: null, is_featured: false },
      { title: 'Figma Landing Page Systems', badge: 'New', is_featured: true },
      { title: 'Custom 3D Graphics & Icons', badge: null, is_featured: false },
      { title: 'Presentation Decks & Pitch Kits', badge: null, is_featured: false }
    ];
    sort = 1;
    for (const item of col1Items) {
      const cat = categories[sort % categories.length];
      await client.query(`
        INSERT INTO cms_mega_menu_items (column_id, title, category_id, custom_url, sort_order, is_featured, badge_text)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [megaColIds[0], item.title, cat ? cat.id : null, `/browse?tag=${encodeURIComponent(item.title)}`, sort++, item.is_featured, item.badge]);
    }

    // Column 2 items
    const col2Items = [
      { title: 'Full Web App UX Overhaul', badge: 'Verified', is_featured: true },
      { title: 'Design Token System Architecture', badge: 'Pro', is_featured: true },
      { title: 'Conversion Rate Optimization Design', badge: null, is_featured: false },
      { title: 'iOS Swift & React Native Design', badge: null, is_featured: false },
      { title: 'Rapid Prototype in 48 Hours', badge: 'Fast', is_featured: true },
      { title: 'Comprehensive Usability Audits', badge: null, is_featured: false }
    ];
    sort = 1;
    for (const item of col2Items) {
      await client.query(`
        INSERT INTO cms_mega_menu_items (column_id, title, custom_url, sort_order, is_featured, badge_text)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [megaColIds[1], item.title, `/services?search=${encodeURIComponent(item.title)}`, sort++, item.is_featured, item.badge]);
    }

    // Column 3 items
    const col3Items = [
      { title: 'Fintech & Banking Kits', badge: 'Trending', is_featured: true },
      { title: 'Healthcare & MedTech UI', badge: null, is_featured: false },
      { title: 'E-Commerce & Shopify Plus UI', badge: 'Top', is_featured: true },
      { title: 'Crypto & Web3 DApps', badge: null, is_featured: false },
      { title: 'AI & Copilot Interface Assets', badge: 'AI Native', is_featured: true },
      { title: 'EdTech & Learning Portals', badge: null, is_featured: false }
    ];
    sort = 1;
    for (const item of col3Items) {
      const cat = categories[(sort + 4) % categories.length];
      await client.query(`
        INSERT INTO cms_mega_menu_items (column_id, title, category_id, custom_url, sort_order, is_featured, badge_text)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [megaColIds[2], item.title, cat ? cat.id : null, `/browse?vertical=${encodeURIComponent(item.title)}`, sort++, item.is_featured, item.badge]);
    }
    console.log('✅ Seeded Mega Menu with 3 columns and 18 items.');

    // =========================================================================
    // 5. SERVICES PAGE & CATEGORIES PAGE SETTINGS
    // =========================================================================
    await client.query(`
      INSERT INTO cms_services_page_settings (
        page_title, subtitle, banner_url, featured_service_ids, config, updated_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6);
    `, [
      'Hire Elite UI/UX Specialists & Digital Agencies',
      'From 48-hour sprint deliverables to end-to-end product architecture, explore verified talent backed by Desigot Escrow.',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&auto=format&fit=crop&q=80',
      serviceIds.slice(0, 6),
      JSON.stringify({ defaultSort: 'rating', showFaqSection: true, filterTags: ['Figma', 'React', 'Mobile', 'Design System'] }),
      adminId
    ]);

    await client.query(`
      INSERT INTO cms_categories_page_settings (
        page_title, description, banner_url, featured_category_ids, layout, config, updated_by_id
      ) VALUES ($1, $2, $3, $4, 'grid', $5, $6);
    `, [
      'Comprehensive Design Asset Categories & Systems',
      'Navigate thousands of battle-tested components, screen flows, icons, and illustrations organized for rapid discovery.',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1920&auto=format&fit=crop&q=80',
      categories.slice(0, 8).map(c => c.id),
      JSON.stringify({ showCounts: true, allowSubcategorySearch: true }),
      adminId
    ]);
    console.log('✅ Seeded Services Page & Categories Page Settings.');

    // =========================================================================
    // 6. FEATURED SECTIONS (8) & TRENDING SECTIONS (6)
    // =========================================================================
    const featuredList = [
      { name: 'Curator Choice Templates', heading: 'Staff Pick Digital Products', type: 'featured_products', ids: productIds.slice(0, 4), sort: 1 },
      { name: 'Elite SaaS Agencies', heading: 'Verified Product Design Agencies', type: 'featured_services', ids: serviceIds.slice(0, 4), sort: 2 },
      { name: 'Core Design Taxonomy', heading: 'Trending Taxonomy Groups', type: 'featured_categories', ids: categories.slice(0, 6).map(c => c.id), sort: 3 },
      { name: 'Mobile Masterpieces', heading: 'Top Rated Mobile UI Assets', type: 'featured_products', ids: productIds.slice(4, 8), sort: 4 },
      { name: 'Rapid Sprint Freelancers', heading: 'Turnaround Under 72 Hours', type: 'featured_services', ids: serviceIds.slice(4, 8), sort: 5 },
      { name: 'Figma Design Kits', heading: 'High Density Token Systems', type: 'featured_products', ids: productIds.slice(2, 6), sort: 6 },
      { name: 'Enterprise UX Audits', heading: 'Comprehensive SaaS Heuristics', type: 'featured_services', ids: serviceIds.slice(1, 5), sort: 7 },
      { name: 'Icon & 3D Bundles', heading: 'Vector Packs & Render Assets', type: 'featured_products', ids: productIds.slice(0, 3), sort: 8 }
    ];

    for (const f of featuredList) {
      await client.query(`
        INSERT INTO cms_featured_sections (
          name, heading, subtitle, section_type, item_ids, layout, grid_columns, sort_order, is_active
        ) VALUES ($1, $2, 'Curated with strict QA standards', $3, $4, 'grid', 4, $5, true);
      `, [f.name, f.heading, f.type, f.ids, f.sort]);
    }

    const trendingList = [
      { name: 'Viral Digital Assets', heading: 'Most Downloaded Assets This Month', type: 'trending_products', method: 'sales', threshold: 15, sort: 1 },
      { name: 'High Momentum Studios', heading: 'In-Demand Design Services', type: 'trending_services', method: 'hybrid', threshold: 8, sort: 2 },
      { name: 'Popular Taxonomy Sectors', heading: 'Highest Traffic Categories', type: 'trending_categories', method: 'views', threshold: 25, sort: 3 },
      { name: 'Rising Star Templates', heading: 'New Releases with 5-Star Reviews', type: 'trending_products', method: 'hybrid', threshold: 5, sort: 4 },
      { name: 'Fast Delivery Services', heading: 'Top Contract Completion Velocity', type: 'trending_services', method: 'sales', threshold: 10, sort: 5 },
      { name: 'Most Bookmarked Kits', heading: 'Saved by Community Designers', type: 'trending_products', method: 'views', threshold: 50, sort: 6 }
    ];

    for (const t of trendingList) {
      await client.query(`
        INSERT INTO cms_trending_sections (
          name, heading, subtitle, trending_type, ranking_method, min_activity_threshold, display_count, sort_order, is_active
        ) VALUES ($1, $2, 'Algorithmically updated every 6 hours', $3, $4, $5, 8, $6, true);
      `, [t.name, t.heading, t.type, t.method, t.threshold, t.sort]);
    }
    console.log('✅ Seeded 8 Featured Sections and 6 Trending Sections.');

    // =========================================================================
    // 7. ABOUT US CONTENT & 4 TEAM MEMBERS
    // =========================================================================
    const aboutValues = [
      { title: 'Craft Over Hype', description: 'Every kit, template, and design service is vetted for real code alignment and accessibility.' },
      { title: 'Creator First Economy', description: 'Empowering independent creators with fair payouts, global reach, and IP protection.' },
      { title: 'Transparent Collaboration', description: 'Built-in milestones, revision escrow, and clear commercial licenses.' },
      { title: 'Design System Engineering', description: 'Bridging the chasm between Figma canvases and production frontend code.' }
    ];

    const aboutStats = [
      { label: 'Active Creators', value: '4,500+' },
      { label: 'Asset Downloads', value: '180,000+' },
      { label: 'Countries Represented', value: '120+' },
      { label: 'Average Customer Rating', value: '4.92 / 5.0' }
    ];

    await client.query(`
      INSERT INTO cms_about_content (
        title, hero_image_url, intro, story_html, mission, vision, values_json, stats_json, is_published, version, updated_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 1, $9);
    `, [
      'Empowering the Next Generation of Product Designers & Builders',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&auto=format&fit=crop&q=80',
      'Desigot was founded to build a bridge between world-class designers and software builders seeking high-velocity execution.',
      '<p>Founded in 2024, Desigot emerged from a simple frustration: modern product teams spend hundreds of hours recreating standard authentication modals, settings layouts, and dashboard tables from scratch.</p><p>We gathered a coalition of elite UI engineers and art directors to establish an enterprise marketplace where verified design systems meet frictionless commercial licensing.</p>',
      'To provide software engineering teams with immaculate design foundations while giving creators sustainable, rewarding careers.',
      'A global economy where every digital interface is intuitive, accessible, and masterfully crafted.',
      JSON.stringify(aboutValues),
      JSON.stringify(aboutStats),
      adminId
    ]);

    const teamMembers = [
      { name: 'Elena Rostova', role: 'Co-Founder & Chief Product Officer', bio: 'Former Staff Product Designer at Stripe and Figma community advocate.', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80' },
      { name: 'Marcus Chen', role: 'Co-Founder & Chief Technology Officer', bio: 'Full-stack systems architect with 12 years in marketplace and escrow infrastructure.', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80' },
      { name: 'Sarah Al-Mansoor', role: 'VP of Design Quality & Curation', bio: 'Award-winning design lead passionate about accessibility and token architecture.', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80' },
      { name: 'David Kim', role: 'Head of Creator Partnerships', bio: 'Helping digital creators monetize their design systems and grow independent businesses.', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80' }
    ];

    sort = 1;
    for (const tm of teamMembers) {
      await client.query(`
        INSERT INTO cms_team_members (name, role, bio, photo_url, social_links_json, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true);
      `, [tm.name, tm.role, tm.bio, tm.photo, JSON.stringify({ twitter: 'https://twitter.com', linkedin: 'https://linkedin.com' }), sort++]);
    }
    console.log('✅ Seeded About Us content and 4 Team Members.');

    // =========================================================================
    // 8. CONTACT SETTINGS & 10 CONTACT SUBMISSIONS
    // =========================================================================
    await client.query(`
      INSERT INTO cms_contact_settings (
        heading, description, support_email, phone, address, business_hours, social_links_json, form_fields_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [
      'Contact Desigot Global Support & Enterprise Inquiries',
      'Need help with an asset purchase, seller payout, or enterprise team license? Our team responds within 24 hours.',
      'support@desigot.com',
      '+1 (800) 555-0199',
      '100 Montgomery St, Suite 1800, San Francisco, CA 94104',
      'Monday through Friday: 9:00 AM – 6:00 PM PST',
      JSON.stringify({ twitter: 'https://twitter.com/desigot', linkedin: 'https://linkedin.com/company/desigot', github: 'https://github.com/desigot' }),
      JSON.stringify(['name', 'email', 'phone', 'subject', 'message'])
    ]);

    const contactSubmissions = [
      { name: 'Alex Miller', email: 'alex@acmebiotech.com', subject: 'Enterprise Team License Inquiry', msg: 'We have 45 engineers and need a team-wide seat license for the Atlas Design System.', status: 'in_progress' },
      { name: 'Beatrice Vance', email: 'beatrice@vancedesign.co', subject: 'Seller Verification Application Follow-up', msg: 'Submitted our agency portfolio 4 days ago. Checking on our verification status.', status: 'responded' },
      { name: 'Christian Bale', email: 'chris@gothamtech.io', subject: 'Custom Service Scope Agreement', msg: 'Looking to hire an agency for a 2-month complete mobile UX redesign.', status: 'new' },
      { name: 'Danielle Cooper', email: 'danielle@fintechflow.app', subject: 'Billing & Invoice Question for Order #8472', msg: 'Can we get an updated VAT invoice for our accounting team?', status: 'closed' },
      { name: 'Evan Wright', email: 'evan@wrightstudios.com', subject: 'Asset Download File Corruption', msg: 'The zip file for the NeoDashboard kit throws an unzipping error on macOS.', status: 'responded' },
      { name: 'Fiona Gallagher', email: 'fiona@gallagherpr.com', subject: 'Press & Media Kit Request', msg: 'Doing a feature on top design marketplaces for our upcoming tech publication.', status: 'closed' },
      { name: 'George Harrison', email: 'george@beatlesfan.org', subject: 'Check out cheap loans now (Spam Test)', msg: 'Click here for guaranteed crypto returns and instant money!', status: 'spam' },
      { name: 'Hannah Abbott', email: 'hannah@hufflepuff.edu', subject: 'Student Discount Eligibility', msg: 'Do you offer academic or student tier discounts on monthly subscriptions?', status: 'new' },
      { name: 'Ian Malcolm', email: 'ian@jurassicdata.com', subject: 'API Access for Marketplace Listings', msg: 'Does Desigot provide a public GraphQL or REST API for checking new releases?', status: 'in_progress' },
      { name: 'Julia Roberts', email: 'julia@hollywoodai.com', subject: 'Design System Partnership Proposal', msg: 'We would love to co-host a design sprint webinar with your featured creators.', status: 'new' }
    ];

    for (const sub of contactSubmissions) {
      await client.query(`
        INSERT INTO cms_contact_submissions (
          name, email, subject, message, status, assigned_to_id, ip_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, '192.168.1.100', NOW() - INTERVAL '2 days');
      `, [sub.name, sub.email, sub.subject, sub.msg, sub.status, adminId]);
    }
    console.log('✅ Seeded Contact Settings and 10 Submissions.');

    // =========================================================================
    // 9. FAQ CATEGORIES (8) & FAQS (40)
    // =========================================================================
    const faqCategories = [
      { name: 'General & Account', slug: 'general-account', sort: 1 },
      { name: 'Buying & Downloads', slug: 'buying-downloads', sort: 2 },
      { name: 'Selling & Royalties', slug: 'selling-royalties', sort: 3 },
      { name: 'Custom Services & Escrow', slug: 'services-escrow', sort: 4 },
      { name: 'Licensing & Copyright', slug: 'licensing-copyright', sort: 5 },
      { name: 'Refunds & Disputes', slug: 'refunds-disputes', sort: 6 },
      { name: 'Technical Support & Files', slug: 'technical-support', sort: 7 },
      { name: 'Enterprise & Security', slug: 'enterprise-security', sort: 8 }
    ];

    const faqCatIds = {};
    for (const cat of faqCategories) {
      const res = await client.query(`
        INSERT INTO cms_faq_categories (name, slug, sort_order, is_active)
        VALUES ($1, $2, $3, true) RETURNING id;
      `, [cat.name, cat.slug, cat.sort]);
      faqCatIds[cat.slug] = res.rows[0].id;
    }

    // 40 Comprehensive FAQs (5 per category)
    const rawFaqs = [
      // 1. General & Account
      { cat: 'general-account', q: 'What is Desigot and how does it work?', a: 'Desigot is a premier global marketplace where software teams discover production-ready UI/UX kits, Figma templates, and hire verified design agencies.', page: 'all' },
      { cat: 'general-account', q: 'How do I create a buyer or seller account?', a: 'Click the Sign Up button in the navigation header. You can use email and password or sign in seamlessly via Google.', page: 'all' },
      { cat: 'general-account', q: 'Can I use one account to both buy and sell?', a: 'Yes! Every user account can browse and purchase assets, as well as apply to become an approved seller through the Seller Portal.', page: 'all' },
      { cat: 'general-account', q: 'How do I change my profile or notification settings?', a: 'Navigate to your Dashboard Settings to update your avatar, contact email, two-factor authentication, and email notifications.', page: 'all' },
      { cat: 'general-account', q: 'Is two-factor authentication supported?', a: 'Yes. We support standard TOTP authenticator apps like Google Authenticator and 1Password to protect your account and payouts.', page: 'all' },

      // 2. Buying & Downloads
      { cat: 'buying-downloads', q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, MasterCard, Amex), Stripe, Apple Pay, Google Pay, and localized bank transfers.', page: 'products' },
      { cat: 'buying-downloads', q: 'How do I access my purchased digital files?', a: 'Immediately after purchase, download links are available on your confirmation screen and permanently saved in your Purchases dashboard.', page: 'products' },
      { cat: 'buying-downloads', q: 'Do purchased files receive free future updates?', a: 'Yes! Sellers frequently update their Figma libraries and templates. All future version releases are free to existing license holders.', page: 'products' },
      { cat: 'buying-downloads', q: 'Are there download limits or expiration dates?', a: 'No. You have lifetime access to your purchased assets and can redownload them at any time from your account.', page: 'products' },
      { cat: 'buying-downloads', q: 'Can I get a tax or VAT invoice for my company?', a: 'Yes. VAT and company invoices with your registered tax ID are automatically generated and downloadable from your Order History.', page: 'orders' },

      // 3. Selling & Royalties
      { cat: 'selling-royalties', q: 'How much do sellers earn on Desigot?', a: 'Sellers earn up to 85%–90% on every digital product sale, among the highest payout percentages in the creative tech industry.', page: 'all' },
      { cat: 'selling-royalties', q: 'What is the seller verification process?', a: 'Our curation team reviews your submitted design portfolio, previous work samples, and identity verification within 48 business hours.', page: 'all' },
      { cat: 'selling-royalties', q: 'How and when do I receive seller payouts?', a: 'Payouts are processed twice monthly via Stripe Connect, Direct Bank Deposit, or Wise with a minimum payout threshold of $50.', page: 'all' },
      { cat: 'selling-royalties', q: 'What file formats can I sell on Desigot?', a: 'We accept Figma (.fig), Sketch, Adobe XD, React components, Tailwind CSS templates, icon SVG sets, and 3D Blender models.', page: 'all' },
      { cat: 'selling-royalties', q: 'Do I retain the intellectual property of my designs?', a: 'Yes. You retain full copyright over your creations and grant Desigot non-exclusive rights to distribute licenses to buyers.', page: 'all' },

      // 4. Custom Services & Escrow
      { cat: 'services-escrow', q: 'How does Desigot Escrow protect my service bookings?', a: 'When you book a service, payment is held in secure escrow. Funds are only released to the seller after you approve the deliverables.', page: 'services' },
      { cat: 'services-escrow', q: 'What happens if a designer misses a milestone deadline?', a: 'You can request a revision, extend the deadline, or cancel the milestone for a full escrow refund if deadlines are breached.', page: 'services' },
      { cat: 'services-escrow', q: 'Can I message the designer before placing an order?', a: 'Yes. Use the "Contact Seller" button on any service listing to discuss scopes, timelines, and customized deliverables.', page: 'services' },
      { cat: 'services-escrow', q: 'How are custom revisions handled?', a: 'Each service package specifies included revision rounds. Additional revisions can be added transparently as milestone amendments.', page: 'services' },
      { cat: 'services-escrow', q: 'Can we sign an NDA before starting a service contract?', a: 'Yes. Enterprise clients and verified sellers can upload and countersign custom Non-Disclosure Agreements directly on the platform.', page: 'services' },

      // 5. Licensing & Copyright
      { cat: 'licensing-copyright', q: 'What is the difference between Personal and Commercial licenses?', a: 'A Personal license permits single non-monetized use. A Commercial license allows unlimited commercial end-products and client work.', page: 'all' },
      { cat: 'licensing-copyright', q: 'Can I resell a purchased template as my own template?', a: 'No. Redistributing, sublicensing, or reselling Desigot assets as raw editable templates is strictly prohibited.', page: 'all' },
      { cat: 'licensing-copyright', q: 'Can I use purchased assets in an open-source project?', a: 'Only if the asset files are compiled and not distributed in raw, extractable Figma or asset source format.', page: 'all' },
      { cat: 'licensing-copyright', q: 'Does an Enterprise License cover our entire engineering org?', a: 'Yes. Enterprise licenses provide team-wide, multi-seat rights with indemnity protection and priority support.', page: 'all' },
      { cat: 'licensing-copyright', q: 'How are DMCA and copyright claims addressed?', a: 'We strictly enforce DMCA guidelines. Any verified infringement report leads to immediate removal of the offending asset.', page: 'all' },

      // 6. Refunds & Disputes
      { cat: 'refunds-disputes', q: 'What is your refund policy on digital downloads?', a: 'Because digital files cannot be revoked, refunds are granted if the file is proven defective, corrupt, or materially misrepresented.', page: 'refunds' },
      { cat: 'refunds-disputes', q: 'How do I open a dispute for a service booking?', a: 'Navigate to your Booking page and click "Open Dispute". Our mediation specialists will review the brief, deliverables, and chat logs.', page: 'refunds' },
      { cat: 'refunds-disputes', q: 'How long does a dispute investigation take?', a: 'Most disputes are reviewed and resolved by our senior compliance team within 3 to 5 business days.', page: 'refunds' },
      { cat: 'refunds-disputes', q: 'Where is my refunded money sent?', a: 'Refunds are automatically issued to your original payment method (card or bank) and typically appear within 5–10 business days.', page: 'refunds' },
      { cat: 'refunds-disputes', q: 'Can I cancel an order before the seller begins work?', a: 'Yes. If the seller has not accepted or commenced work, you can cancel instantly for a 100% refund.', page: 'refunds' },

      // 7. Technical Support & Files
      { cat: 'technical-support', q: 'How do I open a .fig file in Figma?', a: 'Download the file, open your Figma desktop or web application, click "Import file" in your recents view, and select the downloaded .fig.', page: 'all' },
      { cat: 'technical-support', q: 'What should I do if a font is missing in a Figma kit?', a: 'Most templates use free Google Fonts (e.g., Inter, Plus Jakarta Sans). Download and install the font locally, or replace it in Figma.', page: 'all' },
      { cat: 'technical-support', q: 'Are design tokens compatible with Style Dictionary and Tailwind?', a: 'Yes. Our featured design systems include token JSON files mapped to standard design token formats and Tailwind CSS configs.', page: 'all' },
      { cat: 'technical-support', q: 'What if a download link fails or times out?', a: 'Simply refresh your Purchases page and click "Generate New Download Link". Alternatively, contact support@desigot.com.', page: 'all' },
      { cat: 'technical-support', q: 'Do you support dark mode in UI templates?', a: 'Over 80% of our featured kits include native Figma variable color modes for instantaneous light and dark theme switching.', page: 'all' },

      // 8. Enterprise & Security
      { cat: 'enterprise-security', q: 'Is Desigot SOC 2 and GDPR compliant?', a: 'Yes. Desigot operates on SOC 2 Type II certified cloud infrastructure with strict GDPR and CCPA privacy protections.', page: 'all' },
      { cat: 'enterprise-security', q: 'Can we pay via wire transfer, ACH, or Net-30 invoicing?', a: 'Yes. Enterprise accounts can request annual invoicing terms with payment via domestic or international ACH / wire transfer.', page: 'all' },
      { cat: 'enterprise-security', q: 'Do you offer SAML SSO / Okta integration?', a: 'Yes. Enterprise organizations can configure SAML 2.0 and Okta single sign-on for seamless employee onboarding.', page: 'all' },
      { cat: 'enterprise-security', q: 'Where are customer files and attachments stored?', a: 'All assets are stored in encrypted Amazon S3 buckets with time-limited presigned URLs and multi-region replication.', page: 'all' },
      { cat: 'enterprise-security', q: 'How do I request a custom security assessment?', a: 'Contact enterprise@desigot.com to receive our SOC 2 report, standard vendor questionnaire, and penetration test summaries.', page: 'all' }
    ];

    let faqPos = 1;
    for (const f of rawFaqs) {
      await client.query(`
        INSERT INTO cms_faqs (
          category_id, question, answer_html, display_position, is_published, page_association
        ) VALUES ($1, $2, $3, $4, true, $5);
      `, [faqCatIds[f.cat], f.q, `<p>${f.a}</p>`, faqPos++, f.page]);
    }
    console.log('✅ Seeded 8 FAQ Categories and 40 FAQs.');

    // =========================================================================
    // 10. LEGAL DOCUMENTS & VERSIONING (Terms, Privacy, Refund - 3 versions each)
    // =========================================================================
    const legalDocs = [
      {
        type: 'terms',
        title: 'Terms of Service & Marketplace Agreement',
        v1: {
          version: '1.0.0',
          title: 'Terms of Service v1.0',
          summary: 'Initial marketplace launch terms of service.',
          html: '<h2>1. Acceptance of Terms</h2><p>By accessing Desigot, you agree to these Terms. Users must be at least 18 years of age.</p><h2>2. Accounts</h2><p>You are responsible for safeguarding your login credentials.</p>'
        },
        v2: {
          version: '1.1.0',
          title: 'Terms of Service v1.1',
          summary: 'Added escrow terms for custom design services.',
          html: '<h2>1. Acceptance of Terms</h2><p>By accessing Desigot, you agree to these Terms.</p><h2>2. Escrow Services</h2><p>All service transactions are secured via Desigot Escrow until deliverable approval.</p>'
        },
        v3: {
          version: '2.0.0',
          title: 'Terms of Service v2.0 (Active)',
          summary: 'Updated for 2026 digital asset commercial licensing and AI asset guidelines.',
          html: '<h2>1. Acceptance of Terms</h2><p>Welcome to Desigot. By accessing or using our platform, you agree to be bound by these Terms of Service.</p><h2>2. Marketplace Licenses</h2><p>Digital products are provided under Personal or Commercial licenses. Resale of raw templates is prohibited.</p><h2>3. Service Escrow & Milestones</h2><p>Buyer funds are held in milestone escrow and disbursed only upon customer sign-off.</p><h2>4. Intellectual Property</h2><p>Creators retain copyright of their uploaded assets while granting buyers perpetual usage rights.</p>'
        }
      },
      {
        type: 'privacy',
        title: 'Global Privacy & Cookie Policy',
        v1: {
          version: '1.0.0',
          title: 'Privacy Policy v1.0',
          summary: 'Initial privacy policy complying with standard US disclosures.',
          html: '<h2>1. Data Collection</h2><p>We collect name, email, and billing info when you make a purchase.</p>'
        },
        v2: {
          version: '1.1.0',
          title: 'Privacy Policy v1.1',
          summary: 'Added GDPR rights for European Union residents.',
          html: '<h2>1. Data Collection</h2><p>We collect essential personal information.</p><h2>2. GDPR Compliance</h2><p>EU residents may request deletion or export of their data at any time.</p>'
        },
        v3: {
          version: '2.0.0',
          title: 'Global Privacy & Cookie Policy v2.0 (Active)',
          summary: 'Complete GDPR, CCPA, and cookie consent management integration.',
          html: '<h2>1. Information We Collect</h2><p>We collect account details, payment transaction records via Stripe, and anonymous usage telemetry.</p><h2>2. How We Use Data</h2><p>Data is used exclusively to facilitate marketplace transactions, payout processing, and fraud detection.</p><h2>3. Your Data Rights (GDPR & CCPA)</h2><p>You have the absolute right to access, rectify, port, or erase your personal data by contacting privacy@desigot.com.</p><h2>4. Cookies & Tracking</h2><p>We do not sell personal data to third-party advertisers. Cookies are used for auth sessions and security.</p>'
        }
      },
      {
        type: 'refund_policy',
        title: 'Refund, Cancellation & Dispute Policy',
        v1: {
          version: '1.0.0',
          title: 'Refund Policy v1.0',
          summary: 'Standard all sales final digital download policy.',
          html: '<h2>1. Digital Products</h2><p>All sales of digital products are final once downloaded.</p>'
        },
        v2: {
          version: '1.1.0',
          title: 'Refund Policy v1.1',
          summary: 'Added exceptions for corrupt files and service cancellations.',
          html: '<h2>1. Defective Files</h2><p>Corrupt or non-functional assets are eligible for a replacement or refund within 14 days.</p>'
        },
        v3: {
          version: '2.0.0',
          title: 'Refund, Cancellation & Dispute Policy v2.0 (Active)',
          summary: 'Comprehensive escrow dispute procedures and 14-day defect guarantee.',
          html: '<h2>1. Digital Product Refund Eligibility</h2><p>Due to the non-returnable nature of digital downloads, refunds are approved if: (a) the file is corrupt and cannot be opened; (b) the item is materially different from its preview; or (c) the seller fails to support a verified defect within 48 hours.</p><h2>2. Custom Service Booking Cancellations</h2><p>Clients may cancel service orders before work begins for a 100% refund. In-progress milestones are mediated through our Dispute Resolution Center.</p><h2>3. Dispute Resolution Process</h2><p>If buyer and seller cannot reach an agreement, Desigot Trust & Safety will examine project deliverables and issue a binding resolution within 5 business days.</p>'
        }
      }
    ];

    for (const doc of legalDocs) {
      // Insert base legal document
      const docRes = await client.query(`
        INSERT INTO cms_legal_documents (
          doc_type, title, content_html, version, effective_date, is_published, created_by_id
        ) VALUES ($1, $2, $3, $4, NOW(), true, $5)
        RETURNING id;
      `, [doc.type, doc.title, doc.v3.html, doc.v3.version, adminId]);
      const docId = docRes.rows[0].id;

      // Insert 3 versions into cms_legal_document_versions
      const vers = [doc.v1, doc.v2, doc.v3];
      for (const v of vers) {
        await client.query(`
          INSERT INTO cms_legal_document_versions (
            document_id, doc_type, version, title, content_html, change_summary, published_by_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [docId, doc.type, v.version, v.title, v.html, v.summary, adminId]);
      }
    }
    console.log('✅ Seeded 3 Legal Documents with 9 historical versions.');

    // =========================================================================
    // 11. FOOTER SETTINGS, 6 FOOTER COLUMNS & 30 LINKS
    // =========================================================================
    await client.query(`
      INSERT INTO cms_footer_settings (
        company_info, copyright_text, social_links_json, payment_icons_json, is_active
      ) VALUES ($1, $2, $3, $4, true);
    `, [
      'Desigot is the global creative marketplace for enterprise design systems, digital assets, and vetted agency services.',
      '© 2026 Desigot Inc. All rights reserved. Crafted for visionary design teams worldwide.',
      JSON.stringify({
        twitter: 'https://twitter.com/desigot',
        github: 'https://github.com/desigot',
        linkedin: 'https://linkedin.com/company/desigot',
        dribbble: 'https://dribbble.com/desigot',
        figma: 'https://figma.com/@desigot'
      }),
      JSON.stringify(['visa', 'mastercard', 'amex', 'stripe', 'apple_pay', 'google_pay'])
    ]);

    const footerCols = [
      {
        title: 'Marketplace',
        links: [
          { label: 'Explore All Assets', url: '/browse' },
          { label: 'UI Kits & Systems', url: '/browse?category=ui-kits' },
          { label: 'Figma Templates', url: '/browse?category=figma-templates' },
          { label: 'Mobile App Screens', url: '/browse?category=mobile-apps' },
          { label: 'Dashboard SaaS Themes', url: '/browse?category=dashboards' }
        ]
      },
      {
        title: 'Design Services',
        links: [
          { label: 'Browse All Services', url: '/services' },
          { label: 'Web & Landing Pages', url: '/services?sub=web-design' },
          { label: 'Mobile App UX', url: '/services?sub=mobile-ux' },
          { label: 'Design System Sprint', url: '/services?sub=design-systems' },
          { label: 'SaaS Heuristic Audit', url: '/services?sub=ux-audit' }
        ]
      },
      {
        title: 'Creators & Sellers',
        links: [
          { label: 'Become a Seller', url: '/become-seller' },
          { label: 'Creator Guidelines', url: '/pages/creators-program' },
          { label: 'Seller Earnings & Fees', url: '/pages/pricing-guide' },
          { label: 'Affiliate Program', url: '/pages/affiliate' },
          { label: 'Creator Success Stories', url: '/blog' }
        ]
      },
      {
        title: 'Company & Team',
        links: [
          { label: 'About Desigot', url: '/about' },
          { label: 'Careers & Hiring', url: '/pages/careers' },
          { label: 'Brand & Media Kit', url: '/pages/brand-assets' },
          { label: 'Press Releases', url: '/pages/press' },
          { label: 'Contact Support', url: '/contact' }
        ]
      },
      {
        title: 'Help & Resources',
        links: [
          { label: 'Frequently Asked Questions', url: '/faq' },
          { label: 'Design Insights Blog', url: '/blog' },
          { label: 'How It Works', url: '/pages/how-it-works' },
          { label: 'Security & Trust', url: '/pages/security' },
          { label: 'Enterprise Solutions', url: '/pages/enterprise' }
        ]
      },
      {
        title: 'Legal & Compliance',
        links: [
          { label: 'Terms of Service', url: '/terms' },
          { label: 'Privacy Policy', url: '/privacy' },
          { label: 'Refund & Dispute Policy', url: '/refund-policy' },
          { label: 'Commercial Licensing', url: '/pages/licensing' },
          { label: 'Cookie Preferences', url: '/pages/cookie-policy' }
        ]
      }
    ];

    let colOrder = 1;
    for (const c of footerCols) {
      const colRes = await client.query(`
        INSERT INTO cms_footer_columns (title, column_order, is_active)
        VALUES ($1, $2, true) RETURNING id;
      `, [c.title, colOrder++]);
      const colId = colRes.rows[0].id;

      let linkOrder = 1;
      for (const l of c.links) {
        await client.query(`
          INSERT INTO cms_footer_links (column_id, label, url, sort_order, is_active)
          VALUES ($1, $2, $3, $4, true);
        `, [colId, l.label, l.url, linkOrder++]);
      }
    }
    console.log('✅ Seeded Footer Settings, 6 Columns and 30 Links.');

    // =========================================================================
    // 12. STATIC PAGES (Minimum 15 pages) WITH VERSIONS
    // =========================================================================
    const staticPages = [
      {
        title: 'How Desigot Works',
        slug: 'how-it-works',
        desc: 'Discover how simple it is to purchase production-ready UI kits or hire custom design teams.',
        html: '<h2>The Marketplace Built for Product Teams</h2><p>Desigot simplifies creative operations. Browse verified files, download instantly with full Figma components, or book fixed-scope services with escrow protection.</p>'
      },
      {
        title: 'Enterprise Design Solutions',
        slug: 'enterprise',
        desc: 'Scalable design system governance, multi-seat licensing, and dedicated account support for enterprise organizations.',
        html: '<h2>Design at Enterprise Scale</h2><p>Empower your distributed development teams with unified tokens, security compliance (SOC 2), and centralized billing.</p>'
      },
      {
        title: 'Creator & Seller Program',
        slug: 'creators-program',
        desc: 'Join the premier marketplace for digital creators and earn up to 90% royalties on every asset sale.',
        html: '<h2>Monetize Your Craft</h2><p>Stop doing one-off freelance gigs. Build recurring passive revenue by selling your Figma kits to thousands of global founders.</p>'
      },
      {
        title: 'Platform Pricing & Fee Guide',
        slug: 'pricing-guide',
        desc: 'Transparent pricing, standard transaction fees, and zero hidden charges for buyers and creators.',
        html: '<h2>Transparent, Predictable Fees</h2><p>No monthly subscription required to browse or buy. Creators keep up to 90% of listing prices.</p>'
      },
      {
        title: 'Trust, Safety & Security',
        slug: 'security',
        desc: 'Enterprise security standards, escrow payment protections, and strict malware scanning on all uploaded files.',
        html: '<h2>Your Security is Our Priority</h2><p>All digital downloads are scanned with automated malware tools, and all payment data is encrypted by PCI-DSS Level 1 processors.</p>'
      },
      {
        title: 'Careers at Desigot',
        slug: 'careers',
        desc: 'Help us shape the future of design and development marketplaces. View our remote job openings.',
        html: '<h2>Build the Future of Design With Us</h2><p>We are a fully remote team across 12 time zones passionate about beautiful software and creator empowerment.</p>'
      },
      {
        title: 'Press & Media Kit',
        slug: 'press',
        desc: 'Official company logos, executive bios, high-res screenshots, and recent press announcements.',
        html: '<h2>Press Resources</h2><p>Download our official brand kit, vector logos, and read our latest company milestones.</p>'
      },
      {
        title: 'Brand Assets & Guidelines',
        slug: 'brand-assets',
        desc: 'Download Desigot logo assets, color palettes, typography specifications, and trademark usage rules.',
        html: '<h2>Official Desigot Brand Guidelines</h2><p>Learn how to properly display our mark in partner integrations, articles, and presentations.</p>'
      },
      {
        title: 'Commercial Licensing Explained',
        slug: 'licensing',
        desc: 'A plain-English explanation of our Personal, Commercial, and Extended Enterprise design licenses.',
        html: '<h2>Clear, Worry-Free Licensing</h2><p>Every commercial asset includes royalty-free worldwide rights for web apps, mobile apps, and client deliverables.</p>'
      },
      {
        title: 'Affiliate Partner Program',
        slug: 'affiliate',
        desc: 'Earn 15% recurring commissions by sharing Desigot templates and services with your audience.',
        html: '<h2>Partner with Desigot</h2><p>Join our affiliate network with 60-day cookie attribution and automated monthly payouts.</p>'
      },
      {
        title: 'Cookie Preferences & Settings',
        slug: 'cookie-policy',
        desc: 'Manage your privacy and cookie preferences on the Desigot marketplace platform.',
        html: '<h2>Manage Cookies</h2><p>Configure which essential and performance cookies you allow during your browsing session.</p>'
      },
      {
        title: 'Community Guidelines',
        slug: 'community-guidelines',
        desc: 'Standards of conduct, civility, feedback ethics, and intellectual property respect across Desigot.',
        html: '<h2>Our Community Code</h2><p>We foster a collaborative, constructive environment for designers, engineers, and founders.</p>'
      },
      {
        title: 'Accessibility Statement',
        slug: 'accessibility',
        desc: 'Desigot commitment to WCAG 2.1 AA accessibility compliance across our web applications.',
        html: '<h2>Design for Everyone</h2><p>We ensure that our website and downloadable design components adhere to modern contrast and screen-reader standards.</p>'
      },
      {
        title: 'Bug Bounty & Vulnerability Disclosure',
        slug: 'bug-bounty',
        desc: 'How security researchers can responsibly disclose vulnerabilities to our engineering team.',
        html: '<h2>Responsible Disclosure</h2><p>We reward security researchers who help protect the integrity and safety of our platform and user data.</p>'
      },
      {
        title: 'Seller Handbook & Best Practices',
        slug: 'seller-handbook',
        desc: 'The definitive guide to organizing Figma files, naming auto-layout frames, and packaging digital assets.',
        html: '<h2>Crafting Best-Selling Assets</h2><p>Follow our component naming standards, token structure guidelines, and thumbnail presentation tips.</p>'
      }
    ];

    for (const page of staticPages) {
      const pageRes = await client.query(`
        INSERT INTO cms_static_pages (
          title, slug, description, content_html, content_blocks_json, seo_title, seo_description,
          status, author_id, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', $8, NOW())
        RETURNING id;
      `, [
        page.title, page.slug, page.desc, page.html,
        JSON.stringify([
          { type: 'header', content: page.title },
          { type: 'paragraph', content: page.desc },
          { type: 'rich_text', content: page.html }
        ]),
        `${page.title} | Desigot Marketplace`,
        page.desc,
        adminId
      ]);
      const pageId = pageRes.rows[0].id;

      // Version 1
      await client.query(`
        INSERT INTO cms_static_page_versions (
          page_id, version, title, content_html, change_notes, created_by_id
        ) VALUES ($1, 1, $2, $3, 'Initial published release', $4);
      `, [pageId, page.title, page.html, adminId]);
    }
    console.log('✅ Seeded 15 Static Pages with version history.');

    // =========================================================================
    // 13. BLOG SYSTEM (8 Categories, 20 Tags, 20 Posts + Revisions)
    // =========================================================================
    const blogCategories = [
      { name: 'Design Systems', slug: 'design-systems', desc: 'Tokens, component libraries, and scalable design architecture.' },
      { name: 'UI/UX Insights', slug: 'ui-ux-insights', desc: 'Heuristics, user research, flow optimization, and wireframing.' },
      { name: 'Figma Mastery', slug: 'figma-mastery', desc: 'Auto-layout, variables, component properties, and plugins.' },
      { name: 'Frontend Engineering', slug: 'frontend-engineering', desc: 'Translating Figma designs into React, Next.js, and Tailwind.' },
      { name: 'Freelancing & Business', slug: 'freelancing-business', desc: 'Client management, pricing models, contracts, and agency growth.' },
      { name: 'Product Management', slug: 'product-management', desc: 'Roadmaps, design sprints, MVP scoping, and customer discovery.' },
      { name: 'AI in Design', slug: 'ai-in-design', desc: 'Generative design tools, prompt workflows, and AI UX patterns.' },
      { name: 'Marketplace Highlights', slug: 'marketplace-highlights', desc: 'Creator spotlights, top-selling assets, and platform releases.' }
    ];

    const blogCatIds = {};
    for (const bc of blogCategories) {
      const res = await client.query(`
        INSERT INTO blog_categories (name, slug, description, sort_order)
        VALUES ($1, $2, $3, 1) RETURNING id;
      `, [bc.name, bc.slug, bc.desc]);
      blogCatIds[bc.slug] = res.rows[0].id;
    }

    const blogTags = [
      'Figma', 'React', 'TailwindCSS', 'Tokens', 'DesignOps',
      'Accessibility', 'Mobile UX', 'MicroInteractions', 'Dark Mode', 'Typography',
      'Freelance', 'SaaS', 'Prototyping', 'User Research', 'Design Systems',
      'Animation', 'Component Library', 'Enterprise UI', 'Agency Life', 'Color Theory'
    ];

    const blogTagIds = [];
    for (const tag of blogTags) {
      const slug = tag.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const res = await client.query(`
        INSERT INTO blog_tags (name, slug)
        VALUES ($1, $2) RETURNING id;
      `, [tag, slug]);
      blogTagIds.push(res.rows[0].id);
    }

    const blogPosts = [
      { title: 'The Complete Guide to Figma Variables & Design Tokens in 2026', slug: 'figma-variables-tokens-2026', cat: 'design-systems', mins: 8, views: 1420 },
      { title: 'How to Build Accessible Dark Mode in React and Tailwind', slug: 'accessible-dark-mode-react-tailwind', cat: 'frontend-engineering', mins: 6, views: 980 },
      { title: 'Designing High-Converting SaaS Pricing Tables', slug: 'high-converting-saas-pricing-tables', cat: 'ui-ux-insights', mins: 5, views: 1850 },
      { title: 'How Our Agency Scaled to $30k/Month on Desigot Services', slug: 'agency-scaled-30k-desigot-services', cat: 'freelancing-business', mins: 10, views: 3200 },
      { title: 'The Anatomy of a Production-Grade Design System', slug: 'anatomy-production-grade-design-system', cat: 'design-systems', mins: 12, views: 2450 },
      { title: 'UX Heuristics for Mobile Checkout and Payment Flows', slug: 'ux-heuristics-mobile-checkout-flows', cat: 'ui-ux-insights', mins: 7, views: 1120 },
      { title: 'Mastering Figma Auto-Layout 5.0 for Complex Dashboards', slug: 'figma-auto-layout-complex-dashboards', cat: 'figma-mastery', mins: 9, views: 1940 },
      { title: 'How Generative AI is Changing Enterprise Interface Design', slug: 'generative-ai-enterprise-interface-design', cat: 'ai-in-design', mins: 6, views: 2890 },
      { title: 'Bridging the Chasm: Exporting Tokens to Style Dictionary', slug: 'exporting-tokens-to-style-dictionary', cat: 'frontend-engineering', mins: 11, views: 870 },
      { title: '10 Micro-Interactions that Delight Users Without Slowing Down Apps', slug: '10-delightful-micro-interactions', cat: 'ui-ux-insights', mins: 4, views: 3410 },
      { title: 'Top 5 Figma Plugins for Design Ops and QA Workflows', slug: 'top-5-figma-plugins-designops', cat: 'figma-mastery', mins: 5, views: 1600 },
      { title: 'How to Price Custom Design Services: Value-Based vs Sprints', slug: 'how-to-price-design-services', cat: 'freelancing-business', mins: 8, views: 2130 },
      { title: 'Desigot Creator Spotlight: Studio Monolith UI Systems', slug: 'creator-spotlight-studio-monolith', cat: 'marketplace-highlights', mins: 6, views: 1400 },
      { title: 'WCAG 2.2 Compliance: Contrast Rules and Focus Indicators', slug: 'wcag-22-compliance-contrast-focus', cat: 'ui-ux-insights', mins: 9, views: 950 },
      { title: 'Designing for Mobile Gestures: Bottom Sheets and Drawer UX', slug: 'mobile-gestures-bottom-sheets-drawer-ux', cat: 'ui-ux-insights', mins: 6, views: 1330 },
      { title: 'From Monolith to Modular: Refactoring Legacy Web Apps', slug: 'refactoring-legacy-web-apps-modular-ui', cat: 'frontend-engineering', mins: 10, views: 820 },
      { title: 'Writing Design Documentation Designers and Devs Actually Read', slug: 'writing-design-documentation-that-gets-read', cat: 'design-systems', mins: 7, views: 1540 },
      { title: 'How to Land Your First 5 Enterprise Clients as an Indie Designer', slug: 'land-first-5-enterprise-clients', cat: 'freelancing-business', mins: 9, views: 2980 },
      { title: 'AI Copilot UX: Designing Conversation States and Fallbacks', slug: 'ai-copilot-ux-conversation-states', cat: 'ai-in-design', mins: 8, views: 2100 },
      { title: 'What is Next for Desigot: The 2026 Product Roadmap', slug: 'what-is-next-desigot-2026-roadmap', cat: 'marketplace-highlights', mins: 5, views: 4200 }
    ];

    for (const post of blogPosts) {
      const catId = blogCatIds[post.cat];
      const excerpt = `Discover expert tactics, best practices, and actionable insights about ${post.title.toLowerCase()} for product teams.`;
      const content = `<h2>Introduction</h2><p>In modern digital product design, velocity and consistency are the defining factors of successful engineering organizations. In this article, we explore ${post.title}.</p><h2>Core Architectural Principles</h2><p>When implementing scalable interfaces, establishing atomic hierarchy ensures modularity across multiple viewports and state conditions.</p><h2>Conclusion</h2><p>By standardizing on reusable assets and well-documented token frameworks, development cycles accelerate by over 40%.</p>`;

      const postRes = await client.query(`
        INSERT INTO blog_posts (
          title, slug, excerpt, content_html, featured_image_url, category_id, author_id,
          reading_time_mins, seo_title, seo_description, status, published_at, views_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published', NOW() - INTERVAL '15 days', $11)
        RETURNING id;
      `, [
        post.title, post.slug, excerpt, content,
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        catId, adminId, post.mins, `${post.title} | Desigot Blog`, excerpt, post.views
      ]);
      const postId = postRes.rows[0].id;

      // Link 2 tags per post
      const tag1 = blogTagIds[Math.floor(Math.random() * blogTagIds.length)];
      const tag2 = blogTagIds[(Math.floor(Math.random() * blogTagIds.length) + 1) % blogTagIds.length];
      await client.query(`
        INSERT INTO blog_post_tags (post_id, tag_id)
        VALUES ($1, $2) ON CONFLICT DO NOTHING;
      `, [postId, tag1]);
      if (tag1 !== tag2) {
        await client.query(`
          INSERT INTO blog_post_tags (post_id, tag_id)
          VALUES ($1, $2) ON CONFLICT DO NOTHING;
        `, [postId, tag2]);
      }

      // Add revision
      await client.query(`
        INSERT INTO blog_post_revisions (post_id, revision_num, title, excerpt, content_html, created_by_id)
        VALUES ($1, 1, $2, $3, $4, $5);
      `, [postId, post.title, excerpt, content, adminId]);
    }
    console.log('✅ Seeded 8 Blog Categories, 20 Tags, 20 Blog Posts with tags and revisions.');

    // =========================================================================
    // 14. MEDIA ASSETS (Minimum 40 assets)
    // =========================================================================
    const assetTypes = [
      { name: 'hero-dark-abstract.webp', orig: 'hero-dark-abstract.png', size: 485000, mime: 'image/webp', alt: 'Abstract dark purple geometric pattern for homepage hero' },
      { name: 'figma-token-preview.webp', orig: 'figma-token-preview.png', size: 312000, mime: 'image/webp', alt: 'Figma token studio interface with color and spacing variables' },
      { name: 'mobile-banking-screens.webp', orig: 'mobile-banking-screens.png', size: 620000, mime: 'image/webp', alt: 'Six iOS mobile banking screen mockups in light and dark mode' },
      { name: 'saas-dashboard-analytics.webp', orig: 'saas-dashboard-analytics.png', size: 540000, mime: 'image/webp', alt: 'Analytics SaaS dashboard mockup with revenue charts and KPI widgets' },
      { name: 'design-system-guidelines.pdf', orig: 'design-system-guidelines.pdf', size: 1450000, mime: 'application/pdf', alt: 'Design system architectural specifications PDF' }
    ];

    for (let i = 1; i <= 40; i++) {
      const sample = assetTypes[(i - 1) % assetTypes.length];
      const fileName = `desigot-asset-${String(i).padStart(3, '0')}-${sample.name}`;
      await client.query(`
        INSERT INTO cms_media_assets (
          file_name, original_name, file_url, file_type, mime_type, file_size_bytes, alt_text, caption, uploaded_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `, [
        fileName,
        sample.orig,
        `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80&sig=${i}`,
        sample.mime.startsWith('image') ? 'image' : 'document',
        sample.mime,
        sample.size + (i * 1234),
        `${sample.alt} - Variation ${i}`,
        `Asset uploaded for marketplace design showcase #${i}`,
        adminId
      ]);
    }
    console.log('✅ Seeded 40 Media Library Assets.');

    // =========================================================================
    // 15. SEO SETTINGS & 10 REDIRECTS
    // =========================================================================
    await client.query(`
      INSERT INTO cms_seo_settings (
        default_meta_title, default_meta_description, default_og_image, favicon_url, canonical_base_url, sitemap_enabled, robots_txt_content
      ) VALUES ($1, $2, $3, $4, $5, true, $6);
    `, [
      'Desigot – Global UI/UX Marketplace & Creative Talent Network',
      'Download vetted Figma UI kits, design tokens, and collaborate with verified design agencies worldwide.',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      '/favicon.ico',
      'https://desigot.com',
      `User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /api/\nSitemap: https://desigot.com/sitemap.xml`
    ]);

    const redirects = [
      { src: '/templates', dest: '/browse', type: 301 },
      { src: '/marketplace', dest: '/browse', type: 301 },
      { src: '/agency-services', dest: '/services', type: 301 },
      { src: '/hire', dest: '/services', type: 301 },
      { src: '/help', dest: '/faq', type: 301 },
      { src: '/support', dest: '/contact', type: 301 },
      { src: '/tos', dest: '/terms', type: 301 },
      { src: '/privacy-policy', dest: '/privacy', type: 301 },
      { src: '/creators', dest: '/become-seller', type: 302 },
      { src: '/summer-promo', dest: '/browse?promo=summer', type: 302 }
    ];

    for (const r of redirects) {
      await client.query(`
        INSERT INTO cms_redirects (source_path, destination_path, redirect_type, is_active)
        VALUES ($1, $2, $3, true);
      `, [r.src, r.dest, r.type]);
    }
    console.log('✅ Seeded Global SEO Settings and 10 Redirects.');

    // =========================================================================
    // 16. CMS AUDIT LOGS (Minimum 100 realistic audit log entries)
    // =========================================================================
    const auditActions = ['create', 'update', 'delete', 'publish', 'schedule', 'restore', 'reorder'];
    const auditEntities = [
      'homepage', 'hero', 'navigation', 'mega_menu', 'services_page', 'categories_page',
      'featured', 'trending', 'about', 'contact', 'faq', 'legal', 'footer', 'page', 'blog', 'media', 'seo'
    ];

    for (let i = 1; i <= 100; i++) {
      const act = auditActions[(i * 3) % auditActions.length];
      const ent = auditEntities[(i * 5) % auditEntities.length];
      const desc = `Administrator performed ${act} operation on ${ent} entity #${i} via CMS control panel.`;
      await client.query(`
        INSERT INTO cms_audit_logs (
          action_type, entity_type, user_id, description, metadata, ip_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, '127.0.0.1', NOW() - ($6 || ' hours')::interval);
      `, [act, ent, adminId, desc, JSON.stringify({ auditBatch: 'seed_2026', iteration: i }), i]);
    }
    console.log('✅ Seeded 100 CMS Audit Logs.');

    console.log('🎉 ALL CMS & Website Management Seed Data Inserted Successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedCMS()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedCMS;
