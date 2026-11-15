"use client";
import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import {
  ShieldAlert,
  Activity,
  Lock,
  Globe,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  LogOut,
  Search,
  Plus,
} from "lucide-react";
import type { LoginHistoryEntry, ActiveSession } from "@/types/rbac";

export default function SecurityManagementPage() {
  const [activeTab, setActiveTab] = useState<"logins" | "sessions" | "events" | "ip">("logins");
  const [loading, setLoading] = useState(true);

  // Data states
  const [loginLogs, setLoginLogs] = useState<LoginHistoryEntry[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [ipRestrictions, setIpRestrictions] = useState<any[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [ipPattern, setIpPattern] = useState("");
  const [ipReason, setIpReason] = useState("");
  const [ipType, setIpType] = useState("blacklist");
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);

  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [loginsRes, sessionsRes, eventsRes, ipRes] = await Promise.all([
        apiGet<any>("/rbac/security/login-history", { status: statusFilter || undefined, limit: 25 }),
        apiGet<any>("/rbac/security/sessions"),
        apiGet<any[]>("/rbac/security/events").catch(() => []),
        apiGet<any[]>("/rbac/security/ip-restrictions").catch(() => []),
      ]);

      setLoginLogs(Array.isArray(loginsRes) ? loginsRes : loginsRes?.data || []);
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : sessionsRes?.data || []);
      setEvents(eventsRes || []);
      setIpRestrictions(ipRes || []);
    } catch (err) {
      console.error("Failed to load security management data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session?")) return;
    try {
      await apiDelete(`/rbac/security/sessions/${sessionId}`);
      setActionSuccess("Session revoked immediately.");
      loadData();
    } catch (err: any) {
      alert("Failed to revoke session: " + err.message);
    }
  };

  const handleAddIpRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    try {
      await apiPost("/rbac/security/ip-restrictions", {
        ip_pattern: ipPattern,
        restriction_type: ipType,
        reason: ipReason || "Administrative restriction",
      });
      setActionSuccess(`IP pattern "${ipPattern}" added.`);
      setIsIpModalOpen(false);
      setIpPattern("");
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to add restriction");
    }
  };

  const handleDeleteIpRestriction = async (id: string) => {
    if (!confirm("Remove this IP restriction rule?")) return;
    try {
      await apiDelete(`/rbac/security/ip-restrictions/${id}`);
      setActionSuccess("IP restriction removed.");
      loadData();
    } catch (err: any) {
      alert("Failed to remove IP restriction: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Security Management & Active Sessions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit authentication history, terminate rogue sessions, configure IP access rules, and inspect security events.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("logins")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "logins"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Lock className="h-3.5 w-3.5" /> Login History ({loginLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "sessions"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Activity className="h-3.5 w-3.5" /> Active Sessions ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab("ip")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "ip"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Globe className="h-3.5 w-3.5" /> IP Restrictions ({ipRestrictions.length})
        </button>
      </div>

      {/* LOGIN HISTORY TAB */}
      {activeTab === "logins" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">Account / Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Client User Agent</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loginLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.display_name || log.user_email || "Anonymous Attempt"}
                      </div>
                      {log.failure_reason && (
                        <div className="text-[10px] text-rose-500 font-medium">
                          Reason: {log.failure_reason}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.status === "success"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : log.status === "blocked"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {log.status === "success" && <CheckCircle2 className="h-3 w-3" />}
                        {log.status === "blocked" && <AlertTriangle className="h-3 w-3" />}
                        {log.status === "failed" && <XCircle className="h-3 w-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                      {log.user_agent || "Standard Browser"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTIVE SESSIONS TAB */}
      {activeTab === "sessions" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Authenticated User</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Device & Browser</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {s.display_name}
                    </div>
                    <div className="text-[10px] text-slate-500">{s.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {s.ip_address || "127.0.0.1"}
                  </td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-sm">
                    {s.device_info || "Web Browser"}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(s.last_used_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded text-[11px] font-semibold flex items-center gap-1 ml-auto"
                    >
                      <LogOut className="h-3 w-3" /> Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* IP RESTRICTIONS TAB */}
      {activeTab === "ip" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsIpModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add IP Restriction
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">IP Pattern / Subnet</th>
                  <th className="py-3 px-4">Restriction Type</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ipRestrictions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No active IP restrictions configured.
                    </td>
                  </tr>
                ) : (
                  ipRestrictions.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {r.ip_pattern}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.restriction_type === "whitelist"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {r.restriction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {r.reason}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteIpRestriction(r.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD IP MODAL */}
      {isIpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" /> Add IP Restriction Rule
            </h2>

            {actionError && (
              <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAddIpRestriction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  IP Pattern / CIDR Subnet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.100 or 10.0.0.0/24"
                  value={ipPattern}
                  onChange={(e) => setIpPattern(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Restriction Action
                </label>
                <select
                  value={ipType}
                  onChange={(e) => setIpType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="blacklist">Blacklist (Block Traffic)</option>
                  <option value="whitelist">Whitelist (Permit Traffic)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Security Justification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Threat intelligence intrusion detection"
                  value={ipReason}
                  onChange={(e) => setIpReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIpModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Apply Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
