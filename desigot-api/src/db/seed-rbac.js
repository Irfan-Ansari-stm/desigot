'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const config = require('../config');

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'Password123!';

async function seedRbac() {
  const pool = new Pool({ connectionString: config.db.primary });
  const client = await pool.connect();

  try {
    console.log('Seeding comprehensive RBAC data...');
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // 1. SEED DEPARTMENTS
    const deptRows = [
      { name: 'Executive & Ownership', slug: 'executive', code: 'EXEC', description: 'Executive board and platform ownership team' },
      { name: 'Security & Compliance', slug: 'security-compliance', code: 'SEC', description: 'Platform security, threat defense and compliance audits' },
      { name: 'Engineering & DevOps', slug: 'engineering-devops', code: 'ENG', description: 'Core infrastructure, microservices, and backend architecture' },
      { name: 'Customer Operations', slug: 'customer-ops', code: 'OPS', description: 'User onboarding, ticket support, and disputes handling' },
      { name: 'Product & Design', slug: 'product-design', code: 'PRD', description: 'Product management, UI/UX design, and marketplace curation' }
    ];

    const departmentMap = {};
    for (const d of deptRows) {
      const res = await client.query(`
        INSERT INTO departments (name, slug, code, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
        RETURNING id, slug;
      `, [d.name, d.slug, d.code, d.description]);
      departmentMap[d.slug] = res.rows[0].id;
    }
    console.log('Seeded departments:', Object.keys(departmentMap).length);

    // 2. SEED DESIGNATIONS
    const designations = [
      { dept: 'executive', title: 'Platform Owner / Super Admin', slug: 'super-admin-exec', level: 'Executive' },
      { dept: 'executive', title: 'Chief Technology Officer', slug: 'cto', level: 'Executive' },
      { dept: 'security-compliance', title: 'Lead Security Architect', slug: 'lead-sec-arch', level: 'Senior' },
      { dept: 'security-compliance', title: 'Compliance Officer', slug: 'compliance-officer', level: 'Mid-Level' },
      { dept: 'engineering-devops', title: 'Principal System Engineer', slug: 'principal-engineer', level: 'Principal' },
      { dept: 'engineering-devops', title: 'Full Stack Engineer', slug: 'full-stack-engineer', level: 'Mid-Level' },
      { dept: 'customer-ops', title: 'Operations Manager', slug: 'ops-manager', level: 'Management' },
      { dept: 'customer-ops', title: 'Support Specialist', slug: 'support-specialist', level: 'Junior' },
      { dept: 'product-design', title: 'Head of Product', slug: 'head-of-product', level: 'Senior' }
    ];

    const designationMap = {};
    for (const d of designations) {
      const res = await client.query(`
        INSERT INTO designations (department_id, title, slug, level)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, level = EXCLUDED.level
        RETURNING id, slug;
      `, [departmentMap[d.dept], d.title, d.slug, d.level]);
      designationMap[d.slug] = res.rows[0].id;
    }
    console.log('Seeded designations:', Object.keys(designationMap).length);

    // 3. SEED TEAMS
    const teams = [
      { dept: 'security-compliance', name: 'SecOps Threat Intelligence', slug: 'secops-intel', description: 'Handles intrusion detection and proactive security' },
      { dept: 'engineering-devops', name: 'Core Infrastructure Team', slug: 'core-infra', description: 'Database reliability, APIs and CI/CD pipelines' },
      { dept: 'customer-ops', name: 'User Trust & Safety', slug: 'trust-safety', description: 'Handles verification, approvals and fraud prevention' }
    ];

    for (const t of teams) {
      await client.query(`
        INSERT INTO teams (department_id, name, slug, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
      `, [departmentMap[t.dept], t.name, t.slug, t.description]);
    }
    console.log('Seeded teams');

    // 4. SEED MODULES
    const modules = [
      { name: 'Dashboard & Analytics', slug: 'dashboard', description: 'Executive overview, platform KPIs, health metrics', icon: 'LayoutDashboard', route: '/admin', display_order: 1 },
      { name: 'User Management', slug: 'users', description: 'User directories, account lifecycle, invitations, approvals', icon: 'Users', route: '/admin/users', display_order: 2 },
      { name: 'Role Management', slug: 'roles', description: 'Hierarchical roles, templates, inheritance, assignment', icon: 'Shield', route: '/admin/roles', display_order: 3 },
      { name: 'Permission Management', slug: 'permissions', description: 'Granular permissions, categories, interactive matrix', icon: 'Key', route: '/admin/permissions', display_order: 4 },
      { name: 'Access Control', slug: 'access_control', description: 'Attribute policies, module access, API scopes', icon: 'Lock', route: '/admin/access-control/policies', display_order: 5 },
      { name: 'Organization Management', slug: 'organization', description: 'Departments, teams, designations, organizational structure', icon: 'Building2', route: '/admin/organization/departments', display_order: 6 },
      { name: 'Security Management', slug: 'security', description: 'Sessions, login history, MFA, password & IP policies', icon: 'ShieldAlert', route: '/admin/security/login-history', display_order: 7 },
      { name: 'Audit & Activity Logs', slug: 'audit', description: 'Immutable audit trail, compliance reports, user action tracking', icon: 'FileText', route: '/admin/audit/all-logs', display_order: 8 },
      { name: 'API Management', slug: 'api_management', description: 'API keys, scopes, usage analytics, OpenAPI docs', icon: 'Cpu', route: '/admin/api-management/overview', display_order: 9 },
      { name: 'Notifications', slug: 'notifications', description: 'System alerts, user dispatch, email notification templates', icon: 'Bell', route: '/admin/notifications/system', display_order: 10 },
      { name: 'Reports & Business Intelligence', slug: 'reports', description: 'Comprehensive audit, user, role, and security exports', icon: 'BarChart3', route: '/admin/reports/users', display_order: 11 },
      { name: 'System Configuration', slug: 'system_config', description: 'Global parameters, auth rules, database, feature flags', icon: 'Settings', route: '/admin/system/general', display_order: 12 },
      { name: 'Super Admin Control Center', slug: 'super_admin', description: 'Protected owner dashboard, root overrides, emergency maintenance', icon: 'Crown', route: '/admin/super-admin/control-center', display_order: 13, is_system: true }
    ];

    const moduleMap = {};
    for (const m of modules) {
      const res = await client.query(`
        INSERT INTO modules (name, slug, description, icon, route, display_order, is_system)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, route = EXCLUDED.route, display_order = EXCLUDED.display_order
        RETURNING id, slug;
      `, [m.name, m.slug, m.description, m.icon, m.route, m.display_order, m.is_system || false]);
      moduleMap[m.slug] = res.rows[0].id;
    }
    console.log('Seeded modules:', Object.keys(moduleMap).length);

    // 5. SEED PERMISSION GROUPS
    const groups = [
      { name: 'User Operations', slug: 'group-users', description: 'User accounts, profile management, status changes', display_order: 1 },
      { name: 'Roles & Permissions', slug: 'group-roles', description: 'Role configurations, permission assignments, matrix controls', display_order: 2 },
      { name: 'Access & Organization', slug: 'group-access', description: 'Access policies, organizational hierarchy, departments', display_order: 3 },
      { name: 'Security & Auditing', slug: 'group-security', description: 'Authentication logs, security events, audit tracking', display_order: 4 },
      { name: 'System & Integration', slug: 'group-system', description: 'Platform configurations, API keys, webhooks, feature flags', display_order: 5 },
      { name: 'Super Admin Root Controls', slug: 'group-superadmin', description: 'Owner-only system level controls and emergency overrides', display_order: 6 }
    ];

    const groupMap = {};
    for (const g of groups) {
      const res = await client.query(`
        INSERT INTO permission_groups (name, slug, description, display_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
        RETURNING id, slug;
      `, [g.name, g.slug, g.description, g.display_order]);
      groupMap[g.slug] = res.rows[0].id;
    }
    console.log('Seeded permission groups');

    // 6. SEED GRANULAR PERMISSIONS
    const permissionDefinitions = [
      // Users
      { name: 'Create Users', slug: 'users.create', resource: 'users', action: 'CREATE', module: 'users', group: 'group-users' },
      { name: 'Read Users', slug: 'users.read', resource: 'users', action: 'READ', module: 'users', group: 'group-users' },
      { name: 'Update Users', slug: 'users.update', resource: 'users', action: 'UPDATE', module: 'users', group: 'group-users' },
      { name: 'Delete Users', slug: 'users.delete', resource: 'users', action: 'DELETE', module: 'users', group: 'group-users' },
      { name: 'View User Details', slug: 'users.view', resource: 'users', action: 'VIEW', module: 'users', group: 'group-users' },
      { name: 'Export Users', slug: 'users.export', resource: 'users', action: 'EXPORT', module: 'users', group: 'group-users' },
      { name: 'Import Users', slug: 'users.import', resource: 'users', action: 'IMPORT', module: 'users', group: 'group-users' },
      { name: 'Assign User Roles', slug: 'users.assign_role', resource: 'users', action: 'ASSIGN', module: 'users', group: 'group-users' },
      { name: 'Manage User Status', slug: 'users.manage', resource: 'users', action: 'MANAGE', module: 'users', group: 'group-users' },

      // Roles
      { name: 'Create Roles', slug: 'roles.create', resource: 'roles', action: 'CREATE', module: 'roles', group: 'group-roles' },
      { name: 'Read Roles', slug: 'roles.read', resource: 'roles', action: 'READ', module: 'roles', group: 'group-roles' },
      { name: 'Update Roles', slug: 'roles.update', resource: 'roles', action: 'UPDATE', module: 'roles', group: 'group-roles' },
      { name: 'Delete Roles', slug: 'roles.delete', resource: 'roles', action: 'DELETE', module: 'roles', group: 'group-roles' },
      { name: 'View Role Details', slug: 'roles.view', resource: 'roles', action: 'VIEW', module: 'roles', group: 'group-roles' },
      { name: 'Export Roles', slug: 'roles.export', resource: 'roles', action: 'EXPORT', module: 'roles', group: 'group-roles' },
      { name: 'Assign Permissions to Roles', slug: 'roles.assign_permissions', resource: 'roles', action: 'ASSIGN', module: 'roles', group: 'group-roles' },
      { name: 'Manage Roles', slug: 'roles.manage', resource: 'roles', action: 'MANAGE', module: 'roles', group: 'group-roles' },

      // Permissions
      { name: 'Create Permissions', slug: 'permissions.create', resource: 'permissions', action: 'CREATE', module: 'permissions', group: 'group-roles' },
      { name: 'Read Permissions', slug: 'permissions.read', resource: 'permissions', action: 'READ', module: 'permissions', group: 'group-roles' },
      { name: 'Update Permissions', slug: 'permissions.update', resource: 'permissions', action: 'UPDATE', module: 'permissions', group: 'group-roles' },
      { name: 'Delete Permissions', slug: 'permissions.delete', resource: 'permissions', action: 'DELETE', module: 'permissions', group: 'group-roles' },
      { name: 'Assign Permissions', slug: 'permissions.assign', resource: 'permissions', action: 'ASSIGN', module: 'permissions', group: 'group-roles' },
      { name: 'Manage Permissions Matrix', slug: 'permissions.manage', resource: 'permissions', action: 'MANAGE', module: 'permissions', group: 'group-roles' },

      // Access Control
      { name: 'Read Access Policies', slug: 'access_control.read', resource: 'access_control', action: 'READ', module: 'access_control', group: 'group-access' },
      { name: 'Configure Access Policies', slug: 'access_control.configure', resource: 'access_control', action: 'CONFIGURE', module: 'access_control', group: 'group-access' },
      { name: 'Manage Access Policies', slug: 'access_control.manage', resource: 'access_control', action: 'MANAGE', module: 'access_control', group: 'group-access' },

      // Organization
      { name: 'Create Departments & Teams', slug: 'organization.create', resource: 'organization', action: 'CREATE', module: 'organization', group: 'group-access' },
      { name: 'Read Organization Units', slug: 'organization.read', resource: 'organization', action: 'READ', module: 'organization', group: 'group-access' },
      { name: 'Update Organization Units', slug: 'organization.update', resource: 'organization', action: 'UPDATE', module: 'organization', group: 'group-access' },
      { name: 'Delete Organization Units', slug: 'organization.delete', resource: 'organization', action: 'DELETE', module: 'organization', group: 'group-access' },
      { name: 'Manage Organization Structure', slug: 'organization.manage', resource: 'organization', action: 'MANAGE', module: 'organization', group: 'group-access' },

      // Security
      { name: 'Read Security Logs & Sessions', slug: 'security.read', resource: 'security', action: 'READ', module: 'security', group: 'group-security' },
      { name: 'Manage Sessions & Lockouts', slug: 'security.manage', resource: 'security', action: 'MANAGE', module: 'security', group: 'group-security' },
      { name: 'Configure Security Policies', slug: 'security.configure', resource: 'security', action: 'CONFIGURE', module: 'security', group: 'group-security' },

      // Audit
      { name: 'Read Audit Logs', slug: 'audit.read', resource: 'audit', action: 'READ', module: 'audit', group: 'group-security' },
      { name: 'Export Audit Reports', slug: 'audit.export', resource: 'audit', action: 'EXPORT', module: 'audit', group: 'group-security' },
      { name: 'View Audit Trail', slug: 'audit.view', resource: 'audit', action: 'VIEW', module: 'audit', group: 'group-security' },

      // API Management
      { name: 'Create API Keys', slug: 'api.create', resource: 'api', action: 'CREATE', module: 'api_management', group: 'group-system' },
      { name: 'Read API Logs & Keys', slug: 'api.read', resource: 'api', action: 'READ', module: 'api_management', group: 'group-system' },
      { name: 'Update API Configurations', slug: 'api.update', resource: 'api', action: 'UPDATE', module: 'api_management', group: 'group-system' },
      { name: 'Delete API Keys', slug: 'api.delete', resource: 'api', action: 'DELETE', module: 'api_management', group: 'group-system' },
      { name: 'Configure API Gateways', slug: 'api.configure', resource: 'api', action: 'CONFIGURE', module: 'api_management', group: 'group-system' },

      // Notifications
      { name: 'Create Notifications', slug: 'notifications.create', resource: 'notifications', action: 'CREATE', module: 'notifications', group: 'group-system' },
      { name: 'Read Notifications', slug: 'notifications.read', resource: 'notifications', action: 'READ', module: 'notifications', group: 'group-system' },
      { name: 'Manage Notification Templates', slug: 'notifications.manage', resource: 'notifications', action: 'MANAGE', module: 'notifications', group: 'group-system' },

      // Reports
      { name: 'Read Reports', slug: 'reports.read', resource: 'reports', action: 'READ', module: 'reports', group: 'group-system' },
      { name: 'Export Reports', slug: 'reports.export', resource: 'reports', action: 'EXPORT', module: 'reports', group: 'group-system' },

      // System Settings
      { name: 'Read System Settings', slug: 'settings.read', resource: 'settings', action: 'READ', module: 'system_config', group: 'group-system' },
      { name: 'Update System Settings', slug: 'settings.update', resource: 'settings', action: 'UPDATE', module: 'system_config', group: 'group-system' },
      { name: 'Configure Feature Flags', slug: 'settings.configure', resource: 'settings', action: 'CONFIGURE', module: 'system_config', group: 'group-system' },

      // Super Admin Exclusive
      { name: 'Super Admin Full Control', slug: 'superadmin.full_control', resource: 'superadmin', action: 'MANAGE', module: 'super_admin', group: 'group-superadmin', is_system: true },
      { name: 'Emergency Maintenance Override', slug: 'superadmin.maintenance', resource: 'superadmin', action: 'CONFIGURE', module: 'super_admin', group: 'group-superadmin', is_system: true },
      { name: 'Ownership & Disaster Recovery', slug: 'superadmin.recovery', resource: 'superadmin', action: 'MANAGE', module: 'super_admin', group: 'group-superadmin', is_system: true }
    ];

    const permissionMap = {};
    for (const p of permissionDefinitions) {
      const res = await client.query(`
        INSERT INTO permissions (name, slug, resource, action, module_id, group_id, is_system, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (slug) DO UPDATE SET 
          name = EXCLUDED.name, 
          resource = EXCLUDED.resource, 
          action = EXCLUDED.action, 
          module_id = EXCLUDED.module_id,
          group_id = EXCLUDED.group_id
        RETURNING id, slug;
      `, [p.name, p.slug, p.resource, p.action, moduleMap[p.module], groupMap[p.group], p.is_system || false, p.name]);
      permissionMap[p.slug] = res.rows[0].id;
    }
    console.log('Seeded permissions:', Object.keys(permissionMap).length);

    // 7. SEED ROLES
    const rolesData = [
      {
        name: 'Super Admin',
        slug: 'superadmin',
        description: 'Application Owner with absolute unrestricted system-wide access and emergency override',
        role_type: 'system',
        hierarchy_level: 1,
        is_system: true,
        is_active: true
      },
      {
        name: 'Platform Administrator',
        slug: 'admin',
        description: 'Administrative access for day-to-day operations, user and role governance',
        role_type: 'administrative',
        hierarchy_level: 2,
        is_system: true,
        is_active: true
      },
      {
        name: 'Operations Manager',
        slug: 'manager',
        description: 'Management oversight for departments, teams, users, and audit reporting',
        role_type: 'administrative',
        hierarchy_level: 3,
        is_system: true,
        is_active: true
      },
      {
        name: 'Security Officer',
        slug: 'security_officer',
        description: 'Security & compliance auditor with access to security events, sessions, and audit logs',
        role_type: 'custom',
        hierarchy_level: 4,
        is_system: false,
        is_active: true
      },
      {
        name: 'Standard User',
        slug: 'standard_user',
        description: 'Standard internal portal access with read-only view on non-sensitive modules',
        role_type: 'standard',
        hierarchy_level: 5,
        is_system: true,
        is_active: true
      }
    ];

    const roleMap = {};
    for (const r of rolesData) {
      const res = await client.query(`
        INSERT INTO roles (name, slug, description, role_type, hierarchy_level, is_system, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (slug) DO UPDATE SET 
          name = EXCLUDED.name, 
          description = EXCLUDED.description, 
          hierarchy_level = EXCLUDED.hierarchy_level,
          is_system = EXCLUDED.is_system
        RETURNING id, slug;
      `, [r.name, r.slug, r.description, r.role_type, r.hierarchy_level, r.is_system, r.is_active]);
      roleMap[r.slug] = res.rows[0].id;
    }
    console.log('Seeded roles:', Object.keys(roleMap).length);

    // 8. ASSIGN PERMISSIONS TO ROLES
    // SuperAdmin gets all permissions
    for (const permSlug of Object.keys(permissionMap)) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      `, [roleMap['superadmin'], permissionMap[permSlug]]);
    }

    // Admin permissions (everything except superadmin.* root operations)
    const adminPerms = Object.keys(permissionMap).filter(slug => !slug.startsWith('superadmin.'));
    for (const permSlug of adminPerms) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      `, [roleMap['admin'], permissionMap[permSlug]]);
    }

    // Manager permissions
    const managerPerms = [
      'users.read', 'users.view', 'users.export', 'users.manage',
      'roles.read', 'roles.view',
      'permissions.read',
      'organization.read', 'organization.update',
      'security.read',
      'audit.read', 'audit.view', 'audit.export',
      'reports.read', 'reports.export',
      'notifications.read', 'notifications.create'
    ];
    for (const permSlug of managerPerms) {
      if (permissionMap[permSlug]) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['manager'], permissionMap[permSlug]]);
      }
    }

    // Security Officer permissions
    const securityPerms = [
      'users.read', 'users.view',
      'security.read', 'security.manage', 'security.configure',
      'audit.read', 'audit.view', 'audit.export',
      'reports.read', 'reports.export'
    ];
    for (const permSlug of securityPerms) {
      if (permissionMap[permSlug]) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['security_officer'], permissionMap[permSlug]]);
      }
    }

    // Standard User permissions
    const standardPerms = [
      'notifications.read',
      'reports.read'
    ];
    for (const permSlug of standardPerms) {
      if (permissionMap[permSlug]) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [roleMap['standard_user'], permissionMap[permSlug]]);
      }
    }

    console.log('Assigned permissions to roles');

    // 9. SEED USERS & BIND ROLES
    const usersData = [
      {
        email: 'superadmin@desigot.com',
        username: 'superadmin',
        display_name: 'Dr. Gregory House (Application Owner)',
        first_name: 'Gregory',
        last_name: 'House',
        phone: '+1-555-0100',
        role: 'superadmin',
        is_super_admin: true,
        dept: 'executive',
        designation: 'super-admin-exec',
        bio: 'Chief Executive and System Owner with unrevokable administrative authority.'
      },
      {
        email: 'admin@desigot.com',
        username: 'admin',
        display_name: 'Sarah Connor (Platform Admin)',
        first_name: 'Sarah',
        last_name: 'Connor',
        phone: '+1-555-0101',
        role: 'admin',
        is_super_admin: false,
        dept: 'engineering-devops',
        designation: 'principal-engineer',
        bio: 'Senior Operations Administrator managing user provisioning and system maintenance.'
      },
      {
        email: 'manager@desigot.com',
        username: 'manager',
        display_name: 'John Miller (Operations Manager)',
        first_name: 'John',
        last_name: 'Miller',
        phone: '+1-555-0102',
        role: 'admin', // in legacy enum
        is_super_admin: false,
        dept: 'customer-ops',
        designation: 'ops-manager',
        bio: 'Managing customer support operations, verification pipelines, and departmental metrics.'
      },
      {
        email: 'security@desigot.com',
        username: 'secofficer',
        display_name: 'Alicia Keys (Security Lead)',
        first_name: 'Alicia',
        last_name: 'Keys',
        phone: '+1-555-0103',
        role: 'admin',
        is_super_admin: false,
        dept: 'security-compliance',
        designation: 'lead-sec-arch',
        bio: 'SecOps lead responsible for identity governance, threat monitoring, and audit compliance.'
      },
      {
        email: 'user@desigot.com',
        username: 'standarduser',
        display_name: 'David Standard (Staff User)',
        first_name: 'David',
        last_name: 'Standard',
        phone: '+1-555-0104',
        role: 'buyer',
        is_super_admin: false,
        dept: 'product-design',
        designation: 'full-stack-engineer',
        bio: 'Staff design collaborator and regular platform user.'
      }
    ];

    const userMap = {};
    for (const u of usersData) {
      const res = await client.query(`
        INSERT INTO users (
          email, username, display_name, first_name, last_name, phone,
          password_hash, role, is_super_admin, account_status, email_verified_at,
          department_id, designation_id, bio
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW(), $10, $11, $12)
        ON CONFLICT (email) DO UPDATE SET 
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          display_name = EXCLUDED.display_name,
          is_super_admin = EXCLUDED.is_super_admin,
          department_id = EXCLUDED.department_id,
          designation_id = EXCLUDED.designation_id,
          password_hash = EXCLUDED.password_hash,
          account_status = 'active'
        RETURNING id, email;
      `, [
        u.email, u.username, u.display_name, u.first_name, u.last_name, u.phone,
        passwordHash, u.role, u.is_super_admin, departmentMap[u.dept], designationMap[u.designation], u.bio
      ]);
      userMap[u.email] = res.rows[0].id;
    }
    console.log('Seeded users:', Object.keys(userMap).length);

    // Map user roles in user_roles table
    await client.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES 
        ($1, $2),
        ($3, $4),
        ($5, $6),
        ($7, $8),
        ($9, $10)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `, [
      userMap['superadmin@desigot.com'], roleMap['superadmin'],
      userMap['admin@desigot.com'], roleMap['admin'],
      userMap['manager@desigot.com'], roleMap['manager'],
      userMap['security@desigot.com'], roleMap['security_officer'],
      userMap['user@desigot.com'], roleMap['standard_user']
    ]);
    console.log('Mapped user roles in user_roles');

    // 10. SEED SYSTEM SETTINGS
    const settings = [
      { key: 'general.app_name', category: 'general', value: '"Desigot Enterprise RBAC"', data_type: 'string', description: 'Application display name' },
      { key: 'general.support_email', category: 'general', value: '"support@desigot.com"', data_type: 'string', description: 'Primary support email contact' },
      { key: 'auth.jwt_access_expiry', category: 'authentication', value: '"15m"', data_type: 'string', description: 'Access token expiration lifetime' },
      { key: 'auth.jwt_refresh_expiry', category: 'authentication', value: '"30d"', data_type: 'string', description: 'Refresh token lifetime' },
      { key: 'auth.password_min_length', category: 'authentication', value: '10', data_type: 'number', description: 'Minimum required password length' },
      { key: 'auth.max_login_attempts', category: 'security', value: '5', data_type: 'number', description: 'Max failed login attempts before lockout' },
      { key: 'auth.lockout_duration_minutes', category: 'security', value: '15', data_type: 'number', description: 'Lockout duration in minutes' },
      { key: 'auth.mfa_enforced', category: 'security', value: 'false', data_type: 'boolean', description: 'Require MFA for all administrative roles' },
      { key: 'rbac.session_timeout_minutes', category: 'authorization', value: '120', data_type: 'number', description: 'Session inactivity timeout' },
      { key: 'rbac.strict_superadmin_mode', category: 'authorization', value: 'true', data_type: 'boolean', description: 'Enforce unbypassable Super Admin protections' },
      { key: 'system.maintenance_mode', category: 'system', value: 'false', data_type: 'boolean', description: 'Global maintenance mode disabling public APIs' }
    ];

    for (const s of settings) {
      await client.query(`
        INSERT INTO system_settings (key, category, value, data_type, description, is_system)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
      `, [s.key, s.category, JSON.stringify(s.value), s.data_type, s.description]);
    }
    console.log('Seeded system settings');

    // 11. SEED ROLE TEMPLATES
    const templates = [
      {
        name: 'Compliance & Security Auditor',
        slug: 'tmpl-security-auditor',
        category: 'Audit',
        description: 'Preconfigured template with full read-only visibility into audit trails, security logs, and compliance analytics.',
        permission_slugs: ['audit.read', 'audit.view', 'audit.export', 'security.read', 'reports.read', 'reports.export']
      },
      {
        name: 'Helpdesk Support Tier-2',
        slug: 'tmpl-helpdesk-tier2',
        category: 'Support',
        description: 'Customer support agent capable of viewing user accounts, resetting passwords, and inspecting notifications.',
        permission_slugs: ['users.read', 'users.view', 'users.update', 'notifications.read', 'notifications.create']
      },
      {
        name: 'Department Manager',
        slug: 'tmpl-dept-manager',
        category: 'Management',
        description: 'Supervisory role capable of assigning department users, reviewing activity, and exporting team reports.',
        permission_slugs: ['users.read', 'users.view', 'users.assign_role', 'organization.read', 'reports.read', 'reports.export']
      }
    ];

    for (const t of templates) {
      await client.query(`
        INSERT INTO role_templates (name, slug, category, description, permission_slugs)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description, permission_slugs = EXCLUDED.permission_slugs;
      `, [t.name, t.slug, t.category, t.description, t.permission_slugs]);
    }
    console.log('Seeded role templates');

    // 12. SEED SAMPLE ACCESS POLICIES
    const policies = [
      {
        name: 'Admin User Full Access Policy',
        slug: 'admin-full-access',
        description: 'Grants platform administrators access to all administrative operational endpoints',
        effect: 'allow',
        subject_type: 'role',
        subject_id: roleMap['admin'],
        resource: '*',
        action: '*',
        priority: 10
      },
      {
        name: 'Restrict Audit Log Export',
        slug: 'restrict-audit-export',
        description: 'Only Security Officer and Super Admin can export raw immutable audit records',
        effect: 'deny',
        subject_type: 'role',
        subject_id: roleMap['manager'],
        resource: 'audit',
        action: 'EXPORT',
        priority: 50
      }
    ];

    for (const pol of policies) {
      await client.query(`
        INSERT INTO access_policies (name, slug, description, effect, subject_type, subject_id, resource, action, priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description, effect = EXCLUDED.effect;
      `, [pol.name, pol.slug, pol.description, pol.effect, pol.subject_type, pol.subject_id, pol.resource, pol.action, pol.priority]);
    }
    console.log('Seeded access policies');

    // 13. SEED EMAIL TEMPLATES
    const emailTemplates = [
      {
        name: 'User Invitation',
        slug: 'user-invitation',
        subject: 'Welcome to Desigot — Your Invitation to Join the Enterprise Portal',
        body_html: '<h2>Hello {{name}},</h2><p>You have been invited to join the Desigot Enterprise Administration platform as <strong>{{role}}</strong>.</p><p><a href="{{invite_link}}" style="background:#0F172A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Accept Invitation</a></p>',
        body_text: 'Hello {{name}}, You have been invited to join Desigot as {{role}}. Visit: {{invite_link}}',
        variables: ['name', 'role', 'invite_link']
      },
      {
        name: 'Security Alert: Suspicious Login',
        slug: 'security-alert-login',
        subject: 'Security Notice: New Sign-in from Unrecognized Location',
        body_html: '<h2>Security Alert</h2><p>A new sign-in was detected on your account from IP {{ip_address}} at {{timestamp}}.</p>',
        body_text: 'Security Alert: New sign-in detected on your account from IP {{ip_address}} at {{timestamp}}.',
        variables: ['ip_address', 'timestamp', 'device']
      }
    ];

    for (const em of emailTemplates) {
      await client.query(`
        INSERT INTO email_templates (name, slug, subject, body_html, body_text, variables)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO UPDATE SET subject = EXCLUDED.subject, body_html = EXCLUDED.body_html;
      `, [em.name, em.slug, em.subject, em.body_html, em.body_text, em.variables]);
    }
    console.log('Seeded email templates');

    // 14. SEED SAMPLE LOGIN HISTORY & AUDIT LOGS
    await client.query(`
      INSERT INTO login_history (user_id, email, ip_address, user_agent, status)
      VALUES 
        ($1, 'superadmin@desigot.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'success'),
        ($2, 'admin@desigot.com', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'success'),
        (NULL, 'hacker@unknown.com', '45.33.32.156', 'curl/7.68.0', 'failed')
      ON CONFLICT DO NOTHING;
    `, [userMap['superadmin@desigot.com'], userMap['admin@desigot.com']]);

    await client.query(`
      INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, new_values, ip_address, user_agent)
      VALUES 
        ($1, 'admin', 'system.bootstrap', 'system', $1, '{"message": "Enterprise RBAC initialized with protected Super Admin"}'::jsonb, '127.0.0.1', 'Migration Seeder/1.0');
    `, [userMap['superadmin@desigot.com']]);

    await client.query('COMMIT');
    console.log('RBAC Database seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedRbac();
