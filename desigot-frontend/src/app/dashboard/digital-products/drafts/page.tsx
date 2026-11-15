"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Clock, Plus, RefreshCw, Search, FileEdit } from "lucide-react";
import { apiGet } from "@/lib/api";
import { DigitalProductTable, DigitalProductItem } from "@/components/digital-products/DigitalProductTable";

export default function DraftProductsPage() {
  const [products, setProducts] = useState<DigitalProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products", {
        status: "draft",
        search: search.trim() || undefined,
      });
      const items = res?.products || res?.data?.products || (Array.isArray(res) ? res : []);
      setProducts(items);
    } catch (err) {
      console.error("Failed to load draft products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-slate-400 flex items-center justify-center">
            <FileEdit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Draft Products</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {products.length} Unfinished
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Work-in-progress digital assets saved by sellers and curators prior to submission.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDrafts}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-slate-400" : ""}`} />
          </button>
          <Link
            href="/dashboard/digital-products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex items-center gap-3 shadow-lg max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drafts..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      <DigitalProductTable
        products={products}
        isLoading={isLoading}
        onRefresh={loadDrafts}
      />
    </div>
  );
}
