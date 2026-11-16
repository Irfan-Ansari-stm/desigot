-- ============================================================================
-- DESIGOT CMS & WEBSITE MANAGEMENT SYSTEM MIGRATION
-- Module 12: Complete Website CMS, Dynamic Page Builder, Navigation, Blog, SEO
-- ============================================================================

-- 1. CMS Homepage Settings
CREATE TABLE IF NOT EXISTS cms_homepage_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_title VARCHAR(255) NOT NULL DEFAULT 'Desigot – The Global UI/UX Design Marketplace',
  meta_description TEXT DEFAULT 'Discover premium design assets, UI kits, and custom services from elite designers worldwide.',
  hero_id UUID,
  announcement_bar_enabled BOOLEAN DEFAULT true,
  announcement_bar_text TEXT DEFAULT '🚀 Launch Week: Use code WELCOME10 for 10% off your first order!',
  announcement_bar_link TEXT DEFAULT '/browse',
  sections_order JSONB DEFAULT '["hero", "promotions", "featured_products", "categories", "trending_services", "testimonials", "stats", "newsletter"]'::jsonb,
  is_published BOOLEAN DEFAULT true,
  updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CMS Homepage Sections
CREATE TABLE IF NOT EXISTS cms_homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key VARCHAR(80) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(255),
  section_type VARCHAR(50) NOT NULL, -- hero, banners, featured_products, featured_services, trending_products, trending_services, categories, custom_content, stats, testimonials, newsletter
  display_layout VARCHAR(50) DEFAULT 'grid', -- grid, carousel, highlight, split
  grid_columns INT DEFAULT 4,
  display_count INT DEFAULT 8,
  sort_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CMS Hero Sections & Slides
CREATE TABLE IF NOT EXISTS cms_hero_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  desktop_image_url TEXT NOT NULL,
  tablet_image_url TEXT,
  mobile_image_url TEXT,
  primary_cta_text VARCHAR(60) DEFAULT 'Explore Marketplace',
  primary_cta_url TEXT DEFAULT '/browse',
  secondary_cta_text VARCHAR(60) DEFAULT 'Hire Designers',
  secondary_cta_url TEXT DEFAULT '/browse?listing_type=service',
  text_align VARCHAR(20) DEFAULT 'center', -- left, center, right
  text_color VARCHAR(20) DEFAULT '#FFFFFF',
  overlay_color VARCHAR(20) DEFAULT '#0B0F19',
  overlay_opacity NUMERIC(3,2) DEFAULT 0.50,
  priority INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CMS Navigation Menus & Items
CREATE TABLE IF NOT EXISTS cms_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key VARCHAR(80) UNIQUE NOT NULL, -- header_primary, header_secondary, mobile_drawer, footer_legal
  title VARCHAR(150) NOT NULL,
  location VARCHAR(80) DEFAULT 'header',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES cms_menus(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES cms_menu_items(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  item_type VARCHAR(50) DEFAULT 'internal_page', -- internal_page, category, service, product, custom_url, external_url
  target_url TEXT NOT NULL,
  icon VARCHAR(50),
  sort_order INT DEFAULT 1,
  target_blank BOOLEAN DEFAULT false,
  desktop_visible BOOLEAN DEFAULT true,
  mobile_visible BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CMS Browse Mega Menu Columns & Items
CREATE TABLE IF NOT EXISTS cms_mega_menu_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  column_order INT DEFAULT 1,
  width_cols INT DEFAULT 3, -- in 12-col grid
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_mega_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES cms_mega_menu_columns(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  category_id UUID REFERENCES listing_categories(id) ON DELETE SET NULL,
  custom_url TEXT,
  icon VARCHAR(50),
  sort_order INT DEFAULT 1,
  is_featured BOOLEAN DEFAULT false,
  badge_text VARCHAR(30),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CMS Services Page & Categories Page Settings
CREATE TABLE IF NOT EXISTS cms_services_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_title VARCHAR(200) NOT NULL DEFAULT 'Explore Top-Tier Design & Development Services',
  subtitle TEXT DEFAULT 'Collaborate with verified agencies and specialist freelancers worldwide.',
  banner_url TEXT,
  featured_service_ids UUID[] DEFAULT NULL,
  faq_category_id UUID,
  config JSONB DEFAULT '{}'::jsonb,
  updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_categories_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_title VARCHAR(200) NOT NULL DEFAULT 'Explore Marketplace Taxonomy & Design Assets',
  description TEXT DEFAULT 'Browse high-quality digital templates, UI kits, design systems, and creative assets.',
  banner_url TEXT,
  featured_category_ids UUID[] DEFAULT NULL,
  layout VARCHAR(50) DEFAULT 'grid',
  config JSONB DEFAULT '{}'::jsonb,
  updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CMS Featured Sections & Trending Sections
CREATE TABLE IF NOT EXISTS cms_featured_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  heading VARCHAR(200) NOT NULL,
  subtitle VARCHAR(255),
  section_type VARCHAR(50) NOT NULL, -- featured_products, featured_services, featured_categories, featured_sellers
  item_ids UUID[] DEFAULT NULL,
  layout VARCHAR(50) DEFAULT 'grid',
  grid_columns INT DEFAULT 4,
  sort_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_trending_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  heading VARCHAR(200) NOT NULL,
  subtitle VARCHAR(255),
  trending_type VARCHAR(50) NOT NULL, -- trending_products, trending_services, trending_categories
  ranking_method VARCHAR(50) DEFAULT 'hybrid', -- views, sales, hybrid, manual
  min_activity_threshold INT DEFAULT 10,
  display_count INT DEFAULT 8,
  sort_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CMS About Us Content & Team Members
CREATE TABLE IF NOT EXISTS cms_about_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL DEFAULT 'About Desigot Marketplace',
  hero_image_url TEXT,
  intro TEXT,
  story_html TEXT,
  mission TEXT,
  vision TEXT,
  values_json JSONB DEFAULT '[]'::jsonb,
  stats_json JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT true,
  version INT DEFAULT 1,
  updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  role VARCHAR(100) NOT NULL,
  bio TEXT,
  photo_url TEXT,
  social_links_json JSONB DEFAULT '{}'::jsonb,
  sort_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CMS Contact Settings & Submissions
CREATE TABLE IF NOT EXISTS cms_contact_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  heading VARCHAR(200) NOT NULL DEFAULT 'Get in Touch with Desigot Support',
  description TEXT DEFAULT 'We are here to assist with transactions, creator partnerships, and marketplace inquiries.',
  support_email VARCHAR(150) DEFAULT 'support@desigot.com',
  phone VARCHAR(50) DEFAULT '+1 (800) 555-0199',
  address TEXT DEFAULT '100 Montgomery St, Suite 1800, San Francisco, CA 94104',
  business_hours VARCHAR(150) DEFAULT 'Mon – Fri: 9:00 AM – 6:00 PM PST',
  social_links_json JSONB DEFAULT '{}'::jsonb,
  form_fields_json JSONB DEFAULT '["name", "email", "subject", "message"]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  status VARCHAR(30) DEFAULT 'new', -- new, in_progress, responded, closed, spam
  assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CMS FAQ Categories & Entries
CREATE TABLE IF NOT EXISTS cms_faq_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  sort_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES cms_faq_categories(id) ON DELETE SET NULL,
  question VARCHAR(255) NOT NULL,
  answer_html TEXT NOT NULL,
  display_position INT DEFAULT 1,
  is_published BOOLEAN DEFAULT true,
  page_association VARCHAR(50) DEFAULT 'all', -- all, homepage, services, products, orders, refunds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CMS Legal Documents & Versioning (Terms, Privacy, Refund Policy)
CREATE TABLE IF NOT EXISTS cms_legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type VARCHAR(50) UNIQUE NOT NULL, -- terms, privacy, refund_policy
  title VARCHAR(200) NOT NULL,
  content_html TEXT NOT NULL,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_published BOOLEAN DEFAULT true,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_legal_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES cms_legal_documents(id) ON DELETE CASCADE,
  doc_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content_html TEXT NOT NULL,
  change_summary TEXT,
  published_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CMS Footer Settings, Columns & Links
CREATE TABLE IF NOT EXISTS cms_footer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_info TEXT DEFAULT 'The premier marketplace for enterprise design systems, digital assets, and custom agency services.',
  copyright_text VARCHAR(200) DEFAULT '© 2026 Desigot Inc. All rights reserved.',
  social_links_json JSONB DEFAULT '{"twitter": "https://twitter.com/desigot", "github": "https://github.com/desigot", "linkedin": "https://linkedin.com/company/desigot"}'::jsonb,
  payment_icons_json JSONB DEFAULT '["visa", "mastercard", "stripe", "apple_pay", "google_pay"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_footer_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  column_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES cms_footer_columns(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  sort_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CMS Static Pages & Version Control
CREATE TABLE IF NOT EXISTS cms_static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  content_html TEXT,
  content_blocks_json JSONB DEFAULT '[]'::jsonb,
  featured_image_url TEXT,
  seo_title VARCHAR(200),
  seo_description TEXT,
  status VARCHAR(30) DEFAULT 'published', -- draft, pending_review, scheduled, published, archived
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_static_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES cms_static_pages(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  title VARCHAR(200) NOT NULL,
  content_html TEXT,
  content_blocks_json JSONB,
  change_notes TEXT,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CMS Blog System (Categories, Tags, Posts, Revisions)
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) UNIQUE NOT NULL,
  slug VARCHAR(80) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content_html TEXT NOT NULL,
  featured_image_url TEXT,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reading_time_mins INT DEFAULT 5,
  seo_title VARCHAR(255),
  seo_description TEXT,
  canonical_url TEXT,
  status VARCHAR(30) DEFAULT 'published', -- draft, scheduled, published, archived
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS blog_post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  revision_num INT NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content_html TEXT NOT NULL,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CMS Media Library Assets
CREATE TABLE IF NOT EXISTS cms_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) DEFAULT 'image', -- image, document, video
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  alt_text VARCHAR(255),
  caption TEXT,
  uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. CMS Global SEO Settings & Redirects
CREATE TABLE IF NOT EXISTS cms_seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_meta_title VARCHAR(200) DEFAULT 'Desigot – UI/UX Marketplace & Creative Talents',
  default_meta_description TEXT DEFAULT 'Browse world-class digital design products, design tokens, and custom UX services.',
  default_og_image TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  favicon_url TEXT DEFAULT '/favicon.ico',
  canonical_base_url VARCHAR(255) DEFAULT 'https://desigot.com',
  sitemap_enabled BOOLEAN DEFAULT true,
  robots_txt_content TEXT DEFAULT E'User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /api/\nSitemap: https://desigot.com/sitemap.xml',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path VARCHAR(255) UNIQUE NOT NULL,
  destination_path VARCHAR(255) NOT NULL,
  redirect_type INT DEFAULT 301, -- 301, 302
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. CMS Audit Logs
CREATE TABLE IF NOT EXISTS cms_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL, -- create, update, delete, publish, schedule, restore, reorder
  entity_type VARCHAR(50) NOT NULL, -- homepage, hero, navigation, mega_menu, services_page, categories_page, featured, trending, about, contact, faq, legal, footer, page, blog, media, seo
  entity_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for maximum query performance
CREATE INDEX IF NOT EXISTS idx_cms_hero_active ON cms_hero_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_cms_menu_items_menu ON cms_menu_items(menu_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_mega_items_col ON cms_mega_menu_items(column_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_faqs_cat ON cms_faqs(category_id, display_position);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_static_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON cms_static_pages(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_cms_audit_created ON cms_audit_logs(created_at DESC);
