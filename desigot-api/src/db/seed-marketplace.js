'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const config = require('../config');

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'Password123!';

async function seedMarketplace() {
  const pool = new Pool({
    connectionString: config.db.primary,
    ssl: config.db.ssl,
  });

  const client = await pool.connect();

  try {
    console.log('🚀 Starting Desigot Comprehensive Marketplace & Analytics Seeder...');
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // =========================================================================
    // 1. SEED CATEGORIES (15 Core Marketplace Categories + Subcategories)
    // =========================================================================
    console.log('📂 Seeding 15 Marketplace Categories & Subcategories...');
    const categoryDefs = [
      { name: 'UI Kits', slug: 'ui-kits', icon: 'Layout', desc: 'Pre-designed UI components, screens, and design kits for web and mobile.', subs: ['Web UI Kits', 'Mobile UI Kits', 'Wireframe Kits', 'Dashboard Kits'] },
      { name: 'Mobile Apps', slug: 'mobile-apps', icon: 'Smartphone', desc: 'End-to-end iOS and Android design templates and application concepts.', subs: ['iOS UI Templates', 'Android Material Design', 'E-commerce Apps', 'Fintech Apps'] },
      { name: 'Dashboards', slug: 'dashboards', icon: 'LayoutDashboard', desc: 'Complex administrative, analytics, and SaaS dashboard design templates.', subs: ['SaaS Dashboards', 'Analytics Portals', 'Crypto & Web3 Dashboards', 'CRM Dashboards'] },
      { name: 'Landing Pages', slug: 'landing-pages', icon: 'Globe', desc: 'High-converting marketing, sales, and product landing page templates.', subs: ['Startup Landing Pages', 'Product Launch', 'Agency Portfolios', 'Lead Generation'] },
      { name: 'Icons', slug: 'icons', icon: 'Shapes', desc: 'Carefully crafted vector icon sets in 2D, 3D, glyph, and line styles.', subs: ['3D Vector Icons', 'Line Icons', 'Duotone Icons', 'Solid Glyphs'] },
      { name: 'Illustrations', slug: 'illustrations', icon: 'Image', desc: 'Hand-drawn, isometric, vector, and 3D digital illustration libraries.', subs: ['3D Characters', 'Isometric Scenes', 'Flat Vector Art', 'Spot Illustrations'] },
      { name: 'Typography', slug: 'typography', icon: 'Type', desc: 'Display typefaces, variable fonts, font pairings, and editorial specimens.', subs: ['Serif Typefaces', 'Modern Sans-Serif', 'Display Fonts', 'Font Pairings'] },
      { name: 'Design Systems', slug: 'design-systems', icon: 'Layers', desc: 'Enterprise Figma tokens, design systems, guidelines, and components.', subs: ['Enterprise Figma Systems', 'Atomic Component Kits', 'Design Tokens', 'Tailwind UI Kits'] },
      { name: 'Mockups', slug: 'mockups', icon: 'Monitor', desc: 'Photorealistic device mockups, branding scenes, and product mockups.', subs: ['iPhone 16 Pro Mockups', 'MacBook & iMac Mockups', 'Print & Packaging', 'Clay Mockups'] },
      { name: 'Logos & Branding', slug: 'logos-branding', icon: 'Sparkles', desc: 'Brand identity assets, logos, guideline templates, and stationary.', subs: ['Logo Templates', 'Brand Guidelines', 'Stationery Kits', 'Social Badges'] },
      { name: 'Social Media', slug: 'social-media', icon: 'Share2', desc: 'Engaging templates for Instagram, LinkedIn, YouTube, Twitter, and TikTok.', subs: ['Instagram Carousels', 'LinkedIn Post Templates', 'YouTube Thumbnails', 'Social Ad Banners'] },
      { name: 'Wireframes', slug: 'wireframes', icon: 'Box', desc: 'Low and high fidelity wireframing blueprints for rapid prototyping.', subs: ['Low-Fi Wireframes', 'Flowchart Blueprints', 'Site Architecture Maps', 'User Flows'] },
      { name: 'Presentations', slug: 'presentations', icon: 'Presentation', desc: 'Investor pitch decks, executive presentations, and keynote templates.', subs: ['Pitch Deck Kits', 'Investor Presentations', 'Keynote Sliders', 'Corporate Reports'] },
      { name: 'Charts & Data Visualization', slug: 'charts-data-vis', icon: 'BarChart2', desc: 'Modular chart libraries, graph systems, and data widget kits.', subs: ['Financial Chart Kits', 'Infographic Builders', 'Statistical Widgets', 'Gantt & Timelines'] },
      { name: 'Web Templates', slug: 'web-templates', icon: 'Code', desc: 'Full-featured web templates, Next.js designs, and responsive layouts.', subs: ['Next.js / React Layouts', 'HTML5 & Tailwind Templates', 'Portfolio Sites', 'Directory Templates'] },
    ];

    const categoryMap = new Map();
    let sortOrder = 1;

    for (const c of categoryDefs) {
      const res = await client.query(
        `INSERT INTO listing_categories (name, slug, description, icon_name, sort_order, is_active, depth)
         VALUES ($1, $2, $3, $4, $5, TRUE, 0)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
         RETURNING id, slug, name`,
        [c.name, c.slug, c.desc, c.icon, sortOrder++]
      );
      const parent = res.rows[0];
      categoryMap.set(parent.slug, parent.id);

      // Seed subcategories
      let subSort = 1;
      for (const sub of c.subs) {
        const subSlug = `${c.slug}-${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const subRes = await client.query(
          `INSERT INTO listing_categories (parent_id, name, slug, description, icon_name, sort_order, is_active, depth)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, 1)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id, slug, name`,
          [parent.id, sub, subSlug, `${sub} within ${c.name}`, c.icon, subSort++]
        );
        categoryMap.set(subSlug, subRes.rows[0].id);
      }
    }
    console.log(`  ✓ ${categoryDefs.length} main categories and ${categoryDefs.reduce((a,b)=>a+b.subs.length,0)} subcategories ready.`);

    // =========================================================================
    // 2. SEED ADMINS & MANAGERS (Phases 18.A)
    // =========================================================================
    console.log('👥 Seeding Admins and Managers...');
    const staffToSeed = [
      { email: 'superadmin@desigot.com', username: 'superadmin', name: 'Dr. Gregory House', role: 'superadmin', is_super_admin: true, bio: 'Application Owner & System Root Administrator' },
      { email: 'admin@desigot.com', username: 'admin', name: 'Sarah Connor', role: 'admin', is_super_admin: false, bio: 'Platform Operations Administrator' },
      { email: 'moderator@desigot.com', username: 'mod_trust', name: 'Michael Chang', role: 'admin', is_super_admin: false, bio: 'Trust & Safety Administrator' },
      { email: 'finance@desigot.com', username: 'fin_admin', name: 'Rachel Green', role: 'admin', is_super_admin: false, bio: 'Financial Compliance & Payouts Administrator' },
      { email: 'manager@desigot.com', username: 'manager', name: 'John Miller', role: 'admin', is_super_admin: false, bio: 'Operations Manager' },
      { email: 'seller.manager@desigot.com', username: 'seller_mgr', name: 'Amanda Clarke', role: 'admin', is_super_admin: false, bio: 'Seller Ecosystem Manager' },
      { email: 'service.manager@desigot.com', username: 'service_mgr', name: 'Robert Vance', role: 'admin', is_super_admin: false, bio: 'Professional Services Manager' },
      { email: 'product.manager@desigot.com', username: 'product_mgr', name: 'Elena Gilbert', role: 'admin', is_super_admin: false, bio: 'Digital Products Marketplace Manager' },
      { email: 'analytics.lead@desigot.com', username: 'analytics_lead', name: 'Neil Armstrong', role: 'admin', is_super_admin: false, bio: 'Principal Data Analyst & BI Lead' },
    ];

    for (const s of staffToSeed) {
      await client.query(
        `INSERT INTO users (email, username, display_name, role, is_super_admin, account_status, email_verified_at, password_hash, bio, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), $6, $7, NOW())
         ON CONFLICT (email) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           role = EXCLUDED.role,
           is_super_admin = EXCLUDED.is_super_admin,
           account_status = 'active'`,
        [s.email, s.username, s.name, s.role, s.is_super_admin, hashedPassword, s.bio]
      );
    }
    console.log(`  ✓ ${staffToSeed.length} Administrative & Management staff accounts active.`);

    // =========================================================================
    // 3. SEED 30 SELLERS (Freelancers, Studios, Agencies) (Phase 18.A)
    // =========================================================================
    console.log('🎨 Seeding 30 Marketplace Sellers...');
    const sellerProfiles = [
      { name: 'Alex Rivera', username: 'alexrivera', type: 'freelancer', sales: 94, rating: 4.96, reviews: 88, bio: 'Senior Product Designer specializing in Fintech and SaaS design systems.', plan: 'pro', verified: true },
      { name: 'Nova Studio', username: 'novastudio', type: 'agency', sales: 240, rating: 4.98, reviews: 215, bio: 'Award-winning digital agency crafting tier-1 mobile apps and dashboard interfaces.', plan: 'agency', verified: true },
      { name: 'Elena Rostova', username: 'elenarostova', type: 'freelancer', sales: 65, rating: 4.92, reviews: 58, bio: 'Figma Community Creator & Design System Architect.', plan: 'pro', verified: true },
      { name: 'Marcus Chen', username: 'marcuschen', type: 'freelancer', sales: 112, rating: 4.88, reviews: 96, bio: 'Mobile app specialist with 8+ years designing iOS & Android apps.', plan: 'pro', verified: true },
      { name: 'PixelCraft Creative', username: 'pixelcraft', type: 'agency', sales: 310, rating: 4.99, reviews: 290, bio: 'Global design boutique building enterprise web portals and UI kits.', plan: 'enterprise', verified: true },
      { name: 'Sophia Williams', username: 'sophiaw', type: 'freelancer', sales: 48, rating: 4.85, reviews: 42, bio: '3D Vector illustrator and icon designer.', plan: 'free', verified: true },
      { name: 'David Kim', username: 'davidkim', type: 'freelancer', sales: 82, rating: 4.91, reviews: 75, bio: 'Minimalist dashboard and CRM workflow designer.', plan: 'pro', verified: true },
      { name: 'Apex Design Lab', username: 'apexlab', type: 'agency', sales: 185, rating: 4.94, reviews: 160, bio: 'Specialized in high-conversion landing pages and interactive Figma prototypes.', plan: 'agency', verified: true },
      { name: 'Priya Patel', username: 'priyapatel', type: 'freelancer', sales: 55, rating: 4.89, reviews: 49, bio: 'E-commerce UI/UX and mobile conversion specialist.', plan: 'pro', verified: true },
      { name: 'Lucas Silva', username: 'lucassilva', type: 'freelancer', sales: 39, rating: 4.79, reviews: 31, bio: 'Branding and corporate visual identity designer.', plan: 'free', verified: true },
      { name: 'Emily Zhang', username: 'emilyzhang', type: 'freelancer', sales: 74, rating: 4.93, reviews: 68, bio: 'Data visualization and complex charts specialist.', plan: 'pro', verified: true },
      { name: 'Liam O’Connor', username: 'liamdesign', type: 'freelancer', sales: 43, rating: 4.82, reviews: 37, bio: 'Wireframe and rapid prototyping expert.', plan: 'free', verified: true },
      { name: 'HyperDesign Studio', username: 'hyperdesign', type: 'agency', sales: 145, rating: 4.90, reviews: 128, bio: 'Full-stack UI/UX agency with focus on Web3 and AI tools.', plan: 'agency', verified: true },
      { name: 'Chloe Dubois', username: 'chloedubois', type: 'freelancer', sales: 61, rating: 4.87, reviews: 52, bio: 'Typography, editorial layouts, and brand systems.', plan: 'free', verified: true },
      { name: 'Viktor Meyer', username: 'viktormeyer', type: 'freelancer', sales: 88, rating: 4.95, reviews: 79, bio: 'Dark-mode dashboards and cybersecurity interface design.', plan: 'pro', verified: true },
      { name: 'Studio Forma', username: 'studioforma', type: 'agency', sales: 98, rating: 4.86, reviews: 84, bio: 'Nordic minimalist design studio for modern SaaS.', plan: 'pro', verified: true },
      { name: 'Hassan Al-Mansoor', username: 'hassanui', type: 'freelancer', sales: 32, rating: 4.75, reviews: 26, bio: 'Bilingual Arabic & English UI/UX design expert.', plan: 'free', verified: true },
      { name: 'Katarina Novak', username: 'katarinaui', type: 'freelancer', sales: 50, rating: 4.90, reviews: 45, bio: 'Design Systems and tokens for multi-brand enterprises.', plan: 'pro', verified: true },
      { name: 'Vortex Visuals', username: 'vortexvisuals', type: 'agency', sales: 210, rating: 4.97, reviews: 195, bio: 'Enterprise 3D assets, mockups, and visual components.', plan: 'agency', verified: true },
      { name: 'Mateo Morales', username: 'mateomorales', type: 'freelancer', sales: 27, rating: 4.70, reviews: 20, bio: 'Landing page designer and Webflow developer.', plan: 'free', verified: true },
      { name: 'Zoe Thorne', username: 'zoethorne', type: 'freelancer', sales: 35, rating: 4.81, reviews: 29, bio: 'HealthTech and Medical device app UI/UX.', plan: 'free', verified: true },
      { name: 'Aesthetic Minds', username: 'aestheticminds', type: 'agency', sales: 120, rating: 4.92, reviews: 105, bio: 'Luxury and fashion e-commerce design agency.', plan: 'agency', verified: true },
      { name: 'Oliver Jensen', username: 'oliverjensen', type: 'freelancer', sales: 19, rating: 4.65, reviews: 15, bio: 'Junior UI designer building modern widget kits.', plan: 'free', verified: false }, // Pending seller
      { name: 'Sora Takahashi', username: 'soraui', type: 'freelancer', sales: 78, rating: 4.94, reviews: 72, bio: 'Japanese typography and clean minimalist interfaces.', plan: 'pro', verified: true },
      { name: 'Gabriel Santos', username: 'gabrielsantos', type: 'freelancer', sales: 42, rating: 4.83, reviews: 36, bio: 'Fintech and Crypto mobile application designs.', plan: 'free', verified: true },
      { name: 'Kira Vance', username: 'kiravance', type: 'freelancer', sales: 58, rating: 4.89, reviews: 51, bio: 'Micro-interactions and Figma interactive component states.', plan: 'pro', verified: true },
      { name: 'Horizon Digital', username: 'horizondigital', type: 'agency', sales: 165, rating: 4.96, reviews: 150, bio: 'Strategic UI/UX design for Series A to C startups.', plan: 'agency', verified: true },
      { name: 'Tariq Johnson', username: 'tariqdesign', type: 'freelancer', sales: 22, rating: 4.68, reviews: 18, bio: 'Design sprints and MVP prototyping.', plan: 'free', verified: false }, // Pending seller
      { name: 'Lila Rossi', username: 'lilarossi', type: 'freelancer', sales: 67, rating: 4.91, reviews: 60, bio: 'Travel and booking mobile app interfaces.', plan: 'pro', verified: true },
      { name: 'Quantum Design Studio', username: 'quantumdesign', type: 'agency', sales: 280, rating: 4.98, reviews: 260, bio: 'Global design system builders for Fortune 500 brands.', plan: 'enterprise', verified: true },
    ];

    const sellerIds = [];
    for (const s of sellerProfiles) {
      const email = `${s.username}@desigot.com`;
      const accountStatus = s.verified ? 'active' : 'pending_verification';
      const userRes = await client.query(
        `INSERT INTO users (
           email, username, display_name, role, account_status, seller_verified,
           seller_type, response_rate, total_sales, avg_seller_rating, seller_review_count,
           bio, password_hash, email_verified_at, updated_at
         ) VALUES ($1, $2, $3, 'seller', $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           seller_verified = EXCLUDED.seller_verified,
           total_sales = EXCLUDED.total_sales,
           avg_seller_rating = EXCLUDED.avg_seller_rating,
           seller_review_count = EXCLUDED.seller_review_count
         RETURNING id`,
        [
          email, s.username, s.name, accountStatus, s.verified,
          s.type, 0.95 + (Math.random() * 0.04), s.sales, s.rating, s.reviews,
          s.bio, hashedPassword
        ]
      );
      const sellerId = userRes.rows[0].id;
      sellerIds.push({ id: sellerId, name: s.name, verified: s.verified });

      // Upsert seller balance
      const earnedCents = s.sales * (4500 + Math.floor(Math.random() * 8000));
      const withdrawnCents = Math.floor(earnedCents * 0.75);
      const availCents = earnedCents - withdrawnCents;
      const escrowCents = Math.floor(earnedCents * 0.08);

      await client.query(
        `INSERT INTO seller_balances (seller_id, available_cents, pending_escrow_cents, lifetime_earned_cents, lifetime_withdrawn_cents, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (seller_id) DO UPDATE SET
           available_cents = EXCLUDED.available_cents,
           pending_escrow_cents = EXCLUDED.pending_escrow_cents,
           lifetime_earned_cents = EXCLUDED.lifetime_earned_cents,
           lifetime_withdrawn_cents = EXCLUDED.lifetime_withdrawn_cents,
           updated_at = NOW()`,
        [sellerId, availCents, escrowCents, earnedCents, withdrawnCents]
      );
    }
    console.log(`  ✓ 30 Sellers seeded with balances and metrics.`);

    // =========================================================================
    // 4. SEED 100 CUSTOMERS (Phase 18.A)
    // =========================================================================
    console.log('🛍️ Seeding 100 Customers with historical distribution...');
    const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Harper', 'Alexander', 'Evelyn', 'Daniel', 'Abigail', 'Matthew', 'Emily', 'Jackson', 'Ella', 'Sebastian', 'Elizabeth', 'Jack', 'Camila', 'Aiden', 'Luna', 'Owen', 'Sofia', 'Samuel', 'Avery', 'David', 'Mila', 'Joseph', 'Aria', 'Carter', 'Scarlett', 'John', 'Penelope', 'Wyatt', 'Layla', 'Luke', 'Chloe', 'Jayden', 'Victoria', 'Dylan', 'Madison', 'Grayson', 'Eleanor', 'Isaac', 'Grace', 'Julian', 'Nora', 'Levi', 'Riley', 'Nathan', 'Zoey', 'Caleb', 'Hannah', 'Ryan', 'Hazel', 'Christian', 'Lily', 'Hunter', 'Ellie', 'Eli', 'Violet', 'Aaron', 'Lillian', 'Landon', 'Stella', 'Jonathan', 'Aurora', 'Nolan', 'Natalie', 'Jeremiah', 'Emilia', 'Easton', 'Everly', 'Colton', 'Leah', 'Cameron', 'Aubrey', 'Carson', 'Willow', 'Robert', 'Addison', 'Angel', 'Lucy', 'Maverick', 'Audrey', 'Nicholas', 'Bella', 'Dominic', 'Claire', 'Jaxson', 'Skylar', 'Greyson', 'Paisley'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

    const customerIds = [];
    for (let i = 0; i < 100; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      const username = `${fn.toLowerCase()}${ln.toLowerCase()}${i + 1}`;
      const email = `customer${i + 1}@example.com`;
      // Distribute creation date across the past 90 days
      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date(Date.now() - daysAgo * 86400000);

      const custRes = await client.query(
        `INSERT INTO users (
           email, username, display_name, first_name, last_name, role, account_status,
           email_verified_at, password_hash, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, 'buyer', 'active', $6, $7, $6, $6)
         ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
         RETURNING id`,
        [email, username, `${fn} ${ln}`, fn, ln, createdAt, hashedPassword]
      );
      customerIds.push(custRes.rows[0].id);
    }
    console.log(`  ✓ 100 Customers seeded.`);

    // =========================================================================
    // 5. SEED 50+ DIGITAL PRODUCTS (listing_type = 'asset') (Phase 18.C)
    // =========================================================================
    console.log('📦 Seeding 50+ Digital Products (Assets)...');
    const productTitles = [
      { t: 'Fintech Pro – Modern Banking & Crypto UI Kit', cat: 'ui-kits', p: 4900, rating: 4.92, sales: 85, tags: ['figma', 'fintech', 'crypto', 'banking'] },
      { t: 'Nexus SaaS – Enterprise Analytics Dashboard Template', cat: 'dashboards', p: 6900, rating: 4.96, sales: 120, tags: ['dashboard', 'saas', 'dark-mode', 'analytics'] },
      { t: 'NovaFlow – Mobile E-Commerce iOS & Android Kit', cat: 'mobile-apps', p: 4500, rating: 4.88, sales: 74, tags: ['ecommerce', 'mobile', 'ios', 'android'] },
      { t: 'Aura 3D – 120+ Isometric Tech & Finance Icons', cat: 'icons', p: 2900, rating: 4.95, sales: 140, tags: ['3d-icons', 'render', 'finance', 'tech'] },
      { t: 'Apex Landing – High-Conversion Startup Page Template', cat: 'landing-pages', p: 3900, rating: 4.87, sales: 92, tags: ['landing-page', 'marketing', 'startup'] },
      { t: 'Prism System – Enterprise Multi-Brand Figma Design System', cat: 'design-systems', p: 9900, rating: 4.99, sales: 165, tags: ['design-system', 'tokens', 'enterprise', 'figma'] },
      { t: 'ClayTech – iPhone 16 Pro & MacBook Studio Mockups', cat: 'mockups', p: 3500, rating: 4.90, sales: 110, tags: ['mockup', 'iphone', 'macbook', 'photorealistic'] },
      { t: 'Lumina – 3D Isometric People & Team Illustrations', cat: 'illustrations', p: 4200, rating: 4.85, sales: 68, tags: ['illustrations', '3d', 'characters', 'team'] },
      { t: 'Editorial Grid – Modern Sans-Serif Font Family & Specimen', cat: 'typography', p: 3900, rating: 4.91, sales: 55, tags: ['font', 'typography', 'sans-serif', 'editorial'] },
      { t: 'Starlight – Complete Brand Identity & Stationary System', cat: 'logos-branding', p: 4900, rating: 4.89, sales: 48, tags: ['brand-identity', 'logo', 'stationery', 'guidelines'] },
      { t: 'ViralGrowth – 200+ LinkedIn & Instagram Carousel Templates', cat: 'social-media', p: 2900, rating: 4.94, sales: 135, tags: ['social-media', 'carousels', 'instagram', 'linkedin'] },
      { t: 'Wireframe Master – 300+ Low & High Fidelity Web Blocks', cat: 'wireframes', p: 3500, rating: 4.88, sales: 98, tags: ['wireframe', 'prototyping', 'flowcharts', 'ux'] },
      { t: 'Unicorn Deck – Series A / B Investor Pitch Template', cat: 'presentations', p: 4900, rating: 4.97, sales: 150, tags: ['pitch-deck', 'investor', 'keynote', 'powerpoint'] },
      { t: 'DataCraft – Modular Finance & Analytics Chart System', cat: 'charts-data-vis', p: 3900, rating: 4.93, sales: 82, tags: ['charts', 'graphs', 'data-viz', 'widgets'] },
      { t: 'DevPortal – Next.js 15 & Tailwind Developer Directory', cat: 'web-templates', p: 5900, rating: 4.90, sales: 77, tags: ['nextjs', 'tailwind', 'code', 'template'] },
      { t: 'HealthPulse – Medical Clinic & Patient Portal UI Kit', cat: 'ui-kits', p: 5500, rating: 4.91, sales: 62, tags: ['healthcare', 'clinic', 'medical', 'ui-kit'] },
      { t: 'CyberShield – Security Operations Center (SOC) Dashboard', cat: 'dashboards', p: 7900, rating: 4.97, sales: 90, tags: ['security', 'dark-ui', 'soc', 'monitoring'] },
      { t: 'FoodieGo – On-Demand Food Delivery Mobile App UI', cat: 'mobile-apps', p: 3900, rating: 4.84, sales: 59, tags: ['food-delivery', 'mobile', 'ios', 'figma'] },
      { t: 'GlyphSet Pro – 2,400+ Essential System & Action Icons', cat: 'icons', p: 2500, rating: 4.93, sales: 180, tags: ['icons', 'svg', 'system', 'minimal'] },
      { t: 'CloudScale – B2B SaaS Product Launch Landing Page', cat: 'landing-pages', p: 3900, rating: 4.89, sales: 70, tags: ['b2b', 'saas', 'landing-page'] },
      { t: 'Atomic tokens – Cross-Platform Token Architecture Kit', cat: 'design-systems', p: 7900, rating: 4.95, sales: 88, tags: ['tokens', 'design-tokens', 'figma', 'github'] },
      { t: 'DeviceVerse – Ultra-Realistic Multi-Device Clay Mockups', cat: 'mockups', p: 3200, rating: 4.86, sales: 65, tags: ['mockup', 'clay', 'devices', 'branding'] },
      { t: 'Vibrant Scenes – 50 Flat Vector Spot & Hero Illustrations', cat: 'illustrations', p: 3500, rating: 4.82, sales: 45, tags: ['illustrations', 'flat', 'vector', 'hero'] },
      { t: 'Monolith Sans – Geometric Variable Font with 9 Weights', cat: 'typography', p: 4500, rating: 4.94, sales: 42, tags: ['variable-font', 'typography', 'sans-serif'] },
      { t: 'Zenith – Corporate Brand Identity Guidelines & Asset Kit', cat: 'logos-branding', p: 5200, rating: 4.88, sales: 50, tags: ['brand', 'guidelines', 'corporate'] },
      { t: 'ReelsMaster – 100 Animated TikTok & Reels Templates', cat: 'social-media', p: 2700, rating: 4.89, sales: 115, tags: ['reels', 'tiktok', 'video', 'animation'] },
      { t: 'FlowUX – Mobile UX Flowcharts & Interaction Blueprints', cat: 'wireframes', p: 2900, rating: 4.86, sales: 60, tags: ['user-flows', 'wireframe', 'mobile'] },
      { t: 'Capital Pitch – Venture Capitalist & Private Equity Deck', cat: 'presentations', p: 4900, rating: 4.96, sales: 104, tags: ['vc', 'pitch-deck', 'finance'] },
      { t: 'MetricFlow – Real-time Server & CPU Monitoring Widgets', cat: 'charts-data-vis', p: 3500, rating: 4.91, sales: 58, tags: ['charts', 'server', 'monitoring', 'widgets'] },
      { t: 'SaaSify – Responsive Tailwind & React SaaS Marketing Site', cat: 'web-templates', p: 4900, rating: 4.92, sales: 84, tags: ['react', 'tailwind', 'saas'] },
      { t: 'RealEstate Pro – Luxury Property Finder & Agent Portal', cat: 'ui-kits', p: 5200, rating: 4.87, sales: 53, tags: ['real-estate', 'property', 'portal'] },
      { t: 'HyperTrade – Crypto Exchange & Trading Terminal UI', cat: 'dashboards', p: 8900, rating: 4.98, sales: 110, tags: ['crypto', 'exchange', 'trading', 'terminal'] },
      { t: 'FitTrack – Fitness, Workout & Nutrition Mobile App', cat: 'mobile-apps', p: 4200, rating: 4.85, sales: 66, tags: ['fitness', 'workout', 'ios', 'mobile'] },
      { t: 'FinanceGlyph – 150+ DuoTone Banking & Currency Icons', cat: 'icons', p: 2400, rating: 4.90, sales: 95, tags: ['duotone', 'finance', 'icons'] },
      { t: 'CourseHub – Online Academy & Video Course Landing Page', cat: 'landing-pages', p: 3500, rating: 4.84, sales: 48, tags: ['edtech', 'landing-page', 'course'] },
      { t: 'ScaleDS – Component Library with 600+ Accessible Variants', cat: 'design-systems', p: 8500, rating: 4.96, sales: 92, tags: ['design-system', 'accessibility', 'figma'] },
      { t: 'Stationery Suite – Luxury Embossed Paper & Business Card Mockups', cat: 'mockups', p: 2900, rating: 4.89, sales: 70, tags: ['mockup', 'stationery', 'branding'] },
      { t: 'StartupLife – Hand-drawn Editorial Tech Illustrations', cat: 'illustrations', p: 3800, rating: 4.88, sales: 52, tags: ['editorial', 'illustrations', 'tech'] },
      { t: 'Nordic Serif – Elegant High-Contrast Editorial Typeface', cat: 'typography', p: 4200, rating: 4.92, sales: 38, tags: ['serif', 'editorial', 'typography'] },
      { t: 'Krypton – Web3 Ecosystem Brand Guidelines & Logos', cat: 'logos-branding', p: 4800, rating: 4.86, sales: 44, tags: ['web3', 'branding', 'logo'] },
      { t: 'StoryPulse – 150 Minimalist Instagram Story Templates', cat: 'social-media', p: 2200, rating: 4.81, sales: 88, tags: ['instagram', 'stories', 'minimal'] },
      { t: 'Sitemap Pro – UX Architecture Cards & Visual Nodes', cat: 'wireframes', p: 2500, rating: 4.87, sales: 50, tags: ['sitemap', 'ux', 'wireframe'] },
      { t: 'Quarterly Review – Executive Board & Financial Report Deck', cat: 'presentations', p: 3900, rating: 4.93, sales: 75, tags: ['executive', 'quarterly', 'report'] },
      { t: 'StockChart – TradingView Style Candlestick & Area Graphs', cat: 'charts-data-vis', p: 3800, rating: 4.95, sales: 64, tags: ['trading', 'candlestick', 'charts'] },
      { t: 'AgencyCore – Modern Creative Studio Web Template', cat: 'web-templates', p: 4500, rating: 4.90, sales: 62, tags: ['agency', 'portfolio', 'web'] },
      { t: 'TravelEase – Booking, Flights & Hotel Reservation UI Kit', cat: 'ui-kits', p: 4900, rating: 4.88, sales: 45, tags: ['travel', 'booking', 'hotels'] },
      { t: 'FleetControl – Logistics & GPS Vehicle Fleet Dashboard', cat: 'dashboards', p: 7500, rating: 4.94, sales: 58, tags: ['logistics', 'fleet', 'gps'] },
      { t: 'WalletX – Decentralized Web3 Mobile Crypto Wallet', cat: 'mobile-apps', p: 4600, rating: 4.86, sales: 54, tags: ['wallet', 'web3', 'crypto'] },
      { t: 'TechGlyph 3D – Metallic 3D Engineering & AI Icons', cat: 'icons', p: 3200, rating: 4.93, sales: 80, tags: ['3d-icons', 'ai', 'metallic'] },
      { t: 'LeadMagnet – High-Conversion B2B E-Book Landing Page', cat: 'landing-pages', p: 3200, rating: 4.82, sales: 40, tags: ['lead-gen', 'landing-page'] },
      { t: 'NextDesign – Complete Tokens Architecture for Next.js App Router', cat: 'design-systems', p: 8900, rating: 4.97, sales: 85, tags: ['nextjs', 'tokens', 'design-system'] },
    ];

    const productListings = [];
    for (let i = 0; i < productTitles.length; i++) {
      const p = productTitles[i];
      const seller = sellerIds[i % sellerIds.length];
      const catId = categoryMap.get(p.cat) || categoryMap.get('ui-kits');
      const slug = `${p.t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`;
      const status = i === 48 ? 'pending_review' : i === 49 ? 'draft' : 'approved';
      const isFeatured = i < 8;
      const daysAgo = Math.floor(Math.random() * 80) + 5;
      const createdAt = new Date(Date.now() - daysAgo * 86400000);

      const listingRes = await client.query(
        `INSERT INTO listings (
           seller_id, category_id, title, slug, description, listing_type, status,
           price_personal, price_commercial, price_extended, currency,
           total_sales, total_revenue_cents, avg_rating, review_count, view_count,
           is_featured, tags, software_compat, file_formats, created_at, published_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, 'asset', $6, $7, $8, $9, 'USD', $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $19, $19)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           total_sales = EXCLUDED.total_sales,
           total_revenue_cents = EXCLUDED.total_revenue_cents
         RETURNING id, title, price_personal, price_commercial, price_extended, seller_id`,
        [
          seller.id, catId, p.t, slug,
          `${p.t} - Professional enterprise-grade digital asset built with meticulous attention to detail. Includes comprehensive component variants, auto-layout 5.0, tokens, and multi-format exports.`,
          status, p.p, Math.round(p.p * 1.8), Math.round(p.p * 4.5),
          p.sales, p.sales * p.p, p.rating, Math.floor(p.sales * 0.75), p.sales * 14 + 120,
          isFeatured, p.tags, ['Figma', 'Sketch', 'Adobe XD'], ['.fig', '.svg', '.png'], createdAt
        ]
      );
      productListings.push(listingRes.rows[0]);
    }
    console.log(`  ✓ ${productListings.length} Digital Products seeded.`);

    // =========================================================================
    // 6. SEED 40+ PROFESSIONAL SERVICES (listing_type = 'service') (Phase 18.D)
    // =========================================================================
    console.log('💼 Seeding 40+ Professional Design Services...');
    const serviceTitles = [
      { t: 'Custom SaaS Dashboard UI/UX Design & Architecture', cat: 'dashboards', p: 145000, rating: 4.98, sales: 24, tags: ['saas', 'dashboard', 'ux-research'] },
      { t: 'End-to-End iOS & Android Mobile Banking App Design', cat: 'mobile-apps', p: 185000, rating: 4.99, sales: 18, tags: ['fintech', 'mobile', 'ios', 'banking'] },
      { t: 'High-Converting E-Commerce Web & Mobile Store Redesign', cat: 'web-templates', p: 120000, rating: 4.92, sales: 28, tags: ['ecommerce', 'redesign', 'conversion'] },
      { t: 'Enterprise Design System Creation & Tokenization', cat: 'design-systems', p: 250000, rating: 5.00, sales: 15, tags: ['design-system', 'tokens', 'enterprise'] },
      { t: 'B2B SaaS Landing Page Design & Interactive Prototyping', cat: 'landing-pages', p: 75000, rating: 4.95, sales: 35, tags: ['landing-page', 'saas', 'prototype'] },
      { t: 'Complete Brand Identity, Logo & Design Guidelines', cat: 'logos-branding', p: 95000, rating: 4.91, sales: 30, tags: ['branding', 'logo', 'guidelines'] },
      { t: 'Comprehensive UX Audit, Heuristic Evaluation & Usability Report', cat: 'wireframes', p: 65000, rating: 4.96, sales: 42, tags: ['ux-audit', 'heuristic', 'usability'] },
      { t: 'Real-Time Financial Analytics & Trading Terminal Design', cat: 'charts-data-vis', p: 195000, rating: 4.97, sales: 12, tags: ['fintech', 'trading', 'charts'] },
      { t: 'Investor Pitch Deck & Corporate Presentation Masterclass', cat: 'presentations', p: 55000, rating: 4.94, sales: 38, tags: ['pitch-deck', 'investor', 'keynote'] },
      { t: 'Custom 3D Icon Set & Visual Asset Production', cat: 'icons', p: 85000, rating: 4.89, sales: 22, tags: ['3d-icons', 'custom', 'renders'] },
      { t: 'Web3 & Crypto Wallet Mobile Interface Design', cat: 'mobile-apps', p: 160000, rating: 4.93, sales: 16, tags: ['web3', 'crypto', 'wallet'] },
      { t: 'Healthcare & Telemedicine Patient Portal UI/UX', cat: 'ui-kits', p: 150000, rating: 4.95, sales: 14, tags: ['telemedicine', 'healthcare', 'portal'] },
      { t: 'Interactive Figma Prototype for Series A Fundraise', cat: 'wireframes', p: 89000, rating: 4.98, sales: 26, tags: ['figma-prototype', 'fundraise', 'demo'] },
      { t: 'Tailwind CSS Component System & Frontend Hand-off', cat: 'design-systems', p: 110000, rating: 4.91, sales: 20, tags: ['tailwind', 'frontend', 'handoff'] },
      { t: 'Custom Editorial & Brand Typography Creation', cat: 'typography', p: 135000, rating: 4.88, sales: 10, tags: ['font-design', 'custom-type', 'branding'] },
      { t: 'Social Media Brand System & Content Template Suite', cat: 'social-media', p: 45000, rating: 4.87, sales: 33, tags: ['social-media', 'content-system'] },
      { t: 'AI Assistant & Conversational Bot Interface Design', cat: 'dashboards', p: 125000, rating: 4.96, sales: 25, tags: ['ai-ui', 'chatbot', 'generative'] },
      { t: 'Multi-Tenant Cloud Admin Panel & IAM Workflow Design', cat: 'dashboards', p: 175000, rating: 4.97, sales: 17, tags: ['iam', 'admin-panel', 'cloud'] },
      { t: 'Photorealistic 3D Device & Packaging Mockup Renders', cat: 'mockups', p: 60000, rating: 4.90, sales: 21, tags: ['3d-render', 'packaging', 'mockup'] },
      { t: 'Full Product Discovery Sprint & Wireframing Package', cat: 'wireframes', p: 98000, rating: 4.93, sales: 19, tags: ['discovery', 'sprint', 'wireframes'] },
      { t: 'On-Demand Food & Grocery Logistics Mobile UI/UX', cat: 'mobile-apps', p: 140000, rating: 4.89, sales: 15, tags: ['logistics', 'delivery', 'mobile'] },
      { t: 'B2B Enterprise Portal & Supply Chain Analytics Design', cat: 'dashboards', p: 210000, rating: 4.99, sales: 11, tags: ['supply-chain', 'enterprise', 'portal'] },
      { t: 'Educational LMS & Online Classroom Student Experience', cat: 'ui-kits', p: 115000, rating: 4.91, sales: 18, tags: ['edtech', 'lms', 'student-portal'] },
      { t: 'Custom Vector Illustration Library for Marketing Sites', cat: 'illustrations', p: 75000, rating: 4.86, sales: 24, tags: ['illustrations', 'custom-vector'] },
      { t: 'Modern Real Estate & Rental Property Web Experience', cat: 'web-templates', p: 105000, rating: 4.90, sales: 16, tags: ['real-estate', 'luxury', 'web'] },
      { t: 'Dark Mode Redesign & Contrast Accessibility Overhaul', cat: 'design-systems', p: 70000, rating: 4.94, sales: 27, tags: ['dark-mode', 'wcag', 'accessibility'] },
      { t: 'Executive Keynote Slide Deck Design & Data Styling', cat: 'presentations', p: 48000, rating: 4.92, sales: 32, tags: ['keynote', 'executive', 'slides'] },
      { t: 'IoT Smart Home Control Center & Tablet Interface Design', cat: 'dashboards', p: 165000, rating: 4.95, sales: 13, tags: ['iot', 'smart-home', 'tablet'] },
      { t: 'Fitness & Wearable App UI/UX with WatchOS Experience', cat: 'mobile-apps', p: 130000, rating: 4.88, sales: 14, tags: ['wearables', 'watchos', 'fitness'] },
      { t: 'Micro-Interaction & Lottie Animation Design Suite', cat: 'icons', p: 55000, rating: 4.91, sales: 23, tags: ['lottie', 'animation', 'micro-interactions'] },
      { t: 'SaaS Pricing & Checkout Funnel Optimization Redesign', cat: 'landing-pages', p: 68000, rating: 4.97, sales: 29, tags: ['pricing', 'checkout', 'funnel'] },
      { t: 'Cybersecurity Threat Intelligence Console Interface', cat: 'dashboards', p: 190000, rating: 4.98, sales: 9, tags: ['cybersecurity', 'threat-intel', 'soc'] },
      { t: 'Creative Director Consultation & Design Team Mentorship', cat: 'wireframes', p: 80000, rating: 4.99, sales: 15, tags: ['consultation', 'mentorship', 'leadership'] },
      { t: 'Design Sprint for Rapid 5-Day MVP Validation', cat: 'wireframes', p: 115000, rating: 4.94, sales: 12, tags: ['design-sprint', 'mvp', 'validation'] },
      { t: 'Global Rebranding Strategy & Style Guide Documentation', cat: 'logos-branding', p: 180000, rating: 4.96, sales: 8, tags: ['rebranding', 'style-guide', 'strategy'] },
      { t: 'Music Streaming & Audio Player Mobile App Design', cat: 'mobile-apps', p: 125000, rating: 4.89, sales: 11, tags: ['music-app', 'audio', 'mobile'] },
      { t: 'Corporate Annual Sustainability Report Design & Layout', cat: 'presentations', p: 62000, rating: 4.93, sales: 14, tags: ['sustainability', 'annual-report'] },
      { t: 'Multi-Currency International Checkout Interface Design', cat: 'web-templates', p: 85000, rating: 4.92, sales: 17, tags: ['checkout', 'international', 'payments'] },
      { t: 'Bespoke Iconography & Glyphs for Hardware Products', cat: 'icons', p: 72000, rating: 4.87, sales: 10, tags: ['hardware', 'glyphs', 'industrial'] },
      { t: 'Automotive Digital Cockpit & Infotainment UI Design', cat: 'dashboards', p: 290000, rating: 5.00, sales: 6, tags: ['automotive', 'infotainment', 'cockpit'] },
    ];

    const serviceListings = [];
    for (let i = 0; i < serviceTitles.length; i++) {
      const s = serviceTitles[i];
      const seller = sellerIds[i % sellerIds.length];
      const catId = categoryMap.get(s.cat) || categoryMap.get('dashboards');
      const slug = `${s.t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`;
      const status = i === 38 ? 'pending_review' : i === 39 ? 'draft' : 'approved';
      const isFeatured = i < 6;
      const daysAgo = Math.floor(Math.random() * 85) + 3;
      const createdAt = new Date(Date.now() - daysAgo * 86400000);

      const listingRes = await client.query(
        `INSERT INTO listings (
           seller_id, category_id, title, slug, description, listing_type, status,
           price_personal, price_commercial, price_extended, currency,
           total_sales, total_revenue_cents, avg_rating, review_count, view_count,
           is_featured, tags, software_compat, file_formats, created_at, published_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, 'service', $6, $7, $8, $9, 'USD', $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $19, $19)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           total_sales = EXCLUDED.total_sales,
           total_revenue_cents = EXCLUDED.total_revenue_cents
         RETURNING id, title, price_personal, price_commercial, price_extended, seller_id`,
        [
          seller.id, catId, s.t, slug,
          `${s.t} - Bespoke professional UI/UX consulting and end-to-end design service delivered by verified top-tier marketplace experts. Includes discovery, sprint milestones, user research, interactive Figma components, and complete developer handoff.`,
          status, s.p, Math.round(s.p * 1.6), Math.round(s.p * 2.8),
          s.sales, s.sales * s.p, s.rating, Math.floor(s.sales * 0.8), s.sales * 22 + 95,
          isFeatured, s.tags, ['Figma', 'Miro', 'Lottie', 'Notion'], ['Deliverables: .fig, UI Tokens, Video Demo'], createdAt
        ]
      );
      serviceListings.push(listingRes.rows[0]);
    }
    console.log(`  ✓ ${serviceListings.length} Professional Design Services seeded.`);

    // =========================================================================
    // 7. SEED 180+ REALISTIC ORDERS & FINANCIAL TRANSACTIONS (Phases 18.E & 18.F)
    // =========================================================================
    console.log('💳 Seeding 180+ Orders with Ledger, Payments, and Escrow...');
    const allListings = [
      ...productListings.map(l => ({ ...l, type: 'asset' })),
      ...serviceListings.map(l => ({ ...l, type: 'service' }))
    ];

    const seededOrders = [];
    const commissionRate = 0.15; // 15% platform commission

    for (let i = 0; i < 185; i++) {
      const listing = allListings[i % allListings.length];
      const buyerId = customerIds[i % customerIds.length];
      const sellerId = listing.seller_id;

      // Realistic price distribution
      const basePrice = listing.type === 'asset'
        ? (listing.price_personal || 3900)
        : (listing.price_personal || 95000);

      const amountCents = basePrice;
      const discountCents = (i % 7 === 0) ? Math.round(basePrice * 0.10) : 0;
      const netChargedCents = amountCents - discountCents;
      const platformFeeCents = Math.round(netChargedCents * commissionRate);
      const sellerPayoutCents = netChargedCents - platformFeeCents;

      // Order status distribution
      let status = 'complete';
      if (i >= 170) status = 'pending';
      else if (i >= 160) status = 'active';
      else if (i >= 152) status = 'refunded';
      else if (i >= 147) status = 'cancelled';
      else if (i >= 144) status = 'disputed';

      // Timestamps across 90 days
      const daysAgo = Math.floor((185 - i) * (90 / 185));
      const orderDate = new Date(Date.now() - (daysAgo * 86400000 + Math.random() * 43200000));
      const completedDate = (status === 'complete') ? new Date(orderDate.getTime() + 86400000) : null;
      const refundedDate = (status === 'refunded') ? new Date(orderDate.getTime() + 172800000) : null;
      const cancelledDate = (status === 'cancelled') ? new Date(orderDate.getTime() + 43200000) : null;

      const orderRes = await client.query(
        `INSERT INTO orders (
           buyer_id, seller_id, listing_id, listing_title, listing_type, license_type,
           amount_cents, discount_cents, platform_fee_cents, seller_payout_cents,
           currency, status, created_at, completed_at, refunded_at, cancelled_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, 'commercial', $6, $7, $8, $9, 'USD', $10, $11, $12, $13, $14, $11)
         RETURNING id, buyer_id, seller_id, listing_id, listing_title, listing_type, amount_cents, status, created_at`,
        [
          buyerId, sellerId, listing.id, listing.title, listing.type,
          amountCents, discountCents, platformFeeCents, sellerPayoutCents,
          status, orderDate, completedDate, refundedDate, cancelledDate
        ]
      );
      const order = orderRes.rows[0];
      seededOrders.push(order);

      // Financial Ledger entry (for complete and active orders)
      if (status === 'complete' || status === 'active' || status === 'refunded') {
        await client.query(
          `INSERT INTO commission_ledger (
             order_id, seller_id, gross_amount_cents, commission_rate,
             commission_cents, net_seller_cents, seller_plan, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, 'pro', $7)`,
          [order.id, sellerId, netChargedCents, commissionRate, platformFeeCents, sellerPayoutCents, orderDate]
        );

        // Payment intent record
        const pStatus = status === 'refunded' ? 'refunded' : status === 'complete' ? 'succeeded' : 'requires_capture';
        await client.query(
          `INSERT INTO payment_intents (
             order_id, stripe_intent_id, status, amount_cents, currency,
             payment_method_type, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, 'USD', $5, $6, $6)`,
          [
            order.id, `pi_test_${order.id.slice(0, 16)}`, pStatus,
            amountCents, (i % 3 === 0 ? 'card' : i % 3 === 1 ? 'apple_pay' : 'google_pay'), orderDate
          ]
        );
      }

      // If disputed, create dispute record
      if (status === 'disputed') {
        await client.query(
          `INSERT INTO disputes (
             order_id, opened_by_id, status, reason, description,
             refund_amount_cents, opened_at, sla_deadline, created_at, updated_at
           ) VALUES ($1, $2, 'under_review', 'quality_issue',
             'The client submitted a revision dispute regarding scope alignment on final Figma frames.',
             $3, $4, $5, $4, $4)`,
          [order.id, buyerId, amountCents, orderDate, new Date(orderDate.getTime() + 86400000 * 3)]
        );
      }
    }
    console.log(`  ✓ ${seededOrders.length} Orders with financial ledgers, payments, and disputes seeded.`);

    // =========================================================================
    // 8. SEED PAYOUTS (Phase 18.F)
    // =========================================================================
    console.log('🏦 Seeding Seller Payout Records...');
    for (let i = 0; i < 25; i++) {
      const seller = sellerIds[i % sellerIds.length];
      const payoutAmount = 50000 + (i * 12000);
      const daysAgo = Math.floor(Math.random() * 60) + 1;
      const scheduledFor = new Date(Date.now() - daysAgo * 86400000);
      const pStatus = i < 18 ? 'paid' : i < 22 ? 'processing' : 'pending';

      // Ensure payout method exists
      const pmRes = await client.query(
        `INSERT INTO payout_methods (seller_id, method_type, display_name, stripe_account_id, is_default, is_verified)
         VALUES ($1, 'stripe_connect', 'Stripe Connect (••••4242)', $2, TRUE, TRUE)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [seller.id, `acct_test_${seller.id.slice(0, 12)}`]
      );
      let methodId = pmRes.rows[0]?.id;
      if (!methodId) {
        const existing = await client.query('SELECT id FROM payout_methods WHERE seller_id = $1 LIMIT 1', [seller.id]);
        methodId = existing.rows[0]?.id;
      }

      if (methodId) {
        await client.query(
          `INSERT INTO payouts (
             seller_id, payout_method_id, status, amount_cents, currency,
             stripe_transfer_id, scheduled_for, processed_at, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, 'USD', $5, $6, $7, $6, $6)`,
          [
            seller.id, methodId, pStatus, payoutAmount,
            `tr_test_${Math.random().toString(36).substring(2, 10)}`,
            scheduledFor, (pStatus === 'paid' ? scheduledFor : null)
          ]
        );
      }
    }
    console.log(`  ✓ Seller Payouts seeded.`);

    // =========================================================================
    // 9. SEED 60+ REVIEWS (Phase 18.G)
    // =========================================================================
    console.log('⭐ Seeding 60+ Realistic Verified Reviews...');
    const reviewTexts = [
      'Exceptional design quality! The auto-layout setup and token naming saved our frontend engineering team days of work.',
      'One of the best Figma resources I have ever purchased. Highly recommended for any serious SaaS product.',
      'Outstanding professional service! The seller communicated promptly, understood our complex requirements, and delivered ahead of schedule.',
      'Super clean layouts and modern visual hierarchy. Very impressed with the component documentation.',
      'Brilliant UI kit. Easy to customize and well-structured layers. 10/10.',
      'The custom dashboard design transformed our MVP into an enterprise-ready customer presentation. Will hire again!',
      'Great assets, high resolution, and clean vector shapes. Perfect for our marketing overhaul.',
      'Top-tier design work. The typography choices and responsive breakpoints were flawless.',
      'Fast delivery, attentive to feedback during revisions, and delivered production-ready Figma tokens.',
      'Incredible value for money. Highly professional seller with exceptional design sensibilities.',
    ];

    const completeOrders = seededOrders.filter(o => o.status === 'complete');
    for (let i = 0; i < Math.min(65, completeOrders.length); i++) {
      const order = completeOrders[i];
      const rating = (i % 8 === 0) ? 4 : 5;
      const reviewText = reviewTexts[i % reviewTexts.length];
      const reviewDate = new Date(order.created_at.getTime() + 86400000 * 2);

      await client.query(
        `INSERT INTO reviews (
           order_id, reviewer_id, subject_id, listing_id, review_type,
           rating_overall, rating_quality, rating_communication, rating_value, rating_delivery,
           review_text, status, published_at, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, 'buyer_review', $5, $5, 5, $5, 5, $6, 'approved', $7, $7, $7)
         ON CONFLICT DO NOTHING`,
        [order.id, order.buyer_id, order.seller_id, order.listing_id, rating, reviewText, reviewDate]
      );
    }
    console.log(`  ✓ Reviews seeded.`);

    // =========================================================================
    // 10. SEED 120+ ACTIVITIES & AUDIT LOGS (Phase 18.H)
    // =========================================================================
    console.log('📜 Seeding 120+ Centralized Activity & Audit Logs...');
    const activityTypes = [
      { action: 'USER_REGISTERED', module: 'auth', desc: 'New customer account registered and verified.' },
      { action: 'SELLER_APPLICATION_SUBMITTED', module: 'sellers', desc: 'Seller profile submitted portfolio for verification.' },
      { action: 'SELLER_APPROVED', module: 'sellers', desc: 'Platform Administrator approved seller verification badge.' },
      { action: 'LISTING_PUBLISHED', module: 'services', desc: 'New design service approved and published to global marketplace.' },
      { action: 'DIGITAL_PRODUCT_UPLOADED', module: 'products', desc: 'Digital asset uploaded and passed automated quality scan.' },
      { action: 'ORDER_PLACED', module: 'orders', desc: 'Buyer initiated checkout for commercial design asset.' },
      { action: 'PAYMENT_SUCCEEDED', module: 'payments', desc: 'Stripe webhook confirmed successful payment charge.' },
      { action: 'ESCROW_FUNDS_HELD', module: 'payments', desc: 'Service milestone payment locked in secure marketplace escrow.' },
      { action: 'ORDER_COMPLETED', module: 'orders', desc: 'Buyer accepted final delivery and completed order.' },
      { action: 'PAYOUT_PROCESSED', module: 'payouts', desc: 'Automated weekly payout dispatched to verified seller bank.' },
      { action: 'REVIEW_SUBMITTED', module: 'reviews', desc: 'Customer submitted a 5-star review for completed design order.' },
      { action: 'DISPUTE_OPENED', module: 'disputes', desc: 'Customer requested mediation on active project deliverable.' },
      { action: 'ROLE_PERMISSION_UPDATED', module: 'rbac', desc: 'Administrator updated role permissions in Security Matrix.' },
      { action: 'SYSTEM_SETTINGS_UPDATED', module: 'system', desc: 'Platform fee percentage adjusted in platform config.' },
    ];

    const adminUser = staffToSeed[0];
    const adminUserRes = await client.query('SELECT id FROM users WHERE email = $1', [adminUser.email]);
    const adminId = adminUserRes.rows[0].id;

    for (let i = 0; i < 125; i++) {
      const act = activityTypes[i % activityTypes.length];
      const daysAgo = Math.floor((125 - i) * (90 / 125));
      const logTime = new Date(Date.now() - (daysAgo * 86400000 + Math.random() * 86400000));

      await client.query(
        `INSERT INTO audit_logs (
           actor_id, actor_type, action, entity_type, entity_id,
           old_values, new_values, ip_address, user_agent, metadata, created_at
         ) VALUES ($1, 'admin', $2, $3, gen_random_uuid(), $4, $5, '192.168.1.1'::inet, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', $6, $7)`,
        [
          adminId, act.action, act.module,
          JSON.stringify({ previous_state: 'initial' }),
          JSON.stringify({ new_state: 'updated', timestamp: logTime.toISOString() }),
          JSON.stringify({ description: act.desc, module: act.module, severity: 'info' }),
          logTime
        ]
      );
    }
    console.log(`  ✓ 120+ Activity & Audit Logs seeded.`);

    // =========================================================================
    // 11. SEED ANALYTICS EVENTS & SEARCH QUERIES (Phase 18.I)
    // =========================================================================
    console.log('📊 Seeding Analytics Events and Search Queries...');
    const searchTerms = [
      { q: 'saas dashboard', count: 320, res: 28 },
      { q: 'fintech mobile app', count: 285, res: 24 },
      { q: 'crypto wallet ui', count: 210, res: 18 },
      { q: 'figma design system', count: 410, res: 35 },
      { q: 'landing page startup', count: 195, res: 22 },
      { q: 'minimal 3d icons', count: 180, res: 16 },
      { q: 'investor pitch deck', count: 230, res: 20 },
      { q: 'tailwind ui kit', count: 310, res: 30 },
      { q: 'healthcare patient portal', count: 140, res: 12 },
      { q: 'dark mode crm', count: 165, res: 15 },
      { q: 'ecommerce figma template', count: 290, res: 25 },
      { q: 'real estate mobile kit', count: 120, res: 10 },
      { q: 'automotive cockpit ui', count: 45, res: 4 },
      { q: 'quantum ai interface', count: 32, res: 2 },
    ];

    for (const s of searchTerms) {
      await client.query(
        `INSERT INTO search_queries (user_id, query_text, results_count, filters, created_at)
         VALUES ($1, $2, $3, '{"sort": "relevance"}', NOW() - (INTERVAL '1 day' * (RANDOM() * 60)))`,
        [customerIds[Math.floor(Math.random() * customerIds.length)], s.q, s.res]
      );
    }

    const eventTypes = ['product_view', 'service_view', 'add_to_cart', 'checkout_intent', 'payment_success', 'order_complete'];
    for (let i = 0; i < 350; i++) {
      const eType = eventTypes[i % eventTypes.length];
      const listing = allListings[i % allListings.length];
      const daysAgo = Math.floor(Math.random() * 90);
      const eventTime = new Date(Date.now() - daysAgo * 86400000);

      await client.query(
        `INSERT INTO analytics_events (event_type, user_id, resource_type, resource_id, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          eType,
          customerIds[i % customerIds.length],
          listing.type,
          listing.id,
          JSON.stringify({ price_cents: listing.price_personal, title: listing.title }),
          eventTime
        ]
      );
    }
    console.log(`  ✓ Analytics events and search queries seeded.`);

    // =========================================================================
    // 12. SEED SYSTEM HEALTH MONITORING & ALERTS (Phase 18.J)
    // =========================================================================
    console.log('🩺 Seeding System Health & Integration Checks...');
    const components = [
      { name: 'database', type: 'latency', status: 'operational', lat: 3, details: { active_conns: 12, max_conns: 100, pool_usage: '12%' } },
      { name: 'redis', type: 'readiness', status: 'operational', lat: 1, details: { memory_used_mb: 48, connected_clients: 8 } },
      { name: 'api_gateway', type: 'liveness', status: 'operational', lat: 18, details: { uptime_pct: 99.98, avg_response_ms: 22 } },
      { name: 'stripe', type: 'integration', status: 'operational', lat: 65, details: { webhook_success_rate: '99.9%', api_version: '2024-12-18' } },
      { name: 'email', type: 'integration', status: 'operational', lat: 110, details: { provider: 'SendGrid', delivery_rate: '99.4%' } },
      { name: 'storage', type: 'integration', status: 'operational', lat: 42, details: { provider: 'AWS S3 / Cloudflare R2', bucket: 'desigot-assets' } },
    ];

    for (const c of components) {
      await client.query(
        `INSERT INTO system_health_checks (component, check_type, status, latency_ms, details, checked_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [c.name, c.type, c.status, c.lat, JSON.stringify(c.details)]
      );
    }

    // Health alerts
    await client.query(
      `INSERT INTO system_health_alerts (severity, component, title, message, is_resolved, created_at)
       VALUES
         ('info', 'database', 'Automated Daily Backup Complete', 'Daily full WAL and schema snapshot backed up to cold storage.', TRUE, NOW() - INTERVAL '4 hours'),
         ('warning', 'email', 'SendGrid Webhook Delivery Spike', 'Temporary delivery latency observed during morning dispatch batch.', TRUE, NOW() - INTERVAL '1 day'),
         ('info', 'stripe', 'Monthly Connect Payout Batch Dispatched', 'All eligible verified seller payouts processed successfully.', TRUE, NOW() - INTERVAL '3 days')`
    );

    // Background job logs
    await client.query(
      `INSERT INTO background_job_logs (job_name, queue_name, status, duration_ms, attempts, payload)
       VALUES
         ('escrow_auto_release', 'escrow', 'completed', 145, 1, '{"processed_orders": 14}'),
         ('payout_transfer_batch', 'payouts', 'completed', 480, 1, '{"batch_id": "b_8829"}'),
         ('analytics_daily_rollup', 'analytics', 'completed', 320, 1, '{"date": "yesterday"}'),
         ('s3_watermark_generation', 'media', 'completed', 850, 1, '{"assets_processed": 6}')`
    );
    console.log(`  ✓ System Health checks and alerts ready.`);

    await client.query('COMMIT');
    console.log('\n======================================================');
    console.log('🎉 DESIGOT MARKETPLACE & ANALYTICS SEED COMPLETE!');
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedMarketplace();
}

module.exports = seedMarketplace;
