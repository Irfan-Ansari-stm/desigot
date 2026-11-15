'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const config = require('../config');

const FIRST_20_NAMES = [
  { first: 'Rahul', last: 'Sharma' },
  { first: 'Priya', last: 'Verma' },
  { first: 'Amit', last: 'Kumar' },
  { first: 'Neha', last: 'Singh' },
  { first: 'Arjun', last: 'Patel' },
  { first: 'Sneha', last: 'Gupta' },
  { first: 'Rohan', last: 'Mehta' },
  { first: 'Ananya', last: 'Das' },
  { first: 'Vikram', last: 'Yadav' },
  { first: 'Kavya', last: 'Reddy' },
  { first: 'Aditya', last: 'Mishra' },
  { first: 'Pooja', last: 'Agarwal' },
  { first: 'Karan', last: 'Malhotra' },
  { first: 'Isha', last: 'Kapoor' },
  { first: 'Saurabh', last: 'Joshi' },
  { first: 'Meera', last: 'Nair' },
  { first: 'Abhishek', last: 'Roy' },
  { first: 'Riya', last: 'Choudhary' },
  { first: 'Manish', last: 'Tiwari' },
  { first: 'Simran', last: 'Kaur' },
];

const ADDITIONAL_FIRST = [
  'Elena', 'Marcus', 'Chloe', 'Daniel', 'Sophia', 'Liam', 'Fatima', 'Oliver', 'Yuki', 'Emma',
  'Lucas', 'Aisha', 'Noah', 'Isabella', 'Ethan', 'Mia', 'William', 'Charlotte', 'Benjamin', 'Harper',
  'Alexander', 'Amara', 'Mateo', 'Zoe', 'James', 'Aria', 'Henry', 'Evelyn', 'Sebastian', 'Luna',
  'Jack', 'Scarlett', 'Owen', 'Grace', 'Samuel', 'Chloe', 'Leo', 'Penelope', 'David', 'Layla',
  'Gabriel', 'Nora', 'Carter', 'Hazel', 'Jayden', 'Lily', 'John', 'Ellie', 'Luke', 'Violet',
  'Anthony', 'Aurora', 'Isaac', 'Savannah', 'Dylan', 'Brooklyn', 'Wyatt', 'Bella', 'Andrew', 'Claire',
  'Joshua', 'Skylar', 'Christopher', 'Lucy', 'Grayson', 'Paisley', 'Julian', 'Everly', 'Max', 'Anna',
  'Christian', 'Caroline', 'Hunter', 'Nova', 'Levi', 'Genesis', 'Jonathan', 'Emilia', 'Isaiah', 'Kennedy'
];

const ADDITIONAL_LAST = [
  'Rostova', 'Vance', 'Bennett', 'Kim', 'Martinez', 'OConnor', 'AlSayed', 'Hansen', 'Tanaka', 'Watson',
  'Silva', 'Diallo', 'Schmidt', 'Rossi', 'Clark', 'Andersen', 'White', 'Dubois', 'Taylor', 'Lee',
  'Petrov', 'Mendoza', 'Kovacs', 'Novak', 'Moreau', 'Larsen', 'Nielsen', 'Morales', 'Castillo', 'Ortega',
  'Sato', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida',
  'Larsson', 'Berg', 'Lind', 'Holm', 'Karlsson', 'Nilsson', 'Eriksson', 'Johansson', 'Andersson', 'Olsson',
  'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Bauer', 'Richter',
  'Dubois', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel',
  'Gomez', 'Fernandez', 'Lopez', 'Diaz', 'Perez', 'Garcia', 'Sanchez', 'Romero', 'Torres', 'Ramirez'
];

const CITIES = [
  { city: 'San Francisco', state: 'CA', country: 'United States', postal: '94107' },
  { city: 'New York', state: 'NY', country: 'United States', postal: '10001' },
  { city: 'Austin', state: 'TX', country: 'United States', postal: '78701' },
  { city: 'Seattle', state: 'WA', country: 'United States', postal: '98101' },
  { city: 'London', state: 'Greater London', country: 'United Kingdom', postal: 'EC1A 1BB' },
  { city: 'Berlin', state: 'Berlin', country: 'Germany', postal: '10115' },
  { city: 'Toronto', state: 'ON', country: 'Canada', postal: 'M5H 2N2' },
  { city: 'Sydney', state: 'NSW', country: 'Australia', postal: '2000' },
  { city: 'Singapore', state: 'Singapore', country: 'Singapore', postal: '018989' },
  { city: 'Bangalore', state: 'Karnataka', country: 'India', postal: '560001' },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', postal: '400001' },
  { city: 'Tokyo', state: 'Tokyo', country: 'Japan', postal: '100-0001' },
];

const TAGS = [
  { name: 'New Customer', slug: 'new-customer', color: '#10b981', description: 'Registered in the last 14 days' },
  { name: 'Active Customer', slug: 'active-customer', color: '#3b82f6', description: 'Frequently engaging with platform' },
  { name: 'High Value', slug: 'high-value', color: '#8b5cf6', description: 'Lifetime spending over $1,000' },
  { name: 'Frequent Buyer', slug: 'frequent-buyer', color: '#6366f1', description: 'More than 5 completed transactions' },
  { name: 'Service Customer', slug: 'service-customer', color: '#ec4899', description: 'Purchases design services & consultations' },
  { name: 'Digital Product Buyer', slug: 'digital-product-buyer', color: '#06b6d4', description: 'Purchases UI kits and Figma bundles' },
  { name: 'Inactive', slug: 'inactive', color: '#64748b', description: 'No login in 45+ days' },
  { name: 'VIP', slug: 'vip', color: '#f59e0b', description: 'Enterprise tier client with dedicated account support' },
  { name: 'Support Required', slug: 'support-required', color: '#ef4444', description: 'Has unresolved tickets or inquiries' },
  { name: 'Complaint History', slug: 'complaint-history', color: '#f97316', description: 'Previous disputes or escalations' },
  { name: 'Verified', slug: 'verified', color: '#14b8a6', description: 'Identity and payment method verified' },
  { name: 'Business Customer', slug: 'business-customer', color: '#84cc16', description: 'Purchasing under corporate VAT/tax entity' },
  { name: 'International', slug: 'international', color: '#a855f7', description: 'Located outside domestic jurisdiction' },
  { name: 'Refund History', slug: 'refund-history', color: '#e11d48', description: 'Received at least 1 refund' },
  { name: 'At Risk', slug: 'at-risk', color: '#d97706', description: 'Engagement drop indicating churn potential' },
];

const COMPLAINT_TOPICS = [
  { category: 'order', subject: 'Digital asset download archive corrupted', priority: 'high', desc: 'When extracting the .zip archive on macOS Archive Utility, it errors out stating checksum mismatch.' },
  { category: 'service', subject: 'Design milestone delayed past delivery SLA', priority: 'urgent', desc: 'The seller promised the Figma component review by yesterday 5 PM EST, but no update has been provided.' },
  { category: 'payment', subject: 'Charged twice on Stripe checkout for Commercial license', priority: 'urgent', desc: 'My bank statement displays duplicate authorizations for $129.00 on the same order.' },
  { category: 'booking', subject: 'Consultation Zoom link expired or invalid', priority: 'normal', desc: 'I scheduled a 45-min UX design review session for 2:00 PM, but the meeting link returns a 404.' },
  { category: 'digital_product', subject: 'Missing Figma variable tokens in asset bundle', priority: 'normal', desc: 'The product description mentions dark mode tokens, but the file only contains raw hex colors.' },
  { category: 'seller', subject: 'Seller unresponsive in project chat', priority: 'high', desc: 'Sent three messages regarding color adjustments over 48 hours without reply.' },
  { category: 'account', subject: 'Cannot update primary billing address in profile', priority: 'low', desc: 'When saving European VAT number, the form resets without confirmation message.' },
  { category: 'technical', subject: 'Browser crash during 3D model WebGL preview', priority: 'low', desc: 'The live 3D preview causes WebGL context loss on Chrome v124.' },
];

async function seedCustomers() {
  const pool = new Pool({
    connectionString: config.db.primary,
    ssl: config.db.ssl,
  });

  const client = await pool.connect();

  try {
    console.log('🌱 Starting Comprehensive Customer Management Seeding...');

    // 1. Seed Customer Tags
    console.log('🏷️  Seeding Customer Tags...');
    const tagIds = {};
    for (const t of TAGS) {
      const res = await client.query(
        `INSERT INTO customer_tags (name, slug, color, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, description = EXCLUDED.description
         RETURNING id, slug`,
        [t.name, t.slug, t.color, t.description]
      );
      tagIds[t.slug] = res.rows[0].id;
    }
    console.log(`✅ Seeded ${Object.keys(tagIds).length} customer tags.`);

    // 2. Fetch admin user & sellers
    const adminRes = await client.query(`SELECT id FROM users WHERE role IN ('admin', 'superadmin') LIMIT 3`);
    const adminId = adminRes.rows[0]?.id || '33535558-ccea-4acc-9c09-9c725959a52d';
    const supportAgentId = adminRes.rows[1]?.id || adminId;

    const sellerRes = await client.query(`SELECT id FROM users WHERE role = 'seller' OR role = 'admin' LIMIT 10`);
    const sellerIds = sellerRes.rows.map(r => r.id);

    // Fetch existing services & digital products
    const serviceRes = await client.query(`SELECT id, title, starting_price_cents, seller_id FROM services LIMIT 10`);
    const services = serviceRes.rows;

    const productRes = await client.query(`SELECT id, title, price_personal_cents, seller_id FROM digital_products LIMIT 10`);
    const digitalProducts = productRes.rows;

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 3. Generate 100 Customers (65 Active, 20 Inactive, 10 New, 5 Suspended)
    console.log('👥 Creating 100 unique Customer entities with profiles...');
    const customers = [];

    for (let i = 0; i < 100; i++) {
      let first, last;
      if (i < 20) {
        first = FIRST_20_NAMES[i].first;
        last = FIRST_20_NAMES[i].last;
      } else {
        first = ADDITIONAL_FIRST[(i - 20) % ADDITIONAL_FIRST.length];
        last = ADDITIONAL_LAST[(i - 20) % ADDITIONAL_LAST.length];
      }

      const email = `${first.toLowerCase()}.${last.toLowerCase()}${i > 19 ? i : ''}@example.com`;
      const displayName = `${first} ${last}`;
      const username = `${first.toLowerCase()}_${last.toLowerCase()}_${i}`;

      // Status distribution:
      // 0-64: Active (65)
      // 65-84: Inactive (20)
      // 85-94: Newly Registered (10)
      // 95-99: Suspended (5)
      let accountStatus = 'active';
      let isInactive = false;
      let isNew = false;
      let isSuspended = false;
      let suspensionReason = null;
      let lastLoginDate;
      let registrationDate;

      if (i < 65) {
        // Active
        registrationDate = new Date(Date.now() - (60 + (i * 3)) * 86400000);
        lastLoginDate = new Date(Date.now() - ((i % 12) + 1) * 86400000);
      } else if (i < 85) {
        // Inactive (no activity in 45-120 days)
        isInactive = true;
        registrationDate = new Date(Date.now() - (180 + i * 2) * 86400000);
        lastLoginDate = new Date(Date.now() - (45 + (i % 60)) * 86400000);
      } else if (i < 95) {
        // Newly Registered (1-7 days ago)
        isNew = true;
        registrationDate = new Date(Date.now() - (i - 84) * 86400000);
        lastLoginDate = new Date(Date.now() - ((i - 84) * 43200000));
      } else {
        // Suspended
        isSuspended = true;
        accountStatus = 'suspended';
        suspensionReason = 'Payment dispute chargeback threshold exceeded and velocity security alert.';
        registrationDate = new Date(Date.now() - 90 * 86400000);
        lastLoginDate = new Date(Date.now() - 25 * 86400000);
      }

      const phone = `+1 (555) ${100 + i}-${2000 + i}`;
      const loc = CITIES[i % CITIES.length];

      // Upsert into users table with role 'buyer'
      const userRes = await client.query(
        `INSERT INTO users 
         (email, display_name, username, first_name, last_name, phone, role, account_status, 
          password_hash, email_verified_at, timezone, locale, created_at, updated_at, last_login_at, suspension_reason)
         VALUES ($1, $2, $3, $4, $5, $6, 'buyer', $7, $8, $9, 'America/New_York', 'en_US', $10, NOW(), $11, $12)
         ON CONFLICT (email) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          account_status = EXCLUDED.account_status,
          last_login_at = EXCLUDED.last_login_at,
          suspension_reason = EXCLUDED.suspension_reason
         RETURNING id, email, display_name, account_status`,
        [
          email, displayName, username, first, last, phone, accountStatus,
          passwordHash, registrationDate, registrationDate, lastLoginDate, suspensionReason
        ]
      );
      const user = userRes.rows[0];
      customers.push({ ...user, first, last, loc, isInactive, isNew, isSuspended, registrationDate, lastLoginDate });

      // Upsert into customer_profiles
      const customerType = i % 7 === 0 ? 'business' : i % 15 === 0 ? 'vip' : 'individual';
      const companyName = customerType === 'business' ? `${last} Design Studio Inc.` : null;
      const spendingCents = isNew ? 0 : isInactive ? (1500 + i * 200) : (4500 + i * 1500);
      const ordersCount = isNew ? 0 : isInactive ? 1 : Math.max(1, (i % 6) + 1);
      const bookingsCount = isNew ? 0 : (i % 4);

      await client.query(
        `INSERT INTO customer_profiles
         (user_id, customer_type, company_name, country, state, city, postal_code, address_line1,
          preferred_language, timezone, email_verified, phone_verified, lifetime_spending_cents,
          total_orders_count, total_bookings_count, avg_rating_given, risk_score, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'English', 'UTC', true, true, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (user_id) DO UPDATE SET
          customer_type = EXCLUDED.customer_type,
          company_name = EXCLUDED.company_name,
          country = EXCLUDED.country,
          state = EXCLUDED.state,
          city = EXCLUDED.city,
          postal_code = EXCLUDED.postal_code,
          address_line1 = EXCLUDED.address_line1,
          lifetime_spending_cents = EXCLUDED.lifetime_spending_cents,
          total_orders_count = EXCLUDED.total_orders_count,
          total_bookings_count = EXCLUDED.total_bookings_count,
          risk_score = EXCLUDED.risk_score`,
        [
          user.id, customerType, companyName, loc.country, loc.state, loc.city, loc.postal,
          `${100 + i} Market Street, Suite ${10 + (i % 20)}`,
          spendingCents, ordersCount, bookingsCount, 4.85, isSuspended ? 85 : 5, registrationDate
        ]
      );

      // Clean customer sub-entities to make idempotent
      await client.query(`DELETE FROM customer_addresses WHERE customer_id = $1`, [user.id]);
      await client.query(`DELETE FROM customer_tag_assignments WHERE customer_id = $1`, [user.id]);

      // Seed 2 Addresses (Shipping + Billing)
      await client.query(
        `INSERT INTO customer_addresses (customer_id, address_type, is_default, recipient_name, phone, address_line1, city, state, postal_code, country)
         VALUES 
         ($1, 'shipping', true, $2, $3, $4, $5, $6, $7, $8),
         ($1, 'billing', false, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id, displayName, phone, `${100 + i} Market Street`, loc.city, loc.state, loc.postal, loc.country
        ]
      );

      // Assign Tags
      if (isNew && tagIds['new-customer']) {
        await client.query(`INSERT INTO customer_tag_assignments (customer_id, tag_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [user.id, tagIds['new-customer'], adminId]);
      } else if (isInactive && tagIds['inactive']) {
        await client.query(`INSERT INTO customer_tag_assignments (customer_id, tag_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [user.id, tagIds['inactive'], adminId]);
      } else if (!isSuspended && tagIds['active-customer']) {
        await client.query(`INSERT INTO customer_tag_assignments (customer_id, tag_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [user.id, tagIds['active-customer'], adminId]);
      }

      if (customerType === 'vip' && tagIds['vip']) {
        await client.query(`INSERT INTO customer_tag_assignments (customer_id, tag_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [user.id, tagIds['vip'], adminId]);
      }
      if (customerType === 'business' && tagIds['business-customer']) {
        await client.query(`INSERT INTO customer_tag_assignments (customer_id, tag_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [user.id, tagIds['business-customer'], adminId]);
      }
      if (spendingCents > 50000 && tagIds['high-value']) {
        await client.query(`INSERT INTO customer_tag_assignments (customer_id, tag_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [user.id, tagIds['high-value'], adminId]);
      }
    }
    console.log(`✅ Seeded 100 Customers with Profiles, Addresses, and Tags.`);

    // 4. Seed Bookings (80+)
    console.log('📅 Seeding 80+ customer service bookings...');
    const bookingStatuses = ['confirmed', 'confirmed', 'completed', 'completed', 'requested', 'rescheduled', 'in_progress', 'cancelled', 'disputed'];
    for (let b = 0; b < 85; b++) {
      const cust = customers[b % customers.length];
      const srv = services[b % services.length] || { id: null, title: 'UX Design System Consultation', starting_price_cents: 9900, seller_id: sellerIds[0] };
      const curSeller = srv.seller_id || sellerIds[b % sellerIds.length];
      const status = bookingStatuses[b % bookingStatuses.length];
      const appointmentDate = new Date(Date.now() + ((b % 30) - 10) * 86400000).toISOString().split('T')[0];
      const bookingNum = `DSGT-BK-${10000 + b}`;

      await client.query(
        `INSERT INTO customer_bookings
         (booking_number, customer_id, seller_id, service_id, service_title, appointment_date, start_time, end_time,
          amount_cents, payment_status, booking_status, meeting_link, customer_notes)
         VALUES ($1, $2, $3, $4, $5, $6, '14:00:00', '15:00:00', $7, 'paid', $8, $9, 'Looking forward to Figma wireframe audit.')
         ON CONFLICT (booking_number) DO NOTHING`,
        [
          bookingNum, cust.id, curSeller, srv.id, srv.title, appointmentDate,
          srv.starting_price_cents || 9900, status,
          `https://meet.desigot.com/room/${bookingNum}`
        ]
      );
    }
    console.log('✅ Seeded 85 Customer Bookings.');

    // 5. Seed 150+ Orders across customers
    console.log('🛒 Seeding 150+ realistic orders across customers...');
    const listingsRes = await client.query(`SELECT id, title, listing_type, price_personal FROM listings LIMIT 30`);
    const listings = listingsRes.rows;
    const insertedOrders = [];
    const orderStatuses = ['complete', 'complete', 'complete', 'active', 'pending', 'refunded', 'cancelled'];

    for (let o = 0; o < 155; o++) {
      const cust = customers[o % customers.length];
      const listing = listings[o % listings.length];
      const sellerId = sellerIds[o % sellerIds.length];
      const status = orderStatuses[o % orderStatuses.length];
      const amountCents = (listing?.price_personal || 4900);
      const discountCents = o % 5 === 0 ? 500 : 0;
      const platformFee = Math.round(amountCents * 0.15);
      const sellerPayout = amountCents - discountCents - platformFee;
      const orderDate = new Date(Date.now() - (1 + (o * 2)) * 86400000);

      const completedDate = status === 'complete' ? new Date(orderDate.getTime() + 2 * 86400000) : null;
      const refundedDate = status === 'refunded' ? new Date(orderDate.getTime() + 3 * 86400000) : null;
      const cancelledDate = status === 'cancelled' ? new Date(orderDate.getTime() + 1 * 86400000) : null;

      const ordRes = await client.query(
        `INSERT INTO orders (
           buyer_id, seller_id, listing_id, listing_title, listing_type, license_type,
           amount_cents, discount_cents, platform_fee_cents, seller_payout_cents,
           currency, status, created_at, completed_at, refunded_at, cancelled_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, 'commercial', $6, $7, $8, $9, 'USD', $10, $11, $12, $13, $14, $11)
         RETURNING id, buyer_id, seller_id, listing_id, listing_title, listing_type, amount_cents, status, created_at`,
        [
          cust.id, sellerId, listing?.id, listing?.title || 'Design Bundle', listing?.listing_type || 'asset',
          amountCents, discountCents, platformFee, sellerPayout, status, orderDate,
          completedDate, refundedDate, cancelledDate
        ]
      );
      insertedOrders.push(ordRes.rows[0]);
    }
    console.log(`✅ Seeded ${insertedOrders.length} Customer Orders.`);

    // 6. Seed Reviews (120+) linked to orders
    console.log('⭐ Seeding 120+ customer reviews linked to valid orders...');
    const reviewTitles = [
      'Superb craftsmanship and impeccable Figma components!',
      'Fast turnaround time, clean auto-layout and tokens.',
      'Exceeded expectations for our fintech dashboard revamp.',
      'Good baseline assets, but required minor font adjustments.',
      'Exceptional design service; will definitely re-hire!'
    ];

    for (let r = 0; r < Math.min(125, insertedOrders.length); r++) {
      const order = insertedOrders[r];
      const rating = (r % 5 === 0) ? 4 : 5;
      const title = reviewTitles[r % reviewTitles.length];
      const revStatus = (r % 10 === 0) ? 'pending_moderation' : (r % 25 === 0) ? 'hidden' : 'approved';

      await client.query(
        `INSERT INTO reviews
         (order_id, reviewer_id, subject_id, listing_id, review_type, rating_overall, rating_quality, rating_communication,
          rating_value, rating_delivery, review_text, status, moderation_note, created_at)
         VALUES ($1, $2, $3, $4, 'buyer_review', $5, 5, 5, 5, 5, $6, $7, 'Verified purchase review', $8)
         ON CONFLICT DO NOTHING`,
        [order.id, order.buyer_id, order.seller_id, order.listing_id, rating, `${title} Very satisfied with the deliverable quality.`, revStatus, order.created_at]
      );
    }
    console.log('✅ Seeded 125 Customer Reviews linked to orders.');

    // 6. Seed Complaints (40+) & Messages (100+)
    console.log('🎫 Seeding 40+ customer complaints and 100+ message threads...');
    const complaintStatuses = [
      'open', 'open', 'open', 'open', 'open', 'open', 'open', 'open', // 8 Open
      'pending', 'pending', 'pending', 'pending', 'pending', 'pending', // 6 Pending
      'assigned', 'assigned', 'assigned', 'assigned', 'assigned', 'assigned', 'assigned', 'assigned', // 8 Assigned
      'in_progress', 'in_progress', 'in_progress', 'in_progress', 'in_progress', 'in_progress', // 6 In Progress
      'waiting_for_customer', 'waiting_for_customer', 'waiting_for_customer', 'waiting_for_customer', // 4 Waiting
      'escalated', 'escalated', 'escalated', // 3 Escalated
      'resolved', 'resolved', 'resolved', 'resolved', 'resolved' // 5 Resolved
    ];

    const insertedComplaints = [];

    for (let c = 0; c < complaintStatuses.length; c++) {
      const cust = customers[c % customers.length];
      const topic = COMPLAINT_TOPICS[c % COMPLAINT_TOPICS.length];
      const status = complaintStatuses[c];
      const ticketNum = `TKT-${202600 + c}`;
      const sellerId = sellerIds[c % sellerIds.length];
      const assignedAgent = status === 'open' ? null : supportAgentId;
      const resolvedAt = status === 'resolved' ? new Date(Date.now() - 2 * 86400000) : null;
      const resolvedBy = status === 'resolved' ? supportAgentId : null;
      const resolutionDetails = status === 'resolved' ? 'Investigated archive integrity; seller provided fixed package and buyer confirmed receipt.' : null;

      const compRes = await client.query(
        `INSERT INTO customer_complaints
         (ticket_number, customer_id, assigned_agent_id, related_seller_id, category, priority, status, subject, description,
          resolution_details, resolved_at, resolved_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (ticket_number) DO UPDATE SET status = EXCLUDED.status
         RETURNING id, ticket_number, customer_id`,
        [
          ticketNum, cust.id, assignedAgent, sellerId,
          topic.category, topic.priority, status, topic.subject, topic.desc,
          resolutionDetails, resolvedAt, resolvedBy
        ]
      );

      const complaint = compRes.rows[0];
      insertedComplaints.push(complaint);

      // Seed 2-3 messages for each complaint
      // 1: Customer initial description
      await client.query(
        `INSERT INTO customer_complaint_messages (complaint_id, sender_id, sender_role, is_internal_note, message, created_at)
         VALUES ($1, $2, 'customer', false, $3, NOW() - INTERVAL '3 days')`,
        [complaint.id, cust.id, topic.desc]
      );

      // 2: Internal note (private to staff)
      if (status !== 'open') {
        await client.query(
          `INSERT INTO customer_complaint_messages (complaint_id, sender_id, sender_role, is_internal_note, message, created_at)
           VALUES ($1, $2, 'support_agent', true, 'Internal Note: Checked buyer purchase logs and verified payment transaction in Stripe.', NOW() - INTERVAL '2 days')`,
          [complaint.id, supportAgentId]
        );

        // 3: Agent response to customer
        await client.query(
          `INSERT INTO customer_complaint_messages (complaint_id, sender_id, sender_role, is_internal_note, message, created_at)
           VALUES ($1, $2, 'support_agent', false, 'Hello, we have contacted the creator and verified your transaction. Please allow up to 4 hours for the updated archive re-upload.', NOW() - INTERVAL '1 day')`,
          [complaint.id, supportAgentId]
        );
      }
    }
    console.log(`✅ Seeded ${insertedComplaints.length} Complaints with 100+ public & internal messages.`);

    // 7. Seed Customer Internal Notes (50+)
    console.log('📝 Seeding 50+ internal customer staff notes...');
    for (let n = 0; n < 55; n++) {
      const cust = customers[n % customers.length];
      await client.query(
        `INSERT INTO customer_internal_notes (customer_id, admin_id, note, visibility, created_at)
         VALUES ($1, $2, $3, 'staff_only', NOW() - INTERVAL '10 days')`,
        [
          cust.id, adminId,
          `Customer contacted enterprise sales regarding high-volume multi-seat licensing. High priority account.`
        ]
      );
    }
    console.log('✅ Seeded 55 Customer Internal Notes.');

    // 8. Seed Customer Activity Events (500+)
    console.log('⚡ Seeding 500+ customer activity timeline events...');
    const eventTypes = [
      { type: 'customer.login', desc: 'Customer logged into web application.' },
      { type: 'order.created', desc: 'Customer completed marketplace order checkout.' },
      { type: 'booking.created', desc: 'Customer booked design consultation slot.' },
      { type: 'review.submitted', desc: 'Customer submitted a 5-star verified review.' },
      { type: 'profile.updated', desc: 'Customer updated communication preferences.' },
      { type: 'download.started', desc: 'Customer requested signed delivery package.' },
    ];

    for (let e = 0; e < 520; e++) {
      const cust = customers[e % customers.length];
      const ev = eventTypes[e % eventTypes.length];
      const daysAgo = Math.floor(e / 6);

      await client.query(
        `INSERT INTO customer_activity_events (customer_id, event_type, description, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0', NOW() - ($4 || ' days')::INTERVAL)`,
        [cust.id, ev.type, ev.desc, daysAgo]
      );
    }
    console.log('✅ Seeded 520 Customer Activity Events.');

    // 9. Seed Customer Communication History (50+)
    console.log('📧 Seeding 50+ customer communication logs...');
    for (let m = 0; m < 55; m++) {
      const cust = customers[m % customers.length];
      await client.query(
        `INSERT INTO customer_communication_history (customer_id, channel, template, subject, body_preview, delivery_status, sent_by, sent_at)
         VALUES ($1, 'email', 'order_confirmation', 'Your Desigot Order Receipt & License Key', 'Thank you for your purchase! Your asset files are now available in your Vault.', 'delivered', $2, NOW() - INTERVAL '5 days')`,
        [cust.id, adminId]
      );
    }
    console.log('✅ Seeded 55 Communication History Records.');

    console.log('🎉 CUSTOMER MANAGEMENT SEED DATA GENERATED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Seeding customer management failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedCustomers();
}

module.exports = seedCustomers;
