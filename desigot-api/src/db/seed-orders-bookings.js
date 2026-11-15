'use strict';
require('dotenv').config();
const { primaryPool } = require('./pool');
const crypto = require('crypto');

async function seedOrdersAndBookings() {
  console.log('==================================================================');
  console.log('🚀 SEEDING DESIGOT ORDERS & BOOKINGS MANAGEMENT SYSTEM 🚀');
  console.log('==================================================================\n');

  const client = await primaryPool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch available Buyers, Sellers, Admins, Listings, Products, Services
    const buyersRes = await client.query(`SELECT id, display_name, email FROM users WHERE role = 'buyer' AND deleted_at IS NULL ORDER BY created_at ASC`);
    const sellersRes = await client.query(`SELECT id, display_name, email FROM users WHERE (role = 'seller' OR seller_verified = TRUE) AND deleted_at IS NULL ORDER BY created_at ASC`);
    const adminsRes = await client.query(`SELECT id, display_name, email, role FROM users WHERE role IN ('superadmin', 'admin') AND deleted_at IS NULL`);
    const listingsRes = await client.query(`SELECT id, seller_id, title, listing_type, price_personal, price_commercial FROM listings WHERE status = 'approved' OR status IS NULL LIMIT 100`);
    const productsRes = await client.query(`SELECT id, seller_id, title, price_personal_cents, price_commercial_cents FROM digital_products LIMIT 30`);
    const servicesRes = await client.query(`SELECT id, seller_id, title, starting_price_cents FROM services LIMIT 60`);

    const buyers = buyersRes.rows;
    const sellers = sellersRes.rows;
    const admins = adminsRes.rows;
    const listings = listingsRes.rows;
    const products = productsRes.rows;
    const services = servicesRes.rows;

    console.log(`Entities found: ${buyers.length} buyers, ${sellers.length} sellers, ${admins.length} staff, ${listings.length} listings, ${products.length} products, ${services.length} services.`);

    if (buyers.length === 0 || sellers.length === 0 || listings.length === 0) {
      throw new Error('Required buyers, sellers, or listings not found in database. Seed users/services first.');
    }

    const superAdminId = admins.find(a => a.role === 'superadmin')?.id || admins[0]?.id;

    // Helper random choice
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Separate listings by type
    const assetListings = listings.filter(l => l.listing_type === 'asset');
    const serviceListings = listings.filter(l => l.listing_type === 'service');

    const fallbackAssetListing = assetListings[0] || listings[0];
    const fallbackServiceListing = serviceListings[0] || listings[0];

    // ── 2. SEED 100 DIGITAL PRODUCT ORDERS ──────────────────────────────────
    console.log('\n📦 Seeding 100 Digital Product Orders...');
    const digitalOrders = [];
    const digitalStatuses = [
      ...Array(10).fill('pending'),
      ...Array(10).fill('active'), // representing processing
      ...Array(65).fill('complete'),
      ...Array(5).fill('cancelled'),
      ...Array(5).fill('refunded'),
      ...Array(5).fill('refunded'), // partially refunded represented as refunded
    ];

    for (let i = 0; i < 100; i++) {
      const buyer = buyers[i % buyers.length];
      const listing = assetListings.length > 0 ? assetListings[i % assetListings.length] : fallbackAssetListing;
      const sellerId = listing.seller_id || sellers[i % sellers.length].id;
      const product = products.length > 0 ? products[i % products.length] : null;

      const st = digitalStatuses[i];
      const grossCents = listing.price_personal ? listing.price_personal * 100 : randInt(2900, 14900);
      const discountCents = i % 5 === 0 ? Math.round(grossCents * 0.15) : 0;
      const netCents = grossCents - discountCents;
      const platformFeeCents = Math.round(netCents * 0.15); // 15% platform commission
      const sellerPayoutCents = netCents - platformFeeCents;

      const daysAgo = randInt(1, 90);
      const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const completedDate = (st === 'complete') ? new Date(createdDate.getTime() + randInt(1, 48) * 3600 * 1000) : null;
      const cancelledDate = (st === 'cancelled') ? new Date(createdDate.getTime() + randInt(2, 24) * 3600 * 1000) : null;
      const refundedDate = (st === 'refunded') ? new Date(createdDate.getTime() + randInt(12, 72) * 3600 * 1000) : null;

      const orderRes = await client.query(
        `INSERT INTO orders (
          buyer_id, seller_id, listing_id, listing_title, listing_type, license_type,
          amount_cents, discount_cents, platform_fee_cents, seller_payout_cents, currency,
          status, stripe_payment_intent_id, idempotency_key, promo_code_used,
          inspection_ends_at, download_expires_at, created_at, updated_at,
          completed_at, cancelled_at, refunded_at
        ) VALUES (
          $1, $2, $3, $4, 'asset', $5,
          $6, $7, $8, $9, 'USD',
          $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19, $20
        ) RETURNING *`,
        [
          buyer.id,
          sellerId,
          listing.id,
          listing.title || 'Premium UI Design System Kit',
          pick(['personal', 'commercial', 'extended']),
          grossCents,
          discountCents,
          platformFeeCents,
          sellerPayoutCents,
          st,
          `pi_mock_digital_${crypto.randomBytes(8).toString('hex')}`,
          crypto.randomUUID(),
          discountCents > 0 ? 'DESIGOT15' : null,
          new Date(createdDate.getTime() + 14 * 24 * 3600 * 1000),
          new Date(createdDate.getTime() + 365 * 24 * 3600 * 1000),
          createdDate,
          new Date(createdDate.getTime() + 3600 * 1000),
          completedDate,
          cancelledDate,
          refundedDate,
        ]
      );

      const order = orderRes.rows[0];
      digitalOrders.push(order);

      // Seed itemized order_items
      await client.query(
        `INSERT INTO order_items (
          order_id, item_type, product_id, item_title, quantity,
          unit_price_cents, total_price_cents, currency, license_type
        ) VALUES ($1, 'asset', $2, $3, 1, $4, $5, 'USD', $6)`,
        [
          order.id,
          product ? product.id : null,
          listing.title || 'Digital Design Kit',
          grossCents,
          netCents,
          order.license_type,
        ]
      );
    }
    console.log(`✅ Seeded ${digitalOrders.length} Digital Product Orders & Order Items.`);

    // ── 3. SEED 100 SERVICE ORDERS ──────────────────────────────────────────
    console.log('\n💼 Seeding 100 Service Orders...');
    const serviceOrders = [];
    const serviceStatuses = [
      ...Array(15).fill('pending'),
      ...Array(35).fill('active'), // in-progress service projects
      ...Array(35).fill('complete'),
      ...Array(5).fill('cancelled'),
      ...Array(10).fill('disputed'),
    ];

    for (let i = 0; i < 100; i++) {
      const buyer = buyers[(i + 15) % buyers.length];
      const listing = serviceListings.length > 0 ? serviceListings[i % serviceListings.length] : fallbackServiceListing;
      const sellerId = listing.seller_id || sellers[(i + 3) % sellers.length].id;
      const srv = services.length > 0 ? services[i % services.length] : null;

      const st = serviceStatuses[i];
      const grossCents = srv?.starting_price_cents || (listing.price_personal ? listing.price_personal * 100 : randInt(45000, 250000));
      const platformFeeCents = Math.round(grossCents * 0.12); // 12% platform fee
      const sellerPayoutCents = grossCents - platformFeeCents;

      const daysAgo = randInt(1, 120);
      const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const completedDate = (st === 'complete') ? new Date(createdDate.getTime() + randInt(7, 21) * 24 * 3600 * 1000) : null;
      const cancelledDate = (st === 'cancelled') ? new Date(createdDate.getTime() + randInt(1, 3) * 24 * 3600 * 1000) : null;

      const orderRes = await client.query(
        `INSERT INTO orders (
          buyer_id, seller_id, listing_id, listing_title, listing_type, license_type,
          amount_cents, discount_cents, platform_fee_cents, seller_payout_cents, currency,
          status, stripe_payment_intent_id, idempotency_key, promo_code_used,
          inspection_ends_at, download_expires_at, created_at, updated_at,
          completed_at, cancelled_at
        ) VALUES (
          $1, $2, $3, $4, 'service', 'commercial',
          $5, 0, $6, $7, 'USD',
          $8, $9, $10, null,
          $11, $12, $13, $14,
          $15, $16
        ) RETURNING *`,
        [
          buyer.id,
          sellerId,
          listing.id,
          srv?.title || listing.title || 'Bespoke Mobile App UI/UX Design System',
          grossCents,
          platformFeeCents,
          sellerPayoutCents,
          st,
          `pi_mock_service_${crypto.randomBytes(8).toString('hex')}`,
          crypto.randomUUID(),
          new Date(createdDate.getTime() + 30 * 24 * 3600 * 1000),
          new Date(createdDate.getTime() + 365 * 24 * 3600 * 1000),
          createdDate,
          new Date(createdDate.getTime() + 24 * 3600 * 1000),
          completedDate,
          cancelledDate,
        ]
      );

      const order = orderRes.rows[0];
      serviceOrders.push(order);

      // Seed order item
      await client.query(
        `INSERT INTO order_items (
          order_id, item_type, service_id, item_title, quantity,
          unit_price_cents, total_price_cents, currency, license_type, metadata
        ) VALUES ($1, 'service', $2, $3, 1, $4, $4, 'USD', 'commercial', $5)`,
        [
          order.id,
          srv ? srv.id : null,
          order.listing_title,
          grossCents,
          JSON.stringify({ package: pick(['Standard Scope', 'Enterprise Deliverable', 'Sprint Package']), turnaround_days: randInt(5, 14) })
        ]
      );
    }
    console.log(`✅ Seeded ${serviceOrders.length} Service Orders & Order Items.`);

    // ── 4. SEED 100 BOOKINGS ────────────────────────────────────────────────
    console.log('\n📅 Seeding 100 Bookings...');
    const bookingStatuses = [
      ...Array(15).fill('requested'),
      ...Array(15).fill('pending_confirmation'),
      ...Array(20).fill('confirmed'),
      ...Array(15).fill('in_progress'),
      ...Array(20).fill('completed'),
      ...Array(10).fill('cancelled'),
      ...Array(5).fill('rejected'),
    ];

    const timeSlots = [
      { start: '09:00:00', end: '09:45:00' },
      { start: '10:00:00', end: '10:45:00' },
      { start: '11:00:00', end: '11:45:00' },
      { start: '14:00:00', end: '14:45:00' },
      { start: '15:00:00', end: '15:45:00' },
      { start: '16:00:00', end: '16:45:00' },
      { start: '17:00:00', end: '17:45:00' },
    ];

    for (let i = 0; i < 100; i++) {
      const buyer = buyers[i % buyers.length];
      const seller = sellers[i % sellers.length];
      const srv = services.length > 0 ? services[i % services.length] : null;
      const bStatus = bookingStatuses[i];
      const slot = timeSlots[i % timeSlots.length];

      // Schedule appointment across distinct dates to avoid overlap for the same seller
      const dayOffset = Math.floor(i / timeSlots.length) + 1;
      const isPast = ['completed', 'cancelled', 'rejected'].includes(bStatus);
      const apptDate = isPast 
        ? new Date(Date.now() - (dayOffset * 24 * 3600 * 1000)).toISOString().split('T')[0]
        : new Date(Date.now() + (dayOffset * 24 * 3600 * 1000)).toISOString().split('T')[0];

      const pStatus = ['requested', 'pending_confirmation'].includes(bStatus) ? 'pending' : (bStatus === 'cancelled' ? 'refunded' : 'paid');

      await client.query(
        `INSERT INTO customer_bookings (
          booking_number, customer_id, seller_id, service_id, service_title,
          appointment_date, start_time, end_time, timezone, amount_cents, currency,
          payment_status, booking_status, meeting_link, customer_notes, admin_notes,
          cancellation_reason, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, 'America/New_York', $9, 'USD',
          $10, $11, $12, $13, $14,
          $15, NOW() - ($16 || ' days')::INTERVAL, NOW()
        )`,
        [
          `BKG-2026-${String(i + 101).padStart(4, '0')}`,
          buyer.id,
          seller.id,
          srv ? srv.id : null,
          srv ? srv.title : '1-on-1 Design Architecture Consultation',
          apptDate,
          slot.start,
          slot.end,
          randInt(12000, 35000),
          pStatus,
          bStatus,
          `https://meet.google.com/desigot-bkg-${i + 1}`,
          'Customer requested deep-dive review of responsive wireframes and brand typography.',
          bStatus === 'confirmed' ? 'Verified by platform booking coordinator.' : null,
          bStatus === 'cancelled' ? 'Customer requested reschedule due to conflict.' : (bStatus === 'rejected' ? 'Designer unavailable for requested slot.' : null),
          String(randInt(1, 60)),
        ]
      );
    }
    console.log(`✅ Seeded 100 Bookings.`);

    // ── 5. SEED 40 ACTIVE PROJECTS & MILESTONES ─────────────────────────────
    console.log('\n🚀 Seeding 40 Active Projects and Milestones...');
    const projectOrders = serviceOrders.slice(0, 40);
    const projectStatuses = ['active', 'in_revision', 'proposal', 'briefing'];

    for (let i = 0; i < projectOrders.length; i++) {
      const o = projectOrders[i];
      const pStatus = projectStatuses[i % projectStatuses.length];

      const projRes = await client.query(
        `INSERT INTO projects (
          order_id, buyer_id, seller_id, title, description, status,
          deadline, revision_limit, revisions_used, total_budget_cents, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          NOW() + ($7 || ' days')::INTERVAL, 3, $8, $9, NOW() - ($10 || ' days')::INTERVAL, NOW()
        ) RETURNING *`,
        [
          o.id,
          o.buyer_id,
          o.seller_id,
          `Project: ${o.listing_title}`,
          'Full-cycle design deliverables including wireframing, high-fidelity prototypes, components library, and developer handoff documentation.',
          pStatus,
          String(randInt(10, 30)),
          randInt(0, 2),
          o.amount_cents,
          String(randInt(5, 30)),
        ]
      );

      const proj = projRes.rows[0];

      // Seed 3 milestones per project
      const m1Status = 'approved';
      const m2Status = pStatus === 'active' ? 'in_progress' : (pStatus === 'in_revision' ? 'submitted' : 'not_started');
      const m3Status = 'not_started';

      const mAmounts = [Math.round(proj.total_budget_cents * 0.3), Math.round(proj.total_budget_cents * 0.4), Math.round(proj.total_budget_cents * 0.3)];

      await client.query(
        `INSERT INTO project_milestones (project_id, title, description, amount_cents, status, due_date, sort_order)
         VALUES 
          ($1, 'Phase 1: Wireframes & Information Architecture', 'UX user journeys and low-fi screens', $2, $3, NOW() - INTERVAL '5 days', 1),
          ($1, 'Phase 2: High-Fidelity UI & Design System', 'Component tokens and responsive views', $4, $5, NOW() + INTERVAL '7 days', 2),
          ($1, 'Phase 3: Prototype & Developer Handoff', 'Figma interactive prototype and specs', $6, $7, NOW() + INTERVAL '18 days', 3)`,
        [
          proj.id,
          mAmounts[0], m1Status,
          mAmounts[1], m2Status,
          mAmounts[2], m3Status,
        ]
      );
    }
    console.log(`✅ Seeded 40 Projects with 120 Milestones.`);

    // ── 6. SEED 30 SUBMITTED DELIVERIES ─────────────────────────────────────
    console.log('\n📤 Seeding 30 Submitted Deliveries...');
    const deliveryStatuses = [
      ...Array(10).fill('submitted'),
      ...Array(8).fill('under_review'),
      ...Array(8).fill('approved'),
      ...Array(4).fill('revision_requested'),
    ];

    const deliveries = [];
    for (let i = 0; i < 30; i++) {
      const o = serviceOrders[i % serviceOrders.length];
      const dStatus = deliveryStatuses[i];

      const delRes = await client.query(
        `INSERT INTO order_deliveries (
          order_id, seller_id, delivery_version, title, description,
          file_urls, external_links, attachment_count, review_status,
          reviewed_by_id, review_notes, submitted_at, reviewed_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, 2, $8,
          $9, $10, NOW() - ($11 || ' hours')::INTERVAL, $12
        ) RETURNING *`,
        [
          o.id,
          o.seller_id,
          1,
          `Milestone Delivery v1: ${o.listing_title}`,
          'Attached is the complete Figma deliverable archive, design assets package (SVG/PNG), and interactive prototype link.',
          ['https://storage.desigot.com/deliveries/figma-archive-v1.zip', 'https://storage.desigot.com/deliveries/design-specs.pdf'],
          ['https://figma.com/file/mock-desigot-project'],
          dStatus,
          dStatus === 'approved' ? superAdminId : null,
          dStatus === 'approved' ? 'Delivery verified against requirements. Clean components and auto-layout.' : (dStatus === 'revision_requested' ? 'Mobile responsive artboards required revision.' : null),
          String(randInt(4, 72)),
          dStatus === 'approved' ? new Date() : null,
        ]
      );

      deliveries.push(delRes.rows[0]);
    }
    console.log(`✅ Seeded ${deliveries.length} Deliveries.`);

    // ── 7. SEED 20 REVISION REQUESTS ────────────────────────────────────────
    console.log('\n🔄 Seeding 20 Revision Requests...');
    const revisionStatuses = ['requested', 'in_progress', 'submitted', 'approved'];

    for (let i = 0; i < 20; i++) {
      const del = deliveries[i % deliveries.length];
      const revStatus = revisionStatuses[i % revisionStatuses.length];

      await client.query(
        `INSERT INTO order_revisions (
          delivery_id, order_id, requested_by_id, revision_number,
          reason, requested_changes, status, due_date
        ) VALUES (
          $1, $2, $3, 1,
          $4, $5, $6, NOW() + ($7 || ' days')::INTERVAL
        )`,
        [
          del.id,
          del.order_id,
          buyers[i % buyers.length].id,
          pick(['Brand Palette Alignment', 'Mobile Breakpoint Adjustments', 'Component Variant Completeness', 'Accessibility Contrast Checks']),
          'Please ensure the dark-mode primary buttons have sufficient contrast (WCAG AAA) and update the modal drawer behavior for screens < 768px.',
          revStatus,
          String(randInt(2, 5)),
        ]
      );
    }
    console.log(`✅ Seeded 20 Revision Requests.`);

    // ── 8. SEED 20 CANCELLED ORDERS & CANCELLATION RECORDS ──────────────────
    console.log('\n🚫 Seeding 20 Cancellation Records...');
    const cancelledOrders = [...digitalOrders.filter(o => o.status === 'cancelled'), ...serviceOrders.filter(o => o.status === 'cancelled')];

    for (let i = 0; i < Math.min(20, cancelledOrders.length); i++) {
      const o = cancelledOrders[i];
      await client.query(
        `INSERT INTO order_cancellations (
          order_id, requested_by_id, reason_category, reason_details,
          refund_eligible, refund_amount_cents, refund_processed, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'cancelled'
        )`,
        [
          o.id,
          o.buyer_id,
          pick(['Customer Change of Scope', 'Technical Incompatibility', 'Seller Inactive', 'Duplicate Order']),
          'Mutual agreement between customer and platform staff to void order.',
          true,
          o.amount_cents,
          true,
        ]
      );
    }
    console.log(`✅ Seeded 20 Order Cancellation Records.`);

    // ── 9. SEED 15 DISPUTES ─────────────────────────────────────────────────
    console.log('\n⚖️ Seeding 15 Disputes...');
    const disputeTargetOrders = serviceOrders.slice(20, 35); // 15 unique orders
    const disputeReasons = ['not_as_described', 'non_delivery', 'quality_issue', 'unauthorized', 'other'];
    const disputeStatuses = ['open', 'under_review', 'resolved', 'cancelled'];

    for (let i = 0; i < 15; i++) {
      const o = disputeTargetOrders[i];
      const dReason = disputeReasons[i % disputeReasons.length];
      const dStatus = disputeStatuses[i % disputeStatuses.length];

      await client.query(
        `INSERT INTO disputes (
          order_id, opened_by_id, resolved_by_id, status, reason,
          description, evidence_keys, outcome, outcome_notes, refund_amount_cents,
          opened_at, sla_deadline, resolved_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          NOW() - ($11 || ' days')::INTERVAL, NOW() + INTERVAL '48 hours', $12
        )`,
        [
          o.id,
          o.buyer_id,
          dStatus === 'resolved' ? superAdminId : null,
          dStatus,
          dReason,
          'Deliverable did not adhere to the agreed design system tokens and lacked tablet breakpoint layouts specified in scope.',
          ['evidence/brief_contract.pdf', 'evidence/slack_chat_export.png'],
          dStatus === 'resolved' ? 'partial_refund' : null,
          dStatus === 'resolved' ? 'Partial settlement approved by dispute mediation team.' : null,
          dStatus === 'resolved' ? Math.round(o.amount_cents * 0.5) : 0,
          String(randInt(2, 14)),
          dStatus === 'resolved' ? new Date() : null,
        ]
      );
    }
    console.log(`✅ Seeded 15 Disputes.`);

    // ── 10. SEED 30 CUSTOM QUOTES & NEGOTIATIONS ────────────────────────────
    console.log('\n💬 Seeding 30 Custom Quotes...');
    const quoteStatuses = [
      ...Array(5).fill('sent'),
      ...Array(5).fill('viewed'),
      ...Array(5).fill('negotiation'),
      ...Array(10).fill('accepted'),
      ...Array(5).fill('converted_to_order'),
    ];

    for (let i = 0; i < 30; i++) {
      const customer = buyers[i % buyers.length];
      const seller = sellers[i % sellers.length];
      const qStatus = quoteStatuses[i];
      const proposedCents = randInt(75000, 350000);
      const isConverted = qStatus === 'converted_to_order';

      const quoteRes = await client.query(
        `INSERT INTO custom_quotes (
          quote_number, customer_id, seller_id, service_category,
          project_title, project_description, requirements,
          proposed_amount_cents, currency, delivery_days, revisions_included,
          status, expires_at, converted_order_id, admin_notes
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, 'USD', $9, 3,
          $10, NOW() + ($11 || ' days')::INTERVAL, $12, $13
        ) RETURNING *`,
        [
          `QUO-2026-${String(i + 1).padStart(4, '0')}`,
          customer.id,
          seller.id,
          pick(['Fintech Dashboard', 'SaaS App UI/UX', 'E-commerce Redesign', 'Healthcare Portal']),
          `Custom Proposal: ${pick(['Enterprise Multi-tenant Platform', 'Mobile Banking iOS Design', 'Design Token System Architecture'])}`,
          'Tailored enterprise package with custom micro-interactions, full Lottie animations, and dedicated component library in Figma.',
          'Deliverables include Figma file, design documentation, and weekly syncs.',
          proposedCents,
          randInt(14, 30),
          qStatus,
          String(randInt(7, 21)),
          isConverted ? serviceOrders[i % serviceOrders.length].id : null,
          'Custom quote reviewed and endorsed by enterprise account team.',
        ]
      );

      const quote = quoteRes.rows[0];

      // Add negotiation messages
      await client.query(
        `INSERT INTO custom_quote_negotiations (quote_id, sender_id, proposed_price_cents, proposed_timeline_days, message)
         VALUES 
          ($1, $2, $3, 21, 'Hello! Here is the initial proposal covering all specified modules.'),
          ($1, $4, $5, 18, 'Thank you! Can we expedite the delivery to 18 days if we streamline sprint 2?')`,
        [
          quote.id,
          seller.id,
          proposedCents,
          customer.id,
          proposedCents - 5000,
        ]
      );
    }
    console.log(`✅ Seeded 30 Custom Quotes with Negotiation Threads.`);

    // ── 11. SEED 500 ORDER STATUS HISTORY EVENTS ────────────────────────────
    console.log('\n📜 Seeding 500 Order History Events...');
    const allOrders = [...digitalOrders, ...serviceOrders];
    const actions = [
      { prev: null, next: 'pending', act: 'order.created', reason: 'Customer initiated checkout.' },
      { prev: 'pending', next: 'active', act: 'payment.completed', reason: 'Stripe webhook verified payment intent.' },
      { prev: 'active', next: 'active', act: 'project.assigned', reason: 'Lead operations staff assigned project.' },
      { prev: 'active', next: 'active', act: 'delivery.submitted', reason: 'Seller uploaded archive version 1.' },
      { prev: 'active', next: 'active', act: 'revision.requested', reason: 'Customer requested contrast tweak.' },
      { prev: 'active', next: 'complete', act: 'delivery.approved', reason: 'Deliverable signed off.' },
      { prev: 'active', next: 'cancelled', act: 'order.cancelled', reason: 'Order cancelled upon mutual consent.' },
      { prev: 'complete', next: 'refunded', act: 'refund.processed', reason: 'Administrator approved refund.' },
    ];

    for (let i = 0; i < 500; i++) {
      const o = allOrders[i % allOrders.length];
      const act = actions[i % actions.length];

      await client.query(
        `INSERT INTO order_status_history (
          order_id, previous_status, new_status, action, performed_by_id, reason, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW() - ($7 || ' hours')::INTERVAL
        )`,
        [
          o.id,
          act.prev,
          act.next,
          act.act,
          pick([o.buyer_id, o.seller_id, superAdminId]),
          act.reason,
          String(randInt(1, 720)),
        ]
      );
    }
    console.log(`✅ Seeded 500 Order Status History Events.`);

    // ── 12. SEED INTERNAL STAFF NOTES & ASSIGNMENTS ─────────────────────────
    console.log('\n📝 Seeding Staff Notes & Operational Assignments...');
    for (let i = 0; i < 50; i++) {
      const o = allOrders[i % allOrders.length];
      await client.query(
        `INSERT INTO order_internal_notes (order_id, author_id, note, visibility)
         VALUES ($1, $2, $3, 'staff_only')`,
        [
          o.id,
          superAdminId,
          `Operational review #${i + 1}: Customer confirmed expedited delivery requirements with lead designer.`,
        ]
      );

      await client.query(
        `INSERT INTO order_assignments (order_id, assigned_by_id, assigned_to_id, role_type, notes)
         VALUES ($1, $2, $3, 'order_manager', 'Assigned to oversee milestone review and delivery deadline.')`,
        [
          o.id,
          superAdminId,
          admins[(i + 1) % admins.length]?.id || superAdminId,
        ]
      );
    }
    console.log(`✅ Seeded 50 Internal Staff Notes and 50 Operational Assignments.`);

    // Commit Transaction
    await client.query('COMMIT');
    console.log('\n🎉 ALL ORDERS & BOOKINGS RELATIONAL SEED DATA INSERTED SUCCESSFULLY! 🎉');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding error:', err);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
}

seedOrdersAndBookings().catch(err => {
  console.error('Fatal seeding script failure:', err);
  process.exit(1);
});
