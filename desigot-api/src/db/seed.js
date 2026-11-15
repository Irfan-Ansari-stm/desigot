'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const config = require('../config');

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'Password123!';

const usersToSeed = [
  {
    email: 'superadmin@desigot.com',
    username: 'superadmin',
    display_name: 'Super Admin',
    role: 'superadmin',
    account_status: 'active',
    seller_verified: false,
    seller_type: null,
    bio: 'Platform Super Administrator with system-level management and audit access.',
    password: DEFAULT_PASSWORD,
  },
  {
    email: 'admin@desigot.com',
    username: 'admin',
    display_name: 'Platform Admin',
    role: 'admin',
    account_status: 'active',
    seller_verified: false,
    seller_type: null,
    bio: 'Platform Operations Administrator managing dispute resolution and moderation.',
    password: DEFAULT_PASSWORD,
  },
  {
    email: 'seller@desigot.com',
    username: 'alexdesigner',
    display_name: 'Alex Designer',
    role: 'seller',
    account_status: 'active',
    seller_verified: true,
    seller_type: 'freelancer',
    response_rate: 0.9800,
    total_sales: 42,
    avg_seller_rating: 4.95,
    seller_review_count: 38,
    bio: 'Senior UI/UX Designer specialized in Figma design systems, web dashboards, and mobile app kits.',
    password: DEFAULT_PASSWORD,
    balance: {
      available_cents: 185000,
      pending_escrow_cents: 42000,
      lifetime_earned_cents: 560000,
      lifetime_withdrawn_cents: 375000,
    },
  },
  {
    email: 'buyer@desigot.com',
    username: 'sarahbuyer',
    display_name: 'Sarah Buyer',
    role: 'buyer',
    account_status: 'active',
    seller_verified: false,
    seller_type: null,
    bio: 'Product manager and startup founder purchasing modern design kits and creative templates.',
    password: DEFAULT_PASSWORD,
  },
  // Also activate and standardize existing test accounts if present
  {
    email: 'seller@example.com',
    username: 'testseller',
    display_name: 'Test Seller',
    role: 'seller',
    account_status: 'active',
    seller_verified: true,
    seller_type: 'freelancer',
    response_rate: 0.9500,
    total_sales: 12,
    avg_seller_rating: 4.80,
    seller_review_count: 10,
    bio: 'Verified marketplace creator selling design templates and icons.',
    password: DEFAULT_PASSWORD,
    balance: {
      available_cents: 95000,
      pending_escrow_cents: 15000,
      lifetime_earned_cents: 150000,
      lifetime_withdrawn_cents: 55000,
    },
  },
  {
    email: 'buyer@example.com',
    username: 'testbuyer',
    display_name: 'Test Buyer',
    role: 'buyer',
    account_status: 'active',
    seller_verified: false,
    seller_type: null,
    bio: 'Test buyer account for testing purchasing workflows.',
    password: DEFAULT_PASSWORD,
  },
];

async function seed() {
  const pool = new Pool({
    connectionString: config.db.primary,
    ssl: config.db.ssl,
  });

  const client = await pool.connect();

  try {
    console.log('🚀 Starting Desigot user seed process...');
    console.log(`🔑 Using default password: "${DEFAULT_PASSWORD}"\n`);

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, config.bcrypt.rounds || 12);

    for (const u of usersToSeed) {
      const upsertQuery = `
        INSERT INTO users (
          email,
          username,
          display_name,
          role,
          account_status,
          email_verified_at,
          password_hash,
          failed_login_count,
          locked_until,
          seller_verified,
          seller_type,
          response_rate,
          total_sales,
          avg_seller_rating,
          seller_review_count,
          bio,
          gdpr_consent_at,
          marketing_consent,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), $6, 0, NULL, $7, $8, $9, $10, $11, $12, $13, NOW(), TRUE, NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          username = EXCLUDED.username,
          display_name = EXCLUDED.display_name,
          role = EXCLUDED.role,
          account_status = EXCLUDED.account_status,
          email_verified_at = COALESCE(users.email_verified_at, NOW()),
          password_hash = EXCLUDED.password_hash,
          failed_login_count = 0,
          locked_until = NULL,
          seller_verified = EXCLUDED.seller_verified,
          seller_type = EXCLUDED.seller_type,
          response_rate = COALESCE(EXCLUDED.response_rate, users.response_rate),
          total_sales = COALESCE(EXCLUDED.total_sales, users.total_sales),
          avg_seller_rating = COALESCE(EXCLUDED.avg_seller_rating, users.avg_seller_rating),
          seller_review_count = COALESCE(EXCLUDED.seller_review_count, users.seller_review_count),
          bio = COALESCE(EXCLUDED.bio, users.bio),
          updated_at = NOW()
        RETURNING id, email, username, display_name, role, account_status;
      `;

      const values = [
        u.email,
        u.username,
        u.display_name,
        u.role,
        u.account_status,
        hashedPassword,
        u.seller_verified,
        u.seller_type || null,
        u.response_rate !== undefined ? u.response_rate : null,
        u.total_sales !== undefined ? u.total_sales : 0,
        u.avg_seller_rating !== undefined ? u.avg_seller_rating : null,
        u.seller_review_count !== undefined ? u.seller_review_count : 0,
        u.bio || null,
      ];

      const { rows } = await client.query(upsertQuery, values);
      const seededUser = rows[0];

      // If user has a seller balance or is a seller, seed / upsert seller_balances
      if (u.role === 'seller' || u.balance) {
        const bal = u.balance || {
          available_cents: 0,
          pending_escrow_cents: 0,
          lifetime_earned_cents: 0,
          lifetime_withdrawn_cents: 0,
        };

        await client.query(
          `INSERT INTO seller_balances (
             seller_id,
             available_cents,
             pending_escrow_cents,
             lifetime_earned_cents,
             lifetime_withdrawn_cents,
             updated_at
           ) VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (seller_id) DO UPDATE SET
             available_cents = EXCLUDED.available_cents,
             pending_escrow_cents = EXCLUDED.pending_escrow_cents,
             lifetime_earned_cents = EXCLUDED.lifetime_earned_cents,
             lifetime_withdrawn_cents = EXCLUDED.lifetime_withdrawn_cents,
             updated_at = NOW()`,
          [
            seededUser.id,
            bal.available_cents,
            bal.pending_escrow_cents,
            bal.lifetime_earned_cents,
            bal.lifetime_withdrawn_cents,
          ]
        );
      }

      console.log(`  ✓ [${seededUser.role.toUpperCase()}] ${seededUser.email} (${seededUser.display_name})`);
    }

    console.log('\n✅ All users successfully seeded and verified!\n');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('Login Credentials Summary:');
    console.log('Password for all accounts: ' + DEFAULT_PASSWORD);
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('1. Super Admin: superadmin@desigot.com (Role: superadmin)');
    console.log('2. Admin:       admin@desigot.com      (Role: admin)');
    console.log('3. Seller:      seller@desigot.com     (Role: seller, verified)');
    console.log('4. Buyer:       buyer@desigot.com      (Role: buyer, active)');
    console.log('5. Test Seller: seller@example.com     (Role: seller, verified)');
    console.log('6. Test Buyer:  buyer@example.com      (Role: buyer, active)');
    console.log('─────────────────────────────────────────────────────────────────\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

