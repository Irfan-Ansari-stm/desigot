"use client";
import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Lock,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Crown,
  Building2,
  Eye,
  KeyRound,
  RefreshCw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import type { Role, Department, Designation, User } from "@/types";

export default function UsersManagementPage() {
  const { user: currentUser, isSuperAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [detailedUser, setDetailedUser] = useState<any>(null);

  // Form State
  const [createFormData, setCreateFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    display_name: "",
    phone: "",
    password: "Password123!",
    department_id: "",
    designation_id: "",
    is_super_admin: false,
    roles: [] as string[],
  });

  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    phone: "",
    department_id: "",
    designation_id: "",
    account_status: "active",
    is_super_admin: false,
    roles: [] as string[],
  });

  const [suspensionReason, setSuspensionReason] = useState("");
  const [newPassword, setNewPassword] = useState("Password123!");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await apiGet<{ data: User[]; pagination: { totalPages: number } }>("/rbac/users", {
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        departmentId: deptFilter || undefined,
        page,
        limit: 10,
      });

      if (Array.isArray(res)) {
        setUsers(res);
        setTotalPages(1);
      } else if (res && (res as any).data) {
        setUsers((res as any).data);
        setTotalPages((res as any).pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [rRes, dRes, desRes] = await Promise.all([
        apiGet<Role[]>("/roles").then((r: any) => (Array.isArray(r) ? r : r?.data || [])),
        apiGet<Department[]>("/rbac/departments").catch(() => []),
        apiGet<Designation[]>("/rbac/designations").catch(() => []),
      ]);
      setRoles(rRes);
      setDepartments(dRes);
      setDesignations(desRes);
    } catch (err) {
      console.error("Failed to load auxiliary metadata:", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, deptFilter, page]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const handleOpenCreate = () => {
    setCreateFormData({
      email: "",
      first_name: "",
      last_name: "",
      display_name: "",
      phone: "",
      password: "Password123!",
      department_id: departments[0]?.id || "",
      designation_id: designations[0]?.id || "",
      is_super_admin: false,
      roles: [],
    });
    setActionError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    try {
      await apiPost("/rbac/users", createFormData);
      setActionSuccess(`User account for ${createFormData.email} created.`);
      setIsCreateModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to create user");
    }
  };

  const handleOpenEdit = (user: User) => {
    setActiveUser(user);
    setEditFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      display_name: user.display_name || "",
      phone: user.phone || "",
      department_id: user.department_id || "",
      designation_id: user.designation_id || "",
      account_status: user.account_status,
      is_super_admin: !!user.is_super_admin,
      roles: user.roles?.map((r) => r.id) || [],
    });
    setActionError("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    setActionError("");
    try {
      await apiPut(`/rbac/users/${activeUser.id}`, editFormData);
      setActionSuccess(`User "${editFormData.display_name}" updated.`);
      setIsEditModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to update user");
    }
  };

  const handleOpenDetails = async (user: User) => {
    setActiveUser(user);
    try {
      const detailed = await apiGet<any>(`/rbac/users/${user.id}`);
      setDetailedUser(detailed);
      setIsDetailsModalOpen(true);
    } catch (err: any) {
      alert("Error loading user profile: " + err.message);
    }
  };

  const handleOpenSuspend = (user: User) => {
    setActiveUser(user);
    setSuspensionReason(user.account_status === "active" ? "Administrative compliance review" : "");
    setActionError("");
    setIsSuspendModalOpen(true);
  };

  const handleSuspendSubmit = async () => {
    if (!activeUser) return;
    setActionError("");
    try {
      const nextStatus = activeUser.account_status === "active" ? "suspended" : "active";
      await apiPatch(`/rbac/users/${activeUser.id}/status`, {
        status: nextStatus,
        reason: suspensionReason,
      });
      setActionSuccess(`User status changed to ${nextStatus}.`);
      setIsSuspendModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to update status");
    }
  };

  const handleForceLogout = async (user: User) => {
    if (!confirm(`Force logout user "${user.display_name}" and revoke all active sessions?`)) return;
    try {
      await apiPost(`/rbac/users/${user.id}/force-logout`, {});
      setActionSuccess(`All sessions terminated for "${user.display_name}".`);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to force logout");
    }
  };

  const handleOpenResetPassword = (user: User) => {
    setActiveUser(user);
    setNewPassword("TempPass123!");
    setActionError("");
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (!activeUser) return;
    setActionError("");
    try {
      await apiPost(`/rbac/users/${activeUser.id}/reset-password`, {
        new_password: newPassword,
      });
      setActionSuccess(`Password reset successfully for ${activeUser.display_name}.`);
      setIsResetPasswordModalOpen(false);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to reset password");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.display_name}"?`)) return;
    try {
      await apiDelete(`/rbac/users/${user.id}`);
      setActionSuccess(`User "${user.display_name}" soft-deleted.`);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to delete user");
    }
  };

  const handleBulkDeleteSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    setActionError("");
    try {
      await apiPost("/rbac/users/bulk-delete", {
        userIds: selectedUserIds,
      });
      setActionSuccess(`${selectedUserIds.length} users deleted successfully.`);
      setSelectedUserIds([]);
      setIsBulkDeleteModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to bulk delete");
    }
  };

  const handleExportCSV = () => {
    if (!users.length) return;
    const headers = ["ID", "Email", "Name", "Role", "SuperAdmin", "Status", "Department", "Created At"];
    const rows = users.map((u) => [
      u.id,
      u.email,
      `"${u.display_name}"`,
      u.role,
      u.is_super_admin ? "YES" : "NO",
      u.account_status,
      `"${(u as any).department_name || ""}"`,
      u.created_at,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Enterprise User Management
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {users.length} Users
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Provision users, assign multi-tier hierarchical roles, manage account status, and enforce session security.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
          >
            <Download className="h-3.5 w-3.5" /> Export Records
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add New User
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="pending_verification">Pending</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {selectedUserIds.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedUserIds.length})
            </button>
          )}

          <button
            onClick={() => loadUsers()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUserIds.length === users.length}
                    onChange={toggleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                </th>
                <th className="py-3 px-4">User & Email</th>
                <th className="py-3 px-4">Assigned Roles</th>
                <th className="py-3 px-4">Department & Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSA = u.is_super_admin || u.role === "superadmin";
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => toggleSelectUser(u.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0">
                            {u.display_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              {u.display_name}
                              {isSA && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                            </div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {isSA ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700 text-[10px] uppercase">
                              Super Admin
                            </span>
                          ) : (u.roles || []).length > 0 ? (
                            u.roles?.map((r) => (
                              <span
                                key={r.id}
                                className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 text-[10px]"
                              >
                                {r.name}
                              </span>
                            ))
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                              {u.role}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {(u as any).department_name || "—"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {(u as any).designation_title || "Staff"}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.account_status === "active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : u.account_status === "suspended"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {u.account_status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString() : "Never"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetails(u)}
                            className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Full User Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit User & Roles"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenSuspend(u)}
                            className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={u.account_status === "active" ? "Suspend Account" : "Activate Account"}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleForceLogout(u)}
                            className="p-1 rounded text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Force Logout"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Reset Password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" /> Provision New User
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.first_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, first_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.last_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, last_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={createFormData.department_id}
                    onChange={(e) => setCreateFormData({ ...createFormData, department_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="">(None)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <select
                    value={createFormData.designation_id}
                    onChange={(e) => setCreateFormData({ ...createFormData, designation_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="">(None)</option>
                    {designations.map((des) => (
                      <option key={des.id} value={des.id}>
                        {des.title} ({des.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roles Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Roles
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg max-h-36 overflow-y-auto">
                  {roles.map((r) => {
                    const isSA = r.slug === "superadmin";
                    if (isSA && !isSuperAdmin()) return null; // non-superadmin cannot assign superadmin role
                    const checked = createFormData.roles.includes(r.id);
                    return (
                      <label key={r.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setCreateFormData((prev) => ({
                              ...prev,
                              roles: checked
                                ? prev.roles.filter((id) => id !== r.id)
                                : [...prev.roles, r.id],
                            }));
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{r.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Super Admin Ownership Toggle (Strictly Super Admin Only) */}
              {isSuperAdmin() && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Crown className="h-4 w-4 text-amber-600" /> Super Admin Status
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400">
                      Grant unrestricted system ownership and protected server-level bypass.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={createFormData.is_super_admin}
                    onChange={(e) => setCreateFormData({ ...createFormData, is_super_admin: e.target.checked })}
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </div>
              )}

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
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-600" /> Edit User: {activeUser.email}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.display_name}
                    onChange={(e) => setEditFormData({ ...editFormData, display_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={editFormData.department_id}
                    onChange={(e) => setEditFormData({ ...editFormData, department_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="">(None)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editFormData.account_status}
                    onChange={(e) => setEditFormData({ ...editFormData, account_status: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                    <option value="pending_verification">Pending Verification</option>
                  </select>
                </div>
              </div>

              {/* Roles Multi-Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Roles
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg max-h-36 overflow-y-auto">
                  {roles.map((r) => {
                    const isSA = r.slug === "superadmin";
                    if (isSA && !isSuperAdmin()) return null;
                    const checked = editFormData.roles.includes(r.id);
                    return (
                      <label key={r.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setEditFormData((prev) => ({
                              ...prev,
                              roles: checked
                                ? prev.roles.filter((id) => id !== r.id)
                                : [...prev.roles, r.id],
                            }));
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{r.name}</span>
                      </label>
                    );
                  })}
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

      {/* USER DETAILS DRAWER / MODAL */}
      {isDetailsModalOpen && activeUser && detailedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" /> {detailedUser.display_name}
                </h2>
                <div className="text-xs text-slate-500">{detailedUser.email}</div>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Account Status</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 capitalize mt-1">
                    {detailedUser.account_status}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Super Admin</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {detailedUser.is_super_admin ? "YES (Protected)" : "NO"}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Department</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {detailedUser.department_name || "Unassigned"}
                  </div>
                </div>
              </div>

              {/* Effective Permissions */}
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Effective Permissions ({detailedUser.effectivePermissions?.length || 0})
                </h3>
                <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {detailedUser.effectivePermissions?.map((perm: string) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-mono text-[10px] border border-indigo-200 dark:border-indigo-800"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Sessions */}
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Active Sessions</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                  {(detailedUser.activeSessions || []).length === 0 ? (
                    <div className="p-3 text-slate-400 text-center">No active sessions.</div>
                  ) : (
                    detailedUser.activeSessions.map((s: any) => (
                      <div key={s.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                            {s.ip_address || "127.0.0.1"}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-sm">
                            {s.device_info || "Web Browser"}
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                          Active
                        </span>
                      </div>
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

      {/* SUSPEND / ACTIVATE MODAL */}
      {isSuspendModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {activeUser.account_status === "active" ? "Suspend Account" : "Activate Account"}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              {activeUser.account_status === "active"
                ? `Suspending "${activeUser.display_name}" will immediately invalidate all active sessions and block API authentication.`
                : `Activating "${activeUser.display_name}" will restore login capabilities.`}
            </p>

            {actionError && (
              <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700">
                {actionError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Audit Reason
              </label>
              <textarea
                rows={2}
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsSuspendModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetPasswordModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-600" /> Reset Password
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Assign a new temporary password for &ldquo;{activeUser.display_name}&rdquo;. All active sessions will be terminated.
            </p>

            {actionError && (
              <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700">
                {actionError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Temporary Password
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPasswordSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-rose-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Confirm Bulk Deletion
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to permanently delete <strong>{selectedUserIds.length} selected user(s)</strong>?
              The system will verify and abort if any selected record is the last active Super Admin.
            </p>

            {actionError && (
              <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Confirm Bulk Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
