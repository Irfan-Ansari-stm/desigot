'use strict';
require('dotenv').config();
const { Pool } = require('pg');
const config = require('../config');

async function seedServices() {
  const pool = new Pool({
    connectionString: config.db.primary,
    ssl: config.db.ssl,
  });

  const client = await pool.connect();

  try {
    console.log('🚀 Starting Desigot Complete Service Management Seeder...');
    await client.query('BEGIN');

    // =========================================================================
    // 1. SEED 20 SERVICE CATEGORIES & SUBCATEGORIES (Part 28.B)
    // =========================================================================
    console.log('📂 Seeding 20 Service Categories & Subcategories...');
    const serviceCategoryDefs = [
      { name: 'UI/UX Design', slug: 'ui-ux-design', icon: 'Layout', desc: 'Holistic UI/UX design from user journeys to production Figma components.', subs: ['Web UI Design', 'Mobile UI/UX', 'Product Redesign', 'Design Sprints'] },
      { name: 'Website Design', slug: 'website-design', icon: 'Globe', desc: 'Bespoke corporate, startup, and portfolio website design solutions.', subs: ['B2B Websites', 'Corporate Portals', 'Portfolio Websites', 'Micro-sites'] },
      { name: 'Mobile App Design', slug: 'mobile-app-design', icon: 'Smartphone', desc: 'iOS and Android mobile app interfaces designed for high engagement.', subs: ['iOS Native UI', 'Android Material Design', 'Cross-Platform Apps', 'App Store Assets'] },
      { name: 'Dashboard Design', slug: 'dashboard-design', icon: 'LayoutDashboard', desc: 'Complex administrative, analytics, and CRM dashboard interfaces.', subs: ['Analytics Consoles', 'Admin Panels', 'Data Visualization UI', 'CRM Portals'] },
      { name: 'SaaS Design', slug: 'saas-design', icon: 'Cloud', desc: 'Product design for cloud software, subscription portals, and workflows.', subs: ['B2B SaaS Interfaces', 'Billing & Checkout Flows', 'Onboarding Sequences', 'Feature Walkthroughs'] },
      { name: 'Landing Page Design', slug: 'landing-page-design', icon: 'Compass', desc: 'Conversion-rate optimized marketing and product launch landing pages.', subs: ['Lead Gen Pages', 'Product Launch', 'Event Landers', 'Waitlist Pages'] },
      { name: 'Branding & Identity', slug: 'branding-identity', icon: 'Sparkles', desc: 'Complete brand visual architecture, style guidelines, and assets.', subs: ['Brand Style Guides', 'Corporate Stationery', 'Visual Identity Systems', 'Rebranding Audits'] },
      { name: 'Logo Design', slug: 'logo-design', icon: 'Target', desc: 'Distinctive vector logo design, emblems, and visual iconography.', subs: ['Wordmarks & Glyphs', 'Minimalist Logos', 'Abstract Emblems', 'Animated Logos'] },
      { name: 'Design Systems', slug: 'design-systems-service', icon: 'Layers', desc: 'Enterprise Figma component libraries, multi-brand tokens, and docs.', subs: ['Figma Tokens Setup', 'Atomic Design Kits', 'Accessibility Audits', 'Zeroheight Documentation'] },
      { name: 'Wireframing', slug: 'wireframing-service', icon: 'Box', desc: 'Low and high-fidelity structural layouts and sitemaps.', subs: ['Low-Fi Blueprints', 'High-Fi Layouts', 'Information Architecture', 'User Flows'] },
      { name: 'Prototyping', slug: 'prototyping-service', icon: 'Zap', desc: 'Interactive clickable prototypes for investor pitches and user tests.', subs: ['Clickable Figma Prototypes', 'Micro-interactions', 'Lottie Animations', 'User Test Prototypes'] },
      { name: 'UX Research', slug: 'ux-research-service', icon: 'Search', desc: 'Qualitative user interviews, competitive audits, and usability tests.', subs: ['Heuristic Evaluations', 'Competitor Audits', 'User Interview Sprints', 'Usability Testing Reports'] },
      { name: 'Graphic Design', slug: 'graphic-design-service', icon: 'Palette', desc: 'Marketing visuals, digital banner suites, and campaign collateral.', subs: ['Marketing Collateral', 'Advertising Banners', 'Digital Booklets', 'Infographics'] },
      { name: 'Illustration', slug: 'illustration-service', icon: 'Image', desc: 'Custom digital vector and hand-drawn storytelling illustrations.', subs: ['Hero Header Art', 'Mascot & Character Design', 'Isometric Scene Art', 'Spot Illustrations'] },
      { name: '3D Design', slug: '3d-design-service', icon: 'Shapes', desc: '3D device renders, interactive scene elements, and product mockups.', subs: ['Device Renders', '3D UI Elements', 'Abstract 3D Backgrounds', 'Packaging 3D'] },
      { name: 'Presentation Design', slug: 'presentation-design-service', icon: 'Presentation', desc: 'Investor pitch decks, executive board decks, and keynote slides.', subs: ['Seed to Series B Decks', 'Keynote Presentations', 'Annual Shareholder Reports', 'Webinar Slides'] },
      { name: 'E-commerce Design', slug: 'ecommerce-design-service', icon: 'ShoppingBag', desc: 'High-conversion online storefronts, cart flows, and product cards.', subs: ['Storefront Redesign', 'Cart & Checkout Funnels', 'Product Detail Pages', 'Shopify UI Theme Design'] },
      { name: 'Web Application Design', slug: 'web-application-design', icon: 'Monitor', desc: 'Complex multi-role web apps, customer portals, and enterprise tools.', subs: ['Multi-Tenant Apps', 'Customer Self-Service', 'Financial Portals', 'Logistics Consoles'] },
      { name: 'Consultation', slug: 'design-consultation', icon: 'MessageSquare', desc: 'Strategic advisory, design critique, and team process mentorship.', subs: ['1-on-1 Design Critique', 'Design Sprint Facilitation', 'Team Hiring Advisory', 'Design Architecture Review'] },
      { name: 'Email Design', slug: 'email-design-service', icon: 'Mail', desc: 'Responsive email newsletter templates and automated onboarding emails.', subs: ['Transactional Emails', 'Newsletter Templates', 'Promotional Campaigns', 'Figma to HTML Email'] },
    ];

    const categoryMap = new Map();
    let sort = 1;
    for (const c of serviceCategoryDefs) {
      const pRes = await client.query(
        `INSERT INTO listing_categories (name, slug, description, icon_name, sort_order, is_active, depth)
         VALUES ($1, $2, $3, $4, $5, TRUE, 0)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
         RETURNING id, slug`,
        [c.name, c.slug, c.desc, c.icon, sort++]
      );
      const parent = pRes.rows[0];
      categoryMap.set(parent.slug, parent.id);

      let subSort = 1;
      for (const sub of c.subs) {
        const subSlug = `${c.slug}-${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const subRes = await client.query(
          `INSERT INTO listing_categories (parent_id, name, slug, description, icon_name, sort_order, is_active, depth)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, 1)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id, slug`,
          [parent.id, sub, subSlug, `${sub} in ${c.name}`, c.icon, subSort++]
        );
        categoryMap.set(subSlug, subRes.rows[0].id);
      }
    }
    console.log(`  ✓ 20 Service Categories & 80 subcategories ready.`);

    // =========================================================================
    // 2. SEED 15 SERVICE ATTRIBUTES & OPTIONS (Part 28.C)
    // =========================================================================
    console.log('🏷️ Seeding 15 Service Attributes with Options...');
    const attributeDefs = [
      { name: 'Design Platform', slug: 'design-platform', type: 'multi_select', options: ['Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator'] },
      { name: 'Device Type', slug: 'device-type', type: 'multi_select', options: ['Desktop Web', 'Mobile (iOS)', 'Mobile (Android)', 'Tablet', 'Smartwatch'] },
      { name: 'Industry Focus', slug: 'industry-focus', type: 'select', options: ['Fintech & Banking', 'Healthcare & Medical', 'E-commerce & Retail', 'SaaS & B2B', 'Crypto & Web3', 'EdTech & Learning', 'Real Estate'] },
      { name: 'Service Type', slug: 'service-type-attr', type: 'select', options: ['End-to-End Product Design', 'UI Visual Design', 'UX Research & Wireframing', 'Design System Creation', 'Design Audit & Redesign'] },
      { name: 'Delivery Format', slug: 'delivery-format', type: 'multi_select', options: ['Figma Source (.fig)', 'Interactive Prototype Link', 'Vector SVG & PDF', 'Tailwind CSS Tokens', 'React / Next.js Components'] },
      { name: 'Primary Language', slug: 'service-language', type: 'select', options: ['English', 'Spanish', 'French', 'German', 'Japanese', 'Arabic'] },
      { name: 'Experience Level', slug: 'seller-exp-level', type: 'select', options: ['Mid-Level Designer', 'Senior UI/UX Specialist', 'Lead / Principal Designer', 'Design Studio & Agency'] },
      { name: 'Project Complexity', slug: 'project-complexity', type: 'select', options: ['MVP (Simple)', 'Scale-Up (Moderate)', 'Enterprise (Complex)'] },
      { name: 'Design Style', slug: 'design-style', type: 'multi_select', options: ['Minimalist Clean', 'Dark Mode Focused', 'Bold & Vibrant', 'Corporate Enterprise', 'Neumorphic / Glassmorphic'] },
      { name: 'Source Files Included', slug: 'source-files-incl', type: 'boolean', options: ['Included', 'Available as Add-on', 'Not Included'] },
      { name: 'Responsive Breakpoints', slug: 'responsive-breakpoints', type: 'multi_select', options: ['Mobile (390px)', 'Tablet (834px)', 'Desktop (1440px)', 'Ultra-wide (1920px)'] },
      { name: 'Accessibility Standard', slug: 'accessibility-standard', type: 'select', options: ['WCAG 2.1 AA Compliant', 'WCAG 2.1 AAA Compliant', 'High Contrast Verified', 'Standard Baseline'] },
      { name: 'Screens Included', slug: 'screens-included', type: 'select', options: ['1 - 5 Screens', '6 - 15 Screens', '16 - 30 Screens', '31+ Screens'] },
      { name: 'Number of Pages', slug: 'number-of-pages', type: 'select', options: ['1 - 3 Pages', '4 - 8 Pages', '9 - 15 Pages', '16+ Pages'] },
      { name: 'Revision Type', slug: 'revision-type', type: 'select', options: ['Fixed Revisions', 'Unlimited During Sprint', 'Milestone-based'] },
    ];

    const attributeMap = new Map();
    const optionMap = new Map();

    for (let i = 0; i < attributeDefs.length; i++) {
      const a = attributeDefs[i];
      const aRes = await client.query(
        `INSERT INTO service_attributes (name, slug, description, input_type, is_required, is_searchable, is_filterable, display_order)
         VALUES ($1, $2, $3, $4, TRUE, TRUE, TRUE, $5)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, slug`,
        [a.name, a.slug, `Attribute: ${a.name}`, a.type, i + 1]
      );
      const attr = aRes.rows[0];
      attributeMap.set(attr.slug, attr.id);

      for (let j = 0; j < a.options.length; j++) {
        const opt = a.options[j];
        const val = opt.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const optRes = await client.query(
          `INSERT INTO service_attribute_options (attribute_id, label, value, display_order)
           VALUES ($1, $2, $3, $4)
           RETURNING id, label, value`,
          [attr.id, opt, val, j + 1]
        );
        optionMap.set(`${attr.slug}:${val}`, optRes.rows[0].id);
      }
    }
    console.log(`  ✓ 15 Service Attributes with ${optionMap.size} options ready.`);

    // =========================================================================
    // 3. SEED 40 SERVICE TAGS (Part 28.D)
    // =========================================================================
    console.log('🏷️ Seeding 40 Service Tags...');
    const tagsList = [
      'Figma', 'SaaS', 'Modern', 'Minimal', 'Responsive', 'Mobile First', 'Dashboard',
      'Fintech', 'Healthcare', 'E-commerce', 'Landing Page', 'Premium', 'Startup',
      'Enterprise', 'Web Application', 'Mobile App', 'UX Research', 'Prototype',
      'Wireframe', 'Dark Mode', 'Brand Identity', 'Logo', 'Pitch Deck', 'Icons',
      'Design System', 'WCAG', 'Auto Layout', 'Tokens', 'Design Sprint', 'Discovery',
      'Miro', 'Lottie', 'Micro Interactions', '3D Renders', 'iOS', 'Android',
      'Material Design', 'Tailwind', 'B2B', 'Accessibility'
    ];

    const tagIds = [];
    for (const t of tagsList) {
      const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const tRes = await client.query(
        `INSERT INTO service_tags (name, slug, description, usage_count)
         VALUES ($1, $2, $3, 0)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, slug`,
        [t, slug, `Service tag for ${t}`]
      );
      tagIds.push(tRes.rows[0].id);
    }
    console.log(`  ✓ 40 Service Tags ready.`);

    // =========================================================================
    // 4. GET EXISTING SELLERS (From prior seed)
    // =========================================================================
    const sellersRes = await client.query(`SELECT id, display_name, username FROM users WHERE role = 'seller' LIMIT 30`);
    const sellers = sellersRes.rows;
    if (sellers.length === 0) {
      throw new Error('No sellers found. Please run seed-marketplace.js first!');
    }

    // =========================================================================
    // 5. SEED 60+ REALISTIC SERVICES ACROSS 8 STATUSES (Part 28.E)
    // =========================================================================
    console.log('💼 Seeding 60+ Professional Services with Lifecycles...');
    const serviceTemplates = [
      { t: 'Professional SaaS Dashboard UI/UX Design', cat: 'dashboard-design', price: 145000, days: 5, status: 'published', feat: true, rating: 4.98, orders: 48 },
      { t: 'Modern Mobile Banking App Design & Prototype', cat: 'mobile-app-design', price: 185000, days: 7, status: 'published', feat: true, rating: 4.99, orders: 36 },
      { t: 'Responsive E-commerce Store Redesign & Optimization', cat: 'ecommerce-design-service', price: 120000, days: 5, status: 'published', feat: true, rating: 4.92, orders: 42 },
      { t: 'High-Converting B2B SaaS Landing Page Design', cat: 'landing-page-design', price: 75000, days: 3, status: 'published', feat: true, rating: 4.95, orders: 55 },
      { t: 'Enterprise Multi-Brand Figma Design System Creation', cat: 'design-systems-service', price: 250000, days: 10, status: 'published', feat: true, rating: 5.00, orders: 28 },
      { t: 'Complete Brand Visual Identity, Logo & Style Guidelines', cat: 'branding-identity', price: 95000, days: 4, status: 'published', feat: true, rating: 4.91, orders: 39 },
      { t: 'Comprehensive UX Audit, Heuristic Evaluation & Report', cat: 'ux-research-service', price: 65000, days: 3, status: 'published', feat: false, rating: 4.96, orders: 45 },
      { t: 'Interactive Clickable Figma Prototype for Fundraise', cat: 'prototyping-service', price: 89000, days: 4, status: 'published', feat: true, rating: 4.98, orders: 33 },
      { t: 'Real-Time Financial Trading Terminal Interface Design', cat: 'dashboard-design', price: 195000, days: 8, status: 'published', feat: true, rating: 4.97, orders: 22 },
      { t: 'Series A / B Investor Pitch Deck Slide Masterclass', cat: 'presentation-design-service', price: 55000, days: 2, status: 'published', feat: false, rating: 4.94, orders: 50 },
      { t: 'Healthcare Clinic & Patient Telemedicine Portal UI', cat: 'ui-ux-design', price: 150000, days: 6, status: 'published', feat: true, rating: 4.95, orders: 26 },
      { t: 'Decentralized Web3 Crypto Wallet Mobile Interface', cat: 'mobile-app-design', price: 160000, days: 6, status: 'published', feat: false, rating: 4.93, orders: 24 },
      { t: 'Tailwind CSS Tokens & Frontend Developer Handoff', cat: 'design-systems-service', price: 110000, days: 4, status: 'published', feat: false, rating: 4.91, orders: 31 },
      { t: 'On-Demand Food Logistics & Delivery Mobile UI/UX', cat: 'mobile-app-design', price: 140000, days: 5, status: 'published', feat: false, rating: 4.89, orders: 21 },
      { t: 'B2B Supply Chain & Inventory Analytics Portal', cat: 'dashboard-design', price: 210000, days: 9, status: 'published', feat: false, rating: 4.99, orders: 19 },
      { t: 'Luxury Real Estate Property Booking Web Experience', cat: 'website-design', price: 105000, days: 5, status: 'published', feat: false, rating: 4.90, orders: 25 },
      { t: 'Dark Mode Redesign & WCAG AAA Contrast Overhaul', cat: 'design-systems-service', price: 70000, days: 3, status: 'published', feat: false, rating: 4.94, orders: 38 },
      { t: 'Fitness & Wearable App UI/UX with WatchOS Companion', cat: 'mobile-app-design', price: 130000, days: 5, status: 'published', feat: false, rating: 4.88, orders: 20 },
      { t: 'Cybersecurity Threat Intelligence Console Interface', cat: 'dashboard-design', price: 190000, days: 7, status: 'published', feat: false, rating: 4.98, orders: 18 },
      { t: 'Automotive Digital Cockpit & Infotainment UI Design', cat: 'dashboard-design', price: 290000, days: 12, status: 'published', feat: false, rating: 5.00, orders: 12 },
      { t: 'EdTech LMS Student Portal & Online Classroom UI', cat: 'ui-ux-design', price: 115000, days: 5, status: 'published', feat: false, rating: 4.91, orders: 27 },
      { t: 'Micro-Interactions & Lottie Animation Design Suite', cat: 'prototyping-service', price: 55000, days: 3, status: 'published', feat: false, rating: 4.91, orders: 34 },
      { t: 'SaaS Pricing & Checkout Funnel Redesign', cat: 'landing-page-design', price: 68000, days: 3, status: 'published', feat: false, rating: 4.97, orders: 41 },
      { t: 'Design Sprint for Rapid 5-Day MVP Validation', cat: 'wireframing-service', price: 115000, days: 5, status: 'published', feat: false, rating: 4.94, orders: 20 },
      { t: 'Global Corporate Rebranding Strategy & Style Guide', cat: 'branding-identity', price: 180000, days: 8, status: 'published', feat: false, rating: 4.96, orders: 15 },
      { t: 'Music Streaming & Audio Player Mobile App Design', cat: 'mobile-app-design', price: 125000, days: 5, status: 'published', feat: false, rating: 4.89, orders: 17 },
      { t: 'Corporate Sustainability Annual Report Presentation', cat: 'presentation-design-service', price: 62000, days: 3, status: 'published', feat: false, rating: 4.93, orders: 22 },
      { t: 'Multi-Currency International Checkout Interface', cat: 'ecommerce-design-service', price: 85000, days: 4, status: 'published', feat: false, rating: 4.92, orders: 25 },
      { t: 'Custom 3D Icon Set & Visual Asset Production', cat: '3d-design-service', price: 85000, days: 4, status: 'published', feat: false, rating: 4.89, orders: 28 },
      { t: 'AI Assistant & Conversational Bot Interface Design', cat: 'dashboard-design', price: 125000, days: 5, status: 'published', feat: false, rating: 4.96, orders: 35 },
      { t: 'Multi-Tenant Cloud Admin Panel & IAM Workflow', cat: 'dashboard-design', price: 175000, days: 7, status: 'published', feat: false, rating: 4.97, orders: 23 },
      { t: 'Full Product Discovery Sprint & Wireframing Package', cat: 'wireframing-service', price: 98000, days: 4, status: 'published', feat: false, rating: 4.93, orders: 29 },
      { t: 'Social Media Brand System & Content Template Suite', cat: 'graphic-design-service', price: 45000, days: 2, status: 'published', feat: false, rating: 4.87, orders: 46 },
      { t: 'Photorealistic 3D Device & Packaging Mockup Renders', cat: '3d-design-service', price: 60000, days: 3, status: 'published', feat: false, rating: 4.90, orders: 30 },
      { t: 'Creative Director Advisory & Design Team Mentorship', cat: 'design-consultation', price: 80000, days: 2, status: 'published', feat: false, rating: 4.99, orders: 21 },

      // Pending Approval services (Queue)
      { t: 'AI Code Assistant Dashboard & Extension Interface', cat: 'dashboard-design', price: 135000, days: 5, status: 'pending_approval', feat: false, rating: 5.0, orders: 0 },
      { t: 'Quantum Computing Cloud Resource Manager UI', cat: 'web-application-design', price: 220000, days: 9, status: 'pending_approval', feat: false, rating: 5.0, orders: 0 },
      { t: 'B2B Freight Logistics Fleet Tracking Mobile App', cat: 'mobile-app-design', price: 165000, days: 7, status: 'pending_approval', feat: false, rating: 5.0, orders: 0 },
      { t: 'Luxury Watch Auction & Bidding Web Experience', cat: 'ecommerce-design-service', price: 140000, days: 6, status: 'pending_approval', feat: false, rating: 5.0, orders: 0 },
      { t: 'Minimalist Editorial Typographic Poster Series', cat: 'graphic-design-service', price: 35000, days: 2, status: 'pending_approval', feat: false, rating: 5.0, orders: 0 },
      { t: 'BioTech Genomics Data Visualization Interface', cat: 'dashboard-design', price: 240000, days: 10, status: 'pending_approval', feat: false, rating: 5.0, orders: 0 },

      // Approved services (Ready to publish)
      { t: 'Modern LegalTech Contract Automation Portal', cat: 'web-application-design', price: 155000, days: 6, status: 'approved', feat: false, rating: 5.0, orders: 0 },
      { t: 'Smart Energy Grid Home Monitoring Tablet UI', cat: 'dashboard-design', price: 145000, days: 5, status: 'approved', feat: false, rating: 5.0, orders: 0 },
      { t: 'Architectural Portfolio & Interactive 3D Showcase', cat: 'website-design', price: 110000, days: 5, status: 'approved', feat: false, rating: 5.0, orders: 0 },
      { t: 'Nonprofit Donation & Impact Storytelling Lander', cat: 'landing-page-design', price: 58000, days: 3, status: 'approved', feat: false, rating: 5.0, orders: 0 },

      // Changes Requested services
      { t: 'Cryptocurrency Staking & Yield Farming App', cat: 'mobile-app-design', price: 170000, days: 7, status: 'changes_requested', feat: false, rating: 5.0, orders: 0, notes: 'Please provide clearer deliverables regarding Web3 smart contract connection states.' },
      { t: 'Enterprise Cloud Billing & Invoicing Console', cat: 'dashboard-design', price: 160000, days: 6, status: 'changes_requested', feat: false, rating: 5.0, orders: 0, notes: 'The portfolio previews lack contrast compliance on table elements.' },
      { t: 'Personal Branding Site for Executive Founders', cat: 'website-design', price: 85000, days: 4, status: 'changes_requested', feat: false, rating: 5.0, orders: 0, notes: 'Please expand on the mobile breakpoint delivery specifications.' },

      // Draft services
      { t: 'AR Glasses Navigation HUD & Spatial Interface', cat: 'ui-ux-design', price: 280000, days: 10, status: 'draft', feat: false, rating: 5.0, orders: 0 },
      { t: 'Personalized Nutrition & Meal Prep Mobile App', cat: 'mobile-app-design', price: 125000, days: 5, status: 'draft', feat: false, rating: 5.0, orders: 0 },
      { t: 'Vintage Apparel Marketplace Web Experience', cat: 'ecommerce-design-service', price: 95000, days: 4, status: 'draft', feat: false, rating: 5.0, orders: 0 },
      { t: 'Executive Keynote Speech Deck for Series C', cat: 'presentation-design-service', price: 65000, days: 3, status: 'draft', feat: false, rating: 5.0, orders: 0 },
      { t: 'Cyberpunk 3D Character Avatar System', cat: '3d-design-service', price: 120000, days: 6, status: 'draft', feat: false, rating: 5.0, orders: 0 },
      { t: 'Smart Thermostat & Ambient Home Control UI', cat: 'ui-ux-design', price: 135000, days: 5, status: 'draft', feat: false, rating: 5.0, orders: 0 },
      { t: 'Veterinary Clinic Booking & Pet Health Records', cat: 'mobile-app-design', price: 110000, days: 5, status: 'draft', feat: false, rating: 5.0, orders: 0 },
      { t: 'B2B Industrial Machinery Catalog Site', cat: 'website-design', price: 130000, days: 6, status: 'draft', feat: false, rating: 5.0, orders: 0 },

      // Rejected services
      { t: 'Scraped Crypto Signals Discord Bot Landing', cat: 'landing-page-design', price: 30000, days: 1, status: 'rejected', feat: false, rating: 5.0, orders: 0, rej: 'Violates Desigot terms regarding unauthorized external signal bots and unverified financial guarantees.' },
      { t: 'Low-Resolution Stock Icon Pack Reselling Service', cat: 'graphic-design-service', price: 15000, days: 1, status: 'rejected', feat: false, rating: 5.0, orders: 0, rej: 'Deliverables failed automated copyright originality check. Reselling public domain assets is prohibited.' },
      { t: 'Unverified Gambling & Casino Mobile UI Concept', cat: 'mobile-app-design', price: 80000, days: 3, status: 'rejected', feat: false, rating: 5.0, orders: 0, rej: 'Online gambling designs require enterprise operator licensing verification prior to publication.' },

      // Suspended services
      { t: 'Quick Turnaround Turnkey E-Commerce Clone', cat: 'ecommerce-design-service', price: 45000, days: 2, status: 'suspended', feat: false, rating: 3.8, orders: 12, susp: 'Multiple customer reports received regarding plagiarized template files delivered without valid licensing.' },
      { t: 'Automated AI Logo Generator Output Service', cat: 'logo-design', price: 25000, days: 1, status: 'suspended', feat: false, rating: 3.5, orders: 8, susp: 'Seller advertised custom handcrafted typography but delivered generic AI prompt dumps without vector source files.' },
      { t: 'Rapid Copycat Landing Page Design', cat: 'landing-page-design', price: 40000, days: 2, status: 'suspended', feat: false, rating: 4.0, orders: 10, susp: 'Direct copyright takedown notice filed by original trademark holder.' },

      // Archived services
      { t: 'Legacy Flash to HTML5 Component Migration UI', cat: 'web-application-design', price: 75000, days: 4, status: 'archived', feat: false, rating: 4.8, orders: 15 },
      { t: 'Windows Phone 8 Metro UI Concept Suite', cat: 'mobile-app-design', price: 50000, days: 3, status: 'archived', feat: false, rating: 4.7, orders: 8 },
    ];

    const seededServices = [];
    let priorityCounter = 100;

    for (let i = 0; i < serviceTemplates.length; i++) {
      const tmpl = serviceTemplates[i];
      const seller = sellers[i % sellers.length];
      const catId = categoryMap.get(tmpl.cat) || categoryMap.get('ui-ux-design');
      const slug = `${tmpl.t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`;
      const revCents = tmpl.orders * tmpl.price;
      const isFeat = tmpl.feat || false;
      const priority = isFeat ? priorityCounter-- : 0;
      const featUntil = isFeat ? new Date(Date.now() + 86400000 * 30) : null;
      const publishedAt = (tmpl.status === 'published') ? new Date(Date.now() - 86400000 * (60 - (i % 50))) : null;
      const approvedAt = (tmpl.status === 'published' || tmpl.status === 'approved') ? new Date(Date.now() - 86400000 * 65) : null;

      // 1. Insert into services
      const sRes = await client.query(
        `INSERT INTO services (
           seller_id, category_id, title, slug, short_description, description,
           target_audience, language, status, is_featured, featured_priority, featured_until,
           starting_price_cents, currency, delivery_time_days, revision_limit,
           what_is_included, what_is_not_included, deliverables, customer_requirements,
           design_process, faqs, seo_title, seo_description, seo_keywords,
           rejection_reason, suspension_reason, moderator_notes,
           total_orders, total_revenue_cents, avg_rating, review_count, view_count, inquiry_count,
           approved_at, published_at, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'USD', $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           status = EXCLUDED.status,
           is_featured = EXCLUDED.is_featured,
           total_orders = EXCLUDED.total_orders,
           total_revenue_cents = EXCLUDED.total_revenue_cents
         RETURNING id, title, slug, starting_price_cents, seller_id, category_id, status`,
        [
          seller.id, catId, tmpl.t, slug,
          `${tmpl.t} - Professional enterprise-grade custom design service delivered by verified marketplace experts.`,
          `${tmpl.t} offers comprehensive bespoke UI/UX architecture tailored specifically for your target audience. We combine deep user research, modular component tokens, interactive state prototypes, and detailed design specs for developer hand-off. Every project includes structured milestone reviews and source Figma files.`,
          'Startups, scale-ups, and modern product teams', 'English', tmpl.status, isFeat, priority, featUntil,
          tmpl.price, tmpl.days, 3,
          ['Full Interactive Figma File', 'Modular Design Tokens', 'Clickable Flow Prototype', 'Developer Hand-off Documentation', 'Commercial Usage License'],
          ['Frontend Coding (HTML/CSS)', 'Custom Backend Integration', 'Trademark Registration Filing'],
          ['.fig source file', 'Design System tokens file', 'Interactive prototype shareable URL', 'Asset exports (.svg, .png)'],
          'Please share your existing brand assets, target user persona summary, and any competitor references.',
          JSON.stringify([
            { step: 1, name: 'Discovery & Briefing', desc: 'Understanding your problem statement, business goals, and audience.' },
            { step: 2, name: 'Wireframing & IA', desc: 'Iterating through low-fidelity user journeys and screen layouts.' },
            { step: 3, name: 'Visual Design & System', desc: 'Applying typography, colors, component tokens, and high-fidelity screens.' },
            { step: 4, name: 'Prototyping & Review', desc: 'Building micro-interactions and conducting feedback revisions.' },
            { step: 5, name: 'Final Hand-off', desc: 'Packaging Figma files, tokens, and developer specs.' },
          ]),
          JSON.stringify([
            { q: 'What design tools do you use?', a: 'All projects are crafted in modern Figma utilizing auto-layout 5.0 and component properties.' },
            { q: 'How do revisions work?', a: 'Each package includes dedicated revision cycles after wireframes and final mockups.' },
            { q: 'Do I get the source files?', a: 'Yes, full commercial ownership and editable .fig source files are included in all packages.' }
          ]),
          `${tmpl.t} | Desigot Marketplace`,
          `Hire top-rated designers for ${tmpl.t} on Desigot. Verified professionals, guaranteed delivery, and secure escrow.`,
          ['ui-ux', 'design-service', tmpl.cat, 'figma'],
          tmpl.rej || null, tmpl.susp || null, tmpl.notes || null,
          tmpl.orders, revCents, tmpl.rating, Math.floor(tmpl.orders * 0.8), tmpl.orders * 25 + 110, Math.floor(tmpl.orders * 1.5),
          approvedAt, publishedAt
        ]
      );
      const service = sRes.rows[0];
      seededServices.push(service);

      // 2. Sync to listings table (so public marketplace and existing orders stay 100% unified!)
      const listingStatus = tmpl.status === 'published' ? 'approved' : tmpl.status === 'approved' ? 'approved' : tmpl.status === 'pending_approval' ? 'pending_review' : 'draft';
      const listingRes = await client.query(
        `INSERT INTO listings (
           seller_id, category_id, title, slug, description, listing_type, status,
           price_personal, price_commercial, price_extended, currency,
           total_sales, total_revenue_cents, avg_rating, review_count, view_count,
           is_featured, tags, software_compat, file_formats, created_at, published_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, 'service', $6, $7, $8, $9, 'USD', $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), $19, NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           status = EXCLUDED.status,
           is_featured = EXCLUDED.is_featured,
           total_sales = EXCLUDED.total_sales,
           total_revenue_cents = EXCLUDED.total_revenue_cents
         RETURNING id`,
        [
          seller.id, catId, tmpl.t, slug,
          `${tmpl.t} - Professional custom design service.`,
          listingStatus,
          tmpl.price, Math.round(tmpl.price * 1.5), Math.round(tmpl.price * 2.5),
          tmpl.orders, revCents, tmpl.rating, Math.floor(tmpl.orders * 0.8), tmpl.orders * 25 + 110,
          isFeat, ['Figma', 'UI/UX', tmpl.cat], ['Figma', 'Miro'], ['Deliverables: .fig, Prototype'], publishedAt
        ]
      );
      await client.query(`UPDATE services SET listing_id = $1 WHERE id = $2`, [listingRes.rows[0].id, service.id]);

      // 3. Service Media
      await client.query(
        `INSERT INTO service_media (service_id, media_type, file_url, thumbnail_url, caption, display_order, is_primary)
         VALUES
           ($1, 'thumbnail', $2, $2, 'Primary Service Cover', 0, TRUE),
           ($1, 'gallery_image', $3, $3, 'Figma Auto-Layout Screen Showcase', 1, FALSE),
           ($1, 'gallery_image', $4, $4, 'Design System & Component Library', 2, FALSE)`,
        [
          service.id,
          `https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80`,
          `https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80`,
          `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80`
        ]
      );

      // 4. Service Packages (Basic, Standard, Premium) (Part 28.F)
      const base = tmpl.price;
      const packagesData = [
        { type: 'basic', name: 'Starter Kit', desc: 'Essential 1-3 screens, wireframes, and responsive layout.', price: base, days: tmpl.days, rev: 2, f: ['1-3 Key Screens', 'Responsive Mobile Breakpoint', 'Figma Source File', 'Basic Auto-layout', '48h Support'] },
        { type: 'standard', name: 'Growth Package', desc: 'Complete 6-10 screens, interactive clickable prototype, and tokens.', price: Math.round(base * 1.6), days: tmpl.days + 2, rev: 3, f: ['6-10 Screens', 'Responsive Breakpoints (Desktop + Mobile)', 'Clickable Figma Prototype', 'Component Library & Tokens', 'Design System Specs', 'Priority Revisions'] },
        { type: 'premium', name: 'Enterprise Overhaul', desc: 'Up to 20 screens, full design system, UX audit, and developer handoff.', price: Math.round(base * 2.8), days: tmpl.days + 5, rev: 5, f: ['Up to 20 Screens', 'Full Design System Architecture', 'Micro-Interactions & Lottie', 'UX Heuristic Audit Report', 'Zeroheight / Notion Documentation', '1-on-1 Video Walkthrough', '30-day Post-Delivery Support'] }
      ];

      for (let pIdx = 0; pIdx < packagesData.length; pIdx++) {
        const pkg = packagesData[pIdx];
        const pkgRes = await client.query(
          `INSERT INTO service_packages (service_id, package_type, name, description, price_cents, delivery_days, revisions, express_delivery_days, express_price_cents, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [service.id, pkg.type, pkg.name, pkg.desc, pkg.price, pkg.days, pkg.rev, Math.max(1, pkg.days - 2), Math.round(pkg.price * 0.3), pIdx]
        );
        const pkgId = pkgRes.rows[0].id;

        for (let fIdx = 0; fIdx < pkg.f.length; fIdx++) {
          await client.query(
            `INSERT INTO service_package_features (package_id, feature_name, is_included, display_order)
             VALUES ($1, $2, TRUE, $3)`,
            [pkgId, pkg.f[fIdx], fIdx]
          );
        }
      }

      // 5. Service Add-ons (Part 28.G)
      await client.query(
        `INSERT INTO service_addons (service_id, name, description, price_cents, delivery_days_added)
         VALUES
           ($1, 'Express 24-48h Delivery', 'Priority sprint execution with dedicated senior designer allocation.', $2, 0),
           ($1, 'Additional Screen / Page', 'One fully designed custom screen matching the existing design system.', $3, 1),
           ($1, 'Extra Revision Cycle', 'One additional comprehensive review and modification sprint.', $4, 1),
           ($1, 'Developer Video Handoff Walkthrough', 'Loom video detailing spacing tokens, component properties, and layout constraints.', $5, 0)`,
        [
          service.id,
          Math.round(base * 0.35),
          Math.round(base * 0.20),
          Math.round(base * 0.15),
          15000
        ]
      );

      // 6. Tag Assignments
      const chosenTags = [tagIds[i % tagIds.length], tagIds[(i + 3) % tagIds.length], tagIds[(i + 7) % tagIds.length]];
      for (const tId of chosenTags) {
        await client.query(
          `INSERT INTO service_tag_assignments (service_id, tag_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [service.id, tId]
        );
        await client.query(`UPDATE service_tags SET usage_count = usage_count + 1 WHERE id = $1`, [tId]);
      }

      // 7. Featured Campaign if isFeat (Part 28.H)
      if (isFeat) {
        await client.query(
          `INSERT INTO service_featured_listings (service_id, priority, start_date, end_date, placement, is_active, impressions_count, clicks_count, orders_count, revenue_cents)
           VALUES ($1, $2, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'homepage_hero', TRUE, $3, $4, $5, $6)`,
          [service.id, priority, tmpl.orders * 80 + 350, tmpl.orders * 15 + 85, tmpl.orders, revCents]
        );
      }
    }
    console.log(`  ✓ ${seededServices.length} Services with Packages, Media, Add-ons, and Tags seeded.`);

    // =========================================================================
    // 6. SEED SELLER AVAILABILITY SCHEDULES (Part 28.K)
    // =========================================================================
    console.log('📅 Seeding Seller Availability Schedules...');
    for (const s of sellers) {
      await client.query(
        `INSERT INTO service_availability (seller_id, timezone, weekly_schedule, vacation_mode, max_active_orders, booking_notice_days, max_advance_days, expected_response_hours)
         VALUES ($1, 'America/New_York', '{"mon": {"active": true, "start": "09:00", "end": "18:00"}, "tue": {"active": true, "start": "09:00", "end": "18:00"}, "wed": {"active": true, "start": "09:00", "end": "18:00"}, "thu": {"active": true, "start": "09:00", "end": "18:00"}, "fri": {"active": true, "start": "09:00", "end": "17:00"}, "sat": {"active": false}, "sun": {"active": false}}', FALSE, 6, 2, 60, 4)
         ON CONFLICT (seller_id) DO NOTHING`,
        [s.id]
      );
    }
    console.log(`  ✓ Seller availability schedules configured.`);

    // =========================================================================
    // 7. SEED SERVICE REPORTS (Part 28.I)
    // =========================================================================
    console.log('🚨 Seeding 10 Service Moderation Reports...');
    const reportReasons = [
      { r: 'copyright_infringement', d: 'The seller uses screenshots of our proprietary mobile app inside their showcase gallery without attribution.' },
      { r: 'misleading_description', d: 'Listing promises full mobile React Native source code in the description, but only delivered basic Figma mockups.' },
      { r: 'inappropriate_content', d: 'Gallery banner contains unverified commercial brand trademarks in promotional badges.' },
      { r: 'seller_misconduct', d: 'The seller requested communication outside the platform on Telegram to avoid platform commissions.' },
      { r: 'fraudulent_listing', d: 'This service was copied directly from an existing top-rated studio on Desigot.' },
    ];

    const customerRes = await client.query(`SELECT id FROM users WHERE role = 'buyer' LIMIT 10`);
    const customers = customerRes.rows;

    for (let i = 0; i < 10; i++) {
      const rep = reportReasons[i % reportReasons.length];
      const targetService = seededServices[(i * 3) % seededServices.length];
      const reporter = customers[i % customers.length];
      const status = i < 3 ? 'new' : i < 6 ? 'under_review' : i < 8 ? 'resolved' : 'dismissed';

      await client.query(
        `INSERT INTO service_reports (service_id, reporter_id, seller_id, reason, description, status, resolution_notes, resolved_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          targetService.id,
          reporter ? reporter.id : targetService.seller_id,
          targetService.seller_id,
          rep.r,
          rep.d,
          status,
          (status === 'resolved' ? 'Moderator verified claim. Seller removed infringing screenshot and updated package deliverables.' : status === 'dismissed' ? 'Report reviewed by Trust & Safety. No policy violation identified.' : null),
          (status === 'resolved' || status === 'dismissed' ? new Date() : null)
        ]
      );
    }
    console.log(`  ✓ 10 Service Reports seeded.`);

    // =========================================================================
    // 8. SEED 15 CUSTOM SERVICE REQUESTS & QUOTES (Part 28.J)
    // =========================================================================
    console.log('📋 Seeding 15 Custom Service Requests and Quotes...');
    const customBriefs = [
      { t: 'Fintech Mobile Banking App with Biometric Auth Flow', cat: 'mobile-app-design', min: 150000, max: 250000, st: 'quote_submitted' },
      { t: 'Multi-Tenant SaaS CRM Admin Console & Tokenized System', cat: 'dashboard-design', min: 200000, max: 350000, st: 'accepted' },
      { t: 'Medical Telehealth Video Consultation iPad Tablet UI', cat: 'ui-ux-design', min: 120000, max: 180000, st: 'matched' },
      { t: 'Series A Pitch Deck & Interactive Clickable Prototype', cat: 'presentation-design-service', min: 80000, max: 120000, st: 'under_review' },
      { t: 'E-commerce Luxury Watch Storefront Redesign (Next.js)', cat: 'ecommerce-design-service', min: 140000, max: 220000, st: 'new' },
      { t: 'Web3 Crypto Wallet Extension & iOS Mobile App', cat: 'mobile-app-design', min: 180000, max: 300000, st: 'quote_submitted' },
      { t: 'Enterprise Cloud Security Incident Response Console', cat: 'dashboard-design', min: 220000, max: 380000, st: 'new' },
      { t: 'Online Course & LMS Video Academy Student Experience', cat: 'ui-ux-design', min: 100000, max: 160000, st: 'matched' },
      { t: 'Fleet Logistics Vehicle GPS Tracking Dashboard', cat: 'dashboard-design', min: 160000, max: 240000, st: 'under_review' },
      { t: 'Global Rebranding & Vector Identity System for AI Startup', cat: 'branding-identity', min: 150000, max: 250000, st: 'accepted' },
      { t: 'On-Demand Restaurant Table Booking & Menu App', cat: 'mobile-app-design', min: 110000, max: 170000, st: 'quote_submitted' },
      { t: 'B2B Wholesale Procurement Portal with Dynamic Pricing', cat: 'web-application-design', min: 190000, max: 300000, st: 'new' },
      { t: 'Modern Minimalist Typography Family & Specimen Site', cat: 'graphic-design-service', min: 90000, max: 140000, st: 'new' },
      { t: 'Real Estate Virtual Tour & Agent Schedule Interface', cat: 'website-design', min: 130000, max: 200000, st: 'under_review' },
      { t: 'Dark Mode Accessibility Audit & Color System Tokens', cat: 'design-systems-service', min: 70000, max: 110000, st: 'matched' },
    ];

    for (let i = 0; i < customBriefs.length; i++) {
      const b = customBriefs[i];
      const buyer = customers[i % customers.length];
      const catId = categoryMap.get(b.cat) || categoryMap.get('ui-ux-design');
      const assignedSeller = sellers[i % sellers.length];

      const rRes = await client.query(
        `INSERT INTO service_custom_requests (customer_id, category_id, preferred_seller_id, title, description, budget_min_cents, budget_max_cents, expected_delivery_date, status, assigned_seller_id, required_skills)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '14 days', $8, $9, $10)
         RETURNING id`,
        [
          buyer ? buyer.id : assignedSeller.id,
          catId,
          assignedSeller.id,
          b.t,
          `Looking for a vetted top-tier agency or senior UI/UX designer for ${b.t}. We have completed preliminary discovery and need interactive Figma prototypes, design tokens, and developer hand-off.`,
          b.min, b.max, b.st,
          (b.st !== 'new' && b.st !== 'under_review' ? assignedSeller.id : null),
          ['Figma', 'UI/UX', 'Mobile App', 'Design System']
        ]
      );
      const reqId = rRes.rows[0].id;

      // If quotes submitted or accepted, add quotation
      if (b.st === 'quote_submitted' || b.st === 'accepted') {
        await client.query(
          `INSERT INTO service_quotes (request_id, seller_id, price_cents, delivery_days, deliverables, revisions, terms, expires_at, status)
           VALUES ($1, $2, $3, 10, $4, 3, '50% upfront via Desigot escrow, 50% upon final Figma approval and developer handoff.', NOW() + INTERVAL '7 days', $5)`,
          [
            reqId,
            assignedSeller.id,
            b.min + 20000,
            ['Complete High-Fidelity UI Screens', 'Interactive Clickable Prototype', 'Figma Tokens & Design System', 'Developer Video Walkthrough'],
            b.st === 'accepted' ? 'accepted' : 'pending'
          ]
        );
      }
    }
    console.log(`  ✓ 15 Custom Service Requests & Quotations seeded.`);

    // =========================================================================
    // 9. SEED 100+ SERVICE MODERATION & ACTIVITY HISTORY RECORDS (Part 28.M)
    // =========================================================================
    console.log('📜 Seeding 100+ Service Moderation History Records...');
    const adminUserRes = await client.query(`SELECT id FROM users WHERE role = 'superadmin' OR role = 'admin' LIMIT 1`);
    const moderatorId = adminUserRes.rows[0]?.id;

    for (let i = 0; i < 110; i++) {
      const s = seededServices[i % seededServices.length];
      const actions = ['approved', 'published', 'changes_requested', 'rejected', 'suspended', 'restored'];
      const action = actions[i % actions.length];

      await client.query(
        `INSERT INTO service_moderation_history (service_id, moderator_id, action, reason, internal_notes, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - (INTERVAL '1 day' * (RANDOM() * 75)))`,
        [
          s.id,
          moderatorId,
          action,
          `Automated compliance and quality inspection: status changed to ${action}.`,
          'Reviewed against Desigot quality guidelines v2.4.'
        ]
      );
    }
    console.log(`  ✓ 100+ Moderation History Records ready.`);

    // =========================================================================
    // 10. SEED SERVICE PRICING RULES (Part 28)
    // =========================================================================
    await client.query(
      `INSERT INTO service_pricing_rules (name, min_price_cents, max_price_cents, commission_rate, allow_hourly, allow_packages, allow_custom_quotes)
       VALUES ('Standard Marketplace Platform Rules', 2500, 10000000, 0.1500, TRUE, TRUE, TRUE)
       ON CONFLICT DO NOTHING`
    );

    await client.query('COMMIT');
    console.log('\n======================================================');
    console.log('🎉 DESIGOT SERVICE MANAGEMENT MODULE SEED COMPLETE!');
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Service Management Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedServices();
}

module.exports = seedServices;
