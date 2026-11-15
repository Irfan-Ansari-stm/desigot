"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DollarSign, RefreshCw, Search, TrendingUp, Layers, ShoppingBag, ArrowUpRight } from "lucide-react";
import { apiGet } from "@/lib/api";

interface SaleOrder {
  id: string;
  order_id?: string;
  product_title?: string;
  listing_title?: string;
  digital_product_id?: string;
  buyer_name?: string;
  buyer_email?: string;
  seller_name?: string;
  seller_email?: string;
  license_type: string;
  amount_cents: number;
  status: string;
  created_at: string;
}

export default function ProductSalesPage() {
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products/sales");
      const items = res?.sales || res?.data?.sales || (Array.isArray(res) ? res : []);
      setSales(items);
    } catch (err) {
      console.error("Failed to load sales:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const totalGrossCents = sales.reduce((acc, s) => acc + (s.amount_cents || 0), 0);

  const filtered = sales.filter(
    (s) =>
      s.product_title?.toLowerCase().includes(search.toLowerCase()) ||
      s.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.buyer_email?.toLowerCase().includes(search.toLowerCase()) ||
      s.license_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Product Sales & Revenue</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ${(totalGrossCents / 100).toLocaleString()} Gross
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Transaction records, customer license tier distribution, and marketplace revenue logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSales}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1726] border border-slate-800 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Gross Sales Revenue</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            ${(totalGrossCents / 100).toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500">Asset licenses purchased</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1726] border border-slate-800 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Total Completed Orders</span>
          <p className="text-2xl font-bold text-white font-mono">{sales.length}</p>
          <span className="text-[11px] text-slate-500">Stripe & digital checkout</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1726] border border-slate-800 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Avg Order Value (AOV)</span>
          <p className="text-2xl font-bold text-indigo-400 font-mono">
            ${sales.length > 0 ? (totalGrossCents / 100 / sales.length).toFixed(2) : "0.00"}
          </p>
          <span className="text-[11px] text-slate-500">Blended across all tiers</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex items-center gap-3 shadow-lg max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter sales by customer, asset, license..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Sales Table */}
      <div className="w-full bg-[#0e1726] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#121c2d] text-xs uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-4">Order ID</th>
                <th className="py-4 px-3">Product Name</th>
                <th className="py-4 px-3">Customer</th>
                <th className="py-4 px-3">License Tier</th>
                <th className="py-4 px-3">Amount</th>
                <th className="py-4 px-3">Status</th>
                <th className="py-4 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4 font-mono text-xs text-indigo-400">
                    {s.id.substring(0, 8)}...
                  </td>

                  <td className="py-4 px-3">
                    <span className="font-semibold text-white block text-sm max-w-xs truncate">
                      {s.product_title || s.listing_title || "Design Asset"}
                    </span>
                  </td>

                  <td className="py-4 px-3">
                    <span className="font-medium text-white block text-xs">
                      {s.buyer_name || "Buyer"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {s.buyer_email || "buyer@desigot.com"}
                    </span>
                  </td>

                  <td className="py-4 px-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 capitalize">
                      {s.license_type || "Commercial"}
                    </span>
                  </td>

                  <td className="py-4 px-3 font-mono font-bold text-emerald-400">
                    ${((s.amount_cents || 0) / 100).toFixed(2)}
                  </td>

                  <td className="py-4 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Paid
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right text-xs text-slate-400 font-mono">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
