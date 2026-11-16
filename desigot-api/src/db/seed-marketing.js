'use strict';

const pool = require('./pool');
const crypto = require('crypto');

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

async function seedMarketing() {
  console.log('🌱 Starting Comprehensive Marketing & Promotions Seeding...');
  const client = await pool.getClient();

  try {
    // 1. Fetch available marketplace entities
    const buyersRes = await client.query(`SELECT id, first_name, last_name, email FROM users WHERE role = 'buyer' OR role IS NULL LIMIT 60`);
    const sellersRes = await client.query(`SELECT id, first_name, last_name, email FROM users WHERE role = 'seller' OR seller_verified = true LIMIT 35`);
    const adminsRes = await client.query(`SELECT id, first_name, last_name, email FROM users WHERE is_super_admin = true OR role = 'admin' OR role = 'superadmin' LIMIT 5`);
    const productsRes = await client.query(`SELECT id, title, seller_id, price_personal_cents, price_commercial_cents FROM digital_products LIMIT 30`);
    const servicesRes = await client.query(`SELECT id, title, seller_id, starting_price_cents FROM services LIMIT 30`);
    const categoriesRes = await client.query(`SELECT id, name, slug FROM listing_categories LIMIT 15`);
    const ordersRes = await client.query(`SELECT id, buyer_id, seller_id, amount_cents FROM orders LIMIT 80`);

    const buyers = buyersRes.rows;
    const sellers = sellersRes.rows;
    const admins = adminsRes.rows.length > 0 ? adminsRes.rows : buyers.slice(0, 2);
    const superAdmin = admins[0];
    const products = productsRes.rows;
    const services = servicesRes.rows;
    const categories = categoriesRes.rows;
    const orders = ordersRes.rows;

    console.log(`Found ${buyers.length} buyers, ${sellers.length} sellers, ${products.length} products, ${services.length} services, ${categories.length} categories.`);

    // ──────────────────────────────────────────────────────────────────────────
    // A. SEED COUPONS (at least 30) & REDEMPTIONS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🏷️ Seeding Coupons & Redemptions...');
    await client.query(`DELETE FROM coupon_redemptions; DELETE FROM coupons;`);

    const couponBlueprints = [
      { code: 'WELCOME10', name: 'Welcome 10% Off First Purchase', type: 'first_order', discType: 'percentage', val: 10, min: 2000, maxDisc: 5000, maxUses: 1000, newCust: true },
      { code: 'DESIGOT20', name: 'Marketplace Launch 20% Discount', type: 'percentage', discType: 'percentage', val: 20, min: 5000, maxDisc: 10000, maxUses: 500, newCust: false },
      { code: 'FLAT15OFF', name: 'Flat $15 Off Design Systems', type: 'fixed_amount', discType: 'fixed', val: 1500, min: 6000, maxDisc: null, maxUses: 200, newCust: false },
      { code: 'FIGMAVIP25', name: 'Figma UI Kits 25% Super Sale', type: 'product_specific', discType: 'percentage', val: 25, min: 4000, maxDisc: 8000, maxUses: 150, newCust: false },
      { code: 'PROTOSAVE30', name: 'Interactive Prototyping Promo', type: 'service_specific', discType: 'percentage', val: 30, min: 10000, maxDisc: 15000, maxUses: 100, newCust: false },
      { code: 'SELLERBONUS', name: 'Featured Agency Partner Voucher', type: 'seller_specific', discType: 'fixed', val: 2500, min: 8000, maxDisc: null, maxUses: 75, newCust: false },
      { code: 'CATEGORYAPP', name: 'Mobile Design Category 15% Off', type: 'category_specific', discType: 'percentage', val: 15, min: 3500, maxDisc: 6000, maxUses: 300, newCust: false },
      { code: 'SUMMERFLASH', name: 'Summer Creative Flash 35%', type: 'percentage', discType: 'percentage', val: 35, min: 5000, maxDisc: 12000, maxUses: 50, newCust: false },
      { code: 'FALLSAVE2026', name: 'Autumn Design Refresh $20 Off', type: 'fixed_amount', discType: 'fixed', val: 2000, min: 7000, maxDisc: null, maxUses: 250, newCust: false },
      { code: 'EXPIREDTEST', name: 'Past Winter Promotion', type: 'percentage', discType: 'percentage', val: 15, min: 3000, maxDisc: 5000, maxUses: 100, newCust: false, isExpired: true },
      { code: 'SCHEDULED26', name: 'Upcoming Cyber Week Teaser', type: 'percentage', discType: 'percentage', val: 40, min: 10000, maxDisc: 20000, maxUses: 50, newCust: false, isScheduled: true },
      { code: 'INACTIVETEST', name: 'Archived Internal Test Code', type: 'percentage', discType: 'percentage', val: 50, min: 1000, maxDisc: 2000, maxUses: 10, newCust: false, isInactive: true },
      { code: 'FREELANCE50', name: 'Freelancer Starter Pack $50 Off', type: 'fixed_amount', discType: 'fixed', val: 5000, min: 15000, maxDisc: null, maxUses: 80, newCust: false },
      { code: 'ICONPACK10', name: '3D & Vector Icons Flat $10 Off', type: 'product_specific', discType: 'fixed', val: 1000, min: 2500, maxDisc: null, maxUses: 400, newCust: false },
      { code: 'BRANDINGVIP', name: 'Full Identity Package 20% Off', type: 'service_specific', discType: 'percentage', val: 20, min: 20000, maxDisc: 30000, maxUses: 60, newCust: false },
      { code: 'AFFILIATE10', name: 'Creator Affiliate Exclusive 10%', type: 'affiliate', discType: 'percentage', val: 10, min: 3000, maxDisc: 5000, maxUses: 1000, newCust: false },
      { code: 'REFREWARD15', name: 'Referral Invite Friend $15 Reward', type: 'referral', discType: 'fixed', val: 1500, min: 4000, maxDisc: null, maxUses: 500, newCust: true },
      { code: 'LIMITEDRUN5', name: 'Exclusive First 50 Buyers Only', type: 'percentage', discType: 'percentage', val: 45, min: 5000, maxDisc: 15000, maxUses: 50, newCust: false },
      { code: 'ENTERPRISE100', name: 'Enterprise License Tier $100 Off', type: 'product_specific', discType: 'fixed', val: 10000, min: 40000, maxDisc: null, maxUses: 30, newCust: false },
      { code: 'SAASBOOST', name: 'SaaS Dashboard UI Kit 18% Off', type: 'product_specific', discType: 'percentage', val: 18, min: 4500, maxDisc: 9000, maxUses: 220, newCust: false },
      { code: 'STARTUPPACK', name: 'Startup Pitch Deck Design $35 Off', type: 'service_specific', discType: 'fixed', val: 3500, min: 12000, maxDisc: null, maxUses: 90, newCust: false },
      { code: 'WEEKENDVIBE', name: 'Weekend Creative Sprint 12%', type: 'percentage', discType: 'percentage', val: 12, min: 2500, maxDisc: 4000, maxUses: 350, newCust: false },
      { code: 'UXAUDIT25', name: 'Comprehensive UX Audit $25 Off', type: 'service_specific', discType: 'fixed', val: 2500, min: 9000, maxDisc: null, maxUses: 110, newCust: false },
      { code: 'MOBILEDEV15', name: 'Flutter & React Design Systems 15%', type: 'category_specific', discType: 'percentage', val: 15, min: 5000, maxDisc: 8000, maxUses: 180, newCust: false },
      { code: 'TYPOGRAPHY10', name: 'Editorial & Font Kits $10 Off', type: 'product_specific', discType: 'fixed', val: 1000, min: 3000, maxDisc: null, maxUses: 260, newCust: false },
      { code: 'LOYALTY2026', name: 'Repeat Customer Appreciation 22%', type: 'percentage', discType: 'percentage', val: 22, min: 6000, maxDisc: 12000, maxUses: 300, newCust: false },
      { code: 'FLASHDEAL50', name: 'Midnight Flash Deal 50% Off', type: 'percentage', discType: 'percentage', val: 50, min: 8000, maxDisc: 15000, maxUses: 40, newCust: false },
      { code: 'DESIGNTOKENS', name: 'Design Tokens Architecture $12 Off', type: 'product_specific', discType: 'fixed', val: 1200, min: 3500, maxDisc: null, maxUses: 190, newCust: false },
      { code: 'QUICKCONSULT', name: '1-Hour Advisory Session 25% Off', type: 'service_specific', discType: 'percentage', val: 25, min: 7500, maxDisc: 10000, maxUses: 80, newCust: false },
      { code: 'FINTECHPRO30', name: 'Banking & Crypto Assets $30 Off', type: 'product_specific', discType: 'fixed', val: 3000, min: 10000, maxDisc: null, maxUses: 140, newCust: false },
      { code: 'DISCOUNTBETA', name: 'Beta Tester Courtesy $8 Off', type: 'fixed_amount', discType: 'fixed', val: 800, min: 2000, maxDisc: null, maxUses: 500, newCust: false },
      { code: 'BLACKFRIDAY26', name: 'Black Friday Super Savings 40%', type: 'percentage', discType: 'percentage', val: 40, min: 10000, maxDisc: 25000, maxUses: 1000, newCust: false, isScheduled: true }
    ];

    const seededCoupons = [];
    for (const b of couponBlueprints) {
      let status = 'active';
      let isActive = true;
      let start = new Date(Date.now() - 30 * 86400000);
      let end = new Date(Date.now() + 60 * 86400000);

      if (b.isExpired) {
        status = 'expired';
        isActive = false;
        start = new Date(Date.now() - 90 * 86400000);
        end = new Date(Date.now() - 10 * 86400000);
      } else if (b.isScheduled) {
        status = 'scheduled';
        isActive = true;
        start = new Date(Date.now() + 15 * 86400000);
        end = new Date(Date.now() + 45 * 86400000);
      } else if (b.isInactive) {
        status = 'inactive';
        isActive = false;
      }

      const prodIds = b.type === 'product_specific' && products.length > 0 ? [randomItem(products).id] : null;
      const srvIds = b.type === 'service_specific' && services.length > 0 ? [randomItem(services).id] : null;
      const catIds = b.type === 'category_specific' && categories.length > 0 ? [randomItem(categories).id] : null;
      const selIds = b.type === 'seller_specific' && sellers.length > 0 ? [randomItem(sellers).id] : null;

      const res = await client.query(`
        INSERT INTO coupons (
          code, name, description, coupon_type, discount_type, discount_value,
          min_order_cents, max_discount_cents, max_uses, uses_count, per_customer_limit,
          start_date, expiration_date, is_active, status, applicable_product_ids,
          applicable_service_ids, applicable_category_ids, applicable_seller_ids,
          new_customer_only, stackable, created_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, $11, $12, $13, $14, $15, $16, $17, $18, $19, false, $20)
        RETURNING *;
      `, [b.code, b.name, `${b.name} - Official promotion on Desigot.`, b.type, b.discType, b.val, b.min, b.maxDisc, b.maxUses, randomInt(5, 48), start, end, isActive, status, prodIds, srvIds, catIds, selIds, b.newCust || false, superAdmin ? superAdmin.id : null]);

      seededCoupons.push(res.rows[0]);
    }
    console.log(`✅ Seeded ${seededCoupons.length} coupons.`);

    // Seed 40 coupon redemptions
    let redemptionsCount = 0;
    for (let i = 0; i < 40; i++) {
      const coup = seededCoupons[i % seededCoupons.length];
      const buyer = buyers[i % buyers.length];
      const order = orders.length > i ? orders[i] : null;
      const orderAmount = order ? order.amount_cents : randomInt(4000, 25000);
      const discount = coup.discount_type === 'percentage' 
        ? Math.round(orderAmount * (coup.discount_value / 100))
        : Math.round(coup.discount_value);

      await client.query(`
        INSERT INTO coupon_redemptions (
          coupon_id, order_id, user_id, order_amount_cents, discount_amount_cents, redeemed_at
        ) VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' days')::interval);
      `, [coup.id, order ? order.id : null, buyer.id, orderAmount, Math.min(discount, orderAmount), String(i + 1)]);
      redemptionsCount++;
    }
    console.log(`✅ Seeded ${redemptionsCount} coupon redemptions.`);

    // ──────────────────────────────────────────────────────────────────────────
    // B. SEED DISCOUNT CAMPAIGNS (at least 15) & ITEMS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📢 Seeding Discount Campaigns & Items...');
    await client.query(`DELETE FROM campaign_items; DELETE FROM marketing_campaigns;`);

    const campaignBlueprints = [
      { name: 'Black Friday Cyber Week Mega Sale', type: 'flash_sale', discVal: 35, status: 'scheduled', startDays: 14, endDays: 21, budget: 500000 },
      { name: 'Spring Creative Renaissance 2026', type: 'seasonal_sale', discVal: 20, status: 'active', startDays: -10, endDays: 20, budget: 350000 },
      { name: 'Mobile UI/UX Design Fest', type: 'category_discount', discVal: 25, status: 'active', startDays: -5, endDays: 15, budget: 200000 },
      { name: 'Weekend Flash Deals – 48 Hours Only', type: 'flash_sale', discVal: 40, status: 'completed', startDays: -7, endDays: -5, budget: 150000 },
      { name: 'Figma Auto-Layout & Tokens Festival', type: 'product_discount', discVal: 30, status: 'active', startDays: -2, endDays: 12, budget: 250000 },
      { name: 'Startup Launchpad Prototyping Sale', type: 'service_discount', discVal: 20, status: 'active', startDays: -4, endDays: 18, budget: 300000 },
      { name: 'Brand Identity Super Sprint', type: 'service_discount', discVal: 15, status: 'paused', startDays: -15, endDays: 15, budget: 180000 },
      { name: '3D Isometric & Spatial Design Wave', type: 'product_discount', discVal: 25, status: 'active', startDays: -8, endDays: 22, budget: 220000 },
      { name: 'Marketplace Anniversary Sitewide Promo', type: 'marketplace_wide', discVal: 15, status: 'draft', startDays: 30, endDays: 45, budget: 750000 },
      { name: 'Winter Solstice Creative Clearance', type: 'seasonal_sale', discVal: 45, status: 'cancelled', startDays: -60, endDays: -30, budget: 100000 },
      { name: 'Fintech & Crypto UI Toolkit Showcase', type: 'product_discount', discVal: 20, status: 'active', startDays: -6, endDays: 24, budget: 280000 },
      { name: 'Design Agency Elite Services Gala', type: 'service_discount', discVal: 18, status: 'active', startDays: -3, endDays: 27, budget: 400000 },
      { name: 'Interactive Micro-Animations Week', type: 'category_discount', discVal: 22, status: 'scheduled', startDays: 7, endDays: 14, budget: 160000 },
      { name: 'Halloween Creative Spooktacular', type: 'festival_sale', discVal: 30, status: 'completed', startDays: -45, endDays: -40, budget: 210000 },
      { name: 'New Year Creator Kickstart 2026', type: 'seasonal_sale', discVal: 25, status: 'completed', startDays: -90, endDays: -75, budget: 500000 },
      { name: 'Midsummer Design Fest 2026', type: 'seasonal_sale', discVal: 20, status: 'draft', startDays: 60, endDays: 75, budget: 320000 }
    ];

    const seededCampaigns = [];
    for (const c of campaignBlueprints) {
      const start = new Date(Date.now() + c.startDays * 86400000);
      const end = new Date(Date.now() + c.endDays * 86400000);
      const spend = c.status === 'completed' || c.status === 'active' ? randomInt(40000, c.budget) : 0;
      const rev = spend > 0 ? Math.round(spend * randomFloat(3.2, 6.8)) : 0;
      const ordersCount = spend > 0 ? randomInt(18, 140) : 0;

      const res = await client.query(`
        INSERT INTO marketing_campaigns (
          name, description, campaign_type, banner_url, thumbnail_url,
          start_date, end_date, discount_type, discount_value, max_discount_cents,
          budget_cents, current_spend_cents, total_revenue_cents, total_orders,
          priority, status, created_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'percentage', $8, 20000, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *;
      `, [c.name, `Official ${c.name} on Desigot. Save up to ${c.discVal}%.`, c.type, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80', start, end, c.discVal, c.budget, spend, rev, ordersCount, randomInt(1, 5), c.status, superAdmin ? superAdmin.id : null]);

      const camp = res.rows[0];
      seededCampaigns.push(camp);

      // Attach 2 products and 2 services to each campaign
      if (products.length > 0) {
        for (let j = 0; j < 2; j++) {
          const p = products[(seededCampaigns.length * 2 + j) % products.length];
          await client.query(`
            INSERT INTO campaign_items (campaign_id, item_type, item_id, custom_discount_value)
            VALUES ($1, 'product', $2, $3)
            ON CONFLICT DO NOTHING;
          `, [camp.id, p.id, c.discVal]);
        }
      }
      if (services.length > 0) {
        for (let j = 0; j < 2; j++) {
          const s = services[(seededCampaigns.length * 2 + j) % services.length];
          await client.query(`
            INSERT INTO campaign_items (campaign_id, item_type, item_id, custom_discount_value)
            VALUES ($1, 'service', $2, $3)
            ON CONFLICT DO NOTHING;
          `, [camp.id, s.id, c.discVal]);
        }
      }
    }
    console.log(`✅ Seeded ${seededCampaigns.length} campaigns with campaign items.`);

    // ──────────────────────────────────────────────────────────────────────────
    // C. SEED FEATURED SERVICES (at least 20)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('⭐ Seeding Featured Services...');
    await client.query(`DELETE FROM featured_services;`);

    const placements = ['homepage_hero', 'marketplace_top', 'category_featured', 'sidebar'];
    let fSrvCount = 0;
    for (let i = 0; i < Math.min(22, services.length); i++) {
      const s = services[i];
      const start = new Date(Date.now() - randomInt(2, 30) * 86400000);
      const end = new Date(Date.now() + randomInt(10, 45) * 86400000);
      const imp = randomInt(1200, 9500);
      const clicks = Math.round(imp * randomFloat(0.04, 0.12));
      const bookings = Math.round(clicks * randomFloat(0.08, 0.22));
      const rev = bookings * (s.starting_price_cents || 15000);

      await client.query(`
        INSERT INTO featured_services (
          service_id, position, priority, placement, start_date, end_date,
          is_active, impressions_count, clicks_count, orders_count, revenue_cents, created_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11);
      `, [s.id, i + 1, randomInt(1, 10), randomItem(placements), start, end, imp, clicks, bookings, rev, superAdmin ? superAdmin.id : null]);
      fSrvCount++;
    }
    console.log(`✅ Seeded ${fSrvCount} featured services.`);

    // ──────────────────────────────────────────────────────────────────────────
    // D. SEED FEATURED PRODUCTS (at least 20)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📦 Seeding Featured Products...');
    await client.query(`DELETE FROM featured_products;`);

    let fProdCount = 0;
    for (let i = 0; i < Math.min(22, products.length); i++) {
      const p = products[i];
      const start = new Date(Date.now() - randomInt(2, 30) * 86400000);
      const end = new Date(Date.now() + randomInt(10, 45) * 86400000);
      const imp = randomInt(2500, 16000);
      const clicks = Math.round(imp * randomFloat(0.05, 0.14));
      const conv = Math.round(clicks * randomFloat(0.06, 0.18));
      const rev = conv * (p.price_personal_cents || 4900);

      await client.query(`
        INSERT INTO featured_products (
          product_id, position, priority, placement, start_date, end_date,
          is_active, impressions, clicks, conversions, revenue_cents, created_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11);
      `, [p.id, i + 1, randomInt(1, 10), randomItem(placements), start, end, imp, clicks, conv, rev, superAdmin ? superAdmin.id : null]);
      fProdCount++;
    }
    console.log(`✅ Seeded ${fProdCount} featured products.`);

    // ──────────────────────────────────────────────────────────────────────────
    // E. SEED HOMEPAGE BANNERS (at least 15)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🖼️ Seeding Homepage Banners...');
    await client.query(`DELETE FROM homepage_banners;`);

    const bannerBlueprints = [
      { name: 'Hero Main Marketplace Banner', title: 'Curated Digital Design Assets & Elite Services', subtitle: 'Ship 10x faster with production-ready Figma components, design systems, and verified agency talent.', type: 'hero', ctaText: 'Explore Marketplace', ctaUrl: '/browse', prio: 1, pos: 1 },
      { name: 'Spring Creative Flash 2026', title: 'Spring Creator Fest – 30% Off Everything', subtitle: 'Exclusive discounts on top UI kits, 3D icons, and custom interactive prototypes.', type: 'promotional', ctaText: 'View Deals', ctaUrl: '/dashboard/marketing/campaigns', prio: 2, pos: 2 },
      { name: 'Figma Auto-Layout Masterclass Kit', title: 'Auto-Layout & Token Architecture Systems', subtitle: 'Organized with atomic structure, nested variants, and zero manual vector fixing.', type: 'product', ctaText: 'Browse Kits', ctaUrl: '/browse?category=ui-kits', prio: 3, pos: 3 },
      { name: 'Bespoke Brand Identity Services', title: 'Hire Top 1% Verified UI/UX Designers', subtitle: 'Fixed-price sprints with guaranteed turnaround and milestone deliveries.', type: 'service', ctaText: 'Book Designer', ctaUrl: '/browse?type=service', prio: 4, pos: 4 },
      { name: 'Mobile App Wireframe Collection', title: '80+ iOS & Android Screen Templates', subtitle: 'Engineered for fintech, e-commerce neobanks, and healthcare apps.', type: 'product', ctaText: 'Download Pack', ctaUrl: '/browse', prio: 5, pos: 5 },
      { name: 'SaaS Analytics Dashboard UI System', title: 'Enterprise Dashboard & Data Viz UI Kits', subtitle: 'Built with WCAG AAA contrast accessibility and Tailwind CSS tokens.', type: 'product', ctaText: 'Preview Screens', ctaUrl: '/browse', prio: 6, pos: 6 },
      { name: 'Halloween Festive Design Special', title: 'Seasonal Autumn Vector & 3D Collection', subtitle: 'Spooky illustrations, Halloween badges, and dark-mode assets.', type: 'seasonal', ctaText: 'View Collection', ctaUrl: '/browse', prio: 7, pos: 7 },
      { name: 'Interactive Micro-Interaction Sprint', title: 'Clickable Prototypes for Startup Fundraise', subtitle: 'Turn wireframes into high-fidelity investor-ready interactive demos.', type: 'service', ctaText: 'Consult Talent', ctaUrl: '/browse', prio: 8, pos: 8 },
      { name: '3D Spatial & Isometric Tech Icons', title: '120+ High-Resolution Glassmorphic Icons', subtitle: 'Rendered in Cinema 4D and Blender, transparent PNG & OBJ included.', type: 'product', ctaText: 'Get Icons', ctaUrl: '/browse', prio: 9, pos: 9 },
      { name: 'Design Systems Migration Advisory', title: 'Migrate Figma Variables to Code in 48 Hours', subtitle: 'Bespoke integration services for React, Vue, and React Native teams.', type: 'service', ctaText: 'Explore Service', ctaUrl: '/browse', prio: 10, pos: 10 },
      { name: 'Fintech Mobile Banking Framework', title: 'Crypto Wallet & Banking Flow Designs', subtitle: 'Complete authentication, KYC onboarding, and portfolio analytics.', type: 'product', ctaText: 'View Details', ctaUrl: '/browse', prio: 11, pos: 11 },
      { name: 'Black Friday Cyber Week Banner', title: 'Up to 50% Off Top Rated Design Assets', subtitle: 'Our biggest promotional event of the year starts soon.', type: 'promotional', ctaText: 'Set Reminder', ctaUrl: '/browse', prio: 12, pos: 12 },
      { name: 'Typography & Editorial System Pack', title: 'Modern Clean Editorial Layouts & Type', subtitle: 'Curated font pairings and high-conversion landing page structures.', type: 'product', ctaText: 'Browse Typography', ctaUrl: '/browse', prio: 13, pos: 13 },
      { name: 'Design Audit & Heuristic Evaluation', title: 'Professional Heuristic UX Audits', subtitle: 'Eliminate friction points before your product launch.', type: 'service', ctaText: 'Request Audit', ctaUrl: '/browse', prio: 14, pos: 14 },
      { name: 'Community Creator Spotlight Banner', title: 'Meet Top Desigot Creators of the Month', subtitle: 'Discover the stories and toolkits behind industry-leading designers.', type: 'promotional', ctaText: 'Read Spotlight', ctaUrl: '/browse', prio: 15, pos: 15 },
      { name: 'Mobile Bottom App Banner', title: 'Get 15% Off Your First Mobile Asset Order', subtitle: 'Use promo code WELCOME10 at checkout.', type: 'hero', ctaText: 'Claim 15% Off', ctaUrl: '/browse', prio: 16, pos: 16 }
    ];

    const mockBannerImages = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1600&auto=format&fit=crop&q=80'
    ];

    let bannerCount = 0;
    for (const b of bannerBlueprints) {
      const img = mockBannerImages[bannerCount % mockBannerImages.length];
      const imp = randomInt(4500, 32000);
      const clk = Math.round(imp * randomFloat(0.03, 0.09));

      await client.query(`
        INSERT INTO homepage_banners (
          name, title, subtitle, description, banner_type, desktop_image_url,
          tablet_image_url, mobile_image_url, cta_text, cta_url, target_audience,
          start_date, end_date, display_priority, position, status, impressions, clicks, created_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $6, $6, $7, $8, 'all', NOW() - INTERVAL '10 days', NOW() + INTERVAL '90 days', $9, $10, 'published', $11, $12, $13);
      `, [b.name, b.title, b.subtitle, b.subtitle, b.type, img, b.ctaText, b.ctaUrl, b.prio, b.pos, imp, clk, superAdmin ? superAdmin.id : null]);
      bannerCount++;
    }
    console.log(`✅ Seeded ${bannerCount} homepage banners.`);

    // ──────────────────────────────────────────────────────────────────────────
    // F. SEED PROMOTIONAL SECTIONS (at least 12) & ITEMS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📑 Seeding Promotional Sections & Items...');
    await client.query(`DELETE FROM promotional_section_items; DELETE FROM promotional_sections;`);

    const sectionBlueprints = [
      { title: 'Trending Digital Products', sub: 'Most downloaded design kits and 3D icon assets this week.', type: 'trending_products', layout: 'grid', cols: 4, count: 8, prio: 1 },
      { title: 'Featured Design Services', sub: 'Hand-picked professional services from top rated design agencies.', type: 'trending_services', layout: 'grid', cols: 4, count: 8, prio: 2 },
      { title: 'All-Time Best Sellers', sub: 'Verified marketplace classics tested by thousands of production teams.', type: 'best_sellers', layout: 'carousel', cols: 4, count: 6, prio: 3 },
      { title: 'Fresh New Arrivals', sub: 'Latest releases published by creator community in the past 14 days.', type: 'new_arrivals', layout: 'grid', cols: 4, count: 8, prio: 4 },
      { title: 'Top Rated UI/UX Kits', sub: 'Rated 4.9+ stars with verified engineer recommendations.', type: 'top_rated_products', layout: 'grid', cols: 4, count: 8, prio: 5 },
      { title: 'Elite Prototyping & Advisory', sub: 'Highest satisfaction custom services with on-time delivery track record.', type: 'top_rated_services', layout: 'grid', cols: 4, count: 6, prio: 6 },
      { title: 'Limited-Time Promotional Offers', sub: 'High value creative assets with temporary promotional discount rates.', type: 'limited_time_offers', layout: 'grid', cols: 4, count: 8, prio: 7 },
      { title: 'Popular Design Categories', sub: 'Explore marketplace assets by your favorite application discipline.', type: 'featured_categories', layout: 'grid', cols: 6, count: 6, prio: 8 },
      { title: 'Fintech & Neobank Toolkit Collection', sub: 'Curated financial flows, charts, biometric gates, and crypto cards.', type: 'custom_collection', layout: 'carousel', cols: 4, count: 6, prio: 9 },
      { title: 'Design System Tokens & Architecture', sub: 'Master variables, token aliases, and automated hand-off files.', type: 'custom_collection', layout: 'grid', cols: 4, count: 8, prio: 10 },
      { title: '3D Spatial & Game Asset Essentials', sub: 'High-poly and optimized low-poly isometric models for web experiences.', type: 'custom_collection', layout: 'grid', cols: 4, count: 8, prio: 11 },
      { title: 'High-Conversion Landing Page Kits', sub: 'Tested wireframes, hero copy layouts, and component sections.', type: 'custom_collection', layout: 'grid', cols: 4, count: 8, prio: 12 }
    ];

    let sectionCount = 0;
    for (const s of sectionBlueprints) {
      const res = await client.query(`
        INSERT INTO promotional_sections (
          title, subtitle, section_type, display_layout, grid_columns,
          display_count, sort_order, background_style, start_date, end_date,
          is_active, status, created_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'default', NOW() - INTERVAL '5 days', NOW() + INTERVAL '120 days', true, 'published', $8)
        RETURNING *;
      `, [s.title, s.sub, s.type, s.layout, s.cols, s.count, s.prio, superAdmin ? superAdmin.id : null]);

      const sec = res.rows[0];
      sectionCount++;

      // Assign appropriate items
      if (s.type.includes('product') || s.type === 'best_sellers' || s.type === 'new_arrivals' || s.type === 'custom_collection') {
        for (let j = 0; j < Math.min(4, products.length); j++) {
          const prod = products[(sectionCount * 2 + j) % products.length];
          await client.query(`
            INSERT INTO promotional_section_items (section_id, item_type, item_id, position)
            VALUES ($1, 'product', $2, $3)
            ON CONFLICT DO NOTHING;
          `, [sec.id, prod.id, j + 1]);
        }
      } else if (s.type.includes('service')) {
        for (let j = 0; j < Math.min(4, services.length); j++) {
          const srv = services[(sectionCount * 2 + j) % services.length];
          await client.query(`
            INSERT INTO promotional_section_items (section_id, item_type, item_id, position)
            VALUES ($1, 'service', $2, $3)
            ON CONFLICT DO NOTHING;
          `, [sec.id, srv.id, j + 1]);
        }
      }
    }
    console.log(`✅ Seeded ${sectionCount} promotional sections with item relations.`);

    // ──────────────────────────────────────────────────────────────────────────
    // G. SEED NEWSLETTERS (at least 10) & SUBSCRIBERS (at least 100)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📧 Seeding Newsletters & Subscribers...');
    await client.query(`DELETE FROM newsletter_campaigns; DELETE FROM newsletter_subscribers;`);

    // 100+ Subscribers
    let subCount = 0;
    for (let i = 0; i < 110; i++) {
      const buyer = buyers.length > i ? buyers[i] : null;
      const email = buyer ? buyer.email : `subscriber${i + 1}@sampledesigot.com`;
      const name = buyer ? `${buyer.first_name} ${buyer.last_name}` : `Creative Member ${i + 1}`;
      const src = (i % 4 === 0) ? 'checkout' : (i % 3 === 0) ? 'registration' : 'footer_form';

      await client.query(`
        INSERT INTO newsletter_subscribers (
          email, name, user_id, status, consent_given, source, subscribed_at
        ) VALUES ($1, $2, $3, 'subscribed', true, $4, NOW() - ($5 || ' days')::interval)
        ON CONFLICT (email) DO NOTHING;
      `, [email, name, buyer ? buyer.id : null, src, String(i % 60 + 1)]);
      subCount++;
    }
    console.log(`✅ Seeded ${subCount} newsletter subscribers.`);

    // 10+ Newsletter Campaigns
    const newsletterBlueprints = [
      { name: 'Monthly Design Digest – Edition #42', subject: '🎨 5 Design Trends Shaping Q2 2026 + 20% Off UI Kits', status: 'sent', rec: 105, open: 68, click: 29 },
      { name: 'Spring Creative Renaissance Announcement', subject: '🌸 The Spring Sale is Live: Save on Top 50 Assets', status: 'sent', rec: 98, open: 54, click: 24 },
      { name: 'Creator Spotlight: Studio Nova', subject: '✨ Inside the Design System that Scaled to 1M Users', status: 'sent', rec: 95, open: 49, click: 18 },
      { name: 'Weekend Flash Deals Alert', subject: '⚡ 48-Hour Flash: 30% Off Interactive Figma Prototypes', status: 'sent', rec: 90, open: 52, click: 31 },
      { name: 'Upcoming Cyber Week Teaser', subject: '🚀 Get Early Access to Black Friday Cyber Week Deals', status: 'scheduled', rec: 110, open: 0, click: 0 },
      { name: 'Mobile App Architecture Blueprint', subject: '📱 The Complete Guide to Responsive Grid Systems', status: 'draft', rec: 0, open: 0, click: 0 },
      { name: 'Product Update: Instant Downloads & Invoicing', subject: '🛠️ Faster Checkout & Automated Tax Invoices Now Live', status: 'sent', rec: 88, open: 61, click: 22 },
      { name: 'Design Tokens Handover Guide', subject: '📦 How to Bridge Figma Variables & Tailwind CSS Tokens', status: 'draft', rec: 0, open: 0, click: 0 },
      { name: 'Midsummer Festival Invitation', subject: '☀️ Celebrate Summer with 25% Off Identity Packages', status: 'scheduled', rec: 100, open: 0, click: 0 },
      { name: 'Archived Promotional Blast 2025', subject: '🎉 Happy New Year from the Desigot Creator Team', status: 'sent', rec: 75, open: 42, click: 15 },
      { name: 'Cancelled Experimental Newsletter', subject: 'Test Campaign Draft (Internal Only)', status: 'cancelled', rec: 0, open: 0, click: 0 }
    ];

    let newsCount = 0;
    for (const n of newsletterBlueprints) {
      await client.query(`
        INSERT INTO newsletter_campaigns (
          name, subject, sender_name, sender_email, header_image_url,
          content_html, cta_text, cta_url, target_segment, scheduled_at,
          sent_at, status, recipient_count, open_count, click_count,
          bounce_count, unsubscribe_count, created_by_id
        ) VALUES ($1, $2, 'Desigot Marketplace', 'newsletter@desigot.com',
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
          '<div style=\"font-family:sans-serif;max-width:600px;margin:auto;\"><h2>${n.subject}</h2><p>Welcome to this week edition of Desigot Marketplace curation.</p><a href=\"https://desigot.com/browse\" style=\"background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;\">Discover Assets</a></div>',
          'Explore Deals', 'https://desigot.com/browse', 'all_customers',
          ${n.status === 'scheduled' ? "NOW() + INTERVAL '3 days'" : "NULL"},
          ${n.status === 'sent' ? "NOW() - INTERVAL '4 days'" : "NULL"},
          $3, $4, $5, $6, $7, $8, $9);
      `, [n.name, n.subject, n.status, n.rec, n.open, n.click, n.status === 'sent' ? randomInt(1, 3) : 0, n.status === 'sent' ? randomInt(0, 2) : 0, superAdmin ? superAdmin.id : null]);
      newsCount++;
    }
    console.log(`✅ Seeded ${newsCount} newsletter campaigns.`);

    // ──────────────────────────────────────────────────────────────────────────
    // H. SEED AFFILIATES (at least 20), CLICKS, CONVERSIONS, PAYOUTS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🤝 Seeding Affiliates & Commissions...');
    await client.query(`DELETE FROM affiliate_payouts; DELETE FROM affiliate_conversions; DELETE FROM affiliate_clicks; DELETE FROM affiliates;`);

    let affCount = 0;
    const seededAffiliates = [];
    for (let i = 0; i < Math.min(22, sellers.length); i++) {
      const u = sellers[i];
      const firstName = u.first_name || 'PARTNER';
      const lastName = u.last_name || 'USER';
      const code = `AFF-${firstName.toUpperCase().slice(0, 3)}${randomInt(100, 999)}`;
      const link = `https://desigot.com/ref/${code}`;
      const clicks = randomInt(40, 650);
      const conv = Math.round(clicks * randomFloat(0.04, 0.12));
      const gmv = conv * randomInt(5000, 25000);
      const commRate = (i % 4 === 0) ? 15.00 : 10.00;
      const totalComm = Math.round(gmv * (commRate / 100));
      const paidComm = Math.round(totalComm * 0.6);
      const appComm = Math.round(totalComm * 0.3);
      const pendComm = totalComm - (paidComm + appComm);

      let status = 'approved';
      if (i === 18) status = 'pending';
      else if (i === 19) status = 'suspended';

      const res = await client.query(`
        INSERT INTO affiliates (
          user_id, affiliate_code, affiliate_name, email, affiliate_type,
          referral_link, commission_type, commission_rate, status,
          total_clicks, total_conversions, total_revenue_cents,
          pending_commission_cents, approved_commission_cents, paid_commission_cents, approved_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'percentage', $7, $8, $9, $10, $11, $12, $13, $14, NOW() - INTERVAL '30 days')
        RETURNING *;
      `, [u.id, code, `${firstName} ${lastName}`.trim(), u.email, (i % 3 === 0) ? 'agency' : 'creator', link, commRate, status, clicks, conv, gmv, pendComm, appComm, paidComm]);

      const aff = res.rows[0];
      seededAffiliates.push(aff);
      affCount++;

      // Seed 2 clicks and 1 conversion per approved affiliate
      if (status === 'approved') {
        for (let k = 0; k < 2; k++) {
          await client.query(`
            INSERT INTO affiliate_clicks (affiliate_id, ip_address, landing_page, referrer_url, user_agent)
            VALUES ($1, $2, '/browse?category=ui-kits', 'https://twitter.com/designer', 'Mozilla/5.0');
          `, [aff.id, `192.168.1.${randomInt(10, 200)}`]);
        }

        const buyer = randomItem(buyers);
        const order = randomItem(orders);
        await client.query(`
          INSERT INTO affiliate_conversions (
            affiliate_id, order_id, customer_id, order_amount_cents, commission_amount_cents,
            status, qualification_ends_at, approved_at
          ) VALUES ($1, $2, $3, $4, $5, 'approved', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');
        `, [aff.id, order.id, buyer.id, 9900, 990]);

        // Seed payout record
        await client.query(`
          INSERT INTO affiliate_payouts (
            affiliate_id, payout_reference, amount_cents, payout_method, status, processed_by_id, paid_at
          ) VALUES ($1, $2, $3, 'stripe', 'paid', $4, NOW() - INTERVAL '5 days');
        `, [aff.id, `PAY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`, paidComm || 15000, superAdmin ? superAdmin.id : null]);
      }
    }
    console.log(`✅ Seeded ${affCount} affiliates with clicks, conversions, and payouts.`);

    // ──────────────────────────────────────────────────────────────────────────
    // I. SEED REFERRAL PROGRAMS (at least 10), CODES, CONVERSIONS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🎁 Seeding Referral Programs & Conversions...');
    await client.query(`DELETE FROM referral_conversions; DELETE FROM referral_codes; DELETE FROM referral_programs;`);

    const referralBlueprints = [
      { name: 'Give $15, Get $15 Creator Referral Program', refVal: 1500, refReeVal: 1500, min: 3000, status: 'active' },
      { name: 'Agency Partner Referral Program – $25 Reward', refVal: 2500, refReeVal: 2000, min: 6000, status: 'active' },
      { name: 'Invite Your Engineering Team $10 Bonus', refVal: 1000, refReeVal: 1000, min: 2500, status: 'active' },
      { name: 'Service Booking Referral Program $20', refVal: 2000, refReeVal: 2000, min: 8000, status: 'active' },
      { name: 'First Purchase Referral Boost 2026', refVal: 1200, refReeVal: 1500, min: 3500, status: 'active' },
      { name: 'Figma Designers Community Referral', refVal: 1800, refReeVal: 1800, min: 4500, status: 'active' },
      { name: 'Spring Referral Sprint Promotion', refVal: 3000, refReeVal: 2500, min: 10000, status: 'paused' },
      { name: 'Startup Founder Invite Program', refVal: 2000, refReeVal: 2000, min: 5000, status: 'active' },
      { name: 'Archived 2025 Holiday Referral Drive', refVal: 1500, refReeVal: 1000, min: 3000, status: 'expired' },
      { name: 'Beta Community Invitation Campaign', refVal: 1000, refReeVal: 1000, min: 2000, status: 'active' },
      { name: 'Upcoming Summer Referral Carnival', refVal: 2500, refReeVal: 2500, min: 7500, status: 'paused' }
    ];

    let refProgCount = 0;
    const seededRefPrograms = [];
    for (const r of referralBlueprints) {
      const res = await client.query(`
        INSERT INTO referral_programs (
          name, description, referral_type, referrer_reward_type, referrer_reward_value,
          referred_reward_type, referred_reward_value, min_order_cents, max_referrals_per_user,
          budget_cents, current_spend_cents, start_date, end_date, status, created_by_id
        ) VALUES ($1, $2, 'customer_referral', 'fixed', $3, 'fixed', $4, $5, 25, 500000, 45000, NOW() - INTERVAL '15 days', NOW() + INTERVAL '120 days', $6, $7)
        RETURNING *;
      `, [r.name, `Invite friends to Desigot and earn rewards on completed orders.`, r.refVal, r.refReeVal, r.min, r.status, superAdmin ? superAdmin.id : null]);

      const prog = res.rows[0];
      seededRefPrograms.push(prog);
      refProgCount++;

      // Seed referral code for 2 buyers
      for (let j = 0; j < 2; j++) {
        const u = buyers[(refProgCount * 2 + j) % buyers.length];
        const firstName = u.first_name || 'USER';
        const code = `REF-${firstName.toUpperCase().slice(0, 3)}${randomInt(10, 99)}`;
        await client.query(`
          INSERT INTO referral_codes (program_id, user_id, code, total_clicks, total_conversions)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (program_id, user_id) DO NOTHING;
        `, [prog.id, u.id, code, randomInt(15, 80), randomInt(2, 10)]);

        // Seed 1 conversion
        const referee = buyers[(refProgCount * 2 + j + 5) % buyers.length];
        const order = randomItem(orders);
        await client.query(`
          INSERT INTO referral_conversions (
            program_id, referrer_id, referee_id, order_id, order_amount_cents,
            referrer_reward_cents, referee_reward_cents, status, approved_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', NOW() - INTERVAL '2 days');
        `, [prog.id, u.id, referee.id, order.id, 8500, r.refVal, r.refReeVal]);
      }
    }
    console.log(`✅ Seeded ${refProgCount} referral programs with codes & conversions.`);

    // ──────────────────────────────────────────────────────────────────────────
    // J. SEED ADVERTISEMENTS (at least 20)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📣 Seeding Advertisements...');
    await client.query(`DELETE FROM advertisements;`);

    const adBlueprints = [
      { name: 'Apex Dashboard UI Kit – Sponsored Hero Ad', type: 'homepage_banner', place: 'homepage_top', headline: 'Ship SaaS Dashboards 5x Faster', cta: 'Get UI Kit', bid: 65, total: 60000, daily: 5000, status: 'active' },
      { name: 'Nova Agency Custom Prototype Ad', type: 'sidebar', place: 'sidebar_top', headline: 'Top 1% Figma Designers on Demand', cta: 'Hire Talent', bid: 85, total: 80000, daily: 8000, status: 'active' },
      { name: 'Cyberpunk 3D Holographic Asset Pack', type: 'sponsored_listing', place: 'browse_grid', headline: '100+ 3D Isometric Holograms', cta: 'Download Pack', bid: 45, total: 40000, daily: 4000, status: 'active' },
      { name: 'Fintech Pro Mobile Neobank Design', type: 'search_result', place: 'search_top', headline: 'Complete Banking App Flow', cta: 'Preview Screens', bid: 75, total: 70000, daily: 6000, status: 'active' },
      { name: 'Design Tokens Auto-Layout Specialist', type: 'sponsored_listing', place: 'browse_grid', headline: 'Design Systems Architecture Service', cta: 'Book Call', bid: 90, total: 90000, daily: 9000, status: 'active' },
      { name: 'Interactive Fundraise Pitch Decks', type: 'homepage_banner', place: 'homepage_top', headline: 'Raise Capital with Clickable Prototypes', cta: 'Explore Sprints', bid: 95, total: 100000, daily: 10000, status: 'active' },
      { name: 'Health & Fitness iOS Tracker Kit', type: 'sponsored_listing', place: 'browse_grid', headline: 'Clean Apple Health UI Kit', cta: 'Get Template', bid: 40, total: 35000, daily: 3500, status: 'paused' },
      { name: 'E-Commerce Marketplace Mega Template', type: 'sidebar', place: 'sidebar_top', headline: 'Over 120+ Web & Mobile Layouts', cta: 'View Demo', bid: 50, total: 45000, daily: 4500, status: 'active' },
      { name: 'Brand Identity Strategy Sprint Ad', type: 'homepage_banner', place: 'homepage_top', headline: 'Comprehensive Brand Guide in 7 Days', cta: 'See Portfolio', bid: 110, total: 120000, daily: 12000, status: 'pending_approval' },
      { name: 'Dark Mode SaaS Color Palette Tool', type: 'search_result', place: 'search_top', headline: 'WCAG AAA Accessible Tokens', cta: 'Download Variables', bid: 35, total: 30000, daily: 3000, status: 'active' },
      { name: 'Vector Iconography Library Pack', type: 'sponsored_listing', place: 'browse_grid', headline: '2,000+ Clean Modern Vector Icons', cta: 'Explore Icons', bid: 30, total: 25000, daily: 2500, status: 'completed' },
      { name: 'Heuristic UX Audit Consultation', type: 'sidebar', place: 'sidebar_top', headline: 'Double Your Onboarding Conversion Rate', cta: 'Order Audit', bid: 80, total: 75000, daily: 7500, status: 'active' },
      { name: 'Flutter & React Native UI Kit Bundle', type: 'search_result', place: 'search_top', headline: 'Cross-Platform App Screens in Figma', cta: 'Download Kit', bid: 60, total: 55000, daily: 5500, status: 'active' },
      { name: 'Startup Wireframe Blueprint Ad', type: 'sponsored_listing', place: 'browse_grid', headline: 'From Idea to Wireframe in Hours', cta: 'Get Started', bid: 40, total: 40000, daily: 4000, status: 'active' },
      { name: 'Glassmorphic 3D Finance Assets', type: 'homepage_banner', place: 'homepage_top', headline: 'Rendered 3D Assets for Web3 & Fintech', cta: 'View Models', bid: 70, total: 65000, daily: 6500, status: 'active' },
      { name: 'Typography Poster & Editorial Bundle', type: 'sidebar', place: 'sidebar_top', headline: 'Trendy Brutalist & Minimalist Fonts', cta: 'Explore Fonts', bid: 35, total: 28000, daily: 2800, status: 'rejected' },
      { name: 'Automated Token Sync Service', type: 'sponsored_listing', place: 'browse_grid', headline: 'Sync Figma Variables to GitHub PRs', cta: 'Consult Engineer', bid: 95, total: 85000, daily: 8500, status: 'active' },
      { name: 'SaaS Pricing Calculator Widget', type: 'search_result', place: 'search_top', headline: 'Interactive Micro-Widget Components', cta: 'Download Widget', bid: 50, total: 42000, daily: 4200, status: 'active' },
      { name: 'AI Chatbot & Prompt Interface Pack', type: 'homepage_banner', place: 'homepage_top', headline: 'Modern AI Agent Chat Interfaces', cta: 'Inspect Screens', bid: 85, total: 95000, daily: 9500, status: 'active' },
      { name: 'Creator Portfolio Template Suite', type: 'sidebar', place: 'sidebar_top', headline: 'Stand Out with Animated Web Portfolios', cta: 'View Template', bid: 45, total: 38000, daily: 3800, status: 'active' },
      { name: 'Bespoke Illustration Pack Sprint', type: 'sponsored_listing', place: 'browse_grid', headline: 'Custom Vector Characters & Scenes', cta: 'Book Artist', bid: 90, total: 80000, daily: 8000, status: 'active' },
      { name: 'Upcoming Holiday Season Ad Campaign', type: 'homepage_banner', place: 'homepage_top', headline: 'Reserve Sponsored Placement Early', cta: 'Learn More', bid: 100, total: 150000, daily: 15000, status: 'draft' }
    ];

    let adCount = 0;
    for (const a of adBlueprints) {
      const adv = sellers[adCount % sellers.length];
      const imp = a.status === 'active' || a.status === 'completed' ? randomInt(4000, 48000) : 0;
      const clicks = imp > 0 ? Math.round(imp * randomFloat(0.02, 0.08)) : 0;
      const conv = clicks > 0 ? Math.round(clicks * randomFloat(0.05, 0.15)) : 0;
      const spend = clicks > 0 ? Math.min(a.total, clicks * a.bid) : 0;

      await client.query(`
        INSERT INTO advertisements (
          name, advertiser_id, ad_type, placement, creative_url, headline,
          description, cta_text, destination_url, billing_model, bid_amount_cents,
          total_budget_cents, daily_budget_cents, current_spend_cents, impressions,
          clicks, conversions, start_date, end_date, status, rejection_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'cpc', $10, $11, $12, $13, $14, $15, $16, NOW() - INTERVAL '10 days', NOW() + INTERVAL '45 days', $17, $18);
      `, [a.name, adv.id, a.type, a.place, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80', a.headline, `${a.headline}. Curated creative resource on Desigot.`, a.cta, '/browse', a.bid, a.total, a.daily, spend, imp, clicks, conv, a.status, a.status === 'rejected' ? 'Creative resolution does not meet guidelines.' : null]);
      adCount++;
    }
    console.log(`✅ Seeded ${adCount} advertisements.`);

    // ──────────────────────────────────────────────────────────────────────────
    // K. SEED MARKETING AUDIT LOGS (at least 100)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📜 Seeding Marketing Audit Logs...');
    await client.query(`DELETE FROM marketing_audit_logs;`);

    const auditActions = [
      { action: 'coupon_created', entity: 'coupon', desc: 'Created promotional coupon code' },
      { action: 'coupon_updated', entity: 'coupon', desc: 'Updated coupon expiration date and max discount' },
      { action: 'coupon_activated', entity: 'coupon', desc: 'Activated coupon for public checkout use' },
      { action: 'coupon_deactivated', entity: 'coupon', desc: 'Deactivated expired or depleted coupon' },
      { action: 'campaign_published', entity: 'campaign', desc: 'Published discount campaign to marketplace' },
      { action: 'campaign_paused', entity: 'campaign', desc: 'Temporarily paused campaign budget spend' },
      { action: 'product_featured', entity: 'featured_product', desc: 'Added digital product to homepage hero placement' },
      { action: 'service_featured', entity: 'featured_service', desc: 'Featured custom design service with priority display' },
      { action: 'banner_published', entity: 'banner', desc: 'Published responsive homepage hero banner' },
      { action: 'banner_scheduled', entity: 'banner', desc: 'Scheduled upcoming seasonal promotional banner' },
      { action: 'section_reordered', entity: 'section', desc: 'Reordered homepage promotional layout hierarchy' },
      { action: 'newsletter_scheduled', entity: 'newsletter', desc: 'Scheduled monthly newsletter to 100+ subscribers' },
      { action: 'affiliate_approved', entity: 'affiliate', desc: 'Approved creator affiliate application with 10% commission' },
      { action: 'commission_approved', entity: 'affiliate_commission', desc: 'Approved qualified affiliate commission for completed order' },
      { action: 'referral_reward_approved', entity: 'referral_reward', desc: 'Approved customer referral reward upon delivery completion' },
      { action: 'advertisement_approved', entity: 'advertisement', desc: 'Approved sponsored listing creative and CPC budget' }
    ];

    let auditCount = 0;
    for (let i = 0; i < 110; i++) {
      const a = auditActions[i % auditActions.length];
      const admin = randomItem(admins);
      const ip = `192.168.1.${randomInt(10, 240)}`;
      const meta = { action_source: 'admin_dashboard', batch_id: crypto.randomBytes(4).toString('hex') };

      await client.query(`
        INSERT INTO marketing_audit_logs (
          action_type, entity_type, entity_id, user_id, description, metadata, ip_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - ($8 || ' hours')::interval);
      `, [a.action, a.entity, seededCoupons[i % seededCoupons.length].id, admin.id, `${a.desc} [ref #${i + 1}]`, JSON.stringify(meta), ip, String(i * 2 + 1)]);
      auditCount++;
    }
    console.log(`✅ Seeded ${auditCount} marketing audit logs.`);

    console.log('🎉 Comprehensive Marketing & Promotions Seeding Completed Successfully!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedMarketing().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedMarketing;
