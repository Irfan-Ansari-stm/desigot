'use strict';
const { ForbiddenError, UnauthorizedError } = require('../shared/errors/AppError');
const rbacService = require('../modules/rbac/rbac.service');

/**
 * Enterprise Authorization Middleware Engine
 * Enforces Role-Based and Permission-Based Access Control.
 * Guarantees protected Super Admin server-level authorization bypass for permitted endpoints.
 */

/**
 * Checks if user has a specific permission.
 * Super Admin always returns true (system-level protected bypass).
 */
const hasPermission = (user, permissionSlug) => {
  if (!user) return false;
  if (user.is_super_admin || user.role === 'superadmin') return true;
  if (!user.permissions || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes('*') || user.permissions.includes(permissionSlug);
};

const hasAnyPermission = (user, permissionSlugs = []) => {
  if (!user) return false;
  if (user.is_super_admin || user.role === 'superadmin') return true;
  if (!user.permissions || !Array.isArray(user.permissions)) return false;
  if (user.permissions.includes('*')) return true;
  return permissionSlugs.some((p) => user.permissions.includes(p));
};

const hasAllPermissions = (user, permissionSlugs = []) => {
  if (!user) return false;
  if (user.is_super_admin || user.role === 'superadmin') return true;
  if (!user.permissions || !Array.isArray(user.permissions)) return false;
  if (user.permissions.includes('*')) return true;
  return permissionSlugs.every((p) => user.permissions.includes(p));
};

const hasRole = (user, roleSlug) => {
  if (!user) return false;
  if (user.is_super_admin || user.role === 'superadmin') return true;
  if (user.role === roleSlug) return true;
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some((r) => r.slug === roleSlug || r === roleSlug);
  }
  return false;
};

const canAccessModule = (user, moduleSlug) => {
  if (!user) return false;
  if (user.is_super_admin || user.role === 'superadmin') return true;
  // Module access is granted if user has any permission under that resource/module
  if (!user.permissions || !Array.isArray(user.permissions)) return false;
  if (user.permissions.includes('*')) return true;
  return user.permissions.some((p) => p.startsWith(`${moduleSlug}.`));
};

/**
 * Middleware: Requires that the authenticated user possesses the specific permission.
 * Super Admin automatically bypasses with unrestricted access.
 */
const requirePermission = (...permissionSlugs) => async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    // Super Admin protected bypass
    if (req.user.is_super_admin || req.user.role === 'superadmin') {
      return next();
    }

    // Ensure user permissions are loaded
    if (!req.user.permissions) {
      const resolved = await rbacService.getUserEffectivePermissions(req.user.id);
      req.user.permissions = resolved.permissions;
      req.user.roles = resolved.roles;
      if (resolved.isSuperAdmin) {
        req.user.is_super_admin = true;
        return next();
      }
    }

    const authorized = permissionSlugs.every((slug) => hasPermission(req.user, slug));
    if (!authorized) {
      throw new ForbiddenError(`Access denied: Requires permission(s) [${permissionSlugs.join(', ')}]`);
    }

    return next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware: Requires ANY of the listed permissions.
 */
const requireAnyPermissionMiddleware = (...permissionSlugs) => async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    if (req.user.is_super_admin || req.user.role === 'superadmin') {
      return next();
    }

    if (!req.user.permissions) {
      const resolved = await rbacService.getUserEffectivePermissions(req.user.id);
      req.user.permissions = resolved.permissions;
      req.user.roles = resolved.roles;
      if (resolved.isSuperAdmin) {
        req.user.is_super_admin = true;
        return next();
      }
    }

    const authorized = hasAnyPermission(req.user, permissionSlugs);
    if (!authorized) {
      throw new ForbiddenError(`Access denied: Requires at least one of [${permissionSlugs.join(', ')}]`);
    }

    return next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware: Requires Super Admin authority exclusively.
 * Ordinary administrators CANNOT access Super Admin routes.
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) return next(new UnauthorizedError('Authentication required'));
  if (!req.user.is_super_admin && req.user.role !== 'superadmin') {
    return next(new ForbiddenError('Restricted Operation: Super Admin (Application Owner) privileges required.'));
  }
  return next();
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  canAccessModule,
  requirePermission,
  requireAnyPermission: requireAnyPermissionMiddleware,
  requireSuperAdmin,
};
