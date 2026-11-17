"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Sun,
  Moon,
  Laptop,
  Globe,
  Bell,
  Eye,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Palette,
  Clock,
  DollarSign,
  Layout,
  Check,
  Loader2
} from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { ProfileNavHeader, ProfileData } from "@/components/profile/ProfileNavHeader";

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+5:30)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time, +0:00)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT, UTC-5:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT, UTC-8:00)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT, UTC-6:00)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST, UTC+0:00)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST, UTC+1:00)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST, UTC+1:00)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST, UTC+4:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+8:00)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST, UTC+9:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT, UTC+10:00)" },
];

export default function PreferencesPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [preferences, setPreferences] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPrefs = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [pRes, prefRes] = await Promise.all([
        apiGet<any>("/account/profile").catch(() => null),
        apiGet<any>("/account/preferences"),
      ]);
      if (pRes) setProfile(pRes?.data || pRes);
      const data = prefRes?.data || prefRes || {};
      setPreferences({
        theme: data.theme || "system",
        accent_color: data.accent_color || "indigo",
        compact_mode: !!data.compact_mode,
        sidebar_collapsed_default: !!data.sidebar_collapsed_default,
        language: data.language || "en",
        timezone: data.timezone || "Asia/Kolkata",
        date_format: data.date_format || "YYYY-MM-DD",
        time_format: data.time_format || "12h",
        email_security_alerts: data.email_security_alerts ?? true,
        email_order_updates: data.email_order_updates ?? true,
        email_payment_updates: data.email_payment_updates ?? true,
        email_marketing: data.email_marketing ?? false,
        inapp_security_alerts: data.inapp_security_alerts ?? true,
        inapp_order_updates: data.inapp_order_updates ?? true,
        inapp_messages: data.inapp_messages ?? true,
        push_notifications: !!data.push_notifications,
        profile_visibility: data.profile_visibility || "public",
        show_email_publicly: !!data.show_email_publicly,
        show_phone_publicly: !!data.show_phone_publicly,
        allow_direct_messages: data.allow_direct_messages ?? true,
        default_landing_page: data.default_landing_page || "/dashboard",
        default_currency: data.default_currency || "INR",
        table_density: data.table_density || "comfortable",
      });
    } catch (err: any) {
      console.error("Failed to load preferences:", err);
      setErrorMsg(err.message || "Failed to load account preferences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, []);

  const handleChange = (key: string, val: any) => {
    setPreferences((prev: any) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await apiPatch<any>("/account/preferences", preferences);
      setPreferences(res?.data || res || preferences);
      setSuccessMsg("Personal and interface preferences saved successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Reset all account preferences to their factory defaults?")) return;
    setSaving(true);
    setErrorMsg("");

    try {
      const res = await apiPost<any>("/account/preferences/reset", {});
      setPreferences(res?.data || res || {});
      setSuccessMsg("Preferences reset to defaults.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to reset preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <ProfileNavHeader
        profile={profile}
        onRefresh={fetchPrefs}
        loading={loading}
        successMsg={successMsg}
        errorMsg={errorMsg}
        onDismissAlert={() => { setSuccessMsg(""); setErrorMsg(""); }}
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* SECTION A: Appearance & Theme */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Palette className="h-4 w-4 text-indigo-600" /> Interface Appearance & Theme
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Color Scheme Mode
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {[
                  { id: "light", label: "Light Mode", icon: Sun },
                  { id: "dark", label: "Dark Mode", icon: Moon },
                  { id: "system", label: "System Sync", icon: Laptop },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = preferences.theme === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleChange("theme", m.id)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                        active
                          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-800/30">
                <input
                  type="checkbox"
                  id="compact_mode"
                  checked={preferences.compact_mode}
                  onChange={(e) => handleChange("compact_mode", e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="compact_mode" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span className="font-bold">Compact Layout Mode</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Reduces vertical padding across tables, lists, and form rows for dense viewports.
                  </p>
                </label>
              </div>

              <div className="flex items-start gap-3 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-800/30">
                <input
                  type="checkbox"
                  id="sidebar_collapsed_default"
                  checked={preferences.sidebar_collapsed_default}
                  onChange={(e) => handleChange("sidebar_collapsed_default", e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="sidebar_collapsed_default" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span className="font-bold">Collapse Sidebar by Default</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Auto-minimizes the admin navigation drawer to icon-only rail on page load.
                  </p>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: Language, Timezone & Regional */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Globe className="h-4 w-4 text-indigo-600" /> Language, Timezone & Regional Formats
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) => handleChange("language", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="en">English (US / Global)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Timezone (IANA Standards)
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date Format
              </label>
              <select
                value={preferences.date_format}
                onChange={(e) => handleChange("date_format", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-18)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (18/11/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (11/18/2026)</option>
                <option value="DD MMM YYYY">DD MMM YYYY (18 Nov 2026)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Format
              </label>
              <select
                value={preferences.time_format}
                onChange={(e) => handleChange("time_format", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="12h">12-Hour Clock (e.g. 02:45 PM)</option>
                <option value="24h">24-Hour Clock (e.g. 14:45)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION C: Notification Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Bell className="h-4 w-4 text-indigo-600" /> Email, Push & In-App Notifications
          </h2>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
              Email Notifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "email_security_alerts", label: "Security & Login Alerts", desc: "Unfamiliar logins and password changes" },
                { key: "email_order_updates", label: "Order & Milestone Deliveries", desc: "Escrow approvals and order status" },
                { key: "email_payment_updates", label: "Payments & Payout Releases", desc: "Payout dispatches and invoice receipts" },
                { key: "email_marketing", label: "Marketing & Feature Updates", desc: "Platform release digests and recommendations" },
              ].map((item) => (
                <div key={item.key} className="flex items-start gap-3 p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id={item.key}
                    checked={!!preferences[item.key]}
                    onChange={(e) => handleChange(item.key, e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={item.key} className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span className="font-semibold">{item.label}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </label>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] pt-2">
              In-App & Push Notifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "inapp_messages", label: "Direct Client Messages & Chat", desc: "Real-time discussion pings in notification tray" },
                { key: "inapp_order_updates", label: "Live Milestone Changes", desc: "Review submissions and deliverable feedback" },
                { key: "push_notifications", label: "Browser Desktop Push Notifications", desc: "Alerts when the application tab is in the background" },
              ].map((item) => (
                <div key={item.key} className="flex items-start gap-3 p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id={item.key}
                    checked={!!preferences[item.key]}
                    onChange={(e) => handleChange(item.key, e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={item.key} className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span className="font-semibold">{item.label}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION D: Privacy & Visibility */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Eye className="h-4 w-4 text-indigo-600" /> Profile Visibility & Privacy Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Profile Visibility
              </label>
              <select
                value={preferences.profile_visibility}
                onChange={(e) => handleChange("profile_visibility", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="public">Public (Visible to search engines & all marketplace visitors)</option>
                <option value="registered">Registered Users Only</option>
                <option value="private">Private (Hidden from public directories)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Dashboard Landing View
              </label>
              <select
                value={preferences.default_landing_page}
                onChange={(e) => handleChange("default_landing_page", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              >
                <option value="/dashboard">/dashboard (Main Control Center)</option>
                <option value="/dashboard/orders-bookings/all">/dashboard/orders-bookings/all</option>
                <option value="/dashboard/service-management/all">/dashboard/service-management/all</option>
                <option value="/dashboard/digital-products/all">/dashboard/digital-products/all</option>
              </select>
            </div>

            <div className="flex items-start gap-3 p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <input
                type="checkbox"
                id="show_email_publicly"
                checked={preferences.show_email_publicly}
                onChange={(e) => handleChange("show_email_publicly", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="show_email_publicly" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span className="font-semibold">Display Email on Public Profile</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Allow clients and collaborators to view email address directly.</p>
              </label>
            </div>

            <div className="flex items-start gap-3 p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <input
                type="checkbox"
                id="allow_direct_messages"
                checked={preferences.allow_direct_messages}
                onChange={(e) => handleChange("allow_direct_messages", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="allow_direct_messages" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span className="font-semibold">Allow Direct In-App Messages</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Permit any authenticated member to initiate conversations.</p>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION E: Currency & Table Density */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <DollarSign className="h-4 w-4 text-indigo-600" /> Financial Displays & Table Density
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Currency Display
              </label>
              <select
                value={preferences.default_currency}
                onChange={(e) => handleChange("default_currency", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ United States Dollar)</option>
                <option value="EUR">EUR (€ Euro)</option>
                <option value="GBP">GBP (£ British Pound)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data Table Density
              </label>
              <select
                value={preferences.table_density}
                onChange={(e) => handleChange("table_density", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="comfortable">Comfortable (Standard Row Height)</option>
                <option value="compact">Compact (High Information Density)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="h-4 w-4" /> Reset Factory Defaults
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
