'use strict';
const express = require('express');
const router = express.Router();
const { queryRead, primaryPool } = require('../../db/pool');
const { optionalAuthenticate } = require('../../middleware/auth');
const { successResponse, paginatedResponse } = require('../../shared/utils');
const cmsService = require('../cms/cms.service');

// ─────────────────────────────────────────────────────────────────────────────
// 1. HOMEPAGE
// ─────────────────────────────────────────────────────────────────────────────
router.get('/homepage', async (req, res, next) => {
  try {
    const settings = await cmsService.getHomepageSettings();
    const heroSlides = await cmsService.getHeroSections({ active: true });

    // Root categories for homepage
    const catsRes = await queryRead(`
      SELECT id, name, slug, icon_name, cover_image_url, description
      FROM listing_categories
      WHERE is_active = true AND parent_id IS NULL
      ORDER BY sort_order ASC, name ASC
      LIMIT 12
    `);

    // Top published services
    const servicesRes = await queryRead(`
      SELECT s.id, s.title, s.slug, s.short_description, s.description, s.starting_price_cents,
             s.avg_rating as rating, s.review_count, s.total_orders,
             COALESCE((SELECT file_url FROM service_media WHERE service_id = s.id ORDER BY is_primary DESC, display_order ASC LIMIT 1), 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80') as featured_image_url,
             s.is_featured, s.delivery_time_days,
             c.name as category_name, c.slug as category_slug,
             u.id as seller_id, u.display_name as seller_name, u.avatar_url as seller_avatar,
             u.avg_seller_rating
      FROM services s
      JOIN users u ON s.seller_id = u.id
      LEFT JOIN listing_categories c ON s.category_id = c.id
      WHERE s.status = 'published'
      ORDER BY s.is_featured DESC, s.avg_rating DESC, s.total_orders DESC
      LIMIT 8
    `);

    // Top digital products
    const productsRes = await queryRead(`
      SELECT p.id, p.title, p.slug, p.short_description, p.description,
             COALESCE(p.price_personal_cents, 2900) as price_cents,
             p.avg_rating as rating, p.review_count, p.thumbnail_url, p.preview_images,
             p.is_featured, p.total_downloads as download_count, c.name as category_name,
             u.id as seller_id, u.display_name as seller_name, u.avatar_url as seller_avatar
      FROM digital_products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN listing_categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.is_featured DESC, p.total_downloads DESC, p.avg_rating DESC
      LIMIT 8
    `);

    // Featured sellers
    const sellersRes = await queryRead(`
      SELECT id, display_name, username, avatar_url, bio, avg_seller_rating,
             seller_review_count, total_sales, seller_verified, seller_type
      FROM users
      WHERE (role = 'seller' OR seller_verified = true)
        AND account_status = 'active'
      ORDER BY avg_seller_rating DESC, total_sales DESC
      LIMIT 6
    `);

    // Aggregate stats
    const statsRes = await queryRead(`
      SELECT 
        (SELECT COUNT(*) FROM services WHERE status = 'published') as total_services,
        (SELECT COUNT(*) FROM digital_products WHERE status = 'published') as total_products,
        (SELECT COUNT(*) FROM users WHERE role = 'seller' OR seller_verified = true) as total_sellers,
        (SELECT COUNT(*) FROM reviews WHERE status = 'approved') as total_reviews
    `);

    return successResponse(res, {
      settings,
      hero: heroSlides.length > 0 ? heroSlides[0] : null,
      hero_slides: heroSlides,
      categories: catsRes.rows,
      featured_services: servicesRes.rows,
      featured_products: productsRes.rows,
      top_sellers: sellersRes.rows,
      stats: {
        total_services: parseInt(statsRes.rows[0]?.total_services || 0),
        total_products: parseInt(statsRes.rows[0]?.total_products || 0),
        total_sellers: parseInt(statsRes.rows[0]?.total_sellers || 0),
        total_reviews: parseInt(statsRes.rows[0]?.total_reviews || 0),
        assets_count: "50K+",
        sellers_count: "12K+",
        buyers_count: "200K+",
        avg_rating: "4.9★"
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. NAVIGATION & MEGA MENU
// ─────────────────────────────────────────────────────────────────────────────
router.get('/navigation', async (req, res, next) => {
  try {
    const rootsRes = await queryRead(`
      SELECT id, name, slug, icon_name, description, sort_order
      FROM listing_categories
      WHERE is_active = true AND parent_id IS NULL
      ORDER BY sort_order ASC, name ASC
    `);

    const subsRes = await queryRead(`
      SELECT id, parent_id, name, slug, icon_name
      FROM listing_categories
      WHERE is_active = true AND parent_id IS NOT NULL
      ORDER BY sort_order ASC, name ASC
    `);

    const subMap = {};
    for (const sub of subsRes.rows) {
      if (!subMap[sub.parent_id]) subMap[sub.parent_id] = [];
      subMap[sub.parent_id].push(sub);
    }

    const categoriesTree = rootsRes.rows.map(cat => ({
      ...cat,
      subcategories: (subMap[cat.id] || []).slice(0, 8),
      total_subcategories: (subMap[cat.id] || []).length
    }));

    const headerLinks = [
      { label: 'Browse', href: '/browse', has_dropdown: true },
      { label: 'Services', href: '/services' },
      { label: 'Featured', href: '/featured' },
      { label: 'Trending', href: '/trending' },
      { label: 'Blog', href: '/blog' },
    ];

    const footerSettings = await cmsService.getFooterSettings();
    const footerColumns = await cmsService.getFooterColumns();

    return successResponse(res, {
      header_links: headerLinks,
      mega_menu_categories: categoriesTree,
      footer: {
        settings: footerSettings,
        columns: footerColumns.filter(c => c.is_active)
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/categories', async (req, res, next) => {
  try {
    const { parent_id, featured, search } = req.query;
    let query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id AND s.status = 'published') as service_count,
             (SELECT COUNT(*) FROM digital_products p WHERE p.category_id = c.id AND p.status = 'published') as product_count,
             (SELECT COUNT(*) FROM listing_categories sub WHERE sub.parent_id = c.id AND sub.is_active = true) as subcategory_count
      FROM listing_categories c
      WHERE c.is_active = true
    `;
    const params = [];

    if (parent_id === 'null' || parent_id === 'root') {
      query += ` AND c.parent_id IS NULL`;
    } else if (parent_id) {
      params.push(parent_id);
      query += ` AND c.parent_id = $${params.length}`;
    }

    if (featured === 'true') {
      query += ` AND c.is_featured = true`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
    }

    query += ` ORDER BY c.sort_order ASC, c.name ASC`;

    const result = await queryRead(query, params);
    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/categories/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const catRes = await queryRead(`
      SELECT c.*,
             parent.name as parent_name, parent.slug as parent_slug
      FROM listing_categories c
      LEFT JOIN listing_categories parent ON c.parent_id = parent.id
      WHERE (c.slug = $1 OR c.id::text = $1) AND c.is_active = true
    `, [slug]);

    if (catRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const category = catRes.rows[0];

    // Subcategories
    const subRes = await queryRead(`
      SELECT c.*,
             (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id AND s.status = 'published') as service_count,
             (SELECT COUNT(*) FROM digital_products p WHERE p.category_id = c.id AND p.status = 'published') as product_count
      FROM listing_categories c
      WHERE c.parent_id = $1 AND c.is_active = true
      ORDER BY c.sort_order ASC, c.name ASC
    `, [category.id]);

    // Top services in this category
    const servicesRes = await queryRead(`
      SELECT s.id, s.title, s.slug, s.short_description, s.starting_price_cents,
             s.avg_rating as rating, s.review_count, s.total_orders,
             COALESCE((SELECT file_url FROM service_media WHERE service_id = s.id ORDER BY is_primary DESC, display_order ASC LIMIT 1), 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80') as featured_image_url,
             s.delivery_time_days,
             u.display_name as seller_name, u.avatar_url as seller_avatar, u.avg_seller_rating
      FROM services s
      JOIN users u ON s.seller_id = u.id
      WHERE (s.category_id = $1 OR s.category_id IN (SELECT id FROM listing_categories WHERE parent_id = $1))
        AND s.status = 'published'
      ORDER BY s.is_featured DESC, s.avg_rating DESC
      LIMIT 8
    `, [category.id]);

    // Top products in this category
    const productsRes = await queryRead(`
      SELECT p.id, p.title, p.slug, p.short_description,
             COALESCE(p.price_personal_cents, 2900) as price_cents,
             p.avg_rating as rating, p.review_count, p.thumbnail_url, p.total_downloads as download_count,
             u.display_name as seller_name, u.avatar_url as seller_avatar
      FROM digital_products p
      JOIN users u ON p.seller_id = u.id
      WHERE (p.category_id = $1 OR p.category_id IN (SELECT id FROM listing_categories WHERE parent_id = $1))
        AND p.status = 'published'
      ORDER BY p.is_featured DESC, p.total_downloads DESC
      LIMIT 8
    `, [category.id]);

    return successResponse(res, {
      category,
      subcategories: subRes.rows,
      services: servicesRes.rows,
      products: productsRes.rows,
      seo: {
        title: category.seo_title || `${category.name} - Marketplace Assets & Services | Desigot`,
        description: category.seo_description || category.description,
        og_title: category.og_title || category.name,
        og_description: category.og_description || category.description,
        canonical_url: category.canonical_url || `https://desigot.com/categories/${category.slug}`
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. SERVICES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/services', optionalAuthenticate, async (req, res, next) => {
  try {
    const {
      category,
      category_id,
      min_price,
      max_price,
      min_rating,
      delivery_days,
      featured,
      search,
      sort = 'popular',
      page = 1,
      limit = 12
    } = req.query;

    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, Math.max(1, parseInt(limit)));
    const params = [];
    const conditions = ["s.status = 'published'"];

    if (category) {
      params.push(category);
      conditions.push(`(c.slug = $${params.length} OR c.id::text = $${params.length})`);
    }

    if (category_id) {
      params.push(category_id);
      conditions.push(`s.category_id = $${params.length}`);
    }

    if (min_price) {
      params.push(parseInt(min_price) * 100);
      conditions.push(`s.starting_price_cents >= $${params.length}`);
    }

    if (max_price) {
      params.push(parseInt(max_price) * 100);
      conditions.push(`s.starting_price_cents <= $${params.length}`);
    }

    if (min_rating) {
      params.push(parseFloat(min_rating));
      conditions.push(`s.avg_rating >= $${params.length}`);
    }

    if (delivery_days) {
      params.push(parseInt(delivery_days));
      conditions.push(`s.delivery_time_days <= $${params.length}`);
    }

    if (featured === 'true') {
      conditions.push(`s.is_featured = true`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(s.title ILIKE $${params.length} OR s.description ILIKE $${params.length} OR s.short_description ILIKE $${params.length})`);
    }

    let orderBy = 's.is_featured DESC, s.avg_rating DESC, s.total_orders DESC';
    if (sort === 'newest') orderBy = 's.created_at DESC';
    if (sort === 'rating') orderBy = 's.avg_rating DESC, s.review_count DESC';
    if (sort === 'price_asc') orderBy = 's.starting_price_cents ASC';
    if (sort === 'price_desc') orderBy = 's.starting_price_cents DESC';
    if (sort === 'popular') orderBy = 's.total_orders DESC, s.avg_rating DESC';

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await queryRead(`
      SELECT COUNT(*)::int as total
      FROM services s
      LEFT JOIN listing_categories c ON s.category_id = c.id
      ${whereClause}
    `, params);
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await queryRead(`
      SELECT s.id, s.title, s.slug, s.short_description, s.description, s.starting_price_cents,
             s.avg_rating as rating, s.review_count, s.total_orders,
             COALESCE((SELECT file_url FROM service_media WHERE service_id = s.id ORDER BY is_primary DESC, display_order ASC LIMIT 1), 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80') as featured_image_url,
             s.is_featured, s.delivery_time_days, s.revision_limit, s.created_at,
             c.id as category_id, c.name as category_name, c.slug as category_slug,
             u.id as seller_id, u.display_name as seller_name, u.username as seller_username,
             u.avatar_url as seller_avatar, u.avg_seller_rating, u.seller_verified
      FROM services s
      JOIN users u ON s.seller_id = u.id
      LEFT JOIN listing_categories c ON s.category_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${Math.min(50, Math.max(1, parseInt(limit)))} OFFSET ${offset}
    `, params);

    return paginatedResponse(res, dataRes.rows, total, parseInt(page), parseInt(limit));
  } catch (err) {
    next(err);
  }
});

router.get('/services/:slug', optionalAuthenticate, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const sRes = await queryRead(`
      SELECT s.*,
             c.name as category_name, c.slug as category_slug,
             u.id as seller_id, u.display_name as seller_name, u.username as seller_username,
             u.avatar_url as seller_avatar, u.bio as seller_bio, u.avg_seller_rating,
             u.seller_review_count, u.total_sales as seller_total_sales,
             u.seller_verified, u.seller_type, u.created_at as seller_member_since
      FROM services s
      JOIN users u ON s.seller_id = u.id
      LEFT JOIN listing_categories c ON s.category_id = c.id
      WHERE (s.slug = $1 OR s.id::text = $1) AND s.status = 'published'
    `, [slug]);

    if (sRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const service = sRes.rows[0];

    // Packages
    let packages = [];
    try {
      const pkgRes = await queryRead(`
        SELECT * FROM service_packages
        WHERE service_id = $1
        ORDER BY price_cents ASC
      `, [service.id]);
      packages = pkgRes.rows;
    } catch (_) {}

    // Default package if none in db
    if (packages.length === 0) {
      packages = [
        {
          id: 'pkg-basic',
          name: 'Basic',
          description: 'Essential starter package with core deliverable.',
          price_cents: service.starting_price_cents || 4900,
          delivery_time_days: service.delivery_time_days || 3,
          revisions: service.revision_limit || 2,
          features: ['Source files', 'High-res exports', 'Commercial license']
        },
        {
          id: 'pkg-standard',
          name: 'Standard',
          description: 'Full comprehensive product delivery with complete revisions.',
          price_cents: Math.round((service.starting_price_cents || 4900) * 1.8),
          delivery_time_days: Math.round((service.delivery_time_days || 3) * 1.5),
          revisions: 5,
          features: ['Everything in Basic', 'Design system kit', 'Prototype preview', 'Priority support']
        },
        {
          id: 'pkg-premium',
          name: 'Premium',
          description: 'Enterprise agency level turnaround with ongoing sprint handoff.',
          price_cents: Math.round((service.starting_price_cents || 4900) * 3),
          delivery_time_days: (service.delivery_time_days || 3) * 2,
          revisions: 10,
          features: ['Everything in Standard', 'Unlimited revisions', 'Figma tokens + code export', 'Dedicated PM']
        }
      ];
    }

    // Media
    let media = [];
    try {
      const mediaRes = await queryRead(`
        SELECT * FROM service_media
        WHERE service_id = $1
        ORDER BY is_primary DESC, display_order ASC
      `, [service.id]);
      media = mediaRes.rows;
    } catch (_) {}

    if (media.length === 0) {
      media = [
        {
          file_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
          is_primary: true
        }
      ];
    }

    // Reviews
    let reviews = [];
    try {
      const reviewsRes = await queryRead(`
        SELECT r.id, r.title, r.review_text, r.rating_overall, r.created_at,
               u.display_name as user_name, u.avatar_url as user_avatar
        FROM reviews r
        JOIN users u ON (r.reviewer_id = u.id OR r.customer_id = u.id)
        WHERE (r.service_id = $1 OR r.listing_id = $1) AND r.status = 'approved'
        ORDER BY r.created_at DESC
        LIMIT 10
      `, [service.id]);
      reviews = reviewsRes.rows;
    } catch (_) {}

    // Related services
    const relatedRes = await queryRead(`
      SELECT s.id, s.title, s.slug, s.starting_price_cents, s.avg_rating as rating, s.review_count,
             COALESCE((SELECT file_url FROM service_media WHERE service_id = s.id ORDER BY is_primary DESC, display_order ASC LIMIT 1), 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80') as featured_image_url,
             s.delivery_time_days,
             u.display_name as seller_name, u.avatar_url as seller_avatar
      FROM services s
      JOIN users u ON s.seller_id = u.id
      WHERE s.category_id = $1 AND s.id != $2 AND s.status = 'published'
      LIMIT 4
    `, [service.category_id, service.id]);

    return successResponse(res, {
      service: {
        ...service,
        rating: service.avg_rating,
        featured_image_url: media[0]?.file_url
      },
      packages,
      media,
      reviews,
      related_services: relatedRes.rows,
      seller: {
        id: service.seller_id,
        name: service.seller_name,
        username: service.seller_username,
        avatar: service.seller_avatar,
        bio: service.seller_bio,
        rating: service.avg_seller_rating,
        reviews_count: service.seller_review_count,
        total_sales: service.seller_total_sales,
        is_verified: service.seller_verified,
        member_since: service.seller_member_since
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. DIGITAL PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/products', optionalAuthenticate, async (req, res, next) => {
  try {
    const {
      category,
      category_id,
      min_price,
      max_price,
      min_rating,
      featured,
      search,
      sort = 'popular',
      page = 1,
      limit = 12
    } = req.query;

    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, Math.max(1, parseInt(limit)));
    const params = [];
    const conditions = ["p.status = 'published'"];

    if (category) {
      params.push(category);
      conditions.push(`(c.slug = $${params.length} OR c.id::text = $${params.length})`);
    }

    if (category_id) {
      params.push(category_id);
      conditions.push(`p.category_id = $${params.length}`);
    }

    if (min_price) {
      params.push(parseInt(min_price) * 100);
      conditions.push(`COALESCE(p.price_personal_cents, 2900) >= $${params.length}`);
    }

    if (max_price) {
      params.push(parseInt(max_price) * 100);
      conditions.push(`COALESCE(p.price_personal_cents, 2900) <= $${params.length}`);
    }

    if (min_rating) {
      params.push(parseFloat(min_rating));
      conditions.push(`p.avg_rating >= $${params.length}`);
    }

    if (featured === 'true') {
      conditions.push(`p.is_featured = true`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.short_description ILIKE $${params.length})`);
    }

    let orderBy = 'p.is_featured DESC, p.total_downloads DESC, p.avg_rating DESC';
    if (sort === 'newest') orderBy = 'p.created_at DESC';
    if (sort === 'rating') orderBy = 'p.avg_rating DESC, p.review_count DESC';
    if (sort === 'price_asc') orderBy = 'COALESCE(p.price_personal_cents, 2900) ASC';
    if (sort === 'price_desc') orderBy = 'COALESCE(p.price_personal_cents, 2900) DESC';
    if (sort === 'popular') orderBy = 'p.total_downloads DESC, p.avg_rating DESC';

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await queryRead(`
      SELECT COUNT(*)::int as total
      FROM digital_products p
      LEFT JOIN listing_categories c ON p.category_id = c.id
      ${whereClause}
    `, params);
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await queryRead(`
      SELECT p.id, p.title, p.slug, p.short_description, p.description,
             COALESCE(p.price_personal_cents, 2900) as price_cents,
             p.price_commercial_cents, p.price_extended_cents,
             p.avg_rating as rating, p.review_count, p.total_downloads as download_count,
             p.thumbnail_url, p.preview_images, p.is_featured, p.version, p.created_at,
             c.id as category_id, c.name as category_name, c.slug as category_slug,
             u.id as seller_id, u.display_name as seller_name, u.username as seller_username,
             u.avatar_url as seller_avatar, u.avg_seller_rating, u.seller_verified
      FROM digital_products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN listing_categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${Math.min(50, Math.max(1, parseInt(limit)))} OFFSET ${offset}
    `, params);

    return paginatedResponse(res, dataRes.rows, total, parseInt(page), parseInt(limit));
  } catch (err) {
    next(err);
  }
});

router.get('/products/:slug', optionalAuthenticate, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const pRes = await queryRead(`
      SELECT p.*,
             c.name as category_name, c.slug as category_slug,
             u.id as seller_id, u.display_name as seller_name, u.username as seller_username,
             u.avatar_url as seller_avatar, u.bio as seller_bio, u.avg_seller_rating,
             u.seller_review_count, u.total_sales as seller_total_sales,
             u.seller_verified, u.created_at as seller_member_since
      FROM digital_products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN listing_categories c ON p.category_id = c.id
      WHERE (p.slug = $1 OR p.id::text = $1) AND p.status = 'published'
    `, [slug]);

    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = pRes.rows[0];

    // Licenses
    const licenses = [
      {
        id: 'lic-personal',
        name: 'Personal License',
        price_cents: product.price_personal_cents || 2900,
        description: 'For single personal projects or internal prototyping. Non-commercial use.'
      },
      {
        id: 'lic-commercial',
        name: 'Commercial License',
        price_cents: product.price_commercial_cents || Math.round((product.price_personal_cents || 2900) * 1.8),
        description: 'For commercial client projects, SaaS products, and end-user distribution.'
      },
      {
        id: 'lic-extended',
        name: 'Extended Enterprise License',
        price_cents: product.price_extended_cents || Math.round((product.price_personal_cents || 2900) * 3.5),
        description: 'Unlimited team seats, re-distribution in digital items, and full source access.'
      }
    ];

    // Files metadata
    let files = [];
    try {
      const filesRes = await queryRead(`
        SELECT id, file_name, file_size_bytes, mime_type, file_format, is_primary
        FROM digital_product_files
        WHERE product_id = $1
      `, [product.id]);
      files = filesRes.rows;
    } catch (_) {}

    // Reviews
    let reviews = [];
    try {
      const reviewsRes = await queryRead(`
        SELECT r.id, r.title, r.review_text, r.rating_overall, r.created_at,
               u.display_name as user_name, u.avatar_url as user_avatar
        FROM reviews r
        JOIN users u ON (r.reviewer_id = u.id OR r.customer_id = u.id)
        WHERE (r.product_id = $1 OR r.listing_id = $1) AND r.status = 'approved'
        ORDER BY r.created_at DESC
        LIMIT 10
      `, [product.id]);
      reviews = reviewsRes.rows;
    } catch (_) {}

    // Related products
    const relatedRes = await queryRead(`
      SELECT p.id, p.title, p.slug, COALESCE(p.price_personal_cents, 2900) as price_cents,
             p.avg_rating as rating, p.review_count,
             p.thumbnail_url, p.total_downloads as download_count,
             u.display_name as seller_name, u.avatar_url as seller_avatar
      FROM digital_products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.category_id = $1 AND p.id != $2 AND p.status = 'published'
      LIMIT 4
    `, [product.category_id, product.id]);

    return successResponse(res, {
      product: {
        ...product,
        price_cents: product.price_personal_cents || 2900,
        rating: product.avg_rating,
        download_count: product.total_downloads
      },
      licenses,
      files,
      reviews,
      related_products: relatedRes.rows,
      seller: {
        id: product.seller_id,
        name: product.seller_name,
        username: product.seller_username,
        avatar: product.seller_avatar,
        bio: product.seller_bio,
        rating: product.avg_seller_rating,
        reviews_count: product.seller_review_count,
        total_sales: product.seller_total_sales,
        is_verified: product.seller_verified,
        member_since: product.seller_member_since
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. FEATURED CONTENT
// ─────────────────────────────────────────────────────────────────────────────
router.get('/featured', async (req, res, next) => {
  try {
    const featuredServices = await queryRead(`
      SELECT s.id, s.title, s.slug, s.short_description, s.starting_price_cents,
             s.avg_rating as rating, s.review_count,
             COALESCE((SELECT file_url FROM service_media WHERE service_id = s.id ORDER BY is_primary DESC, display_order ASC LIMIT 1), 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80') as featured_image_url,
             s.delivery_time_days,
             c.name as category_name, c.slug as category_slug,
             u.display_name as seller_name, u.avatar_url as seller_avatar
      FROM services s
      JOIN users u ON s.seller_id = u.id
      LEFT JOIN listing_categories c ON s.category_id = c.id
      WHERE s.status = 'published' AND s.is_featured = true
      ORDER BY s.avg_rating DESC, s.total_orders DESC
      LIMIT 8
    `);

    const featuredProducts = await queryRead(`
      SELECT p.id, p.title, p.slug, p.short_description,
             COALESCE(p.price_personal_cents, 2900) as price_cents,
             p.avg_rating as rating, p.review_count, p.thumbnail_url, p.total_downloads as download_count,
             c.name as category_name, c.slug as category_slug,
             u.display_name as seller_name, u.avatar_url as seller_avatar
      FROM digital_products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN listing_categories c ON p.category_id = c.id
      WHERE p.status = 'published' AND p.is_featured = true
      ORDER BY p.avg_rating DESC, p.total_downloads DESC
      LIMIT 8
    `);

    const featuredSellers = await queryRead(`
      SELECT id, display_name, username, avatar_url, bio, avg_seller_rating,
             seller_review_count, total_sales, seller_verified, seller_type
      FROM users
      WHERE (role = 'seller' OR seller_verified = true)
        AND account_status = 'active'
        AND avg_seller_rating >= 4.5
      ORDER BY avg_seller_rating DESC, total_sales DESC
      LIMIT 6
    `);

    const featuredCategories = await queryRead(`
      SELECT id, name, slug, icon_name, description, cover_image_url
      FROM listing_categories
      WHERE is_active = true AND is_featured = true
      ORDER BY sort_order ASC
      LIMIT 8
    `);

    return successResponse(res, {
      services: featuredServices.rows,
      products: featuredProducts.rows,
      sellers: featuredSellers.rows,
      categories: featuredCategories.rows
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. TRENDING CONTENT
// ─────────────────────────────────────────────────────────────────────────────
router.get('/trending', async (req, res, next) => {
  try {
    const trendingServices = await queryRead(`
      SELECT s.id, s.title, s.slug, s.short_description, s.starting_price_cents,
             s.avg_rating as rating, s.review_count, s.total_orders,
             COALESCE((SELECT file_url FROM service_media WHERE service_id = s.id ORDER BY is_primary DESC, display_order ASC LIMIT 1), 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80') as featured_image_url,
             c.name as category_name,
             u.display_name as seller_name, u.avatar_url as seller_avatar
      FROM services s
      JOIN users u ON s.seller_id = u.id
      LEFT JOIN listing_categories c ON s.category_id = c.id
      WHERE s.status = 'published'
      ORDER BY s.total_orders DESC, s.avg_rating DESC
      LIMIT 8
    `);

    const trendingProducts = await queryRead(`
      SELECT p.id, p.title, p.slug, p.short_description,
             COALESCE(p.price_personal_cents, 2900) as price_cents,
             p.avg_rating as rating, p.review_count, p.total_downloads as download_count, p.thumbnail_url,
             c.name as category_name,
             u.display_name as seller_name, u.avatar_url as seller_avatar
      FROM digital_products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN listing_categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.total_downloads DESC, p.avg_rating DESC
      LIMIT 8
    `);

    const trendingCategories = await queryRead(`
      SELECT c.id, c.name, c.slug, c.icon_name, c.description,
             (SELECT COUNT(*) FROM services s WHERE s.category_id = c.id AND s.status = 'published') +
             (SELECT COUNT(*) FROM digital_products p WHERE p.category_id = c.id AND p.status = 'published') as item_count
      FROM listing_categories c
      WHERE c.is_active = true
      ORDER BY item_count DESC
      LIMIT 8
    `);

    const popularSellers = await queryRead(`
      SELECT id, display_name, username, avatar_url, bio, avg_seller_rating,
             seller_review_count, total_sales, seller_verified
      FROM users
      WHERE (role = 'seller' OR seller_verified = true)
        AND account_status = 'active'
      ORDER BY total_sales DESC, avg_seller_rating DESC
      LIMIT 6
    `);

    return successResponse(res, {
      trending_services: trendingServices.rows,
      trending_products: trendingProducts.rows,
      trending_categories: trendingCategories.rows,
      popular_sellers: popularSellers.rows
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. SELLERS PUBLIC PROFILE
// ─────────────────────────────────────────────────────────────────────────────
router.get('/sellers/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const sellerRes = await queryRead(`
      SELECT id, display_name, username, avatar_url, bio, avg_seller_rating,
             seller_review_count, total_sales, seller_verified, seller_type,
             created_at as member_since
      FROM users
      WHERE (username = $1 OR id::text = $1)
        AND account_status = 'active'
    `, [slug]);

    if (sellerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const seller = sellerRes.rows[0];

    // Services by this seller
    const servicesRes = await queryRead(`
      SELECT s.id, s.title, s.slug, s.starting_price_cents, s.avg_rating as rating, s.review_count,
             COALESCE((SELECT file_url FROM service_media WHERE service_id = s.id ORDER BY is_primary DESC, display_order ASC LIMIT 1), 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80') as featured_image_url,
             s.delivery_time_days, c.name as category_name
      FROM services s
      LEFT JOIN listing_categories c ON s.category_id = c.id
      WHERE s.seller_id = $1 AND s.status = 'published'
      ORDER BY s.created_at DESC
    `, [seller.id]);

    // Products by this seller
    const productsRes = await queryRead(`
      SELECT p.id, p.title, p.slug, COALESCE(p.price_personal_cents, 2900) as price_cents,
             p.avg_rating as rating, p.review_count,
             p.thumbnail_url, p.total_downloads as download_count, c.name as category_name
      FROM digital_products p
      LEFT JOIN listing_categories c ON p.category_id = c.id
      WHERE p.seller_id = $1 AND p.status = 'published'
      ORDER BY p.created_at DESC
    `, [seller.id]);

    // Reviews for this seller
    let reviews = [];
    try {
      const reviewsRes = await queryRead(`
        SELECT r.id, r.title, r.review_text, r.rating_overall, r.created_at,
               u.display_name as reviewer_name, u.avatar_url as reviewer_avatar
        FROM reviews r
        JOIN users u ON (r.reviewer_id = u.id OR r.customer_id = u.id)
        WHERE r.seller_id = $1 AND r.status = 'approved'
        ORDER BY r.created_at DESC
        LIMIT 10
      `, [seller.id]);
      reviews = reviewsRes.rows;
    } catch (_) {}

    return successResponse(res, {
      seller,
      services: servicesRes.rows,
      products: productsRes.rows,
      reviews,
      stats: {
        total_services: servicesRes.rows.length,
        total_products: productsRes.rows.length,
        total_sales: seller.total_sales,
        avg_rating: seller.avg_seller_rating,
        review_count: seller.seller_review_count
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. BLOG
// ─────────────────────────────────────────────────────────────────────────────
router.get('/blog', async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 9 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(30, Math.max(1, parseInt(limit)));
    const params = [];
    const conditions = ["p.status = 'published'"];

    if (category) {
      params.push(category);
      conditions.push(`(c.slug = $${params.length} OR c.id::text = $${params.length})`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.title ILIKE $${params.length} OR p.excerpt ILIKE $${params.length} OR p.content_html ILIKE $${params.length})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await queryRead(`
      SELECT COUNT(*)::int as total
      FROM blog_posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      ${whereClause}
    `, params);
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await queryRead(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image_url,
             p.reading_time_mins as reading_time_minutes, p.published_at, p.views_count as view_count,
             c.name as category_name, c.slug as category_slug,
             u.display_name as author_name, u.avatar_url as author_avatar
      FROM blog_posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      ${whereClause}
      ORDER BY p.published_at DESC
      LIMIT ${Math.min(30, Math.max(1, parseInt(limit)))} OFFSET ${offset}
    `, params);

    // Blog categories
    let categories = [];
    try {
      const catsRes = await queryRead(`
        SELECT c.*, COUNT(p.id)::int as post_count
        FROM blog_categories c
        LEFT JOIN blog_posts p ON p.category_id = c.id AND p.status = 'published'
        GROUP BY c.id
        ORDER BY c.name ASC
      `);
      categories = catsRes.rows;
    } catch (_) {}

    // Featured post
    let featuredPost = null;
    try {
      const featRes = await queryRead(`
        SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image_url,
               p.reading_time_mins as reading_time_minutes, p.published_at,
               c.name as category_name,
               u.display_name as author_name, u.avatar_url as author_avatar
        FROM blog_posts p
        LEFT JOIN blog_categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.status = 'published' AND p.is_featured = true
        ORDER BY p.published_at DESC
        LIMIT 1
      `);
      featuredPost = featRes.rows[0] || null;
    } catch (_) {}

    return paginatedResponse(res, dataRes.rows, total, parseInt(page), parseInt(limit), {
      categories,
      featured_post: featuredPost
    });
  } catch (err) {
    next(err);
  }
});

router.get('/blog/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const postRes = await queryRead(`
      SELECT p.*,
             c.name as category_name, c.slug as category_slug,
             u.display_name as author_name, u.avatar_url as author_avatar, u.bio as author_bio
      FROM blog_posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE (p.slug = $1 OR p.id::text = $1) AND p.status = 'published'
    `, [slug]);

    if (postRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const post = postRes.rows[0];

    // Increment views non-blocking
    primaryPool.query(`UPDATE blog_posts SET views_count = views_count + 1 WHERE id = $1`, [post.id]).catch(() => {});

    // Related posts
    let relatedPosts = [];
    try {
      const relRes = await queryRead(`
        SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image_url,
               p.reading_time_mins as reading_time_minutes, p.published_at,
               c.name as category_name
        FROM blog_posts p
        LEFT JOIN blog_categories c ON p.category_id = c.id
        WHERE p.category_id = $1 AND p.id != $2 AND p.status = 'published'
        ORDER BY p.published_at DESC
        LIMIT 3
      `, [post.category_id, post.id]);
      relatedPosts = relRes.rows;
    } catch (_) {}

    return successResponse(res, {
      post,
      related_posts: relatedPosts,
      seo: {
        title: post.seo_title || `${post.title} | Desigot Blog`,
        description: post.seo_description || post.excerpt,
        og_title: post.og_title || post.title,
        og_description: post.og_description || post.excerpt,
        og_image: post.og_image || post.featured_image_url,
        canonical_url: post.canonical_url || `https://desigot.com/blog/${post.slug}`
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. STATIC / CMS PAGES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/pages/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const pageRes = await queryRead(`
      SELECT * FROM cms_static_pages
      WHERE slug = $1 AND status = 'published'
    `, [slug]);

    if (pageRes.rows.length > 0) {
      return successResponse(res, pageRes.rows[0]);
    }

    const legalRes = await queryRead(`
      SELECT doc_type as slug, title, content_html, version, effective_date, updated_at
      FROM cms_legal_documents
      WHERE doc_type = $1 AND is_published = true
    `, [slug]);

    if (legalRes.rows.length > 0) {
      return successResponse(res, legalRes.rows[0]);
    }

    return res.status(404).json({ success: false, message: 'Page not found' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. GLOBAL SEARCH
// ─────────────────────────────────────────────────────────────────────────────
router.get('/search', optionalAuthenticate, async (req, res, next) => {
  try {
    const {
      q = '',
      type,
      category_id,
      min_price,
      max_price,
      min_rating,
      page = 1,
      limit = 12
    } = req.query;

    const searchTerm = q.trim();
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, Math.max(1, parseInt(limit)));
    const results = {
      query: searchTerm,
      type: type || 'all',
      services: [],
      products: [],
      categories: [],
      sellers: [],
      blog: [],
      total: 0
    };

    if (searchTerm.length >= 2) {
      primaryPool.query(
        `INSERT INTO search_queries (query_text, user_id, result_count, searched_at)
         VALUES ($1, $2, 0, CURRENT_TIMESTAMP)
         ON CONFLICT (query_text) DO UPDATE SET search_count = search_queries.search_count + 1, last_searched_at = CURRENT_TIMESTAMP`,
        [searchTerm.toLowerCase(), req.user?.id || null]
      ).catch(() => {});
    }

    const searchPattern = `%${searchTerm}%`;

    // 1. Services
    if (!type || type === 'services') {
      const sParams = [searchPattern];
      let sWhere = "s.status = 'published' AND (s.title ILIKE $1 OR s.description ILIKE $1 OR s.short_description ILIKE $1)";
      if (category_id) {
        sParams.push(category_id);
        sWhere += ` AND s.category_id = $${sParams.length}`;
      }
      if (min_price) {
        sParams.push(parseInt(min_price) * 100);
        sWhere += ` AND s.starting_price_cents >= $${sParams.length}`;
      }
      if (max_price) {
        sParams.push(parseInt(max_price) * 100);
        sWhere += ` AND s.starting_price_cents <= $${sParams.length}`;
      }
      if (min_rating) {
        sParams.push(parseFloat(min_rating));
        sWhere += ` AND s.avg_rating >= $${sParams.length}`;
      }

      const sRes = await queryRead(`
        SELECT s.id, s.title, s.slug, s.short_description, s.starting_price_cents,
               s.avg_rating as rating, s.review_count, s.delivery_time_days,
               COALESCE((SELECT file_url FROM service_media WHERE service_id = s.id ORDER BY is_primary DESC, display_order ASC LIMIT 1), 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80') as featured_image_url,
               'service' as item_type,
               c.name as category_name,
               u.display_name as seller_name, u.avatar_url as seller_avatar
        FROM services s
        JOIN users u ON s.seller_id = u.id
        LEFT JOIN listing_categories c ON s.category_id = c.id
        WHERE ${sWhere}
        ORDER BY s.avg_rating DESC, s.total_orders DESC
        LIMIT ${type === 'services' ? Math.min(50, Math.max(1, parseInt(limit))) : 6}
        OFFSET ${type === 'services' ? offset : 0}
      `, sParams);

      results.services = sRes.rows;
      if (type === 'services') {
        const cRes = await queryRead(`SELECT COUNT(*)::int as total FROM services s WHERE ${sWhere}`, sParams);
        results.total = cRes.rows[0]?.total || 0;
      }
    }

    // 2. Products
    if (!type || type === 'products') {
      const pParams = [searchPattern];
      let pWhere = "p.status = 'published' AND (p.title ILIKE $1 OR p.description ILIKE $1 OR p.short_description ILIKE $1)";
      if (category_id) {
        pParams.push(category_id);
        pWhere += ` AND p.category_id = $${pParams.length}`;
      }
      if (min_price) {
        pParams.push(parseInt(min_price) * 100);
        pWhere += ` AND COALESCE(p.price_personal_cents, 2900) >= $${pParams.length}`;
      }
      if (max_price) {
        pParams.push(parseInt(max_price) * 100);
        pWhere += ` AND COALESCE(p.price_personal_cents, 2900) <= $${pParams.length}`;
      }
      if (min_rating) {
        pParams.push(parseFloat(min_rating));
        pWhere += ` AND p.avg_rating >= $${pParams.length}`;
      }

      const pRes = await queryRead(`
        SELECT p.id, p.title, p.slug, p.short_description,
               COALESCE(p.price_personal_cents, 2900) as price_cents,
               p.avg_rating as rating, p.review_count, p.thumbnail_url, p.total_downloads as download_count,
               'product' as item_type,
               c.name as category_name,
               u.display_name as seller_name, u.avatar_url as seller_avatar
        FROM digital_products p
        JOIN users u ON p.seller_id = u.id
        LEFT JOIN listing_categories c ON p.category_id = c.id
        WHERE ${pWhere}
        ORDER BY p.total_downloads DESC, p.avg_rating DESC
        LIMIT ${type === 'products' ? Math.min(50, Math.max(1, parseInt(limit))) : 6}
        OFFSET ${type === 'products' ? offset : 0}
      `, pParams);

      results.products = pRes.rows;
      if (type === 'products') {
        const cRes = await queryRead(`SELECT COUNT(*)::int as total FROM digital_products p WHERE ${pWhere}`, pParams);
        results.total = cRes.rows[0]?.total || 0;
      }
    }

    // 3. Categories
    if (!type || type === 'categories') {
      const catRes = await queryRead(`
        SELECT id, name, slug, icon_name, description
        FROM listing_categories
        WHERE is_active = true AND (name ILIKE $1 OR description ILIKE $1)
        ORDER BY sort_order ASC
        LIMIT 6
      `, [searchPattern]);
      results.categories = catRes.rows;
    }

    // 4. Sellers
    if (!type || type === 'sellers') {
      const sellRes = await queryRead(`
        SELECT id, display_name, username, avatar_url, bio, avg_seller_rating,
               seller_review_count, total_sales, seller_verified
        FROM users
        WHERE (role = 'seller' OR seller_verified = true)
          AND account_status = 'active'
          AND (display_name ILIKE $1 OR username ILIKE $1 OR bio ILIKE $1)
        ORDER BY avg_seller_rating DESC, total_sales DESC
        LIMIT 6
      `, [searchPattern]);
      results.sellers = sellRes.rows;
    }

    // 5. Blog
    if (!type || type === 'blog') {
      const blogRes = await queryRead(`
        SELECT id, title, slug, excerpt, featured_image_url, published_at
        FROM blog_posts
        WHERE status = 'published' AND (title ILIKE $1 OR excerpt ILIKE $1 OR content_html ILIKE $1)
        ORDER BY published_at DESC
        LIMIT 6
      `, [searchPattern]);
      results.blog = blogRes.rows;
    }

    if (!type) {
      results.total = results.services.length + results.products.length + results.categories.length + results.sellers.length + results.blog.length;
    }

    return successResponse(res, results);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. SEARCH SUGGESTIONS & POPULAR
// ─────────────────────────────────────────────────────────────────────────────
router.get('/search/suggestions', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return successResponse(res, { suggestions: [], categories: [] });
    }

    const pattern = `%${q}%`;

    const sRes = await queryRead(`
      SELECT title, slug, 'service' as type FROM services
      WHERE status = 'published' AND title ILIKE $1
      LIMIT 4
    `, [pattern]);

    const pRes = await queryRead(`
      SELECT title, slug, 'product' as type FROM digital_products
      WHERE status = 'published' AND title ILIKE $1
      LIMIT 4
    `, [pattern]);

    const cRes = await queryRead(`
      SELECT name as title, slug, 'category' as type FROM listing_categories
      WHERE is_active = true AND name ILIKE $1
      LIMIT 4
    `, [pattern]);

    return successResponse(res, {
      suggestions: [...sRes.rows, ...pRes.rows],
      categories: cRes.rows
    });
  } catch (err) {
    next(err);
  }
});

router.get('/search/popular', async (req, res, next) => {
  try {
    const defaultPopular = [
      'UI Kits',
      'Mobile App Design',
      'Dashboard Design',
      'Icons',
      'Figma Design System',
      'Landing Page Templates',
      'SaaS Dashboard',
      'Brand Identity'
    ];

    try {
      const popRes = await queryRead(`
        SELECT query_text, search_count
        FROM search_queries
        ORDER BY search_count DESC
        LIMIT 8
      `);
      if (popRes.rows.length > 0) {
        return successResponse(res, popRes.rows.map(r => r.query_text));
      }
    } catch (_) {}

    return successResponse(res, defaultPopular);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PUBLIC FOOTER & NEWSLETTER ENDPOINTS
// ============================================================================
router.get('/footer', async (req, res, next) => {
  try {
    const sRes = await queryRead(`SELECT * FROM cms_footer_settings WHERE is_active = true LIMIT 1`);
    const cRes = await queryRead(`SELECT * FROM cms_footer_columns WHERE is_active = true ORDER BY column_order ASC`);
    const lRes = await queryRead(`SELECT * FROM cms_footer_links WHERE is_active = true ORDER BY sort_order ASC`);
    const socRes = await queryRead(`SELECT * FROM footer_social_links WHERE enabled = true ORDER BY display_order ASC`);
    const legRes = await queryRead(`SELECT * FROM footer_legal_links WHERE enabled = true ORDER BY display_order ASC`);

    const columns = cRes.rows.map(col => ({
      ...col,
      links: lRes.rows.filter(l => l.column_id === col.id)
    }));

    return successResponse(res, {
      settings: sRes.rows[0] || null,
      columns,
      social_links: socRes.rows,
      legal_links: legRes.rows
    });
  } catch (err) {
    next(err);
  }
});

router.get('/footer/columns', async (req, res, next) => {
  try {
    const cRes = await queryRead(`SELECT * FROM cms_footer_columns WHERE is_active = true ORDER BY column_order ASC`);
    const lRes = await queryRead(`SELECT * FROM cms_footer_links WHERE is_active = true ORDER BY sort_order ASC`);
    const columns = cRes.rows.map(col => ({
      ...col,
      links: lRes.rows.filter(l => l.column_id === col.id)
    }));
    return successResponse(res, columns);
  } catch (err) {
    next(err);
  }
});

router.get('/footer/social-links', async (req, res, next) => {
  try {
    const socRes = await queryRead(`SELECT * FROM footer_social_links WHERE enabled = true ORDER BY display_order ASC`);
    return successResponse(res, socRes.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/footer/legal-links', async (req, res, next) => {
  try {
    const legRes = await queryRead(`SELECT * FROM footer_legal_links WHERE enabled = true ORDER BY display_order ASC`);
    return successResponse(res, legRes.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/footer/settings', async (req, res, next) => {
  try {
    const sRes = await queryRead(`SELECT * FROM cms_footer_settings WHERE is_active = true LIMIT 1`);
    return successResponse(res, sRes.rows[0] || null);
  } catch (err) {
    next(err);
  }
});

router.post('/newsletter/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await queryRead(`SELECT * FROM newsletter_subscribers WHERE email = $1`, [cleanEmail]);

    if (existing.rows.length > 0) {
      if (existing.rows[0].status === 'active' || existing.rows[0].status === 'subscribed') {
        return successResponse(res, { alreadySubscribed: true }, 200, {
          message: 'You are already subscribed to the Desigot creative newsletter!'
        });
      } else {
        await queryRead(`
          UPDATE newsletter_subscribers 
          SET status = 'active', unsubscribed_at = NULL, subscribed_at = NOW() 
          WHERE id = $1
        `, [existing.rows[0].id]);
        return successResponse(res, { reactivated: true }, 200, {
          message: 'Welcome back! Your newsletter subscription has been reactivated.'
        });
      }
    }

    const ins = await queryRead(`
      INSERT INTO newsletter_subscribers (email, status, source, subscribed_at)
      VALUES ($1, 'active', 'footer_widget', NOW())
      RETURNING id, email, status, subscribed_at
    `, [cleanEmail]);

    return successResponse(res, ins.rows[0], 201, {
      message: 'Thank you for subscribing! Check your inbox for your welcome design asset kit.'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/newsletter/unsubscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    await queryRead(`
      UPDATE newsletter_subscribers 
      SET status = 'unsubscribed', unsubscribed_at = NOW() 
      WHERE email = $1
    `, [cleanEmail]);
    return successResponse(res, { success: true }, 200, {
      message: 'You have been successfully unsubscribed from Desigot newsletters.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
