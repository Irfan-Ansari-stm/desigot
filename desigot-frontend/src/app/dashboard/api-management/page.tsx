"use client";

import React, { Suspense, useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Cpu,
  Key,
  CreditCard,
  Mail,
  HardDrive,
  Webhook,
  Layers,
  Terminal,
  BookOpen,
  Settings,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Download,
  Plus,
  Trash2,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Shield,
  Send,
  Zap,
  Globe,
  Activity,
  Server
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

export default function ApiManagementPage() {
  return (
    <Suspense fallback={<IntegrationsLoadingSkeleton />}>
      <ApiManagementContent />
    </Suspense>
  );
}

function IntegrationsLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        ))}
      </div>
      <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
    </div>
  );
}

function ApiManagementContent() {
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
  const [integrationsList, setIntegrationsList] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<any[]>([]);
  const [emailProviders, setEmailProviders] = useState<any[]>([]);
  const [storageProviders, setStorageProviders] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<any[]>([]);
  const [externalServices, setExternalServices] = useState<any[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<any[]>([]);
  const [apiDocs, setApiDocs] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [envFilter, setEnvFilter] = useState<string>("all");

  // Modals & Drawers
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isWhModalOpen, setIsWhModalOpen] = useState<boolean>(false);
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState<boolean>(false);
  const [testEmailTarget, setTestEmailTarget] = useState<string>("");
  const [activeEmailProvId, setActiveEmailProvId] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<{ label: string; secret: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // New Key Form State
  const [newKey, setNewKey] = useState({
    name: "",
    environment: "production",
    scopes: ["orders:read", "products:read"],
    rateLimitRpm: 120,
    appName: ""
  });

  // New Webhook Form State
  const [newWh, setNewWh] = useState({
    name: "",
    url: "",
    events: ["order.created", "payment.succeeded"],
    environment: "production"
  });

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleTabChange = (tabKey: string) => {
    startTransition(() => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", tabKey);
      router.push(`/dashboard/api-management?${p.toString()}`);
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const fetchIntegrationsData = async () => {
    setLoading(true);
    try {
      if (currentTab === "overview") {
        const res = await apiGet<any>("/admin/integrations/overview", { period });
        setOverview(res);
      } else if (currentTab === "keys") {
        const res = await apiGet<any>("/admin/integrations/api-keys", {
          environment: envFilter !== "all" ? envFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined
        });
        setApiKeys(res?.keys || (Array.isArray(res) ? res : []));
      } else if (currentTab === "payments") {
        const res = await apiGet<any>("/admin/integrations/payments");
        setPaymentGateways(res?.gateways || (Array.isArray(res) ? res : []));
      } else if (currentTab === "email") {
        const res = await apiGet<any>("/admin/integrations/email");
        setEmailProviders(res?.providers || (Array.isArray(res) ? res : []));
      } else if (currentTab === "storage") {
        const res = await apiGet<any>("/admin/integrations/storage");
        setStorageProviders(res?.storages || (Array.isArray(res) ? res : []));
      } else if (currentTab === "webhooks") {
        const [whRes, delivRes] = await Promise.all([
          apiGet<any>("/admin/integrations/webhooks", { search: searchTerm || undefined }),
          apiGet<any>("/admin/integrations/webhooks/deliveries", { limit: 15 })
        ]);
        setWebhooks(whRes?.webhooks || (Array.isArray(whRes) ? whRes : []));
        setWebhookDeliveries(delivRes?.data || delivRes?.deliveries || (Array.isArray(delivRes) ? delivRes : []));
      } else if (currentTab === "external-services") {
        const res = await apiGet<any>("/admin/integrations/external-services");
        setExternalServices(res?.services || (Array.isArray(res) ? res : []));
      } else if (currentTab === "logs") {
        const res = await apiGet<any>("/admin/integrations/logs", {
          period,
          search: searchTerm || undefined
        });
        setIntegrationLogs(res?.data || res?.logs || (Array.isArray(res) ? res : []));
      } else if (currentTab === "docs") {
        const res = await apiGet<any>("/admin/integrations/documentation");
        setApiDocs(res);
      } else if (currentTab === "settings") {
        const res = await apiGet<any>("/admin/integrations/settings");
        setSettings(res?.settings || res || {});
      }
    } catch (err: any) {
      console.error("Failed to load integrations data:", err);
      showFeedback("error", err?.response?.data?.message || err?.message || "Failed to load integration records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrationsData();
  }, [currentTab, period, envFilter, statusFilter]);

  // Actions
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiPost<any>("/admin/integrations/api-keys", newKey);
      setIsKeyModalOpen(false);
      setRevealedSecret({ label: `New API Key: ${res.name}`, secret: res.plainTextSecret });
      setNewKey({ name: "", environment: "production", scopes: ["orders:read", "products:read"], rateLimitRpm: 120, appName: "" });
      fetchIntegrationsData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to create API key.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRotateApiKey = async (id: string, name: string) => {
    if (!confirm(`Rotate secret for "${name}"? The existing key will cease functioning immediately.`)) return;
    setActionLoading(true);
    try {
      const res = await apiPost<any>(`/admin/integrations/api-keys/${id}/rotate`);
      setRevealedSecret({ label: `Rotated Key Secret: ${name}`, secret: res.newPlainTextSecret });
      fetchIntegrationsData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to rotate API key.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeApiKey = async (id: string, name: string) => {
    if (!confirm(`Revoke API key "${name}" permanently?`)) return;
    setActionLoading(true);
    try {
      await apiPost(`/admin/integrations/api-keys/${id}/revoke`);
      showFeedback("success", `API key "${name}" revoked.`);
      fetchIntegrationsData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to revoke API key.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestPayment = async (id: string, provider: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/admin/integrations/payments/${id}/test`);
      showFeedback("success", `Connection verified for ${provider}. Operational.`);
      fetchIntegrationsData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Payment gateway connection test failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmailProvId || !testEmailTarget) return;
    setActionLoading(true);
    try {
      const res = await apiPost<any>(`/admin/integrations/email/${activeEmailProvId}/send-test`, {
        toEmail: testEmailTarget
      });
      showFeedback("success", `Test email dispatched to ${testEmailTarget} (ID: ${res.messageId}).`);
      setIsTestEmailModalOpen(false);
      setTestEmailTarget("");
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to send test email.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestStorage = async (id: string, bucket: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/admin/integrations/storage/${id}/test`);
      showFeedback("success", `Storage bucket "${bucket}" accessible and healthy.`);
      fetchIntegrationsData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Storage connection test failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiPost<any>("/admin/integrations/webhooks", newWh);
      setIsWhModalOpen(false);
      setRevealedSecret({ label: `Webhook Signing Secret: ${res.name}`, secret: res.signingSecret });
      setNewWh({ name: "", url: "", events: ["order.created", "payment.succeeded"], environment: "production" });
      fetchIntegrationsData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to create webhook.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestWebhook = async (id: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/admin/integrations/webhooks/${id}/test`);
      showFeedback("success", "Test event ping dispatched to webhook endpoint.");
      fetchIntegrationsData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Webhook test ping failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/admin/integrations/webhooks/deliveries/${deliveryId}/retry`);
      showFeedback("success", "Webhook delivery retry processed.");
      fetchIntegrationsData();
    } catch (err: any) {
      showFeedback("error", err?.message || "Webhook retry failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestExternal = async (id: string, serviceName: string) => {
    setActionLoading(true);
    try {
      await apiPost(`/admin/integrations/external-services/${id}/test`);
      showFeedback("success", `Health verified for ${serviceName}. Operational.`);
      fetchIntegrationsData();
    } catch (err: any) {
      showFeedback("error", err?.message || "External service ping failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiPatch("/admin/integrations/settings", settings);
      showFeedback("success", "Integration & API threshold settings saved.");
    } catch (err: any) {
      showFeedback("error", err?.message || "Failed to update integration settings.");
    } finally {
      setActionLoading(false);
    }
  };

  // Tab definitions
  const tabs = [
    { key: "overview", label: "Overview", icon: Activity, badge: null },
    { key: "keys", label: "API Keys", icon: Key, badge: overview?.kpis?.activeApiKeys?.value ?? null },
    { key: "payments", label: "Payment Gateways", icon: CreditCard, badge: overview?.kpis?.paymentGatewayStatus?.provider ?? null },
    { key: "email", label: "Email Integrations", icon: Mail, badge: null },
    { key: "storage", label: "Cloud Storage", icon: HardDrive, badge: null },
    { key: "webhooks", label: "Webhooks", icon: Webhook, badge: overview?.kpis?.webhookDeliveries?.value ?? null },
    { key: "external-services", label: "External Services", icon: Layers, badge: null },
    { key: "logs", label: "Integration Logs", icon: Terminal, badge: null },
    { key: "docs", label: "API Documentation", icon: BookOpen, badge: "OpenAPI 3" },
    { key: "settings", label: "Settings", icon: Settings, badge: null }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6 text-slate-900 dark:text-slate-100">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-rose-600 text-white shadow-rose-500/20"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Secret Revelation Banner Modal */}
      {revealedSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <Key className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{revealedSecret.label}</h3>
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
              CRITICAL: Copy this plaintext secret now. It is cryptographically hashed and will never be shown again!
            </p>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <code className="text-xs font-mono font-bold break-all text-indigo-700 dark:text-indigo-300">
                {revealedSecret.secret}
              </code>
              <button
                onClick={() => copyToClipboard(revealedSecret.secret)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border shadow-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 shrink-0"
                title="Copy secret"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => setRevealedSecret(null)}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
            >
              I Have Stored the Secret Safely
            </button>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Integrations & API Control Center</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800">
                Super Admin
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                Live Gateway Active
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Manage payment processors, cloud storage adapters, email dispatchers, webhooks, and REST telemetry.
            </p>
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
            onClick={() => fetchIntegrationsData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate API Key
          </button>
        </div>
      </div>

      {/* Integration Health Grid Summary Banner */}
      {overview?.healthGrid && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg border border-slate-800">
          {overview.healthGrid.map((h: any, idx: number) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-[11px] text-slate-400 font-medium truncate block">{h.service}</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">{h.status}</span>
              </div>
              <span className="text-[10px] text-indigo-300 font-mono block">
                {h.latency} • {h.uptime}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 15 Master KPI Metrics Cards */}
      {overview?.kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(overview.kpis).map(([key, kpi]: [string, any]) => {
            const isNumeric = typeof kpi?.value === "number";
            return (
              <div
                key={key}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate" title={kpi.label}>
                    {kpi.label}
                  </span>
                  {isNumeric && (
                    <span
                      className={`text-[10px] font-semibold flex items-center ${
                        kpi.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {kpi.trend === "up" ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {kpi.changePct > 0 ? `+${kpi.changePct}%` : `${kpi.changePct}%`}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight truncate">
                  {isNumeric ? kpi.value.toLocaleString() : kpi.value}
                </div>
                {kpi.provider && (
                  <div className="text-[10px] text-slate-400 truncate mt-1">Provider: {kpi.provider}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Navigation Tab Bar */}
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

      {/* Tab Contents Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm min-h-[460px]">
        {/* OVERVIEW TAB */}
        {currentTab === "overview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                API Traffic Analytics & System Response Latency
              </h2>
              <span className="text-xs text-slate-500">Live metrics derived from application database</span>
            </div>

            {/* 3 Main Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                  <span>API Traffic Trends (14d)</span>
                  <span className="text-[10px] text-slate-500">Success vs Error</span>
                </h3>
                <div className="h-44 flex items-end gap-2 pt-6">
                  {overview?.charts?.requestsOverTime?.map((d: any, idx: number) => {
                    const total = Number(d.total) || 1;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          style={{ height: `${Math.min(total / 35, 120)}px` }}
                          className="w-full bg-indigo-500/80 rounded-t relative group cursor-pointer hover:bg-indigo-600"
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                            {d.date?.slice(5)}: {d.total} reqs
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 rotate-45">{d.date?.slice(5)}</span>
                      </div>
                    );
                  }) || <div className="text-xs text-slate-500 m-auto">No traffic logged</div>}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                  <span>Requests by Service Type</span>
                  <span className="text-[10px] text-slate-500">Volume</span>
                </h3>
                <div className="space-y-3 pt-2">
                  {overview?.charts?.requestsByIntegration?.map((s: any) => {
                    const count = Number(s.count);
                    return (
                      <div key={s.service_type} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="capitalize">{s.service_type?.replace(/_/g, " ")}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${Math.min(count / 2, 100)}%` }}></div>
                        </div>
                      </div>
                    );
                  }) || <div className="text-xs text-slate-500">No integration logs</div>}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                  <span>Webhook Deliveries (14d)</span>
                  <span className="text-[10px] text-slate-500">Delivery Status</span>
                </h3>
                <div className="h-44 flex items-end gap-2 pt-6">
                  {overview?.charts?.webhookDeliveryTrends?.map((w: any, idx: number) => {
                    const total = Number(w.total) || 1;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          style={{ height: `${Math.min(total * 8, 120)}px` }}
                          className="w-full bg-purple-500/80 rounded-t relative group cursor-pointer hover:bg-purple-600"
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                            {w.date?.slice(5)}: {w.total} delivs
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 rotate-45">{w.date?.slice(5)}</span>
                      </div>
                    );
                  }) || <div className="text-xs text-slate-500 m-auto">No webhook activity</div>}
                </div>
              </div>
            </div>

            {/* Recent Integration Activity Stream */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Integration Activity Stream
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
                {overview?.recentActivity?.map((act: any) => (
                  <div key={act.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-100/60 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200 dark:bg-slate-800">
                        {act.http_method || "POST"}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {act.service_type?.toUpperCase()} • {act.provider?.toUpperCase()}
                        </div>
                        <div className="text-slate-500 text-[11px] font-mono truncate max-w-md">{act.endpoint}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold font-mono ${
                          act.response_status < 400
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {act.response_status}
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {new Date(act.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* API KEYS TAB */}
        {currentTab === "keys" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  API Keys & Credentials Governance
                </h2>
                <p className="text-xs text-slate-500">Cryptographically secure key hashes with scoped permissions and IP firewall filters.</p>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate New Key
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Key Name & App</th>
                    <th className="py-2.5 px-3">Key Prefix</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Environment</th>
                    <th className="py-2.5 px-3">Scopes</th>
                    <th className="py-2.5 px-3">Rate Limit</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Last Used</th>
                    <th className="py-2.5 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {apiKeys.map((key: any) => (
                    <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{key.name}</div>
                        <div className="text-[11px] text-slate-400">{key.app_name || "Desigot Partner Client"}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">{key.key_prefix}</td>
                      <td className="py-2.5 px-3 font-sans capitalize text-slate-600 dark:text-slate-400">
                        {key.key_type?.replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            key.environment === "production"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                          }`}
                        >
                          {key.environment}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="text-[11px] text-slate-500 font-mono" title={JSON.stringify(key.scopes)}>
                          {Array.isArray(key.scopes) ? key.scopes.join(", ") : "*"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-bold">{key.rate_limit_rpm} rpm</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            key.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          }`}
                        >
                          {key.is_active ? "Active" : "Revoked"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-1.5">
                          {key.is_active && (
                            <>
                              <button
                                onClick={() => handleRotateApiKey(key.id, key.name)}
                                className="px-2 py-0.5 text-[11px] rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                              >
                                Rotate
                              </button>
                              <button
                                onClick={() => handleRevokeApiKey(key.id, key.name)}
                                className="px-2 py-0.5 text-[11px] rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-800 hover:bg-rose-100"
                              >
                                Revoke
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYMENT INTEGRATIONS TAB */}
        {currentTab === "payments" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Payment Gateway Adapters & Processing Channels
              </h2>
              <p className="text-xs text-slate-500">Connected payment processors with live transaction status, currency mappings, and webhook signatures.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentGateways.map((gw: any) => (
                <div key={gw.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{gw.name}</h3>
                        {gw.is_default && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-600 text-white font-bold">Default</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono capitalize">{gw.provider} Gateway</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        gw.health_status === "operational"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      }`}
                    >
                      {gw.health_status || "Operational"}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div>Environment: <span className="font-semibold uppercase text-slate-800 dark:text-slate-200">{gw.environment}</span></div>
                    <div>Currencies: <span className="font-mono text-[11px]">{Array.isArray(gw.supported_currencies) ? gw.supported_currencies.join(", ") : "USD, EUR, INR"}</span></div>
                    <div>Status: <span className="font-bold text-emerald-600 dark:text-emerald-400">{gw.is_active ? "Connected & Active" : "Disabled"}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleTestPayment(gw.id, gw.name)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1.5"
                    >
                      <Zap className="w-3 h-3" /> Test Connection
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {gw.last_health_check_at ? `Checked: ${new Date(gw.last_health_check_at).toLocaleTimeString()}` : "Active"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMAIL INTEGRATIONS TAB */}
        {currentTab === "email" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                Email Dispatch Providers & Transactional Relays
              </h2>
              <p className="text-xs text-slate-500">Configure SMTP servers, SendGrid, Amazon SES, and Resend with live delivery monitoring.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emailProviders.map((em: any) => (
                <div key={em.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{em.sender_name}</h3>
                        {em.is_default && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-600 text-white font-bold">Default Provider</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{em.sender_email}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      Operational
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs">
                    <div>Daily Quota: <span className="font-bold">{em.daily_limit?.toLocaleString()}</span></div>
                    <div>Sent Today: <span className="font-bold text-indigo-600 dark:text-indigo-400">{em.sent_today?.toLocaleString()}</span></div>
                    <div>Bounces: <span className="font-bold text-amber-600">{em.bounces_count}</span></div>
                    <div>Complaints: <span className="font-bold text-rose-600">{em.complaints_count}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveEmailProvId(em.id);
                        setIsTestEmailModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" /> Send Test Email
                    </button>
                    <span className="text-[11px] text-slate-500 font-mono">{em.smtp_host}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLOUD STORAGE TAB */}
        {currentTab === "storage" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                Cloud Object Storage Repositories & CDNs
              </h2>
              <p className="text-xs text-slate-500">Configure Amazon S3, Cloudflare R2, and local development repositories with secure signed URL access.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {storageProviders.map((st: any) => {
                const usedGb = Math.round(Number(st.used_bytes || 0) / 1073741824);
                const quotaGb = Number(st.storage_quota_gb || 500);
                const pct = Math.min(Math.round((usedGb / quotaGb) * 100), 100);

                return (
                  <div key={st.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{st.bucket_name}</h3>
                          {st.is_default && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-600 text-white font-bold">Primary</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono uppercase">{st.provider} • {st.region}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        Active
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Storage Used:</span>
                        <span className="font-bold">{usedGb} GB / {quotaGb} GB ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="text-[11px] text-slate-400 pt-1">Total Files: {st.total_files?.toLocaleString()}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleTestStorage(st.id, st.bucket_name)}
                        disabled={actionLoading}
                        className="w-full py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3 h-3" /> Test Bucket Access
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEBHOOKS TAB */}
        {currentTab === "webhooks" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-indigo-600" />
                  Webhook Event Dispatchers & Subscriptions
                </h2>
                <p className="text-xs text-slate-500">Real-time asynchronous HMAC-SHA256 signed event delivery to external consumers.</p>
              </div>
              <button
                onClick={() => setIsWhModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Register Webhook Endpoint
              </button>
            </div>

            {/* Endpoints Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Endpoint Name & URL</th>
                    <th className="py-2.5 px-3">Subscribed Events</th>
                    <th className="py-2.5 px-3">Environment</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Deliveries</th>
                    <th className="py-2.5 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {webhooks.map((wh: any) => (
                    <tr key={wh.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{wh.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 max-w-sm truncate">{wh.url}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {Array.isArray(wh.events) ? wh.events.join(", ") : "All Events"}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-slate-500 font-semibold">{wh.environment}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            wh.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          }`}
                        >
                          {wh.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {wh.total_deliveries || 0}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => handleTestWebhook(wh.id)}
                          className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                        >
                          Ping Test
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Delivery History */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recent Webhook Event Delivery History
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Event Type</th>
                      <th className="py-2.5 px-3">Attempt</th>
                      <th className="py-2.5 px-3">Response Status</th>
                      <th className="py-2.5 px-3">Latency</th>
                      <th className="py-2.5 px-3">Delivery Status</th>
                      <th className="py-2.5 px-3 font-sans">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {webhookDeliveries.map((deliv: any) => (
                      <tr key={deliv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 text-slate-400">{new Date(deliv.created_at).toLocaleTimeString()}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{deliv.event_type}</td>
                        <td className="py-2.5 px-3">{deliv.attempt_number}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">{deliv.response_status}</td>
                        <td className="py-2.5 px-3 text-slate-500">{deliv.duration_ms} ms</td>
                        <td className="py-2.5 px-3 font-sans capitalize">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              deliv.status === "delivered"
                                ? "text-emerald-600"
                                : deliv.status === "retrying"
                                ? "text-amber-600"
                                : "text-rose-600"
                            }`}
                          >
                            {deliv.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          {deliv.status !== "delivered" && (
                            <button
                              onClick={() => handleRetryDelivery(deliv.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300"
                            >
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EXTERNAL SERVICES TAB */}
        {currentTab === "external-services" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Third-Party Platform Adapters & Connectors
              </h2>
              <p className="text-xs text-slate-500">Configured external services spanning Maps, SMS, Analytics, Search, and AI.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {externalServices.map((ext: any) => (
                <div key={ext.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{ext.service_name}</h3>
                      <span className="text-xs text-slate-400 font-mono uppercase">{ext.category} • {ext.provider}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      Operational
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-mono">
                    Last Health Ping: {ext.last_ping_at ? new Date(ext.last_ping_at).toLocaleTimeString() : "Recent"}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleTestExternal(ext.id, ext.service_name)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1.5"
                    >
                      <Zap className="w-3 h-3" /> Verify Service Health
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTEGRATION LOGS TAB */}
        {currentTab === "logs" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-600" />
                Live Structured Integration Request Telemetry
              </h2>
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by endpoint, request ID, provider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchIntegrationsData()}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Endpoint</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {integrationLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-slate-400">{new Date(log.occurred_at).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3 uppercase text-slate-500 font-bold">{log.service_type}</td>
                      <td className="py-2.5 px-3 font-sans font-bold text-indigo-600 dark:text-indigo-400">{log.provider}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800">
                          {log.http_method}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 max-w-xs truncate" title={log.endpoint}>
                        {log.endpoint}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className={log.response_status < 400 ? "text-emerald-500" : "text-rose-500"}>
                          {log.response_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{log.duration_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* API DOCUMENTATION TAB */}
        {currentTab === "docs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Desigot Enterprise REST API Directory & OpenAPI 3.0 Specification
                </h2>
                <p className="text-xs text-slate-500">Synchronized directly with backend API schemas and security requirements.</p>
              </div>
              <a
                href="/api/v1/admin/integrations/documentation/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Download className="w-3.5 h-3.5" />
                Download OpenAPI Spec
              </a>
            </div>

            <div className="space-y-3">
              {apiDocs?.endpointDirectory?.map((ep: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        ep.method === "GET"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : ep.method === "POST"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{ep.path}</span>
                    <span className="text-slate-400 font-sans">• {ep.description}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                    {ep.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {currentTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                Global Integration & API Gateway Policies
              </h2>
              <p className="text-xs text-slate-500">Configure global request timeouts, retry backoff algorithms, and log archival retention.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Default API Request Timeout (ms)</label>
                <input
                  type="number"
                  value={settings.default_api_timeout_ms || 15000}
                  onChange={(e) => setSettings({ ...settings, default_api_timeout_ms: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Default Retry Attempts on Network Failure</label>
                <input
                  type="number"
                  value={settings.default_retry_attempts || 3}
                  onChange={(e) => setSettings({ ...settings, default_retry_attempts: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Webhook Delivery Timeout (Seconds)</label>
                <input
                  type="number"
                  value={settings.webhook_timeout_seconds || 15}
                  onChange={(e) => setSettings({ ...settings, webhook_timeout_seconds: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Detailed Request Log Retention (Days)</label>
                <input
                  type="number"
                  value={settings.integration_logs_retention_days || 90}
                  onChange={(e) => setSettings({ ...settings, integration_logs_retention_days: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors"
              >
                {actionLoading ? "Saving Policies..." : "Save Gateway Policies"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* MODAL: CREATE API KEY */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" />
              Generate Enterprise API Key
            </h3>
            <form onSubmit={handleCreateApiKey} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Key Description / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile App Gateway Key"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Application Name</label>
                <input
                  type="text"
                  placeholder="e.g. Desigot Client iOS"
                  value={newKey.appName}
                  onChange={(e) => setNewKey({ ...newKey, appName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Environment</label>
                <select
                  value={newKey.environment}
                  onChange={(e) => setNewKey({ ...newKey, environment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="production">Production (desigot_live_)</option>
                  <option value="sandbox">Sandbox (desigot_test_)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Rate Limit (Requests per Minute)</label>
                <input
                  type="number"
                  value={newKey.rateLimitRpm}
                  onChange={(e) => setNewKey({ ...newKey, rateLimitRpm: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER WEBHOOK */}
      {isWhModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Webhook className="w-4 h-4 text-indigo-600" />
              Register Webhook Endpoint
            </h3>
            <form onSubmit={handleCreateWebhook} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Endpoint Name</label>
                <input
                  type="text"
                  placeholder="e.g. Partner Inventory Sync"
                  value={newWh.name}
                  onChange={(e) => setNewWh({ ...newWh, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Destination URL (HTTPS)</label>
                <input
                  type="url"
                  placeholder="https://api.partner.com/webhooks/orders"
                  value={newWh.url}
                  onChange={(e) => setNewWh({ ...newWh, url: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Environment</label>
                <select
                  value={newWh.environment}
                  onChange={(e) => setNewWh({ ...newWh, environment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="production">Production</option>
                  <option value="sandbox">Sandbox / Testing</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWhModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SEND TEST EMAIL */}
      {isTestEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              Dispatch Live Test Message
            </h3>
            <form onSubmit={handleSendTestEmail} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  placeholder="admin@desigot.com"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestEmailModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Dispatch Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
