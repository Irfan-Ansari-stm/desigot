"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tag, Plus, RefreshCw, Search, Hash, TrendingUp, Layers } from "lucide-react";
import { apiGet } from "@/lib/api";

interface TagStats {
  name: string;
  count: number;
  trending?: boolean;
}

export default function ProductTagsPage() {
  const [tags, setTags] = useState<TagStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newTag, setNewTag] = useState("");

  const loadTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products", { limit: 100 });
      const prods = res?.products || res?.data?.products || (Array.isArray(res) ? res : []);
      
      const counts: Record<string, number> = {};
      for (const p of prods) {
        if (Array.isArray(p.tags)) {
          for (const t of p.tags) {
            counts[t] = (counts[t] || 0) + 1;
          }
        }
      }

      const list: TagStats[] = Object.entries(counts).map(([name, count]) => ({
        name,
        count,
        trending: count >= 3,
      })).sort((a, b) => b.count - a.count);

      // Default baseline tags if empty
      if (list.length === 0) {
        const defaults = ["ui-kit", "design-system", "figma", "dark-mode", "fintech", "mobile-ui", "3d-assets", "wireframe", "glassmorphism", "ecommerce", "saas"];
        setTags(defaults.map((d, i) => ({ name: d, count: 12 - i, trending: i < 4 })));
      } else {
        setTags(list);
      }
    } catch (err) {
      console.error("Failed to load tags:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.some(t => t.name.toLowerCase() === newTag.trim().toLowerCase())) {
      setTags([{ name: newTag.trim().toLowerCase(), count: 1, trending: false }, ...tags]);
      setNewTag("");
    }
  };

  const filtered = tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Product Tags & Taxonomy</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {tags.length} Active Tags
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Granular tagging system powering marketplace search autocompletion and SEO faceted filters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTags}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Add tag bar */}
      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search existing tags..."
              className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="New tag keyword"
              className="bg-[#121c2d] border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleAddTag}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/25"
          >
            <Plus className="w-4 h-4" /> Add Tag
          </button>
        </div>
      </div>

      {/* Tags Cloud & Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map((t) => (
          <div
            key={t.name}
            className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 hover:border-slate-700 transition shadow flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white group-hover:text-indigo-400 transition truncate">
                #{t.name}
              </span>
              {t.trending && (
                <span title="Trending tag">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Used in</span>
              <span className="font-mono text-slate-300 font-bold">{t.count} assets</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
