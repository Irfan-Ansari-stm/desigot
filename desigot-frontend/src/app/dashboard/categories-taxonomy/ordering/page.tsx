"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUpDown,
  Save,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Layers,
  Folder,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { CategoryStatsCards } from "@/components/categories-taxonomy/CategoryStatsCards";
import { CategoryStatusBadge } from "@/components/categories-taxonomy/CategoryStatusBadge";

interface Category {
  id: string;
  name: string;
  slug: string;
  depth: number;
  display_order: number;
  category_type: string;
  status: string;
}

export default function CategoryOrderingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [levelFilter, setLevelFilter] = useState<"all" | "main" | "sub">("main");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100, sort_by: "display_order", order: "asc" };
      if (levelFilter === "main") params.depth = 0;
      if (levelFilter === "sub") params.depth = 1;

      const res = await api.get("/admin/categories", { params });
      if (res.data?.success) {
        setCategories(res.data.data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories for ordering:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [levelFilter]);

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const list = [...categories];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Recalculate display_order
    const updated = list.map((item, idx) => ({ ...item, display_order: idx + 1 }));
    setCategories(updated);
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const orderedIds = categories.map((c) => c.id);
      await api.post("/admin/categories/reorder", { ordered_ids: orderedIds });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to persist category sequence:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <CategoryStatsCards />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Category Ordering & Marketplace Sequence</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              {categories.length} Items
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Control the visual sequence of categories across navbar dropdowns, browse grids, and seller creation flows
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Sequence"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
          <button
            onClick={handleSaveOrder}
            disabled={saving || categories.length === 0}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 text-xs font-semibold shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Sequence Order</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Category display sequence successfully saved and synchronized across marketplace!</span>
        </div>
      )}

      {/* Segment Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0f172a] border border-slate-800 w-fit">
        <button
          onClick={() => setLevelFilter("main")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            levelFilter === "main" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Main Pillars (Root Depth 0)
        </button>
        <button
          onClick={() => setLevelFilter("sub")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            levelFilter === "sub" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Subcategories (Depth 1)
        </button>
        <button
          onClick={() => setLevelFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            levelFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          All Categories
        </button>
      </div>

      {/* Sequence List */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl p-4 space-y-2">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-900/60 rounded-xl animate-pulse" />
          ))
        ) : categories.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No categories found for this level</p>
        ) : (
          categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">
                  #{idx + 1}
                </span>

                <Folder className="w-4 h-4 text-slate-400" />

                <div>
                  <span className="text-sm font-bold text-white">{cat.name}</span>
                  <span className="text-[11px] font-mono text-slate-500 ml-2">/{cat.slug}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CategoryStatusBadge type={cat.category_type} size="sm" />
                <CategoryStatusBadge status={cat.status} size="sm" />

                <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, "up")}
                    className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === categories.length - 1}
                    onClick={() => moveItem(idx, "down")}
                    className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
