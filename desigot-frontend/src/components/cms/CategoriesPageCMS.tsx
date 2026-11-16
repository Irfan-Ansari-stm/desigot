"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Layers, Save, CheckCircle } from "lucide-react";

export const CategoriesPageCMS: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    page_title: "",
    description: "",
    banner_url: "",
    layout: "grid",
    featured_category_ids: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/categories-page");
      if (res.data?.data) {
        setSettings({
          page_title: res.data.data.page_title || "",
          description: res.data.data.description || "",
          banner_url: res.data.data.banner_url || "",
          layout: res.data.data.layout || "grid",
          featured_category_ids: res.data.data.featured_category_ids || []
        });
      }
      const catRes = await api.get("/categories");
      if (catRes.data?.data) {
        setCategories(catRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load categories page settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      await api.put("/admin/cms/categories-page", settings);
      setSuccessMsg("Categories page configuration updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (id: string) => {
    const exists = settings.featured_category_ids.includes(id);
    if (exists) {
      setSettings({
        ...settings,
        featured_category_ids: settings.featured_category_ids.filter((cid) => cid !== id)
      });
    } else {
      setSettings({
        ...settings,
        featured_category_ids: [...settings.featured_category_ids, id]
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading categories page settings...</div>;
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                Categories Taxonomy Hub Page CMS
              </h2>
              <p className="text-xs text-slate-500">
                Manage presentation, hero banners, and featured taxonomy collections for /categories.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Headline Page Title *
              </label>
              <input
                type="text"
                required
                value={settings.page_title}
                onChange={(e) => setSettings({ ...settings, page_title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Intro
              </label>
              <textarea
                rows={2}
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hero Image URL
              </label>
              <input
                type="url"
                value={settings.banner_url}
                onChange={(e) => setSettings({ ...settings, banner_url: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Card Display Layout
              </label>
              <select
                value={settings.layout}
                onChange={(e) => setSettings({ ...settings, layout: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              >
                <option value="grid">Grid (4 Columns)</option>
                <option value="cards">Wide Cards with Subcategories</option>
                <option value="compact">Compact Minimal Badges</option>
              </select>
            </div>
          </div>
        </div>

        {/* Featured Categories Selection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Featured Categories ({settings.featured_category_ids.length} Selected)
              </h3>
              <p className="text-xs text-slate-500">
                Selected categories will be pinned at the top row of the marketplace directory.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
            {categories.map((cat) => {
              const isSelected = settings.featured_category_ids.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
};
