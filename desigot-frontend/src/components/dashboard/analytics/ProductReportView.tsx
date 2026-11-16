"use client";
import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Layers, Download, DollarSign, Star, Shield, HardDrive } from "lucide-react";

export function ProductReportView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>("/admin/analytics/products")
      .then(setData)
      .catch((err) => console.error("Failed to load product report:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading digital product reports & download statistics...</div>;
  }

  const metrics = data?.metrics || {};
  const catalog = data?.catalog || {};
  const licenseBreakdown = data?.licenseBreakdown || [];
  const topProducts = data?.topProducts || [];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Digital Products Sold</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {Number(metrics.total_products_sold || 0).toLocaleString()}
          </div>
          <div className="text-xs text-sky-600 dark:text-sky-400 mt-1 font-medium">Assets & design kits purchased</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Product GMV Revenue</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ${Number(metrics.product_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Instant digital deliverables</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Asset Downloads</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {Number(catalog.total_downloads || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Direct CDN asset disbursals</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Published Catalog Size</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {Number(catalog.total_products_published || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Active verified products</div>
        </div>
      </div>

      {/* Licensing Tier Breakdown (3 Tiers) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-500" />
          License Distribution Breakdown (Personal vs Commercial vs Extended Enterprise)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {licenseBreakdown.map((tier: any) => (
            <div key={tier.tier} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{tier.tier}</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">{tier.sharePct}% share</div>
              <div className="text-xs text-slate-400 mt-1">Average benchmark: {tier.avgPrice}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Digital Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Top Digital Assets by Sales & Revenue</h3>
          <p className="text-xs text-slate-500">Live rankings based on unit sales, download counts, and ratings</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Digital Product</th>
                <th className="px-4 py-3">Creator / Studio</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Personal</th>
                <th className="px-4 py-3 text-right">Commercial</th>
                <th className="px-4 py-3 text-center">Sales</th>
                <th className="px-4 py-3 text-center">Downloads</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {topProducts.map((prd: any) => (
                <tr key={prd.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 max-w-sm truncate">
                    {prd.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{prd.seller_name}</td>
                  <td className="px-4 py-3 text-slate-500">{prd.category_name || "UI Kit"}</td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">${Number(prd.price_personal).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">${Number(prd.price_commercial).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center font-bold text-sky-600 dark:text-sky-400">{prd.total_sales}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{prd.total_downloads}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${Number(prd.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(prd.avg_rating || 5).toFixed(1)}
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
