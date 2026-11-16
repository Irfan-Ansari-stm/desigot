"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Package,
  Star,
  Trash2,
  TrendingUp,
  Eye,
  MousePointer,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export const FeaturedProductsTable: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [placement, setPlacement] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/marketing/featured-products", {
        params: { page, limit: 15, placement }
      });
      if (res.data?.success) {
        setItems(res.data.data);
        setTotal(res.data.meta?.total || res.data.total || 0);
      }
    } catch (err) {
      console.error("Error loading featured products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, placement]);

  const handlePriorityChange = async (id: string, currentPrio: number, delta: number) => {
    try {
      const newPrio = Math.max(1, currentPrio + delta);
      await api.put(`/admin/marketing/featured-products/${id}`, { priority: newPrio });
      fetchItems();
    } catch (err: any) {
      alert("Failed to update priority");
    }
  };

  const handleUnfeature = async (id: string, title: string) => {
    if (!confirm(`Unfeature product "${title}"?`)) return;
    try {
      await api.delete(`/admin/marketing/featured-products/${id}`);
      fetchItems();
    } catch (err) {
      alert("Failed to unfeature product");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Placements</option>
            <option value="homepage_hero">Homepage Hero</option>
            <option value="search_top">Search Top</option>
            <option value="category_top">Category Top</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-medium">{total} Featured Products</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <th className="py-3 px-3">Product Title</th>
              <th className="py-3 px-3">Creator / Seller</th>
              <th className="py-3 px-3">Placement</th>
              <th className="py-3 px-3">Priority / Order</th>
              <th className="py-3 px-3">Personal License</th>
              <th className="py-3 px-3">Impressions</th>
              <th className="py-3 px-3">Clicks</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={9} className="py-4 px-3"><div className="h-4 bg-slate-200 rounded w-full" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No featured products found.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{it.product_title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {it.seller_first_name} {it.seller_last_name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
                      {it.placement?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{it.priority}</span>
                      <button
                        onClick={() => handlePriorityChange(it.id, it.priority, 1)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                        title="Increase Priority"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handlePriorityChange(it.id, it.priority, -1)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                        title="Decrease Priority"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    ${((it.price_personal_cents || 0) / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3 text-slate-400" />
                      {(it.impressions || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <MousePointer className="w-3 h-3 text-slate-400" />
                      {(it.clicks || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleUnfeature(it.id, it.product_title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                      title="Unfeature Product"
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
    </div>
  );
};
