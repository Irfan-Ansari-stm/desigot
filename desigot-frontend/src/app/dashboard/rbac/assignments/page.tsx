"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import {
  Shield,
  UserCheck,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Crown,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type { UserRoleAssignment, Role } from "@/types/rbac";

interface AdminUserSummary {
  id: string;
  display_name: string;
  email: string;
  role: string;
  is_super_admin: boolean;
}

export default function RoleAssignmentsPage() {
  const [assignments, setAssignments] = useState<UserRoleAssignment[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    userId: "",
    roleIds: [] as string[],
    isPrimary: true,
    expiresAt: "",
  });

  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await apiGet<any>("/rbac/assignments", {
        roleId: roleFilter || undefined,
        page,
        limit: 20,
      });

      if (Array.isArray(res)) {
        setAssignments(res);
        setTotalPages(1);
      } else if (res && res.data) {
        setAssignments(Array.isArray(res.data) ? res.data : res.data.assignments || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error("Failed to load role assignments:", err);
      setActionError("Failed to fetch role assignments.");
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        apiGet<Role[]>("/roles"),
        apiGet<any>("/rbac/users?limit=100"),
      ]);

      if (Array.isArray(rolesRes)) setRoles(rolesRes);
      else if (rolesRes && (rolesRes as any).data) setRoles((rolesRes as any).data);

      if (usersRes && usersRes.data) {
        setUsers(usersRes.data);
      } else if (Array.isArray(usersRes)) {
        setUsers(usersRes);
      }
    } catch (err) {
      console.error("Failed to load roles and users metadata:", err);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [roleFilter, page]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.userId || !assignForm.roleIds.length) {
      setActionError("Please select an administrator and at least one role.");
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");
      await apiPost("/rbac/assignments", {
        userId: assignForm.userId,
        roleIds: assignForm.roleIds,
        isPrimary: assignForm.isPrimary,
        expiresAt: assignForm.expiresAt || null,
      });

      setActionSuccess("Role successfully assigned to administrator!");
      setIsAssignModalOpen(false);
      setAssignForm({ userId: "", roleIds: [], isPrimary: true, expiresAt: "" });
      loadAssignments();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to assign role.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string, userName: string, roleName: string) => {
    if (!confirm(`Are you sure you want to remove role "${roleName}" from ${userName}?`)) {
      return;
    }

    try {
      setActionError("");
      await apiDelete(`/rbac/assignments/${userId}/${roleId}`);
      setActionSuccess(`Role "${roleName}" removed from ${userName}.`);
      loadAssignments();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to remove role.");
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      a.display_name?.toLowerCase().includes(query) ||
      a.email?.toLowerCase().includes(query) ||
      a.role_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider mb-1">
            <UserCheck className="h-4 w-4" />
            User Governance & Authorization
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            Role Assignments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage administrator role delegations, primary positions, and time-bound role expirations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/roles"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            All Roles
          </Link>
          <button
            onClick={() => {
              setAssignForm({ userId: "", roleIds: [], isPrimary: true, expiresAt: "" });
              setIsAssignModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 transition"
          >
            <Plus className="h-4 w-4" /> Assign Role to Admin
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError("")} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by admin name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">Filter by Role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            onClick={loadAssignments}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh List"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            Loading role assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            No matching role assignments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Role Tier</th>
                  <th className="py-3 px-4">Delegation Type</th>
                  <th className="py-3 px-4">Assigned At</th>
                  <th className="py-3 px-4">Expiration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAssignments.map((a) => {
                  const isOwnerSaRole =
                    (a.email === "superadmin@desigot.com" || a.role_slug === "superadmin") &&
                    a.role_slug === "superadmin";

                  return (
                    <tr
                      key={`${a.user_id}_${a.role_id}`}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                            {a.display_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              {a.display_name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {a.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {a.role_slug === "superadmin" ? (
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            <Shield className="h-3.5 w-3.5 text-indigo-600" />
                          )}
                          {a.role_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {a.role_slug}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Tier {a.hierarchy_level}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {a.is_primary ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                            Primary Role
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Secondary
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {new Date(a.assigned_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4">
                        {a.expires_at ? (
                          <div className="text-amber-600 dark:text-amber-400 font-mono text-[11px] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(a.expires_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Permanent</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() =>
                            handleRemoveRole(a.user_id, a.role_id, a.display_name, a.role_name)
                          }
                          disabled={isOwnerSaRole}
                          title={
                            isOwnerSaRole
                              ? "Super Admin role cannot be removed from owner"
                              : "Remove Role Assignment"
                          }
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg disabled:opacity-30 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Assign Role */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-600" />
              Assign Role to Administrator
            </h3>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Administrator *
                </label>
                <select
                  required
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Choose an administrator...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Roles to Grant *
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  {roles.map((r) => {
                    const isChecked = assignForm.roleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setAssignForm((prev) => ({
                              ...prev,
                              roleIds: isChecked
                                ? prev.roleIds.filter((id) => id !== r.id)
                                : [...prev.roleIds, r.id],
                            }));
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (Tier {r.hierarchy_level})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignForm.isPrimary}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, isPrimary: e.target.checked })
                    }
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Designate as Primary Role
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role Expiration (Optional Time-Bound Access)
                </label>
                <input
                  type="date"
                  value={assignForm.expiresAt}
                  onChange={(e) => setAssignForm({ ...assignForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {submitting ? "Assigning..." : "Assign Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
