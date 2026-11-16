'use strict';
require('dotenv').config();
const { primaryPool } = require('./pool');

async function seedPublicMarketplace() {
  console.log('Seeding public marketplace notifications and favorites...');

  // 1. Get sample users
  const usersRes = await primaryPool.query(`
    SELECT id, email, display_name FROM users
    WHERE email IN ('user@desigot.com', 'superadmin@desigot.com', 'admin@desigot.com')
  `);

  if (usersRes.rows.length === 0) {
    console.log('No default users found.');
    await primaryPool.end();
    return;
  }

  for (const user of usersRes.rows) {
    // Notifications
    const existingNotifs = await primaryPool.query(
      `SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1`,
      [user.id]
    );

    if (existingNotifs.rows[0].count === 0) {
      const sampleNotifs = [
        {
          type: 'new_order',
          title: 'Order Confirmed: #ORD-7829',
          body: 'Your purchase of "SaaS Analytics Dashboard UI Kit" has been confirmed. Files are ready to download.',
          action_url: '/account/orders',
          is_read: false
        },
        {
          type: 'milestone_submitted',
          title: 'Milestone Delivery: Mobile App Redesign',
          body: 'The designer submitted Milestone 1 deliverables for your review. Please inspect within 7 days.',
          action_url: '/account/bookings',
          is_read: false
        },
        {
          type: 'message_received',
          title: 'New message from PixelCraft Studio',
          body: '"I have uploaded the requested Figma component tokens and dark mode variants."',
          action_url: '/account/messages',
          is_read: false
        },
        {
          type: 'system_alert',
          title: 'Welcome to Desigot Marketplace',
          body: 'Explore over 50,000 vetted digital design assets and hire elite agency specialists with escrow protection.',
          action_url: '/browse',
          is_read: true
        }
      ];

      for (const n of sampleNotifs) {
        await primaryPool.query(
          `INSERT INTO notifications (user_id, type, title, body, action_url, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP - interval '1 hour' * (floor(random() * 24 + 1)::int))`,
          [user.id, n.type, n.title, n.body, n.action_url, n.is_read]
        );
      }
      console.log(`Seeded notifications for ${user.email}`);
    }

    // Wishlist / Favorites
    const existingWishlist = await primaryPool.query(
      `SELECT id FROM wishlists WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );

    let wishlistId;
    if (existingWishlist.rows.length === 0) {
      const wRes = await primaryPool.query(
        `INSERT INTO wishlists (user_id, name, is_shared, share_token)
         VALUES ($1, 'My Favorites', false, gen_random_uuid())
         RETURNING id`,
        [user.id]
      );
      wishlistId = wRes.rows[0].id;

      // Add 4 sample listings into wishlist
      const sampleListings = await primaryPool.query(`SELECT id FROM listings LIMIT 4`);
      for (const l of sampleListings.rows) {
        await primaryPool.query(
          `INSERT INTO wishlist_items (wishlist_id, listing_id, added_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING`,
          [wishlistId, l.id]
        );
      }
      console.log(`Seeded favorites for ${user.email}`);
    }
  }

  console.log('Public marketplace seeding complete.');
  await primaryPool.end();
}

seedPublicMarketplace().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
