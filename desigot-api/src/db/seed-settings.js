'use strict';
require('dotenv').config();
const { query } = require('./pool');

async function seedSettings() {
  console.log('--- STARTING MODULE 17: SYSTEM SETTINGS MANAGEMENT SEEDING ---');

  try {
    // 0. Ensure Module 'settings' exists and fetch Super Admin role ID
    const modRes = await query(`SELECT id FROM modules WHERE slug = 'settings' OR slug = 'system_config' LIMIT 1`);
    let moduleId = modRes.rows[0]?.id;
    if (!moduleId) {
      const insMod = await query(
        `INSERT INTO modules (name, slug, description) 
         VALUES ('System Settings', 'settings', 'Enterprise Global Settings & Configuration Engine') 
         RETURNING id`
      );
      moduleId = insMod.rows[0].id;
    }

    const roleRes = await query(`SELECT id FROM roles WHERE slug = 'superadmin' OR slug = 'admin'`);
    const superAdminRole = roleRes.rows.find(r => r.slug === 'superadmin') || roleRes.rows[0];
    const adminRole = roleRes.rows.find(r => r.slug === 'admin') || superAdminRole;

    const userRes = await query(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`);
    const systemAdminId = userRes.rows[0]?.id || null;

    // 1. Seed RBAC Permissions for Settings
    console.log('Seeding System Settings Permissions...');
    const permissions = [
      { name: 'settings.view', description: 'View system settings command center' },
      { name: 'settings.read', description: 'Read system settings navigation' },
      { name: 'settings.write', description: 'Modify system settings' },
      { name: 'settings.general.view', description: 'View general application settings' },
      { name: 'settings.general.manage', description: 'Update general settings and branding' },
      { name: 'settings.marketplace.view', description: 'View marketplace business rules' },
      { name: 'settings.marketplace.manage', description: 'Manage marketplace features and order rules' },
      { name: 'settings.currency.view', description: 'View multi-currency settings' },
      { name: 'settings.currency.manage', description: 'Configure currencies and exchange rates' },
      { name: 'settings.language.view', description: 'View language and localization settings' },
      { name: 'settings.language.manage', description: 'Manage languages, RTL, and translation progress' },
      { name: 'settings.timezone.view', description: 'View timezone and date format settings' },
      { name: 'settings.timezone.manage', description: 'Configure system timezones and formats' },
      { name: 'settings.commission.view', description: 'View marketplace commission rules' },
      { name: 'settings.commission.manage', description: 'Configure commission rules and rates' },
      { name: 'settings.tax.view', description: 'View tax configuration rules' },
      { name: 'settings.tax.manage', description: 'Manage tax rules and jurisdiction rates' },
      { name: 'settings.authentication.view', description: 'View authentication policies' },
      { name: 'settings.authentication.manage', description: 'Manage password, MFA, and lockout policies' },
      { name: 'settings.email.view', description: 'View email provider configuration' },
      { name: 'settings.email.manage', description: 'Manage SMTP and email dispatch configuration' },
      { name: 'settings.storage.view', description: 'View cloud and local storage configuration' },
      { name: 'settings.storage.manage', description: 'Manage storage providers and file quotas' },
      { name: 'settings.seo.view', description: 'View global SEO settings' },
      { name: 'settings.seo.manage', description: 'Manage SEO metadata, robots.txt, and sitemaps' },
      { name: 'settings.maintenance.view', description: 'View maintenance mode status' },
      { name: 'settings.maintenance.manage', description: 'Enable or disable maintenance mode' },
      { name: 'settings.feature_flags.view', description: 'View feature toggles' },
      { name: 'settings.feature_flags.manage', description: 'Create and toggle feature flags' },
      { name: 'settings.backup.view', description: 'View system backup history' },
      { name: 'settings.backup.create', description: 'Trigger manual backup creation' },
      { name: 'settings.backup.restore', description: 'Execute system restore operations' },
      { name: 'settings.backup.manage', description: 'Configure automated backup schedules' },
      { name: 'settings.health.view', description: 'View system health and telemetry metrics' },
      { name: 'settings.audit.view', description: 'Inspect configuration audit history' },
      { name: 'settings.history.restore', description: 'Rollback settings to historical versions' }
    ];

    for (const p of permissions) {
      const pRes = await query(
        `INSERT INTO permissions (name, slug, resource, action, description, module_id, created_at, updated_at)
         VALUES ($1, $2, 'settings', 'MANAGE', $3, $4, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description, module_id = EXCLUDED.module_id
         RETURNING id`,
        [p.description, p.name, p.description, moduleId]
      );
      const permId = pRes.rows[0].id;

      if (superAdminRole) {
        await query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [superAdminRole.id, permId]
        );
      }
      if (adminRole && adminRole.id !== superAdminRole?.id) {
        await query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [adminRole.id, permId]
        );
      }
    }
    console.log(`✓ Seeded ${permissions.length} RBAC permissions.`);

    // 2. Seed System Settings (Key-Value Groups)
    console.log('Seeding System Settings...');
    const defaultSettings = [
      // General & Branding
      { key: 'general.app_name', group: 'general', value: 'Desigot', type: 'string', desc: 'Public application display name' },
      { key: 'general.legal_name', group: 'general', value: 'Desigot Technologies Private Limited', type: 'string', desc: 'Registered legal corporate name' },
      { key: 'general.tagline', group: 'general', value: 'Discover, Create and Grow', type: 'string', desc: 'Marketing tagline' },
      { key: 'general.description', group: 'general', value: 'The premier global marketplace for verified digital products, design services, and creative assets.', type: 'string', desc: 'Public site overview' },
      { key: 'general.app_url', group: 'general', value: 'https://example.com', type: 'string', desc: 'Canonical frontend application URL' },
      { key: 'general.admin_url', group: 'general', value: 'https://example.com/dashboard', type: 'string', desc: 'Administrative control center URL' },
      { key: 'general.support_email', group: 'general', value: 'support@example.com', type: 'string', desc: 'Customer support contact email' },
      { key: 'general.contact_email', group: 'general', value: 'contact@example.com', type: 'string', desc: 'Corporate communication contact' },
      { key: 'general.support_phone', group: 'general', value: '+91 98765 43210', type: 'string', desc: 'Official customer support phone' },
      { key: 'general.business_address', group: 'general', value: '404 Creative Park, Innovation Highway, Koramangala', type: 'string', desc: 'Corporate registered address' },
      { key: 'general.country', group: 'general', value: 'India', type: 'string', desc: 'Country of operation' },
      { key: 'general.state', group: 'general', value: 'Karnataka', type: 'string', desc: 'State or region' },
      { key: 'general.city', group: 'general', value: 'Bengaluru', type: 'string', desc: 'City' },
      { key: 'general.postal_code', group: 'general', value: '560001', type: 'string', desc: 'Postal/Zip code' },
      { key: 'general.default_currency', group: 'general', value: 'INR', type: 'string', desc: 'Base accounting currency' },
      { key: 'general.default_language', group: 'general', value: 'en', type: 'string', desc: 'Default localization language' },
      { key: 'general.default_timezone', group: 'general', value: 'Asia/Kolkata', type: 'string', desc: 'Default server timezone' },
      { key: 'general.date_format', group: 'general', value: 'DD/MM/YYYY', type: 'string', desc: 'Standard display date format' },
      { key: 'general.time_format', group: 'general', value: '12-hour', type: 'string', desc: 'Standard display time format (12-hour / 24-hour)' },
      { key: 'general.number_format', group: 'general', value: 'standard', type: 'string', desc: 'Number grouping format' },
      { key: 'general.first_day_of_week', group: 'general', value: 'Monday', type: 'string', desc: 'First day for calendars' },

      // Branding
      { key: 'branding.logo_url', group: 'general', value: '/brand/logo.svg', type: 'string', desc: 'Primary light logo asset URL' },
      { key: 'branding.dark_logo_url', group: 'general', value: '/brand/logo-dark.svg', type: 'string', desc: 'Dark theme logo asset URL' },
      { key: 'branding.light_logo_url', group: 'general', value: '/brand/logo-light.svg', type: 'string', desc: 'Light theme logo asset URL' },
      { key: 'branding.favicon_url', group: 'general', value: '/brand/favicon.ico', type: 'string', desc: 'Favicon asset URL' },
      { key: 'branding.admin_logo_url', group: 'general', value: '/brand/logo-admin.svg', type: 'string', desc: 'Admin navigation logo asset URL' },
      { key: 'branding.email_logo_url', group: 'general', value: '/brand/logo-email.png', type: 'string', desc: 'Transactional email header logo URL' },
      { key: 'branding.primary_color', group: 'general', value: '#4F46E5', type: 'string', desc: 'Primary theme color (Indigo)' },
      { key: 'branding.secondary_color', group: 'general', value: '#0F172A', type: 'string', desc: 'Secondary dark navy color' },
      { key: 'branding.accent_color', group: 'general', value: '#06B6D4', type: 'string', desc: 'Accent highlight color (Cyan)' },

      // General Behavior
      { key: 'behavior.enable_registration', group: 'general', value: true, type: 'boolean', desc: 'Global account registration switch' },
      { key: 'behavior.enable_seller_registration', group: 'general', value: true, type: 'boolean', desc: 'Allow users to register as sellers' },
      { key: 'behavior.enable_customer_registration', group: 'general', value: true, type: 'boolean', desc: 'Allow customer account creation' },
      { key: 'behavior.enable_guest_checkout', group: 'general', value: true, type: 'boolean', desc: 'Allow checkout without prior registration' },
      { key: 'behavior.enable_reviews', group: 'general', value: true, type: 'boolean', desc: 'Enable customer reviews and ratings' },
      { key: 'behavior.enable_notifications', group: 'general', value: true, type: 'boolean', desc: 'Enable notification dispatch' },
      { key: 'behavior.enable_contact_form', group: 'general', value: true, type: 'boolean', desc: 'Enable public contact submissions' },
      { key: 'behavior.enable_marketplace_search', group: 'general', value: true, type: 'boolean', desc: 'Enable search indexing' },
      { key: 'behavior.enable_public_profiles', group: 'general', value: true, type: 'boolean', desc: 'Enable public creator portfolios' },

      // Marketplace Configuration
      { key: 'marketplace.business_model', group: 'marketplace', value: 'commission_plus_subscription', type: 'string', desc: 'Core revenue model' },
      { key: 'marketplace.require_seller_approval', group: 'marketplace', value: true, type: 'boolean', desc: 'Vetting workflow required for new sellers' },
      { key: 'marketplace.require_seller_email_verify', group: 'marketplace', value: true, type: 'boolean', desc: 'Email verification mandatory for sellers' },
      { key: 'marketplace.require_seller_phone_verify', group: 'marketplace', value: true, type: 'boolean', desc: 'Phone verification mandatory for sellers' },
      { key: 'marketplace.require_seller_id_verify', group: 'marketplace', value: true, type: 'boolean', desc: 'Government ID verification required' },
      { key: 'marketplace.require_seller_business_verify', group: 'marketplace', value: true, type: 'boolean', desc: 'Corporate verification for agencies' },
      { key: 'marketplace.min_profile_completion', group: 'marketplace', value: 80, type: 'number', desc: 'Required profile completion percentage' },
      { key: 'marketplace.seller_product_approval', group: 'marketplace', value: true, type: 'boolean', desc: 'Moderation review before product publishing' },
      { key: 'marketplace.seller_service_approval', group: 'marketplace', value: true, type: 'boolean', desc: 'Moderation review before service publishing' },
      { key: 'marketplace.max_active_services', group: 'marketplace', value: 50, type: 'number', desc: 'Maximum active listings per seller' },
      { key: 'marketplace.max_active_products', group: 'marketplace', value: 100, type: 'number', desc: 'Maximum digital products per seller' },
      { key: 'marketplace.order_prefix', group: 'marketplace', value: 'ORD-', type: 'string', desc: 'Sequential order ID prefix' },
      { key: 'marketplace.booking_prefix', group: 'marketplace', value: 'BKG-', type: 'string', desc: 'Sequential service booking ID prefix' },
      { key: 'marketplace.invoice_prefix', group: 'marketplace', value: 'INV-', type: 'string', desc: 'Official invoice number prefix' },
      { key: 'marketplace.default_order_status', group: 'marketplace', value: 'pending', type: 'string', desc: 'Initial status for newly placed orders' },
      { key: 'marketplace.max_revisions', group: 'marketplace', value: 3, type: 'number', desc: 'Default revision limit for service milestones' },
      { key: 'marketplace.auto_complete_days', group: 'marketplace', value: 7, type: 'number', desc: 'Days before completed orders auto-finalize' },

      // Authentication & Security Policies
      { key: 'auth.enable_email_login', group: 'authentication', value: true, type: 'boolean', desc: 'Allow authentication with email + password' },
      { key: 'auth.enable_phone_login', group: 'authentication', value: true, type: 'boolean', desc: 'Allow OTP-based mobile authentication' },
      { key: 'auth.enable_google_oauth', group: 'authentication', value: true, type: 'boolean', desc: 'Sign in with Google OAuth' },
      { key: 'auth.enable_microsoft_oauth', group: 'authentication', value: false, type: 'boolean', desc: 'Sign in with Microsoft OAuth' },
      { key: 'auth.two_factor_enabled', group: 'authentication', value: true, type: 'boolean', desc: '2FA authentication available' },
      { key: 'auth.mandatory_admin_2fa', group: 'authentication', value: true, type: 'boolean', desc: 'MFA enforced for administrative users' },
      { key: 'auth.password_min_length', group: 'authentication', value: 12, type: 'number', desc: 'Minimum allowed password character length' },
      { key: 'auth.password_require_uppercase', group: 'authentication', value: true, type: 'boolean', desc: 'Requires at least one uppercase character' },
      { key: 'auth.password_require_numbers', group: 'authentication', value: true, type: 'boolean', desc: 'Requires at least one numeric character' },
      { key: 'auth.password_require_symbols', group: 'authentication', value: true, type: 'boolean', desc: 'Requires at least one special character' },
      { key: 'auth.password_expiry_days', group: 'authentication', value: 90, type: 'number', desc: 'Mandatory password rotation period (days)' },
      { key: 'auth.max_login_attempts', group: 'authentication', value: 5, type: 'number', desc: 'Failed login attempts before account lockout' },
      { key: 'auth.lockout_duration_minutes', group: 'authentication', value: 15, type: 'number', desc: 'Temporary account lockout duration' },
      { key: 'auth.session_timeout_minutes', group: 'authentication', value: 30, type: 'number', desc: 'Idle session inactivity timeout' },
      { key: 'auth.refresh_token_lifetime_days', group: 'authentication', value: 30, type: 'number', desc: 'Maximum persistent refresh token validity' },
      { key: 'auth.remember_me_enabled', group: 'authentication', value: true, type: 'boolean', desc: 'Allow extended browser session persistence' },
      { key: 'auth.require_email_verification', group: 'authentication', value: true, type: 'boolean', desc: 'Mandatory verification link click on signup' },
      { key: 'auth.captcha_enabled', group: 'authentication', value: true, type: 'boolean', desc: 'Bot protection on public auth endpoints' },

      // Email Settings
      { key: 'email.default_provider', group: 'email', value: 'smtp', type: 'string', desc: 'Primary email dispatch adapter' },
      { key: 'email.smtp_host', group: 'email', value: 'smtp.mailtrap.io', type: 'string', desc: 'SMTP host server address' },
      { key: 'email.smtp_port', group: 'email', value: 587, type: 'number', desc: 'SMTP service port' },
      { key: 'email.smtp_encryption', group: 'email', value: 'tls', type: 'string', desc: 'Encryption protocol (tls/ssl/none)' },
      { key: 'email.sender_name', group: 'email', value: 'Desigot Notifications', type: 'string', desc: 'From header display name' },
      { key: 'email.sender_email', group: 'email', value: 'no-reply@example.com', type: 'string', desc: 'From header email address' },
      { key: 'email.reply_to_email', group: 'email', value: 'support@example.com', type: 'string', desc: 'Reply-to email address' },
      { key: 'email.queue_enabled', group: 'email', value: true, type: 'boolean', desc: 'Asynchronous BullMQ worker dispatch' },
      { key: 'email.retry_attempts', group: 'email', value: 3, type: 'number', desc: 'Failed email retry attempts' },
      { key: 'email.rate_limit_per_minute', group: 'email', value: 120, type: 'number', desc: 'Maximum outbound messages per minute' },

      // Storage Settings
      { key: 'storage.default_provider', group: 'storage', value: 'local', type: 'string', desc: 'Default file storage adapter' },
      { key: 'storage.max_upload_size_bytes', group: 'storage', value: 52428800, type: 'number', desc: 'Maximum file upload limit (50 MB)' },
      { key: 'storage.allowed_file_types', group: 'storage', value: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/zip'], type: 'json', desc: 'Allowed MIME file formats' },
      { key: 'storage.signed_url_expiration_seconds', group: 'storage', value: 3600, type: 'number', desc: 'Presigned secure URL valid lifetime' },
      { key: 'storage.cdn_url', group: 'storage', value: 'https://assets.example.com', type: 'string', desc: 'CDN edge delivery distribution host' },

      // SEO Settings
      { key: 'seo.global_meta_title', group: 'seo', value: 'Desigot Marketplace | Buy & Sell Digital Goods & Creative Services', type: 'string', desc: 'Default HTML document title' },
      { key: 'seo.global_meta_description', group: 'seo', value: 'Discover vetted design sprints, digital downloads, 3D assets, UI kits, and professional services from verified global specialists on Desigot.', type: 'string', desc: 'Default HTML meta description' },
      { key: 'seo.global_meta_keywords', group: 'seo', value: 'marketplace, digital products, design services, UI kits, 3D models, creative assets', type: 'string', desc: 'Meta keywords' },
      { key: 'seo.og_image_url', group: 'seo', value: '/brand/og-share.png', type: 'string', desc: 'Default social sharing image' },
      { key: 'seo.canonical_base_url', group: 'seo', value: 'https://example.com', type: 'string', desc: 'Canonical URL root' },
      { key: 'seo.sitemap_enabled', group: 'seo', value: true, type: 'boolean', desc: 'Automatic XML sitemap publication' },
      { key: 'seo.sitemap_frequency', group: 'seo', value: 'daily', type: 'string', desc: 'Sitemap regeneration interval' },
      { key: 'seo.robots_txt', group: 'seo', value: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /dashboard/\nSitemap: https://example.com/sitemap.xml", type: 'string', desc: 'Robots.txt contents' },
      { key: 'seo.search_engine_indexing', group: 'seo', value: true, type: 'boolean', desc: 'Allow public search crawler indexing' },

      // Maintenance Settings
      { key: 'maintenance.enabled', group: 'maintenance', value: false, type: 'boolean', desc: 'Global maintenance mode toggle' },
      { key: 'maintenance.title', group: 'maintenance', value: 'Scheduled Platform Maintenance in Progress', type: 'string', desc: 'Maintenance screen header' },
      { key: 'maintenance.description', group: 'maintenance', value: 'We are currently deploying high-priority performance improvements. Desigot will resume normal operations momentarily.', type: 'string', desc: 'Maintenance message' },
      { key: 'maintenance.superadmin_bypass', group: 'maintenance', value: true, type: 'boolean', desc: 'Super Admins bypass maintenance screen' },
      { key: 'maintenance.allowed_ips', group: 'maintenance', value: ['127.0.0.1', '::1', '192.168.1.1'], type: 'json', desc: 'Allowlisted IPs during maintenance' },
      { key: 'maintenance.scheduled_start', group: 'maintenance', value: null, type: 'string', desc: 'Scheduled maintenance start timestamp' },
      { key: 'maintenance.scheduled_end', group: 'maintenance', value: null, type: 'string', desc: 'Scheduled maintenance end timestamp' }
    ];

    for (const s of defaultSettings) {
      await query(
        `INSERT INTO system_settings (key, setting_group, category, value, data_type, description, is_public, is_system, updated_by)
         VALUES ($1, $2, $2, $3, $4, $5, $6, true, $7)
         ON CONFLICT (key) DO UPDATE SET 
           setting_group = EXCLUDED.setting_group,
           value = EXCLUDED.value,
           data_type = EXCLUDED.data_type,
           description = EXCLUDED.description,
           updated_at = NOW()`,
        [
          s.key,
          s.group,
          JSON.stringify(s.value),
          s.type,
          s.desc,
          s.group === 'general' || s.group === 'seo' || s.key.startsWith('branding.'),
          systemAdminId
        ]
      );
    }
    console.log(`✓ Seeded ${defaultSettings.length} system setting records.`);

    // 3. Seed Currencies
    console.log('Seeding Currencies...');
    const currencies = [
      { name: 'Indian Rupee', code: 'INR', symbol: '₹', precision: 2, position: 'before', rate: 1.000000, thousand: ',', decimal: '.', is_default: true },
      { name: 'US Dollar', code: 'USD', symbol: '$', precision: 2, position: 'before', rate: 0.012000, thousand: ',', decimal: '.', is_default: false },
      { name: 'Euro', code: 'EUR', symbol: '€', precision: 2, position: 'before', rate: 0.011000, thousand: '.', decimal: ',', is_default: false },
      { name: 'British Pound', code: 'GBP', symbol: '£', precision: 2, position: 'before', rate: 0.009500, thousand: ',', decimal: '.', is_default: false },
      { name: 'UAE Dirham', code: 'AED', symbol: 'د.إ', precision: 2, position: 'before', rate: 0.044000, thousand: ',', decimal: '.', is_default: false },
      { name: 'Canadian Dollar', code: 'CAD', symbol: 'C$', precision: 2, position: 'before', rate: 0.016000, thousand: ',', decimal: '.', is_default: false },
      { name: 'Australian Dollar', code: 'AUD', symbol: 'A$', precision: 2, position: 'before', rate: 0.018000, thousand: ',', decimal: '.', is_default: false },
      { name: 'Singapore Dollar', code: 'SGD', symbol: 'S$', precision: 2, position: 'before', rate: 0.016000, thousand: ',', decimal: '.', is_default: false },
      { name: 'Japanese Yen', code: 'JPY', symbol: '¥', precision: 0, position: 'before', rate: 1.800000, thousand: ',', decimal: '.', is_default: false }
    ];

    for (const c of currencies) {
      await query(
        `INSERT INTO currency_settings (name, code, symbol, decimal_precision, symbol_position, exchange_rate, thousand_separator, decimal_separator, is_default, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
         ON CONFLICT (code) DO UPDATE SET 
           exchange_rate = EXCLUDED.exchange_rate,
           is_default = EXCLUDED.is_default,
           symbol = EXCLUDED.symbol,
           updated_at = NOW()`,
        [c.name, c.code, c.symbol, c.precision, c.position, c.rate, c.thousand, c.decimal, c.is_default]
      );
    }
    console.log(`✓ Seeded ${currencies.length} currencies.`);

    // 4. Seed Exchange Rate History
    console.log('Seeding Exchange Rate History...');
    const rateHistory = [
      { from: 'INR', to: 'USD', rate: 0.011950, provider: 'OpenExchangeRates', offset: 1 },
      { from: 'INR', to: 'USD', rate: 0.012000, provider: 'OpenExchangeRates', offset: 0 },
      { from: 'INR', to: 'EUR', rate: 0.010900, provider: 'OpenExchangeRates', offset: 1 },
      { from: 'INR', to: 'EUR', rate: 0.011000, provider: 'OpenExchangeRates', offset: 0 },
      { from: 'INR', to: 'GBP', rate: 0.009400, provider: 'OpenExchangeRates', offset: 1 },
      { from: 'INR', to: 'GBP', rate: 0.009500, provider: 'OpenExchangeRates', offset: 0 },
      { from: 'INR', to: 'AED', rate: 0.043900, provider: 'OpenExchangeRates', offset: 1 },
      { from: 'INR', to: 'AED', rate: 0.044000, provider: 'OpenExchangeRates', offset: 0 }
    ];

    for (const rh of rateHistory) {
      await query(
        `INSERT INTO exchange_rate_history (from_currency, to_currency, rate, provider, recorded_at, created_by)
         VALUES ($1, $2, $3, $4, NOW() - ($5 || ' days')::INTERVAL, $6)`,
        [rh.from, rh.to, rh.rate, rh.provider, rh.offset, systemAdminId]
      );
    }

    // 5. Seed Languages
    console.log('Seeding Languages...');
    const languages = [
      { code: 'en', name: 'English', native_name: 'English', direction: 'ltr', is_default: true, progress: 100 },
      { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', direction: 'ltr', is_default: false, progress: 95 },
      { code: 'ar', name: 'Arabic', native_name: 'العربية', direction: 'rtl', is_default: false, progress: 90 },
      { code: 'fr', name: 'French', native_name: 'Français', direction: 'ltr', is_default: false, progress: 88 },
      { code: 'de', name: 'German', native_name: 'Deutsch', direction: 'ltr', is_default: false, progress: 85 },
      { code: 'es', name: 'Spanish', native_name: 'Español', direction: 'ltr', is_default: false, progress: 92 }
    ];

    for (const l of languages) {
      await query(
        `INSERT INTO language_settings (code, name, native_name, direction, is_default, translation_progress, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         ON CONFLICT (code) DO UPDATE SET 
           translation_progress = EXCLUDED.translation_progress,
           is_default = EXCLUDED.is_default,
           updated_at = NOW()`,
        [l.code, l.name, l.native_name, l.direction, l.is_default, l.progress]
      );
    }
    console.log(`✓ Seeded ${languages.length} languages.`);

    // 6. Seed Timezones
    console.log('Seeding Timezones...');
    const timezones = [
      { timezone: 'Asia/Kolkata', label: 'India Standard Time (IST)', utc_offset: '+05:30', is_default: true },
      { timezone: 'UTC', label: 'Coordinated Universal Time (UTC)', utc_offset: '+00:00', is_default: false },
      { timezone: 'Europe/London', label: 'Greenwich Mean / British Summer Time', utc_offset: '+00:00', is_default: false },
      { timezone: 'America/New_York', label: 'Eastern Standard Time (EST/EDT)', utc_offset: '-05:00', is_default: false },
      { timezone: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', utc_offset: '+04:00', is_default: false },
      { timezone: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', utc_offset: '+08:00', is_default: false }
    ];

    for (const tz of timezones) {
      await query(
        `INSERT INTO timezone_settings (timezone, label, utc_offset, is_default, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (timezone) DO UPDATE SET 
           label = EXCLUDED.label,
           utc_offset = EXCLUDED.utc_offset,
           is_default = EXCLUDED.is_default`,
        [tz.timezone, tz.label, tz.utc_offset, tz.is_default]
      );
    }
    console.log(`✓ Seeded ${timezones.length} timezones.`);

    // 7. Seed Commission Rules
    console.log('Seeding Commission Rules...');
    const sampleCommissions = [
      { name: 'Global Marketplace Base Commission', type: 'global', rate: 10.0, priority: 1, min: 0, max: 0 },
      { name: 'Custom Design Services Commission', type: 'service', rate: 10.0, priority: 2, min: 500, max: 50000 },
      { name: 'Digital Asset Instant Downloads', type: 'digital_product', rate: 12.0, priority: 2, min: 100, max: 10000 },
      { name: 'Featured Categories Promo Rate', type: 'category', rate: 8.0, priority: 3, min: 0, max: 0 },
      { name: 'Top Tier Verified Agency Partner Rate', type: 'seller', rate: 7.0, priority: 4, min: 0, max: 0 }
    ];

    for (const cr of sampleCommissions) {
      const exists = await query(`SELECT id FROM commission_rules WHERE name = $1`, [cr.name]);
      if (exists.rows.length === 0) {
        await query(
          `INSERT INTO commission_rules (name, rule_type, percentage_rate, priority, min_commission_cents, max_commission_cents, is_active, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
          [cr.name, cr.type, cr.rate, cr.priority, cr.min, cr.max, systemAdminId]
        );
      }
    }

    // 8. Seed Tax Rules
    console.log('Seeding Tax Rules...');
    const sampleTaxes = [
      { name: 'GST Standard Goods & Services', type: 'gst', rate: 18.0, country: 'IN', state: null, inclusive: false },
      { name: 'CGST Central Goods & Services Tax', type: 'cgst', rate: 9.0, country: 'IN', state: null, inclusive: false },
      { name: 'SGST State Goods & Services Tax', type: 'sgst', rate: 9.0, country: 'IN', state: 'Karnataka', inclusive: false },
      { name: 'IGST Integrated Goods & Services Tax', type: 'igst', rate: 18.0, country: 'IN', state: null, inclusive: false }
    ];

    for (const tr of sampleTaxes) {
      const exists = await query(`SELECT id FROM tax_rules WHERE name = $1`, [tr.name]);
      if (exists.rows.length === 0) {
        await query(
          `INSERT INTO tax_rules (name, tax_type, tax_percentage, country_code, state_region, is_inclusive, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
          [tr.name, tr.type, tr.rate, tr.country, tr.state, tr.inclusive]
        );
      }
    }

    // 9. Seed Feature Flags (22 Flags covering all modules)
    console.log('Seeding Feature Flags...');
    const flags = [
      { key: 'service_marketplace', name: 'Service Marketplace Engine', desc: 'Allows booking, milestone delivery, and escrow of custom creative services.', enabled: true, pct: 100, cat: 'marketplace' },
      { key: 'digital_products', name: 'Digital Products & Downloads', desc: 'Instant downloadable products, license management, and secure file delivery.', enabled: true, pct: 100, cat: 'marketplace' },
      { key: 'seller_registration', name: 'Seller Onboarding & KYC', desc: 'Enables external vendors to apply, submit identity verification, and list services.', enabled: true, pct: 100, cat: 'seller' },
      { key: 'customer_registration', name: 'Customer Account Creation', desc: 'Enables public buyers to register, create wishlists, and manage order history.', enabled: true, pct: 100, cat: 'customer' },
      { key: 'custom_service_requests', name: 'Custom Client RFP & Quotes', desc: 'Buyers can post custom project briefs and receive bids from verified specialists.', enabled: true, pct: 100, cat: 'services' },
      { key: 'seller_portfolios', name: 'Seller Portfolios & Case Studies', desc: 'Rich media showcase for past work, client testimonials, and awards.', enabled: true, pct: 100, cat: 'seller' },
      { key: 'customer_reviews', name: 'Verified Customer Reviews', desc: 'Post-delivery rating system with automated sentiment moderation and appeals.', enabled: true, pct: 100, cat: 'reviews' },
      { key: 'customer_messaging', name: 'Real-Time Chat & Messaging', desc: 'Websocket-powered messaging between buyers, sellers, and support staff.', enabled: true, pct: 100, cat: 'communication' },
      { key: 'order_management', name: 'Unified Order Pipeline', desc: 'End-to-end lifecycle tracking from checkout to escrow release.', enabled: true, pct: 100, cat: 'orders' },
      { key: 'booking_management', name: 'Calendar Scheduling & Bookings', desc: 'Real-time slot reservation and milestone calendar management.', enabled: true, pct: 100, cat: 'services' },
      { key: 'dispute_management', name: 'Dispute Arbitration & Resolution', desc: 'Mediation workflow with timeline evidence and administrative rulings.', enabled: true, pct: 100, cat: 'finance' },
      { key: 'referral_programs', name: 'Customer Referral Program', desc: 'Referral tracking, discount reward attribution, and viral loops.', enabled: true, pct: 100, cat: 'marketing' },
      { key: 'affiliate_management', name: 'Affiliate Marketing Engine', desc: 'Affiliate partner tracking, click attribution, and payout management.', enabled: true, pct: 100, cat: 'marketing' },
      { key: 'coupons', name: 'Promotional Coupons & Vouchers', desc: 'Configurable coupon engine with cart limits and category restrictions.', enabled: true, pct: 100, cat: 'marketing' },
      { key: 'discount_campaigns', name: 'Flash Sales & Discount Campaigns', desc: 'Time-bounded sitewide sales and category discounts.', enabled: true, pct: 100, cat: 'marketing' },
      { key: 'ai_features', name: 'AI Creative Co-Pilot', desc: 'Gemini-powered automated brief generation, thumbnail review, and SEO tags.', enabled: false, pct: 25, cat: 'ai' },
      { key: 'advanced_analytics', name: 'Enterprise Business Intelligence', desc: 'Cohort retention, sales forecasting, and real-time revenue analytics.', enabled: true, pct: 100, cat: 'analytics' },
      { key: 'multi_currency', name: 'Multi-Currency Conversion Engine', desc: 'Live FX rate conversion across international currencies.', enabled: true, pct: 100, cat: 'finance' },
      { key: 'multi_language', name: 'Multilingual & RTL Localization', desc: 'Dynamic UI translation, RTL layout adjustments, and localized emails.', enabled: true, pct: 100, cat: 'localization' },
      { key: 'advanced_search', name: 'Elasticsearch Vector Catalog Search', desc: 'Instant typo-tolerant search with semantic facet filtering.', enabled: true, pct: 100, cat: 'search' },
      { key: 'seller_subscriptions', name: 'Tiered Seller Memberships', desc: 'Monthly/annual plans with reduced commission and priority search placement.', enabled: true, pct: 100, cat: 'seller' },
      { key: 'dark_mode', name: 'Universal Dark Mode Theme', desc: 'High-contrast dark navy color palette across all public and admin pages.', enabled: true, pct: 100, cat: 'ui' }
    ];

    for (const f of flags) {
      await query(
        `INSERT INTO feature_flags (key, name, description, is_enabled, rollout_percentage, category, environment)
         VALUES ($1, $2, $3, $4, $5, $6, 'all')
         ON CONFLICT (key) DO UPDATE SET 
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           is_enabled = EXCLUDED.is_enabled,
           rollout_percentage = EXCLUDED.rollout_percentage,
           category = EXCLUDED.category,
           updated_at = NOW()`,
        [f.key, f.name, f.desc, f.enabled, f.pct, f.cat]
      );
    }
    console.log(`✓ Seeded ${flags.length} feature flags.`);

    // 10. Seed Backups & Schedules
    console.log('Seeding Backups & Schedules...');
    const backups = [
      { name: 'backup-full-2026-11-16.tar.gz', type: 'full', status: 'completed', size: 142857140, checksum: 'sha256:7c9e1...a8f4', verified: true, error: null, daysAgo: 1 },
      { name: 'backup-db-2026-11-15.sql.gz', type: 'database', status: 'completed', size: 28450120, checksum: 'sha256:4b2c8...d1e0', verified: true, error: null, daysAgo: 2 },
      { name: 'backup-files-2026-11-14.tar.gz', type: 'files', status: 'completed', size: 520412800, checksum: 'sha256:9f1a3...e7b2', verified: true, error: null, daysAgo: 3 },
      { name: 'backup-config-2026-11-13.json.gz', type: 'config', status: 'completed', size: 421000, checksum: 'sha256:1a8d0...c3f4', verified: true, error: null, daysAgo: 4 },
      { name: 'backup-full-2026-11-12.tar.gz', type: 'full', status: 'failed', size: 12040000, checksum: null, verified: false, error: 'S3 remote timeout: connection reset by peer during chunk upload', daysAgo: 5 }
    ];

    for (const b of backups) {
      const exists = await query(`SELECT id FROM backup_jobs WHERE backup_name = $1`, [b.name]);
      if (exists.rows.length === 0) {
        await query(
          `INSERT INTO backup_jobs (backup_name, backup_type, status, size_bytes, checksum, storage_reference, is_verified, verified_at, error_message, started_at, completed_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 THEN NOW() ELSE NULL END, $8, NOW() - ($9 || ' days')::INTERVAL, NOW() - ($9 || ' days')::INTERVAL + INTERVAL '4 minutes', $10)`,
          [b.name, b.type, b.status, b.size, b.checksum, `s3://desigot-backups-vault/${b.name}`, b.verified, b.error, b.daysAgo, systemAdminId]
        );
      }
    }

    const schedules = [
      { type: 'database', freq: 'daily', cron: '0 2 * * *', retention: 30, active: true },
      { type: 'full', freq: 'weekly', cron: '0 3 * * 0', retention: 90, active: true }
    ];

    for (const sc of schedules) {
      const exists = await query(`SELECT id FROM backup_schedules WHERE backup_type = $1`, [sc.type]);
      if (exists.rows.length === 0) {
        await query(
          `INSERT INTO backup_schedules (backup_type, frequency, cron_expression, retention_days, is_active, last_run_at, next_run_at)
           VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day')`,
          [sc.type, sc.freq, sc.cron, sc.retention, sc.active]
        );
      }
    }

    // 11. Seed Health Telemetry & Incidents
    console.log('Seeding System Health Checks & Telemetry...');
    const healthChecks = [
      { component: 'PostgreSQL Database Engine', type: 'database', status: 'healthy', latency: 4, details: { active_connections: 18, pool_size: 50, version: '16.4' } },
      { component: 'Redis Cache & Session Store', type: 'cache', status: 'healthy', latency: 2, details: { memory_used_mb: 48, hit_ratio: 0.94 } },
      { component: 'BullMQ Async Task Queue', type: 'queue', status: 'healthy', latency: 5, details: { pending_jobs: 0, completed_24h: 3412, failed_24h: 0 } },
      { component: 'Local File Storage Adapter', type: 'storage', status: 'healthy', latency: 1, details: { path: '/public/uploads', free_space_gb: 412 } },
      { component: 'Email Dispatch Gateway', type: 'email', status: 'healthy', latency: 22, details: { provider: 'smtp', success_rate_24h: '99.8%' } },
      { component: 'Payment Webhook Processing Engine', type: 'webhook', status: 'healthy', latency: 8, details: { active_endpoints: 14, p99_latency_ms: 45 } }
    ];

    for (const hc of healthChecks) {
      await query(
        `INSERT INTO system_health_checks (component, check_type, status, latency_ms, details, checked_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [hc.component, hc.type, hc.status, hc.latency, JSON.stringify(hc.details)]
      );
    }

    // System Metrics
    const metrics = [
      { name: 'cpu_usage_percent', value: 18.4, unit: '%' },
      { name: 'memory_usage_percent', value: 42.1, unit: '%' },
      { name: 'disk_usage_percent', value: 31.8, unit: '%' },
      { name: 'api_p95_latency_ms', value: 142.0, unit: 'ms' },
      { name: 'error_rate_percent', value: 0.15, unit: '%' }
    ];

    for (const m of metrics) {
      await query(
        `INSERT INTO system_metrics (metric_name, metric_value, unit, recorded_at)
         VALUES ($1, $2, $3, NOW())`,
        [m.name, m.value, m.unit]
      );
    }

    // Incidents
    const sampleIncident = {
      incident_number: 'INC-2026-0814',
      title: 'Transient S3 Storage Timeout During Batch Asset Ingestion',
      severity: 'medium',
      status: 'resolved',
      affected: ['Local File Storage Adapter', 'Cloudflare R2'],
      summary: 'Outbound TCP connection reset observed during peak asset batch upload. Retried successfully through local buffer.',
      root_cause: 'Upstream gateway DNS fluctuation resolved automatically.'
    };

    const incExists = await query(`SELECT id FROM system_incidents WHERE incident_number = $1`, [sampleIncident.incident_number]);
    if (incExists.rows.length === 0) {
      await query(
        `INSERT INTO system_incidents (incident_number, title, severity, status, affected_components, summary, root_cause, created_at, resolved_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '45 minutes')`,
        [
          sampleIncident.incident_number,
          sampleIncident.title,
          sampleIncident.severity,
          sampleIncident.status,
          sampleIncident.affected,
          sampleIncident.summary,
          sampleIncident.root_cause
        ]
      );
    }

    // 12. Seed Sample Settings Audit Logs & Versions
    console.log('Seeding Sample Audit History & Versions...');
    const auditEntries = [
      { group: 'general', key: 'general.app_name', action: 'update', prev: 'Desigot Beta', cur: 'Desigot', reason: 'Official brand release', daysAgo: 7 },
      { group: 'marketplace', key: 'marketplace.min_profile_completion', action: 'update', prev: 70, cur: 80, reason: 'Elevated quality threshold for seller listings', daysAgo: 5 },
      { group: 'commission', key: 'commission.digital_products', action: 'update', prev: 15.0, cur: 12.0, reason: 'Creator competitive fee reduction', daysAgo: 3 },
      { group: 'currency', key: 'currency.USD', action: 'update', prev: 0.0118, cur: 0.0120, reason: 'Weekly exchange rate adjustment', daysAgo: 1 }
    ];

    for (const a of auditEntries) {
      await query(
        `INSERT INTO system_setting_audit_logs (setting_group, setting_key, action, previous_value, new_value, changed_by, changed_by_name, ip_address, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'Super Admin', '127.0.0.1', NOW() - ($7 || ' days')::INTERVAL)`,
        [a.group, a.key, a.action, JSON.stringify(a.prev), JSON.stringify(a.cur), systemAdminId, a.daysAgo]
      );

      await query(
        `INSERT INTO system_setting_versions (setting_key, setting_group, version_number, previous_value, new_value, change_reason, changed_by, changed_at, ip_address)
         VALUES ($1, $2, 1, $3, $4, $5, $6, NOW() - ($7 || ' days')::INTERVAL, '127.0.0.1')`,
        [a.key, a.group, JSON.stringify(a.prev), JSON.stringify(a.cur), a.reason, systemAdminId, a.daysAgo]
      );
    }

    console.log('==============================================================================');
    console.log('ALL MODULE 17 SYSTEM SETTINGS SEEDED SUCCESSFULLY!');
    console.log('==============================================================================');
    process.exit(0);
  } catch (err) {
    console.error('✗ Seeding failed with error:', err);
    process.exit(1);
  }
}

seedSettings();
