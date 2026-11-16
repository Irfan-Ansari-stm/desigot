export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  role_type: 'system' | 'administrative' | 'custom' | 'standard';
  hierarchy_level: number;
  is_system: boolean;
  is_active: boolean;
  user_count?: number;
  permission_count?: number;
  permissions?: Permission[];
  users?: Array<{ id: string; email: string; display_name: string; avatar_url?: string }>;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string;
  module_id?: string;
  group_id?: string;
  resource: string;
  action: string;
  is_system: boolean;
  module_name?: string;
  module_slug?: string;
  group_name?: string;
}

export interface AppModule {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  route?: string;
  is_active: boolean;
  is_system?: boolean;
  display_order: number;
}

export interface PermissionMatrixAction {
  id: string;
  slug: string;
  name: string;
  resource: string;
  assignedRoleIds: string[];
}

export interface PermissionMatrixResponse {
  modules: AppModule[];
  roles: Role[];
  actions: string[];
  matrix: Record<string, {
    module: AppModule;
    permissions: Record<string, PermissionMatrixAction>;
  }>;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  code?: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  is_active: boolean;
  team_count?: number;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  department_id: string;
  name: string;
  slug: string;
  description?: string;
  lead_id?: string;
  lead_name?: string;
  department_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Designation {
  id: string;
  department_id?: string;
  title: string;
  slug: string;
  level: string;
  description?: string;
  department_name?: string;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AccessPolicy {
  id: string;
  name: string;
  slug: string;
  description?: string;
  effect: 'allow' | 'deny';
  subject_type: 'role' | 'user' | 'group' | 'department';
  subject_id?: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_email?: string;
  actor_type: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface LoginHistoryEntry {
  id: string;
  user_id?: string;
  display_name?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failed' | 'blocked';
  failure_reason?: string;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  is_super_admin: boolean;
  ip_address?: string;
  device_info?: string;
  last_used_at: string;
  expires_at: string;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  category: string;
  value: unknown;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_public: boolean;
  is_system: boolean;
  updated_by_name?: string;
  updated_at: string;
}

export interface FeatureFlag {
  key: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage: number;
  updated_at?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  environment: 'live' | 'test';
  scopes: string[];
  rate_limit_rpm: number;
  is_active: boolean;
  owner_name?: string;
  owner_email?: string;
  last_used_at?: string;
  created_at: string;
  revoked_at?: string;
  apiKey?: string; // only present on creation
}

export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  body_html: string;
  body_text?: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface SuperAdminDashboardData {
  kpis: {
    users: {
      total_users: string | number;
      active_users: string | number;
      suspended_users: string | number;
      super_admins: string | number;
    };
    roles: {
      total_roles: string | number;
      active_roles: string | number;
    };
    permissions: string | number;
    activeSessions: string | number;
    logins24h: {
      total_logins_24h: string | number;
      failed_logins_24h: string | number;
    };
    totalSettings: string | number;
    maintenanceMode: boolean;
  };
  administrators: Array<{
    id: string;
    email: string;
    display_name: string;
    role: string;
    is_super_admin: boolean;
    account_status: string;
    last_login_at?: string;
    department_name?: string;
  }>;
  systemIntegrity: {
    hasActiveSuperAdmin: boolean;
    databaseStatus: string;
    rbacEngineStatus: string;
    auditLogRetention: string;
  };
}

export interface RoleModuleAccess {
  role_id: string;
  module_id: string;
  access_level: 'none' | 'read' | 'write' | 'admin';
  is_accessible: boolean;
}

export interface ApiRoutePermission {
  id: string;
  module: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  required_permission?: string;
  description?: string;
  is_protected: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminActivityLog {
  id: string;
  user_id?: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
  action: string;
  module: string;
  resource_type?: string;
  resource_id?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserRoleAssignment {
  assignment_id: string;
  user_id: string;
  role_id: string;
  is_primary: boolean;
  expires_at?: string;
  assigned_at: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  account_status: string;
  role_name: string;
  role_slug: string;
  hierarchy_level: number;
}

