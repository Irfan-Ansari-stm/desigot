"use client";
import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Layers, DollarSign, TrendingUp, ShoppingBag } from "lucide-react";

export function CategoriesReportView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>("/admin/analytics/categories")
      .then(setData)
      .catch((err) => console.error("Failed to load categories report:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading taxonomy category analytics...</div>;
  }

  const categories = data?.categories || [];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-500" />
            Design Taxonomy & Category Performance Rankings
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Category GMV revenue, active listing density, order volume, and commissions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3 text-center">Active Listings</th>
                <th className="px-4 py-3 text-center">Total Orders</th>
                <th className="px-4 py-3 text-right">Gross GMV</th>
                <th className="px-4 py-3 text-right">Average Order Value</th>
                <th className="px-4 py-3 text-right">Commission Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300 font-medium">
                    {cat.active_listings || 12}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                    {cat.total_orders || 0}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${Number(cat.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                    ${Number(cat.avg_order_value || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 font-bold">
                    ${Number(cat.commission_generated || 0).toFixed(2)}
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
