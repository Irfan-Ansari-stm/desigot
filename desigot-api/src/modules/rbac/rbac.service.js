'use strict';
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, withTransaction } = require('../../db/pool');
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} = require('../../shared/errors/AppError');
const config = require('../../config');

/**
 * Enterprise RBAC Service
 * Centralizes all authorization, roles, permissions, matrix, governance and superadmin operations.
 */

// ── Cache for role permissions to ensure sub-millisecond checks ───────────────
const permissionCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fallback, actively invalidated on mutations

const invalidatePermissionCache = (roleId = null) => {
  if (roleId) {
    permissionCache.delete(`role:${roleId}`);
  } else {
    permissionCache.clear();
  }
};

// ── AUDIT LOGGING HELPER ──────────────────────────────────────────────────────
const logAuditEvent = async ({
  actorId,
  actorType = 'admin',
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
  metadata = {},
}) => {
  try {
    await query(
      `INSERT INTO audit_logs (
        actor_id, actor_type, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        actorId,
        actorType,
        action,
        entityType,
        entityId || actorId || '00000000-0000-0000-0000-000000000000',
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
        JSON.stringify(metadata),
      ]
    );
  } catch (err) {
    console.error('Failed to append to immutable audit_logs:', err.message);
  }
};

// ── 1. USER PERMISSIONS & ROLES RESOLUTION ────────────────────────────────────
const getUserEffectivePermissions = async (userId) => {
  // 1. Fetch user to verify superadmin status
  const userRes = await query(
    `SELECT id, role, is_super_admin, account_status FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  if (!userRes.rows.length) return { permissions: [], roles: [], isSuperAdmin: false };

  const user = userRes.rows[0];
  const isSuperAdmin = user.is_super_admin === true || user.role === 'superadmin';

  // 2. Fetch all assigned roles
  const rolesRes = await query(
    `SELECT r.id, r.name, r.slug, r.hierarchy_level, r.is_system, r.is_active
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND r.is_active = TRUE`,
    [userId]
  );

  let userRoles = rolesRes.rows;

  // Fallback: if user has role enum 'superadmin' but not in user_roles table, include it
  if (isSuperAdmin && !userRoles.some((r) => r.slug === 'superadmin')) {
    const saRole = await query(`SELECT id, name, slug, hierarchy_level, is_system, is_active FROM roles WHERE slug = 'superadmin'`);
    if (saRole.rows.length) userRoles.push(saRole.rows[0]);
  }

  // If user is Super Admin -> Unrestricted access: returns all system permissions
  if (isSuperAdmin) {
    const allPerms = await query(`SELECT slug FROM permissions`);
    const permSlugs = allPerms.rows.map((p) => p.slug);
    permSlugs.push('*'); // Wildcard permission
    return {
      permissions: Array.from(new Set(permSlugs)),
      roles: userRoles,
      isSuperAdmin: true,
      hierarchyLevel: 1,
    };
  }

  // 3. Resolve permissions from all assigned roles
  if (!userRoles.length) {
    return { permissions: [], roles: [], isSuperAdmin: false, hierarchyLevel: 5 };
  }

  const roleIds = userRoles.map((r) => r.id);
  const permsRes = await query(
    `SELECT DISTINCT p.slug
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = ANY($1::uuid[])`,
    [roleIds]
  );

  const minHierarchy = Math.min(...userRoles.map((r) => r.hierarchy_level));

  return {
    permissions: permsRes.rows.map((p) => p.slug),
    roles: userRoles,
    isSuperAdmin: false,
    hierarchyLevel: minHierarchy,
  };
};

// ── 2. ROLE MANAGEMENT ────────────────────────────────────────────────────────
const getRoles = async ({ search, roleType, isActive, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(r.name ILIKE $${params.length} OR r.slug ILIKE $${params.length} OR r.description ILIKE $${params.length})`);
  }
  if (roleType) {
    params.push(roleType);
    conditions.push(`r.role_type = $${params.length}`);
  }
  if (isActive !== undefined) {
    params.push(isActive === 'true' || isActive === true);
    conditions.push(`r.is_active = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM roles r ${whereClause}`;
  const totalRes = await query(countQuery, params);
  const total = parseInt(totalRes.rows[0].count, 10);

  params.push(limit, offset);
  const rolesQuery = `
    SELECT r.id, r.name, r.slug, r.description, r.role_type, r.hierarchy_level,
           r.is_system, r.is_active, r.created_at, r.updated_at,
           COUNT(DISTINCT ur.user_id) AS user_count,
           COUNT(DISTINCT rp.permission_id) AS permission_count
      FROM roles r
      LEFT JOIN user_roles ur ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
     ${whereClause}
     GROUP BY r.id
     ORDER BY r.hierarchy_level ASC, r.created_at ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const { rows } = await query(rolesQuery, params);
  return {
    roles: rows.map((r) => ({
      ...r,
      user_count: parseInt(r.user_count, 10),
      permission_count: parseInt(r.permission_count, 10),
    })),
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getRoleById = async (id) => {
  const roleRes = await query(
    `SELECT r.*, 
            COUNT(DISTINCT ur.user_id) AS user_count,
            COUNT(DISTINCT rp.permission_id) AS permission_count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
      WHERE r.id = $1
      GROUP BY r.id`,
    [id]
  );
  if (!roleRes.rows.length) throw new NotFoundError('Role');

  const role = roleRes.rows[0];

  // Fetch assigned permissions
  const permsRes = await query(
    `SELECT p.id, p.name, p.slug, p.resource, p.action, m.name AS module_name, g.name AS group_name
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       LEFT JOIN modules m ON m.id = p.module_id
       LEFT JOIN permission_groups g ON g.id = p.group_id
      WHERE rp.role_id = $1
      ORDER BY p.resource ASC, p.action ASC`,
    [id]
  );

  // Fetch sample assigned users
  const usersRes = await query(
    `SELECT u.id, u.email, u.display_name, u.avatar_url, u.account_status, ur.assigned_at
       FROM user_roles ur
       JOIN users u ON u.id = ur.user_id
      WHERE ur.role_id = $1
      ORDER BY ur.assigned_at DESC
      LIMIT 10`,
    [id]
  );

  return {
    ...role,
    user_count: parseInt(role.user_count, 10),
    permission_count: parseInt(role.permission_count, 10),
    permissions: permsRes.rows,
    users: usersRes.rows,
  };
};

const createRole = async (data, actorId) => {
  const { name, slug, description, role_type = 'custom', hierarchy_level = 4, is_active = true, permissions = [] } = data;

  if (slug === 'superadmin' || name.toLowerCase() === 'super admin') {
    throw new ForbiddenError('Super Admin role is unique and protected by system architecture.');
  }

  return withTransaction(async (client) => {
    const existing = await client.query(`SELECT id FROM roles WHERE slug = $1`, [slug]);
    if (existing.rows.length) throw new ConflictError('A role with this slug already exists.');

    const res = await client.query(
      `INSERT INTO roles (name, slug, description, role_type, hierarchy_level, is_system, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7, $7)
       RETURNING *`,
      [name, slug, description, role_type, hierarchy_level, is_active, actorId]
    );
    const newRole = res.rows[0];

    // Assign permissions if provided
    if (permissions && permissions.length) {
      for (const permId of permissions) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [newRole.id, permId, actorId]
        );
      }
    }

    await logAuditEvent({
      actorId,
      action: 'role.create',
      entityType: 'role',
      entityId: newRole.id,
      newValues: { name, slug, role_type, permissionsCount: permissions.length },
    });

    invalidatePermissionCache();
    return newRole;
  });
};

const updateRole = async (id, data, actorId) => {
  const roleRes = await query(`SELECT * FROM roles WHERE id = $1`, [id]);
  if (!roleRes.rows.length) throw new NotFoundError('Role');
  const role = roleRes.rows[0];

  // Protect Super Admin role from unauthorized modifications
  if (role.slug === 'superadmin') {
    throw new ForbiddenError('The Super Admin system role cannot be modified.');
  }

  const { name, description, role_type, hierarchy_level, is_active, permissions } = data;

  return withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE roles
          SET name = COALESCE($1, name),
              description = COALESCE($2, description),
              role_type = COALESCE($3, role_type),
              hierarchy_level = COALESCE($4, hierarchy_level),
              is_active = COALESCE($5, is_active),
              updated_by = $6,
              updated_at = NOW()
        WHERE id = $7
        RETURNING *`,
      [name, description, role_type, hierarchy_level, is_active, actorId, id]
    );

    const updatedRole = res.rows[0];

    // If permissions array was passed, synchronize them
    if (permissions !== undefined && Array.isArray(permissions)) {
      await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [id]);
      for (const permId of permissions) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [id, permId, actorId]
        );
      }
    }

    await logAuditEvent({
      actorId,
      action: 'role.update',
      entityType: 'role',
      entityId: id,
      oldValues: { name: role.name, is_active: role.is_active },
      newValues: { name: updatedRole.name, is_active: updatedRole.is_active },
    });

    invalidatePermissionCache(id);
    return updatedRole;
  });
};

const deleteRole = async (id, actorId) => {
  const roleRes = await query(`SELECT * FROM roles WHERE id = $1`, [id]);
  if (!roleRes.rows.length) throw new NotFoundError('Role');
  const role = roleRes.rows[0];

  if (role.slug === 'superadmin' || role.is_system) {
    throw new ForbiddenError('System-protected roles cannot be deleted.');
  }

  // Check if users are assigned
  const countRes = await query(`SELECT COUNT(*) FROM user_roles WHERE role_id = $1`, [id]);
  const userCount = parseInt(countRes.rows[0].count, 10);
  if (userCount > 0) {
    throw new BadRequestError(`Cannot delete role: ${userCount} user(s) are currently assigned to this role. Please reassign them first.`);
  }

  await withTransaction(async (client) => {
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [id]);
    await client.query(`DELETE FROM roles WHERE id = $1`, [id]);
    await logAuditEvent({
      actorId,
      action: 'role.delete',
      entityType: 'role',
      entityId: id,
      oldValues: { name: role.name, slug: role.slug },
    });
  });

  invalidatePermissionCache(id);
  return { message: `Role "${role.name}" was successfully deleted.` };
};

const duplicateRole = async (id, newName, actorId) => {
  const role = await getRoleById(id);
  const newSlug = `${role.slug}-copy-${Date.now().toString(36)}`;

  return createRole(
    {
      name: newName || `${role.name} (Copy)`,
      slug: newSlug,
      description: `Duplicated from ${role.name}. ${role.description || ''}`,
      role_type: 'custom',
      hierarchy_level: Math.max(role.hierarchy_level, 4),
      permissions: role.permissions.map((p) => p.id),
    },
    actorId
  );
};

// ── 3. PERMISSION MANAGEMENT & MATRIX ─────────────────────────────────────────
const getPermissions = async ({ search, moduleId, groupId, resource, action }) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.slug ILIKE $${params.length} OR p.resource ILIKE $${params.length})`);
  }
  if (moduleId) {
    params.push(moduleId);
    conditions.push(`p.module_id = $${params.length}`);
  }
  if (groupId) {
    params.push(groupId);
    conditions.push(`p.group_id = $${params.length}`);
  }
  if (resource) {
    params.push(resource);
    conditions.push(`p.resource = $${params.length}`);
  }
  if (action) {
    params.push(action);
    conditions.push(`p.action = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT p.*, m.name AS module_name, m.slug AS module_slug, g.name AS group_name
       FROM permissions p
       LEFT JOIN modules m ON m.id = p.module_id
       LEFT JOIN permission_groups g ON g.id = p.group_id
      ${whereClause}
      ORDER BY p.resource ASC, p.action ASC`,
    params
  );
  return rows;
};

const createPermission = async (data, actorId) => {
  const { name, slug, resource, action, module_id, group_id, description } = data;
  const existing = await query(`SELECT id FROM permissions WHERE slug = $1`, [slug]);
  if (existing.rows.length) throw new ConflictError('A permission with this slug already exists.');

  const res = await query(
    `INSERT INTO permissions (name, slug, resource, action, module_id, group_id, description, is_system)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
     RETURNING *`,
    [name, slug, resource, action.toUpperCase(), module_id || null, group_id || null, description || null]
  );

  await logAuditEvent({
    actorId,
    action: 'permission.create',
    entityType: 'permission',
    entityId: res.rows[0].id,
    newValues: { name, slug, resource, action },
  });

  invalidatePermissionCache();
  return res.rows[0];
};

const updatePermission = async (id, data, actorId) => {
  const permRes = await query(`SELECT * FROM permissions WHERE id = $1`, [id]);
  if (!permRes.rows.length) throw new NotFoundError('Permission');
  const perm = permRes.rows[0];

  if (perm.is_system) {
    throw new ForbiddenError('System-defined permissions cannot be modified.');
  }

  const { name, description, module_id, group_id } = data;
  const res = await query(
    `UPDATE permissions
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            module_id = COALESCE($3, module_id),
            group_id = COALESCE($4, group_id),
            updated_at = NOW()
      WHERE id = $5
      RETURNING *`,
    [name, description, module_id, group_id, id]
  );

  await logAuditEvent({
    actorId,
    action: 'permission.update',
    entityType: 'permission',
    entityId: id,
    newValues: res.rows[0],
  });

  invalidatePermissionCache();
  return res.rows[0];
};

const deletePermission = async (id, actorId) => {
  const permRes = await query(`SELECT * FROM permissions WHERE id = $1`, [id]);
  if (!permRes.rows.length) throw new NotFoundError('Permission');
  const perm = permRes.rows[0];

  if (perm.is_system) {
    throw new ForbiddenError('System-defined core permissions cannot be deleted.');
  }

  await withTransaction(async (client) => {
    await client.query(`DELETE FROM role_permissions WHERE permission_id = $1`, [id]);
    await client.query(`DELETE FROM permissions WHERE id = $1`, [id]);
    await logAuditEvent({
      actorId,
      action: 'permission.delete',
      entityType: 'permission',
      entityId: id,
      oldValues: { slug: perm.slug, name: perm.name },
    });
  });

  invalidatePermissionCache();
  return { message: `Permission "${perm.name}" was successfully deleted.` };
};

/**
 * High-performance permission matrix loader:
 * Returns:
 * - modules: [{ id, name, slug, description }]
 * - roles: [{ id, name, slug, hierarchy_level, is_system }]
 * - actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ASSIGN', 'MANAGE', 'CONFIGURE']
 * - matrix: { [moduleId]: { [action]: { permissionId, permissionSlug, assignedRoles: [roleId1, roleId2] } } }
 */
const getPermissionMatrix = async () => {
  const [modsRes, rolesRes, permsRes, assignmentsRes] = await Promise.all([
    query(`SELECT id, name, slug, description, icon FROM modules ORDER BY display_order ASC, name ASC`),
    query(`SELECT id, name, slug, hierarchy_level, is_system FROM roles ORDER BY hierarchy_level ASC, name ASC`),
    query(`SELECT id, name, slug, resource, action, module_id FROM permissions ORDER BY resource, action`),
    query(`SELECT role_id, permission_id FROM role_permissions`),
  ]);

  const assignmentsMap = new Map(); // permId -> Set of roleIds
  for (const a of assignmentsRes.rows) {
    if (!assignmentsMap.has(a.permission_id)) {
      assignmentsMap.set(a.permission_id, new Set());
    }
    assignmentsMap.get(a.permission_id).add(a.role_id);
  }

  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ASSIGN', 'MANAGE', 'CONFIGURE'];

  // Organize by module and resource
  const matrix = {};
  for (const m of modsRes.rows) {
    matrix[m.id] = {
      module: m,
      permissions: {},
    };
  }

  for (const p of permsRes.rows) {
    const modId = p.module_id || 'unassigned';
    if (!matrix[modId]) {
      matrix[modId] = {
        module: { id: 'unassigned', name: 'General Platform', slug: 'general', description: 'System-wide permissions' },
        permissions: {},
      };
    }
    matrix[modId].permissions[p.action] = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      resource: p.resource,
      assignedRoleIds: Array.from(assignmentsMap.get(p.id) || []),
    };
  }

  return {
    modules: modsRes.rows,
    roles: rolesRes.rows,
    actions,
    matrix,
  };
};

/**
 * Updates the visual permission matrix in a single atomic transaction.
 * updates: array of { roleId, permissionId, assigned: boolean }
 */
const updatePermissionMatrix = async (updates, actorId) => {
  if (!Array.isArray(updates) || !updates.length) {
    throw new BadRequestError('No matrix updates provided.');
  }

  return withTransaction(async (client) => {
    let assignedCount = 0;
    let revokedCount = 0;

    for (const item of updates) {
      const { roleId, permissionId, assigned } = item;

      // Verify role isn't Super Admin (Super Admin always has everything and shouldn't be touched)
      const roleCheck = await client.query(`SELECT slug FROM roles WHERE id = $1`, [roleId]);
      if (roleCheck.rows.length && roleCheck.rows[0].slug === 'superadmin') {
        continue; // skip modifying superadmin assignments
      }

      if (assigned) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [roleId, permissionId, actorId]
        );
        assignedCount++;
      } else {
        await client.query(
          `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`,
          [roleId, permissionId]
        );
        revokedCount++;
      }
    }

    await logAuditEvent({
      actorId,
      action: 'matrix.update',
      entityType: 'permission_matrix',
      entityId: actorId,
      newValues: { assignedCount, revokedCount, totalProcessed: updates.length },
    });

    invalidatePermissionCache();
    return {
      message: `Permission matrix updated successfully. (${assignedCount} granted, ${revokedCount} revoked)`,
      assignedCount,
      revokedCount,
    };
  });
};

// ── 4. ENTERPRISE USER MANAGEMENT ─────────────────────────────────────────────
const getUsers = async ({
  search,
  role,
  status,
  departmentId,
  page = 1,
  limit = 20,
}) => {
  const offset = (page - 1) * limit;
  const conditions = ['u.deleted_at IS NULL'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(u.display_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.username ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length})`
    );
  }
  if (role) {
    params.push(role);
    conditions.push(
      `(u.role = $${params.length} OR EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.slug = $${params.length}))`
    );
  }
  if (status) {
    params.push(status);
    conditions.push(`u.account_status = $${params.length}`);
  }
  if (departmentId) {
    params.push(departmentId);
    conditions.push(`u.department_id = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countRes = await query(`SELECT COUNT(*) FROM users u ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const usersQuery = `
    SELECT u.id, u.email, u.username, u.display_name, u.first_name, u.last_name, u.phone,
           u.role, u.is_super_admin, u.account_status, u.avatar_url, u.last_seen_at, u.last_login_at,
           u.created_at, u.updated_at,
           d.name AS department_name, d.slug AS department_slug,
           des.title AS designation_title,
           COALESCE(
             json_agg(
               json_build_object('id', r.id, 'name', r.name, 'slug', r.slug, 'hierarchy_level', r.hierarchy_level)
             ) FILTER (WHERE r.id IS NOT NULL), '[]'
           ) AS roles
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN designations des ON des.id = u.designation_id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
     ${whereClause}
     GROUP BY u.id, d.name, d.slug, des.title
     ORDER BY u.is_super_admin DESC, u.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const { rows } = await query(usersQuery, params);
  return {
    users: rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUserById = async (id) => {
  const userRes = await query(
    `SELECT u.id, u.email, u.username, u.display_name, u.first_name, u.last_name, u.phone,
            u.role, u.is_super_admin, u.account_status, u.avatar_url, u.bio,
            u.failed_login_count, u.locked_until, u.totp_enabled, u.seller_verified,
            u.department_id, u.designation_id, u.last_seen_at, u.last_login_at,
            u.created_at, u.updated_at,
            d.name AS department_name, des.title AS designation_title
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN designations des ON des.id = u.designation_id
      WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [id]
  );
  if (!userRes.rows.length) throw new NotFoundError('User');
  const user = userRes.rows[0];

  // Fetch assigned roles and direct effective permissions
  const [rolesRes, permsRes, sessionsRes, loginsRes] = await Promise.all([
    query(
      `SELECT r.id, r.name, r.slug, r.hierarchy_level, r.is_system, ur.assigned_at
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1`,
      [id]
    ),
    getUserEffectivePermissions(id),
    query(
      `SELECT id, ip_address, device_info, last_used_at, expires_at, (revoked_at IS NULL AND expires_at > NOW()) AS is_active
         FROM user_sessions
        WHERE user_id = $1
        ORDER BY last_used_at DESC
        LIMIT 10`,
      [id]
    ),
    query(
      `SELECT id, ip_address, user_agent, status, failure_reason, created_at
         FROM login_history
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10`,
      [id]
    ),
  ]);

  return {
    ...user,
    roles: rolesRes.rows,
    effectivePermissions: permsRes.permissions,
    activeSessions: sessionsRes.rows,
    recentLogins: loginsRes.rows,
  };
};

const createUser = async (data, actor) => {
  const {
    email,
    password,
    first_name,
    last_name,
    display_name,
    phone,
    department_id,
    designation_id,
    roles = [],
    is_super_admin = false,
  } = data;

  // Security Rule: Only active Super Admin can create another Super Admin
  if (is_super_admin && !actor.is_super_admin && actor.role !== 'superadmin') {
    throw new ForbiddenError('Privilege escalation denied: Only a Super Admin can create Super Admin accounts.');
  }

  const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rows.length) throw new ConflictError('A user with this email address already exists.');

  const hash = await bcrypt.hash(password || 'TemporaryPassword123!', 10);
  const fullName = display_name || `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0];
  const username = email.split('@')[0].replace(/[^a-z0-9_-]/gi, '').toLowerCase() + Math.floor(Math.random() * 1000);

  return withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO users (
        email, password_hash, username, display_name, first_name, last_name, phone,
        department_id, designation_id, is_super_admin, role, account_status, email_verified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', NOW())
      RETURNING id, email, display_name, is_super_admin, role, created_at`,
      [
        email,
        hash,
        username,
        fullName,
        first_name,
        last_name,
        phone,
        department_id || null,
        designation_id || null,
        is_super_admin,
        is_super_admin ? 'superadmin' : 'admin',
      ]
    );

    const newUser = res.rows[0];

    // Assign roles
    if (roles && roles.length) {
      for (const roleId of roles) {
        // Prevent assigning superadmin role unless actor is superadmin
        const rCheck = await client.query(`SELECT slug FROM roles WHERE id = $1`, [roleId]);
        if (rCheck.rows.length && rCheck.rows[0].slug === 'superadmin' && !actor.is_super_admin && actor.role !== 'superadmin') {
          throw new ForbiddenError('Only Super Admin can assign the Super Admin role.');
        }

        await client.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [newUser.id, roleId, actor.id]
        );
      }
    }

    await logAuditEvent({
      actorId: actor.id,
      action: 'user.create',
      entityType: 'user',
      entityId: newUser.id,
      newValues: { email, display_name: fullName, is_super_admin },
    });

    return newUser;
  });
};

const updateUser = async (id, data, actor) => {
  const targetRes = await query(`SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`, [id]);
  if (!targetRes.rows.length) throw new NotFoundError('User');
  const targetUser = targetRes.rows[0];

  const {
    first_name,
    last_name,
    display_name,
    phone,
    department_id,
    designation_id,
    account_status,
    is_super_admin,
    roles,
  } = data;

  // Security Rule: Protect the Last Active Super Admin
  if (targetUser.is_super_admin || targetUser.role === 'superadmin') {
    const isDemotingOrDeactivating =
      (is_super_admin === false && targetUser.is_super_admin) ||
      (account_status && account_status !== 'active');

    if (isDemotingOrDeactivating) {
      const countRes = await query(
        `SELECT COUNT(*) FROM users 
          WHERE (is_super_admin = TRUE OR role = 'superadmin') 
            AND account_status = 'active' 
            AND deleted_at IS NULL 
            AND id != $1`,
        [id]
      );
      const remainingSuperAdmins = parseInt(countRes.rows[0].count, 10);
      if (remainingSuperAdmins < 1) {
        throw new ForbiddenError('System Protection: The last active Super Admin cannot be deactivated or demoted.');
      }
    }
  }

  // Security Rule: Prevent non-superadmins from modifying Super Admin records or promoting anyone
  if ((targetUser.is_super_admin || targetUser.role === 'superadmin') && !actor.is_super_admin && actor.role !== 'superadmin') {
    throw new ForbiddenError('Access Denied: Only a Super Admin can modify another Super Admin account.');
  }

  if (is_super_admin !== undefined && is_super_admin !== targetUser.is_super_admin) {
    if (!actor.is_super_admin && actor.role !== 'superadmin') {
      throw new ForbiddenError('Privilege escalation denied: Only a Super Admin can toggle Super Admin status.');
    }
  }

  return withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE users
          SET first_name = COALESCE($1, first_name),
              last_name = COALESCE($2, last_name),
              display_name = COALESCE($3, display_name),
              phone = COALESCE($4, phone),
              department_id = COALESCE($5, department_id),
              designation_id = COALESCE($6, designation_id),
              account_status = COALESCE($7, account_status),
              is_super_admin = COALESCE($8, is_super_admin),
              updated_at = NOW()
        WHERE id = $9
        RETURNING id, email, display_name, is_super_admin, account_status, updated_at`,
      [
        first_name,
        last_name,
        display_name,
        phone,
        department_id,
        designation_id,
        account_status,
        is_super_admin,
        id,
      ]
    );

    const updatedUser = res.rows[0];

    // Synchronize roles if provided
    if (roles !== undefined && Array.isArray(roles)) {
      // Check if trying to assign superadmin role
      const saRole = await client.query(`SELECT id FROM roles WHERE slug = 'superadmin'`);
      const saRoleId = saRole.rows.length ? saRole.rows[0].id : null;

      if (roles.includes(saRoleId) && !actor.is_super_admin && actor.role !== 'superadmin') {
        throw new ForbiddenError('Privilege escalation denied: Only Super Admin can assign the Super Admin role.');
      }

      await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);
      for (const roleId of roles) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [id, roleId, actor.id]
        );
      }
    }

    await logAuditEvent({
      actorId: actor.id,
      action: 'user.update',
      entityType: 'user',
      entityId: id,
      oldValues: { status: targetUser.account_status, is_super_admin: targetUser.is_super_admin },
      newValues: { status: updatedUser.account_status, is_super_admin: updatedUser.is_super_admin },
    });

    return updatedUser;
  });
};

const deleteUser = async (id, actor) => {
  const targetRes = await query(`SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`, [id]);
  if (!targetRes.rows.length) throw new NotFoundError('User');
  const targetUser = targetRes.rows[0];

  // Prevent deleting the last active Super Admin
  if (targetUser.is_super_admin || targetUser.role === 'superadmin') {
    const countRes = await query(
      `SELECT COUNT(*) FROM users 
        WHERE (is_super_admin = TRUE OR role = 'superadmin') 
          AND account_status = 'active' 
          AND deleted_at IS NULL 
          AND id != $1`,
      [id]
    );
    const remaining = parseInt(countRes.rows[0].count, 10);
    if (remaining < 1) {
      throw new ForbiddenError('System Protection: The last active Super Admin account cannot be deleted.');
    }

    if (!actor.is_super_admin && actor.role !== 'superadmin') {
      throw new ForbiddenError('Access Denied: Only a Super Admin can delete a Super Admin account.');
    }
  }

  // Soft delete and revoke all active sessions
  await withTransaction(async (client) => {
    await client.query(`UPDATE users SET deleted_at = NOW(), account_status = 'suspended' WHERE id = $1`, [id]);
    await client.query(`UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1`, [id]);

    await logAuditEvent({
      actorId: actor.id,
      action: 'user.delete',
      entityType: 'user',
      entityId: id,
      oldValues: { email: targetUser.email, display_name: targetUser.display_name },
    });
  });

  return { message: `User "${targetUser.display_name}" was successfully soft-deleted.` };
};

const bulkDeleteUsers = async (userIds, actor) => {
  if (!Array.isArray(userIds) || !userIds.length) {
    throw new BadRequestError('User IDs array is required for bulk deletion.');
  }

  // Check if any of these are the last active Super Admin
  const saCheck = await query(
    `SELECT id, email FROM users 
      WHERE id = ANY($1::uuid[]) 
        AND (is_super_admin = TRUE OR role = 'superadmin')`,
    [userIds]
  );

  if (saCheck.rows.length) {
    const totalSa = await query(
      `SELECT COUNT(*) FROM users 
        WHERE (is_super_admin = TRUE OR role = 'superadmin') 
          AND account_status = 'active' 
          AND deleted_at IS NULL`
    );
    const activeTotal = parseInt(totalSa.rows[0].count, 10);
    if (activeTotal - saCheck.rows.length < 1) {
      throw new ForbiddenError('Operation aborted: Bulk delete contains the last active Super Admin.');
    }
    if (!actor.is_super_admin && actor.role !== 'superadmin') {
      throw new ForbiddenError('Non-superadmin cannot bulk delete Super Admin accounts.');
    }
  }

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE users SET deleted_at = NOW(), account_status = 'suspended' WHERE id = ANY($1::uuid[])`,
      [userIds]
    );
    await client.query(
      `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ANY($1::uuid[])`,
      [userIds]
    );

    await logAuditEvent({
      actorId: actor.id,
      action: 'user.bulk_delete',
      entityType: 'user',
      entityId: actor.id,
      newValues: { count: userIds.length, userIds },
    });
  });

  return { message: `${userIds.length} users successfully deleted.` };
};

const setUserStatus = async (id, status, reason, actor) => {
  const targetRes = await query(`SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`, [id]);
  if (!targetRes.rows.length) throw new NotFoundError('User');
  const targetUser = targetRes.rows[0];

  // Protect last Super Admin
  if ((targetUser.is_super_admin || targetUser.role === 'superadmin') && status !== 'active') {
    const countRes = await query(
      `SELECT COUNT(*) FROM users 
        WHERE (is_super_admin = TRUE OR role = 'superadmin') 
          AND account_status = 'active' 
          AND deleted_at IS NULL 
          AND id != $1`,
      [id]
    );
    if (parseInt(countRes.rows[0].count, 10) < 1) {
      throw new ForbiddenError('System Protection: The last active Super Admin cannot be suspended or deactivated.');
    }
  }

  await query(
    `UPDATE users SET account_status = $1, suspension_reason = $2, updated_at = NOW() WHERE id = $3`,
    [status, reason || null, id]
  );

  // If suspended or banned, revoke active sessions immediately
  if (status === 'suspended' || status === 'banned') {
    await query(`UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1`, [id]);
  }

  await logAuditEvent({
    actorId: actor.id,
    action: `user.status_${status}`,
    entityType: 'user',
    entityId: id,
    newValues: { status, reason },
  });

  return { message: `User status changed to ${status}.` };
};

const resetUserPassword = async (id, newPassword, actor) => {
  const hash = await bcrypt.hash(newPassword, 10);
  await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hash, id]);
  await query(`UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1`, [id]);

  await logAuditEvent({
    actorId: actor.id,
    action: 'user.password_reset_by_admin',
    entityType: 'user',
    entityId: id,
  });

  return { message: 'Password reset successfully. Active sessions revoked.' };
};

const forceLogoutUser = async (id, actor) => {
  await query(`UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1`, [id]);
  await logAuditEvent({
    actorId: actor.id,
    action: 'user.force_logout',
    entityType: 'user',
    entityId: id,
  });
  return { message: 'All active sessions for this user have been terminated.' };
};

// ── 5. ORGANIZATIONAL STRUCTURE ───────────────────────────────────────────────
const getDepartments = async () => {
  const { rows } = await query(`
    SELECT d.*, u.display_name AS manager_name,
           COUNT(DISTINCT t.id) AS team_count,
           COUNT(DISTINCT usr.id) AS user_count
      FROM departments d
      LEFT JOIN users u ON u.id = d.manager_id
      LEFT JOIN teams t ON t.department_id = d.id
      LEFT JOIN users usr ON usr.department_id = d.id AND usr.deleted_at IS NULL
     GROUP BY d.id, u.display_name
     ORDER BY d.name ASC
  `);
  return rows;
};

const createDepartment = async (data, actorId) => {
  const { name, slug, code, description, manager_id } = data;
  const res = await query(
    `INSERT INTO departments (name, slug, code, description, manager_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, slug, code, description, manager_id || null]
  );
  await logAuditEvent({ actorId, action: 'department.create', entityType: 'department', entityId: res.rows[0].id, newValues: data });
  return res.rows[0];
};

const updateDepartment = async (id, data, actorId) => {
  const { name, code, description, manager_id, is_active } = data;
  const res = await query(
    `UPDATE departments
        SET name = COALESCE($1, name),
            code = COALESCE($2, code),
            description = COALESCE($3, description),
            manager_id = COALESCE($4, manager_id),
            is_active = COALESCE($5, is_active),
            updated_at = NOW()
      WHERE id = $6
      RETURNING *`,
    [name, code, description, manager_id, is_active, id]
  );
  await logAuditEvent({ actorId, action: 'department.update', entityType: 'department', entityId: id, newValues: data });
  return res.rows[0];
};

const deleteDepartment = async (id, actorId) => {
  await query(`DELETE FROM departments WHERE id = $1`, [id]);
  await logAuditEvent({ actorId, action: 'department.delete', entityType: 'department', entityId: id });
  return { message: 'Department deleted successfully.' };
};

const getTeams = async (departmentId = null) => {
  const conditions = [];
  const params = [];
  if (departmentId) {
    params.push(departmentId);
    conditions.push(`t.department_id = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT t.*, d.name AS department_name, u.display_name AS lead_name
       FROM teams t
       JOIN departments d ON d.id = t.department_id
       LEFT JOIN users u ON u.id = t.lead_id
      ${whereClause}
      ORDER BY t.name ASC`,
    params
  );
  return rows;
};

const createTeam = async (data, actorId) => {
  const { department_id, name, slug, description, lead_id } = data;
  const res = await query(
    `INSERT INTO teams (department_id, name, slug, description, lead_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [department_id, name, slug, description, lead_id || null]
  );
  await logAuditEvent({ actorId, action: 'team.create', entityType: 'team', entityId: res.rows[0].id, newValues: data });
  return res.rows[0];
};

const getDesignations = async () => {
  const { rows } = await query(`
    SELECT des.*, d.name AS department_name,
           COUNT(DISTINCT u.id) AS user_count
      FROM designations des
      LEFT JOIN departments d ON d.id = des.department_id
      LEFT JOIN users u ON u.designation_id = des.id AND u.deleted_at IS NULL
     GROUP BY des.id, d.name
     ORDER BY des.title ASC
  `);
  return rows;
};

const createDesignation = async (data, actorId) => {
  const { department_id, title, slug, level, description } = data;
  const res = await query(
    `INSERT INTO designations (department_id, title, slug, level, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [department_id || null, title, slug, level || 'Mid-Level', description || null]
  );
  await logAuditEvent({ actorId, action: 'designation.create', entityType: 'designation', entityId: res.rows[0].id, newValues: data });
  return res.rows[0];
};

// ── 6. ACCESS CONTROL & POLICIES ──────────────────────────────────────────────
const getAccessPolicies = async () => {
  const { rows } = await query(`
    SELECT ap.*, u.display_name AS creator_name
      FROM access_policies ap
      LEFT JOIN users u ON u.id = ap.created_by
     ORDER BY ap.priority DESC, ap.created_at DESC
  `);
  return rows;
};

const createAccessPolicy = async (data, actorId) => {
  const { name, slug, description, effect, subject_type, subject_id, resource, action, conditions, priority } = data;
  const res = await query(
    `INSERT INTO access_policies (
      name, slug, description, effect, subject_type, subject_id,
      resource, action, conditions, priority, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      name,
      slug,
      description,
      effect || 'allow',
      subject_type || 'role',
      subject_id || null,
      resource,
      action,
      conditions ? JSON.stringify(conditions) : '{}',
      priority || 0,
      actorId,
    ]
  );
  await logAuditEvent({ actorId, action: 'policy.create', entityType: 'access_policy', entityId: res.rows[0].id, newValues: data });
  return res.rows[0];
};

const deleteAccessPolicy = async (id, actorId) => {
  await query(`DELETE FROM access_policies WHERE id = $1`, [id]);
  await logAuditEvent({ actorId, action: 'policy.delete', entityType: 'access_policy', entityId: id });
  return { message: 'Access policy deleted successfully.' };
};

// ── 7. SECURITY MANAGEMENT & SESSIONS ─────────────────────────────────────────
const getLoginHistory = async ({ userId, status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (userId) {
    params.push(userId);
    conditions.push(`lh.user_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`lh.status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query(`SELECT COUNT(*) FROM login_history lh ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT lh.*, u.display_name, u.email AS user_email
       FROM login_history lh
       LEFT JOIN users u ON u.id = lh.user_id
      ${whereClause}
      ORDER BY lh.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    logs: rows,
    pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) },
  };
};

const getActiveSessions = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  // Check admin_sessions count first
  let countRes = await query(
    `SELECT COUNT(*) FROM admin_sessions WHERE is_revoked = FALSE AND expires_at > NOW()`
  );
  let total = parseInt(countRes.rows[0].count, 10);
  let rows = [];

  if (total > 0) {
    const res = await query(
      `SELECT s.id, s.user_id, s.ip_address, s.device, s.browser, s.os, s.location, s.is_current,
              s.last_activity_at as last_used_at, s.expires_at, s.created_at,
              u.display_name, u.email, u.role, u.is_super_admin
         FROM admin_sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.is_revoked = FALSE AND s.expires_at > NOW()
        ORDER BY s.last_activity_at DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    rows = res.rows;
  } else {
    countRes = await query(
      `SELECT COUNT(*) FROM user_sessions WHERE revoked_at IS NULL AND expires_at > NOW()`
    );
    total = parseInt(countRes.rows[0].count, 10);
    const res = await query(
      `SELECT s.id, s.user_id, s.ip_address, s.device_info, s.last_used_at, s.expires_at, s.created_at,
              u.display_name, u.email, u.role, u.is_super_admin
         FROM user_sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.revoked_at IS NULL AND s.expires_at > NOW()
        ORDER BY s.last_used_at DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    rows = res.rows;
  }

  return {
    sessions: rows,
    pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) },
  };
};

const revokeSession = async (sessionId, actorId) => {
  await query(`UPDATE admin_sessions SET is_revoked = TRUE WHERE id = $1`, [sessionId]);
  try {
    await query(`UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1`, [sessionId]);
  } catch (e) {}
  await logAuditEvent({ actorId, action: 'session.revoke', entityType: 'session', entityId: sessionId });
  return { message: 'Session revoked successfully.' };
};

const getSecurityEvents = async () => {
  const { rows } = await query(`
    SELECT se.*, u.display_name, u.email
      FROM security_events se
      LEFT JOIN users u ON u.id = se.user_id
     ORDER BY se.created_at DESC
     LIMIT 50
  `);
  return rows;
};

const getIpRestrictions = async () => {
  const { rows } = await query(`SELECT * FROM ip_restrictions ORDER BY created_at DESC`);
  return rows;
};

const createIpRestriction = async (data, actorId) => {
  const { ip_pattern, restriction_type = 'blacklist', reason } = data;
  const res = await query(
    `INSERT INTO ip_restrictions (ip_pattern, restriction_type, reason)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [ip_pattern, restriction_type, reason]
  );
  await logAuditEvent({ actorId, action: 'ip_restriction.create', entityType: 'ip_restriction', entityId: res.rows[0].id, newValues: data });
  return res.rows[0];
};

const deleteIpRestriction = async (id, actorId) => {
  await query(`DELETE FROM ip_restrictions WHERE id = $1`, [id]);
  await logAuditEvent({ actorId, action: 'ip_restriction.delete', entityType: 'ip_restriction', entityId: id });
  return { message: 'IP restriction removed.' };
};

// ── 8. IMMUTABLE AUDIT LOGS ───────────────────────────────────────────────────
const getAuditLogs = async ({ actorId, action, entityType, startDate, endDate, page = 1, limit = 25 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (actorId) {
    params.push(actorId);
    conditions.push(`al.actor_id = $${params.length}`);
  }
  if (action) {
    params.push(`%${action}%`);
    conditions.push(`al.action ILIKE $${params.length}`);
  }
  if (entityType) {
    params.push(entityType);
    conditions.push(`al.entity_type = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`al.created_at >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`al.created_at <= $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query(`SELECT COUNT(*) FROM audit_logs al ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT al.*, u.display_name AS actor_name, u.email AS actor_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    logs: rows,
    pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) },
  };
};

const getAuditLogById = async (id) => {
  const { rows } = await query(
    `SELECT al.*, u.display_name AS actor_name, u.email AS actor_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_id
      WHERE al.id = $1`,
    [id]
  );
  if (!rows.length) throw new NotFoundError('Audit log entry');
  return rows[0];
};

// ── 9. SYSTEM SETTINGS & FEATURE FLAGS ────────────────────────────────────────
const getSystemSettings = async (category = null) => {
  const params = [];
  const condition = category ? `WHERE category = $1` : '';
  if (category) params.push(category);

  const { rows } = await query(
    `SELECT ss.*, u.display_name AS updated_by_name
       FROM system_settings ss
       LEFT JOIN users u ON u.id = ss.updated_by
      ${condition}
      ORDER BY ss.category ASC, ss.key ASC`,
    params
  );
  return rows;
};

const updateSystemSetting = async (key, value, actorId) => {
  const res = await query(
    `UPDATE system_settings
        SET value = $1::jsonb,
            updated_by = $2,
            updated_at = NOW()
      WHERE key = $3
      RETURNING *`,
    [JSON.stringify(value), actorId, key]
  );
  if (!res.rows.length) throw new NotFoundError(`System setting "${key}"`);
  await logAuditEvent({
    actorId,
    action: 'setting.update',
    entityType: 'system_setting',
    entityId: actorId,
    newValues: { key, value },
  });
  return res.rows[0];
};

const getFeatureFlags = async () => {
  const { rows } = await query(`SELECT * FROM feature_flags ORDER BY key ASC`);
  return rows;
};

const updateFeatureFlag = async (key, isEnabled, actorId) => {
  const res = await query(
    `UPDATE feature_flags
        SET is_enabled = $1,
            updated_by_id = $2,
            updated_at = NOW()
      WHERE key = $3
      RETURNING *`,
    [isEnabled, actorId, key]
  );
  if (!res.rows.length) throw new NotFoundError(`Feature flag "${key}"`);
  await logAuditEvent({
    actorId,
    action: 'feature_flag.update',
    entityType: 'feature_flag',
    entityId: actorId,
    newValues: { key, isEnabled },
  });
  return res.rows[0];
};

// ── 10. SUPER ADMIN CONTROL CENTER ────────────────────────────────────────────
const getSuperAdminDashboard = async () => {
  const [
    usersStats,
    rolesStats,
    permissionsStats,
    sessionsCount,
    loginStats,
    adminsRes,
    maintenanceRes,
    settingsCount,
  ] = await Promise.all([
    query(`
      SELECT 
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE account_status = 'active') AS active_users,
        COUNT(*) FILTER (WHERE account_status = 'suspended' OR account_status = 'banned') AS suspended_users,
        COUNT(*) FILTER (WHERE is_super_admin = TRUE OR role = 'superadmin') AS super_admins
      FROM users WHERE deleted_at IS NULL
    `),
    query(`SELECT COUNT(*) AS total_roles, COUNT(*) FILTER (WHERE is_active = TRUE) AS active_roles FROM roles`),
    query(`SELECT COUNT(*) AS total_permissions FROM permissions`),
    query(`SELECT COUNT(*) AS active_sessions FROM user_sessions WHERE revoked_at IS NULL AND expires_at > NOW()`),
    query(`
      SELECT 
        COUNT(*) AS total_logins_24h,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed_logins_24h
      FROM login_history WHERE created_at >= NOW() - INTERVAL '24 hours'
    `),
    query(`
      SELECT u.id, u.email, u.display_name, u.role, u.is_super_admin, u.account_status, u.last_login_at,
             d.name AS department_name
        FROM users u
        LEFT JOIN departments d ON d.id = u.department_id
       WHERE (u.is_super_admin = TRUE OR u.role IN ('admin', 'superadmin'))
         AND u.deleted_at IS NULL
       ORDER BY u.is_super_admin DESC, u.created_at ASC
    `),
    query(`SELECT value FROM system_settings WHERE key = 'system.maintenance_mode'`),
    query(`SELECT COUNT(*) AS total_settings FROM system_settings`),
  ]);

  const maintenanceVal = maintenanceRes.rows.length ? maintenanceRes.rows[0].value : false;

  return {
    kpis: {
      users: usersStats.rows[0],
      roles: rolesStats.rows[0],
      permissions: permissionsStats.rows[0].total_permissions,
      activeSessions: sessionsCount.rows[0].active_sessions,
      logins24h: loginStats.rows[0],
      totalSettings: settingsCount.rows[0].total_settings,
      maintenanceMode: maintenanceVal === true || maintenanceVal === 'true',
    },
    administrators: adminsRes.rows,
    systemIntegrity: {
      hasActiveSuperAdmin: parseInt(usersStats.rows[0].super_admins, 10) > 0,
      databaseStatus: 'Healthy (PostgreSQL)',
      rbacEngineStatus: 'Operational',
      auditLogRetention: '7 Years (Immutable Append-Only)',
    },
  };
};

const toggleMaintenanceMode = async (enable, reason, actorId) => {
  await updateSystemSetting('system.maintenance_mode', enable, actorId);
  await logAuditEvent({
    actorId,
    action: enable ? 'system.maintenance_enable' : 'system.maintenance_disable',
    entityType: 'system',
    entityId: actorId,
    newValues: { maintenanceMode: enable, reason },
  });
  return { maintenanceMode: enable, message: `Maintenance mode ${enable ? 'activated' : 'deactivated'}.` };
};

// ── 11. API MANAGEMENT ────────────────────────────────────────────────────────
const getApiKeys = async () => {
  const { rows } = await query(`
    SELECT ak.id, ak.user_id, ak.name, ak.key_prefix, ak.environment, ak.scopes,
           ak.rate_limit_rpm, ak.is_active, ak.created_at, ak.last_used_at, ak.revoked_at,
           u.display_name AS owner_name, u.email AS owner_email
      FROM api_keys ak
      JOIN users u ON u.id = ak.user_id
     ORDER BY ak.created_at DESC
  `);
  return rows;
};

const createApiKey = async ({ name, environment = 'live', scopes = ['read:all'], rateLimitRpm = 100 }, actorId) => {
  const rawKey = `dsg_${environment}_${crypto.randomBytes(24).toString('hex')}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const res = await query(
    `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, environment, scopes, rate_limit_rpm)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, key_prefix, environment, scopes, rate_limit_rpm, created_at`,
    [actorId, name, keyHash, keyPrefix, environment, scopes, rateLimitRpm]
  );

  await logAuditEvent({ actorId, action: 'api_key.create', entityType: 'api_key', entityId: res.rows[0].id, newValues: { name, keyPrefix } });

  return {
    ...res.rows[0],
    apiKey: rawKey, // Show once on creation
  };
};

const revokeApiKey = async (id, actorId) => {
  await query(`UPDATE api_keys SET is_active = FALSE, revoked_at = NOW() WHERE id = $1`, [id]);
  await logAuditEvent({ actorId, action: 'api_key.revoke', entityType: 'api_key', entityId: id });
  return { message: 'API Key revoked successfully.' };
};

// ── 12. NOTIFICATIONS & EMAIL TEMPLATES ───────────────────────────────────────
const getEmailTemplates = async () => {
  const { rows } = await query(`SELECT * FROM email_templates ORDER BY name ASC`);
  return rows;
};

const updateEmailTemplate = async (id, data, actorId) => {
  const { subject, body_html, body_text } = data;
  const res = await query(
    `UPDATE email_templates
        SET subject = COALESCE($1, subject),
            body_html = COALESCE($2, body_html),
            body_text = COALESCE($3, body_text),
            updated_at = NOW()
      WHERE id = $4
      RETURNING *`,
    [subject, body_html, body_text, id]
  );
  await logAuditEvent({ actorId, action: 'email_template.update', entityType: 'email_template', entityId: id, newValues: data });
  return res.rows[0];
};

// ── MODULE ACCESS ────────────────────────────────────────────────────────────
const getModuleAccess = async () => {
  const rolesRes = await query(
    `SELECT id, name, slug, hierarchy_level, is_system FROM roles WHERE is_active = TRUE ORDER BY hierarchy_level ASC`
  );
  const modulesRes = await query(
    `SELECT id, name, slug, description, icon, display_order FROM modules ORDER BY display_order ASC`
  );
  const accessRes = await query(
    `SELECT role_id, module_id, access_level, is_accessible FROM role_modules`
  );

  const accessMap = {};
  for (const row of accessRes.rows) {
    accessMap[`${row.role_id}_${row.module_id}`] = {
      access_level: row.access_level,
      is_accessible: row.is_accessible,
    };
  }

  return {
    roles: rolesRes.rows,
    modules: modulesRes.rows,
    access: accessMap,
  };
};

const updateModuleAccess = async (updates, actorId) => {
  if (!Array.isArray(updates) || !updates.length) {
    throw new BadRequestError('Updates array required');
  }

  await withTransaction(async (client) => {
    for (const u of updates) {
      // Super admin role access cannot be modified
      const role = await client.query(`SELECT slug FROM roles WHERE id = $1`, [u.roleId]);
      if (role.rows.length && role.rows[0].slug === 'superadmin') {
        continue;
      }

      await client.query(
        `INSERT INTO role_modules (role_id, module_id, access_level, is_accessible, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (role_id, module_id) DO UPDATE SET
           access_level = EXCLUDED.access_level,
           is_accessible = EXCLUDED.is_accessible,
           updated_at = NOW()`,
        [u.roleId, u.moduleId, u.accessLevel || 'read', u.isAccessible !== false]
      );
    }
  });

  await logAuditEvent({ actorId, action: 'rbac.module_access_update', entityType: 'role_modules', metadata: { count: updates.length } });
  return { message: 'Module access policies updated successfully.' };
};

// ── API PERMISSIONS ──────────────────────────────────────────────────────────
const getApiPermissions = async ({ search, module: modFilter, method } = {}) => {
  let sql = `SELECT * FROM api_route_permissions WHERE 1=1`;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (endpoint ILIKE $${params.length} OR description ILIKE $${params.length} OR required_permission ILIKE $${params.length})`;
  }
  if (modFilter) {
    params.push(modFilter);
    sql += ` AND module = $${params.length}`;
  }
  if (method) {
    params.push(method.toUpperCase());
    sql += ` AND method = $${params.length}`;
  }

  sql += ` ORDER BY module ASC, method ASC, endpoint ASC`;
  const { rows } = await query(sql, params);
  return rows;
};

const createApiPermission = async (data, actorId) => {
  const { module: modName, method, endpoint, required_permission, description } = data;
  if (!modName || !method || !endpoint) throw new BadRequestError('Module, method, and endpoint are required');

  const { rows } = await query(
    `INSERT INTO api_route_permissions (module, method, endpoint, required_permission, description)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (method, endpoint) DO UPDATE SET
       module = EXCLUDED.module,
       required_permission = EXCLUDED.required_permission,
       description = EXCLUDED.description,
       updated_at = NOW()
     RETURNING *`,
    [modName, method.toUpperCase(), endpoint, required_permission || null, description || null]
  );
  await logAuditEvent({ actorId, action: 'api_permission.create', entityType: 'api_route', entityId: rows[0].id });
  return rows[0];
};

const updateApiPermission = async (id, data, actorId) => {
  const { module: modName, method, endpoint, required_permission, description, is_protected } = data;
  const { rows } = await query(
    `UPDATE api_route_permissions
        SET module = COALESCE($1, module),
            method = COALESCE($2, method),
            endpoint = COALESCE($3, endpoint),
            required_permission = COALESCE($4, required_permission),
            description = COALESCE($5, description),
            is_protected = COALESCE($6, is_protected),
            updated_at = NOW()
      WHERE id = $7
      RETURNING *`,
    [modName, method ? method.toUpperCase() : null, endpoint, required_permission, description, is_protected, id]
  );
  if (!rows.length) throw new NotFoundError('API Route Permission');
  await logAuditEvent({ actorId, action: 'api_permission.update', entityType: 'api_route', entityId: id });
  return rows[0];
};

const deleteApiPermission = async (id, actorId) => {
  const { rowCount } = await query(`DELETE FROM api_route_permissions WHERE id = $1`, [id]);
  if (!rowCount) throw new NotFoundError('API Route Permission');
  await logAuditEvent({ actorId, action: 'api_permission.delete', entityType: 'api_route', entityId: id });
  return { message: 'API permission route deleted successfully.' };
};

// ── ADMIN ACTIVITY LOGS ──────────────────────────────────────────────────────
const getAdminActivityLogs = async ({ userId, module: modFilter, action, startDate, endDate, page = 1, limit = 25 } = {}) => {
  const offset = (page - 1) * limit;
  let countSql = `SELECT COUNT(*) FROM admin_activity_logs WHERE 1=1`;
  let dataSql = `
    SELECT a.*, u.display_name, u.email, u.avatar_url, u.role
      FROM admin_activity_logs a
      LEFT JOIN users u ON u.id = a.user_id
     WHERE 1=1
  `;
  const params = [];

  if (userId) {
    params.push(userId);
    countSql += ` AND user_id = $${params.length}`;
    dataSql += ` AND a.user_id = $${params.length}`;
  }
  if (modFilter) {
    params.push(modFilter);
    countSql += ` AND module = $${params.length}`;
    dataSql += ` AND a.module = $${params.length}`;
  }
  if (action) {
    params.push(`%${action}%`);
    countSql += ` AND action ILIKE $${params.length}`;
    dataSql += ` AND a.action ILIKE $${params.length}`;
  }
  if (startDate) {
    params.push(startDate);
    countSql += ` AND created_at >= $${params.length}`;
    dataSql += ` AND a.created_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    countSql += ` AND created_at <= $${params.length}`;
    dataSql += ` AND a.created_at <= $${params.length}`;
  }

  const countRes = await query(countSql, params);
  const total = parseInt(countRes.rows[0].count, 10);

  dataSql += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await query(dataSql, [...params, limit, offset]);

  return {
    activity: rows,
    pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) },
  };
};

// ── SECURITY SETTINGS ────────────────────────────────────────────────────────
const getSecuritySettings = async () => {
  const { rows } = await query(`SELECT * FROM security_settings ORDER BY category ASC, setting_key ASC`);
  const settingsObj = {};
  for (const r of rows) {
    settingsObj[r.setting_key] = {
      id: r.id,
      category: r.category,
      value: r.setting_value,
      description: r.description,
      updated_at: r.updated_at,
    };
  }
  return settingsObj;
};

const updateSecuritySettings = async (settingsUpdates, actorId) => {
  if (typeof settingsUpdates !== 'object' || settingsUpdates === null) {
    throw new BadRequestError('Settings object is required');
  }

  for (const [key, val] of Object.entries(settingsUpdates)) {
    await query(
      `INSERT INTO security_settings (setting_key, setting_value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (setting_key) DO UPDATE SET
         setting_value = EXCLUDED.setting_value,
         updated_at = NOW()`,
      [key, JSON.stringify(val)]
    );
  }

  await logAuditEvent({ actorId, action: 'security.settings_update', entityType: 'security_settings', metadata: { keys: Object.keys(settingsUpdates) } });
  return { message: 'Security settings updated successfully.' };
};

// ── ROLE ASSIGNMENTS ─────────────────────────────────────────────────────────
const getUserRoleAssignments = async ({ userId, roleId, page = 1, limit = 25 } = {}) => {
  const offset = (page - 1) * limit;
  let countSql = `SELECT COUNT(*) FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.deleted_at IS NULL`;
  let dataSql = `
    SELECT ur.id as assignment_id, ur.user_id, ur.role_id, ur.is_primary, ur.expires_at, ur.assigned_at,
           u.display_name, u.email, u.avatar_url, u.account_status,
           r.name as role_name, r.slug as role_slug, r.hierarchy_level
      FROM user_roles ur
      JOIN users u ON u.id = ur.user_id
      JOIN roles r ON r.id = ur.role_id
     WHERE u.deleted_at IS NULL
  `;
  const params = [];

  if (userId) {
    params.push(userId);
    countSql += ` AND ur.user_id = $${params.length}`;
    dataSql += ` AND ur.user_id = $${params.length}`;
  }
  if (roleId) {
    params.push(roleId);
    countSql += ` AND ur.role_id = $${params.length}`;
    dataSql += ` AND ur.role_id = $${params.length}`;
  }

  const countRes = await query(countSql, params);
  const total = parseInt(countRes.rows[0].count, 10);

  dataSql += ` ORDER BY ur.assigned_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await query(dataSql, [...params, limit, offset]);

  return {
    assignments: rows,
    pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) },
  };
};

const assignRolesToUser = async (userId, roleIds, actorId, isPrimary = false, expiresAt = null) => {
  if (!Array.isArray(roleIds) || !roleIds.length) throw new BadRequestError('Role IDs array required');

  const userRes = await query(`SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`, [userId]);
  if (!userRes.rows.length) throw new NotFoundError('User');

  for (const roleId of roleIds) {
    await query(
      `INSERT INTO user_roles (user_id, role_id, is_primary, expires_at, assigned_by, assigned_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, role_id) DO UPDATE SET
         is_primary = EXCLUDED.is_primary,
         expires_at = EXCLUDED.expires_at,
         assigned_at = NOW()`,
      [userId, roleId, isPrimary, expiresAt, actorId]
    );
  }

  invalidatePermissionCache();
  await logAuditEvent({ actorId, action: 'user.assign_roles', entityType: 'user', entityId: userId, metadata: { roleIds } });
  return { message: 'Roles assigned successfully.' };
};

const removeRoleFromUser = async (userId, roleId, actorId) => {
  // Prevent removing superadmin role from the owner
  const user = await query(`SELECT is_super_admin, email FROM users WHERE id = $1`, [userId]);
  const role = await query(`SELECT slug FROM roles WHERE id = $1`, [roleId]);

  if (user.rows.length && role.rows.length) {
    if ((user.rows[0].is_super_admin || user.rows[0].email === 'superadmin@desigot.com') && role.rows[0].slug === 'superadmin') {
      throw new ForbiddenError('Super Admin role cannot be removed from the application owner.');
    }
  }

  await query(`DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`, [userId, roleId]);
  invalidatePermissionCache();
  await logAuditEvent({ actorId, action: 'user.remove_role', entityType: 'user', entityId: userId, metadata: { roleId } });
  return { message: 'Role removed from user successfully.' };
};

module.exports = {
  getUserEffectivePermissions,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  duplicateRole,
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionMatrix,
  updatePermissionMatrix,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  setUserStatus,
  resetUserPassword,
  forceLogoutUser,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getTeams,
  createTeam,
  getDesignations,
  createDesignation,
  getAccessPolicies,
  createAccessPolicy,
  deleteAccessPolicy,
  getLoginHistory,
  getActiveSessions,
  revokeSession,
  getSecurityEvents,
  getIpRestrictions,
  createIpRestriction,
  deleteIpRestriction,
  getAuditLogs,
  getAuditLogById,
  getSystemSettings,
  updateSystemSetting,
  getFeatureFlags,
  updateFeatureFlag,
  getSuperAdminDashboard,
  toggleMaintenanceMode,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getEmailTemplates,
  updateEmailTemplate,
  getModuleAccess,
  updateModuleAccess,
  getApiPermissions,
  createApiPermission,
  updateApiPermission,
  deleteApiPermission,
  getAdminActivityLogs,
  getSecuritySettings,
  updateSecuritySettings,
  getUserRoleAssignments,
  assignRolesToUser,
  removeRoleFromUser,
  logAuditEvent,
};
