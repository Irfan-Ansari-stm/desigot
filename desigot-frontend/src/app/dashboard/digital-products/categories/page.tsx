"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FolderTree, Plus, RefreshCw, Search, Layers, Edit2, ExternalLink } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  listing_count?: number;
  product_count?: number;
  is_active?: boolean;
}

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/categories");
      const items = res?.data || (Array.isArray(res) ? res : []);
      setCategories(items);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreate = async () => {
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    try {
      await apiPost("/categories", {
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      setCreateModalOpen(false);
      setNewCatName("");
      setNewCatDesc("");
      loadCategories();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Product Categories</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {categories.length} Taxonomy Nodes
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Taxonomy classification organizing digital assets across UI, Mobile, 3D, and Design Systems.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCategories}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25"
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex items-center gap-3 shadow-lg max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter categories by name or slug..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            className="p-5 rounded-2xl bg-[#0e1726] border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800/80 text-slate-400 border border-slate-700/60">
                  /{cat.slug}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">{cat.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                {cat.description || "Collection of production-grade design assets."}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-4 text-xs">
              <span className="text-emerald-400 font-medium">Active in Catalog</span>
              <span className="text-slate-500 font-mono">ID: {cat.id.substring(0, 8)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121c2d] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Create Product Category</h3>
            <p className="text-sm text-slate-400 mb-4">
              Add a new category node to the marketplace navigation and search filters.
            </p>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. AI Prompt Toolkits"
                  className="w-full bg-[#0a101d] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Describe assets found within this category..."
                  className="w-full bg-[#0a101d] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting || !newCatName.trim()}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/25"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
