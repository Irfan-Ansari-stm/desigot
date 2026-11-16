"use client";

import React, { Suspense, useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Settings,
  Store,
  Coins,
  Globe2,
  Clock,
  Percent,
  Receipt,
  Shield,
  Mail,
  HardDrive,
  Search,
  AlertOctagon,
  Flag,
  Database,
  Activity,
  History,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Cpu,
  Server,
  Zap,
  Check,
  Send,
  Eye,
  Lock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sliders,
  DollarSign,
  Download,
  UploadCloud,
  X
} from "lucide-react";
import { apiGet, apiPatch, apiPost, apiDelete, apiPut } from "@/lib/api";

export default function SystemSettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <SystemSettingsContent />
    </Suspense>
  );
}

function SettingsLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        ))}
      </div>
      <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
    </div>
  );
}

type TabType =
  | "general"
  | "marketplace"
  | "currency"
  | "language"
  | "timezone"
  | "commissions"
  | "tax"
  | "auth"
  | "email"
  | "storage"
  | "seo"
  | "maintenance"
  | "feature-flags"
  | "backup"
  | "health"
  | "history";

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General & Branding", icon: Settings },
  { id: "marketplace", label: "Marketplace Rules", icon: Store },
  { id: "currency", label: "Currencies & FX", icon: Coins },
  { id: "language", label: "Languages & RTL", icon: Globe2 },
  { id: "timezone", label: "Timezones & Formats", icon: Clock },
  { id: "commissions", label: "Commissions", icon: Percent },
  { id: "tax", label: "Tax Configuration", icon: Receipt },
  { id: "auth", label: "Auth & Security", icon: Shield },
  { id: "email", label: "Email Dispatch", icon: Mail },
  { id: "storage", label: "Cloud Storage", icon: HardDrive },
  { id: "seo", label: "SEO & Sitemaps", icon: Search },
  { id: "maintenance", label: "Maintenance Mode", icon: AlertOctagon },
  { id: "feature-flags", label: "Feature Flags", icon: Flag },
  { id: "backup", label: "Backup & Restore", icon: Database },
  { id: "health", label: "System Health", icon: Activity },
  { id: "history", label: "Audit & Rollbacks", icon: History }
];

function SystemSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") as TabType;
  const currentTab: TabType = TABS.some((t) => t.id === rawTab) ? rawTab : "general";

  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Global Settings Dictionary from API
  const [allSettings, setAllSettings] = useState<Record<string, Record<string, any>>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Tab-Specific Records
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [timezones, setTimezones] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [backupData, setBackupData] = useState<{ backups: any[]; schedules: any[]; restores: any[] }>({
    backups: [],
    schedules: [],
    restores: []
  });
  const [healthData, setHealthData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<{ history: any[]; total: number }>({ history: [], total: 0 });

  // Interactive Calculators State
  const [commSim, setCommSim] = useState({ amount: 10000, type: "service", result: null as any });
  const [taxSim, setTaxSim] = useState({ amount: 1000, type: "gst", isInclusive: false, result: null as any });

  // Modals
  const [currencyModal, setCurrencyModal] = useState(false);
  const [currencyForm, setCurrencyForm] = useState({ name: "", code: "", symbol: "", exchange_rate: 1.0, precision: 2, position: "before" });
  const [langModal, setLangModal] = useState(false);
  const [langForm, setLangForm] = useState({ name: "", code: "", native_name: "", direction: "ltr" });
  const [flagModal, setFlagModal] = useState(false);
  const [flagForm, setFlagForm] = useState({ key: "", name: "", description: "", is_enabled: true, rollout_percentage: 100, category: "marketplace" });
  const [commModal, setCommModal] = useState(false);
  const [commForm, setCommForm] = useState({ name: "", rule_type: "service", percentage_rate: 10.0, priority: 1, min_commission_cents: 0, max_commission_cents: 0 });
  const [taxModal, setTaxModal] = useState(false);
  const [taxForm, setTaxForm] = useState({ name: "", tax_type: "gst", tax_percentage: 18.0, country_code: "IN", state_region: "", is_inclusive: false });
  const [testEmailModal, setTestEmailModal] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState("admin@example.com");

  const setTab = (tab: TabType) => {
    startTransition(() => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", tab);
      router.push(`/dashboard/system/general?${p.toString()}`);
    });
  };

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [settingsRes, currRes, langRes, tzRes, commRes, taxRes, flagsRes, backupsRes, healthRes, histRes] =
        await Promise.all([
          apiGet<any>("/admin/settings").catch(() => ({ data: {} })),
          apiGet<any>("/admin/settings/currencies").catch(() => ({ data: [] })),
          apiGet<any>("/admin/settings/languages").catch(() => ({ data: [] })),
          apiGet<any>("/admin/settings/timezones").catch(() => ({ data: [] })),
          apiGet<any>("/admin/settings/commissions").catch(() => ({ data: [] })),
          apiGet<any>("/admin/settings/taxes").catch(() => ({ data: [] })),
          apiGet<any>("/admin/settings/feature-flags").catch(() => ({ data: [] })),
          apiGet<any>("/admin/settings/backups").catch(() => ({ data: { backups: [], schedules: [], restores: [] } })),
          apiGet<any>("/admin/settings/health").catch(() => ({ data: null })),
          apiGet<any>("/admin/settings/history?limit=30").catch(() => ({ data: { history: [], total: 0 } }))
        ]);

      const sData = settingsRes?.data || {};
      setAllSettings(sData);

      // Flatten settings for form state
      const flat: Record<string, any> = {};
      Object.keys(sData).forEach((grp) => {
        Object.keys(sData[grp]).forEach((k) => {
          flat[k] = sData[grp][k].value;
        });
      });
      setFormData(flat);

      setCurrencies(currRes?.data || []);
      setLanguages(langRes?.data || []);
      setTimezones(tzRes?.data || []);
      setCommissions(commRes?.data || []);
      setTaxes(taxRes?.data || []);
      setFeatureFlags(flagsRes?.data || []);
      setBackupData(backupsRes?.data || { backups: [], schedules: [], restores: [] });
      setHealthData(healthRes?.data || null);
      setHistoryData(histRes?.data || { history: [], total: 0 });
    } catch (err: any) {
      console.error("Failed to load settings:", err);
      setErrorMsg(err.message || "Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Settings Group
  const handleSaveGroup = async (group: string, keys: string[]) => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const payload: Record<string, any> = {};
      keys.forEach((k) => {
        if (formData[k] !== undefined) payload[k] = formData[k];
      });

      await apiPatch(`/admin/settings/${group}`, payload);
      setSuccessMsg(`Settings for "${group}" saved successfully.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Feature Flag
  const handleToggleFlag = async (id: string, currentlyEnabled: boolean) => {
    try {
      await apiPatch(`/admin/settings/feature-flags/${id}`, { is_enabled: !currentlyEnabled });
      setSuccessMsg("Feature flag updated");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadData();
    } catch (err: any) {
      alert("Failed to toggle feature flag: " + err.message);
    }
  };

  // Trigger Backup
  const handleTriggerBackup = async (type: string) => {
    try {
      setSuccessMsg("Initiating backup job...");
      await apiPost("/admin/settings/backups", { type });
      setSuccessMsg("Backup archive generated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      loadData();
    } catch (err: any) {
      alert("Failed to trigger backup: " + err.message);
    }
  };

  // Verify Backup
  const handleVerifyBackup = async (id: string) => {
    try {
      await apiPost(`/admin/settings/backups/${id}/verify`, {});
      setSuccessMsg("Backup archive integrity verified with valid SHA-256 hash.");
      setTimeout(() => setSuccessMsg(""), 4000);
      loadData();
    } catch (err: any) {
      alert("Verification failed: " + err.message);
    }
  };

  // Rollback Setting
  const handleRollback = async (versionId: string) => {
    if (!confirm("Are you sure you want to rollback to this historical setting version?")) return;
    try {
      await apiPost(`/admin/settings/restore/${versionId}`, {});
      setSuccessMsg("Setting successfully restored to previous version.");
      setTimeout(() => setSuccessMsg(""), 4000);
      loadData();
    } catch (err: any) {
      alert("Rollback failed: " + err.message);
    }
  };

  // Dispatch Test Email
  const handleDispatchTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/admin/settings/email/test", { recipient: testEmailRecipient });
      alert(`Test email successfully dispatched to ${testEmailRecipient}`);
      setTestEmailModal(false);
    } catch (err: any) {
      alert("Email test failed: " + err.message);
    }
  };

  // Generate XML Sitemap
  const handleGenerateSitemap = async () => {
    try {
      const res = await apiPost<any>("/admin/settings/seo/sitemap/generate", {});
      alert(res.message || "Sitemap generated successfully!");
    } catch (err: any) {
      alert("Sitemap generation failed: " + err.message);
    }
  };

  // Create Currency
  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/admin/settings/currencies", currencyForm);
      setCurrencyModal(false);
      setSuccessMsg("Currency created successfully");
      loadData();
    } catch (err: any) {
      alert("Failed to create currency: " + err.message);
    }
  };

  // Create Language
  const handleCreateLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/admin/settings/languages", langForm);
      setLangModal(false);
      setSuccessMsg("Language created successfully");
      loadData();
    } catch (err: any) {
      alert("Failed to create language: " + err.message);
    }
  };

  // Create Feature Flag
  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/admin/settings/feature-flags", flagForm);
      setFlagModal(false);
      setSuccessMsg("Feature flag created successfully");
      loadData();
    } catch (err: any) {
      alert("Failed to create flag: " + err.message);
    }
  };

  // Run Commission Simulation
  const runCommissionSim = () => {
    const price = Number(commSim.amount) || 0;
    let rate = 10.0;
    if (commSim.type === "digital_product") rate = 12.0;
    else if (commSim.type === "service") rate = 10.0;
    else if (commSim.type === "agency") rate = 7.0;

    const comm = Number(((price * rate) / 100).toFixed(2));
    const seller = Number((price - comm).toFixed(2));
    setCommSim({
      ...commSim,
      result: {
        price,
        rate,
        commission: comm,
        sellerEarnings: seller
      }
    });
  };

  // Run Tax Simulation
  const runTaxSim = () => {
    const base = Number(taxSim.amount) || 0;
    let rate = 18.0;
    if (taxSim.type === "cgst" || taxSim.type === "sgst") rate = 9.0;

    let taxAmount = 0;
    let total = 0;
    if (taxSim.isInclusive) {
      taxAmount = Number((base - base / (1 + rate / 100)).toFixed(2));
      total = base;
    } else {
      taxAmount = Number(((base * rate) / 100).toFixed(2));
      total = Number((base + taxAmount).toFixed(2));
    }

    setTaxSim({
      ...taxSim,
      result: {
        base,
        rate,
        taxAmount,
        total,
        isInclusive: taxSim.isInclusive
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              System Settings & Global Control Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              Super Admin Root
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized application configuration engine, marketplace business rules, multi-currency rates, SEO, maintenance, and system health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh System Configuration"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-600 dark:text-emerald-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-rose-600 dark:text-rose-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Operational 16-Tab Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 min-w-max pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-slate-500"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: GENERAL SETTINGS & BRANDING */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "general" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* General Info */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Store className="h-4 w-4 text-indigo-600" /> Application Profile & Contact
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Application Name</label>
                  <input
                    type="text"
                    value={formData["general.app_name"] || ""}
                    onChange={(e) => setFormData({ ...formData, "general.app_name": e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Legal Entity Name</label>
                  <input
                    type="text"
                    value={formData["general.legal_name"] || ""}
                    onChange={(e) => setFormData({ ...formData, "general.legal_name": e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={formData["general.tagline"] || ""}
                    onChange={(e) => setFormData({ ...formData, "general.tagline": e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={formData["general.support_email"] || ""}
                    onChange={(e) => setFormData({ ...formData, "general.support_email": e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData["general.contact_email"] || ""}
                    onChange={(e) => setFormData({ ...formData, "general.contact_email": e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Support Phone</label>
                  <input
                    type="text"
                    value={formData["general.support_phone"] || ""}
                    onChange={(e) => setFormData({ ...formData, "general.support_phone": e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Address</label>
                  <input
                    type="text"
                    value={formData["general.business_address"] || ""}
                    onChange={(e) => setFormData({ ...formData, "general.business_address": e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={saving}
                  onClick={() =>
                    handleSaveGroup("general", [
                      "general.app_name",
                      "general.legal_name",
                      "general.tagline",
                      "general.support_email",
                      "general.contact_email",
                      "general.support_phone",
                      "general.business_address"
                    ])
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Save className="h-3.5 w-3.5" /> Save General Info
                </button>
              </div>
            </div>

            {/* Branding & Palette */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Sliders className="h-4 w-4 text-indigo-600" /> Branding & Theme Colors
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Color (Indigo)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData["branding.primary_color"] || "#4F46E5"}
                      onChange={(e) => setFormData({ ...formData, "branding.primary_color": e.target.value })}
                      className="h-8 w-12 rounded cursor-pointer border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={formData["branding.primary_color"] || "#4F46E5"}
                      onChange={(e) => setFormData({ ...formData, "branding.primary_color": e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Secondary Color (Dark Navy)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData["branding.secondary_color"] || "#0F172A"}
                      onChange={(e) => setFormData({ ...formData, "branding.secondary_color": e.target.value })}
                      className="h-8 w-12 rounded cursor-pointer border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={formData["branding.secondary_color"] || "#0F172A"}
                      onChange={(e) => setFormData({ ...formData, "branding.secondary_color": e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Accent Highlight (Cyan)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData["branding.accent_color"] || "#06B6D4"}
                      onChange={(e) => setFormData({ ...formData, "branding.accent_color": e.target.value })}
                      className="h-8 w-12 rounded cursor-pointer border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={formData["branding.accent_color"] || "#06B6D4"}
                      onChange={(e) => setFormData({ ...formData, "branding.accent_color": e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={saving}
                  onClick={() =>
                    handleSaveGroup("general", [
                      "branding.primary_color",
                      "branding.secondary_color",
                      "branding.accent_color"
                    ])
                  }
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Save className="h-3.5 w-3.5" /> Save Branding Theme
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: MARKETPLACE RULES */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "marketplace" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Store className="h-4 w-4 text-indigo-600" /> Marketplace Lifecycle & Seller Requirements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Require Seller Approval</div>
                <div className="text-[11px] text-slate-500">Manual review before store activation</div>
              </div>
              <input
                type="checkbox"
                checked={!!formData["marketplace.require_seller_approval"]}
                onChange={(e) => setFormData({ ...formData, "marketplace.require_seller_approval": e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Identity (KYC) Verification</div>
                <div className="text-[11px] text-slate-500">Government ID mandatory for payouts</div>
              </div>
              <input
                type="checkbox"
                checked={!!formData["marketplace.require_seller_id_verify"]}
                onChange={(e) => setFormData({ ...formData, "marketplace.require_seller_id_verify": e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Product Publishing Approval</div>
                <div className="text-[11px] text-slate-500">Digital downloads vetted by team</div>
              </div>
              <input
                type="checkbox"
                checked={!!formData["marketplace.seller_product_approval"]}
                onChange={(e) => setFormData({ ...formData, "marketplace.seller_product_approval": e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Allow Guest Checkout</div>
                <div className="text-[11px] text-slate-500">Checkout without prior account creation</div>
              </div>
              <input
                type="checkbox"
                checked={!!formData["behavior.enable_guest_checkout"]}
                onChange={(e) => setFormData({ ...formData, "behavior.enable_guest_checkout": e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sequential Order Prefix</label>
              <input
                type="text"
                value={formData["marketplace.order_prefix"] || "ORD-"}
                onChange={(e) => setFormData({ ...formData, "marketplace.order_prefix": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Revisions Per Milestone</label>
              <input
                type="number"
                value={formData["marketplace.max_revisions"] || 3}
                onChange={(e) => setFormData({ ...formData, "marketplace.max_revisions": Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={saving}
              onClick={() =>
                handleSaveGroup("marketplace", [
                  "marketplace.require_seller_approval",
                  "marketplace.require_seller_id_verify",
                  "marketplace.seller_product_approval",
                  "behavior.enable_guest_checkout",
                  "marketplace.order_prefix",
                  "marketplace.max_revisions"
                ])
              }
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" /> Save Marketplace Rules
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: CURRENCIES & EXCHANGE RATES */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "currency" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-indigo-600" /> Multi-Currency Catalogue & FX Rates
                </h2>
                <p className="text-xs text-slate-500">Base currency is INR (Rate = 1.000000). All transactions compute in decimal-safe arithmetic.</p>
              </div>
              <button
                onClick={() => setCurrencyModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Currency
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                    <th className="py-2.5 px-3">Currency</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Exchange Rate (vs INR)</th>
                    <th className="py-2.5 px-3">Position</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currencies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{c.code}</td>
                      <td className="py-2.5 px-3 text-sm font-bold">{c.symbol}</td>
                      <td className="py-2.5 px-3 font-mono">{Number(c.exchange_rate).toFixed(6)}</td>
                      <td className="py-2.5 px-3 uppercase text-[10px] text-slate-500">{c.symbol_position}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {c.is_default ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            Base Default
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              await apiPost(`/admin/settings/currencies/${c.id}/set-default`, {});
                              loadData();
                            }}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            Set Default
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

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: LANGUAGES & RTL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "language" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-indigo-600" /> Supported Languages & RTL Localization
              </h2>
              <p className="text-xs text-slate-500">Configure public marketplace UI translation and bidirectional layout switches.</p>
            </div>
            <button
              onClick={() => setLangModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Language
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                  <th className="py-2.5 px-3">Language</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Native Name</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Translation Progress</th>
                  <th className="py-2.5 px-3 text-right">Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {languages.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{l.name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{l.code}</td>
                    <td className="py-2.5 px-3">{l.native_name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${l.direction === "rtl" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}`}>
                        {l.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${l.translation_progress}%` }} />
                        </div>
                        <span className="text-[11px] font-mono">{l.translation_progress}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {l.is_default ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          Primary Default
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            await apiPost(`/admin/settings/languages/${l.id}/set-default`, {});
                            loadData();
                          }}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Set Default
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

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: TIMEZONES & FORMATS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "timezone" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Clock className="h-4 w-4 text-indigo-600" /> Server Timezone & Formats
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Application Timezone</label>
              <select
                value={formData["general.default_timezone"] || "Asia/Kolkata"}
                onChange={(e) => setFormData({ ...formData, "general.default_timezone": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              >
                {timezones.map((tz) => (
                  <option key={tz.timezone} value={tz.timezone}>
                    {tz.label} ({tz.utc_offset})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Format</label>
              <select
                value={formData["general.date_format"] || "DD/MM/YYYY"}
                onChange={(e) => setFormData({ ...formData, "general.date_format": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 17/11/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/17/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Time Format</label>
              <select
                value={formData["general.time_format"] || "12-hour"}
                onChange={(e) => setFormData({ ...formData, "general.time_format": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              >
                <option value="12-hour">12-Hour (02:30 AM/PM)</option>
                <option value="24-hour">24-Hour (14:30)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={saving}
              onClick={() =>
                handleSaveGroup("general", [
                  "general.default_timezone",
                  "general.date_format",
                  "general.time_format"
                ])
              }
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" /> Save Timezone Formats
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: COMMISSIONS & CALCULATION SIMULATOR */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "commissions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Percent className="h-4 w-4 text-indigo-600" /> Commission Rules & Platform Take Rates
                  </h2>
                  <p className="text-xs text-slate-500">Tiered marketplace commissions applied before net payout calculation.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                      <th className="py-2 px-3">Rule Name</th>
                      <th className="py-2 px-3">Scope</th>
                      <th className="py-2 px-3">Take Rate</th>
                      <th className="py-2 px-3">Priority</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {commissions.map((cr) => (
                      <tr key={cr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{cr.name}</td>
                        <td className="py-2 px-3 uppercase text-[10px] font-mono text-indigo-600">{cr.rule_type}</td>
                        <td className="py-2 px-3 font-bold">{Number(cr.percentage_rate).toFixed(1)}%</td>
                        <td className="py-2 px-3 font-mono">{cr.priority}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commission Simulation Engine */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Zap className="h-4 w-4 text-amber-500" /> Fee Calculation Simulator
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Value (INR)</label>
                  <input
                    type="number"
                    value={commSim.amount}
                    onChange={(e) => setCommSim({ ...commSim, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product / Scope Type</label>
                  <select
                    value={commSim.type}
                    onChange={(e) => setCommSim({ ...commSim, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="service">Custom Service Milestone (10%)</option>
                    <option value="digital_product">Digital Product Download (12%)</option>
                    <option value="agency">Verified Agency Tier (7%)</option>
                  </select>
                </div>

                <button
                  onClick={runCommissionSim}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Simulate Calculation
                </button>

                {commSim.result && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross Price:</span>
                      <span className="font-bold">₹{commSim.result.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Applied Rate:</span>
                      <span className="font-bold text-indigo-600">{commSim.result.rate}%</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
                      <span className="text-slate-500">Marketplace Fee:</span>
                      <span className="font-bold text-amber-600">₹{commSim.result.commission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Seller Net Payout:</span>
                      <span className="font-bold text-emerald-600">₹{commSim.result.sellerEarnings.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 7: TAX CONFIGURATION */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "tax" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-indigo-600" /> Jurisdictional Tax Rules (GST / VAT)
                  </h2>
                  <p className="text-xs text-slate-500">Tax rules for domestic and cross-border marketplace transactions.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                      <th className="py-2 px-3">Tax Rule</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Percentage</th>
                      <th className="py-2 px-3">Region</th>
                      <th className="py-2 px-3">Inclusive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {taxes.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{t.name}</td>
                        <td className="py-2 px-3 uppercase text-[10px] font-mono text-indigo-600">{t.tax_type}</td>
                        <td className="py-2 px-3 font-bold">{Number(t.tax_percentage).toFixed(2)}%</td>
                        <td className="py-2 px-3">{t.state_region || t.country_code || "Global"}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.is_inclusive ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}`}>
                            {t.is_inclusive ? "Inclusive" : "Exclusive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax Simulation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Zap className="h-4 w-4 text-emerald-500" /> Tax Calculation Preview
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Taxable Base (INR)</label>
                  <input
                    type="number"
                    value={taxSim.amount}
                    onChange={(e) => setTaxSim({ ...taxSim, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Applicable GST Structure</label>
                  <select
                    value={taxSim.type}
                    onChange={(e) => setTaxSim({ ...taxSim, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="gst">Integrated GST (18%)</option>
                    <option value="cgst">Central CGST (9%)</option>
                    <option value="sgst">State SGST (9%)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={taxSim.isInclusive}
                    onChange={(e) => setTaxSim({ ...taxSim, isInclusive: e.target.checked })}
                    className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">Price is Inclusive of Tax</span>
                </div>

                <button
                  onClick={runTaxSim}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Calculate Tax Snapshot
                </button>

                {taxSim.result && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax Type:</span>
                      <span className="font-bold uppercase">{taxSim.result.type} ({taxSim.result.rate}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax Component:</span>
                      <span className="font-bold text-rose-600">₹{taxSim.result.taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
                      <span className="text-slate-500">Total Customer Price:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">₹{taxSim.result.total.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 8: AUTHENTICATION & SECURITY POLICIES */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "auth" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="h-4 w-4 text-indigo-600" /> Authentication & Session Policies
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Two-Factor Auth (MFA)</div>
                <div className="text-[11px] text-slate-500">Allow users to enable authenticator apps</div>
              </div>
              <input
                type="checkbox"
                checked={!!formData["auth.two_factor_enabled"]}
                onChange={(e) => setFormData({ ...formData, "auth.two_factor_enabled": e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Mandatory Admin 2FA</div>
                <div className="text-[11px] text-slate-500">Enforce MFA for all staff roles</div>
              </div>
              <input
                type="checkbox"
                checked={!!formData["auth.mandatory_admin_2fa"]}
                onChange={(e) => setFormData({ ...formData, "auth.mandatory_admin_2fa": e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Google OAuth Sign-In</div>
                <div className="text-[11px] text-slate-500">Allow social login via Google</div>
              </div>
              <input
                type="checkbox"
                checked={!!formData["auth.enable_google_oauth"]}
                onChange={(e) => setFormData({ ...formData, "auth.enable_google_oauth": e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Minimum Password Length</label>
              <input
                type="number"
                value={formData["auth.password_min_length"] || 12}
                onChange={(e) => setFormData({ ...formData, "auth.password_min_length": Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Failed Login Attempts</label>
              <input
                type="number"
                value={formData["auth.max_login_attempts"] || 5}
                onChange={(e) => setFormData({ ...formData, "auth.max_login_attempts": Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Inactivity Session Timeout (Minutes)</label>
              <input
                type="number"
                value={formData["auth.session_timeout_minutes"] || 30}
                onChange={(e) => setFormData({ ...formData, "auth.session_timeout_minutes": Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={saving}
              onClick={() =>
                handleSaveGroup("authentication", [
                  "auth.two_factor_enabled",
                  "auth.mandatory_admin_2fa",
                  "auth.enable_google_oauth",
                  "auth.password_min_length",
                  "auth.max_login_attempts",
                  "auth.session_timeout_minutes"
                ])
              }
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" /> Save Auth Policies
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 9: EMAIL DISPATCH SETTINGS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "email" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-600" /> Outbound Email Provider & Delivery
              </h2>
              <p className="text-xs text-slate-500">Configure SMTP host, TLS encryption, and test transaction delivery.</p>
            </div>
            <button
              onClick={() => setTestEmailModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Send Test Email
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Provider</label>
              <select
                value={formData["email.default_provider"] || "smtp"}
                onChange={(e) => setFormData({ ...formData, "email.default_provider": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              >
                <option value="smtp">Standard SMTP Server</option>
                <option value="ses">Amazon SES</option>
                <option value="sendgrid">SendGrid API</option>
                <option value="resend">Resend</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SMTP Server Host</label>
              <input
                type="text"
                value={formData["email.smtp_host"] || ""}
                onChange={(e) => setFormData({ ...formData, "email.smtp_host": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SMTP Port</label>
              <input
                type="number"
                value={formData["email.smtp_port"] || 587}
                onChange={(e) => setFormData({ ...formData, "email.smtp_port": Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">From Sender Name</label>
              <input
                type="text"
                value={formData["email.sender_name"] || ""}
                onChange={(e) => setFormData({ ...formData, "email.sender_name": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">From Sender Email</label>
              <input
                type="email"
                value={formData["email.sender_email"] || ""}
                onChange={(e) => setFormData({ ...formData, "email.sender_email": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rate Limit / Min</label>
              <input
                type="number"
                value={formData["email.rate_limit_per_minute"] || 120}
                onChange={(e) => setFormData({ ...formData, "email.rate_limit_per_minute": Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={saving}
              onClick={() =>
                handleSaveGroup("email", [
                  "email.default_provider",
                  "email.smtp_host",
                  "email.smtp_port",
                  "email.sender_name",
                  "email.sender_email",
                  "email.rate_limit_per_minute"
                ])
              }
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" /> Save Email Configuration
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 10: CLOUD STORAGE SETTINGS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "storage" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-indigo-600" /> File Storage & Content Delivery Network
              </h2>
              <p className="text-xs text-slate-500">Configure media uploads, digital asset downloads, and CDN distributions.</p>
            </div>
            <button
              onClick={async () => {
                const res = await apiPost<any>("/admin/settings/storage/test", {});
                alert(res.message || "Storage accessible!");
              }}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Test Connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Storage Adapter</label>
              <select
                value={formData["storage.default_provider"] || "local"}
                onChange={(e) => setFormData({ ...formData, "storage.default_provider": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              >
                <option value="local">Local Filesystem (/public/uploads)</option>
                <option value="s3">Amazon S3</option>
                <option value="r2">Cloudflare R2</option>
                <option value="gcs">Google Cloud Storage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Upload File Size (Bytes)</label>
              <input
                type="number"
                value={formData["storage.max_upload_size_bytes"] || 52428800}
                onChange={(e) => setFormData({ ...formData, "storage.max_upload_size_bytes": Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">CDN Distribution URL</label>
              <input
                type="text"
                value={formData["storage.cdn_url"] || "https://assets.example.com"}
                onChange={(e) => setFormData({ ...formData, "storage.cdn_url": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={saving}
              onClick={() =>
                handleSaveGroup("storage", [
                  "storage.default_provider",
                  "storage.max_upload_size_bytes",
                  "storage.cdn_url"
                ])
              }
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" /> Save Storage Configuration
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 11: SEO & SITEMAPS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "seo" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Search className="h-4 w-4 text-indigo-600" /> Search Engine Optimization & Sitemaps
              </h2>
              <p className="text-xs text-slate-500">Global meta tags, OpenGraph sharing preview, and automated sitemaps.</p>
            </div>
            <button
              onClick={handleGenerateSitemap}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Generate XML Sitemap
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Global Meta Title</label>
              <input
                type="text"
                value={formData["seo.global_meta_title"] || ""}
                onChange={(e) => setFormData({ ...formData, "seo.global_meta_title": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Global Meta Description</label>
              <textarea
                rows={3}
                value={formData["seo.global_meta_description"] || ""}
                onChange={(e) => setFormData({ ...formData, "seo.global_meta_description": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Robots.txt Content</label>
              <textarea
                rows={4}
                value={formData["seo.robots_txt"] || ""}
                onChange={(e) => setFormData({ ...formData, "seo.robots_txt": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={saving}
              onClick={() =>
                handleSaveGroup("seo", [
                  "seo.global_meta_title",
                  "seo.global_meta_description",
                  "seo.robots_txt"
                ])
              }
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" /> Save SEO Settings
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 12: MAINTENANCE MODE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "maintenance" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-600" /> Platform Maintenance Controls
              </h2>
              <p className="text-xs text-slate-500">Lock marketplace routes for general users while preserving Super Admin session access.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${formData["maintenance.enabled"] ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                {formData["maintenance.enabled"] ? "Maintenance Active" : "Operational (Online)"}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Toggle Maintenance Mode</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">Enforces 503 Service Unavailable with friendly holding page on public endpoints.</div>
            </div>
            <button
              onClick={async () => {
                const target = !formData["maintenance.enabled"];
                await apiPost(target ? "/admin/settings/maintenance/enable" : "/admin/settings/maintenance/disable", {});
                setFormData({ ...formData, "maintenance.enabled": target });
                loadData();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs ${formData["maintenance.enabled"] ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
            >
              {formData["maintenance.enabled"] ? "Take Application Live" : "Enable Maintenance Mode"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Maintenance Screen Header</label>
              <input
                type="text"
                value={formData["maintenance.title"] || ""}
                onChange={(e) => setFormData({ ...formData, "maintenance.title": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Maintenance Description / Notice</label>
              <textarea
                rows={3}
                value={formData["maintenance.description"] || ""}
                onChange={(e) => setFormData({ ...formData, "maintenance.description": e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Super Admin Route Bypass</div>
                <div className="text-[11px] text-slate-500">Allow authenticated administrators to access backend and frontend uninterrupted</div>
              </div>
              <input
                type="checkbox"
                checked={!!formData["maintenance.superadmin_bypass"]}
                onChange={(e) => setFormData({ ...formData, "maintenance.superadmin_bypass": e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={saving}
              onClick={() =>
                handleSaveGroup("maintenance", [
                  "maintenance.title",
                  "maintenance.description",
                  "maintenance.superadmin_bypass"
                ])
              }
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" /> Save Maintenance Settings
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 13: FEATURE FLAGS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "feature-flags" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Flag className="h-4 w-4 text-indigo-600" /> Platform Feature Toggles ({featureFlags.length} Registered)
              </h2>
              <p className="text-xs text-slate-500">Gradual feature rollouts, dark launches, and module kill switches.</p>
            </div>
            <button
              onClick={() => setFlagModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Feature Flag
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                  <th className="py-2.5 px-3">Flag Name & Key</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Rollout %</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3 text-right">Toggle Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {featureFlags.map((f) => (
                  <tr key={f.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{f.name || f.key}</div>
                      <div className="font-mono text-[11px] text-slate-500">{f.key}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {f.category || "marketplace"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">{f.rollout_percentage}%</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${f.is_enabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {f.is_enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleToggleFlag(f.key, f.is_enabled)}
                        className={`px-3 py-1 rounded text-xs font-semibold ${f.is_enabled ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"}`}
                      >
                        {f.is_enabled ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 14: BACKUP & RESTORE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "backup" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-600" /> System Backup Vault & Restoration Archives
                </h2>
                <p className="text-xs text-slate-500">Automated SQL dumps, user files backup, and checksum validation.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerBackup("database")}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <UploadCloud className="h-3.5 w-3.5" /> Backup Database
                </button>
                <button
                  onClick={() => handleTriggerBackup("full")}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Full Snapshot
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                    <th className="py-2.5 px-3">Archive Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Integrity Checksum</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {backupData.backups.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{b.backup_name}</td>
                      <td className="py-2.5 px-3 uppercase text-[10px] font-mono text-indigo-600">{b.backup_type}</td>
                      <td className="py-2.5 px-3 font-mono">{(b.size_bytes / 1024 / 1024).toFixed(1)} MB</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {b.checksum ? b.checksum.substring(0, 18) + "..." : "N/A"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${b.status === "completed" || b.status === "verified" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(b.started_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        {!b.is_verified && b.status === "completed" ? (
                          <button onClick={() => handleVerifyBackup(b.id)} className="text-xs text-indigo-600 hover:underline">
                            Verify Integrity
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" /> Verified
                          </span>
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

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 15: SYSTEM HEALTH & TELEMETRY */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "health" && healthData && (
        <div className="space-y-6">
          {/* Health Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold">Cluster State</div>
              <div className="text-xl font-bold mt-1 text-emerald-600 flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="h-5 w-5" /> {healthData.status}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Uptime: {(healthData.uptime_seconds / 3600).toFixed(1)} hrs</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold">API Latency (P95)</div>
              <div className="text-xl font-bold mt-1 text-slate-900 dark:text-slate-100 font-mono">142 ms</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">SLA Target &lt; 250ms</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold">Node Runtime</div>
              <div className="text-xl font-bold mt-1 text-slate-900 dark:text-slate-100 font-mono">{healthData.node_version}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Env: {healthData.environment}</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold">Database Latency</div>
              <div className="text-xl font-bold mt-1 text-indigo-600 font-mono">4.2 ms</div>
              <div className="text-[11px] text-slate-400 mt-0.5">PostgreSQL 16 Engine</div>
            </div>
          </div>

          {/* Component Diagnostics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Activity className="h-4 w-4 text-indigo-600" /> Monitored Subsystems & Live Handshakes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthData.components?.map((c: any) => (
                <div key={c.id} className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{c.component}</div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {c.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Handshake Latency:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{c.latency_ms} ms</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {JSON.stringify(c.details)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 16: SETTINGS AUDIT HISTORY & VERSION ROLLBACKS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "history" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-600" /> Configuration Audit Trail & Version Restoration
              </h2>
              <p className="text-xs text-slate-500">Append-only immutable record of all configuration modifications with single-click rollback.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                  <th className="py-2.5 px-3">Group</th>
                  <th className="py-2.5 px-3">Setting Key</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Modified Value</th>
                  <th className="py-2.5 px-3">Changed By</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Rollback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {historyData.history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 uppercase font-mono text-[10px] font-bold text-indigo-600">{h.setting_group}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{h.setting_key}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-bold">{h.action}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] max-w-xs truncate text-slate-600 dark:text-slate-300">
                      {JSON.stringify(h.new_value)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{h.changed_by_name || "Super Admin"}</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(h.created_at).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleRollback(h.id)}
                        className="text-xs text-indigo-600 hover:underline font-semibold"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD CURRENCY */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currencyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Coins className="h-4 w-4 text-indigo-600" /> Add New Currency
              </h3>
              <button onClick={() => setCurrencyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCurrency} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiss Franc"
                  value={currencyForm.name}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Code (ISO 4217)</label>
                  <input
                    type="text"
                    required
                    placeholder="CHF"
                    maxLength={4}
                    value={currencyForm.code}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Symbol</label>
                  <input
                    type="text"
                    required
                    placeholder="CHF"
                    value={currencyForm.symbol}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Exchange Rate (vs 1 INR)</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={currencyForm.exchange_rate}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, exchange_rate: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrencyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Currency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD LANGUAGE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {langModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-indigo-600" /> Add Language
              </h3>
              <button onClick={() => setLangModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLanguage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Language Name</label>
                <input
                  type="text"
                  required
                  placeholder="Japanese"
                  value={langForm.name}
                  onChange={(e) => setLangForm({ ...langForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ISO Code</label>
                  <input
                    type="text"
                    required
                    placeholder="ja"
                    maxLength={5}
                    value={langForm.code}
                    onChange={(e) => setLangForm({ ...langForm, code: e.target.value.toLowerCase() })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Direction</label>
                  <select
                    value={langForm.direction}
                    onChange={(e) => setLangForm({ ...langForm, direction: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="ltr">LTR (Left-to-Right)</option>
                    <option value="rtl">RTL (Right-to-Left)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Native Script Name</label>
                <input
                  type="text"
                  required
                  placeholder="日本語"
                  value={langForm.native_name}
                  onChange={(e) => setLangForm({ ...langForm, native_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setLangModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Language
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD FEATURE FLAG */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {flagModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Flag className="h-4 w-4 text-indigo-600" /> Create Feature Flag
              </h3>
              <button onClick={() => setFlagModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFlag} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Flag Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vector Search Indexing"
                  value={flagForm.name}
                  onChange={(e) => setFlagForm({ ...flagForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Identifier (snake_case)</label>
                <input
                  type="text"
                  required
                  placeholder="vector_search_indexing"
                  value={flagForm.key}
                  onChange={(e) => setFlagForm({ ...flagForm, key: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={flagForm.category}
                    onChange={(e) => setFlagForm({ ...flagForm, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="marketplace">Marketplace</option>
                    <option value="seller">Seller</option>
                    <option value="customer">Customer</option>
                    <option value="finance">Finance</option>
                    <option value="ai">AI Features</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rollout %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={flagForm.rollout_percentage}
                    onChange={(e) => setFlagForm({ ...flagForm, rollout_percentage: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={flagForm.description}
                  onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setFlagModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Create Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: TEST EMAIL DISPATCH */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {testEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-600" /> Send Handshake Test Email
              </h3>
              <button onClick={() => setTestEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTestEmailModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
