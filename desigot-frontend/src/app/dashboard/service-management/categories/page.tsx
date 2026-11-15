"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FolderTree, Plus, RefreshCw, Layers, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  parent_name?: string;
  icon_name?: string;
  sort_order: number;
  is_active: boolean;
  service_count: number;
  subcategory_count: number;
}

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parent_id: "",
    icon_name: "Briefcase",
    sort_order: 0,
    is_active: true,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/admin/services/categories");
      const list = Array.isArray(data) ? data : data?.categories || data?.data || [];
      setCategories(list);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const { apiPut } = await import("@/lib/api");
        await apiPut(`/admin/services/categories/${editingCategory.id}`, form);
      } else {
        await apiPost("/admin/services/categories", form);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setForm({ name: "", slug: "", description: "", parent_id: "", icon_name: "Briefcase", sort_order: 0, is_active: true });
      await loadData();
    } catch (err) {
      console.error("Failed to save category:", err);
    }
  };

  const topLevelCategories = categories.filter((c) => !c.parent_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Service Categories</h1>
            <p className="text-sm text-slate-400">
              Taxonomy classification and subcategory tree for professional design services.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setEditingCategory(null);
              setForm({ name: "", slug: "", description: "", parent_id: "", icon_name: "Briefcase", sort_order: 0, is_active: true });
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Grid of Parent Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 py-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading categories...</p>
          </div>
        ) : (
          topLevelCategories.map((cat) => {
            const subcats = categories.filter((c) => c.parent_id === cat.id);

            return (
              <div
                key={cat.id}
                className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{cat.name}</h3>
                      <span className="text-xs text-slate-500 font-mono">/{cat.slug}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {cat.service_count} Services
                  </span>
                </div>

                {cat.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
                )}

                {/* Subcategories list */}
                {subcats.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Subcategories ({subcats.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {subcats.map((sc) => (
                        <span
                          key={sc.id}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium"
                        >
                          {sc.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-white">
              {editingCategory ? "Edit Category" : "Add Service Category"}
            </h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Parent Category (Optional)
              </label>
              <select
                value={form.parent_id}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="">None (Top-Level Primary Category)</option>
                {topLevelCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
