"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  LayoutGrid,
  Plus,
  Trash2,
  Layers,
  CheckCircle,
  Eye,
  SlidersHorizontal
} from "lucide-react";

export const PromotionalSectionsTable: React.FC = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    subtitle: "",
    section_type: "featured_products",
    layout: "grid",
    columns_count: 4,
    max_items_count: 8,
    priority: 10
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/marketing/sections");
      if (res.data?.success) {
        setSections(res.data.data);
        setTotal(res.data.meta?.total || res.data.total || 0);
      }
    } catch (err) {
      console.error("Error loading promotional sections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete section "${title}"?`)) return;
    try {
      await api.delete(`/admin/marketing/sections/${id}`);
      fetchSections();
    } catch (err) {
      alert("Failed to delete section");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/admin/marketing/sections", createForm);
      setShowCreate(false);
      fetchSections();
    } catch (err) {
      alert("Failed to create section");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Homepage Sections</h3>
          <p className="text-xs text-slate-500">Configure curated dynamic showcases and product rails</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Promotional Section
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
              <th className="py-3 px-3">Section Title / Subtitle</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Layout</th>
              <th className="py-3 px-3">Grid Columns</th>
              <th className="py-3 px-3">Max Display Count</th>
              <th className="py-3 px-3">Curated Items</th>
              <th className="py-3 px-3">Priority</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-3"><div className="h-4 bg-slate-200 rounded w-full" /></td>
                </tr>
              ))
            ) : sections.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No promotional sections found.
                </td>
              </tr>
            ) : (
              sections.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{s.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{s.subtitle || "No subtitle"}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] uppercase text-purple-600 dark:text-purple-400 font-bold">
                    {s.section_type?.replace("_", " ")}
                  </td>
                  <td className="py-3 px-3 capitalize text-slate-700 dark:text-slate-300">
                    {s.layout || s.display_layout || "grid"}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {s.columns_count || s.grid_columns || 4} cols
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {s.max_items_count || s.display_count || 8} items
                  </td>
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {s.items_count ?? 0}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {s.priority || s.sort_order || 10}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDelete(s.id, s.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Promotional Section</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Section Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Most Popular Vector Icon Sets"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Crafted by verified Desigot contributors"
                  value={createForm.subtitle}
                  onChange={(e) => setCreateForm({ ...createForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Section Type</label>
                  <select
                    value={createForm.section_type}
                    onChange={(e) => setCreateForm({ ...createForm, section_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="featured_products">Featured Products</option>
                    <option value="trending_services">Trending Services</option>
                    <option value="best_sellers">Best Sellers</option>
                    <option value="new_arrivals">New Arrivals</option>
                    <option value="featured_categories">Featured Categories</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Layout</label>
                  <select
                    value={createForm.layout}
                    onChange={(e) => setCreateForm({ ...createForm, layout: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="grid">Grid</option>
                    <option value="carousel">Carousel</option>
                    <option value="highlight">Highlight Banner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Grid Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={createForm.columns_count}
                    onChange={(e) => setCreateForm({ ...createForm, columns_count: parseInt(e.target.value, 10) || 4 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Max Items Count</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={createForm.max_items_count}
                    onChange={(e) => setCreateForm({ ...createForm, max_items_count: parseInt(e.target.value, 10) || 8 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold">
                  {submitting ? "Saving..." : "Save Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
