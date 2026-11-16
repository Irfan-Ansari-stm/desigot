'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const config = require('../config');

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'Password123!';

async function seedEnterpriseRbac() {
  const pool = new Pool({ connectionString: config.db.primary });
  const client = await pool.connect();

  try {
    console.log('Seeding Enterprise RBAC & Admin Management Data...');
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. MODULES (All 19 marketplace & administrative modules)
    // ─────────────────────────────────────────────────────────────────────────
    const modulesData = [
      { name: 'Dashboard & Analytics', slug: 'dashboard', description: 'Executive dashboard, KPIs, platform metrics', icon: 'LayoutDashboard', route: '/dashboard', display_order: 1 },
      { name: 'User Management', slug: 'users', description: 'User accounts, administrator management, lifecycle', icon: 'Users', route: '/dashboard/users', display_order: 2 },
      { name: 'Role Management', slug: 'roles', description: 'Hierarchical roles, templates, inheritance', icon: 'Shield', route: '/dashboard/roles', display_order: 3 },
      { name: 'Permission Management', slug: 'permissions', description: 'Granular permissions, matrix, module access', icon: 'Key', route: '/dashboard/permissions', display_order: 4 },
      { name: 'Access Control', slug: 'access_control', description: 'Attribute policies, ABAC rules, security scopes', icon: 'Lock', route: '/dashboard/access-control/policies', display_order: 5 },
      { name: 'Services Management', slug: 'services', description: 'Services catalog, pricing tiers, gig delivery', icon: 'Briefcase', route: '/dashboard/services', display_order: 6 },
      { name: 'Digital Products', slug: 'products', description: 'Digital assets, downloads, licensing, software', icon: 'Package', route: '/dashboard/digital-products', display_order: 7 },
      { name: 'Orders & Bookings', slug: 'orders', description: 'Orders, milestone bookings, fulfillment tracking', icon: 'ShoppingBag', route: '/dashboard/orders-bookings', display_order: 8 },
      { name: 'Customer Management', slug: 'customers', description: 'Buyer accounts, profiles, loyalty, verifications', icon: 'UserCheck', route: '/dashboard/customers', display_order: 9 },
      { name: 'Seller Management', slug: 'sellers', description: 'Vendor onboarding, verification, payouts, tiers', icon: 'Store', route: '/dashboard/sellers', display_order: 10 },
      { name: 'Payments & Finance', slug: 'finance', description: 'Escrow, payouts, fees, commission tracking, refunds', icon: 'DollarSign', route: '/dashboard/payments-finance', display_order: 11 },
      { name: 'Marketing & Promotions', slug: 'marketing', description: 'Coupons, flash deals, campaigns, affiliates', icon: 'Megaphone', route: '/dashboard/marketing', display_order: 12 },
      { name: 'Communication & Support', slug: 'communication', description: 'Live messaging, support tickets, disputes', icon: 'MessageSquare', route: '/dashboard/communication', display_order: 13 },
      { name: 'Reviews & Moderation', slug: 'reviews', description: 'Ratings, feedback, dispute moderation, spam filter', icon: 'Star', route: '/dashboard/reviews', display_order: 14 },
      { name: 'CMS & Website', slug: 'cms', description: 'Static pages, blog posts, menus, banners, SEO', icon: 'Globe', route: '/dashboard/cms', display_order: 15 },
      { name: 'Security & Sessions', slug: 'security', description: 'Active sessions, login history, IP restrictions, MFA', icon: 'ShieldAlert', route: '/dashboard/security/login-history', display_order: 16 },
      { name: 'Audit & Compliance', slug: 'audit', description: 'Immutable activity logs, compliance trail', icon: 'FileText', route: '/dashboard/audit/all-logs', display_order: 17 },
      { name: 'System Settings', slug: 'settings', description: 'Platform configuration, maintenance, feature flags', icon: 'Settings', route: '/dashboard/system', display_order: 18 },
      { name: 'Super Admin Control Center', slug: 'super_admin', description: 'Application Owner root controls and overrides', icon: 'Crown', route: '/dashboard/super-admin/control-center', display_order: 19, is_system: true }
    ];

    const moduleMap = {};
    for (const m of modulesData) {
      const res = await client.query(`
        INSERT INTO modules (name, slug, description, icon, route, display_order, is_system)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (slug) DO UPDATE SET 
          name = EXCLUDED.name, 
          description = EXCLUDED.description, 
          icon = EXCLUDED.icon,
          route = EXCLUDED.route, 
          display_order = EXCLUDED.display_order
        RETURNING id, slug;
      `, [m.name, m.slug, m.description, m.icon, m.route, m.display_order, m.is_system || false]);
      moduleMap[m.slug] = res.rows[0].id;
    }
    console.log(`✓ Seeded ${Object.keys(moduleMap).length} application modules`);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PERMISSION GROUPS
    // ─────────────────────────────────────────────────────────────────────────
    const groupDefs = [
      { name: 'Dashboard & Intelligence', slug: 'group-dashboard', description: 'Platform KPIs, analytics, revenue metrics', display_order: 1 },
      { name: 'User & Identity Operations', slug: 'group-users', description: 'Customer & admin directories, lifecycle, verification', display_order: 2 },
      { name: 'Roles & Governance', slug: 'group-roles', description: 'Role configurations, matrix, permissions', display_order: 3 },
      { name: 'Catalog & Marketplace', slug: 'group-catalog', description: 'Services, products, orders, categories', display_order: 4 },
      { name: 'Commerce & Financials', slug: 'group-finance', description: 'Payments, escrow, fees, invoices, refunds', display_order: 5 },
      { name: 'Marketing & Growth', slug: 'group-marketing', description: 'Promotions, discount coupons, affiliates, ads', display_order: 6 },
      { name: 'Communication & Tickets', slug: 'group-communication', description: 'Support tickets, real-time messages, disputes', display_order: 7 },
      { name: 'Content & Publishing', slug: 'group-content', description: 'CMS pages, blog, navigation, media library', display_order: 8 },
      { name: 'Security & Audit Trail', slug: 'group-security', description: 'Sessions, login history, security events, audit logs', display_order: 9 },
      { name: 'System & Owner Controls', slug: 'group-superadmin', description: 'Owner root operations, maintenance, recovery', display_order: 10 }
    ];

    const groupMap = {};
    for (const g of groupDefs) {
      const res = await client.query(`
        INSERT INTO permission_groups (name, slug, description, display_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
        RETURNING id, slug;
      `, [g.name, g.slug, g.description, g.display_order]);
      groupMap[g.slug] = res.rows[0].id;
    }
    console.log(`✓ Seeded ${Object.keys(groupMap).length} permission groups`);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SEED 160+ GRANULAR PERMISSIONS ACROSS ALL 19 MODULES
    // ─────────────────────────────────────────────────────────────────────────
    const permDefinitions = [
      // 1. Dashboard (6)
      { name: 'View Dashboard Metrics', slug: 'dashboard.view', resource: 'dashboard', action: 'VIEW', module: 'dashboard', group: 'group-dashboard' },
      { name: 'View Financial Analytics', slug: 'dashboard.analytics_finance', resource: 'dashboard', action: 'VIEW', module: 'dashboard', group: 'group-dashboard' },
      { name: 'View User Analytics', slug: 'dashboard.analytics_users', resource: 'dashboard', action: 'VIEW', module: 'dashboard', group: 'group-dashboard' },
      { name: 'Export Dashboard Reports', slug: 'dashboard.export', resource: 'dashboard', action: 'EXPORT', module: 'dashboard', group: 'group-dashboard' },
      { name: 'Customize Dashboard Layout', slug: 'dashboard.customize', resource: 'dashboard', action: 'UPDATE', module: 'dashboard', group: 'group-dashboard' },
      { name: 'Manage Dashboard Widgets', slug: 'dashboard.manage', resource: 'dashboard', action: 'MANAGE', module: 'dashboard', group: 'group-dashboard' },

      // 2. Users (10)
      { name: 'View Users List', slug: 'users.read', resource: 'users', action: 'READ', module: 'users', group: 'group-users' },
      { name: 'View User Details', slug: 'users.view', resource: 'users', action: 'VIEW', module: 'users', group: 'group-users' },
      { name: 'Create User Account', slug: 'users.create', resource: 'users', action: 'CREATE', module: 'users', group: 'group-users' },
      { name: 'Update User Details', slug: 'users.update', resource: 'users', action: 'UPDATE', module: 'users', group: 'group-users' },
      { name: 'Delete User Account', slug: 'users.delete', resource: 'users', action: 'DELETE', module: 'users', group: 'group-users' },
      { name: 'Assign User Roles', slug: 'users.assign_role', resource: 'users', action: 'ASSIGN', module: 'users', group: 'group-users' },
      { name: 'Manage User Status', slug: 'users.manage', resource: 'users', action: 'MANAGE', module: 'users', group: 'group-users' },
      { name: 'Reset User Password', slug: 'users.reset_password', resource: 'users', action: 'UPDATE', module: 'users', group: 'group-users' },
      { name: 'Export Users List', slug: 'users.export', resource: 'users', action: 'EXPORT', module: 'users', group: 'group-users' },
      { name: 'Import Users Data', slug: 'users.import', resource: 'users', action: 'IMPORT', module: 'users', group: 'group-users' },

      // 3. Roles (8)
      { name: 'View Roles List', slug: 'roles.read', resource: 'roles', action: 'READ', module: 'roles', group: 'group-roles' },
      { name: 'View Role Details', slug: 'roles.view', resource: 'roles', action: 'VIEW', module: 'roles', group: 'group-roles' },
      { name: 'Create Role', slug: 'roles.create', resource: 'roles', action: 'CREATE', module: 'roles', group: 'group-roles' },
      { name: 'Update Role', slug: 'roles.update', resource: 'roles', action: 'UPDATE', module: 'roles', group: 'group-roles' },
      { name: 'Delete Role', slug: 'roles.delete', resource: 'roles', action: 'DELETE', module: 'roles', group: 'group-roles' },
      { name: 'Duplicate Role', slug: 'roles.duplicate', resource: 'roles', action: 'CREATE', module: 'roles', group: 'group-roles' },
      { name: 'Assign Role Permissions', slug: 'roles.assign_permissions', resource: 'roles', action: 'ASSIGN', module: 'roles', group: 'group-roles' },
      { name: 'Manage Role Hierarchy', slug: 'roles.manage', resource: 'roles', action: 'MANAGE', module: 'roles', group: 'group-roles' },

      // 4. Permissions (7)
      { name: 'View Permissions', slug: 'permissions.read', resource: 'permissions', action: 'READ', module: 'permissions', group: 'group-roles' },
      { name: 'View Permission Details', slug: 'permissions.view', resource: 'permissions', action: 'VIEW', module: 'permissions', group: 'group-roles' },
      { name: 'Create Custom Permission', slug: 'permissions.create', resource: 'permissions', action: 'CREATE', module: 'permissions', group: 'group-roles' },
      { name: 'Update Permission', slug: 'permissions.update', resource: 'permissions', action: 'UPDATE', module: 'permissions', group: 'group-roles' },
      { name: 'Delete Permission', slug: 'permissions.delete', resource: 'permissions', action: 'DELETE', module: 'permissions', group: 'group-roles' },
      { name: 'Manage Permission Matrix', slug: 'permissions.manage', resource: 'permissions', action: 'MANAGE', module: 'permissions', group: 'group-roles' },
      { name: 'Export Permissions List', slug: 'permissions.export', resource: 'permissions', action: 'EXPORT', module: 'permissions', group: 'group-roles' },

      // 5. Access Control (7)
      { name: 'View Access Policies', slug: 'access_control.read', resource: 'access_control', action: 'READ', module: 'access_control', group: 'group-roles' },
      { name: 'Create Access Policy', slug: 'access_control.create', resource: 'access_control', action: 'CREATE', module: 'access_control', group: 'group-roles' },
      { name: 'Update Access Policy', slug: 'access_control.update', resource: 'access_control', action: 'UPDATE', module: 'access_control', group: 'group-roles' },
      { name: 'Delete Access Policy', slug: 'access_control.delete', resource: 'access_control', action: 'DELETE', module: 'access_control', group: 'group-roles' },
      { name: 'Manage Module Access', slug: 'access_control.modules', resource: 'access_control', action: 'MANAGE', module: 'access_control', group: 'group-roles' },
      { name: 'Manage API Permissions', slug: 'access_control.api', resource: 'access_control', action: 'MANAGE', module: 'access_control', group: 'group-roles' },
      { name: 'Configure Security Policies', slug: 'access_control.configure', resource: 'access_control', action: 'CONFIGURE', module: 'access_control', group: 'group-roles' },

      // 6. Services (10)
      { name: 'View Services', slug: 'services.read', resource: 'services', action: 'READ', module: 'services', group: 'group-catalog' },
      { name: 'View Service Details', slug: 'services.view', resource: 'services', action: 'VIEW', module: 'services', group: 'group-catalog' },
      { name: 'Create Service', slug: 'services.create', resource: 'services', action: 'CREATE', module: 'services', group: 'group-catalog' },
      { name: 'Update Service', slug: 'services.update', resource: 'services', action: 'UPDATE', module: 'services', group: 'group-catalog' },
      { name: 'Delete Service', slug: 'services.delete', resource: 'services', action: 'DELETE', module: 'services', group: 'group-catalog' },
      { name: 'Approve Service Listing', slug: 'services.approve', resource: 'services', action: 'APPROVE', module: 'services', group: 'group-catalog' },
      { name: 'Reject Service Listing', slug: 'services.reject', resource: 'services', action: 'REJECT', module: 'services', group: 'group-catalog' },
      { name: 'Feature Service', slug: 'services.feature', resource: 'services', action: 'MANAGE', module: 'services', group: 'group-catalog' },
      { name: 'Manage Pricing Tiers', slug: 'services.pricing', resource: 'services', action: 'MANAGE', module: 'services', group: 'group-catalog' },
      { name: 'Export Services Catalog', slug: 'services.export', resource: 'services', action: 'EXPORT', module: 'services', group: 'group-catalog' },

      // 7. Digital Products (10)
      { name: 'View Digital Products', slug: 'products.read', resource: 'products', action: 'READ', module: 'products', group: 'group-catalog' },
      { name: 'View Product Details', slug: 'products.view', resource: 'products', action: 'VIEW', module: 'products', group: 'group-catalog' },
      { name: 'Create Digital Product', slug: 'products.create', resource: 'products', action: 'CREATE', module: 'products', group: 'group-catalog' },
      { name: 'Update Digital Product', slug: 'products.update', resource: 'products', action: 'UPDATE', module: 'products', group: 'group-catalog' },
      { name: 'Delete Digital Product', slug: 'products.delete', resource: 'products', action: 'DELETE', module: 'products', group: 'group-catalog' },
      { name: 'Approve Digital Product', slug: 'products.approve', resource: 'products', action: 'APPROVE', module: 'products', group: 'group-catalog' },
      { name: 'Reject Digital Product', slug: 'products.reject', resource: 'products', action: 'REJECT', module: 'products', group: 'group-catalog' },
      { name: 'Manage Product Licenses', slug: 'products.licenses', resource: 'products', action: 'MANAGE', module: 'products', group: 'group-catalog' },
      { name: 'Manage Product Files', slug: 'products.files', resource: 'products', action: 'MANAGE', module: 'products', group: 'group-catalog' },
      { name: 'Export Products Catalog', slug: 'products.export', resource: 'products', action: 'EXPORT', module: 'products', group: 'group-catalog' },

      // 8. Orders & Bookings (9)
      { name: 'View Orders & Bookings', slug: 'orders.read', resource: 'orders', action: 'READ', module: 'orders', group: 'group-catalog' },
      { name: 'View Order Details', slug: 'orders.view', resource: 'orders', action: 'VIEW', module: 'orders', group: 'group-catalog' },
      { name: 'Update Order Status', slug: 'orders.update', resource: 'orders', action: 'UPDATE', module: 'orders', group: 'group-catalog' },
      { name: 'Cancel Order', slug: 'orders.cancel', resource: 'orders', action: 'MANAGE', module: 'orders', group: 'group-catalog' },
      { name: 'Manage Order Milestones', slug: 'orders.milestones', resource: 'orders', action: 'MANAGE', module: 'orders', group: 'group-catalog' },
      { name: 'Approve Order Delivery', slug: 'orders.approve_delivery', resource: 'orders', action: 'APPROVE', module: 'orders', group: 'group-catalog' },
      { name: 'Force Release Escrow', slug: 'orders.release_escrow', resource: 'orders', action: 'MANAGE', module: 'orders', group: 'group-finance' },
      { name: 'Process Order Refund', slug: 'orders.refund', resource: 'orders', action: 'MANAGE', module: 'orders', group: 'group-finance' },
      { name: 'Export Orders Data', slug: 'orders.export', resource: 'orders', action: 'EXPORT', module: 'orders', group: 'group-catalog' },

      // 9. Customers (8)
      { name: 'View Customers List', slug: 'customers.read', resource: 'customers', action: 'READ', module: 'customers', group: 'group-users' },
      { name: 'View Customer Profile', slug: 'customers.view', resource: 'customers', action: 'VIEW', module: 'customers', group: 'group-users' },
      { name: 'Update Customer Details', slug: 'customers.update', resource: 'customers', action: 'UPDATE', module: 'customers', group: 'group-users' },
      { name: 'Manage Customer Status', slug: 'customers.manage_status', resource: 'customers', action: 'MANAGE', module: 'customers', group: 'group-users' },
      { name: 'Verify Customer Identity', slug: 'customers.verify', resource: 'customers', action: 'APPROVE', module: 'customers', group: 'group-users' },
      { name: 'Adjust Customer Loyalty', slug: 'customers.loyalty', resource: 'customers', action: 'MANAGE', module: 'customers', group: 'group-users' },
      { name: 'Delete Customer Account', slug: 'customers.delete', resource: 'customers', action: 'DELETE', module: 'customers', group: 'group-users' },
      { name: 'Export Customers Data', slug: 'customers.export', resource: 'customers', action: 'EXPORT', module: 'customers', group: 'group-users' },

      // 10. Sellers (9)
      { name: 'View Sellers List', slug: 'sellers.read', resource: 'sellers', action: 'READ', module: 'sellers', group: 'group-users' },
      { name: 'View Seller Profile & KYC', slug: 'sellers.view', resource: 'sellers', action: 'VIEW', module: 'sellers', group: 'group-users' },
      { name: 'Approve Seller Verification', slug: 'sellers.approve', resource: 'sellers', action: 'APPROVE', module: 'sellers', group: 'group-users' },
      { name: 'Reject Seller Application', slug: 'sellers.reject', resource: 'sellers', action: 'REJECT', module: 'sellers', group: 'group-users' },
      { name: 'Update Seller Details', slug: 'sellers.update', resource: 'sellers', action: 'UPDATE', module: 'sellers', group: 'group-users' },
      { name: 'Manage Seller Tiers & Badges', slug: 'sellers.manage_badges', resource: 'sellers', action: 'MANAGE', module: 'sellers', group: 'group-users' },
      { name: 'Suspend Seller Store', slug: 'sellers.suspend', resource: 'sellers', action: 'MANAGE', module: 'sellers', group: 'group-users' },
      { name: 'Adjust Commission Rates', slug: 'sellers.commission', resource: 'sellers', action: 'MANAGE', module: 'sellers', group: 'group-finance' },
      { name: 'Export Sellers Data', slug: 'sellers.export', resource: 'sellers', action: 'EXPORT', module: 'sellers', group: 'group-users' },

      // 11. Payments & Finance (10)
      { name: 'View Financial Transactions', slug: 'finance.read', resource: 'finance', action: 'READ', module: 'finance', group: 'group-finance' },
      { name: 'View Escrow Balances', slug: 'finance.escrow_view', resource: 'finance', action: 'VIEW', module: 'finance', group: 'group-finance' },
      { name: 'Manage Escrow Releases', slug: 'finance.escrow_manage', resource: 'finance', action: 'MANAGE', module: 'finance', group: 'group-finance' },
      { name: 'Approve Seller Payouts', slug: 'finance.payout_approve', resource: 'finance', action: 'APPROVE', module: 'finance', group: 'group-finance' },
      { name: 'Reject Seller Payouts', slug: 'finance.payout_reject', resource: 'finance', action: 'REJECT', module: 'finance', group: 'group-finance' },
      { name: 'Process Payment Refunds', slug: 'finance.refund', resource: 'finance', action: 'MANAGE', module: 'finance', group: 'group-finance' },
      { name: 'Manage Payment Gateways', slug: 'finance.gateways', resource: 'finance', action: 'CONFIGURE', module: 'finance', group: 'group-finance' },
      { name: 'Configure Platform Fees', slug: 'finance.fee_settings', resource: 'finance', action: 'CONFIGURE', module: 'finance', group: 'group-finance' },
      { name: 'Generate Tax & Revenue Invoices', slug: 'finance.invoices', resource: 'finance', action: 'MANAGE', module: 'finance', group: 'group-finance' },
      { name: 'Export Financial Reports', slug: 'finance.export', resource: 'finance', action: 'EXPORT', module: 'finance', group: 'group-finance' },

      // 12. Marketing & Promotions (10)
      { name: 'View Campaigns & Coupons', slug: 'marketing.read', resource: 'marketing', action: 'READ', module: 'marketing', group: 'group-marketing' },
      { name: 'Create Promotional Campaign', slug: 'marketing.campaign_create', resource: 'marketing', action: 'CREATE', module: 'marketing', group: 'group-marketing' },
      { name: 'Update Promotional Campaign', slug: 'marketing.campaign_update', resource: 'marketing', action: 'UPDATE', module: 'marketing', group: 'group-marketing' },
      { name: 'Delete Campaign', slug: 'marketing.campaign_delete', resource: 'marketing', action: 'DELETE', module: 'marketing', group: 'group-marketing' },
      { name: 'Create Discount Coupon', slug: 'marketing.coupon_create', resource: 'marketing', action: 'CREATE', module: 'marketing', group: 'group-marketing' },
      { name: 'Manage Discount Coupons', slug: 'marketing.coupon_manage', resource: 'marketing', action: 'MANAGE', module: 'marketing', group: 'group-marketing' },
      { name: 'Manage Affiliate Program', slug: 'marketing.affiliates', resource: 'marketing', action: 'MANAGE', module: 'marketing', group: 'group-marketing' },
      { name: 'Manage Advertisement Banners', slug: 'marketing.banners', resource: 'marketing', action: 'MANAGE', module: 'marketing', group: 'group-marketing' },
      { name: 'Dispatch Marketing Newsletters', slug: 'marketing.newsletters', resource: 'marketing', action: 'MANAGE', module: 'marketing', group: 'group-marketing' },
      { name: 'Export Marketing Analytics', slug: 'marketing.export', resource: 'marketing', action: 'EXPORT', module: 'marketing', group: 'group-marketing' },

      // 13. Communication & Support (9)
      { name: 'View Live Messages', slug: 'communication.messages_read', resource: 'communication', action: 'READ', module: 'communication', group: 'group-communication' },
      { name: 'Moderate Chat Messages', slug: 'communication.messages_moderate', resource: 'communication', action: 'MANAGE', module: 'communication', group: 'group-communication' },
      { name: 'View Support Tickets', slug: 'communication.tickets_read', resource: 'communication', action: 'READ', module: 'communication', group: 'group-communication' },
      { name: 'Assign Support Tickets', slug: 'communication.tickets_assign', resource: 'communication', action: 'ASSIGN', module: 'communication', group: 'group-communication' },
      { name: 'Respond to Tickets', slug: 'communication.tickets_reply', resource: 'communication', action: 'UPDATE', module: 'communication', group: 'group-communication' },
      { name: 'Close Support Tickets', slug: 'communication.tickets_close', resource: 'communication', action: 'MANAGE', module: 'communication', group: 'group-communication' },
      { name: 'View Marketplace Disputes', slug: 'communication.disputes_read', resource: 'communication', action: 'READ', module: 'communication', group: 'group-communication' },
      { name: 'Mediate & Resolve Disputes', slug: 'communication.disputes_resolve', resource: 'communication', action: 'MANAGE', module: 'communication', group: 'group-communication' },
      { name: 'Send System Announcements', slug: 'communication.broadcast', resource: 'communication', action: 'MANAGE', module: 'communication', group: 'group-communication' },

      // 14. Reviews & Moderation (8)
      { name: 'View Ratings & Reviews', slug: 'reviews.read', resource: 'reviews', action: 'READ', module: 'reviews', group: 'group-content' },
      { name: 'Approve Customer Review', slug: 'reviews.approve', resource: 'reviews', action: 'APPROVE', module: 'reviews', group: 'group-content' },
      { name: 'Reject Customer Review', slug: 'reviews.reject', resource: 'reviews', action: 'REJECT', module: 'reviews', group: 'group-content' },
      { name: 'Delete Inappropriate Review', slug: 'reviews.delete', resource: 'reviews', action: 'DELETE', module: 'reviews', group: 'group-content' },
      { name: 'Flag Abusive Content', slug: 'reviews.flag', resource: 'reviews', action: 'MANAGE', module: 'reviews', group: 'group-content' },
      { name: 'Manage Spam Blacklist', slug: 'reviews.blacklist', resource: 'reviews', action: 'MANAGE', module: 'reviews', group: 'group-content' },
      { name: 'Reply to Seller Reviews', slug: 'reviews.reply', resource: 'reviews', action: 'UPDATE', module: 'reviews', group: 'group-content' },
      { name: 'Export Reviews Audit', slug: 'reviews.export', resource: 'reviews', action: 'EXPORT', module: 'reviews', group: 'group-content' },

      // 15. CMS & Website Management (12)
      { name: 'View CMS Pages & Content', slug: 'cms.read', resource: 'cms', action: 'READ', module: 'cms', group: 'group-content' },
      { name: 'Create CMS Page', slug: 'cms.page_create', resource: 'cms', action: 'CREATE', module: 'cms', group: 'group-content' },
      { name: 'Update CMS Page', slug: 'cms.page_update', resource: 'cms', action: 'UPDATE', module: 'cms', group: 'group-content' },
      { name: 'Delete CMS Page', slug: 'cms.page_delete', resource: 'cms', action: 'DELETE', module: 'cms', group: 'group-content' },
      { name: 'Publish CMS Page', slug: 'cms.publish', resource: 'cms', action: 'APPROVE', module: 'cms', group: 'group-content' },
      { name: 'Manage Homepage Hero Slides', slug: 'cms.hero_slides', resource: 'cms', action: 'MANAGE', module: 'cms', group: 'group-content' },
      { name: 'Manage Navigation Menus', slug: 'cms.navigation', resource: 'cms', action: 'MANAGE', module: 'cms', group: 'group-content' },
      { name: 'Manage Blog Posts', slug: 'cms.blog_manage', resource: 'cms', action: 'MANAGE', module: 'cms', group: 'group-content' },
      { name: 'Manage Media Library', slug: 'cms.media_manage', resource: 'cms', action: 'MANAGE', module: 'cms', group: 'group-content' },
      { name: 'Manage Legal Documents & Revisions', slug: 'cms.legal_manage', resource: 'cms', action: 'MANAGE', module: 'cms', group: 'group-content' },
      { name: 'Manage SEO & URL Redirects', slug: 'cms.seo_manage', resource: 'cms', action: 'MANAGE', module: 'cms', group: 'group-content' },
      { name: 'Manage FAQ Knowledgebase', slug: 'cms.faq_manage', resource: 'cms', action: 'MANAGE', module: 'cms', group: 'group-content' },

      // 16. Security & Sessions (8)
      { name: 'View Active Sessions', slug: 'security.sessions_read', resource: 'security', action: 'READ', module: 'security', group: 'group-security' },
      { name: 'Revoke User Session', slug: 'security.sessions_revoke', resource: 'security', action: 'MANAGE', module: 'security', group: 'group-security' },
      { name: 'View Admin Login History', slug: 'security.login_history', resource: 'security', action: 'READ', module: 'security', group: 'group-security' },
      { name: 'View Security Events', slug: 'security.events_read', resource: 'security', action: 'READ', module: 'security', group: 'group-security' },
      { name: 'Manage IP Restrictions', slug: 'security.ip_restrictions', resource: 'security', action: 'MANAGE', module: 'security', group: 'group-security' },
      { name: 'Configure Password Policy', slug: 'security.password_policy', resource: 'security', action: 'CONFIGURE', module: 'security', group: 'group-security' },
      { name: 'Configure Two-Factor Auth', slug: 'security.mfa_configure', resource: 'security', action: 'CONFIGURE', module: 'security', group: 'group-security' },
      { name: 'Manage Brute-Force Lockouts', slug: 'security.lockouts', resource: 'security', action: 'MANAGE', module: 'security', group: 'group-security' },

      // 17. Audit & Compliance (6)
      { name: 'View Immutable Audit Trail', slug: 'audit.read', resource: 'audit', action: 'READ', module: 'audit', group: 'group-security' },
      { name: 'View Audit Log Details', slug: 'audit.view', resource: 'audit', action: 'VIEW', module: 'audit', group: 'group-security' },
      { name: 'Export Audit Logs', slug: 'audit.export', resource: 'audit', action: 'EXPORT', module: 'audit', group: 'group-security' },
      { name: 'View Admin Activity Logs', slug: 'audit.admin_activity', resource: 'audit', action: 'READ', module: 'audit', group: 'group-security' },
      { name: 'Generate Compliance Reports', slug: 'audit.compliance', resource: 'audit', action: 'VIEW', module: 'audit', group: 'group-security' },
      { name: 'Filter System Security Logs', slug: 'audit.security_filter', resource: 'audit', action: 'READ', module: 'audit', group: 'group-security' },

      // 18. System Settings (6)
      { name: 'View System Settings', slug: 'settings.read', resource: 'settings', action: 'READ', module: 'settings', group: 'group-superadmin' },
      { name: 'Update Platform Configurations', slug: 'settings.update', resource: 'settings', action: 'UPDATE', module: 'settings', group: 'group-superadmin' },
      { name: 'Configure Feature Flags', slug: 'settings.configure', resource: 'settings', action: 'CONFIGURE', module: 'settings', group: 'group-superadmin' },
      { name: 'Manage Email Templates', slug: 'settings.email_templates', resource: 'settings', action: 'MANAGE', module: 'settings', group: 'group-superadmin' },
      { name: 'Manage Webhooks & Integrations', slug: 'settings.integrations', resource: 'settings', action: 'MANAGE', module: 'settings', group: 'group-superadmin' },
      { name: 'Manage API Keys & Scopes', slug: 'settings.api_keys', resource: 'settings', action: 'MANAGE', module: 'settings', group: 'group-superadmin' },

      // 19. Super Admin Root Controls (6 - System Protected)
      { name: 'Application Owner Root Access', slug: 'superadmin.full_control', resource: 'superadmin', action: 'MANAGE', module: 'super_admin', group: 'group-superadmin', is_system: true },
      { name: 'Emergency Maintenance Mode', slug: 'superadmin.maintenance', resource: 'superadmin', action: 'CONFIGURE', module: 'super_admin', group: 'group-superadmin', is_system: true },
      { name: 'Disaster Recovery & Data Export', slug: 'superadmin.recovery', resource: 'superadmin', action: 'MANAGE', module: 'super_admin', group: 'group-superadmin', is_system: true },
      { name: 'Direct System Ownership Transfer', slug: 'superadmin.ownership', resource: 'superadmin', action: 'MANAGE', module: 'super_admin', group: 'group-superadmin', is_system: true },
      { name: 'Database Query Console Access', slug: 'superadmin.db_console', resource: 'superadmin', action: 'MANAGE', module: 'super_admin', group: 'group-superadmin', is_system: true },
      { name: 'Global Override & Bypass Rules', slug: 'superadmin.override', resource: 'superadmin', action: 'MANAGE', module: 'super_admin', group: 'group-superadmin', is_system: true }
    ];

    const permMap = {};
    for (const p of permDefinitions) {
      const res = await client.query(`
        INSERT INTO permissions (name, slug, resource, action, module_id, group_id, is_system, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (slug) DO UPDATE SET 
          name = EXCLUDED.name, 
          resource = EXCLUDED.resource, 
          action = EXCLUDED.action, 
          module_id = EXCLUDED.module_id,
          group_id = EXCLUDED.group_id,
          is_system = EXCLUDED.is_system,
          description = EXCLUDED.description
        RETURNING id, slug;
      `, [p.name, p.slug, p.resource, p.action, moduleMap[p.module], groupMap[p.group], p.is_system || false, p.name]);
      permMap[p.slug] = res.rows[0].id;
    }
    console.log(`✓ Seeded ${Object.keys(permMap).length} granular permissions`);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. SEED 14 SYSTEM & CUSTOM ROLES
    // ─────────────────────────────────────────────────────────────────────────
    const rolesList = [
      {
        name: 'Super Admin',
        slug: 'superadmin',
        description: 'Application Owner with absolute unrestricted system-wide access and emergency override',
        role_type: 'system',
        hierarchy_level: 1,
        is_system: true
      },
      {
        name: 'Admin',
        slug: 'admin',
        description: 'Platform Administrator with broad administrative authority across all modules except root recovery',
        role_type: 'system',
        hierarchy_level: 2,
        is_system: true
      },
      {
        name: 'Website Administrator',
        slug: 'website_admin',
        description: 'Oversees CMS, public pages, hero banners, blogs, and SEO navigation structure',
        role_type: 'administrative',
        hierarchy_level: 3,
        is_system: true
      },
      {
        name: 'Operations Manager',
        slug: 'operations_manager',
        description: 'Manages platform day-to-day operations, order fulfillment, dispute escalation, and sellers',
        role_type: 'administrative',
        hierarchy_level: 3,
        is_system: false
      },
      {
        name: 'Service Manager',
        slug: 'service_manager',
        description: 'Curates gig catalog, verifies service submissions, manages pricing tiers and categories',
        role_type: 'administrative',
        hierarchy_level: 3,
        is_system: false
      },
      {
        name: 'Product Manager',
        slug: 'product_manager',
        description: 'Oversees digital products, software downloads, licensing validation, and digital marketplace',
        role_type: 'administrative',
        hierarchy_level: 3,
        is_system: false
      },
      {
        name: 'Seller Manager',
        slug: 'seller_manager',
        description: 'Handles seller onboarding, KYC verification, store compliance, tiers, and dispute advocacy',
        role_type: 'administrative',
        hierarchy_level: 3,
        is_system: false
      },
      {
        name: 'Customer Support',
        slug: 'customer_support',
        description: 'Handles buyer tickets, live customer support chat, FAQs, and ticket resolution',
        role_type: 'administrative',
        hierarchy_level: 4,
        is_system: false
      },
      {
        name: 'Finance Manager',
        slug: 'finance_manager',
        description: 'Manages escrow disbursements, vendor payouts, commission rates, and tax invoices',
        role_type: 'administrative',
        hierarchy_level: 3,
        is_system: false
      },
      {
        name: 'Marketing Manager',
        slug: 'marketing_manager',
        description: 'Oversees discount campaigns, coupon generation, homepage hero banners, and affiliate programs',
        role_type: 'administrative',
        hierarchy_level: 3,
        is_system: false
      },
      {
        name: 'Content Manager',
        slug: 'content_manager',
        description: 'Author and editor for blog posts, legal documentation updates, and media asset storage',
        role_type: 'administrative',
        hierarchy_level: 4,
        is_system: false
      },
      {
        name: 'Moderator',
        slug: 'moderator',
        description: 'Reviews ratings, comments, flags abusive content, and maintains community standards',
        role_type: 'administrative',
        hierarchy_level: 4,
        is_system: false
      },
      {
        name: 'Analyst',
        slug: 'analyst',
        description: 'Read-only business intelligence access for reporting, analytics, metrics, and KPI tracking',
        role_type: 'administrative',
        hierarchy_level: 5,
        is_system: false
      },
      {
        name: 'Custom Administrator',
        slug: 'custom_admin',
        description: 'Custom tailored role with flexible permissions configured by the Super Admin',
        role_type: 'custom',
        hierarchy_level: 4,
        is_system: false
      }
    ];

    const roleMap = {};
    for (const r of rolesList) {
      const res = await client.query(`
        INSERT INTO roles (name, slug, description, role_type, hierarchy_level, is_system, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        ON CONFLICT (slug) DO UPDATE SET 
          name = EXCLUDED.name, 
          description = EXCLUDED.description, 
          role_type = EXCLUDED.role_type,
          hierarchy_level = EXCLUDED.hierarchy_level,
          is_system = EXCLUDED.is_system
        RETURNING id, slug;
      `, [r.name, r.slug, r.description, r.role_type, r.hierarchy_level, r.is_system]);
      roleMap[r.slug] = res.rows[0].id;
    }
    console.log(`✓ Seeded ${Object.keys(roleMap).length} system and custom roles`);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. ASSIGN GRANULAR PERMISSIONS PER ROLE
    // ─────────────────────────────────────────────────────────────────────────
    // Super Admin: 100% of all permissions
    for (const slug of Object.keys(permMap)) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      `, [roleMap['superadmin'], permMap[slug]]);
    }

    // Admin: Everything except superadmin.* exclusive root controls
    const adminPerms = Object.keys(permMap).filter(s => !s.startsWith('superadmin.'));
    for (const slug of adminPerms) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      `, [roleMap['admin'], permMap[slug]]);
    }

    // Role-specific permission assignment mapping
    const rolePermissionRules = {
      website_admin: ['cms.', 'settings.read', 'dashboard.view', 'media.', 'reviews.read'],
      operations_manager: ['orders.', 'communication.', 'sellers.read', 'sellers.view', 'customers.read', 'customers.view', 'dashboard.view', 'audit.read'],
      service_manager: ['services.', 'reviews.read', 'dashboard.view', 'orders.read', 'categories.'],
      product_manager: ['products.', 'reviews.read', 'dashboard.view', 'orders.read', 'categories.'],
      seller_manager: ['sellers.', 'communication.disputes', 'dashboard.view', 'orders.read', 'reviews.read'],
      customer_support: ['communication.', 'customers.read', 'customers.view', 'orders.read', 'orders.view', 'dashboard.view'],
      finance_manager: ['finance.', 'orders.read', 'orders.view', 'orders.refund', 'orders.release_escrow', 'dashboard.analytics_finance', 'dashboard.view'],
      marketing_manager: ['marketing.', 'cms.hero_slides', 'dashboard.view', 'services.read', 'products.read'],
      content_manager: ['cms.page', 'cms.blog', 'cms.media', 'cms.faq', 'cms.read', 'dashboard.view'],
      moderator: ['reviews.', 'communication.messages_moderate', 'communication.disputes_read', 'dashboard.view'],
      analyst: ['dashboard.', 'audit.read', 'audit.view', 'audit.compliance', 'users.read', 'services.read', 'products.read', 'orders.read', 'finance.read'],
      custom_admin: ['users.read', 'roles.read', 'permissions.read', 'services.read', 'products.read', 'orders.read', 'dashboard.view']
    };

    for (const [rSlug, prefixes] of Object.entries(rolePermissionRules)) {
      const targetRoleId = roleMap[rSlug];
      if (!targetRoleId) continue;

      const matchedPerms = Object.keys(permMap).filter(pSlug =>
        prefixes.some(pref => pSlug.startsWith(pref) || pSlug === pref)
      );

      for (const pSlug of matchedPerms) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [targetRoleId, permMap[pSlug]]);
      }
    }
    console.log('✓ Successfully assigned granular permissions to all 14 roles');

    // ─────────────────────────────────────────────────────────────────────────
    // 6. SEED ROLE MODULE ACCESS (role_modules table)
    // ─────────────────────────────────────────────────────────────────────────
    for (const [rSlug, rId] of Object.entries(roleMap)) {
      for (const [mSlug, mId] of Object.entries(moduleMap)) {
        let accessLevel = 'none';
        let isAccessible = false;

        if (rSlug === 'superadmin') {
          accessLevel = 'admin';
          isAccessible = true;
        } else if (rSlug === 'admin') {
          accessLevel = mSlug === 'super_admin' ? 'none' : 'admin';
          isAccessible = mSlug !== 'super_admin';
        } else if (rSlug === 'analyst') {
          accessLevel = ['super_admin', 'security'].includes(mSlug) ? 'none' : 'read';
          isAccessible = accessLevel !== 'none';
        } else if (rSlug === 'finance_manager' && ['finance', 'orders', 'dashboard'].includes(mSlug)) {
          accessLevel = 'admin';
          isAccessible = true;
        } else if (rSlug === 'website_admin' && ['cms', 'dashboard'].includes(mSlug)) {
          accessLevel = 'admin';
          isAccessible = true;
        } else if (rSlug === 'operations_manager' && ['orders', 'communication', 'sellers', 'customers', 'dashboard'].includes(mSlug)) {
          accessLevel = 'admin';
          isAccessible = true;
        } else if (rSlug === 'seller_manager' && ['sellers', 'communication', 'orders', 'dashboard'].includes(mSlug)) {
          accessLevel = 'admin';
          isAccessible = true;
        } else if (rSlug === 'customer_support' && ['communication', 'customers', 'orders', 'dashboard'].includes(mSlug)) {
          accessLevel = 'write';
          isAccessible = true;
        } else if (rSlug === 'moderator' && ['reviews', 'communication', 'dashboard'].includes(mSlug)) {
          accessLevel = 'write';
          isAccessible = true;
        } else if (rSlug === 'content_manager' && ['cms', 'dashboard'].includes(mSlug)) {
          accessLevel = 'write';
          isAccessible = true;
        } else if (rSlug === 'marketing_manager' && ['marketing', 'cms', 'dashboard'].includes(mSlug)) {
          accessLevel = 'admin';
          isAccessible = true;
        } else if (rSlug === 'service_manager' && ['services', 'orders', 'dashboard'].includes(mSlug)) {
          accessLevel = 'admin';
          isAccessible = true;
        } else if (rSlug === 'product_manager' && ['products', 'orders', 'dashboard'].includes(mSlug)) {
          accessLevel = 'admin';
          isAccessible = true;
        } else {
          // Default read access to dashboard
          if (mSlug === 'dashboard') {
            accessLevel = 'read';
            isAccessible = true;
          }
        }

        await client.query(`
          INSERT INTO role_modules (role_id, module_id, access_level, is_accessible)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (role_id, module_id) DO UPDATE SET 
            access_level = EXCLUDED.access_level,
            is_accessible = EXCLUDED.is_accessible,
            updated_at = NOW();
        `, [rId, mId, accessLevel, isAccessible]);
      }
    }
    console.log('✓ Configured module-level access rules across all 14 roles');

    // ─────────────────────────────────────────────────────────────────────────
    // 7. SEED 15 DIVERSE DEVELOPMENT ADMIN USERS
    // ─────────────────────────────────────────────────────────────────────────
    const adminUsersData = [
      {
        email: 'superadmin@desigot.com',
        role: 'superadmin',
        first_name: 'Vikram',
        last_name: 'Aditya (Owner)',
        display_name: 'Super Admin Vikram',
        phone: '+1 (555) 019-2831',
        account_status: 'active',
        is_super_admin: true,
        two_factor_enabled: true,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        primary_role: 'superadmin'
      },
      {
        email: 'admin@desigot.com',
        role: 'admin',
        first_name: 'Elena',
        last_name: 'Rostova',
        display_name: 'Elena Administrator',
        phone: '+1 (555) 019-2832',
        account_status: 'active',
        is_super_admin: false,
        two_factor_enabled: true,
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
        primary_role: 'admin'
      },
      {
        email: 'website.admin@desigot.com',
        role: 'admin',
        first_name: 'Marcus',
        last_name: 'Vance',
        display_name: 'Marcus Website Admin',
        phone: '+1 (555) 019-2833',
        account_status: 'active',
        is_super_admin: false,
        two_factor_enabled: true,
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        primary_role: 'website_admin'
      },
      {
        email: 'operations@desigot.com',
        role: 'admin',
        first_name: 'Priya',
        last_name: 'Sharma',
        display_name: 'Priya Operations',
        phone: '+1 (555) 019-2834',
        account_status: 'active',
        is_super_admin: false,
        two_factor_enabled: true,
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
        primary_role: 'operations_manager'
      },
      {
        email: 'services@desigot.com',
        role: 'admin',
        first_name: 'David',
        last_name: 'Kim',
        display_name: 'David Service Manager',
        phone: '+1 (555) 019-2835',
        account_status: 'active',
        is_super_admin: false,
        two_factor_enabled: false,
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
        primary_role: 'service_manager'
      },
      {
        email: 'products@desigot.com',
        role: 'admin',
        first_name: 'Sarah',
        last_name: 'Jenkins',
        display_name: 'Sarah Product Head',
        phone: '+1 (555) 019-2836',
        account_status: 'active',
        is_super_admin: false,
        two_factor_enabled: true,
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
        primary_role: 'product_manager'
      },
      {
        email: 'sellers@desigot.com',
        role: 'admin',
        first_name: 'Carlos',
        last_name: 'Mendez',
        display_name: 'Carlos Seller Lead',
        phone: '+1 (555) 019-2837',
        account_status: 'active',
        is_super_admin: false,
        two_factor_enabled: false,
        avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
        primary_role: 'seller_manager'
      },
      {
        email: 'support.lead@desigot.com',
        role: 'admin',
        first_name: 'Aisha',
        last_name: 'Diallo',
        display_name: 'Aisha Support Lead',
        phone: '+1 (555) 019-2838',
        account_status: 'active',
        is_super_admin: false,
        two_factor_enabled: true,
        avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=256&q=80',
        primary_role: 'customer_support'
      },
      {
        email: 'finance@desigot.com',
        role: 'admin',
        first_name: 'Julian',
        last_name: 'Thorne',
        display_name: 'Julian Finance Officer',
        phone: '+1 (555) 019-2839',
        account_status: 'active',
        is_super_admin: false,
        two_factor_enabled: true,
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
        primary_role: 'finance_manager'
      },
      {
        email: 'marketing@desigot.com',
        role: 'admin',
        first_name: 'Chloe',
        last_name: 'Dupont',
        display_name: 'Chloe Marketing Dir',
        phone: '+1 (555) 019-2840',
        account_status: 'active',
        is_super_admin: false,
        two_factor_enabled: false,
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
        primary_role: 'marketing_manager'
      },
      {
        email: 'analyst.invite@desigot.com',
        role: 'admin',
        first_name: 'Nathan',
        last_name: 'Drake',
        display_name: 'Nathan Analyst (Invited)',
        phone: '+1 (555) 019-2841',
        account_status: 'invited',
        is_super_admin: false,
        two_factor_enabled: false,
        primary_role: 'analyst'
      },
      {
        email: 'moderator.pending@desigot.com',
        role: 'admin',
        first_name: 'Zoe',
        last_name: 'Kravitz',
        display_name: 'Zoe Content Moderator',
        phone: '+1 (555) 019-2842',
        account_status: 'pending_verification',
        is_super_admin: false,
        two_factor_enabled: false,
        primary_role: 'moderator'
      },
      {
        email: 'custom.admin@desigot.com',
        role: 'admin',
        first_name: 'Arthur',
        last_name: 'Pendleton',
        display_name: 'Arthur Custom Admin',
        phone: '+1 (555) 019-2843',
        account_status: 'active',
        is_super_admin: false,
        two_factor_enabled: true,
        primary_role: 'custom_admin'
      },
      {
        email: 'content.inactive@desigot.com',
        role: 'admin',
        first_name: 'Liam',
        last_name: 'O\'Connor',
        display_name: 'Liam Content Writer',
        phone: '+1 (555) 019-2844',
        account_status: 'inactive',
        is_super_admin: false,
        two_factor_enabled: false,
        primary_role: 'content_manager'
      },
      {
        email: 'breached.auditor@desigot.com',
        role: 'admin',
        first_name: 'Lucas',
        last_name: 'Grey',
        display_name: 'Lucas Grey (Suspended)',
        phone: '+1 (555) 019-2845',
        account_status: 'suspended',
        suspension_reason: 'Flagged for multiple credential stuffing anomalies from untrusted ASN',
        is_super_admin: false,
        two_factor_enabled: false,
        primary_role: 'analyst'
      }
    ];

    const userMap = {};
    for (const u of adminUsersData) {
      const res = await client.query(`
        INSERT INTO users (
          email, password_hash, role, first_name, last_name, display_name,
          phone, account_status, is_super_admin, two_factor_enabled,
          suspension_reason, avatar_url, last_login_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() - (random() * INTERVAL '10 days')
        )
        ON CONFLICT (email) DO UPDATE SET 
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          display_name = EXCLUDED.display_name,
          role = EXCLUDED.role,
          account_status = EXCLUDED.account_status,
          is_super_admin = EXCLUDED.is_super_admin,
          two_factor_enabled = EXCLUDED.two_factor_enabled,
          avatar_url = EXCLUDED.avatar_url
        RETURNING id, email;
      `, [
        u.email, passwordHash, u.role, u.first_name, u.last_name, u.display_name,
        u.phone, u.account_status, u.is_super_admin, u.two_factor_enabled,
        u.suspension_reason || null, u.avatar_url || null
      ]);

      const userId = res.rows[0].id;
      userMap[u.email] = userId;

      // Assign Primary Role in user_roles
      const assignedRoleId = roleMap[u.primary_role] || roleMap['admin'];
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, is_primary)
        VALUES ($1, $2, TRUE)
        ON CONFLICT (user_id, role_id) DO UPDATE SET is_primary = TRUE;
      `, [userId, assignedRoleId]);
    }
    console.log(`✓ Seeded ${Object.keys(userMap).length} development admin users with assigned roles`);

    // ─────────────────────────────────────────────────────────────────────────
    // 8. SEED API ROUTE PERMISSIONS (api_route_permissions table)
    // ─────────────────────────────────────────────────────────────────────────
    const apiRoutesData = [
      { module: 'users', method: 'GET', endpoint: '/api/v1/admin/rbac/users', required_permission: 'users.read', description: 'List all administrative and internal users' },
      { module: 'users', method: 'POST', endpoint: '/api/v1/admin/rbac/users', required_permission: 'users.create', description: 'Create or invite new administrator' },
      { module: 'users', method: 'PUT', endpoint: '/api/v1/admin/rbac/users/:id', required_permission: 'users.update', description: 'Update administrator details or assign roles' },
      { module: 'users', method: 'DELETE', endpoint: '/api/v1/admin/rbac/users/:id', required_permission: 'users.delete', description: 'Remove administrator account' },
      { module: 'roles', method: 'GET', endpoint: '/api/v1/admin/roles', required_permission: 'roles.read', description: 'Fetch all hierarchical roles' },
      { module: 'roles', method: 'POST', endpoint: '/api/v1/admin/roles', required_permission: 'roles.create', description: 'Create custom organizational role' },
      { module: 'roles', method: 'PUT', endpoint: '/api/v1/admin/roles/:id', required_permission: 'roles.update', description: 'Update role metadata or permissions' },
      { module: 'roles', method: 'DELETE', endpoint: '/api/v1/admin/roles/:id', required_permission: 'roles.delete', description: 'Delete custom role' },
      { module: 'permissions', method: 'GET', endpoint: '/api/v1/admin/permissions', required_permission: 'permissions.read', description: 'List all granular platform permissions' },
      { module: 'permissions', method: 'GET', endpoint: '/api/v1/admin/access-control/matrix', required_permission: 'permissions.read', description: 'Retrieve interactive permission matrix' },
      { module: 'permissions', method: 'POST', endpoint: '/api/v1/admin/access-control/matrix', required_permission: 'permissions.manage', description: 'Save bulk role permission matrix changes' },
      { module: 'access_control', method: 'GET', endpoint: '/api/v1/admin/access-control/policies', required_permission: 'access_control.read', description: 'List ABAC security policies' },
      { module: 'access_control', method: 'POST', endpoint: '/api/v1/admin/access-control/policies', required_permission: 'access_control.configure', description: 'Create dynamic access policy' },
      { module: 'security', method: 'GET', endpoint: '/api/v1/admin/rbac/security/sessions', required_permission: 'security.sessions_read', description: 'List real-time active admin sessions' },
      { module: 'security', method: 'DELETE', endpoint: '/api/v1/admin/rbac/security/sessions/:id', required_permission: 'security.sessions_revoke', description: 'Instantly revoke active session token' },
      { module: 'security', method: 'GET', endpoint: '/api/v1/admin/rbac/security/login-history', required_permission: 'security.login_history', description: 'View administrative login audit logs' },
      { module: 'security', method: 'GET', endpoint: '/api/v1/admin/rbac/security/settings', required_permission: 'security.password_policy', description: 'Retrieve platform security configuration' },
      { module: 'audit', method: 'GET', endpoint: '/api/v1/admin/rbac/audit-logs', required_permission: 'audit.read', description: 'Query immutable administrative audit trail' },
      { module: 'audit', method: 'GET', endpoint: '/api/v1/admin/rbac/activity', required_permission: 'audit.admin_activity', description: 'List fine-grained admin user activity trail' },
      { module: 'services', method: 'GET', endpoint: '/api/v1/admin/services', required_permission: 'services.read', description: 'Manage services catalog' },
      { module: 'products', method: 'GET', endpoint: '/api/v1/admin/products', required_permission: 'products.read', description: 'Manage digital products catalog' },
      { module: 'orders', method: 'GET', endpoint: '/api/v1/admin/orders', required_permission: 'orders.read', description: 'Query orders and delivery milestones' },
      { module: 'finance', method: 'GET', endpoint: '/api/v1/admin/finance/escrow', required_permission: 'finance.escrow_view', description: 'View escrow fund ledger' },
      { module: 'finance', method: 'POST', endpoint: '/api/v1/admin/finance/payouts/approve', required_permission: 'finance.payout_approve', description: 'Disburse seller earnings' },
      { module: 'super_admin', method: 'POST', endpoint: '/api/v1/admin/rbac/super-admin/maintenance', required_permission: 'superadmin.maintenance', description: 'Toggle emergency maintenance mode' },
      { module: 'super_admin', method: 'GET', endpoint: '/api/v1/admin/rbac/super-admin/dashboard', required_permission: 'superadmin.full_control', description: 'Super Admin owner command console' }
    ];

    for (const route of apiRoutesData) {
      await client.query(`
        INSERT INTO api_route_permissions (module, method, endpoint, required_permission, description, is_protected)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (method, endpoint) DO UPDATE SET 
          module = EXCLUDED.module,
          required_permission = EXCLUDED.required_permission,
          description = EXCLUDED.description;
      `, [route.module, route.method, route.endpoint, route.required_permission, route.description]);
    }
    console.log(`✓ Registered ${apiRoutesData.length} API route permissions`);

    // ─────────────────────────────────────────────────────────────────────────
    // 9. SEED 10 REAL-TIME ACTIVE ADMIN SESSIONS
    // ─────────────────────────────────────────────────────────────────────────
    const sessionsData = [
      { user: 'superadmin@desigot.com', ip: '104.28.245.10', device: 'MacBook Pro 16"', browser: 'Chrome 122', os: 'macOS Sonoma', loc: 'San Francisco, US', current: true },
      { user: 'admin@desigot.com', ip: '72.14.201.55', device: 'ThinkPad X1 Carbon', browser: 'Firefox 123', os: 'Windows 11', loc: 'New York, US', current: false },
      { user: 'website.admin@desigot.com', ip: '198.51.100.4', device: 'Dell XPS 15', browser: 'Edge 121', os: 'Windows 11', loc: 'Toronto, CA', current: false },
      { user: 'operations@desigot.com', ip: '185.199.108.153', device: 'MacBook Air M2', browser: 'Safari 17.2', os: 'macOS Sonoma', loc: 'London, UK', current: false },
      { user: 'services@desigot.com', ip: '203.0.113.88', device: 'iMac 24"', browser: 'Chrome 122', os: 'macOS Ventura', loc: 'Singapore, SG', current: false },
      { user: 'products@desigot.com', ip: '142.250.190.46', device: 'HP Spectre x360', browser: 'Chrome 122', os: 'Windows 11', loc: 'Austin, US', current: false },
      { user: 'sellers@desigot.com', ip: '192.0.2.14', device: 'iPad Pro 12.9"', browser: 'Mobile Safari', os: 'iPadOS 17.3', loc: 'Miami, US', current: false },
      { user: 'support.lead@desigot.com', ip: '198.51.100.77', device: 'ThinkPad T14', browser: 'Chrome 122', os: 'Ubuntu 22.04 LTS', loc: 'Berlin, DE', current: false },
      { user: 'finance@desigot.com', ip: '104.16.132.229', device: 'Mac Studio', browser: 'Brave 1.62', os: 'macOS Sonoma', loc: 'Zurich, CH', current: false },
      { user: 'marketing@desigot.com', ip: '172.67.140.21', device: 'Surface Laptop 5', browser: 'Chrome 122', os: 'Windows 11', loc: 'Paris, FR', current: false }
    ];

    // Clear old test sessions
    await client.query(`DELETE FROM admin_sessions;`);

    for (const s of sessionsData) {
      const uId = userMap[s.user];
      if (!uId) continue;
      const token = 'sess_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

      await client.query(`
        INSERT INTO admin_sessions (
          user_id, session_token, ip_address, user_agent, device, browser, os, location, is_current, is_revoked, last_activity_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, NOW() - (random() * INTERVAL '2 hours'));
      `, [uId, token, s.ip, `${s.browser} on ${s.os}`, s.device, s.browser, s.os, s.loc, s.current]);
    }
    console.log(`✓ Seeded ${sessionsData.length} active admin sessions`);

    // ─────────────────────────────────────────────────────────────────────────
    // 10. SEED 100 LOGIN HISTORY RECORDS
    // ─────────────────────────────────────────────────────────────────────────
    const browsers = ['Chrome 122', 'Firefox 123', 'Safari 17', 'Edge 121'];
    const ips = ['104.28.245.10', '72.14.201.55', '198.51.100.4', '185.199.108.153', '203.0.113.88', '142.250.190.46'];
    const userEmails = Object.keys(userMap);

    await client.query(`DELETE FROM login_history;`);

    for (let i = 0; i < 100; i++) {
      const email = userEmails[i % userEmails.length];
      const uId = userMap[email];
      const isFailed = i % 12 === 0;
      const isBlocked = i % 25 === 0;
      const status = isBlocked ? 'blocked' : (isFailed ? 'failed' : 'success');
      const reason = isBlocked ? 'IP rate-limit exceeded (Brute-force protection)' : (isFailed ? 'Invalid TOTP verification code' : null);
      const ip = ips[i % ips.length];
      const browser = browsers[i % browsers.length];

      await client.query(`
        INSERT INTO login_history (
          user_id, email, ip_address, user_agent, status, failure_reason, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7 || ' hours')::INTERVAL);
      `, [uId, email, ip, browser, status, reason, i * 2]);
    }
    console.log('✓ Seeded 100 realistic login history records');

    // ─────────────────────────────────────────────────────────────────────────
    // 11. SEED 100 ADMIN ACTIVITY LOGS (admin_activity_logs table)
    // ─────────────────────────────────────────────────────────────────────────
    const adminActions = [
      { action: 'UPDATE_ROLE_PERMISSIONS', module: 'roles', resource: 'Role', details: 'Updated permission matrix for role Operations Manager' },
      { action: 'APPROVE_SERVICE', module: 'services', resource: 'Service', details: 'Approved "Enterprise Full-Stack Web Development" listing' },
      { action: 'RELEASE_ESCROW', module: 'finance', resource: 'Escrow', details: 'Released $4,500.00 escrow milestone to seller Alex Designer' },
      { action: 'SUSPEND_USER', module: 'users', resource: 'User', details: 'Suspended suspicious user due to fraud verification failure' },
      { action: 'CREATE_COUPON', module: 'marketing', resource: 'Coupon', details: 'Created promo coupon "DESIGOT25" with 25% discount' },
      { action: 'PUBLISH_PAGE', module: 'cms', resource: 'Page', details: 'Published updated Terms of Service v4.2' },
      { action: 'RESOLVE_DISPUTE', module: 'communication', resource: 'Dispute', details: 'Settled dispute in favor of buyer with partial refund' },
      { action: 'UPDATE_SECURITY_SETTINGS', module: 'security', resource: 'SecuritySettings', details: 'Enforced mandatory 2FA for all administrative accounts' },
      { action: 'EXPORT_AUDIT_LOGS', module: 'audit', resource: 'AuditLog', details: 'Exported Q1 Compliance CSV audit report' },
      { action: 'REVOKE_SESSION', module: 'security', resource: 'Session', details: 'Revoked untrusted session from unusual IP range' }
    ];

    await client.query(`DELETE FROM admin_activity_logs;`);

    for (let i = 0; i < 100; i++) {
      const email = userEmails[i % 8]; // First 8 active admins
      const uId = userMap[email];
      const act = adminActions[i % adminActions.length];
      const ip = ips[i % ips.length];

      await client.query(`
        INSERT INTO admin_activity_logs (
          user_id, action, module, resource_type, resource_id, details, metadata, ip_address, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW() - ($9 || ' hours')::INTERVAL
        );
      `, [
        uId,
        act.action,
        act.module,
        act.resource,
        'res_' + (1000 + i),
        act.details,
        JSON.stringify({ severity: 'info', userEmail: email, step: i }),
        ip,
        i * 3
      ]);
    }
    console.log('✓ Seeded 100 admin activity log records');

    // ─────────────────────────────────────────────────────────────────────────
    // 12. SEED 100 AUDIT LOGS (audit_logs table)
    // ─────────────────────────────────────────────────────────────────────────
    for (let i = 0; i < 100; i++) {
      const email = userEmails[i % 5];
      const uId = userMap[email];
      const act = adminActions[i % adminActions.length];

      await client.query(`
        INSERT INTO audit_logs (
          actor_id, actor_type, action, entity_type, entity_id, old_values, new_values, ip_address, metadata, created_at
        ) VALUES (
          $1, 'admin', $2, $3, $4, $5, $6, $7, $8, NOW() - ($9 || ' hours')::INTERVAL
        );
      `, [
        uId,
        act.action,
        act.resource,
        '00000000-0000-0000-0000-' + String(100000000000 + i).slice(-12),
        JSON.stringify({ status: 'pending', version: 1 }),
        JSON.stringify({ status: 'active', version: 2 }),
        ips[i % ips.length],
        JSON.stringify({ actorEmail: email, auditCategory: act.module }),
        i * 2
      ]);
    }
    console.log('✓ Seeded 100 immutable audit log entries');

    // ─────────────────────────────────────────────────────────────────────────
    // 13. SEED SECURITY SETTINGS (security_settings table)
    // ─────────────────────────────────────────────────────────────────────────
    const securitySettings = [
      { key: 'session_timeout_minutes', category: 'sessions', value: { value: 60, unit: 'minutes' }, desc: 'Idle session timeout before automatic logout' },
      { key: 'max_failed_logins', category: 'lockout', value: { maxAttempts: 5, lockMinutes: 30 }, desc: 'Failed login attempts before account temporary lockout' },
      { key: 'require_2fa_admins', category: 'authentication', value: { enforced: true, gracePeriodDays: 3 }, desc: 'Mandatory Two-Factor Authentication for all admin roles' },
      { key: 'password_policy', category: 'passwords', value: { minLength: 12, requireUpper: true, requireLower: true, requireNumber: true, requireSymbol: true, maxAgeDays: 90 }, desc: 'Strong password complexity rules' },
      { key: 'ip_whitelist', category: 'network', value: { enabled: false, allowedSubnets: ['10.0.0.0/8', '192.168.1.0/24', '127.0.0.1'] }, desc: 'Admin console IP whitelisting' },
      { key: 'concurrent_sessions_limit', category: 'sessions', value: { maxActiveSessions: 3, terminateOldestOnExceed: true }, desc: 'Maximum concurrent active sessions per user' }
    ];

    for (const ss of securitySettings) {
      await client.query(`
        INSERT INTO security_settings (setting_key, setting_value, category, description, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (setting_key) DO UPDATE SET 
          setting_value = EXCLUDED.setting_value,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          updated_at = NOW();
      `, [ss.key, JSON.stringify(ss.value), ss.category, ss.desc]);
    }
    console.log('✓ Configured enterprise security settings');

    // ─────────────────────────────────────────────────────────────────────────
    // 14. SEED ACCESS CONTROL POLICIES (access_policies table)
    // ─────────────────────────────────────────────────────────────────────────
    const accessPoliciesData = [
      {
        name: 'Enforce MFA for Finance Operations',
        slug: 'enforce-mfa-finance',
        description: 'Requires multi-factor authentication for any payout approval or escrow release',
        effect: 'allow',
        subject_type: 'role',
        resource: 'finance',
        action: 'MANAGE',
        priority: 10,
        conditions: { requireMfa: true, allowEscrowRelease: true }
      },
      {
        name: 'Block Untrusted ASN from Admin Dashboard',
        slug: 'block-untrusted-asn',
        description: 'Denies all administrative access requests originating from flagged proxy/VPN ranges',
        effect: 'deny',
        subject_type: 'role',
        resource: '*',
        action: '*',
        priority: 100,
        conditions: { blockTor: true, blockVpn: true }
      },
      {
        name: 'Moderator Working Hours Policy',
        slug: 'moderator-working-hours',
        description: 'Permits review and ticket moderation actions during standard operating shifts',
        effect: 'allow',
        subject_type: 'role',
        resource: 'reviews',
        action: '*',
        priority: 20,
        conditions: { allowedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hours: '08:00-20:00' }
      },
      {
        name: 'Restricted Root Recovery to Owner Only',
        slug: 'superadmin-owner-only-recovery',
        description: 'Strictly confines database dump, disaster recovery, and maintenance override to Super Admin',
        effect: 'allow',
        subject_type: 'user',
        resource: 'superadmin',
        action: '*',
        priority: 1,
        conditions: { isSuperAdmin: true }
      }
    ];

    for (const ap of accessPoliciesData) {
      await client.query(`
        INSERT INTO access_policies (name, slug, description, effect, subject_type, resource, action, priority, conditions, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
        ON CONFLICT (slug) DO UPDATE SET 
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          effect = EXCLUDED.effect,
          priority = EXCLUDED.priority,
          conditions = EXCLUDED.conditions;
      `, [ap.name, ap.slug, ap.description, ap.effect, ap.subject_type, ap.resource, ap.action, ap.priority, JSON.stringify(ap.conditions)]);
    }
    console.log(`✓ Seeded ${accessPoliciesData.length} ABAC access control policies`);

    await client.query('COMMIT');
    console.log('\n======================================================');
    console.log('✓ ENTERPRISE RBAC & ADMIN SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Enterprise RBAC seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedEnterpriseRbac();
