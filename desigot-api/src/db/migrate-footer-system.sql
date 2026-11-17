-- Footer System Comprehensive Migration
-- Preserves existing data while adding columns and tables required by Master Footer Spec

-- 1. Extend cms_footer_settings
DO $$
BEGIN
  -- Add columns if not exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='brand_name') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN brand_name VARCHAR(100) DEFAULT 'Desigot';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='brand_description') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN brand_description TEXT DEFAULT 'Desigot is the global creative marketplace for enterprise design systems, digital assets, and vetted agency services.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='copyright_owner') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN copyright_owner VARCHAR(100) DEFAULT 'Desigot Inc.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='copyright_year_mode') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN copyright_year_mode VARCHAR(20) DEFAULT 'auto';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='manual_copyright_year') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN manual_copyright_year INT DEFAULT 2026;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='background_color') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN background_color VARCHAR(30) DEFAULT '#0B0F19';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='heading_color') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN heading_color VARCHAR(30) DEFAULT '#FFFFFF';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='text_color') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN text_color VARCHAR(30) DEFAULT '#91A8C7';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='link_color') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN link_color VARCHAR(30) DEFAULT '#91A8C7';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='hover_color') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN hover_color VARCHAR(30) DEFAULT '#FFFFFF';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='border_color') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN border_color VARCHAR(30) DEFAULT '#263144';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='max_width') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN max_width VARCHAR(30) DEFAULT '1280px';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='desktop_visibility') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN desktop_visibility BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='tablet_visibility') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN tablet_visibility BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='mobile_visibility') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN mobile_visibility BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='newsletter_enabled') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN newsletter_enabled BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='newsletter_title') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN newsletter_title VARCHAR(255) DEFAULT 'Join the global creative network';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='newsletter_description') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN newsletter_description TEXT DEFAULT 'Receive weekly design systems, UI inspirations, and creator spotlight directly to your inbox.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='cta_enabled') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN cta_enabled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='cta_heading') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN cta_heading VARCHAR(255) DEFAULT 'Ready to launch your next design?';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='cta_description') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN cta_description TEXT DEFAULT 'Explore verified design assets and custom services from world-class creators.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='cta_button_text') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN cta_button_text VARCHAR(100) DEFAULT 'Explore Marketplace';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='cta_button_url') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN cta_button_url VARCHAR(255) DEFAULT '/products';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='publication_status') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN publication_status VARCHAR(20) DEFAULT 'published';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_settings' AND column_name='published_at') THEN
    ALTER TABLE cms_footer_settings ADD COLUMN published_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 2. Extend cms_footer_columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_columns' AND column_name='slug') THEN
    ALTER TABLE cms_footer_columns ADD COLUMN slug VARCHAR(150);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_columns' AND column_name='description') THEN
    ALTER TABLE cms_footer_columns ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_columns' AND column_name='column_type') THEN
    ALTER TABLE cms_footer_columns ADD COLUMN column_type VARCHAR(50) DEFAULT 'links';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_columns' AND column_name='width') THEN
    ALTER TABLE cms_footer_columns ADD COLUMN width VARCHAR(50) DEFAULT 'auto';
  END IF;
END $$;

-- 3. Extend cms_footer_links
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_links' AND column_name='route_type') THEN
    ALTER TABLE cms_footer_links ADD COLUMN route_type VARCHAR(50) DEFAULT 'internal';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_links' AND column_name='link_type') THEN
    ALTER TABLE cms_footer_links ADD COLUMN link_type VARCHAR(50) DEFAULT 'text';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_links' AND column_name='icon') THEN
    ALTER TABLE cms_footer_links ADD COLUMN icon VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_footer_links' AND column_name='open_behavior') THEN
    ALTER TABLE cms_footer_links ADD COLUMN open_behavior VARCHAR(20) DEFAULT 'same_tab';
  END IF;
END $$;

-- 4. Create footer_social_links table
CREATE TABLE IF NOT EXISTS footer_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(100) NOT NULL,
  profile_url VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  display_order INT DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create footer_legal_links table
CREATE TABLE IF NOT EXISTS footer_legal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  cms_page_id UUID,
  url VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create footer_versions table
CREATE TABLE IF NOT EXISTS footer_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INT NOT NULL,
  configuration_snapshot JSONB NOT NULL,
  changed_by UUID,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ensure newsletter_subscribers table has necessary fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='newsletter_subscribers' AND column_name='unsubscribed_at') THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribed_at TIMESTAMPTZ;
  END IF;
END $$;
