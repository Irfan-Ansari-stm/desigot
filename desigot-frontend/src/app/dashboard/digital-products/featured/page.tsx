"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, Star, Layers, Search, Eye, ArrowUpRight } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { DigitalProductTable, DigitalProductItem } from "@/components/digital-products/DigitalProductTable";

export default function FeaturedProductsPage() {
  const [products, setProducts] = useState<DigitalProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadFeatured = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products", {
        is_featured: "true",
        search: search.trim() || undefined,
      });
      const items = res?.products || res?.data?.products || (Array.isArray(res) ? res : []);
      setProducts(items);
    } catch (err) {
      console.error("Failed to load featured products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Featured Products</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {products.length} Spotlights
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Curated showcase pinned to the marketplace hero banner, staff picks, and trending sections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadFeatured}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Featured Showcase Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.slice(0, 4).map((p, idx) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-[#0e1726] border border-slate-800 hover:border-amber-500/40 transition group relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Spotlight #{idx + 1}
            </div>
            <div className="w-full h-32 rounded-xl bg-slate-800 mb-3 overflow-hidden">
              {p.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              )}
            </div>
            <h4 className="font-semibold text-white text-sm truncate">{p.title}</h4>
            <p className="text-xs text-slate-400 mt-1 truncate">{p.category_name || "UI Kit"} • {p.file_formats?.join(", ")}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs">
              <span className="font-mono font-bold text-emerald-400">
                ${(p.price_personal_cents / 100).toFixed(2)}
              </span>
              <span className="text-slate-400">{p.total_sales} sales</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex items-center gap-3 shadow-lg max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search featured products..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      <DigitalProductTable
        products={products}
        isLoading={isLoading}
        onRefresh={loadFeatured}
      />
    </div>
  );
}
