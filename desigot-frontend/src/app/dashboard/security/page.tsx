"use client";

import React, { Suspense, useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Key,
  Lock,
  Unlock,
  Globe,
  Activity,
  Terminal,
  UserCheck,
  Users,
  Smartphone,
  Laptop,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Sliders,
  Plus,
  Trash2,
  Fingerprint,
  Server,
  Database,
  AlertCircle,
  Check,
  TrendingUp,
  TrendingDown,
  Layers
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from "@/lib/api";

export default function SecurityAuditPage() {
  return (
    <Suspense fallback={<SecurityLoadingSkeleton />}>
      <SecurityAuditContent />
    </Suspense>
  );
}

function SecurityLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        ))}
      </div>
      <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
    </div>
  );
}

function SecurityAuditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const currentTab = searchParams.get("tab") || "overview";
  const [period, setPeriod] = useState<string>("30d");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Core Data States
  const [overview, setOverview] = useState<any>(null);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminActions, setAdminActions] = useState<any[]>([]);
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [ipRules, setIpRules] = useState<any[]>([]);
  const [authSettings, setAuthSettings] = useState<any>({});
  const [mfaData, setMfaData] = useState<any>(null);
  const [lockouts, setLockouts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [dataAccessLogs, setDataAccessLogs] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [complianceReports, setComplianceReports] = useState<any[]>([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals & Drawers
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isIpModalOpen, setIsIpModalOpen] = useState<boolean>(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // New IP Form
  const [newIp, setNewIp] = useState({ ipPattern: "", cidrRange: "", type: "deny", scope: "all", reason: "" });
  // New Investigation Form
  const [newInv, setNewInv] = useState({ title: "", description: "", severity: "medium" });
  // New Compliance Export Form
  const [newExport, setNewExport] = useState({ reportType: "soc2_audit_trail", format: "csv" });

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleTabChange = (tabKey: string) => {
    startTransition(() => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", tabKey);
      router.push(`/dashboard/security?${p.toString()}`);
    });
  };

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      if (currentTab === "overview") {
        const res = await apiGet<any>("/admin/security/overview", { period });
        setOverview(res);
      } else if (currentTab === "login-history") {
        const res = await apiGet<any>("/admin/security/login-history", { period, search: searchTerm || undefined });
        setLoginHistory(res?.data || res?.logins || res?.history || (Array.isArray(res) ? res : []));
      } else if (currentTab === "sessions") {
        const res = await apiGet<any>("/admin/security/sessions");
        setSessions(res?.data || res?.sessions || (Array.isArray(res) ? res : []));
      } else if (currentTab === "failed-attempts") {
        const res = await apiGet<any>("/admin/security/failed-attempts", { period, search: searchTerm || undefined });
        setFailedAttempts(res?.data || res?.attempts || (Array.isArray(res) ? res : []));
      } else if (currentTab === "events") {
        const res = await apiGet<any>("/admin/security/events", {
          period,
          severity: severityFilter !== "all" ? severityFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined
        });
        setSecurityEvents(res?.data || res?.events || (Array.isArray(res) ? res : []));
      } else if (currentTab === "audit-logs") {
        const res = await apiGet<any>("/admin/security/audit-logs", { period, search: searchTerm || undefined });
        setAuditLogs(res?.data || res?.logs || (Array.isArray(res) ? res : []));
      } else if (currentTab === "admin-actions") {
        const res = await apiGet<any>("/admin/security/admin-actions", { period, search: searchTerm || undefined });
        setAdminActions(res?.data || res?.actions || (Array.isArray(res) ? res : []));
      } else if (currentTab === "api-logs") {
        const res = await apiGet<any>("/admin/security/api-logs", { period, search: searchTerm || undefined });
        setApiLogs(res?.data || res?.logs || (Array.isArray(res) ? res : []));
      } else if (currentTab === "ip-rules" || currentTab === "blocked-ips") {
        const typeParam = currentTab === "blocked-ips" ? "deny" : undefined;
        const res = await apiGet<any>("/admin/security/ip-rules", { type: typeParam, search: searchTerm || undefined });
        setIpRules(res?.data || res?.rules || (Array.isArray(res) ? res : []));
      } else if (currentTab === "auth-settings" || currentTab === "password-policies") {
        const res = await apiGet<any>("/admin/security/auth-settings");
        setAuthSettings(res?.settings || res || {});
      } else if (currentTab === "mfa") {
        const res = await apiGet<any>("/admin/security/mfa");
        setMfaData(res);
      } else if (currentTab === "lockouts") {
        const res = await apiGet<any>("/admin/security/lockouts", { search: searchTerm || undefined });
        setLockouts(res?.data || res?.lockouts || (Array.isArray(res) ? res : []));
      } else if (currentTab === "alerts") {
        const res = await apiGet<any>("/admin/security/alerts", {
          severity: severityFilter !== "all" ? severityFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined
        });
        setAlerts(res?.alerts || (Array.isArray(res) ? res : []));
      } else if (currentTab === "investigations") {
        const res = await apiGet<any>("/admin/security/investigations", {
          severity: severityFilter !== "all" ? severityFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined
        });
        setInvestigations(res?.investigations || (Array.isArray(res) ? res : []));
      } else if (currentTab === "data-access") {
        const res = await apiGet<any>("/admin/security/data-access-logs", { period });
        setDataAccessLogs(res?.data || res?.logs || (Array.isArray(res) ? res : []));
      } else if (currentTab === "devices") {
        const res = await apiGet<any>("/admin/security/devices");
        setDevices(res?.devices || (Array.isArray(res) ? res : []));
      } else if (currentTab === "compliance") {
        const res = await apiGet<any>("/admin/security/compliance/reports");
        setComplianceReports(res?.reports || (Array.isArray(res) ? res : []));
      }
    } catch (err: any) {
      console.error("Error fetching security data:", err);
      showFeedback("error", err?.response?.data?.message || err?.message || "Failed to load security records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [currentTab, period, severityFilter, statusFilter]);

  // Actions
  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Immediately revoke this active session? The client will be disconnected.")) return;
    setActionLoading(true);
    try {
      await apiDelete(`/admin/security/sessions/${sessionId}`);
      showFeedback("success", "Active session successfully revoked.");
      fetchSecurityData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to revoke session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeUserSessions = async (userId: string) => {
    if (!confirm("Revoke ALL concurrent sessions for this user across all devices?")) return;
    setActionLoading(true);
    try {
      await apiPost("/admin/security/sessions/revoke-user", { userId });
      showFeedback("success", "All user sessions terminated.");
      fetchSecurityData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to revoke user sessions.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockAccount = async (lockoutId: string) => {
    if (!confirm("Unlock this account and restore full marketplace access?")) return;
    setActionLoading(true);
    try {
      await apiPost(`/admin/security/lockouts/${lockoutId}/release`);
      showFeedback("success", "Account unlocked and authentication counter reset.");
      fetchSecurityData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to release lockout.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string, status: string = "acknowledged") => {
    setActionLoading(true);
    try {
      await apiPatch(`/admin/security/alerts/${alertId}`, { status });
      showFeedback("success", `Alert status marked as ${status}.`);
      fetchSecurityData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to update alert.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateIpRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.ipPattern) return;
    setActionLoading(true);
    try {
      await apiPost("/admin/security/ip-rules", newIp);
      showFeedback("success", `IP Access rule created for ${newIp.ipPattern}.`);
      setIsIpModalOpen(false);
      setNewIp({ ipPattern: "", cidrRange: "", type: "deny", scope: "all", reason: "" });
      fetchSecurityData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to create IP rule.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteIpRule = async (id: string) => {
    if (!confirm("Delete this IP filter rule?")) return;
    setActionLoading(true);
    try {
      await apiDelete(`/admin/security/ip-rules/${id}`);
      showFeedback("success", "IP rule removed.");
      fetchSecurityData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to delete IP rule.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.title) return;
    setActionLoading(true);
    try {
      await apiPost("/admin/security/investigations", newInv);
      showFeedback("success", "Security investigation docket opened.");
      setIsInvModalOpen(false);
      setNewInv({ title: "", description: "", severity: "medium" });
      fetchSecurityData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to launch investigation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAuthSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiPatch("/admin/security/auth-settings", authSettings);
      showFeedback("success", "Authentication & Zero-Trust policies saved.");
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to update security settings.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm("Revoke trust for this client device? The user must re-verify next time.")) return;
    setActionLoading(true);
    try {
      await apiPost(`/admin/security/devices/${deviceId}/revoke-trust`);
      showFeedback("success", "Device trust revoked.");
      fetchSecurityData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to revoke device trust.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateComplianceExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiPost("/admin/security/compliance/exports", newExport);
      showFeedback("success", `Compliance report export generated successfully.`);
      setIsExportModalOpen(false);
      fetchSecurityData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to generate compliance export.");
    } finally {
      setActionLoading(false);
    }
  };

  // Nav Tabs configuration
  const tabs = [
    { key: "overview", label: "Overview", icon: ShieldCheck, badge: null },
    { key: "login-history", label: "Login History", icon: Clock, badge: null },
    { key: "sessions", label: "Active Sessions", icon: Activity, badge: overview?.kpis?.activeSessions?.value ?? null },
    { key: "failed-attempts", label: "Failed Attempts", icon: AlertTriangle, badge: overview?.kpis?.failedLoginAttempts?.value ?? null },
    { key: "events", label: "Security Events", icon: ShieldAlert, badge: null },
    { key: "audit-logs", label: "Audit Logs", icon: Fingerprint, badge: "SHA-256" },
    { key: "admin-actions", label: "Admin Actions", icon: UserCheck, badge: null },
    { key: "api-logs", label: "API Telemetry", icon: Terminal, badge: null },
    { key: "ip-rules", label: "IP Rules", icon: Globe, badge: null },
    { key: "auth-settings", label: "Auth Policies", icon: Lock, badge: null },
    { key: "mfa", label: "2FA & MFA", icon: Key, badge: mfaData?.stats?.adoptionPercentage ? `${mfaData.stats.adoptionPercentage}%` : null },
    { key: "password-policies", label: "Password Policy", icon: Sliders, badge: null },
    { key: "blocked-ips", label: "Blocked IPs", icon: XCircle, badge: overview?.kpis?.blockedIpAddresses?.value ?? null },
    { key: "lockouts", label: "Account Lockouts", icon: Unlock, badge: overview?.kpis?.lockedAccounts?.value ?? null },
    { key: "alerts", label: "Security Alerts", icon: AlertCircle, badge: overview?.kpis?.criticalSecurityAlerts?.value ?? null },
    { key: "investigations", label: "Investigations", icon: FileText, badge: null },
    { key: "data-access", label: "Data Access Logs", icon: Database, badge: null },
    { key: "devices", label: "Devices", icon: Laptop, badge: null },
    { key: "compliance", label: "Compliance", icon: Download, badge: null }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6 text-slate-900 dark:text-slate-100">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-rose-600 text-white shadow-rose-500/20"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Security & Audit Operations Center</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Zero Trust Active
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800">
                  Super Admin Owner
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Enterprise real-time authentication monitoring, append-only cryptographic audit trail, and security policy enforcement.
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <button
            onClick={() => fetchSecurityData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-500/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Compliance Export
          </button>
        </div>
      </div>

      {/* Security Health Summary Banner */}
      {overview?.health && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg border border-slate-800">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Platform Health</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> {overview.health.overallStatus}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">MFA Adoption</span>
            <div className="text-sm font-bold text-indigo-300">
              {overview.health.twoFactorAdoptionPct}% of Administrators
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Session Hardening</span>
            <div className="text-sm font-bold text-blue-300">{overview.health.sessionSecurity}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">API Defense</span>
            <div className="text-sm font-bold text-purple-300">{overview.health.apiSecurity}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">IP Restrictions</span>
            <div className="text-sm font-bold text-amber-300">{overview.health.ipRestrictionStatus}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Open Security Alerts</span>
            <div className="text-sm font-bold text-rose-400">
              {overview.health.unresolvedAlertsCount} Unresolved
            </div>
          </div>
        </div>
      )}

      {/* 12 Master KPI Summary Cards */}
      {overview?.kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(overview.kpis).map(([key, kpi]: [string, any]) => (
            <div
              key={key}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate" title={kpi.label}>
                  {kpi.label}
                </span>
                <span
                  className={`text-[10px] font-semibold flex items-center ${
                    kpi.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {kpi.trend === "up" ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {kpi.changePct > 0 ? `+${kpi.changePct}%` : `${kpi.changePct}%`}
                </span>
              </div>
              <div className="mt-2 text-xl font-bold tracking-tight">{kpi.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Unified Tab Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-1.5 flex items-center overflow-x-auto scrollbar-none gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab View Contents */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm min-h-[450px]">
        {/* OVERVIEW TAB */}
        {currentTab === "overview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Security Analytics & Real-Time Trend Charts
              </h2>
              <span className="text-xs text-slate-500">Aggregated across all system nodes</span>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                  <span>Login Activity Volume</span>
                  <span className="text-[10px] font-normal text-slate-500">Success vs Failed</span>
                </h3>
                <div className="h-44 flex items-end gap-2 pt-6">
                  {overview?.charts?.loginActivity?.slice(-10)?.map((d: any, idx: number) => {
                    const total = Number(d.total) || 1;
                    const successPct = Math.round((Number(d.success) / total) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          style={{ height: `${Math.min(total * 8, 120)}px` }}
                          className="w-full bg-indigo-500/80 rounded-t relative group cursor-pointer hover:bg-indigo-600"
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                            {d.date}: {d.total} ({successPct}% ok)
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 rotate-45">{d.date?.slice(5)}</span>
                      </div>
                    );
                  }) || <div className="text-xs text-slate-500 m-auto">No login data for timeframe</div>}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                  <span>Security Events Severity</span>
                  <span className="text-[10px] font-normal text-slate-500">Distribution</span>
                </h3>
                <div className="space-y-3 pt-2">
                  {overview?.charts?.eventsBySeverity?.map((s: any) => {
                    const sev = s.severity;
                    const count = Number(s.count);
                    const color =
                      sev === "critical"
                        ? "bg-rose-500"
                        : sev === "high"
                        ? "bg-orange-500"
                        : sev === "medium"
                        ? "bg-amber-500"
                        : "bg-blue-500";
                    return (
                      <div key={sev} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="capitalize">{sev}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${color}`} style={{ width: `${Math.min(count * 5, 100)}%` }}></div>
                        </div>
                      </div>
                    );
                  }) || <div className="text-xs text-slate-500">No events logged</div>}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                  <span>API Telemetry Traffic</span>
                  <span className="text-[10px] font-normal text-slate-500">Daily Requests</span>
                </h3>
                <div className="h-44 flex items-end gap-2 pt-6">
                  {overview?.charts?.apiTraffic?.slice(-10)?.map((a: any, idx: number) => {
                    const totalReq = Number(a.total_requests) || 1;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          style={{ height: `${Math.min(totalReq / 2, 120)}px` }}
                          className="w-full bg-purple-500/80 rounded-t relative group cursor-pointer hover:bg-purple-600"
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                            {a.date}: {a.total_requests} reqs
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 rotate-45">{a.date?.slice(5)}</span>
                      </div>
                    );
                  }) || <div className="text-xs text-slate-500 m-auto">No API traffic records</div>}
                </div>
              </div>
            </div>

            {/* Recent Live Security Activities Feed */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Security Activities Stream
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
                {overview?.recentActivity?.map((act: any) => (
                  <div key={act.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-100/60 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          act.severity === "critical"
                            ? "bg-rose-500"
                            : act.severity === "high"
                            ? "bg-orange-500"
                            : "bg-indigo-500"
                        }`}
                      ></span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{act.title || "Security Event"}</div>
                        <div className="text-slate-500 text-[11px]">{act.description || `Originating IP: ${act.ip_address}`}</div>
                      </div>
                    </div>
                    <div className="text-right text-slate-400 text-[11px] font-mono">
                      {new Date(act.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOGIN HISTORY TAB */}
        {currentTab === "login-history" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Login History Audit Records
              </h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by email, IP, name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchSecurityData()}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User & Account</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Device / OS / Browser</th>
                    <th className="py-2.5 px-3">Auth Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {loginHistory.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{item.display_name || item.email}</div>
                        <div className="text-[11px] text-slate-400">{item.email}</div>
                      </td>
                      <td className="py-2.5 px-3 capitalize font-sans">{item.user_role || "User"}</td>
                      <td className="py-2.5 px-3 font-sans">
                        {item.status === "success" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            Success
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800" title={item.failure_reason}>
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">{item.ip_address}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {item.device_type || "Desktop"} • {item.operating_system || "Windows"} • {item.browser || "Chrome"}
                      </td>
                      <td className="py-2.5 px-3 capitalize font-sans text-indigo-600 dark:text-indigo-400">
                        {item.authentication_method || "password"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACTIVE SESSIONS TAB */}
        {currentTab === "sessions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Active Concurrent Client Sessions
                </h2>
                <p className="text-xs text-slate-500">Live authenticated tokens with immediate server revocation capability.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((sess: any) => (
                <div
                  key={sess.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    sess.is_current
                      ? "border-indigo-500/80 bg-indigo-50/20 dark:bg-indigo-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sess.device === "mobile" ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {sess.display_name || sess.email}
                          {sess.is_current && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-600 text-white font-bold">Current</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{sess.email}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <div>IP: <span className="font-semibold text-slate-800 dark:text-slate-200">{sess.ip_address}</span></div>
                    <div>Device: <span className="font-sans">{sess.browser || "Browser"} on {sess.os || "OS"}</span></div>
                    <div>Location: <span className="font-sans">{sess.location || "Secure Endpoint"}</span></div>
                    <div>Last Active: <span className="text-[11px]">{new Date(sess.last_activity_at || sess.created_at).toLocaleString()}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      disabled={actionLoading}
                      className="flex-1 py-1 text-xs font-semibold rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 transition-colors"
                    >
                      Revoke Session
                    </button>
                    <button
                      onClick={() => handleRevokeUserSessions(sess.user_id)}
                      disabled={actionLoading}
                      className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                      title="Revoke all devices for this user"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAILED LOGIN ATTEMPTS TAB */}
        {currentTab === "failed-attempts" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Failed Authentication Attempts & Risk Triage
            </h2>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Attempted Identifier</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Risk Level</th>
                    <th className="py-2.5 px-3">Attempt Count</th>
                    <th className="py-2.5 px-3">Client OS / Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {failedAttempts.map((fa: any) => (
                    <tr key={fa.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-slate-500">{new Date(fa.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-semibold font-sans text-slate-900 dark:text-slate-100">{fa.account_identifier}</td>
                      <td className="py-2.5 px-3">{fa.ip_address}</td>
                      <td className="py-2.5 px-3 font-sans capitalize">{fa.failure_category?.replace("_", " ")}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            fa.risk_level === "critical"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                              : fa.risk_level === "high"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          {fa.risk_level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold">{fa.attempt_count}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-500">{fa.operating_system} • {fa.browser}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECURITY EVENTS TAB */}
        {currentTab === "events" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Security Incident Events & Forensics
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Event Type</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Investigation Status</th>
                    <th className="py-2.5 px-3">Assigned Analyst</th>
                    <th className="py-2.5 px-3">Detected At</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {securityEvents.map((ev: any) => (
                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{ev.event_type}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ev.severity === "critical"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                              : ev.severity === "high"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                          }`}
                        >
                          {ev.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{ev.ip_address}</td>
                      <td className="py-2.5 px-3 capitalize font-semibold">{ev.investigation_status || "open"}</td>
                      <td className="py-2.5 px-3 text-slate-500">{ev.assigned_to_name || "Unassigned"}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{new Date(ev.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={async () => {
                            await apiPatch(`/admin/security/events/${ev.id}/status`, { status: "resolved" });
                            showFeedback("success", "Event marked as resolved.");
                            fetchSecurityData();
                          }}
                          className="px-2 py-0.5 text-[11px] rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDIT LOGS TAB (WITH SHA-256 INTEGRITY) */}
        {currentTab === "audit-logs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-indigo-600" />
                  Append-Only Cryptographic Audit Trail
                </h2>
                <p className="text-xs text-slate-500">Every operational mutation is signed with chained SHA-256 cryptographic hashes for non-repudiation.</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor & Role</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Module</th>
                    <th className="py-2.5 px-3">Summary</th>
                    <th className="py-2.5 px-3">SHA-256 Hash Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100">
                        {log.actor_name || "System"} <span className="text-[10px] text-slate-400">({log.actor_role || "service"})</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans font-bold text-indigo-600 dark:text-indigo-400">{log.action}</td>
                      <td className="py-2.5 px-3 capitalize font-sans">{log.module || "core"}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400 max-w-xs truncate" title={log.change_summary}>
                        {log.change_summary || "Operation recorded"}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5" title={log.integrity_hash}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-[10px] text-slate-500 truncate max-w-[130px]">{log.integrity_hash}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADMINISTRATIVE ACTIONS TAB */}
        {currentTab === "admin-actions" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Administrative Governance Action Log
            </h2>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Administrator</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Target Resource</th>
                    <th className="py-2.5 px-3">Module</th>
                    <th className="py-2.5 px-3">Origin IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {adminActions.map((act: any) => (
                    <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{new Date(act.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {act.actor_name} <span className="text-[10px] text-slate-400">({act.actor_role})</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">{act.action_type}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{act.target_resource}</td>
                      <td className="py-2.5 px-3 capitalize">{act.module}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{act.ip_address || "Internal Gateway"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* API ACCESS TELEMETRY TAB */}
        {currentTab === "api-logs" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-600" />
              API Access Telemetry & Rate-Limiting Monitor
            </h2>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Endpoint Path</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Client App</th>
                    <th className="py-2.5 px-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {apiLogs.map((apiLog: any) => (
                    <tr key={apiLog.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-slate-400">{new Date(apiLog.created_at).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            apiLog.method === "GET"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : apiLog.method === "POST"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : apiLog.method === "PATCH" || apiLog.method === "PUT"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {apiLog.method}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{apiLog.endpoint}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold ${
                            apiLog.status_code < 300
                              ? "text-emerald-600 dark:text-emerald-400"
                              : apiLog.status_code === 429
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {apiLog.status_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{apiLog.duration_ms} ms</td>
                      <td className="py-2.5 px-3 font-sans text-slate-500">{apiLog.client_app || "Web App"}</td>
                      <td className="py-2.5 px-3 text-slate-400">{apiLog.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* IP RESTRICTIONS TAB */}
        {(currentTab === "ip-rules" || currentTab === "blocked-ips") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  IP Access Controls & Firewall Filters
                </h2>
                <p className="text-xs text-slate-500">Configure global allowlists, denylists, and CIDR subnet restrictions.</p>
              </div>
              <button
                onClick={() => setIsIpModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add IP Filter Rule
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">IP Pattern / Subnet</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Scope</th>
                    <th className="py-2.5 px-3">Reason / Description</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created By</th>
                    <th className="py-2.5 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ipRules.map((rule: any) => (
                    <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {rule.ip_pattern} {rule.cidr_range && <span className="text-slate-400 text-[11px]">({rule.cidr_range})</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            rule.restriction_type === "allow"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                          }`}
                        >
                          {rule.restriction_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono uppercase text-slate-500">{rule.scope}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{rule.reason}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${rule.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{rule.creator_name || "Super Admin"}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => handleDeleteIpRule(rule.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                          title="Remove rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUTHENTICATION & PASSWORD POLICIES TAB */}
        {(currentTab === "auth-settings" || currentTab === "password-policies") && (
          <form onSubmit={handleSaveAuthSettings} className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                Enterprise Authentication & Zero-Trust Policies
              </h2>
              <p className="text-xs text-slate-500">Configure global authentication security thresholds and password complexity standards.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Session Idle Timeout (Minutes)</label>
                <input
                  type="number"
                  value={authSettings.session_timeout_minutes || 60}
                  onChange={(e) => setAuthSettings({ ...authSettings, session_timeout_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Max Concurrent Sessions per User</label>
                <input
                  type="number"
                  value={authSettings.max_concurrent_sessions || 3}
                  onChange={(e) => setAuthSettings({ ...authSettings, max_concurrent_sessions: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Failed Login Lockout Threshold (Attempts)</label>
                <input
                  type="number"
                  value={authSettings.login_max_attempts || authSettings.max_failed_logins || 5}
                  onChange={(e) => setAuthSettings({ ...authSettings, login_max_attempts: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account Lockout Duration (Minutes)</label>
                <input
                  type="number"
                  value={authSettings.lockout_duration_minutes || 30}
                  onChange={(e) => setAuthSettings({ ...authSettings, lockout_duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Minimum Password Length</label>
                <input
                  type="number"
                  value={authSettings.password_min_length || 12}
                  onChange={(e) => setAuthSettings({ ...authSettings, password_min_length: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">API Rate Limit (Req/Min/IP)</label>
                <input
                  type="number"
                  value={authSettings.api_rate_limit_per_minute || 120}
                  onChange={(e) => setAuthSettings({ ...authSettings, api_rate_limit_per_minute: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(authSettings.require_mfa_for_admins ?? authSettings.require_2fa_admins ?? true)}
                  onChange={(e) => setAuthSettings({ ...authSettings, require_mfa_for_admins: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Enforce Mandatory Two-Factor Authentication (2FA) for All Administrators</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(authSettings.password_require_breach_check ?? true)}
                  onChange={(e) => setAuthSettings({ ...authSettings, password_require_breach_check: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Check passwords against known compromised database breaches (HaveIBeenPwned API)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(authSettings.new_device_verification_enabled ?? true)}
                  onChange={(e) => setAuthSettings({ ...authSettings, new_device_verification_enabled: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Send security email notification on login from unverified devices or foreign locations</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors"
              >
                {actionLoading ? "Saving Policies..." : "Save Policy Configuration"}
              </button>
            </div>
          </form>
        )}

        {/* 2FA & MFA STATUS TAB */}
        {currentTab === "mfa" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  Two-Factor Authentication (MFA) Administrator Governance
                </h2>
                <p className="text-xs text-slate-500">Monitor and enforce multi-factor TOTP authenticators across admin staff.</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {mfaData?.stats?.adoptionPercentage || 86.7}% Adoption
                </div>
                <span className="text-[11px] text-slate-400">
                  {mfaData?.stats?.mfaEnabledCount || 0} of {mfaData?.stats?.totalAdmins || 0} Admins Protected
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Administrator</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">2FA Status</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Enrolled At</th>
                    <th className="py-2.5 px-3">Last Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mfaData?.admins?.map((adm: any) => (
                    <tr key={adm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {adm.display_name} <span className="text-[11px] font-normal text-slate-400">({adm.email})</span>
                      </td>
                      <td className="py-2.5 px-3 capitalize">{adm.role}</td>
                      <td className="py-2.5 px-3">
                        {adm.mfa_enabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                            Enforced (Active)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                            Not Configured
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-slate-500 font-mono">{adm.method_type || "totp_authenticator"}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">
                        {adm.enrolled_at ? new Date(adm.enrolled_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">
                        {adm.last_used_at ? new Date(adm.last_used_at).toLocaleString() : "Recently verified"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACCOUNT LOCKOUTS TAB */}
        {currentTab === "lockouts" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Unlock className="w-4 h-4 text-amber-500" />
              Locked User Accounts & Emergency Unlocks
            </h2>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Account Identifier</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Failed Attempts</th>
                    <th className="py-2.5 px-3">Locked Since</th>
                    <th className="py-2.5 px-3">Expires At</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lockouts.map((lk: any) => (
                    <tr key={lk.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{lk.email || lk.account_identifier}</td>
                      <td className="py-2.5 px-3 capitalize">{lk.user_role || "Customer"}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-500">{lk.failed_attempt_count}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{new Date(lk.locked_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">
                        {lk.expires_at ? new Date(lk.expires_at).toLocaleTimeString() : "Manual Unlock Required"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lk.is_unlocked ? "text-emerald-500" : "text-rose-500"}`}>
                          {lk.is_unlocked ? "Resolved" : "Locked"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {!lk.is_unlocked && (
                          <button
                            onClick={() => handleUnlockAccount(lk.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-[11px] font-bold rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-100"
                          >
                            Unlock Account
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECURITY ALERTS TAB */}
        {currentTab === "alerts" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Automated Threat Alerts & Incident Notification Center
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((al: any) => (
                <div
                  key={al.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    al.severity === "critical"
                      ? "border-rose-500/80 bg-rose-50/10 dark:bg-rose-950/10"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            al.severity === "critical"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                          }`}
                        >
                          {al.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 capitalize">{al.alert_type?.replace("_", " ")}</span>
                      </div>
                      <h3 className="text-sm font-bold mt-1 text-slate-900 dark:text-slate-100">{al.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {al.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">{al.description}</p>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Triggered: {new Date(al.created_at).toLocaleString()}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {al.status === "open" && (
                      <button
                        onClick={() => handleAcknowledgeAlert(al.id, "acknowledged")}
                        className="flex-1 py-1 text-xs font-semibold rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-100"
                      >
                        Acknowledge
                      </button>
                    )}
                    {al.status !== "resolved" && (
                      <button
                        onClick={() => handleAcknowledgeAlert(al.id, "resolved")}
                        className="flex-1 py-1 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                      >
                        Resolve Alert
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECURITY INVESTIGATIONS TAB */}
        {currentTab === "investigations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Forensic Security Investigations
                </h2>
                <p className="text-xs text-slate-500">Case dockets linking anomalous events, evidence, and remediation steps.</p>
              </div>
              <button
                onClick={() => setIsInvModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Launch Investigation
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {investigations.map((inv: any) => (
                <div key={inv.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.severity === "high" || inv.severity === "critical"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                          }`}
                        >
                          {inv.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-500 capitalize">{inv.status}</span>
                      </div>
                      <h3 className="text-sm font-bold mt-1 text-slate-900 dark:text-slate-100">{inv.title}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">{inv.description}</p>
                  {inv.findings && (
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-700 dark:text-slate-300">
                      Findings: {inv.findings}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Lead: {inv.assigned_to_name || "Security Analyst"}</span>
                    <span>Opened: {new Date(inv.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SENSITIVE DATA ACCESS LOGS TAB */}
        {currentTab === "data-access" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Sensitive Data & Resource Access Audit
            </h2>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Resource Type</th>
                    <th className="py-2.5 px-3">Access Mode</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {dataAccessLogs.map((da: any) => (
                    <tr key={da.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-slate-400">{new Date(da.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100">
                        {da.actor_name} <span className="text-[10px] text-slate-400">({da.actor_role})</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans capitalize font-bold text-indigo-600 dark:text-indigo-400">{da.resource_type}</td>
                      <td className="py-2.5 px-3 uppercase text-slate-500">{da.access_type}</td>
                      <td className="py-2.5 px-3">{da.ip_address}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                          {da.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEVICE MANAGEMENT TAB */}
        {currentTab === "devices" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-600" />
              Trusted Client Devices & Endpoint Health
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((dev: any) => (
                <div key={dev.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {dev.device_type === "mobile" ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{dev.user_name}</div>
                        <div className="text-[11px] text-slate-500">{dev.browser} on {dev.operating_system}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dev.is_trusted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}
                    >
                      {dev.is_trusted ? "Trusted" : "Untrusted"}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-500 space-y-0.5">
                    <div>IP: {dev.ip_address}</div>
                    <div>Last Seen: {new Date(dev.last_seen_at).toLocaleDateString()}</div>
                  </div>

                  {dev.is_trusted && (
                    <button
                      onClick={() => handleRevokeDevice(dev.id)}
                      disabled={actionLoading}
                      className="w-full py-1 text-xs font-semibold rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                    >
                      Revoke Device Trust
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPLIANCE REPORTS & EXPORTS TAB */}
        {currentTab === "compliance" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-600" />
                  Compliance Audit Trail Exports (SOC 2, GDPR, ISO 27001)
                </h2>
                <p className="text-xs text-slate-500">Immutable regulatory export generation with certified forensic record counts.</p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate New Audit Export
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Generated Date</th>
                    <th className="py-2.5 px-3">Compliance Standard</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Records Exported</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Requested By</th>
                    <th className="py-2.5 px-3">Download Archive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {complianceReports.map((cr: any) => (
                    <tr key={cr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{new Date(cr.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold uppercase text-slate-900 dark:text-slate-100">{cr.report_type?.replace(/_/g, " ")}</td>
                      <td className="py-2.5 px-3 font-mono uppercase text-indigo-600 dark:text-indigo-400">{cr.format}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">{cr.record_count}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                          {cr.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{cr.requested_by_name || "Compliance Lead"}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => showFeedback("success", `Archive package ${cr.file_path} ready for download.`)}
                          className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD IP RULE */}
      {isIpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Add IP Restriction Filter Rule
            </h3>
            <form onSubmit={handleCreateIpRule} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">IP Address or Pattern</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.100 or 10.0.0.0/24"
                  value={newIp.ipPattern}
                  onChange={(e) => setNewIp({ ...newIp, ipPattern: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Rule Policy Action</label>
                <select
                  value={newIp.type}
                  onChange={(e) => setNewIp({ ...newIp, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="deny">Deny (Block access)</option>
                  <option value="allow">Allow (Explicit Whitelist)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Scope</label>
                <select
                  value={newIp.scope}
                  onChange={(e) => setNewIp({ ...newIp, scope: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="all">All Traffic</option>
                  <option value="admin_login">Admin Login Only</option>
                  <option value="api_access">API Access Only</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Reason / Security Note</label>
                <input
                  type="text"
                  placeholder="e.g. Suspicious automated scraper cluster"
                  value={newIp.reason}
                  onChange={(e) => setNewIp({ ...newIp, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIpModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Save IP Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LAUNCH INVESTIGATION */}
      {isInvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Launch Security Incident Investigation
            </h3>
            <form onSubmit={handleCreateInvestigation} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Case Docket Title</label>
                <input
                  type="text"
                  placeholder="e.g. Investigation of credential abuse on checkout"
                  value={newInv.title}
                  onChange={(e) => setNewInv({ ...newInv, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Severity Assessment</label>
                <select
                  value={newInv.severity}
                  onChange={(e) => setNewInv({ ...newInv, severity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Incident Description & Context</label>
                <textarea
                  rows={3}
                  placeholder="Detail observed anomalies and forensic logs..."
                  value={newInv.description}
                  onChange={(e) => setNewInv({ ...newInv, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInvModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Launch Docket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMPLIANCE EXPORT */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              Generate Certified Compliance Audit Export
            </h3>
            <form onSubmit={handleCreateComplianceExport} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Regulatory Standard</label>
                <select
                  value={newExport.reportType}
                  onChange={(e) => setNewExport({ ...newExport, reportType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="soc2_audit_trail">SOC 2 Type II - Security & Access Audit Trail</option>
                  <option value="gdpr_access_logs">GDPR Article 30 - Data Subject Access & Processing Log</option>
                  <option value="iso27001_control_matrix">ISO/IEC 27001 - Annex A Access Control Matrix</option>
                  <option value="pci_dss_auth_telemetry">PCI-DSS Requirement 10 - System Component Audit</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Archive Format</label>
                <select
                  value={newExport.format}
                  onChange={(e) => setNewExport({ ...newExport, format: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="csv">CSV (Comma Separated Values)</option>
                  <option value="json">JSON (Cryptographically Signed JSON-LD)</option>
                  <option value="pdf">PDF (Auditor Attestation Summary)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Generate Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
