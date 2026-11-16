"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Save, ArrowUp, ArrowDown, CheckCircle, Eye, EyeOff, Layout } from "lucide-react";

export const HomepageManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [settings, setSettings] = useState<any>({
    page_title: "",
    meta_description: "",
    announcement_bar_enabled: true,
    announcement_bar_text: "",
    announcement_bar_link: "/browse",
    is_published: true
  });
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/homepage");
      if (res.data?.data) {
        setSettings(res.data.data.settings || {});
        setSections(res.data.data.sections || []);
      }
    } catch (err: any) {
      console.error("Failed to load homepage CMS data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      await api.put("/admin/cms/homepage", settings);
      setSuccessMsg("Homepage global settings saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIdx, 0, moved);
    setSections(reordered);

    try {
      const orderedKeys = reordered.map((s) => s.section_key);
      await api.put("/admin/cms/homepage/sections/reorder", { orderedKeys });
    } catch (err) {
      console.error("Failed to reorder sections:", err);
    }
  };

  const toggleSectionActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await api.put(`/admin/cms/homepage/sections/${id}`, { is_active: !currentActive });
      setSections(sections.map((s) => (s.id === id ? { ...s, is_active: res.data.data.is_active } : s)));
    } catch (err) {
      console.error("Failed to toggle section status:", err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading homepage configuration...</div>;
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}

      {/* Global Meta & Announcement Bar */}
      <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Global Homepage Meta & Announcement Bar</h2>
            <p className="text-xs text-slate-500">Manage headline SEO tags and the top notification ticker.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Homepage Page Title (SEO)
            </label>
            <input
              type="text"
              value={settings.page_title || ""}
              onChange={(e) => setSettings({ ...settings, page_title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meta Description (Search Engine Snippet)
            </label>
            <input
              type="text"
              value={settings.meta_description || ""}
              onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Top Announcement Bar Message
            </label>
            <input
              type="text"
              value={settings.announcement_bar_text || ""}
              onChange={(e) => setSettings({ ...settings, announcement_bar_text: e.target.value })}
              placeholder="e.g. 🚀 Welcome to Desigot! Use coupon WELCOME10 for 10% off."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Announcement Click Target URL
            </label>
            <input
              type="text"
              value={settings.announcement_bar_link || ""}
              onChange={(e) => setSettings({ ...settings, announcement_bar_link: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.announcement_bar_enabled}
              onChange={(e) => setSettings({ ...settings, announcement_bar_enabled: e.target.checked })}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enable Announcement Bar</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.is_published}
              onChange={(e) => setSettings({ ...settings, is_published: e.target.checked })}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Publish Homepage Live</span>
          </label>
        </div>
      </form>

      {/* Sections Reordering & Toggle Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layout className="w-4 h-4 text-purple-600" />
              Dynamic Homepage Sections Ordering & Visibility ({sections.length} Sections)
            </h2>
            <p className="text-xs text-slate-500">
              Drag or use arrows to reorder homepage layout modules. Toggle visibility without losing configuration.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sections.map((sec, idx) => (
            <div key={sec.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{sec.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      {sec.section_type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">key: {sec.section_key}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{sec.subtitle || "No subtitle configured"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSectionActive(sec.id, sec.is_active)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                    sec.is_active
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {sec.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {sec.is_active ? "Visible" : "Hidden"}
                </button>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, "up")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === sections.length - 1}
                    onClick={() => moveSection(idx, "down")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
