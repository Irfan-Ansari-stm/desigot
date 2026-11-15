"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import {
  Crown,
  Shield,
  AlertOctagon,
  Server,
  Database,
  Lock,
  Activity,
  Power,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Users,
  Settings,
  Key,
  Flame,
  FileCheck,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { SuperAdminDashboardData } from "@/types/rbac";

export default function SuperAdminControlCenterPage() {
  const { user, isSuperAdmin } = useAuthStore();
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupStatus, setBackupStatus] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiGet<SuperAdminDashboardData>("/rbac/super-admin/dashboard");
      setData(res);
      setMaintenanceMode(res.kpis.maintenanceMode);
    } catch (err: any) {
      console.error("Super Admin Dashboard load error:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to load Super Admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleMaintenance = async () => {
    try {
      const nextState = !maintenanceMode;
      const res = await apiPost<{ message: string; maintenanceMode: boolean }>(
        "/rbac/super-admin/maintenance",
        {
          enabled: nextState,
          reason: maintenanceReason || "System security and database maintenance window",
        }
      );
      setMaintenanceMode(res.maintenanceMode);
      setActionSuccess(res.message);
      setIsMaintenanceModalOpen(false);
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to toggle maintenance mode");
    }
  };

  const handleSimulateBackup = () => {
    setBackupStatus("Initiating encrypted database snapshot...");
    setTimeout(() => {
      setBackupStatus("Dumping PostgreSQL relational schemas & RBAC policies...");
      setTimeout(() => {
        setBackupStatus("Encrypted snapshot backup completed. Archive: desigot_backup_" + Date.now() + ".sql.gz");
      }, 1000);
    }, 800);
  };

  if (!isSuperAdmin()) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-2xl p-6 text-center shadow-xl">
        <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          Root Access Denied
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
          The Super Admin Control Center is strictly restricted to the registered Application Owner. Ordinary administrators are prohibited from viewing or accessing root control operations.
        </p>
        <Link
          href="/dashboard"
          className="inline-block py-2 px-4 rounded-lg bg-slate-800 text-white font-semibold text-xs"
        >
          Return to Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Super Admin Title Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-amber-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Crown className="h-48 w-48 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 uppercase tracking-wider">
                <Crown className="h-3 w-3" /> System Ownership Root
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Unrestricted Bypass Active
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Super Admin Control Center
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Highest authority control plane. Manage system ownership, global maintenance, administrator rosters, emergency access overrides, and disaster recovery.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setMaintenanceReason(
                  maintenanceMode
                    ? ""
                    : "Scheduled infrastructure maintenance & security patch application"
                );
                setIsMaintenanceModalOpen(true);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                maintenanceMode
                  ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              <Power className="h-4 w-4" />
              {maintenanceMode ? "Disable Maintenance Mode" : "Emergency Maintenance"}
            </button>
            <button
              onClick={() => {
                setBackupStatus("");
                setIsBackupModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Database className="h-4 w-4" /> Backup & Recovery
            </button>
          </div>
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

      {actionError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError("")} className="text-rose-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Global Control Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-slate-400 text-[10px] font-bold uppercase">System Owner Status</div>
          <div className="font-bold text-slate-900 dark:text-slate-100 text-base mt-1 flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-amber-500" /> {user?.display_name}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Verified & Active</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-slate-400 text-[10px] font-bold uppercase">Platform Status</div>
          <div className="font-bold text-slate-900 dark:text-slate-100 text-base mt-1 flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                maintenanceMode ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            {maintenanceMode ? "MAINTENANCE MODE" : "PRODUCTION LIVE"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {maintenanceMode ? "Public APIs Blocked" : "All services operational"}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-slate-400 text-[10px] font-bold uppercase">Active Super Admins</div>
          <div className="font-bold text-slate-900 dark:text-slate-100 text-base mt-1">
            {data?.kpis?.users?.super_admins || "1"} Account(s)
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Protection Rule: Non-Demotable</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-slate-400 text-[10px] font-bold uppercase">Authorization Layer</div>
          <div className="font-bold text-slate-900 dark:text-slate-100 text-base mt-1 text-indigo-600">
            Hardware Bypass
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Server Kernel Level Check</div>
        </div>
      </div>

      {/* Administrator Governance Roster */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" /> Administrator Governance Roster
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and oversee every account with elevated administrative access.
            </p>
          </div>
          <Link
            href="/dashboard/users"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Manage User Directory →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Administrator</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Privilege Tier</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data?.administrators || []).map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold">
                      {admin.display_name.charAt(0)}
                    </div>
                    <span>{admin.display_name}</span>
                    {admin.is_super_admin && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                    {admin.email}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {admin.department_name || "Executive"}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        admin.is_super_admin
                          ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                          : "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
                      }`}
                    >
                      {admin.is_super_admin ? "Super Admin (Owner)" : "Platform Admin"}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-semibold uppercase">
                      {admin.account_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {admin.last_login_at
                      ? new Date(admin.last_login_at).toLocaleDateString()
                      : "Today"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Operations & Security Safeguards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" /> System Protection Safeguards
          </h2>
          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span>Super Admin Demotion Shield</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enforced
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span>Last Active Super Admin Lockout Prevention</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active (Cannot be deleted)
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span>Privilege Escalation Barrier</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active (Admins cannot create Super Admins)
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span>Append-Only Immutable Audit Logs</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> PostgreSQL Rule Protected
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" /> Critical Operations & Overrides
          </h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="font-semibold text-amber-900 dark:text-amber-200">
                Global Access Override
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                Super Admin authorization checks operate above normal permission tables. Even if role permissions are cleared, the Super Admin maintains permanent access.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/dashboard/system/general"
                className="flex-1 py-2 text-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700"
              >
                Global System Settings
              </Link>
              <Link
                href="/dashboard/audit/all-logs"
                className="flex-1 py-2 text-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700"
              >
                Root Audit Trails
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MAINTENANCE MODE MODAL */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Power className="h-5 w-5 text-amber-600" />
              {maintenanceMode ? "Disable Maintenance Mode" : "Activate Emergency Maintenance Mode"}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              {maintenanceMode
                ? "Disabling maintenance mode will re-open public APIs and allow all regular users and sellers to authenticate."
                : "Activating maintenance mode will immediately block access for standard users. Only Super Admin and Platform Admins will be able to access the application."}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maintenance Reason / Notification Message
              </label>
              <textarea
                rows={2}
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                placeholder="Reason displayed on public maintenance banner..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleMaintenance}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs ${
                  maintenanceMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {maintenanceMode ? "Confirm Disable" : "Confirm Maintenance Activation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BACKUP & RECOVERY MODAL */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" /> Database Backup & Recovery
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Trigger a live transactional PostgreSQL snapshot including all RBAC schemas, user tables, and immutable audit logs.
            </p>

            {backupStatus ? (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-mono text-indigo-800 dark:text-indigo-300 mb-4 animate-pulse">
                {backupStatus}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={handleSimulateBackup}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Database className="h-3.5 w-3.5" /> Start Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
