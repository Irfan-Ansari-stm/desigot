"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Clock, ShieldAlert, CheckCircle2, XCircle, RefreshCw, AlertCircle, Search } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { DigitalProductTable, DigitalProductItem } from "@/components/digital-products/DigitalProductTable";

export default function PendingProductsPage() {
  const [products, setProducts] = useState<DigitalProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products", {
        status: "pending_review",
        search: search.trim() || undefined,
      });
      const items = res?.products || res?.data?.products || (Array.isArray(res) ? res : []);
      setProducts(items);
    } catch (err) {
      console.error("Failed to load pending queue:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Pending Products Queue</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {products.length} In Review
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Moderation gate: inspect deliverables, test Figma auto-layout, verify licensing, and approve for store.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPending}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Moderation Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-3 text-sm text-amber-200">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
        <div>
          <span className="font-semibold text-white">Quality Review SLA:</span> Submissions must be inspected for file integrity, font licenses, and design layer naming within 24 hours.
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex items-center gap-3 shadow-lg max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter queue by product or seller..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Table with moderation controls */}
      <DigitalProductTable
        products={products}
        isLoading={isLoading}
        onRefresh={loadPending}
        showModerationActions={true}
      />
    </div>
  );
}
