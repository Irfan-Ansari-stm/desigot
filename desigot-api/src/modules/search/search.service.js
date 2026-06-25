'use strict';
const { query, queryRead } = require('../../db/pool');
const { paginate } = require('../../shared/utils');

// ── Full-text search ───────────────────────────────────────────────────────────
const search = async (queryText, filters, pageOpts, userId = null) => {
  const { limit, offset, page } = paginate(pageOpts);
  const {
    category_id, listing_type, min_price, max_price,
    tags, software, file_format, sort = 'relevance',
  } = filters;

  const conditions = ["l.status='approved'", 'l.deleted_at IS NULL'];
  const params = [queryText];
  let idx = 2;

  if (category_id)   { conditions.push(`l.category_id=$${idx++}`);         params.push(category_id); }
  if (listing_type)  { conditions.push(`l.listing_type=$${idx++}`);         params.push(listing_type); }
  if (min_price)     { conditions.push(`l.price_personal>=$${idx++}`);      params.push(parseInt(min_price)); }
  if (max_price)     { conditions.push(`l.price_personal<=$${idx++}`);      params.push(parseInt(max_price)); }
  if (tags)          { conditions.push(`l.tags @> $${idx++}`);              params.push(tags.split(',')); }
  if (software)      { conditions.push(`l.software_compat @> $${idx++}`);   params.push(software.split(',')); }
  if (file_format)   { conditions.push(`l.file_formats @> $${idx++}`);      params.push(file_format.split(',')); }

  if (queryText) {
    conditions.push(`l.search_vector @@ plainto_tsquery('desigot_fts',$1)`);
  }

  const sortMap = {
    relevance:  queryText ? `ts_rank(l.search_vector, plainto_tsquery('desigot_fts',$1)) DESC` : 'l.total_sales DESC',
    newest:     'l.published_at DESC NULLS LAST',
    popular:    'l.total_sales DESC',
    rating:     'l.avg_rating DESC NULLS LAST',
    price_asc:  'l.price_personal ASC NULLS LAST',
    price_desc: 'l.price_personal DESC NULLS LAST',
  };

  const where   = conditions.join(' AND ');
  const orderBy = sortMap[sort] || sortMap.relevance;

  const [{ rows }, { rows: cnt }] = await Promise.all([
    queryRead(
      `SELECT l.id, l.slug, l.title, l.listing_type, l.price_personal, l.price_commercial,
              l.price_extended, l.currency, l.avg_rating, l.review_count, l.total_sales,
              l.tags, l.software_compat, l.file_formats, l.ai_quality_score,
              ${queryText ? `ts_rank(l.search_vector, plainto_tsquery('desigot_fts',$1)) AS relevance_score,` : ''}
              u.display_name AS seller_name, u.username AS seller_username, u.seller_verified,
              lc.name AS category_name, lc.slug AS category_slug,
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

  // Log search query
  _logSearch(queryText, filters, userId, parseInt(cnt[0].count)).catch(() => {});

  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Autocomplete / suggestions ────────────────────────────────────────────────
const autocomplete = async (prefix, limit = 10) => {
  if (!prefix || prefix.length < 2) return [];

  const { rows } = await queryRead(
    `SELECT DISTINCT l.title, l.slug,
            ts_rank(l.search_vector, plainto_tsquery('desigot_fts',$1)) AS score
       FROM listings l
      WHERE l.status='approved' AND l.deleted_at IS NULL
        AND l.title ILIKE $2
      ORDER BY score DESC, l.total_sales DESC
      LIMIT $3`,
    [prefix, `${prefix}%`, limit]
  );
  return rows.map((r) => ({ title: r.title, slug: r.slug }));
};

// ── Trending searches ─────────────────────────────────────────────────────────
const getTrendingSearches = async (limit = 10) => {
  const { rows } = await queryRead(
    `SELECT query_text, COUNT(*) AS search_count
       FROM search_queries
      WHERE created_at > NOW() - INTERVAL '7 days'
        AND query_text IS NOT NULL AND LENGTH(query_text) > 2
      GROUP BY query_text
      ORDER BY search_count DESC
      LIMIT $1`,
    [limit]
  );
  return rows;
};

// ── Recommendation events ──────────────────────────────────────────────────────
const logRecommendationEvent = async (userId, listingId, eventType, context, modelVersion) => {
  await query(
    `INSERT INTO recommendation_events (user_id, listing_id, event_type, recommendation_context, model_version)
     VALUES ($1,$2,$3,$4,$5)`,
    [userId || null, listingId, eventType, context || null, modelVersion || null]
  );
};

const getRecommendations = async (userId, context = 'homepage', limit = 10) => {
  // Collaborative filtering placeholder — returns high-rated featured listings
  const { rows } = await queryRead(
    `SELECT l.id, l.slug, l.title, l.price_personal, l.avg_rating, l.total_sales,
            u.display_name AS seller_name, u.seller_verified,
            (SELECT cdn_url FROM listing_media lm WHERE lm.listing_id=l.id AND lm.media_type='preview_image' ORDER BY sort_order LIMIT 1) AS primary_image
       FROM listings l
       JOIN users u ON u.id=l.seller_id
      WHERE l.status='approved' AND l.deleted_at IS NULL
        AND l.avg_rating >= 4.0
      ORDER BY l.ai_quality_score DESC NULLS LAST, l.total_sales DESC
      LIMIT $1`,
    [limit]
  );
  return rows;
};

// ── Search analytics (admin) ───────────────────────────────────────────────────
const getSearchAnalytics = async (pageOpts) => {
  const { limit, offset, page } = paginate(pageOpts);
  const { rows } = await queryRead(
    `SELECT sq.query_text, sq.results_count, sq.clicked_listing_id,
            sq.created_at, u.email AS user_email
       FROM search_queries sq
       LEFT JOIN users u ON u.id=sq.user_id
      ORDER BY sq.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const { rows: cnt } = await queryRead(`SELECT COUNT(*) FROM search_queries`);
  return { data: rows, total: parseInt(cnt[0].count), page, limit };
};

// ── Private helpers ────────────────────────────────────────────────────────────
const _logSearch = async (queryText, filters, userId, resultsCount) => {
  await query(
    `INSERT INTO search_queries (user_id, query_text, filters, results_count)
     VALUES ($1,$2,$3,$4)`,
    [userId || null, queryText, JSON.stringify(filters), resultsCount]
  );
};

module.exports = {
  search, autocomplete, getTrendingSearches,
  logRecommendationEvent, getRecommendations, getSearchAnalytics,
};
