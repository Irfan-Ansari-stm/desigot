"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tag, Plus, RefreshCw, Search } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  usage_count: number;
  assigned_count: number;
  is_active: boolean;
}

export default function ServiceTagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/admin/services/tags", { search });
      const list = Array.isArray(data) ? data : data?.tags || data?.data || [];
      setTags(list);
    } catch (err) {
      console.error("Failed to load tags:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/admin/services/tags", form);
      setIsModalOpen(false);
      setForm({ name: "", description: "" });
      await loadData();
    } catch (err) {
      console.error("Failed to create tag:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Service Tags</h1>
            <p className="text-sm text-slate-400">
              Taxonomy keyword tags for discovery, search filtering, and SEO indexation.
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
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Tag
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Found <span className="text-white font-bold">{tags.length}</span> active tags
        </div>
      </div>

      {/* Tags Flow Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading tags...</p>
          </div>
        ) : (
          tags.map((t) => (
            <div
              key={t.id}
              className="p-3 bg-[#0f172a] border border-slate-800 rounded-xl hover:border-slate-700 transition-colors flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <span className="font-semibold text-white text-xs block truncate">{t.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">/{t.slug}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300 flex-shrink-0">
                {t.assigned_count || t.usage_count}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-white">Add Marketplace Tag</h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Tag Name
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
                Description (Optional)
              </label>
              <input
                type="text"
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
                Create Tag
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
