'use strict';
const { queryRead } = require('../../db/pool');
const { paginate } = require('../../shared/utils');

// ── Seller analytics ──────────────────────────────────────────────────────────
const getSellerOverview = async (sellerId, days = 30) => {
  const interval = `${parseInt(days)} days`;

  const [orders, revenue, listings, reviews] = await Promise.all([
    queryRead(
      `SELECT COUNT(*) AS total_orders,
              SUM(amount_cents) AS total_gmv,
              SUM(seller_payout_cents) AS total_earnings,
              COUNT(CASE WHEN created_at > NOW()-INTERVAL '${interval}' THEN 1 END) AS orders_period
         FROM orders WHERE seller_id=$1 AND status='complete'`,
      [sellerId]
    ),
    queryRead(
      `SELECT DATE_TRUNC('day', created_at) AS day,
              SUM(seller_payout_cents) AS earnings,
              COUNT(*) AS order_count
         FROM orders
        WHERE seller_id=$1 AND status='complete'
          AND created_at > NOW()-INTERVAL '${interval}'
        GROUP BY 1 ORDER BY 1`,
      [sellerId]
    ),
    queryRead(
      `SELECT COUNT(*) AS total,
              COUNT(CASE WHEN status='approved' THEN 1 END) AS approved,
              COUNT(CASE WHEN status='pending_review' THEN 1 END) AS pending
         FROM listings WHERE seller_id=$1 AND deleted_at IS NULL`,
      [sellerId]
    ),
    queryRead(
      `SELECT AVG(rating_overall) AS avg_rating, COUNT(*) AS total_reviews
         FROM reviews WHERE subject_id=$1 AND status='approved' AND review_type='buyer_review'`,
      [sellerId]
    ),
  ]);

  return {
    summary: orders.rows[0],
    daily_revenue: revenue.rows,
    listings: listings.rows[0],
    reviews: reviews.rows[0],
  };
};

const getTopListings = async (sellerId, limit = 10) => {
  const { rows } = await queryRead(
    `SELECT l.id, l.slug, l.title, l.total_sales, l.total_revenue_cents,
            l.avg_rating, l.review_count, l.view_count, l.wishlist_count,
            (SELECT cdn_url FROM listing_media lm
              WHERE lm.listing_id=l.id AND lm.media_type='preview_image' ORDER BY sort_order LIMIT 1) AS primary_image
       FROM listings l
      WHERE l.seller_id=$1 AND l.status='approved' AND l.deleted_at IS NULL
      ORDER BY l.total_sales DESC LIMIT $2`,
    [sellerId, limit]
  );
  return rows;
};

const getConversionFunnel = async (sellerId, days = 30) => {
  const interval = `${parseInt(days)} days`;
  const { rows } = await queryRead(
    `SELECT
       SUM(l.view_count) AS total_views,
       COUNT(DISTINCT o.id) AS total_orders,
       ROUND(COUNT(DISTINCT o.id)::NUMERIC / NULLIF(SUM(l.view_count), 0) * 100, 2) AS conversion_rate
     FROM listings l
     LEFT JOIN orders o ON o.listing_id=l.id AND o.created_at > NOW()-INTERVAL '${interval}'
    WHERE l.seller_id=$1 AND l.status='approved'`,
    [sellerId]
  );
  return rows[0];
};

const getRevenueByLicense = async (sellerId, days = 90) => {
  const interval = `${parseInt(days)} days`;
  const { rows } = await queryRead(
    `SELECT license_type,
            COUNT(*) AS order_count,
            SUM(amount_cents) AS total_gmv,
            SUM(seller_payout_cents) AS total_earnings
       FROM orders
      WHERE seller_id=$1 AND status='complete'
        AND created_at > NOW()-INTERVAL '${interval}'
      GROUP BY license_type`,
    [sellerId]
  );
  return rows;
};

// ── Platform analytics (admin) ─────────────────────────────────────────────────
const getPlatformRevenueTrend = async (days = 30) => {
  const interval = `${parseInt(days)} days`;
  const { rows } = await queryRead(
    `SELECT DATE_TRUNC('day', created_at) AS day,
            COUNT(*) AS order_count,
            SUM(amount_cents) AS gmv,
            SUM(platform_fee_cents) AS platform_revenue
       FROM orders
      WHERE status='complete' AND created_at > NOW()-INTERVAL '${interval}'
      GROUP BY 1 ORDER BY 1`
  );
  return rows;
};

const getTopSellers = async (limit = 20) => {
  const { rows } = await queryRead(
    `SELECT u.id, u.display_name, u.username, u.avatar_url, u.avg_seller_rating,
            u.total_sales, u.seller_review_count,
            ves.lifetime_gmv_cents, ves.last_30d_net_cents
       FROM users u
       LEFT JOIN v_seller_earnings_summary ves ON ves.seller_id=u.id
      WHERE u.role='seller' AND u.account_status='active' AND u.seller_verified=TRUE
      ORDER BY u.total_sales DESC LIMIT $1`,
    [limit]
  );
  return rows;
};

const getCategoryBreakdown = async () => {
  const { rows } = await queryRead(
    `SELECT lc.name, lc.slug,
            COUNT(DISTINCT l.id) AS listing_count,
            COALESCE(SUM(o.amount_cents), 0) AS total_gmv,
            COUNT(DISTINCT o.id) AS order_count
       FROM listing_categories lc
       LEFT JOIN listings l ON l.category_id=lc.id AND l.status='approved'
       LEFT JOIN orders o ON o.listing_id=l.id AND o.status='complete'
      WHERE lc.depth=0
      GROUP BY lc.id ORDER BY total_gmv DESC`
  );
  return rows;
};

const getUserGrowth = async (days = 90) => {
  const interval = `${parseInt(days)} days`;
  const { rows } = await queryRead(
    `SELECT DATE_TRUNC('day', created_at) AS day,
            COUNT(*) AS new_users,
            COUNT(CASE WHEN role='seller' THEN 1 END) AS new_sellers,
            COUNT(CASE WHEN role='buyer' THEN 1 END) AS new_buyers
       FROM users
      WHERE created_at > NOW()-INTERVAL '${interval}' AND deleted_at IS NULL
      GROUP BY 1 ORDER BY 1`
  );
  return rows;
};

module.exports = {
  getSellerOverview, getTopListings, getConversionFunnel, getRevenueByLicense,
  getPlatformRevenueTrend, getTopSellers, getCategoryBreakdown, getUserGrowth,
};
