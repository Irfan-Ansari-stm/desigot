'use strict';
const { query, queryRead, withTransaction } = require('../../db/pool');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../shared/errors/AppError');
const { makeSlug, paginate } = require('../../shared/utils');

// ── Create listing ────────────────────────────────────────────────────────────
const createListing = async (sellerId, data) => {
  const slug = makeSlug(data.title);
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO listings
         (seller_id, category_id, title, slug, description, listing_type,
          price_personal, price_commercial, price_extended, currency,
          tags, software_compat, file_formats, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft')
       RETURNING *`,
      [
        sellerId, data.category_id, data.title, slug, data.description,
        data.listing_type || 'asset',
        data.price_personal  || null,
        data.price_commercial || null,
        data.price_extended  || null,
        data.currency || 'USD',
        data.tags         || [],
        data.software_compat || [],
        data.file_formats    || [],
      ]
    );
    // Save first version
    await client.query(
      `INSERT INTO listing_versions (listing_id, version_num, changed_by_id, snapshot)
       VALUES ($1,1,$2,$3)`,
      [rows[0].id, sellerId, JSON.stringify(rows[0])]
    );
    return rows[0];
  });
};

// ── Get listing detail ────────────────────────────────────────────────────────
const getListing = async (idOrSlug, viewerId = null) => {
  const isUUID = /^[0-9a-f-]{36}$/.test(idOrSlug);
  const { rows } = await queryRead(
    `SELECT l.*, u.display_name AS seller_name, u.username AS seller_username,
            u.avatar_url AS seller_avatar, u.seller_verified, u.avg_seller_rating,
            u.total_sales AS seller_total_sales, u.response_rate,
            lc.name AS category_name, lc.slug AS category_slug
       FROM listings l
       JOIN users u ON u.id = l.seller_id
       JOIN listing_categories lc ON lc.id = l.category_id
      WHERE ${isUUID ? 'l.id=$1' : 'l.slug=$1'} AND l.deleted_at IS NULL`,
    [idOrSlug]
  );
  if (!rows.length) throw new NotFoundError('Listing');
  const listing = rows[0];

  // Increment view count asynchronously (non-blocking)
  if (listing.status === 'approved') {
    query(`UPDATE listings SET view_count=view_count+1 WHERE id=$1`, [listing.id]).catch(() => {});
  }

  // Fetch media
  const { rows: media } = await queryRead(
    `SELECT id, media_type, cdn_url, file_name, file_size_bytes, mime_type,
            width_px, height_px, sort_order, is_watermarked
       FROM listing_media WHERE listing_id=$1 ORDER BY sort_order`,
    [listing.id]
  );
  listing.media = media;

  return listing;
};

// ── Browse / search listings ──────────────────────────────────────────────────
const browseListings = async (filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const {
    category_id, listing_type, min_price, max_price,
    tags, software, file_format, sort = 'newest', search, q,
  } = filters;
  const searchText = search || q;

  const conditions = ["l.status='approved'", 'l.deleted_at IS NULL'];
  const params = [];
  let idx = 1;

  if (category_id)   { conditions.push(`l.category_id=$${idx++}`); params.push(category_id); }
  if (listing_type)  { conditions.push(`l.listing_type=$${idx++}`); params.push(listing_type); }
  if (min_price)     { conditions.push(`l.price_personal>=$${idx++}`); params.push(parseInt(min_price)); }
  if (max_price)     { conditions.push(`l.price_personal<=$${idx++}`); params.push(parseInt(max_price)); }
  if (tags)          { conditions.push(`l.tags @> $${idx++}`); params.push(tags.split(',')); }
  if (software)      { conditions.push(`l.software_compat @> $${idx++}`); params.push(software.split(',')); }
  if (file_format)   { conditions.push(`l.file_formats @> $${idx++}`); params.push(file_format.split(',')); }
  if (searchText)    { conditions.push(`l.search_vector @@ plainto_tsquery('desigot_fts',$${idx++})`); params.push(searchText); }

  const sortMap = {
    newest: 'l.published_at DESC NULLS LAST',
    oldest: 'l.published_at ASC',
    popular: 'l.total_sales DESC',
    rating: 'l.avg_rating DESC NULLS LAST',
    price_asc: 'l.price_personal ASC NULLS LAST',
    price_desc: 'l.price_personal DESC NULLS LAST',
  };
  const orderBy = sortMap[sort] || sortMap.newest;
  const where = conditions.join(' AND ');

  const [{ rows }, { rows: cnt }] = await Promise.all([
    queryRead(
      `SELECT l.id, l.slug, l.title, l.listing_type, l.price_personal, l.price_commercial,
              l.price_extended, l.currency, l.avg_rating, l.review_count, l.total_sales,
              l.is_featured, l.tags, l.ai_quality_score,
              u.display_name AS seller_name, u.username AS seller_username, u.seller_verified,
              lc.name AS category_name,
              (SELECT cdn_url FROM listing_media lm
                WHERE lm.listing_id=l.id AND lm.media_type='preview_image'
                ORDER BY sort_order LIMIT 1) AS primary_image
         FROM listings l
         JOIN users u ON u.id=l.seller_id
         JOIN listing_categories lc ON lc.id=l.category_id
        WHERE ${where}
        ORDER BY ${orderBy}
        LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    ),
    queryRead(`SELECT COUNT(*) FROM listings l WHERE ${where}`, params),
  ]);

  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Update listing ────────────────────────────────────────────────────────────
const updateListing = async (listingId, sellerId, data, isAdmin = false) => {
  const { rows: existing } = await query('SELECT * FROM listings WHERE id=$1 AND deleted_at IS NULL', [listingId]);
  if (!existing.length) throw new NotFoundError('Listing');
  if (!isAdmin && existing[0].seller_id !== sellerId) throw new ForbiddenError('Not your listing');

  const allowed = ['title', 'description', 'category_id', 'price_personal', 'price_commercial',
    'price_extended', 'tags', 'software_compat', 'file_formats'];
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));

  if (!Object.keys(filtered).length) return existing[0];

  return withTransaction(async (client) => {
    const sets = Object.keys(filtered).map((k, i) => `"${k}"=$${i + 1}`).join(',');
    const { rows } = await client.query(
      `UPDATE listings SET ${sets}, updated_at=NOW() WHERE id=$${Object.keys(filtered).length + 1} RETURNING *`,
      [...Object.values(filtered), listingId]
    );

    // Save version snapshot
    const { rows: vRows } = await client.query(
      'SELECT COALESCE(MAX(version_num),0)+1 AS next FROM listing_versions WHERE listing_id=$1', [listingId]
    );
    await client.query(
      `INSERT INTO listing_versions (listing_id, version_num, changed_by_id, snapshot)
       VALUES ($1,$2,$3,$4)`,
      [listingId, vRows[0].next, sellerId, JSON.stringify(rows[0])]
    );
    return rows[0];
  });
};

// ── Submit for review ─────────────────────────────────────────────────────────
const submitForReview = async (listingId, sellerId) => {
  const { rows } = await query(
    `UPDATE listings SET status='pending_review', updated_at=NOW()
      WHERE id=$1 AND seller_id=$2 AND status='draft' AND deleted_at IS NULL RETURNING *`,
    [listingId, sellerId]
  );
  if (!rows.length) throw new NotFoundError('Listing or not in draft status');
  return rows[0];
};

// ── Admin: approve / reject ────────────────────────────────────────────────────
const reviewListing = async (listingId, adminId, action, reason = null) => {
  const status     = action === 'approve' ? 'approved' : 'rejected';
  const extra      = action === 'approve'
    ? ', approved_at=NOW(), published_at=COALESCE(published_at,NOW())'
    : ', rejected_at=NOW(), rejection_reason=$3';
  const params     = action === 'approve' ? [status, listingId] : [status, listingId, reason];

  const { rows } = await query(
    `UPDATE listings SET status=$1, updated_at=NOW()${extra}
      WHERE id=$2 AND status='pending_review' RETURNING *`,
    params
  );
  if (!rows.length) throw new NotFoundError('Listing or not pending review');
  return rows[0];
};

// ── Soft delete listing ────────────────────────────────────────────────────────
const deleteListing = async (listingId, userId, isAdmin) => {
  const { rows } = await query(
    `UPDATE listings SET deleted_at=NOW(), status='archived', updated_at=NOW()
      WHERE id=$1 ${isAdmin ? '' : 'AND seller_id=$2'} AND deleted_at IS NULL RETURNING id`,
    isAdmin ? [listingId] : [listingId, userId]
  );
  if (!rows.length) throw new NotFoundError('Listing');
  return { message: 'Listing deleted' };
};

// ── Versions ──────────────────────────────────────────────────────────────────
const getListingVersions = async (listingId, sellerId, isAdmin) => {
  const { rows } = await queryRead(
    `SELECT lv.*, u.display_name AS changed_by_name
       FROM listing_versions lv
       JOIN users u ON u.id=lv.changed_by_id
      WHERE lv.listing_id=$1
      ORDER BY lv.version_num DESC`,
    [listingId]
  );
  return rows;
};

// ── Quality score ─────────────────────────────────────────────────────────────
const getQualityScore = async (listingId) => {
  const { rows } = await queryRead('SELECT * FROM listing_quality_scores WHERE listing_id=$1', [listingId]);
  return rows[0] || null;
};

const setQualityScore = async (listingId, scores, modelVersion) => {
  const { rows } = await query(
    `INSERT INTO listing_quality_scores
       (listing_id, overall_score, visual_score, description_score, pricing_score, completeness_score, model_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (listing_id) DO UPDATE
       SET overall_score=$2, visual_score=$3, description_score=$4,
           pricing_score=$5, completeness_score=$6, model_version=$7, scored_at=NOW()
     RETURNING *`,
    [listingId, scores.overall, scores.visual, scores.description,
     scores.pricing, scores.completeness, modelVersion]
  );
  await query(`UPDATE listings SET ai_quality_score=$1, ai_scored_at=NOW() WHERE id=$2`, [scores.overall, listingId]);
  return rows[0];
};

// ── Collections ───────────────────────────────────────────────────────────────
const listCollections = async () => {
  const { rows } = await queryRead(
    `SELECT c.*, COUNT(ci.listing_id) AS listing_count
       FROM listing_collections c
       LEFT JOIN listing_collection_items ci ON ci.collection_id=c.id
      WHERE c.is_active=TRUE
      GROUP BY c.id ORDER BY c.sort_order`
  );
  return rows;
};

const getCollection = async (slug) => {
  const { rows: col } = await queryRead('SELECT * FROM listing_collections WHERE slug=$1', [slug]);
  if (!col.length) throw new NotFoundError('Collection');
  const { rows: items } = await queryRead(
    `SELECT l.id, l.slug, l.title, l.price_personal, l.avg_rating, l.total_sales,
            (SELECT cdn_url FROM listing_media lm WHERE lm.listing_id=l.id AND lm.media_type='preview_image' ORDER BY sort_order LIMIT 1) AS primary_image
       FROM listing_collection_items ci
       JOIN listings l ON l.id=ci.listing_id
      WHERE ci.collection_id=$1 AND l.status='approved' AND l.deleted_at IS NULL
      ORDER BY ci.sort_order`,
    [col[0].id]
  );
  return { ...col[0], listings: items };
};

const createCollection = async (data, adminId) => {
  const slug = data.slug || makeSlug(data.name, false);
  const { rows } = await query(
    `INSERT INTO listing_collections (name, slug, description, is_auto_generated, created_by_id)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.name, slug, data.description || null, data.is_auto_generated || false, adminId]
  );
  return rows[0];
};

const addToCollection = async (collectionId, listingId, adminId, sortOrder = 0) => {
  await query(
    `INSERT INTO listing_collection_items (collection_id, listing_id, added_by_id, sort_order)
     VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
    [collectionId, listingId, adminId, sortOrder]
  );
  return { message: 'Added to collection' };
};

const removeFromCollection = async (collectionId, listingId) => {
  await query('DELETE FROM listing_collection_items WHERE collection_id=$1 AND listing_id=$2', [collectionId, listingId]);
  return { message: 'Removed from collection' };
};

// ── Pause / Unpause ───────────────────────────────────────────────────────────
const pauseListing = async (listingId, sellerId) => {
  const { rows } = await query(
    `UPDATE listings SET status='paused', updated_at=NOW()
      WHERE id=$1 AND seller_id=$2 AND status='approved' RETURNING id`,
    [listingId, sellerId]
  );
  if (!rows.length) throw new NotFoundError('Listing');
  return { message: 'Listing paused' };
};

const unpauseListing = async (listingId, sellerId) => {
  const { rows } = await query(
    `UPDATE listings SET status='approved', updated_at=NOW()
      WHERE id=$1 AND seller_id=$2 AND status='paused' RETURNING id`,
    [listingId, sellerId]
  );
  if (!rows.length) throw new NotFoundError('Listing');
  return { message: 'Listing resumed' };
};

// ── Seller's own listings ─────────────────────────────────────────────────────
const getMyListings = async (sellerId, filters, pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const status = filters.status || null;
  const { rows } = await queryRead(
    `SELECT l.*, lc.name AS category_name,
            (SELECT cdn_url FROM listing_media lm WHERE lm.listing_id=l.id AND lm.media_type='preview_image' ORDER BY sort_order LIMIT 1) AS primary_image
       FROM listings l
       JOIN listing_categories lc ON lc.id=l.category_id
      WHERE l.seller_id=$1 AND l.deleted_at IS NULL AND ($2::TEXT IS NULL OR l.status=$2)
      ORDER BY l.updated_at DESC LIMIT $3 OFFSET $4`,
    [sellerId, status, limit, offset]
  );
  const { rows: cnt } = await queryRead(
    `SELECT COUNT(*) FROM listings WHERE seller_id=$1 AND deleted_at IS NULL AND ($2::TEXT IS NULL OR status=$2)`,
    [sellerId, status]
  );
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Admin listing queue ───────────────────────────────────────────────────────
const getPendingListings = async (pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT l.*, u.display_name AS seller_name, u.email AS seller_email
       FROM listings l JOIN users u ON u.id=l.seller_id
      WHERE l.status='pending_review' ORDER BY l.created_at ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const { rows: cnt } = await queryRead(`SELECT COUNT(*) FROM listings WHERE status='pending_review'`);
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

const getListingFacets = async () => {
  const [software, formats, types, sortOptions] = await Promise.all([
    queryRead(
      `SELECT value, COUNT(*)::INTEGER AS listing_count
         FROM listings l
         CROSS JOIN LATERAL unnest(l.software_compat) AS value
        WHERE l.deleted_at IS NULL AND value <> ''
        GROUP BY value
        ORDER BY listing_count DESC, value ASC`
    ),
    queryRead(
      `SELECT value, COUNT(*)::INTEGER AS listing_count
         FROM listings l
         CROSS JOIN LATERAL unnest(l.file_formats) AS value
        WHERE l.deleted_at IS NULL AND value <> ''
        GROUP BY value
        ORDER BY listing_count DESC, value ASC`
    ),
    queryRead(
      `SELECT type_value::TEXT AS value,
              CASE type_value::TEXT WHEN 'asset' THEN 'Assets' WHEN 'service' THEN 'Services' ELSE type_value::TEXT END AS label,
              COUNT(l.id)::INTEGER AS listing_count
         FROM unnest(enum_range(NULL::listing_type_enum)) AS type_value
         LEFT JOIN listings l ON l.listing_type=type_value AND l.deleted_at IS NULL
        GROUP BY type_value
        ORDER BY type_value ASC`
    ),
    queryRead(
      `SELECT key AS value, label
         FROM listing_sort_options
        WHERE is_active=TRUE
        ORDER BY sort_order ASC`
    ).catch(() => ({
      rows: [
        { value: 'relevance', label: 'Most Relevant' },
        { value: 'newest', label: 'Newest First' },
        { value: 'popular', label: 'Most Popular' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'price_asc', label: 'Price: Low to High' },
        { value: 'price_desc', label: 'Price: High to Low' },
      ],
    })),
  ]);

  return {
    software: software.rows,
    file_formats: formats.rows,
    listing_types: types.rows,
    sort_options: sortOptions.rows,
  };
};

module.exports = {
  createListing, getListing, browseListings, updateListing, submitForReview,
  reviewListing, deleteListing, getListingVersions, getQualityScore, setQualityScore,
  listCollections, getCollection, createCollection, addToCollection, removeFromCollection,
  pauseListing, unpauseListing, getMyListings, getPendingListings, getListingFacets,
};
