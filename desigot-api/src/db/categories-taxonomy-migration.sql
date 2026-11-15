-- ====================================================================
-- DESIGOT CATEGORIES & TAXONOMY MANAGEMENT SYSTEM MIGRATION
-- Module 7: Hierarchical Categories, Dynamic Attributes, Icons, Banners, SEO, History
-- ====================================================================

-- 1. Extend listing_categories with full taxonomy & SEO columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='short_description') THEN
    ALTER TABLE listing_categories ADD COLUMN short_description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='category_type') THEN
    ALTER TABLE listing_categories ADD COLUMN category_type VARCHAR(32) NOT NULL DEFAULT 'shared';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='status') THEN
    ALTER TABLE listing_categories ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'published';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='visibility') THEN
    ALTER TABLE listing_categories ADD COLUMN visibility VARCHAR(32) NOT NULL DEFAULT 'public';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='is_featured') THEN
    ALTER TABLE listing_categories ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='show_on_homepage') THEN
    ALTER TABLE listing_categories ADD COLUMN show_on_homepage BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='show_in_navigation') THEN
    ALTER TABLE listing_categories ADD COLUMN show_in_navigation BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='show_in_marketplace') THEN
    ALTER TABLE listing_categories ADD COLUMN show_in_marketplace BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='display_order') THEN
    ALTER TABLE listing_categories ADD COLUMN display_order INT NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='meta_description') THEN
    ALTER TABLE listing_categories ADD COLUMN meta_description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='canonical_url') THEN
    ALTER TABLE listing_categories ADD COLUMN canonical_url VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='og_title') THEN
    ALTER TABLE listing_categories ADD COLUMN og_title VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='og_description') THEN
    ALTER TABLE listing_categories ADD COLUMN og_description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='og_image') THEN
    ALTER TABLE listing_categories ADD COLUMN og_image VARCHAR(500);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='index_status') THEN
    ALTER TABLE listing_categories ADD COLUMN index_status VARCHAR(32) NOT NULL DEFAULT 'index';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='follow_status') THEN
    ALTER TABLE listing_categories ADD COLUMN follow_status VARCHAR(32) NOT NULL DEFAULT 'follow';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='icon_id') THEN
    ALTER TABLE listing_categories ADD COLUMN icon_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='banner_id') THEN
    ALTER TABLE listing_categories ADD COLUMN banner_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='created_by') THEN
    ALTER TABLE listing_categories ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='updated_by') THEN
    ALTER TABLE listing_categories ADD COLUMN updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='published_at') THEN
    ALTER TABLE listing_categories ADD COLUMN published_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listing_categories' AND column_name='deleted_at') THEN
    ALTER TABLE listing_categories ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Synchronize display_order from sort_order if sort_order > 0
UPDATE listing_categories SET display_order = sort_order WHERE display_order = 0 AND sort_order > 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_categories_type ON listing_categories(category_type);
CREATE INDEX IF NOT EXISTS idx_listing_categories_status ON listing_categories(status);
CREATE INDEX IF NOT EXISTS idx_listing_categories_visibility ON listing_categories(visibility);
CREATE INDEX IF NOT EXISTS idx_listing_categories_display_order ON listing_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_listing_categories_featured ON listing_categories(is_featured);
CREATE INDEX IF NOT EXISTS idx_listing_categories_deleted_at ON listing_categories(deleted_at);

-- 2. Category Icons Library
CREATE TABLE IF NOT EXISTS category_icons (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        VARCHAR(120) NOT NULL,
  icon_type                   VARCHAR(32) NOT NULL DEFAULT 'library', -- 'library', 'svg', 'png', 'webp'
  icon_ref                    VARCHAR(255) NOT NULL,
  svg_content                 TEXT,
  file_format                 VARCHAR(32) DEFAULT 'svg',
  file_size_bytes             INT DEFAULT 0,
  dimensions                  VARCHAR(64) DEFAULT '24x24',
  status                      VARCHAR(32) DEFAULT 'active',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_icons_status ON category_icons(status);
CREATE INDEX IF NOT EXISTS idx_category_icons_type ON category_icons(icon_type);

-- 3. Category Banners Management
CREATE TABLE IF NOT EXISTS category_banners (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        VARCHAR(150) NOT NULL,
  category_id                 UUID REFERENCES listing_categories(id) ON DELETE CASCADE,
  desktop_image_url           VARCHAR(500) NOT NULL,
  tablet_image_url            VARCHAR(500),
  mobile_image_url            VARCHAR(500),
  alt_text                    VARCHAR(255),
  banner_link                 VARCHAR(500),
  display_priority            INT NOT NULL DEFAULT 1,
  status                      VARCHAR(32) NOT NULL DEFAULT 'active',
  start_date                  TIMESTAMPTZ,
  end_date                    TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_banners_cid ON category_banners(category_id);
CREATE INDEX IF NOT EXISTS idx_category_banners_status ON category_banners(status);

-- 4. Dynamic Category Attributes
CREATE TABLE IF NOT EXISTS category_attributes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id                 UUID REFERENCES listing_categories(id) ON DELETE CASCADE,
  name                        VARCHAR(120) NOT NULL,
  key                         VARCHAR(120) NOT NULL,
  type                        VARCHAR(64) NOT NULL DEFAULT 'text', -- 'text', 'textarea', 'number', 'decimal', 'boolean', 'single_select', 'multi_select', 'date', 'color', 'file', 'url'
  description                 TEXT,
  placeholder                 VARCHAR(255),
  default_value               TEXT,
  is_required                 BOOLEAN NOT NULL DEFAULT FALSE,
  is_filterable               BOOLEAN NOT NULL DEFAULT TRUE,
  is_searchable               BOOLEAN NOT NULL DEFAULT TRUE,
  is_sortable                 BOOLEAN NOT NULL DEFAULT FALSE,
  seller_editable             BOOLEAN NOT NULL DEFAULT TRUE,
  customer_visible            BOOLEAN NOT NULL DEFAULT TRUE,
  validation_rules            JSONB DEFAULT '{}',
  allowed_values              JSONB DEFAULT '[]', -- array of { label: string, value: string }
  display_order               INT NOT NULL DEFAULT 0,
  status                      VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_attributes_cid ON category_attributes(category_id);
CREATE INDEX IF NOT EXISTS idx_category_attributes_key ON category_attributes(key);
CREATE INDEX IF NOT EXISTS idx_category_attributes_type ON category_attributes(type);

-- 5. Category URL Redirects
CREATE TABLE IF NOT EXISTS category_redirects (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id                 UUID REFERENCES listing_categories(id) ON DELETE CASCADE,
  old_slug                    VARCHAR(255) NOT NULL,
  new_slug                    VARCHAR(255) NOT NULL,
  http_status_code            INT NOT NULL DEFAULT 301,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_redirects_old ON category_redirects(old_slug);
CREATE INDEX IF NOT EXISTS idx_category_redirects_cid ON category_redirects(category_id);

-- 6. Category Event Audit & History
CREATE TABLE IF NOT EXISTS category_history (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id                 UUID REFERENCES listing_categories(id) ON DELETE CASCADE,
  action                      VARCHAR(64) NOT NULL,
  actor_id                    UUID REFERENCES users(id) ON DELETE SET NULL,
  reason                      TEXT,
  old_data                    JSONB,
  new_data                    JSONB,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_history_cid ON category_history(category_id);
CREATE INDEX IF NOT EXISTS idx_category_history_created ON category_history(created_at DESC);

-- 7. Register Granular Taxonomy Permissions
INSERT INTO permissions (name, slug, resource, action, description, is_system)
VALUES
  ('Read Categories', 'categories.read', 'categories', 'read', 'View all marketplace categories', true),
  ('Create Categories', 'categories.create', 'categories', 'create', 'Create new marketplace categories', true),
  ('Update Categories', 'categories.update', 'categories', 'update', 'Update category details and hierarchy', true),
  ('Delete Categories', 'categories.delete', 'categories', 'delete', 'Delete unreferenced categories', true),
  ('Restore Categories', 'categories.restore', 'categories', 'restore', 'Restore archived categories', true),
  ('Publish Categories', 'categories.publish', 'categories', 'publish', 'Publish or unpublish categories', true),
  ('Archive Categories', 'categories.archive', 'categories', 'archive', 'Archive existing categories', true),
  ('Manage Category Status', 'categories.manage_status', 'categories', 'manage_status', 'Change category lifecycle status', true),
  ('Export Categories', 'categories.export', 'categories', 'export', 'Export category catalog data to CSV', true),
  ('View Category History', 'categories.view_history', 'categories', 'view_history', 'View category audit and event history', true),

  ('Read Hierarchy', 'categories.hierarchy.read', 'categories', 'read_hierarchy', 'Read category tree and hierarchy', true),
  ('Create Hierarchy', 'categories.hierarchy.create', 'categories', 'create_hierarchy', 'Create nested category branches', true),
  ('Update Hierarchy', 'categories.hierarchy.update', 'categories', 'update_hierarchy', 'Update parent-child relationships', true),
  ('Move Hierarchy', 'categories.hierarchy.move', 'categories', 'move', 'Move subcategories between parents', true),
  ('Reorder Hierarchy', 'categories.hierarchy.reorder', 'categories', 'reorder', 'Reorder category display order', true),

  ('Read Service Categories', 'service_categories.read', 'service_categories', 'read', 'View service taxonomy', true),
  ('Create Service Categories', 'service_categories.create', 'service_categories', 'create', 'Create service categories', true),
  ('Update Service Categories', 'service_categories.update', 'service_categories', 'update', 'Update service category details', true),
  ('Assign Service Categories', 'service_categories.assign', 'service_categories', 'assign', 'Assign services to categories', true),
  ('Remove Service Categories', 'service_categories.remove', 'service_categories', 'remove', 'Remove service category assignments', true),

  ('Read Product Categories', 'product_categories.read', 'product_categories', 'read', 'View product taxonomy', true),
  ('Create Product Categories', 'product_categories.create', 'product_categories', 'create', 'Create product categories', true),
  ('Update Product Categories', 'product_categories.update', 'product_categories', 'update', 'Update product category details', true),
  ('Assign Product Categories', 'product_categories.assign', 'product_categories', 'assign', 'Assign products to categories', true),
  ('Remove Product Categories', 'product_categories.remove', 'product_categories', 'remove', 'Remove product category assignments', true),

  ('Read Category Attributes', 'category_attributes.read', 'category_attributes', 'read', 'View dynamic category attributes', true),
  ('Create Category Attributes', 'category_attributes.create', 'category_attributes', 'create', 'Create dynamic category attributes', true),
  ('Update Category Attributes', 'category_attributes.update', 'category_attributes', 'update', 'Update category attributes', true),
  ('Delete Category Attributes', 'category_attributes.delete', 'category_attributes', 'delete', 'Delete category attributes', true),
  ('Assign Category Attributes', 'category_attributes.assign', 'category_attributes', 'assign', 'Assign attributes to categories', true),

  ('Read Category Icons', 'category_icons.read', 'category_icons', 'read', 'View category icons library', true),
  ('Upload Category Icons', 'category_icons.upload', 'category_icons', 'upload', 'Upload new category icons', true),
  ('Update Category Icons', 'category_icons.update', 'category_icons', 'update', 'Update category icon references', true),
  ('Delete Category Icons', 'category_icons.delete', 'category_icons', 'delete', 'Delete unused category icons', true),

  ('Read Category Banners', 'category_banners.read', 'category_banners', 'read', 'View category banners', true),
  ('Upload Category Banners', 'category_banners.upload', 'category_banners', 'upload', 'Upload and configure category banners', true),
  ('Update Category Banners', 'category_banners.update', 'category_banners', 'update', 'Update category banner schedule', true),
  ('Delete Category Banners', 'category_banners.delete', 'category_banners', 'delete', 'Delete category banners', true),

  ('Read Category SEO', 'category_seo.read', 'category_seo', 'read', 'View category SEO metadata', true),
  ('Update Category SEO', 'category_seo.update', 'category_seo', 'update', 'Update SEO titles, tags, and OG metadata', true),
  ('Manage Redirects', 'category_seo.manage_redirects', 'category_seo', 'manage_redirects', 'Manage 301 category redirects', true),

  ('Read Category Ordering', 'category_ordering.read', 'category_ordering', 'read', 'View category display ordering', true),
  ('Update Category Ordering', 'category_ordering.update', 'category_ordering', 'update', 'Update category sequence and ordering', true)
ON CONFLICT (slug) DO UPDATE
SET description = EXCLUDED.description;

-- 8. Assign All Permissions to superadmin & admin roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('superadmin', 'admin', 'manager')
  AND (p.slug LIKE 'categories%' OR p.slug LIKE 'service_categories%' OR p.slug LIKE 'product_categories%' OR p.slug LIKE 'category_%')
ON CONFLICT DO NOTHING;
