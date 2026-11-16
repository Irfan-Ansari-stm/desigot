"use client";
import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Briefcase, Star, Eye, TrendingUp, Clock } from "lucide-react";

export function PopularServicesReportView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>("/admin/analytics/popular-services", { limit: 50 })
      .then(setData)
      .catch((err) => console.error("Failed to load popular services:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading popular services rankings...</div>;
  }

  const services = data?.services || [];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-purple-500" />
              Popular Services Rankings Leaderboard
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Top custom creative services ranked by total revenue, booking conversion, and ratings</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg">
            {services.length} Listed Services
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-center w-12">Rank</th>
                <th className="px-4 py-3">Service Details</th>
                <th className="px-4 py-3">Designer / Studio</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-center">Views</th>
                <th className="px-4 py-3 text-center">Conv. Rate</th>
                <th className="px-4 py-3 text-right">Total GMV</th>
                <th className="px-4 py-3 text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {services.map((srv: any, idx: number) => (
                <tr key={srv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-center font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 max-w-sm truncate">
                    {srv.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{srv.seller_name}</td>
                  <td className="px-4 py-3 text-slate-500">{srv.category_name || "Creative"}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">${Number(srv.starting_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{srv.total_orders}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{srv.view_count}</td>
                  <td className="px-4 py-3 text-center font-semibold text-teal-600">{srv.conversion_rate || 4.2}%</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${Number(srv.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(srv.avg_rating || 5).toFixed(1)}
                    </span>
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
