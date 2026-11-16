-- Migration: Seller Applications Table
CREATE TABLE IF NOT EXISTS seller_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  current_step INT NOT NULL DEFAULT 1,
  
  -- Step 1: Personal Info
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Step 2: Business Info
  business_name VARCHAR(255),
  business_type VARCHAR(100) DEFAULT 'individual',
  country VARCHAR(100),
  address TEXT,
  website VARCHAR(255),
  
  -- Step 3: Seller Profile
  avatar_url TEXT,
  cover_image_url TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  years_of_experience INT DEFAULT 1,
  portfolio_url VARCHAR(255),
  
  -- Step 4: Verification
  id_document_type VARCHAR(100),
  id_document_url TEXT,
  business_document_url TEXT,
  verification_consent BOOLEAN DEFAULT false,
  
  -- Step 5: Agreements
  agreed_terms BOOLEAN DEFAULT false,
  agreed_commission BOOLEAN DEFAULT false,
  agreed_guidelines BOOLEAN DEFAULT false,
  
  -- Review metadata
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT uq_user_seller_app UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_apps_user ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_apps_status ON seller_applications(status);
