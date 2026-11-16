"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api";
import {
  Shield,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  Lock,
  Layers,
  Crown,
  Sparkles,
  Trash2,
  Copy,
} from "lucide-react";
import type { Role, Permission } from "@/types/rbac";

export default function EditRolePage() {
  const params = useParams();
  const roleId = params?.id as string;
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchPerm, setSearchPerm] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    if (!roleId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [roleData, permsData] = await Promise.all([
          apiGet<Role>(`/roles/${roleId}`),
          apiGet<Permission[]>("/permissions"),
        ]);

        if (roleData) {
          setRole(roleData);
          setFormData({
            name: roleData.name,
            slug: roleData.slug,
            description: roleData.description || "",
            role_type: roleData.role_type || "custom",
            hierarchy_level: roleData.hierarchy_level || 4,
            is_active: roleData.is_active,
          });

          // Pre-populate selected permission IDs
          const assignedIds = roleData.permissions?.map((p) => p.id) || [];
          setSelectedPermIds(assignedIds);
        }

        if (Array.isArray(permsData)) {
          setAllPermissions(permsData);
        } else if (permsData && (permsData as any).data) {
          setAllPermissions((permsData as any).data);
        }
      } catch (err: any) {
        console.error("Failed to load role edit data:", err);
        setActionError("Failed to load role details.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [roleId]);

  const isSuperAdminRole = role?.slug === "superadmin";

  const togglePermission = (id: string) => {
    if (isSuperAdminRole) return; // Superadmin has immutable wildcard permissions
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAllInModule = (moduleName: string) => {
    if (isSuperAdminRole) return;
    const modulePermIds = allPermissions
      .filter((p) => (p.module_name || p.resource) === moduleName)
      .map((p) => p.id);
    setSelectedPermIds((prev) => Array.from(new Set([...prev, ...modulePermIds])));
  };

  const clearAllInModule = (moduleName: string) => {
    if (isSuperAdminRole) return;
    const modulePermIds = new Set(
      allPermissions
        .filter((p) => (p.module_name || p.resource) === moduleName)
        .map((p) => p.id)
    );
    setSelectedPermIds((prev) => prev.filter((id) => !modulePermIds.has(id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setActionError("Role name is required.");
      return;
    }

    try {
      setSaving(true);
      setActionError("");
      await apiPut(`/roles/${roleId}`, {
        ...formData,
        permission_ids: isSuperAdminRole ? undefined : selectedPermIds,
      });
      setActionSuccess(`Role "${formData.name}" successfully updated!`);
      setTimeout(() => {
        router.push("/dashboard/roles");
      }, 1200);
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || err.message || "Failed to update role"
      );
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by module
  const groupedPerms = allPermissions.reduce<Record<string, Permission[]>>(
    (acc, perm) => {
      const mod = perm.module_name || perm.resource || "General";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    },
    {}
  );

  const moduleNames = Object.keys(groupedPerms).sort();

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-500">
        Loading role configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/roles"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Roles
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              {isSuperAdminRole ? (
                <Crown className="h-6 w-6 text-amber-500" />
              ) : (
                <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              )}
              Edit Role: {formData.name}
            </h1>
            {isSuperAdminRole && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                System Owner Protected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Modify role attributes, hierarchy tier, and granular module permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/roles"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess} Redirecting to roles list...</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs font-medium">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Role Metadata
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={isSuperAdminRole}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Slug (Identifier)
              </label>
              <input
                type="text"
                value={formData.slug}
                disabled
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                disabled={isSuperAdminRole}
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hierarchy Rank
              </label>
              <select
                value={formData.hierarchy_level}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hierarchy_level: parseInt(e.target.value, 10),
                  }))
                }
                disabled={isSuperAdminRole}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>Level 1 - Super Admin Owner</option>
                <option value={2}>Level 2 - Executive / Admin</option>
                <option value={3}>Level 3 - Department Manager</option>
                <option value={4}>Level 4 - Operational Specialist</option>
                <option value={5}>Level 5 - Support / Auditor</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Active Status
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  disabled={isSuperAdminRole}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Allocation Stats */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-5 shadow-sm space-y-2">
            <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Effective Permissions
            </div>
            <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
              {isSuperAdminRole ? "159 (All)" : selectedPermIds.length}{" "}
              <span className="text-xs font-normal text-slate-500">
                / {allPermissions.length} total
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isSuperAdminRole
                ? "The Super Admin role inherently inherits all system permissions with unrestricted bypass."
                : "Active users assigned to this role immediately receive all checked capabilities."}
            </p>
          </div>
        </div>

        {/* Right Column: Permission Matrix Picker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  Assigned Permissions
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Toggle individual permissions or apply actions module-wide.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchPerm}
                    onChange={(e) => setSearchPerm(e.target.value)}
                    placeholder="Search permissions..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
              {moduleNames.map((modName) => {
                const perms = groupedPerms[modName].filter((p) =>
                  !searchPerm
                    ? true
                    : p.name.toLowerCase().includes(searchPerm.toLowerCase()) ||
                      p.slug.toLowerCase().includes(searchPerm.toLowerCase())
                );

                if (perms.length === 0) return null;

                return (
                  <div
                    key={modName}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                          {modName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                          {perms.length} perms
                        </span>
                      </div>

                      {!isSuperAdminRole && (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => selectAllInModule(modName)}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <button
                            type="button"
                            onClick={() => clearAllInModule(modName)}
                            className="text-[11px] text-slate-500 hover:underline font-medium"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {perms.map((p) => {
                        const isChecked = isSuperAdminRole || selectedPermIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition ${
                              isChecked
                                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800"
                                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                            } ${isSuperAdminRole ? "cursor-not-allowed opacity-90" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isSuperAdminRole}
                              onChange={() => togglePermission(p.id)}
                              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                {p.slug}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
