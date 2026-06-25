'use strict';
const { query, queryRead } = require('../../db/pool');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../shared/errors/AppError');
const { randomToken, paginate } = require('../../shared/utils');

const createWishlist = async (userId, name, isShared = false) => {
  const shareToken = isShared ? randomToken(32) : null;
  const { rows } = await query(
    `INSERT INTO wishlists (user_id, name, is_shared, share_token)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [userId, name || 'My Wishlist', isShared, shareToken]
  );
  return rows[0];
};

const getWishlist = async (wishlistId, userId) => {
  const { rows } = await queryRead(
    `SELECT w.*, u.display_name AS owner_name FROM wishlists w
       JOIN users u ON u.id=w.user_id
      WHERE w.id=$1 AND (w.user_id=$2 OR w.is_shared=TRUE)`,
    [wishlistId, userId || null]
  );
  if (!rows.length) throw new NotFoundError('Wishlist');

  const { rows: items } = await queryRead(
    `SELECT l.id, l.slug, l.title, l.price_personal, l.avg_rating, l.total_sales, wi.added_at,
            (SELECT cdn_url FROM listing_media lm
              WHERE lm.listing_id=l.id AND lm.media_type='preview_image' ORDER BY sort_order LIMIT 1) AS primary_image
       FROM wishlist_items wi JOIN listings l ON l.id=wi.listing_id
      WHERE wi.wishlist_id=$1 AND l.status='approved'
      ORDER BY wi.added_at DESC`,
    [wishlistId]
  );
  return { ...rows[0], items };
};

const getWishlistByShareToken = async (token) => {
  const { rows } = await queryRead(
    `SELECT * FROM wishlists WHERE share_token=$1 AND is_shared=TRUE`, [token]
  );
  if (!rows.length) throw new NotFoundError('Wishlist');
  return getWishlist(rows[0].id, null);
};

const listMyWishlists = async (userId) => {
  const { rows } = await queryRead(
    `SELECT w.*, COUNT(wi.listing_id) AS item_count
       FROM wishlists w
       LEFT JOIN wishlist_items wi ON wi.wishlist_id=w.id
      WHERE w.user_id=$1
      GROUP BY w.id ORDER BY w.created_at DESC`,
    [userId]
  );
  return rows;
};

const updateWishlist = async (wishlistId, userId, data) => {
  const { rows } = await query(
    `UPDATE wishlists
        SET name=COALESCE($1,name), is_shared=COALESCE($2,is_shared),
            share_token=CASE WHEN $2=TRUE THEN COALESCE(share_token,$3) ELSE NULL END,
            updated_at=NOW()
      WHERE id=$4 AND user_id=$5 RETURNING *`,
    [data.name || null, data.is_shared ?? null, randomToken(32), wishlistId, userId]
  );
  if (!rows.length) throw new NotFoundError('Wishlist');
  return rows[0];
};

const deleteWishlist = async (wishlistId, userId) => {
  const { rows } = await query(
    `DELETE FROM wishlists WHERE id=$1 AND user_id=$2 RETURNING id`, [wishlistId, userId]
  );
  if (!rows.length) throw new NotFoundError('Wishlist');
  return { message: 'Wishlist deleted' };
};

const addItem = async (wishlistId, userId, listingId) => {
  const { rows: wl } = await queryRead(
    `SELECT id FROM wishlists WHERE id=$1 AND user_id=$2`, [wishlistId, userId]
  );
  if (!wl.length) throw new NotFoundError('Wishlist');

  await query(
    `INSERT INTO wishlist_items (wishlist_id, listing_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [wishlistId, listingId]
  );

  // Update listing wishlist_count
  query(`UPDATE listings SET wishlist_count=wishlist_count+1 WHERE id=$1`, [listingId]).catch(() => {});

  return { message: 'Added to wishlist' };
};

const removeItem = async (wishlistId, userId, listingId) => {
  const { rows: wl } = await queryRead(
    `SELECT id FROM wishlists WHERE id=$1 AND user_id=$2`, [wishlistId, userId]
  );
  if (!wl.length) throw new NotFoundError('Wishlist');

  await query(
    `DELETE FROM wishlist_items WHERE wishlist_id=$1 AND listing_id=$2`, [wishlistId, listingId]
  );

  query(`UPDATE listings SET wishlist_count=GREATEST(0,wishlist_count-1) WHERE id=$1`, [listingId]).catch(() => {});

  return { message: 'Removed from wishlist' };
};

module.exports = {
  createWishlist, getWishlist, getWishlistByShareToken, listMyWishlists,
  updateWishlist, deleteWishlist, addItem, removeItem,
};
