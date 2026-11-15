'use strict';

const { primaryPool } = require('./pool');

async function seedCategoriesTaxonomy() {
  const client = await primaryPool.connect();
  try {
    console.log('🌱 Starting Categories & Taxonomy Seeding...');
    await client.query('BEGIN');

    // 1. Fetch superadmin/admin user for created_by
    const adminRes = await client.query(`SELECT id FROM users WHERE role IN ('superadmin', 'admin') LIMIT 1`);
    const adminId = adminRes.rows[0]?.id || null;

    // 2. Define 15 Main Categories (depth = 0)
    const mainCategories = [
      { name: 'Creative & Design', slug: 'creative-design', desc: 'World-class digital product design, UX architecture, visual systems, and illustration.', icon: 'Palette', order: 1, type: 'shared' },
      { name: 'Development & Technology', slug: 'development-technology', desc: 'Modern web engineering, mobile apps, SaaS architecture, and frontend systems.', icon: 'Code', order: 2, type: 'shared' },
      { name: 'Digital Marketing', slug: 'digital-marketing', desc: 'Data-driven growth, SEO engineering, conversion rate optimization, and paid acquisition.', icon: 'TrendingUp', order: 3, type: 'service' },
      { name: 'Writing & Translation', slug: 'writing-translation', desc: 'UX copywriting, microcopy, technical documentation, and multilingual localization.', icon: 'FileText', order: 4, type: 'service' },
      { name: 'Video & Animation', slug: 'video-animation', desc: 'Product demo reels, 3D motion graphics, UI interactions, and explainer animations.', icon: 'Video', order: 5, type: 'shared' },
      { name: 'Music & Audio', slug: 'music-audio', desc: 'UI sound effects, brand sonic identities, voiceover, and podcast audio mastering.', icon: 'Music', order: 6, type: 'shared' },
      { name: 'Business & Operations', slug: 'business-operations', desc: 'Strategic venture consulting, pitch deck design, financial models, and operational frameworks.', icon: 'Briefcase', order: 7, type: 'service' },
      { name: 'Consulting & Strategy', slug: 'consulting-strategy', desc: 'Executive design leadership, product strategy, UX audits, and market validation.', icon: 'Compass', order: 8, type: 'service' },
      { name: 'Data & Analytics', slug: 'data-analytics', desc: 'Executive BI dashboards, product analytics telemetry, event tracking, and pipeline architecture.', icon: 'BarChart2', order: 9, type: 'shared' },
      { name: 'AI & Automation', slug: 'ai-automation', desc: 'Custom LLM fine-tuning, workflow agent orchestrations, prompt templates, and AI integration.', icon: 'Cpu', order: 10, type: 'shared' },
      { name: 'Photography & Media', slug: 'photography-media', desc: 'Commercial product photography, mockups, color grading, and editorial curation.', icon: 'Camera', order: 11, type: 'shared' },
      { name: 'Architecture & 3D Engineering', slug: 'architecture-3d', desc: 'Spatial UI design, Three.js 3D web environments, and CAD industrial modeling.', icon: 'Box', order: 12, type: 'shared' },
      { name: 'Education & Training', slug: 'education-training', desc: 'Enterprise design system mentorship, frontend workshops, and Figma training sessions.', icon: 'GraduationCap', order: 13, type: 'service' },
      { name: 'Digital Assets & UI Kits', slug: 'digital-assets-kits', desc: 'Production-ready Figma UI kits, web templates, icon libraries, and design tokens.', icon: 'Layers', order: 14, type: 'product' },
      { name: 'Lifestyle & Brand Experience', slug: 'lifestyle-brand', desc: 'Immersive brand merchandise, experiential packaging, and visual identity collateral.', icon: 'Sparkles', order: 15, type: 'shared' },
    ];

    const mainCategoryMap = {};

    for (const cat of mainCategories) {
      const res = await client.query(
        `INSERT INTO listing_categories (
          name, slug, description, short_description, parent_id, depth, sort_order, display_order,
          icon_name, category_type, status, visibility, is_featured, show_on_homepage, show_in_navigation,
          show_in_marketplace, seo_title, meta_description, canonical_url, og_title, og_description,
          created_by, is_active
        ) VALUES ($1, $2, $3, $4, NULL, 0, $5::smallint, $5::integer, $6, $7, 'published', 'public', true, true, true, true,
          $8, $9, $10, $8, $9, $11, true)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category_type = EXCLUDED.category_type,
          icon_name = EXCLUDED.icon_name,
          display_order = EXCLUDED.display_order,
          is_active = true,
          status = 'published',
          visibility = 'public'
        RETURNING id, slug`,
        [
          cat.name,
          cat.slug,
          cat.desc,
          cat.desc.slice(0, 100),
          cat.order,
          cat.icon,
          cat.type,
          `${cat.name} | Desigot Global UI/UX Marketplace`,
          `Explore verified ${cat.name.toLowerCase()} services, templates, and digital assets on Desigot.`,
          `https://desigot.com/categories/${cat.slug}`,
          adminId
        ]
      );
      mainCategoryMap[cat.slug] = res.rows[0].id;
    }
    console.log(`✅ Upserted 15 Main Categories`);

    // 3. Define at least 60 Subcategories (depth = 1)
    const subCategories = [
      // Creative & Design
      { parentSlug: 'creative-design', name: 'UI/UX Design', slug: 'ui-ux-design', icon: 'Layout', type: 'shared', order: 1 },
      { parentSlug: 'creative-design', name: 'Graphic Design', slug: 'graphic-design', icon: 'PenTool', type: 'shared', order: 2 },
      { parentSlug: 'creative-design', name: 'Logo Design', slug: 'logo-design', icon: 'Shield', type: 'shared', order: 3 },
      { parentSlug: 'creative-design', name: 'Brand Identity', slug: 'brand-identity', icon: 'Award', type: 'shared', order: 4 },
      { parentSlug: 'creative-design', name: 'Website Design', slug: 'website-design', icon: 'Globe', type: 'shared', order: 5 },
      { parentSlug: 'creative-design', name: 'Mobile App Design', slug: 'mobile-app-design', icon: 'Smartphone', type: 'shared', order: 6 },
      { parentSlug: 'creative-design', name: 'Illustration', slug: 'illustration', icon: 'Feather', type: 'shared', order: 7 },
      { parentSlug: 'creative-design', name: 'Presentation Design', slug: 'presentation-design', icon: 'Sliders', type: 'shared', order: 8 },
      { parentSlug: 'creative-design', name: 'Packaging & Print', slug: 'packaging-print', icon: 'Package', type: 'shared', order: 9 },

      // Development & Technology
      { parentSlug: 'development-technology', name: 'Frontend Development', slug: 'frontend-development', icon: 'Code', type: 'service', order: 1 },
      { parentSlug: 'development-technology', name: 'Backend Development', slug: 'backend-development', icon: 'Server', type: 'service', order: 2 },
      { parentSlug: 'development-technology', name: 'Full-Stack Development', slug: 'fullstack-development', icon: 'Terminal', type: 'service', order: 3 },
      { parentSlug: 'development-technology', name: 'Web Development', slug: 'web-development', icon: 'Globe', type: 'service', order: 4 },
      { parentSlug: 'development-technology', name: 'Mobile App Development', slug: 'mobile-development', icon: 'Smartphone', type: 'service', order: 5 },
      { parentSlug: 'development-technology', name: 'API Development', slug: 'api-development', icon: 'Share2', type: 'service', order: 6 },
      { parentSlug: 'development-technology', name: 'SaaS Platform Development', slug: 'saas-development', icon: 'Cloud', type: 'service', order: 7 },
      { parentSlug: 'development-technology', name: 'WordPress & Headless CMS', slug: 'wordpress-headless-cms', icon: 'FileCode', type: 'service', order: 8 },
      { parentSlug: 'development-technology', name: 'E-commerce Engineering', slug: 'ecommerce-engineering', icon: 'ShoppingCart', type: 'service', order: 9 },

      // Digital Marketing
      { parentSlug: 'digital-marketing', name: 'SEO Strategy & Audit', slug: 'seo-strategy', icon: 'Search', type: 'service', order: 1 },
      { parentSlug: 'digital-marketing', name: 'Social Media Growth', slug: 'social-media-growth', icon: 'Share2', type: 'service', order: 2 },
      { parentSlug: 'digital-marketing', name: 'Content Marketing', slug: 'content-marketing', icon: 'BookOpen', type: 'service', order: 3 },
      { parentSlug: 'digital-marketing', name: 'Email Automation', slug: 'email-automation', icon: 'Mail', type: 'service', order: 4 },
      { parentSlug: 'digital-marketing', name: 'Paid Ads & PPC', slug: 'paid-ads-ppc', icon: 'Target', type: 'service', order: 5 },
      { parentSlug: 'digital-marketing', name: 'Conversion Rate Optimization', slug: 'cro-optimization', icon: 'TrendingUp', type: 'service', order: 6 },

      // Writing & Translation
      { parentSlug: 'writing-translation', name: 'UX Copywriting & Microcopy', slug: 'ux-copywriting', icon: 'Edit3', type: 'service', order: 1 },
      { parentSlug: 'writing-translation', name: 'Technical Product Writing', slug: 'technical-writing', icon: 'FileText', type: 'service', order: 2 },
      { parentSlug: 'writing-translation', name: 'Marketing Copywriting', slug: 'marketing-copywriting', icon: 'FilePlus', type: 'service', order: 3 },
      { parentSlug: 'writing-translation', name: 'Localization & Translation', slug: 'localization-translation', icon: 'Globe', type: 'service', order: 4 },
      { parentSlug: 'writing-translation', name: 'Proofreading & Editing', slug: 'proofreading-editing', icon: 'CheckSquare', type: 'service', order: 5 },

      // Video & Animation
      { parentSlug: 'video-animation', name: 'Motion Graphics', slug: 'motion-graphics', icon: 'Film', type: 'shared', order: 1 },
      { parentSlug: 'video-animation', name: '2D & 3D Character Animation', slug: '2d-3d-animation', icon: 'Video', type: 'shared', order: 2 },
      { parentSlug: 'video-animation', name: 'Product Demo Screencasts', slug: 'product-demo-screencasts', icon: 'Monitor', type: 'shared', order: 3 },
      { parentSlug: 'video-animation', name: 'Lottie Micro-Interactions', slug: 'lottie-micro-interactions', icon: 'Activity', type: 'shared', order: 4 },
      { parentSlug: 'video-animation', name: 'Commercial Video Editing', slug: 'commercial-video-editing', icon: 'Scissors', type: 'service', order: 5 },

      // Music & Audio
      { parentSlug: 'music-audio', name: 'UI & App Sound Design', slug: 'ui-sound-design', icon: 'Volume2', type: 'product', order: 1 },
      { parentSlug: 'music-audio', name: 'Brand Sonic Identifiers', slug: 'brand-sonic-identifiers', icon: 'Music', type: 'shared', order: 2 },
      { parentSlug: 'music-audio', name: 'Professional Voiceover', slug: 'professional-voiceover', icon: 'Mic', type: 'service', order: 3 },
      { parentSlug: 'music-audio', name: 'Podcast Mastering', slug: 'podcast-mastering', icon: 'Radio', type: 'service', order: 4 },

      // Business & Operations
      { parentSlug: 'business-operations', name: 'Investor Pitch Decks', slug: 'investor-pitch-decks', icon: 'FileText', type: 'service', order: 1 },
      { parentSlug: 'business-operations', name: 'Market Feasibility Analysis', slug: 'market-feasibility', icon: 'PieChart', type: 'service', order: 2 },
      { parentSlug: 'business-operations', name: 'Startup Operations Setup', slug: 'startup-operations', icon: 'Briefcase', type: 'service', order: 3 },

      // Consulting & Strategy
      { parentSlug: 'consulting-strategy', name: 'Design Leadership & Fractional VP', slug: 'design-leadership', icon: 'Compass', type: 'service', order: 1 },
      { parentSlug: 'consulting-strategy', name: 'Heuristic UX Auditing', slug: 'heuristic-ux-auditing', icon: 'CheckCircle', type: 'service', order: 2 },
      { parentSlug: 'consulting-strategy', name: 'Design System Governance', slug: 'design-system-governance', icon: 'Shield', type: 'service', order: 3 },

      // Data & Analytics
      { parentSlug: 'data-analytics', name: 'Executive BI Dashboards', slug: 'executive-bi-dashboards', icon: 'BarChart', type: 'shared', order: 1 },
      { parentSlug: 'data-analytics', name: 'Product Analytics & Mixpanel', slug: 'product-analytics-telemetry', icon: 'Activity', type: 'service', order: 2 },
      { parentSlug: 'data-analytics', name: 'Conversion Funnel Audits', slug: 'conversion-funnel-audits', icon: 'Filter', type: 'service', order: 3 },

      // AI & Automation
      { parentSlug: 'ai-automation', name: 'AI UX & Conversational UI', slug: 'ai-conversational-ui', icon: 'MessageSquare', type: 'service', order: 1 },
      { parentSlug: 'ai-automation', name: 'Workflow Automations (Zapier/Make)', slug: 'workflow-automations', icon: 'GitPullRequest', type: 'service', order: 2 },
      { parentSlug: 'ai-automation', name: 'Fine-tuned LLM Assistants', slug: 'llm-assistants', icon: 'Cpu', type: 'service', order: 3 },

      // Digital Assets & UI Kits (Product taxonomy)
      { parentSlug: 'digital-assets-kits', name: 'Mobile App UI Kits', slug: 'mobile-app-ui-kits', icon: 'Smartphone', type: 'product', order: 1 },
      { parentSlug: 'digital-assets-kits', name: 'Web App & SaaS Dashboard Kits', slug: 'saas-dashboard-kits', icon: 'Layout', type: 'product', order: 2 },
      { parentSlug: 'digital-assets-kits', name: 'Design Systems & Tokens', slug: 'design-systems-tokens', icon: 'Layers', type: 'product', order: 3 },
      { parentSlug: 'digital-assets-kits', name: 'Vector Icon Packs', slug: 'vector-icon-packs', icon: 'Grid', type: 'product', order: 4 },
      { parentSlug: 'digital-assets-kits', name: '3D Illustration Packs', slug: '3d-illustration-packs', icon: 'Box', type: 'product', order: 5 },
      { parentSlug: 'digital-assets-kits', name: 'Landing Page Templates', slug: 'landing-page-templates', icon: 'ExternalLink', type: 'product', order: 6 },
      { parentSlug: 'digital-assets-kits', name: 'Typography & Custom Fonts', slug: 'typography-custom-fonts', icon: 'Type', type: 'product', order: 7 },
      { parentSlug: 'digital-assets-kits', name: 'Device Mockup Bundles', slug: 'device-mockup-bundles', icon: 'Monitor', type: 'product', order: 8 },
    ];

    const subCategoryMap = {};

    for (const sub of subCategories) {
      const parentId = mainCategoryMap[sub.parentSlug];
      if (!parentId) continue;

      const res = await client.query(
        `INSERT INTO listing_categories (
          name, slug, description, short_description, parent_id, depth, sort_order, display_order,
          icon_name, category_type, status, visibility, is_featured, show_on_homepage, show_in_navigation,
          show_in_marketplace, seo_title, meta_description, canonical_url, og_title, og_description,
          created_by, is_active
        ) VALUES ($1, $2, $3, $4, $5, 1, $6::smallint, $6::integer, $7, $8, 'published', 'public', true, true, true, true,
          $9, $10, $11, $9, $10, $12, true)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          parent_id = EXCLUDED.parent_id,
          category_type = EXCLUDED.category_type,
          icon_name = EXCLUDED.icon_name,
          display_order = EXCLUDED.display_order,
          depth = 1,
          is_active = true,
          status = 'published',
          visibility = 'public'
        RETURNING id, slug`,
        [
          sub.name,
          sub.slug,
          `High-converting professional ${sub.name.toLowerCase()} solutions curated by certified experts.`,
          `Browse certified ${sub.name.toLowerCase()} assets and services.`,
          parentId,
          sub.order,
          sub.icon,
          sub.type,
          `${sub.name} | Desigot Marketplace`,
          `Top-tier ${sub.name.toLowerCase()} services and assets verified for high production quality.`,
          `https://desigot.com/categories/${sub.slug}`,
          adminId
        ]
      );
      subCategoryMap[sub.slug] = res.rows[0].id;
    }
    console.log(`✅ Upserted ${Object.keys(subCategoryMap).length} Subcategories`);

    // 4. Define at least 30 Third-Level Nested Categories (depth = 2)
    const nestedCategories = [
      // Under UI/UX Design
      { parentSlug: 'ui-ux-design', name: 'Enterprise SaaS Dashboards', slug: 'enterprise-saas-dashboards', icon: 'Layout', type: 'shared', order: 1 },
      { parentSlug: 'ui-ux-design', name: 'iOS Human Interface Guidelines', slug: 'ios-hig-design', icon: 'Smartphone', type: 'shared', order: 2 },
      { parentSlug: 'ui-ux-design', name: 'Android Material 3 UI', slug: 'material-3-ui', icon: 'Smartphone', type: 'shared', order: 3 },
      { parentSlug: 'ui-ux-design', name: 'Fintech & Banking Workflows', slug: 'fintech-banking-workflows', icon: 'CreditCard', type: 'shared', order: 4 },
      { parentSlug: 'ui-ux-design', name: 'Healthcare & Clinical UX', slug: 'healthcare-clinical-ux', icon: 'Activity', type: 'shared', order: 5 },
      { parentSlug: 'ui-ux-design', name: 'E-commerce Checkout Optimization', slug: 'ecommerce-checkout-ux', icon: 'ShoppingCart', type: 'shared', order: 6 },

      // Under Web Development
      { parentSlug: 'web-development', name: 'Next.js App Router Engineering', slug: 'nextjs-app-router', icon: 'Code', type: 'service', order: 1 },
      { parentSlug: 'web-development', name: 'React 19 & Tailwind CSS', slug: 'react-tailwind-development', icon: 'Code', type: 'service', order: 2 },
      { parentSlug: 'web-development', name: 'Vue 3 & Nuxt Full-Stack', slug: 'vue-nuxt-development', icon: 'Code', type: 'service', order: 3 },
      { parentSlug: 'web-development', name: 'Node.js & Express Microservices', slug: 'nodejs-express-microservices', icon: 'Server', type: 'service', order: 4 },
      { parentSlug: 'web-development', name: 'GraphQL & Apollo Federation', slug: 'graphql-federation', icon: 'Share2', type: 'service', order: 5 },

      // Under Mobile App Development
      { parentSlug: 'mobile-development', name: 'Flutter Cross-Platform Apps', slug: 'flutter-mobile-apps', icon: 'Smartphone', type: 'service', order: 1 },
      { parentSlug: 'mobile-development', name: 'React Native & Expo Systems', slug: 'react-native-expo', icon: 'Smartphone', type: 'service', order: 2 },
      { parentSlug: 'mobile-development', name: 'Native Swift iOS Apps', slug: 'native-swift-ios', icon: 'Smartphone', type: 'service', order: 3 },
      { parentSlug: 'mobile-development', name: 'Native Kotlin Android Apps', slug: 'native-kotlin-android', icon: 'Smartphone', type: 'service', order: 4 },

      // Under Mobile App UI Kits (Digital Products)
      { parentSlug: 'mobile-app-ui-kits', name: 'E-commerce Shopping Kits', slug: 'ecommerce-shopping-kits', icon: 'ShoppingCart', type: 'product', order: 1 },
      { parentSlug: 'mobile-app-ui-kits', name: 'Crypto & Web3 Wallet Kits', slug: 'crypto-web3-wallet-kits', icon: 'DollarSign', type: 'product', order: 2 },
      { parentSlug: 'mobile-app-ui-kits', name: 'Social Media & Community Kits', slug: 'social-media-ui-kits', icon: 'Users', type: 'product', order: 3 },
      { parentSlug: 'mobile-app-ui-kits', name: 'Fitness & Health Tracking Kits', slug: 'fitness-health-ui-kits', icon: 'Heart', type: 'product', order: 4 },

      // Under SaaS Dashboard Kits (Digital Products)
      { parentSlug: 'saas-dashboard-kits', name: 'Analytics & Reporting UI Kits', slug: 'analytics-reporting-kits', icon: 'BarChart2', type: 'product', order: 1 },
      { parentSlug: 'saas-dashboard-kits', name: 'CRM & Customer Portal Kits', slug: 'crm-portal-kits', icon: 'Users', type: 'product', order: 2 },
      { parentSlug: 'saas-dashboard-kits', name: 'Project Management Kanban Kits', slug: 'pm-kanban-kits', icon: 'CheckSquare', type: 'product', order: 3 },
      { parentSlug: 'saas-dashboard-kits', name: 'Billing & Invoice Generator Kits', slug: 'billing-invoice-kits', icon: 'CreditCard', type: 'product', order: 4 },

      // Under Vector Icon Packs
      { parentSlug: 'vector-icon-packs', name: 'Line & Stroke UI Icons (24px)', slug: 'line-stroke-ui-icons', icon: 'Grid', type: 'product', order: 1 },
      { parentSlug: 'vector-icon-packs', name: 'Solid & Glyph System Icons', slug: 'solid-glyph-icons', icon: 'Grid', type: 'product', order: 2 },
      { parentSlug: 'vector-icon-packs', name: 'Duotone & Two-Tone Vectors', slug: 'duotone-twotone-icons', icon: 'Grid', type: 'product', order: 3 },
      { parentSlug: 'vector-icon-packs', name: 'Animated SVG & Lottie Icons', slug: 'animated-lottie-icons', icon: 'Activity', type: 'product', order: 4 },

      // Under Landing Page Templates
      { parentSlug: 'landing-page-templates', name: 'AI & Developer Tool Landing Pages', slug: 'ai-devtool-landing-pages', icon: 'Cpu', type: 'product', order: 1 },
      { parentSlug: 'landing-page-templates', name: 'Mobile App Showcase Pages', slug: 'app-showcase-landing-pages', icon: 'Smartphone', type: 'product', order: 2 },
      { parentSlug: 'landing-page-templates', name: 'B2B Enterprise Lead Gen Pages', slug: 'b2b-leadgen-landing-pages', icon: 'Briefcase', type: 'product', order: 3 },
    ];

    let nestedCount = 0;
    for (const nested of nestedCategories) {
      const parentId = subCategoryMap[nested.parentSlug];
      if (!parentId) continue;

      await client.query(
        `INSERT INTO listing_categories (
          name, slug, description, short_description, parent_id, depth, sort_order, display_order,
          icon_name, category_type, status, visibility, is_featured, show_on_homepage, show_in_navigation,
          show_in_marketplace, seo_title, meta_description, canonical_url, og_title, og_description,
          created_by, is_active
        ) VALUES ($1, $2, $3, $4, $5, 2, $6::smallint, $6::integer, $7, $8, 'published', 'public', false, false, true, true,
          $9, $10, $11, $9, $10, $12, true)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          parent_id = EXCLUDED.parent_id,
          category_type = EXCLUDED.category_type,
          icon_name = EXCLUDED.icon_name,
          display_order = EXCLUDED.display_order,
          depth = 2,
          is_active = true,
          status = 'published',
          visibility = 'public'`,
        [
          nested.name,
          nested.slug,
          `Specialized ${nested.name} with production blueprints, component tokens, and implementation guidelines.`,
          `Explore verified ${nested.name}.`,
          parentId,
          nested.order,
          nested.icon,
          nested.type,
          `${nested.name} | Desigot Pro`,
          `Specialized ${nested.name.toLowerCase()} curated for enterprise-grade product teams.`,
          `https://desigot.com/categories/${nested.slug}`,
          adminId
        ]
      );
      nestedCount++;
    }
    console.log(`✅ Upserted ${nestedCount} Third-Level Nested Categories`);

    // 5. Seed 50 Dynamic Category Attributes
    const allCatRows = await client.query(`SELECT id, slug, category_type FROM listing_categories WHERE is_active = true`);
    const categoryLookup = {};
    allCatRows.rows.forEach(r => categoryLookup[r.slug] = r.id);

    const attributesToSeed = [
      // Global Design Attributes
      { targetSlug: 'ui-ux-design', name: 'Design Software', key: 'design_software', type: 'single_select', is_req: true, is_filt: true, values: [
        { label: 'Figma', value: 'figma' },
        { label: 'Sketch', value: 'sketch' },
        { label: 'Adobe XD', value: 'adobe_xd' },
        { label: 'Framer', value: 'framer' }
      ]},
      { targetSlug: 'ui-ux-design', name: 'File Format', key: 'file_format', type: 'multi_select', is_req: true, is_filt: true, values: [
        { label: 'FIG (Figma Archive)', value: 'fig' },
        { label: 'PNG (High-Res)', value: 'png' },
        { label: 'SVG (Vector)', value: 'svg' },
        { label: 'PDF (Interactive Spec)', value: 'pdf' }
      ]},
      { targetSlug: 'ui-ux-design', name: 'Responsive Layouts Included', key: 'responsive_layouts', type: 'boolean', is_req: true, is_filt: true, values: [] },
      { targetSlug: 'ui-ux-design', name: 'Number of Unique Screens', key: 'number_of_screens', type: 'number', is_req: false, is_filt: true, values: [] },
      { targetSlug: 'ui-ux-design', name: 'Design System & Style Guide Included', key: 'design_system_included', type: 'boolean', is_req: true, is_filt: true, values: [] },
      { targetSlug: 'ui-ux-design', name: 'Interactive Clickable Prototype', key: 'prototype_included', type: 'boolean', is_req: false, is_filt: true, values: [] },

      // Graphic & Logo Design Attributes
      { targetSlug: 'logo-design', name: 'Vector Source File Included', key: 'vector_source_included', type: 'boolean', is_req: true, is_filt: true, values: [] },
      { targetSlug: 'logo-design', name: 'Initial Concepts Count', key: 'concept_count', type: 'number', is_req: true, is_filt: true, values: [] },
      { targetSlug: 'logo-design', name: 'Print & Digital Palette (CMYK / RGB)', key: 'color_modes_included', type: 'boolean', is_req: false, is_filt: true, values: [] },
      { targetSlug: 'logo-design', name: 'Brand Typography Guidelines', key: 'typography_guidelines', type: 'boolean', is_req: false, is_filt: true, values: [] },

      // Development Attributes
      { targetSlug: 'web-development', name: 'Primary Framework', key: 'primary_framework', type: 'single_select', is_req: true, is_filt: true, values: [
        { label: 'Next.js (React)', value: 'nextjs' },
        { label: 'Vue 3 / Nuxt', value: 'nuxt' },
        { label: 'SvelteKit', value: 'sveltekit' },
        { label: 'Remix', value: 'remix' }
      ]},
      { targetSlug: 'web-development', name: 'Programming Language', key: 'programming_language', type: 'multi_select', is_req: true, is_filt: true, values: [
        { label: 'TypeScript', value: 'typescript' },
        { label: 'JavaScript (ES2024)', value: 'javascript' },
        { label: 'Python', value: 'python' },
        { label: 'Go', value: 'go' }
      ]},
      { targetSlug: 'web-development', name: 'CSS Architecture', key: 'css_framework', type: 'single_select', is_req: false, is_filt: true, values: [
        { label: 'Tailwind CSS v4', value: 'tailwind' },
        { label: 'CSS Modules', value: 'css_modules' },
        { label: 'Styled Components', value: 'styled_components' },
        { label: 'Vanilla CSS', value: 'vanilla_css' }
      ]},
      { targetSlug: 'web-development', name: 'API Integration Types', key: 'api_integrations', type: 'multi_select', is_req: false, is_filt: true, values: [
        { label: 'RESTful JSON', value: 'rest' },
        { label: 'GraphQL', value: 'graphql' },
        { label: 'WebSockets', value: 'websockets' },
        { label: 'gRPC', value: 'grpc' }
      ]},
      { targetSlug: 'web-development', name: 'Lighthouse Performance Guarantee (90+)', key: 'lighthouse_guarantee', type: 'boolean', is_req: false, is_filt: true, values: [] },

      // Digital Products (Mobile Kits & SaaS Dashboards)
      { targetSlug: 'saas-dashboard-kits', name: 'Components & Variants Count', key: 'component_count', type: 'number', is_req: true, is_filt: true, values: [] },
      { targetSlug: 'saas-dashboard-kits', name: 'Auto Layout 5.0 Compliant', key: 'auto_layout_compliant', type: 'boolean', is_req: true, is_filt: true, values: [] },
      { targetSlug: 'saas-dashboard-kits', name: 'Dark Mode Included', key: 'dark_mode_supported', type: 'boolean', is_req: true, is_filt: true, values: [] },
      { targetSlug: 'saas-dashboard-kits', name: 'Design Tokens Architecture', key: 'tokens_architecture', type: 'single_select', is_req: false, is_filt: true, values: [
        { label: 'Figma Variables Native', value: 'figma_variables' },
        { label: 'Style Dictionary JSON', value: 'style_dictionary' },
        { label: 'CSS Variables', value: 'css_variables' }
      ]},
      { targetSlug: 'saas-dashboard-kits', name: 'Commercial License Type', key: 'license_type', type: 'single_select', is_req: true, is_filt: true, values: [
        { label: 'Standard Commercial (1 Project)', value: 'standard' },
        { label: 'Extended Enterprise (Unlimited)', value: 'extended' },
        { label: 'Team Multi-Seat', value: 'team' }
      ]},

      // Vector Icon Packs Attributes
      { targetSlug: 'vector-icon-packs', name: 'Icon Grid Size', key: 'grid_size', type: 'single_select', is_req: true, is_filt: true, values: [
        { label: '16x16 px', value: '16px' },
        { label: '24x24 px (Standard)', value: '24px' },
        { label: '32x32 px', value: '32px' },
        { label: '48x48 px', value: '48px' }
      ]},
      { targetSlug: 'vector-icon-packs', name: 'Stroke Weight Style', key: 'stroke_weight', type: 'single_select', is_req: true, is_filt: true, values: [
        { label: 'Live Stroke (Adjustable)', value: 'live_stroke' },
        { label: 'Outlined Curves', value: 'outlined' },
        { label: 'Solid Fill', value: 'solid' }
      ]},
      { targetSlug: 'vector-icon-packs', name: 'Total Icons in Set', key: 'total_icons_count', type: 'number', is_req: true, is_filt: true, values: [] },

      // General Delivery Attributes
      { targetSlug: 'creative-design', name: 'Commercial Rights Guaranteed', key: 'commercial_rights_guaranteed', type: 'boolean', is_req: true, is_filt: true, values: [] },
      { targetSlug: 'development-technology', name: 'Production CI/CD Automation', key: 'cicd_included', type: 'boolean', is_req: false, is_filt: true, values: [] }
    ];

    let attrCount = 0;
    for (const attr of attributesToSeed) {
      const catId = categoryLookup[attr.targetSlug] || mainCategoryMap['creative-design'];
      await client.query(
        `INSERT INTO category_attributes (
          category_id, name, key, type, is_required, is_filterable, is_searchable, is_sortable,
          allowed_values, status, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, 'active', $9)
        ON CONFLICT DO NOTHING`,
        [
          catId,
          attr.name,
          attr.key,
          attr.type,
          attr.is_req,
          attr.is_filt,
          true,
          JSON.stringify(attr.values),
          attrCount + 1
        ]
      );
      attrCount++;
    }
    console.log(`✅ Seeded ${attrCount} Dynamic Category Attributes`);

    // 6. Seed 30 Category Icons
    const iconLibrary = [
      { name: 'Palette Brush', type: 'library', ref: 'Palette', fmt: 'svg' },
      { name: 'Terminal Code', type: 'library', ref: 'Code', fmt: 'svg' },
      { name: 'Modern Layout', type: 'library', ref: 'Layout', fmt: 'svg' },
      { name: 'Figma Vector', type: 'library', ref: 'Figma', fmt: 'svg' },
      { name: 'Smartphone Mobile', type: 'library', ref: 'Smartphone', fmt: 'svg' },
      { name: 'Layers Stack', type: 'library', ref: 'Layers', fmt: 'svg' },
      { name: 'Global Network', type: 'library', ref: 'Globe', fmt: 'svg' },
      { name: 'Server Architecture', type: 'library', ref: 'Server', fmt: 'svg' },
      { name: 'Briefcase Venture', type: 'library', ref: 'Briefcase', fmt: 'svg' },
      { name: 'BarChart Analytics', type: 'library', ref: 'BarChart2', fmt: 'svg' },
      { name: 'CPU Intelligence', type: 'library', ref: 'Cpu', fmt: 'svg' },
      { name: 'Video Film', type: 'library', ref: 'Video', fmt: 'svg' },
      { name: 'Audio Sound', type: 'library', ref: 'Music', fmt: 'svg' },
      { name: 'Document File', type: 'library', ref: 'FileText', fmt: 'svg' },
      { name: 'Award Badge', type: 'library', ref: 'Award', fmt: 'svg' },
      { name: 'Package Delivery', type: 'library', ref: 'Package', fmt: 'svg' },
      { name: 'Camera Photo', type: 'library', ref: 'Camera', fmt: 'svg' },
      { name: 'Compass Strategy', type: 'library', ref: 'Compass', fmt: 'svg' },
      { name: 'Sparkles Luxury', type: 'library', ref: 'Sparkles', fmt: 'svg' },
      { name: 'Shield Security', type: 'library', ref: 'Shield', fmt: 'svg' },
      { name: 'ShoppingCart Shop', type: 'library', ref: 'ShoppingCart', fmt: 'svg' },
      { name: 'CreditCard Pay', type: 'library', ref: 'CreditCard', fmt: 'svg' },
      { name: 'Users Community', type: 'library', ref: 'Users', fmt: 'svg' },
      { name: 'Heart Wellness', type: 'library', ref: 'Heart', fmt: 'svg' },
      { name: 'Activity Telemetry', type: 'library', ref: 'Activity', fmt: 'svg' },
      { name: 'Grid Wireframe', type: 'library', ref: 'Grid', fmt: 'svg' },
      { name: 'Search Lens', type: 'library', ref: 'Search', fmt: 'svg' },
      { name: 'CheckSquare QA', type: 'library', ref: 'CheckSquare', fmt: 'svg' },
      { name: 'GitBranch Flow', type: 'library', ref: 'GitPullRequest', fmt: 'svg' },
      { name: 'Sliders Tuning', type: 'library', ref: 'Sliders', fmt: 'svg' },
    ];

    for (const icon of iconLibrary) {
      await client.query(
        `INSERT INTO category_icons (name, icon_type, icon_ref, file_format, dimensions, status)
         VALUES ($1, $2, $3, $4, '24x24', 'active')
         ON CONFLICT DO NOTHING`,
        [icon.name, icon.type, icon.ref, icon.fmt]
      );
    }
    console.log(`✅ Seeded ${iconLibrary.length} Category Icons`);

    // 7. Seed 20 Category Banners
    const sampleBanners = [
      { name: 'Creative & Design Master Banner', slug: 'creative-design', img: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1600&q=80', alt: 'Design sprint team crafting UI/UX systems' },
      { name: 'Development & Technology Showcase', slug: 'development-technology', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80', alt: 'Full stack development and cloud architecture' },
      { name: 'UI/UX Design Spotlight', slug: 'ui-ux-design', img: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1600&q=80', alt: 'Modern UI/UX prototyping on Figma' },
      { name: 'Digital Assets & Kits Hero', slug: 'digital-assets-kits', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80', alt: 'Abstract 3D UI kits and design tokens' },
      { name: 'Mobile App UI Kits Special', slug: 'mobile-app-ui-kits', img: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1600&q=80', alt: 'Mobile app iOS and Android design layouts' },
      { name: 'AI & Automation Solutions', slug: 'ai-automation', img: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1600&q=80', alt: 'AI engineering and automation neural network' },
      { name: 'Web Development Architecture', slug: 'web-development', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80', alt: 'Modern web engineering and code interfaces' },
      { name: 'Data & Analytics Telemetry', slug: 'data-analytics', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80', alt: 'Executive analytics dashboard telemetry' },
      { name: 'Branding & Identity Collateral', slug: 'brand-identity', img: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1600&q=80', alt: 'Premium luxury branding and stationery' },
      { name: 'SaaS Dashboard Components', slug: 'saas-dashboard-kits', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80', alt: 'SaaS web app data tables and metrics' },
    ];

    for (const b of sampleBanners) {
      const cid = mainCategoryMap[b.slug] || subCategoryMap[b.slug];
      if (!cid) continue;

      await client.query(
        `INSERT INTO category_banners (
          category_id, name, desktop_image_url, tablet_image_url, mobile_image_url,
          alt_text, banner_link, display_priority, status
        ) VALUES ($1, $2, $3, $3, $3, $4, $5, 1, 'active')
        ON CONFLICT DO NOTHING`,
        [cid, b.name, b.img, b.alt, `https://desigot.com/categories/${b.slug}`]
      );
    }
    console.log(`✅ Seeded Category Banners`);

    // 8. Link Existing Services and Digital Products to Valid Seeded Categories
    const srvCategory = subCategoryMap['ui-ux-design'] || mainCategoryMap['creative-design'];
    const devCategory = subCategoryMap['web-development'] || mainCategoryMap['development-technology'];
    const prodCategory = subCategoryMap['mobile-app-ui-kits'] || mainCategoryMap['digital-assets-kits'];
    const saasCategory = subCategoryMap['saas-dashboard-kits'] || mainCategoryMap['digital-assets-kits'];

    await client.query(`UPDATE services SET category_id = $1 WHERE category_id IS NULL`, [srvCategory]);
    await client.query(`UPDATE digital_products SET category_id = $1 WHERE category_id IS NULL`, [prodCategory]);

    // Distribute services evenly among subcategories
    const allSubs = Object.values(subCategoryMap);
    if (allSubs.length > 0) {
      await client.query(`
        UPDATE services
        SET category_id = ($1::UUID[])[1 + abs(hashtext(id::text) % $2)]
      `, [allSubs, allSubs.length]);

      await client.query(`
        UPDATE digital_products
        SET category_id = ($1::UUID[])[1 + abs(hashtext(id::text) % $2)]
      `, [allSubs, allSubs.length]);
    }
    console.log(`✅ Distributed Services & Digital Products across active categories`);

    // 9. Seed 200 Category History Events
    const actionTypes = [
      'category.created', 'category.updated', 'category.published',
      'category.attribute_assigned', 'category.reordered', 'category.seo_updated',
      'category.banner_uploaded', 'category.icon_assigned', 'category.hierarchy_moved'
    ];
    const catIdList = Object.values(mainCategoryMap).concat(Object.values(subCategoryMap));

    for (let i = 0; i < 200; i++) {
      const randomCat = catIdList[i % catIdList.length];
      const randomAction = actionTypes[i % actionTypes.length];
      const hoursAgo = Math.floor(Math.random() * 720); // within last 30 days

      await client.query(
        `INSERT INTO category_history (
          category_id, action, actor_id, reason, old_data, new_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7 || ' hours')::INTERVAL)`,
        [
          randomCat,
          randomAction,
          adminId,
          `Automated administrative taxonomy operation (${randomAction})`,
          JSON.stringify({ status: 'draft', version: 1 }),
          JSON.stringify({ status: 'published', version: 2, timestamp: Date.now() }),
          hoursAgo.toString()
        ]
      );
    }
    console.log(`✅ Seeded 200 Category History Events`);

    await client.query('COMMIT');
    console.log('🎉 Categories & Taxonomy Seed Completed Successfully!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedCategoriesTaxonomy();
