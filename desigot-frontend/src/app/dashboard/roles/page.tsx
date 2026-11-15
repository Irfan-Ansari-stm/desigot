"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import {
  Shield,
  Plus,
  Search,
  Copy,
  Edit2,
  Trash2,
  Users,
  Key,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ArrowUpDown,
  Lock,
  Layers,
  Crown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { Role, Permission } from "@/types/rbac";

export default function RolesManagementPage() {
  const { isSuperAdmin, hasPermission } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleTypeFilter, setRoleTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    role_type: "custom",
    hierarchy_level: 4,
    is_active: true,
  });
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [duplicateName, setDuplicateName] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await apiGet<{ data: Role[]; pagination: { totalPages: number } }>("/roles", {
        search: search || undefined,
        roleType: roleTypeFilter || undefined,
        page,
        limit: 10,
      });
      // Handle array or paginated response format
      if (Array.isArray(res)) {
        setRoles(res);
        setTotalPages(1);
      } else if (res && (res as any).data) {
        setRoles((res as any).data);
        setTotalPages((res as any).pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error("Failed to load roles:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const perms = await apiGet<Permission[]>("/permissions");
      if (Array.isArray(perms)) setAllPermissions(perms);
    } catch (err) {
      console.error("Failed to load permissions:", err);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [search, roleTypeFilter, page]);

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      role_type: "custom",
      hierarchy_level: 4,
      is_active: true,
    });
    setSelectedPermIds([]);
    setActionError("");
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = async (role: Role) => {
    try {
      const detailed = await apiGet<Role>(`/roles/${role.id}`);
      setSelectedRole(detailed);
      setFormData({
        name: detailed.name,
        slug: detailed.slug,
        description: detailed.description || "",
        role_type: detailed.role_type,
        hierarchy_level: detailed.hierarchy_level,
        is_active: detailed.is_active,
      });
      setSelectedPermIds(detailed.permissions?.map((p) => p.id) || []);
      setActionError("");
      setIsEditModalOpen(true);
    } catch (err: any) {
      alert("Failed to load role details: " + err.message);
    }
  };

  const handleOpenDetails = async (role: Role) => {
    try {
      const detailed = await apiGet<Role>(`/roles/${role.id}`);
      setSelectedRole(detailed);
      setIsDetailsModalOpen(true);
    } catch (err: any) {
      alert("Failed to load role details: " + err.message);
    }
  };

  const handleOpenDuplicate = (role: Role) => {
    setSelectedRole(role);
    setDuplicateName(`${role.name} (Copy)`);
    setActionError("");
    setIsDuplicateModalOpen(true);
  };

  const handleOpenDelete = (role: Role) => {
    setSelectedRole(role);
    setActionError("");
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    try {
      await apiPost("/roles", {
        ...formData,
        permissions: selectedPermIds,
      });
      setActionSuccess(`Role "${formData.name}" created successfully.`);
      setIsCreateModalOpen(false);
      loadRoles();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to create role");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setActionError("");
    try {
      await apiPut(`/roles/${selectedRole.id}`, {
        ...formData,
        permissions: selectedPermIds,
      });
      setActionSuccess(`Role "${formData.name}" updated successfully.`);
      setIsEditModalOpen(false);
      loadRoles();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to update role");
    }
  };

  const handleDuplicateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setActionError("");
    try {
      await apiPost(`/roles/${selectedRole.id}/duplicate`, {
        name: duplicateName,
      });
      setActionSuccess(`Role duplicated successfully as "${duplicateName}".`);
      setIsDuplicateModalOpen(false);
      loadRoles();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to duplicate role");
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedRole) return;
    setActionError("");
    try {
      await apiDelete(`/roles/${selectedRole.id}`);
      setActionSuccess(`Role "${selectedRole.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      loadRoles();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to delete role");
    }
  };

  const togglePermissionSelection = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Role Management
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {roles.length} Roles
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define system and custom roles, manage hierarchy levels, and assign granular permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/permissions/matrix"
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
          >
            <Key className="h-3.5 w-3.5" /> Permission Matrix
          </Link>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create New Role
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles by name or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleTypeFilter}
            onChange={(e) => {
              setRoleTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Role Types</option>
            <option value="system">System Roles</option>
            <option value="administrative">Administrative</option>
            <option value="custom">Custom Roles</option>
            <option value="standard">Standard</option>
          </select>

          <button
            onClick={() => loadRoles()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh List"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Role Name & Slug</th>
                <th className="py-3 px-4">Hierarchy Level</th>
                <th className="py-3 px-4">Role Type</th>
                <th className="py-3 px-4 text-center">Permissions</th>
                <th className="py-3 px-4 text-center">Assigned Users</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading role records...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No roles matched your criteria.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {role.slug === "superadmin" ? (
                          <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                          <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {role.name}
                            {role.is_system && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                                System
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">{role.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Level {role.hierarchy_level}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="capitalize text-slate-600 dark:text-slate-300 font-medium">
                        {role.role_type}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {role.slug === "superadmin" ? "All (Wildcard)" : role.permission_count || 0}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Users className="h-3 w-3 text-slate-400" />
                        {role.user_count || 0}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          role.is_active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {role.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(role)}
                          className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDuplicate(role)}
                          className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Duplicate Role"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        {role.slug !== "superadmin" && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(role)}
                              className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Role"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {!role.is_system && (
                              <button
                                onClick={() => handleOpenDelete(role)}
                                className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Delete Role"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ROLE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" /> Create New Role
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Compliance Auditor"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
                      setFormData({ ...formData, name, slug });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. compliance-auditor"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain responsibilities and expected access scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Type
                  </label>
                  <select
                    value={formData.role_type}
                    onChange={(e) => setFormData({ ...formData, role_type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="custom">Custom Role</option>
                    <option value="administrative">Administrative</option>
                    <option value="standard">Standard Internal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hierarchy Level (1=SuperAdmin, 5=Standard)
                  </label>
                  <select
                    value={formData.hierarchy_level}
                    onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value={2}>Level 2 (Admin)</option>
                    <option value={3}>Level 3 (Manager)</option>
                    <option value={4}>Level 4 (Custom Role)</option>
                    <option value={5}>Level 5 (Standard User)</option>
                  </select>
                </div>
              </div>

              {/* Permissions Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assign Permissions ({selectedPermIds.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPermIds(allPermissions.map((p) => p.id))}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPermIds([])}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {allPermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermIds.includes(perm.id)}
                        onChange={() => togglePermissionSelection(perm.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {perm.slug}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {isEditModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-600" /> Edit Role: {selectedRole.name}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Type
                  </label>
                  <select
                    value={formData.role_type}
                    onChange={(e) => setFormData({ ...formData, role_type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="custom">Custom Role</option>
                    <option value="administrative">Administrative</option>
                    <option value="standard">Standard Internal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hierarchy Level
                  </label>
                  <select
                    value={formData.hierarchy_level}
                    onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value={2}>Level 2 (Admin)</option>
                    <option value={3}>Level 3 (Manager)</option>
                    <option value={4}>Level 4 (Custom Role)</option>
                    <option value={5}>Level 5 (Standard User)</option>
                  </select>
                </div>
              </div>

              {/* Permissions Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Permissions ({selectedPermIds.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPermIds(allPermissions.map((p) => p.id))}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPermIds([])}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {allPermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermIds.includes(perm.id)}
                        onChange={() => togglePermissionSelection(perm.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {perm.slug}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUPLICATE ROLE MODAL */}
      {isDuplicateModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Copy className="h-5 w-5 text-indigo-600" /> Duplicate Role
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Create an identical copy of &ldquo;{selectedRole.name}&rdquo; with all assigned permissions pre-populated.
            </p>

            {actionError && (
              <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                {actionError}
              </div>
            )}

            <form onSubmit={handleDuplicateSubmit}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Role Name
              </label>
              <input
                type="text"
                required
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 mb-4"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Duplicate Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-rose-600 flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" /> Confirm Role Deletion
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to permanently delete the role &ldquo;<strong>{selectedRole.name}</strong>&rdquo;?
              This action cannot be undone. System roles cannot be deleted.
            </p>

            {actionError && (
              <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE DETAILS DRAWER / MODAL */}
      {isDetailsModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600" /> {selectedRole.name}
                </h2>
                <div className="text-xs font-mono text-slate-400">{selectedRole.slug}</div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</h3>
                <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {selectedRole.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Hierarchy</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">Level {selectedRole.hierarchy_level}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Role Type</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 capitalize">{selectedRole.role_type}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Assigned Users</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">{selectedRole.user_count || 0} users</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Assigned Permissions ({selectedRole.permissions?.length || 0})
                </h3>
                <div className="max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {selectedRole.slug === "superadmin" ? (
                    <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-mono text-[11px] font-bold">
                      * (Unrestricted Root Bypass - All Permissions Granted)
                    </span>
                  ) : (selectedRole.permissions || []).length === 0 ? (
                    <span className="text-slate-400">No permissions directly mapped to this role.</span>
                  ) : (
                    selectedRole.permissions?.map((p) => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-mono text-[11px] border border-indigo-200 dark:border-indigo-800"
                      >
                        {p.slug}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
