"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Image as ImageIcon,
  Plus,
  Power,
  Trash2,
  ExternalLink,
  Eye,
  MousePointer,
  Monitor,
  Tablet,
  Smartphone,
  AlertCircle
} from "lucide-react";

export const HomepageBannersTable: React.FC = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeDevice, setActiveDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    subtitle: "",
    placement: "hero",
    image_desktop_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80",
    cta_text: "Explore Now",
    cta_link: "/browse",
    priority: 10
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/marketing/banners", {
        params: { page, limit: 15 }
      });
      if (res.data?.success) {
        setBanners(res.data.data);
        setTotal(res.data.meta?.total || res.data.total || 0);
      }
    } catch (err) {
      console.error("Error loading banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [page]);

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/admin/marketing/banners/${id}/toggle-status`);
      fetchBanners();
    } catch (err) {
      alert("Failed to toggle banner status");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete banner "${title}"?`)) return;
    try {
      await api.delete(`/admin/marketing/banners/${id}`);
      fetchBanners();
    } catch (err) {
      alert("Failed to delete banner");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post("/admin/marketing/banners", createForm);
      setShowCreate(false);
      fetchBanners();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create banner");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Device Preview:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveDevice("desktop")}
              className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 transition ${
                activeDevice === "desktop"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 font-semibold shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>
            <button
              onClick={() => setActiveDevice("tablet")}
              className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 transition ${
                activeDevice === "tablet"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 font-semibold shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              Tablet
            </button>
            <button
              onClick={() => setActiveDevice("mobile")}
              className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 transition ${
                activeDevice === "mobile"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 font-semibold shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Homepage Banner
        </button>
      </div>

      {/* Responsive Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-64 animate-pulse" />
          ))
        ) : banners.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            No homepage banners configured.
          </div>
        ) : (
          banners.map((b) => {
            const imps = b.impressions || 0;
            const clicks = b.clicks || 0;
            const ctr = imps > 0 ? ((clicks / imps) * 100).toFixed(2) : "0.00";

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
              >
                {/* Visual Preview Box */}
                <div className="relative h-44 bg-slate-950 overflow-hidden group">
                  <img
                    src={b.image_desktop_url || b.desktop_image_url}
                    alt={b.title}
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 flex flex-col justify-end">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                      {b.placement || b.banner_type} • Priority {b.display_priority ?? b.priority}
                    </span>
                    <h4 className="text-base font-bold text-white leading-tight">{b.title}</h4>
                    {b.subtitle && <p className="text-xs text-slate-300 line-clamp-1">{b.subtitle}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2.5 py-1 text-[11px] font-semibold bg-white text-slate-950 rounded-lg shadow-xs">
                        {b.cta_text || "Explore Now"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Stats */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {imps.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <MousePointer className="w-3.5 h-3.5 text-slate-400" />
                      {clicks.toLocaleString()}
                    </span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {ctr}% CTR
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(b.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition flex items-center gap-1 ${
                        b.status === "published" || b.is_active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {b.status === "published" || b.is_active ? "Live" : "Inactive"}
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Banner</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400">✕</button>
            </div>

            {errorMsg && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{errorMsg}</div>}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spring Design Carnival"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Save 25% on elite design services"
                  value={createForm.subtitle}
                  onChange={(e) => setCreateForm({ ...createForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Desktop Image URL *</label>
                <input
                  type="url"
                  required
                  value={createForm.image_desktop_url}
                  onChange={(e) => setCreateForm({ ...createForm, image_desktop_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">CTA Text</label>
                  <input
                    type="text"
                    value={createForm.cta_text}
                    onChange={(e) => setCreateForm({ ...createForm, cta_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">CTA Link</label>
                  <input
                    type="text"
                    value={createForm.cta_link}
                    onChange={(e) => setCreateForm({ ...createForm, cta_link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold">
                  {submitting ? "Saving..." : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
