"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Briefcase, Save, CheckCircle } from "lucide-react";

export const ServicesPageCMS: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    page_title: "",
    subtitle: "",
    banner_url: "",
    featured_service_ids: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/services-page");
      if (res.data?.data) {
        setSettings({
          page_title: res.data.data.page_title || "",
          subtitle: res.data.data.subtitle || "",
          banner_url: res.data.data.banner_url || "",
          featured_service_ids: res.data.data.featured_service_ids || []
        });
      }
      const sRes = await api.get("/admin/services");
      if (sRes.data?.data) {
        setServices(sRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load services page settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      await api.put("/admin/cms/services-page", settings);
      setSuccessMsg("Services page CMS configuration updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleFeaturedService = (id: string) => {
    const exists = settings.featured_service_ids.includes(id);
    if (exists) {
      setSettings({
        ...settings,
        featured_service_ids: settings.featured_service_ids.filter((sid) => sid !== id)
      });
    } else {
      setSettings({
        ...settings,
        featured_service_ids: [...settings.featured_service_ids, id]
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading services page configuration...</div>;
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
                <Briefcase className="w-4 h-4 text-purple-600" />
                Services Hub Page Settings & Featured Showcase
              </h2>
              <p className="text-xs text-slate-500">
                Configure the header banner, copy, and top recommended agency services for clients.
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
                Subtitle / Value Proposition
              </label>
              <textarea
                rows={2}
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Header Hero Background Image URL
              </label>
              <input
                type="url"
                value={settings.banner_url}
                onChange={(e) => setSettings({ ...settings, banner_url: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Featured Services Selection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Featured Services Showcase ({settings.featured_service_ids.length} Selected)
              </h3>
              <p className="text-xs text-slate-500">
                Select which verified services appear highlighted at the top of the /services page.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
            {services.map((service) => {
              const isSelected = settings.featured_service_ids.includes(service.id);
              return (
                <div
                  key={service.id}
                  onClick={() => toggleFeaturedService(service.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="truncate mr-2">
                    <span className="font-bold line-clamp-1">{service.title}</span>
                    <span className="text-[10px] text-slate-400">by {service.seller_name || "Agency"}</span>
                  </div>
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
