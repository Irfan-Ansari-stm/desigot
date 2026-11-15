'use strict';
require('dotenv').config();
const crypto = require('crypto');
const { Pool } = require('pg');
const config = require('../config');

const LICENSES = [
  {
    name: 'Personal License',
    slug: 'personal',
    description: 'Use in a single personal, non-commercial end product which end users are not charged for.',
    terms_summary: '1 personal project, no commercial distribution, personal portfolio allowed.',
    allowed_uses: ['Personal projects', 'Design exploration', 'Non-commercial portfolio showcase'],
    prohibited_uses: ['Client deliverables', 'Commercial products', 'Reselling or sublicensing'],
    max_end_products: 1,
    can_resell: false,
    can_modify: true,
    is_default: true,
    price_multiplier: 1.0,
    sort_order: 1,
  },
  {
    name: 'Commercial License',
    slug: 'commercial',
    description: 'Use in a single commercial project or client deliverable which end users may be charged for.',
    terms_summary: '1 commercial product or client work, up to 10,000 end users.',
    allowed_uses: ['Client projects', 'Commercial websites & mobile apps', 'Internal business tools'],
    prohibited_uses: ['On-demand print merchandise', 'Open source redistribution', 'Template resale'],
    max_end_products: 1,
    can_resell: false,
    can_modify: true,
    is_default: false,
    price_multiplier: 2.5,
    sort_order: 2,
  },
  {
    name: 'Extended Commercial',
    slug: 'extended',
    description: 'Use in unlimited commercial end products, SaaS applications, and broadcast media with unlimited users.',
    terms_summary: 'Unlimited commercial products, broadcast, SaaS applications, up to 10 team seats.',
    allowed_uses: ['SaaS platforms', 'Unlimited client sites', 'Broadcast & advertising', 'Multi-tenant apps'],
    prohibited_uses: ['Direct file reselling as standalone assets', 'Free open public distribution'],
    max_end_products: 999,
    can_resell: false,
    can_modify: true,
    is_default: false,
    price_multiplier: 5.0,
    sort_order: 3,
  },
  {
    name: 'Enterprise Unlimited',
    slug: 'enterprise',
    description: 'Full organizational license. Unlimited seats, sublicensing rights, indemnity, and source code ownership.',
    terms_summary: 'Full corporate coverage, unlimited developers and designers, SLA support.',
    allowed_uses: ['Enterprise suites', 'White-labeling', 'Internal component library', 'Unlimited employees'],
    prohibited_uses: ['Public domain release'],
    max_end_products: 9999,
    can_resell: true,
    can_modify: true,
    is_default: false,
    price_multiplier: 12.0,
    sort_order: 4,
  },
  {
    name: 'Free Community License',
    slug: 'free',
    description: 'Free for personal use with attribution to the author.',
    terms_summary: 'Personal and open-source projects only. Attribution required.',
    allowed_uses: ['Personal projects', 'Open-source GitHub repositories', 'Student coursework'],
    prohibited_uses: ['Monetized client deliverables', 'Direct re-upload to other stock sites'],
    max_end_products: 1,
    can_resell: false,
    can_modify: true,
    is_default: false,
    price_multiplier: 0.0,
    sort_order: 5,
  },
];

const SAMPLE_PRODUCTS = [
  {
    title: 'Nexus Enterprise UI & Design System',
    slug: 'nexus-enterprise-ui-design-system',
    short_description: 'Comprehensive enterprise design system featuring 1,200+ Figma components and auto-layout.',
    description: 'Nexus Enterprise is a production-tested design system architected for complex web dashboards, SaaS platforms, and enterprise data visualization. Includes auto-layout 5.0, dark mode tokens, WCAG 2.1 AAA color contrast, and synchronized React code snippets.',
    version: '2.4.0',
    status: 'published',
    price_personal_cents: 4900,
    price_commercial_cents: 12900,
    price_extended_cents: 34900,
    price_enterprise_cents: 89900,
    is_featured: true,
    featured_position: 1,
    file_formats: ['.fig', '.json', '.tokens', '.zip'],
    software_compatibility: ['Figma', 'Framer', 'Tokens Studio', 'React'],
    tags: ['design-system', 'enterprise', 'figma', 'ui-kit', 'dark-mode'],
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    preview_images: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
    ],
    demo_url: 'https://figma.com/@nexus-enterprise',
    documentation_url: 'https://docs.nexus-system.dev',
    included_assets: ['1,200+ Components', '45 Page Templates', 'Variable Tokens File', 'Icon Library SVG'],
    total_sales: 342,
    total_revenue_cents: 4411800,
    total_downloads: 875,
    view_count: 9410,
    avg_rating: 4.95,
    review_count: 58,
  },
  {
    title: 'Fintech Pro Mobile & Web UI Kit',
    slug: 'fintech-pro-mobile-web-ui-kit',
    short_description: 'Modern banking, crypto wallet, and wealth management app UI kit with 80+ screens.',
    description: 'Designed specifically for next-generation financial institutions, neobanks, and DeFi protocols. Includes biometric authentication flows, card management, transactional history, portfolio graphs, and dark mode.',
    version: '1.8.0',
    status: 'published',
    price_personal_cents: 3900,
    price_commercial_cents: 9900,
    price_extended_cents: 27900,
    price_enterprise_cents: 69900,
    is_featured: true,
    featured_position: 2,
    file_formats: ['.fig', '.xd', '.sketch'],
    software_compatibility: ['Figma', 'Adobe XD', 'Sketch'],
    tags: ['fintech', 'banking', 'crypto', 'mobile-ui', 'ios'],
    thumbnail_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
    preview_images: [
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80',
    ],
    demo_url: 'https://fintech-preview.desigot.com',
    documentation_url: 'https://fintech-docs.desigot.com',
    included_assets: ['84 Mobile Screens', '32 Web Dashboard Views', 'Interactive Micro-animations'],
    total_sales: 215,
    total_revenue_cents: 2128500,
    total_downloads: 540,
    view_count: 6720,
    avg_rating: 4.88,
    review_count: 34,
  },
  {
    title: 'Cyberpunk 3D Holographic Asset Pack',
    slug: 'cyberpunk-3d-holographic-asset-pack',
    short_description: '50+ high-fidelity futuristic 3D sci-fi holographic elements with Blender materials.',
    description: 'Ultra-detailed 3D cyberpunk interfaces, holographic projections, futuristic devices, and procedural sci-fi shaders. Formatted for Blender Cycles & Eevee, Cinema 4D, and glTF for WebGL.',
    version: '1.2.0',
    status: 'published',
    price_personal_cents: 2900,
    price_commercial_cents: 7900,
    price_extended_cents: 19900,
    price_enterprise_cents: 49900,
    is_featured: true,
    featured_position: 3,
    file_formats: ['.blend', '.c4d', '.fbx', '.obj', '.gltf'],
    software_compatibility: ['Blender', 'Cinema 4D', 'Unreal Engine', 'Three.js'],
    tags: ['3d-assets', 'cyberpunk', 'blender', 'sci-fi', 'hologram'],
    thumbnail_url: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=800&auto=format&fit=crop&q=80',
    preview_images: [
      'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=1200&auto=format&fit=crop&q=80',
    ],
    demo_url: 'https://threejs-cyber.desigot.com',
    documentation_url: 'https://cyberpack-guide.desigot.com',
    included_assets: ['52 3D Models', '18 Procedural Shaders', '4K Texture Maps'],
    total_sales: 180,
    total_revenue_cents: 1422000,
    total_downloads: 410,
    view_count: 5120,
    avg_rating: 4.92,
    review_count: 27,
  },
  {
    title: 'Bifrost SaaS Dashboard Template',
    slug: 'bifrost-saas-dashboard-template',
    short_description: 'Modular analytics and operational dashboard UI kit with 60+ modular widgets.',
    description: 'Clean, data-dense administration templates crafted for high-performance SaaS applications. Includes user management, telemetry metrics, audit log tables, billing charts, and notification centers.',
    version: '2.0.0',
    status: 'published',
    price_personal_cents: 3500,
    price_commercial_cents: 8900,
    price_extended_cents: 24900,
    price_enterprise_cents: 59900,
    is_featured: true,
    featured_position: 4,
    file_formats: ['.fig', '.svg', '.zip'],
    software_compatibility: ['Figma', 'Tailwind CSS', 'Next.js'],
    tags: ['saas', 'dashboard', 'analytics', 'tailwind', 'admin-ui'],
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80'],
    demo_url: 'https://bifrost.desigot.com',
    documentation_url: 'https://bifrost-docs.desigot.com',
    included_assets: ['64 Dashboard Views', '120 Modular Cards', 'Tailwind Config'],
    total_sales: 290,
    total_revenue_cents: 2581000,
    total_downloads: 680,
    view_count: 8300,
    avg_rating: 4.90,
    review_count: 42,
  },
  {
    title: 'Minimalist Wireframe & Flowchart Kit',
    slug: 'minimalist-wireframe-flowchart-kit',
    short_description: 'Accelerate UX research and discovery with 300+ responsive wireframing blocks.',
    description: 'Rapid prototyping wireframe kit designed to map user journeys, UX logic, and structural site architecture in minutes. Fully responsive with Figma auto-layout and customizable styling tokens.',
    version: '3.1.0',
    status: 'published',
    price_personal_cents: 2400,
    price_commercial_cents: 6900,
    price_extended_cents: 18900,
    price_enterprise_cents: 39900,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.fig', '.sketch', '.pdf'],
    software_compatibility: ['Figma', 'Sketch', 'Miro', 'FigJam'],
    tags: ['wireframe', 'ux', 'prototyping', 'flowchart', 'sitemap'],
    thumbnail_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&auto=format&fit=crop&q=80'],
    demo_url: null,
    documentation_url: null,
    included_assets: ['320 Wireframe Sections', '60 User Flow Nodes', 'Device Mockups'],
    total_sales: 410,
    total_revenue_cents: 2829000,
    total_downloads: 920,
    view_count: 11400,
    avg_rating: 4.85,
    review_count: 63,
  },
  {
    title: 'Aura Glassmorphism Icon Set (400+ Icons)',
    slug: 'aura-glassmorphism-icon-set',
    short_description: 'Translucent 3D glass icons rendered with raytracing and multi-layer refraction.',
    description: 'A stunning set of 400+ 3D glass icons built with photorealistic subsurface scattering and chromatic dispersion. Provided as high-resolution PNGs, SVGs, and editable Cinema 4D source files.',
    version: '1.0.0',
    status: 'published',
    price_personal_cents: 1900,
    price_commercial_cents: 4900,
    price_extended_cents: 14900,
    price_enterprise_cents: 29900,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.png', '.svg', '.c4d', '.blend'],
    software_compatibility: ['Figma', 'Photoshop', 'Blender', 'Cinema 4D'],
    tags: ['icons', 'glassmorphism', '3d-icons', 'translucent', 'raytraced'],
    thumbnail_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80'],
    demo_url: null,
    documentation_url: null,
    included_assets: ['420 Glass Icons', '3 Lighting Presets', 'Figma Plugin Ready'],
    total_sales: 154,
    total_revenue_cents: 754600,
    total_downloads: 360,
    view_count: 4890,
    avg_rating: 4.79,
    review_count: 19,
  },
  {
    title: 'Pulse Health & Fitness iOS UI Kit',
    slug: 'pulse-health-fitness-ios-ui-kit',
    short_description: 'Apple HealthKit compliant wellness application design kit with 90+ screens.',
    description: 'Workout tracking, calorie counting, sleep analytics, heart rate monitoring, and live community coaching. Built according to Apple iOS 17 Human Interface Guidelines with Dynamic Island widgets.',
    version: '1.5.0',
    status: 'published',
    price_personal_cents: 3900,
    price_commercial_cents: 9900,
    price_extended_cents: 26900,
    price_enterprise_cents: 64900,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.fig', '.sketch'],
    software_compatibility: ['Figma', 'Sketch', 'SwiftUI'],
    tags: ['health', 'fitness', 'ios', 'apple-health', 'mobile-app'],
    thumbnail_url: 'https://images.unsplash.com/photo-1510519138111-577d35043660?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1510519138111-577d35043660?w=1200&auto=format&fit=crop&q=80'],
    demo_url: 'https://pulse-preview.desigot.com',
    documentation_url: null,
    included_assets: ['92 iOS Screens', 'Widget Kit Designs', 'Dynamic Island States'],
    total_sales: 98,
    total_revenue_cents: 970200,
    total_downloads: 230,
    view_count: 3600,
    avg_rating: 4.86,
    review_count: 15,
  },
  // PENDING REVIEW PRODUCTS
  {
    title: 'E-Commerce Marketplace Mega Pack',
    slug: 'e-commerce-marketplace-mega-pack',
    short_description: 'Multi-vendor store UI kit with complete cart, checkout, tracking, and seller portals.',
    description: 'Extensive e-commerce solution with checkout flows, multi-currency display, product comparisons, coupon systems, and seller dashboards.',
    version: '1.0.0',
    status: 'pending_review',
    price_personal_cents: 4500,
    price_commercial_cents: 11900,
    price_extended_cents: 32900,
    price_enterprise_cents: 79900,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.fig', '.xd'],
    software_compatibility: ['Figma', 'Adobe XD', 'Shopify'],
    tags: ['ecommerce', 'marketplace', 'store', 'checkout', 'shopping'],
    thumbnail_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80'],
    demo_url: null,
    documentation_url: null,
    included_assets: ['110 UI Screens', 'Component Library', 'Design Tokens'],
    total_sales: 0,
    total_revenue_cents: 0,
    total_downloads: 0,
    view_count: 42,
    avg_rating: 5.00,
    review_count: 0,
  },
  {
    title: 'HyperDrive AI Chatbot & Agent UI Kit',
    slug: 'hyperdrive-ai-chatbot-agent-ui-kit',
    short_description: 'Conversational AI interfaces, prompt engineering studios, and LLM workspaces.',
    description: 'Designed for building modern generative AI apps, featuring streaming message bubbles, prompt branching, model temperature sliders, and tool execution cards.',
    version: '1.1.0',
    status: 'pending_review',
    price_personal_cents: 3200,
    price_commercial_cents: 8500,
    price_extended_cents: 22000,
    price_enterprise_cents: 54000,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.fig', '.json'],
    software_compatibility: ['Figma', 'Next.js', 'Tailwind CSS'],
    tags: ['ai', 'chatbot', 'llm', 'generative-ai', 'prompts'],
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&auto=format&fit=crop&q=80'],
    demo_url: null,
    documentation_url: null,
    included_assets: ['48 Chat Interfaces', 'Prompt Templates', 'Token Visualizers'],
    total_sales: 0,
    total_revenue_cents: 0,
    total_downloads: 0,
    view_count: 88,
    avg_rating: 5.00,
    review_count: 0,
  },
  {
    title: 'NeuroVibe Cybernetic Presentation Deck',
    slug: 'neurovibe-cybernetic-presentation-deck',
    short_description: '75 high-impact pitch deck slides for tech startups and deep-tech founders.',
    description: 'Crafted for VC pitches, technical demos, and board reports with modular data diagrams, market sizing circles, and tech roadmap layouts.',
    version: '1.0.0',
    status: 'pending_review',
    price_personal_cents: 2500,
    price_commercial_cents: 5900,
    price_extended_cents: 15900,
    price_enterprise_cents: 35000,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.fig', '.key', '.pptx'],
    software_compatibility: ['Figma', 'Keynote', 'PowerPoint'],
    tags: ['pitch-deck', 'presentation', 'slides', 'startup', 'keynote'],
    thumbnail_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80'],
    demo_url: null,
    documentation_url: null,
    included_assets: ['75 Unique Slides', 'Vector Charts', 'Slide Transitions Guide'],
    total_sales: 0,
    total_revenue_cents: 0,
    total_downloads: 0,
    view_count: 65,
    avg_rating: 5.00,
    review_count: 0,
  },
  // DRAFT PRODUCTS
  {
    title: 'NeoBrutalism Agency Portfolio Starter',
    slug: 'neobrutalism-agency-portfolio-starter',
    short_description: 'High-contrast neo-brutalist layouts, chunky typography, and quirky sticker assets.',
    description: 'Work in progress neo-brutalism design pack for creative agencies and independent digital designers.',
    version: '0.9.0',
    status: 'draft',
    price_personal_cents: 2200,
    price_commercial_cents: 5500,
    price_extended_cents: 14000,
    price_enterprise_cents: 30000,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.fig'],
    software_compatibility: ['Figma'],
    tags: ['neobrutalism', 'portfolio', 'agency', 'bold', 'typography'],
    thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80'],
    demo_url: null,
    documentation_url: null,
    included_assets: ['Draft Screens (24/50)', 'Sticker Pack'],
    total_sales: 0,
    total_revenue_cents: 0,
    total_downloads: 0,
    view_count: 12,
    avg_rating: 5.00,
    review_count: 0,
  },
  {
    title: 'Solaris Space Science Illustration Pack',
    slug: 'solaris-space-science-illustration-pack',
    short_description: '30 vector vector illustrations of planets, telescopes, satellites, and astronauts.',
    description: 'Vector space exploration graphics tailored for scientific publications, educational apps, and editorial articles.',
    version: '0.8.0',
    status: 'draft',
    price_personal_cents: 1800,
    price_commercial_cents: 4500,
    price_extended_cents: 11000,
    price_enterprise_cents: 25000,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.ai', '.svg', '.png'],
    software_compatibility: ['Illustrator', 'Figma'],
    tags: ['illustrations', 'space', 'astronomy', 'vector', 'editorial'],
    thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80'],
    demo_url: null,
    documentation_url: null,
    included_assets: ['18 Completed SVGs', 'Source AI files'],
    total_sales: 0,
    total_revenue_cents: 0,
    total_downloads: 0,
    view_count: 5,
    avg_rating: 5.00,
    review_count: 0,
  },
  // REJECTED PRODUCTS
  {
    title: 'Generic Clip Art & Icon Bundle',
    slug: 'generic-clip-art-icon-bundle',
    short_description: 'Mixed bag of basic icons and shapes without proper vector scaling.',
    description: 'Collection of basic geometric symbols and stock shapes.',
    version: '1.0.0',
    status: 'rejected',
    price_personal_cents: 1000,
    price_commercial_cents: 2500,
    price_extended_cents: 6000,
    price_enterprise_cents: 12000,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.png', '.jpg'],
    software_compatibility: ['Any'],
    tags: ['icons', 'clipart', 'basic'],
    thumbnail_url: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1542744094-24638eff58bb?w=1200&auto=format&fit=crop&q=80'],
    demo_url: null,
    documentation_url: null,
    included_assets: ['50 low-res icons'],
    total_sales: 0,
    total_revenue_cents: 0,
    total_downloads: 0,
    view_count: 24,
    avg_rating: 0,
    review_count: 0,
    rejection_reason: 'Quality standards not met. File assets must be scalable vector formats (.fig, .svg, or .ai) with organized layers and named components.',
    moderator_notes: 'Reviewed by Senior Curator Sarah Connor on 2026-11-10. Failed vector fidelity guidelines.',
  },
  {
    title: 'Unlicensed Brand Logos Vector Pack',
    slug: 'unlicensed-brand-logos-vector-pack',
    short_description: 'Trademarks and copyrighted brand emblems without authorization.',
    description: 'Collection of well-known global brand logos.',
    version: '1.0.0',
    status: 'rejected',
    price_personal_cents: 1500,
    price_commercial_cents: 3500,
    price_extended_cents: 8000,
    price_enterprise_cents: 18000,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.svg'],
    software_compatibility: ['Illustrator'],
    tags: ['logos', 'brands', 'emblems'],
    thumbnail_url: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1560472355-536de3962603?w=1200&auto=format&fit=crop&q=80'],
    demo_url: null,
    documentation_url: null,
    included_assets: ['100 Brand Logos'],
    total_sales: 0,
    total_revenue_cents: 0,
    total_downloads: 0,
    view_count: 31,
    avg_rating: 0,
    review_count: 0,
    rejection_reason: 'Copyright and Trademark Infringement Policy Violation. Third-party brand marks cannot be sold or distributed without proof of authorization.',
    moderator_notes: 'Flagged for IP policy violation by Legal Review on 2026-11-12.',
  },
  // SUSPENDED PRODUCTS
  {
    title: 'Vortex Crypto Staking UI Assets',
    slug: 'vortex-crypto-staking-ui-assets',
    short_description: 'Decentralized exchange and liquidity pool dashboard screens.',
    description: 'Crypto staking and yield farming dashboard kit.',
    version: '1.0.0',
    status: 'suspended',
    price_personal_cents: 4000,
    price_commercial_cents: 10000,
    price_extended_cents: 25000,
    price_enterprise_cents: 60000,
    is_featured: false,
    featured_position: 0,
    file_formats: ['.fig'],
    software_compatibility: ['Figma'],
    tags: ['crypto', 'web3', 'defi', 'staking'],
    thumbnail_url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop&q=80',
    preview_images: ['https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=1200&auto=format&fit=crop&q=80'],
    demo_url: null,
    documentation_url: null,
    included_assets: ['30 Screens'],
    total_sales: 12,
    total_revenue_cents: 120000,
    total_downloads: 28,
    view_count: 1400,
    avg_rating: 4.20,
    review_count: 4,
    rejection_reason: 'Temporarily suspended due to reported asset bundle corruption and licensing dispute from co-author.',
    moderator_notes: 'Suspended pending seller identity confirmation and clean file re-upload.',
  },
];

async function seedDigitalProducts() {
  const pool = new Pool({
    connectionString: config.db.primary,
    ssl: config.db.ssl,
  });

  const client = await pool.connect();

  try {
    console.log('🌱 Starting comprehensive Digital Products seed...');

    // 1. Seed Licenses
    console.log('📜 Seeding License templates...');
    const licenseIds = {};
    for (const lic of LICENSES) {
      const res = await client.query(
        `INSERT INTO digital_product_licenses 
         (name, slug, description, terms_summary, allowed_uses, prohibited_uses, max_end_products, can_resell, can_modify, is_default, price_multiplier, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (slug) DO UPDATE SET 
           name = EXCLUDED.name, 
           description = EXCLUDED.description, 
           terms_summary = EXCLUDED.terms_summary,
           allowed_uses = EXCLUDED.allowed_uses,
           prohibited_uses = EXCLUDED.prohibited_uses,
           price_multiplier = EXCLUDED.price_multiplier
         RETURNING id, slug`,
        [lic.name, lic.slug, lic.description, lic.terms_summary, lic.allowed_uses, lic.prohibited_uses, lic.max_end_products, lic.can_resell, lic.can_modify, lic.is_default, lic.price_multiplier, lic.sort_order]
      );
      licenseIds[lic.slug] = res.rows[0].id;
    }
    console.log(`✅ Seeded ${Object.keys(licenseIds).length} license templates.`);

    // 2. Fetch or fallback seller and buyer
    const sellerRes = await client.query(`SELECT id FROM users WHERE role = 'seller' OR role = 'admin' LIMIT 2`);
    const sellerId = sellerRes.rows[0]?.id || '33535558-ccea-4acc-9c09-9c725959a52d';
    const altSellerId = sellerRes.rows[1]?.id || sellerId;

    const buyerRes = await client.query(`SELECT id FROM users WHERE role = 'buyer' LIMIT 2`);
    const buyerId = buyerRes.rows[0]?.id || 'ce59f66d-1f80-4ca5-b92d-2bb337be2dcc';

    const catRes = await client.query(`SELECT id, slug FROM listing_categories LIMIT 10`);
    const categories = catRes.rows;

    const adminUser = '33535558-ccea-4acc-9c09-9c725959a52d'; // Super admin

    // 3. Seed Products
    console.log('📦 Seeding digital products, files, versions, and assignments...');
    const insertedProducts = [];

    for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
      const p = SAMPLE_PRODUCTS[i];
      const categoryId = categories[i % categories.length]?.id || null;
      const curSeller = i % 2 === 0 ? sellerId : altSellerId;

      const publishedAt = p.status === 'published' ? new Date(Date.now() - 30 * 86400000) : null;
      const approvedAt = ['published', 'featured'].includes(p.status) ? new Date(Date.now() - 32 * 86400000) : null;

      const prodRes = await client.query(
        `INSERT INTO digital_products
         (seller_id, category_id, title, slug, short_description, description, version, status,
          price_personal_cents, price_commercial_cents, price_extended_cents, price_enterprise_cents,
          currency, is_featured, featured_position, file_formats, software_compatibility, tags,
          thumbnail_url, preview_images, demo_url, documentation_url, included_assets,
          total_sales, total_revenue_cents, total_downloads, view_count, avg_rating, review_count,
          rejection_reason, moderator_notes, published_at, approved_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
         ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          short_description = EXCLUDED.short_description,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          price_personal_cents = EXCLUDED.price_personal_cents,
          price_commercial_cents = EXCLUDED.price_commercial_cents,
          price_extended_cents = EXCLUDED.price_extended_cents,
          price_enterprise_cents = EXCLUDED.price_enterprise_cents,
          is_featured = EXCLUDED.is_featured,
          featured_position = EXCLUDED.featured_position,
          total_sales = EXCLUDED.total_sales,
          total_revenue_cents = EXCLUDED.total_revenue_cents,
          total_downloads = EXCLUDED.total_downloads,
          view_count = EXCLUDED.view_count,
          avg_rating = EXCLUDED.avg_rating,
          review_count = EXCLUDED.review_count,
          rejection_reason = EXCLUDED.rejection_reason,
          moderator_notes = EXCLUDED.moderator_notes
         RETURNING id, title, slug, status, is_featured`,
        [
          curSeller, categoryId, p.title, p.slug, p.short_description, p.description, p.version, p.status,
          p.price_personal_cents, p.price_commercial_cents, p.price_extended_cents, p.price_enterprise_cents,
          'USD', p.is_featured, p.featured_position, p.file_formats, p.software_compatibility, p.tags,
          p.thumbnail_url, p.preview_images, p.demo_url, p.documentation_url, p.included_assets,
          p.total_sales, p.total_revenue_cents, p.total_downloads, p.view_count, p.avg_rating, p.review_count,
          p.rejection_reason || null, p.moderator_notes || null, publishedAt, approvedAt
        ]
      );

      const product = prodRes.rows[0];
      insertedProducts.push(product);

      // Clean existing sub-entities for this product to prevent duplicates
      await client.query(`DELETE FROM digital_product_files WHERE product_id = $1`, [product.id]);
      await client.query(`DELETE FROM digital_product_license_assignments WHERE product_id = $1`, [product.id]);
      await client.query(`DELETE FROM digital_product_versions WHERE product_id = $1`, [product.id]);
      await client.query(`DELETE FROM digital_product_featured WHERE product_id = $1`, [product.id]);

      // Seed Files for this product
      const primaryFileFormat = p.file_formats[0] || '.zip';
      const sha1 = crypto.createHash('sha256').update(product.id + '-1').digest('hex');
      const fileRes = await client.query(
        `INSERT INTO digital_product_files
         (product_id, file_name, file_size_bytes, mime_type, file_format, storage_path, storage_provider, checksum_sha256, virus_scan_status, is_primary, download_count)
         VALUES ($1, $2, $3, $4, $5, $6, 's3', $7, 'clean', true, $8)
         RETURNING id`,
        [
          product.id,
          `${p.slug}-v${p.version}${primaryFileFormat}`,
          14589200 + (i * 1234567),
          primaryFileFormat === '.fig' ? 'application/octet-stream' : 'application/zip',
          primaryFileFormat,
          `vault/products/${product.id}/${p.slug}-v${p.version}${primaryFileFormat}`,
          sha1,
          Math.floor(p.total_downloads * 0.8)
        ]
      );
      const primaryFileId = fileRes.rows[0].id;

      // Seed 2nd file if multiple formats
      if (p.file_formats.length > 1) {
        const sha2 = crypto.createHash('sha256').update(product.id + '-2').digest('hex');
        await client.query(
          `INSERT INTO digital_product_files
           (product_id, file_name, file_size_bytes, mime_type, file_format, storage_path, storage_provider, checksum_sha256, virus_scan_status, is_primary, download_count)
           VALUES ($1, $2, $3, $4, $5, $6, 's3', $7, 'clean', false, $8)`,
          [
            product.id,
            `${p.slug}-assets${p.file_formats[1]}`,
            4892000 + (i * 54321),
            'application/octet-stream',
            p.file_formats[1],
            `vault/products/${product.id}/${p.slug}-assets${p.file_formats[1]}`,
            sha2,
            Math.floor(p.total_downloads * 0.2)
          ]
        );
      }

      // Seed License Assignments
      for (const licKey of ['personal', 'commercial', 'extended', 'enterprise']) {
        const licId = licenseIds[licKey];
        if (licId) {
          let price = p.price_personal_cents;
          if (licKey === 'commercial') price = p.price_commercial_cents;
          if (licKey === 'extended') price = p.price_extended_cents;
          if (licKey === 'enterprise') price = p.price_enterprise_cents;

          await client.query(
            `INSERT INTO digital_product_license_assignments
             (product_id, license_id, custom_price_cents, is_enabled)
             VALUES ($1, $2, $3, true)`,
            [product.id, licId, price]
          );
        }
      }

      // Seed Versions
      await client.query(
        `INSERT INTO digital_product_versions
         (product_id, version_string, release_notes, changelog, file_url, file_size_bytes, is_current, download_count)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
        [
          product.id,
          p.version,
          'Latest stable release with enhanced Figma auto-layout and dark mode tokens.',
          '- Added 40 new micro-components\n- Fixed alignment bugs in modal headers\n- Updated color contrast to WCAG AAA',
          `https://vault.desigot.com/downloads/${product.id}/v${p.version}.zip`,
          14589200 + (i * 1234567),
          p.total_downloads
        ]
      );

      // Seed previous version for published products
      if (p.status === 'published') {
        await client.query(
          `INSERT INTO digital_product_versions
           (product_id, version_string, release_notes, changelog, file_url, file_size_bytes, is_current, released_at, download_count)
           VALUES ($1, '1.0.0', 'Initial public marketplace release.', '- Initial launch components and layout grids.', $2, $3, false, NOW() - INTERVAL '60 days', 85)`,
          [
            product.id,
            `https://vault.desigot.com/downloads/${product.id}/v1.0.0.zip`,
            12400000 + (i * 1234567)
          ]
        );
      }

      // Seed Featured entry if featured
      if (p.is_featured) {
        await client.query(
          `INSERT INTO digital_product_featured
           (product_id, position, featured_type, starts_at, impressions, clicks, conversions)
           VALUES ($1, $2, 'hero_banner', NOW() - INTERVAL '14 days', $3, $4, $5)`,
          [
            product.id,
            p.featured_position,
            12400 + (i * 1500),
            1840 + (i * 240),
            p.total_sales
          ]
        );
      }

      // Seed Moderation History
      if (p.status === 'published') {
        await client.query(
          `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, previous_status, new_status, created_at)
           VALUES ($1, $2, 'approved', 'Product meets all quality and asset packaging guidelines.', 'pending_review', 'published', NOW() - INTERVAL '30 days')`,
          [product.id, adminUser]
        );
      } else if (p.status === 'rejected') {
        await client.query(
          `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, previous_status, new_status, created_at)
           VALUES ($1, $2, 'rejected', $3, 'pending_review', 'rejected', NOW() - INTERVAL '5 days')`,
          [product.id, adminUser, p.rejection_reason]
        );
      } else if (p.status === 'pending_review') {
        await client.query(
          `INSERT INTO digital_product_moderation_history (product_id, moderator_id, action, notes, previous_status, new_status, created_at)
           VALUES ($1, $2, 'submitted', 'Seller submitted product for review queue.', 'draft', 'pending_review', NOW() - INTERVAL '2 days')`,
          [product.id, curSeller]
        );
      }

      // Seed Downloads and Entitlements for published products
      if (p.status === 'published' && p.total_sales > 0) {
        // Insert an entitlement
        const licenseKey = `DSGT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const entRes = await client.query(
          `INSERT INTO digital_product_download_entitlements
           (user_id, product_id, license_type, license_key, max_downloads, downloads_used, expires_at)
           VALUES ($1, $2, 'commercial', $3, 20, 3, NOW() + INTERVAL '365 days')
           RETURNING id`,
          [buyerId, product.id, licenseKey]
        );

        // Insert download logs
        await client.query(
          `INSERT INTO digital_product_downloads
           (product_id, file_id, user_id, ip_address, user_agent, downloaded_at, status, file_version)
           VALUES 
           ($1, $2, $3, '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0', NOW() - INTERVAL '1 day', 'success', $4),
           ($1, $2, $3, '192.168.1.104', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1', NOW() - INTERVAL '3 days', 'success', $4),
           ($1, $2, $3, '45.33.32.156', 'Mozilla/5.0 (X11; Linux x86_64) Firefox/124.0', NOW() - INTERVAL '7 days', 'success', $4)`,
          [product.id, primaryFileId, buyerId, p.version]
        );
      }
    }

    // 4. Seed Refund Requests
    console.log('💳 Seeding sample refund requests...');
    const pubProd = insertedProducts.find(p => p.status === 'published');
    if (pubProd) {
      await client.query(`DELETE FROM digital_product_refund_requests WHERE product_id = $1`, [pubProd.id]);
      await client.query(
        `INSERT INTO digital_product_refund_requests
         (product_id, buyer_id, seller_id, amount_cents, reason, status, resolution_notes, resolved_by, resolved_at)
         VALUES 
         ($1, $2, $3, 12900, 'Customer bought Commercial license by mistake instead of Personal. Requested refund to repurchase.', 'requested', NULL, NULL, NULL),
         ($1, $2, $3, 4900, 'Buyer reported missing Figma font assets that were resolved via seller support.', 'rejected', 'Missing font files were uploaded by creator within 2 hours; buyer satisfied.', $4, NOW() - INTERVAL '2 days'),
         ($1, $2, $3, 34900, 'Accidental duplicate checkout charged twice by payment gateway.', 'refunded', 'Verified duplicate transaction in Stripe ledger. Full refund authorized.', $4, NOW() - INTERVAL '1 day')`,
        [pubProd.id, buyerId, sellerId, adminUser]
      );
    }

    console.log(`🎉 Successfully seeded ${insertedProducts.length} digital products with complete relationships!`);
  } catch (err) {
    console.error('❌ Seeding digital products failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDigitalProducts();
}

module.exports = seedDigitalProducts;
