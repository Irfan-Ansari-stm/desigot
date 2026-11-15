"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import {
  Key,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Filter,
  Shield,
  Layers,
  RefreshCw,
} from "lucide-react";
import type { Permission, AppModule } from "@/types/rbac";

export default function PermissionsManagementPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedAction, setSelectedAction] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    resource: "",
    action: "READ",
    module_id: "",
    description: "",
  });
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [perms, mods] = await Promise.all([
        apiGet<Permission[]>("/permissions", {
          search: search || undefined,
          moduleId: selectedModule || undefined,
          action: selectedAction || undefined,
        }),
        apiGet<AppModule[]>("/access-control/matrix").then((r: any) => r.modules || []),
      ]);
      if (Array.isArray(perms)) setPermissions(perms);
      if (Array.isArray(mods)) setModules(mods);
    } catch (err) {
      console.error("Error loading permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedModule, selectedAction]);

  const handleOpenCreate = () => {
    setEditingPerm(null);
    setFormData({
      name: "",
      slug: "",
      resource: "",
      action: "READ",
      module_id: modules[0]?.id || "",
      description: "",
    });
    setActionError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (perm: Permission) => {
    setEditingPerm(perm);
    setFormData({
      name: perm.name,
      slug: perm.slug,
      resource: perm.resource,
      action: perm.action,
      module_id: perm.module_id || "",
      description: perm.description || "",
    });
    setActionError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    try {
      if (editingPerm) {
        await apiPut(`/permissions/${editingPerm.id}`, formData);
        setActionSuccess(`Permission "${formData.name}" updated successfully.`);
      } else {
        await apiPost("/permissions", formData);
        setActionSuccess(`Permission "${formData.name}" created successfully.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to save permission");
    }
  };

  const handleDelete = async (perm: Permission) => {
    if (!confirm(`Are you sure you want to delete permission "${perm.slug}"?`)) return;
    try {
      await apiDelete(`/permissions/${perm.id}`);
      setActionSuccess(`Permission "${perm.slug}" deleted.`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to delete permission");
    }
  };

  const actionsList = [
    "CREATE", "READ", "UPDATE", "DELETE", "VIEW", "EXPORT",
    "IMPORT", "APPROVE", "REJECT", "ASSIGN", "MANAGE", "CONFIGURE"
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Granular Permission Management
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {permissions.length} Permissions
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse and configure application permissions tied to resources and atomic operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/permissions/matrix"
            className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" /> Visual Matrix
          </Link>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Permission
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
            placeholder="Search by slug, name or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Actions</option>
            {actionsList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadData()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Permission Slug</th>
                <th className="py-3 px-4">Name & Description</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading permissions...
                  </td>
                </tr>
              ) : permissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No permissions found matching the filters.
                  </td>
                </tr>
              ) : (
                permissions.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {p.slug}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{p.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {p.resource}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {p.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {p.module_name || "General"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!p.is_system ? (
                          <>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Permission"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Permission"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5">Protected Core</span>
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

      {/* CREATE / EDIT PERMISSION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-600" />
              {editingPerm ? `Edit: ${editingPerm.slug}` : "Create New Permission"}
            </h2>

            {actionError && (
              <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Permission Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Export Users"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    let slug = formData.slug;
                    if (!editingPerm && formData.resource) {
                      slug = `${formData.resource}.${formData.action.toLowerCase()}`;
                    }
                    setFormData({ ...formData, name, slug });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Resource *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. users, reports"
                    disabled={!!editingPerm}
                    value={formData.resource}
                    onChange={(e) => {
                      const res = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                      setFormData({
                        ...formData,
                        resource: res,
                        slug: `${res}.${formData.action.toLowerCase()}`,
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Action *
                  </label>
                  <select
                    disabled={!!editingPerm}
                    value={formData.action}
                    onChange={(e) => {
                      const act = e.target.value;
                      setFormData({
                        ...formData,
                        action: act,
                        slug: formData.resource ? `${formData.resource}.${act.toLowerCase()}` : "",
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {actionsList.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Permission Slug *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingPerm}
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Module
                </label>
                <select
                  value={formData.module_id}
                  onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="">(None / General)</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  {editingPerm ? "Update Permission" : "Create Permission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
