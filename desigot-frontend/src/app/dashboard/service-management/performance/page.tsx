"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TrendingUp, RefreshCw, Star, Eye, ShoppingCart, DollarSign, Award, Layers } from "lucide-react";
import { apiGet } from "@/lib/api";

interface TopService {
  id: string;
  title: string;
  slug: string;
  status: string;
  total_orders: number;
  total_revenue_usd: string;
  avg_rating: string;
  review_count: number;
  view_count: number;
  conversion_rate: string;
  seller_name: string;
  category_name?: string;
  thumbnail_url?: string;
}

interface CategoryPerformance {
  category_id: string;
  category_name: string;
  service_count: number;
  total_orders: number;
  total_revenue_usd: string;
  avg_rating: string;
}

export default function ServicePerformancePage() {
  const [data, setData] = useState<{
    topServices: TopService[];
    categoryPerformance: CategoryPerformance[];
  }>({ topServices: [], categoryPerformance: [] });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/services/performance");
      if (res) {
        const payload = res.data || res;
        setData({
          topServices: payload.topServices || [],
          categoryPerformance: payload.categoryPerformance || [],
        });
      }
    } catch (err) {
      console.error("Failed to load performance metrics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Service Performance Analytics</h1>
            <p className="text-sm text-slate-400">
              Conversion rates, sales velocity, review distributions, and high-earning catalog leaders.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Top Performing Services */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Top Services by Revenue & Conversion</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#1e293b]/70 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-4 px-4">Service</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Seller</th>
                <th className="py-4 px-4">Impressions / Views</th>
                <th className="py-4 px-4">Orders</th>
                <th className="py-4 px-4">Conversion Rate</th>
                <th className="py-4 px-4">Gross Revenue</th>
                <th className="py-4 px-4">Rating</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Calculating performance metrics...</p>
                  </td>
                </tr>
              ) : (
                data.topServices.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <Link
                          href={`/dashboard/service-management/${s.id}`}
                          className="font-bold text-white hover:text-indigo-400 transition-colors text-xs line-clamp-1 block"
                        >
                          {s.title}
                        </Link>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-400">{s.category_name}</td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-200">{s.seller_name}</td>

                    <td className="py-4 px-4 text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        {s.view_count}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs font-semibold text-white">{s.total_orders}</td>

                    <td className="py-4 px-4 text-xs font-bold text-indigo-400">
                      {s.conversion_rate}
                    </td>

                    <td className="py-4 px-4 text-xs font-bold text-emerald-400">
                      ${s.total_revenue_usd}
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <div className="flex items-center gap-1 font-semibold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {parseFloat(s.avg_rating || "5.0").toFixed(1)}
                        <span className="text-slate-500 text-[11px]">({s.review_count})</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Performance Matrix */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Category Performance & Volume Share</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.categoryPerformance.map((cat) => (
            <div
              key={cat.category_id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{cat.category_name}</span>
                <span className="text-xs font-bold text-emerald-400">${cat.total_revenue_usd}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>{cat.service_count} services listed</span>
                <span>{cat.total_orders} total orders</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
