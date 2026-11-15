"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { XCircle, RefreshCw, AlertTriangle, Search } from "lucide-react";
import { apiGet } from "@/lib/api";
import { DigitalProductTable, DigitalProductItem } from "@/components/digital-products/DigitalProductTable";

export default function RejectedProductsPage() {
  const [products, setProducts] = useState<DigitalProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadRejected = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products", {
        status: "rejected",
        search: search.trim() || undefined,
      });
      const items = res?.products || res?.data?.products || (Array.isArray(res) ? res : []);
      setProducts(items);
    } catch (err) {
      console.error("Failed to load rejected products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadRejected();
  }, [loadRejected]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Rejected Products</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {products.length} Rejected
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Submissions rejected due to copyright, quality, or formatting non-compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRejected}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-rose-400" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex items-center gap-3 shadow-lg max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rejected assets..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      <DigitalProductTable
        products={products}
        isLoading={isLoading}
        onRefresh={loadRejected}
      />
    </div>
  );
}
