"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Globe, Plus, Trash2, Save, CheckCircle, X } from "lucide-react";

export const SEORedirectsManager: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    default_meta_title: "",
    default_meta_description: "",
    canonical_base_url: "",
    robots_txt_content: ""
  });
  const [redirects, setRedirects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRedir, setNewRedir] = useState({
    source_path: "",
    destination_path: "",
    redirect_type: 301
  });

  useEffect(() => {
    fetchSeoData();
  }, []);

  const fetchSeoData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/seo");
      if (res.data?.data) {
        setSettings(res.data.data.settings || {});
        setRedirects(res.data.data.redirects || []);
      }
    } catch (err) {
      console.error("Failed to load SEO data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSuccessMsg("");
    try {
      await api.put("/admin/cms/seo", settings);
      setSuccessMsg("Global SEO metadata updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert("Failed to save SEO settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/cms/seo/redirects", newRedir);
      setIsModalOpen(false);
      setNewRedir({ source_path: "", destination_path: "", redirect_type: 301 });
      fetchSeoData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create redirect");
    }
  };

  const handleDeleteRedirect = async (id: string) => {
    if (!confirm("Are you sure you want to remove this redirect?")) return;
    try {
      await api.delete(`/admin/cms/seo/redirects/${id}`);
      fetchSeoData();
    } catch (err) {
      alert("Failed to delete redirect");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading SEO and Redirects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-600" />
            Global SEO Defaults & 301/302 URL Redirects Engine
          </h2>
          <p className="text-xs text-slate-500">
            Configure default OpenGraph assets, canonical URL routing, robots.txt, and URL redirection rules.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}

      {/* Global SEO Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">Default Metadata & Search Engine Directives</h3>
          <button
            type="submit"
            disabled={savingSettings}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            {savingSettings ? "Saving..." : "Save SEO Settings"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Default Meta Title
            </label>
            <input
              type="text"
              value={settings.default_meta_title || ""}
              onChange={(e) => setSettings({ ...settings, default_meta_title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Canonical Base URL
            </label>
            <input
              type="url"
              value={settings.canonical_base_url || ""}
              onChange={(e) => setSettings({ ...settings, canonical_base_url: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Default Meta Description
            </label>
            <textarea
              rows={2}
              value={settings.default_meta_description || ""}
              onChange={(e) => setSettings({ ...settings, default_meta_description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Robots.txt Content
            </label>
            <textarea
              rows={4}
              value={settings.robots_txt_content || ""}
              onChange={(e) => setSettings({ ...settings, robots_txt_content: e.target.value })}
              className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </form>

      {/* Redirects Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Active URL Redirect Rules ({redirects.length})</h3>
            <p className="text-xs text-slate-500">Prevent 404 broken links by mapping legacy routes to new canonical paths.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Redirect
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {redirects.map((r) => (
            <div key={r.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{r.source_path}</span>
                <span className="text-purple-600 font-bold">→</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{r.destination_path}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  HTTP {r.redirect_type}
                </span>
              </div>
              <button
                onClick={() => handleDeleteRedirect(r.id)}
                className="p-1 text-rose-400 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Redirect Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add URL Redirect</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRedirect} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Source Path *
                </label>
                <input
                  type="text"
                  required
                  value={newRedir.source_path}
                  onChange={(e) => setNewRedir({ ...newRedir, source_path: e.target.value })}
                  placeholder="/old-path"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Path *
                </label>
                <input
                  type="text"
                  required
                  value={newRedir.destination_path}
                  onChange={(e) => setNewRedir({ ...newRedir, destination_path: e.target.value })}
                  placeholder="/new-destination"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Redirect Type
                </label>
                <select
                  value={newRedir.redirect_type}
                  onChange={(e) => setNewRedir({ ...newRedir, redirect_type: parseInt(e.target.value, 10) || 301 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                >
                  <option value={301}>301 Permanent Redirect</option>
                  <option value={302}>302 Temporary Redirect</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
