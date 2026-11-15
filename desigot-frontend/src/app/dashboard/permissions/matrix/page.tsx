"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import {
  Key,
  Shield,
  Save,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Info,
  Crown,
  Layers,
  Sparkles,
} from "lucide-react";
import type { PermissionMatrixResponse, Role, AppModule } from "@/types/rbac";

export default function PermissionMatrixPage() {
  const { isSuperAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PermissionMatrixResponse | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [searchModule, setSearchModule] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState<
    Record<string, { roleId: string; permissionId: string; assigned: boolean }>
  >({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const loadMatrix = async () => {
    try {
      setLoading(true);
      const res = await apiGet<PermissionMatrixResponse>("/access-control/matrix");
      setData(res);
      // Select first non-superadmin role by default if none selected
      if (!selectedRoleId && res.roles.length > 0) {
        const defaultRole = res.roles.find((r) => r.slug !== "superadmin") || res.roles[0];
        setSelectedRoleId(defaultRole.id);
      }
      setUnsavedChanges({});
    } catch (err: any) {
      console.error("Failed to load permission matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  const currentRole = data?.roles.find((r) => r.id === selectedRoleId);
  const isSuperAdminRole = currentRole?.slug === "superadmin";

  const getIsAssigned = (permissionId: string, defaultAssignedRoleIds: string[]) => {
    // If role is Super Admin -> Always assigned (unrestricted system rule)
    if (isSuperAdminRole) return true;

    const changeKey = `${selectedRoleId}_${permissionId}`;
    if (unsavedChanges[changeKey] !== undefined) {
      return unsavedChanges[changeKey].assigned;
    }
    return defaultAssignedRoleIds.includes(selectedRoleId);
  };

  const handleToggle = (permissionId: string, currentlyAssigned: boolean) => {
    if (isSuperAdminRole) return; // Super Admin cannot be unchecked
    const changeKey = `${selectedRoleId}_${permissionId}`;
    setUnsavedChanges((prev) => ({
      ...prev,
      [changeKey]: {
        roleId: selectedRoleId,
        permissionId,
        assigned: !currentlyAssigned,
      },
    }));
  };

  const handleSelectAllForModule = (moduleId: string) => {
    if (isSuperAdminRole || !data) return;
    const modData = data.matrix[moduleId];
    if (!modData) return;

    const newChanges = { ...unsavedChanges };
    Object.values(modData.permissions).forEach((perm) => {
      const changeKey = `${selectedRoleId}_${perm.id}`;
      newChanges[changeKey] = {
        roleId: selectedRoleId,
        permissionId: perm.id,
        assigned: true,
      };
    });
    setUnsavedChanges(newChanges);
  };

  const handleClearAllForModule = (moduleId: string) => {
    if (isSuperAdminRole || !data) return;
    const modData = data.matrix[moduleId];
    if (!modData) return;

    const newChanges = { ...unsavedChanges };
    Object.values(modData.permissions).forEach((perm) => {
      const changeKey = `${selectedRoleId}_${perm.id}`;
      newChanges[changeKey] = {
        roleId: selectedRoleId,
        permissionId: perm.id,
        assigned: false,
      };
    });
    setUnsavedChanges(newChanges);
  };

  const handleSelectAllForRole = () => {
    if (isSuperAdminRole || !data) return;
    const newChanges = { ...unsavedChanges };
    Object.values(data.matrix).forEach((modData) => {
      Object.values(modData.permissions).forEach((perm) => {
        const changeKey = `${selectedRoleId}_${perm.id}`;
        newChanges[changeKey] = {
          roleId: selectedRoleId,
          permissionId: perm.id,
          assigned: true,
        };
      });
    });
    setUnsavedChanges(newChanges);
  };

  const handleClearAllForRole = () => {
    if (isSuperAdminRole || !data) return;
    const newChanges = { ...unsavedChanges };
    Object.values(data.matrix).forEach((modData) => {
      Object.values(modData.permissions).forEach((perm) => {
        const changeKey = `${selectedRoleId}_${perm.id}`;
        newChanges[changeKey] = {
          roleId: selectedRoleId,
          permissionId: perm.id,
          assigned: false,
        };
      });
    });
    setUnsavedChanges(newChanges);
  };

  const handleReset = () => {
    setUnsavedChanges({});
    setSaveMessage("");
    setSaveError("");
  };

  const handleSaveConfirm = async () => {
    setSaving(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const updates = Object.values(unsavedChanges);
      const res = await apiPost<{ message: string }>("/access-control/matrix", {
        updates,
      });
      setSaveMessage(res.message || "Permissions matrix saved successfully.");
      setIsConfirmModalOpen(false);
      loadMatrix();
    } catch (err: any) {
      setSaveError(err.response?.data?.message || err.message || "Failed to update matrix");
    } finally {
      setSaving(false);
    }
  };

  const unsavedCount = Object.keys(unsavedChanges).length;

  // Filter modules
  const filteredModules = (data?.modules || []).filter(
    (m) =>
      m.name.toLowerCase().includes(searchModule.toLowerCase()) ||
      m.slug.toLowerCase().includes(searchModule.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Interactive Permission Matrix
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
              Live Evaluation
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual matrix mapping application modules (rows) against granular actions (columns). Changes take immediate effect.
          </p>
        </div>

        {/* Unsaved indicator & Save Buttons */}
        <div className="flex items-center gap-2.5">
          {unsavedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {unsavedCount} unsaved modification(s)
              </span>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Discard
              </button>
            </div>
          )}

          <button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={unsavedCount === 0 || saving}
            className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all ${
              unsavedCount > 0
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Save className="h-4 w-4" /> Save Matrix Changes
          </button>
        </div>
      </div>

      {/* Notifications Alert */}
      {saveMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{saveMessage}</span>
          </div>
          <button onClick={() => setSaveMessage("")} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>{saveError}</span>
          </div>
          <button onClick={() => setSaveError("")} className="text-rose-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Select Role:
            </span>
            {(data?.roles || []).map((role) => {
              const isSelected = role.id === selectedRoleId;
              const isSA = role.slug === "superadmin";
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? isSA
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {isSA ? <Crown className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                  <span>{role.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">L{role.hierarchy_level}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Module Search & Batch Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter modules..."
                value={searchModule}
                onChange={(e) => setSearchModule(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {!isSuperAdminRole && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSelectAllForRole}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800"
                >
                  Select All Role Perms
                </button>
                <button
                  onClick={handleClearAllForRole}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Role Notice */}
        {isSuperAdminRole && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Super Admin (Application Owner):</strong> Unrestricted system-level authorization bypass.
              Super Admin always possesses all permissions across all modules and cannot be restricted.
            </span>
          </div>
        )}
      </div>

      {/* MATRIX TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-700">
                  Module / Resource
                </th>
                {(data?.actions || []).map((action) => (
                  <th key={action} className="py-3 px-3 text-center min-w-[80px]">
                    {action}
                  </th>
                ))}
                {!isSuperAdminRole && (
                  <th className="py-3 px-3 text-center min-w-[110px] border-l border-slate-200 dark:border-slate-700">
                    Module Controls
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-500">
                    Loading visual matrix...
                  </td>
                </tr>
              ) : filteredModules.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-500">
                    No matching modules found.
                  </td>
                </tr>
              ) : (
                filteredModules.map((mod) => {
                  const modData = data?.matrix[mod.id];
                  return (
                    <tr
                      key={mod.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Module Title Row Header */}
                      <td className="py-3 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{mod.name}</span>
                          {mod.is_system && (
                            <span className="text-[9px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Core
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{mod.slug}</div>
                      </td>

                      {/* Action Checkbox Columns */}
                      {(data?.actions || []).map((action) => {
                        const permAction = modData?.permissions[action];
                        if (!permAction) {
                          return (
                            <td key={action} className="py-3 px-3 text-center text-slate-300 dark:text-slate-700">
                              —
                            </td>
                          );
                        }

                        const assigned = getIsAssigned(permAction.id, permAction.assignedRoleIds);
                        const isModified =
                          unsavedChanges[`${selectedRoleId}_${permAction.id}`] !== undefined;

                        return (
                          <td key={action} className="py-3 px-3 text-center">
                            <label className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={assigned}
                                disabled={isSuperAdminRole}
                                onChange={() => handleToggle(permAction.id, assigned)}
                                className={`rounded h-4 w-4 focus:ring-indigo-500 cursor-pointer transition-colors ${
                                  isModified
                                    ? "text-amber-500 ring-2 ring-amber-400"
                                    : "text-indigo-600"
                                }`}
                                title={`${permAction.slug} - Click to toggle`}
                              />
                            </label>
                          </td>
                        );
                      })}

                      {/* Quick Module Controls */}
                      {!isSuperAdminRole && (
                        <td className="py-3 px-3 text-center border-l border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSelectAllForModule(mod.id)}
                              className="px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded"
                              title="Select all actions for this module"
                            >
                              All
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={() => handleClearAllForModule(mod.id)}
                              className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              title="Clear all actions for this module"
                            >
                              Clear
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Save className="h-5 w-5 text-indigo-600" /> Confirm Permission Matrix Save
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              You are about to persist <strong>{unsavedCount} permission modification(s)</strong> to the PostgreSQL database for role &ldquo;{currentRole?.name}&rdquo;.
              These changes will immediately invalidate authorization caches and affect live access for assigned users.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfirm}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                {saving ? "Saving..." : "Apply & Persist Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
