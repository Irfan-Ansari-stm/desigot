"use client";
import React, { useState, useEffect } from "react";
import { apiGet, apiPut } from "@/lib/api";
import {
  Settings,
  Flag,
  Database,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Cpu,
  RefreshCw,
} from "lucide-react";
import type { SystemSetting, FeatureFlag } from "@/types/rbac";

export default function SystemConfigurationPage() {
  const [activeTab, setActiveTab] = useState<"general" | "auth" | "flags" | "db">("general");
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const [settingValues, setSettingValues] = useState<Record<string, any>>({});
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, fRes] = await Promise.all([
        apiGet<SystemSetting[]>("/system/settings"),
        apiGet<FeatureFlag[]>("/rbac/system/feature-flags").catch(() => []),
      ]);

      if (Array.isArray(sRes)) {
        setSettings(sRes);
        const map: Record<string, any> = {};
        sRes.forEach((s) => {
          map[s.key] = s.value;
        });
        setSettingValues(map);
      }
      if (Array.isArray(fRes)) setFlags(fRes);
    } catch (err: any) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSetting = async (key: string) => {
    setActionError("");
    setActionSuccess("");
    try {
      const val = settingValues[key];
      await apiPut(`/system/settings/${encodeURIComponent(key)}`, { value: val });
      setActionSuccess(`Setting "${key}" updated successfully.`);
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to update setting");
    }
  };

  const handleToggleFlag = async (key: string, currentlyEnabled: boolean) => {
    try {
      await apiPut(`/rbac/system/feature-flags/${encodeURIComponent(key)}`, {
        is_enabled: !currentlyEnabled,
      });
      setActionSuccess(`Feature flag "${key}" toggled to ${!currentlyEnabled ? "ON" : "OFF"}.`);
      loadData();
    } catch (err: any) {
      alert("Failed to toggle feature flag: " + err.message);
    }
  };

  const filteredSettings = settings.filter((s) => {
    if (activeTab === "general") return s.category === "general" || s.category === "system";
    if (activeTab === "auth") return s.category === "authentication" || s.category === "authorization" || s.category === "security";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            System Configuration & Feature Flags
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure application runtime settings, security thresholds, session expirations, and gradual feature toggles.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "general"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Settings className="h-3.5 w-3.5" /> General & Application
        </button>
        <button
          onClick={() => setActiveTab("auth")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "auth"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Lock className="h-3.5 w-3.5" /> Authentication & Security Policies
        </button>
        <button
          onClick={() => setActiveTab("flags")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "flags"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Flag className="h-3.5 w-3.5" /> Feature Flags ({flags.length})
        </button>
        <button
          onClick={() => setActiveTab("db")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "db"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Database className="h-3.5 w-3.5" /> Database & Storage Information
        </button>
      </div>

      {/* SETTINGS (GENERAL / AUTH) */}
      {(activeTab === "general" || activeTab === "auth") && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
          {filteredSettings.map((s) => (
            <div key={s.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="max-w-md">
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{s.key}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">{s.description}</div>
                <div className="text-[10px] text-slate-400 mt-1 capitalize font-medium">
                  Category: {s.category} • Type: {s.data_type}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {s.data_type === "boolean" ? (
                  <select
                    value={String(settingValues[s.key])}
                    onChange={(e) =>
                      setSettingValues({ ...settingValues, [s.key]: e.target.value === "true" })
                    }
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono"
                  >
                    <option value="true">true (Enabled)</option>
                    <option value="false">false (Disabled)</option>
                  </select>
                ) : (
                  <input
                    type={s.data_type === "number" ? "number" : "text"}
                    value={settingValues[s.key] !== undefined ? settingValues[s.key] : ""}
                    onChange={(e) =>
                      setSettingValues({
                        ...settingValues,
                        [s.key]: s.data_type === "number" ? Number(e.target.value) : e.target.value,
                      })
                    }
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono w-44"
                  />
                )}

                <button
                  onClick={() => handleSaveSetting(s.key)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FEATURE FLAGS TAB */}
      {activeTab === "flags" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
          {flags.map((flag) => (
            <div key={flag.key} className="p-4 flex items-center justify-between text-xs">
              <div>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{flag.key}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">{flag.description}</div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    flag.is_enabled
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {flag.is_enabled ? "Enabled" : "Disabled"}
                </span>

                <button
                  onClick={() => handleToggleFlag(flag.key, flag.is_enabled)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                    flag.is_enabled
                      ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {flag.is_enabled ? "Turn Off" : "Turn On"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DATABASE TAB */}
      {activeTab === "db" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-600" /> Relational Engine
            </h3>
            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Database Engine:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">PostgreSQL 18</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Database Name:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">desigot</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Encoding / Collation:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">UTF-8 / en-US</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Connection Pool:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">20 Max Connections</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-600" /> Security Extensions
            </h3>
            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>pgcrypto (UUIDv4 & Hashing):</span>
                <span className="text-emerald-600 font-semibold">Active</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Row Level Security (RLS):</span>
                <span className="text-emerald-600 font-semibold">Configured</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Audit Trail Rules:</span>
                <span className="text-emerald-600 font-semibold">Immutable Rules Active</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Authorization Cache TTL:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">60s (Event Invalidation)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
