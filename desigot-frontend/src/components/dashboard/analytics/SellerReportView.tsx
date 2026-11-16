"use client";
import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Store, ShieldCheck, Star, Users, DollarSign, Wallet } from "lucide-react";

export function SellerReportView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>("/admin/analytics/sellers")
      .then(setData)
      .catch((err) => console.error("Failed to load seller report:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading seller performance & payout statistics...</div>;
  }

  const stats = data?.stats || {};
  const leaderboard = data?.leaderboard || [];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Marketplace Sellers</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {Number(stats.total_sellers || 0).toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">{stats.verified_sellers || 0} verified creators</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Design Studios & Agencies</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {Number(stats.agencies || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Multi-seat agency accounts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Independent Freelancers</div>
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">
            {Number(stats.freelancers || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Solo verified design pros</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Platform Average Rating</div>
          <div className="text-2xl font-bold text-amber-500 mt-2 flex items-center gap-1.5">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            {Number(stats.avg_rating || 4.8).toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all completed orders</div>
        </div>
      </div>

      {/* Seller Performance Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Top Seller Gross Revenue & Payout Ledger</h3>
          <p className="text-xs text-slate-500">Live rankings by sales volume, escrow holdings, and client ratings</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Seller / Studio</th>
                <th className="px-4 py-3">Account Type</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-right">Gross GMV</th>
                <th className="px-4 py-3 text-right">Net Payout</th>
                <th className="px-4 py-3 text-right">Available Balance</th>
                <th className="px-4 py-3 text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.map((seller: any) => (
                <tr key={seller.seller_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{seller.display_name}</div>
                    <div className="text-[10px] text-slate-400">{seller.email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                    {seller.seller_type || "freelancer"}
                  </td>
                  <td className="px-4 py-3">
                    {seller.seller_verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Standard</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                    {seller.period_orders}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    ${Number(seller.gross_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${Number(seller.net_payout).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                    ${Number(seller.available_balance).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(seller.avg_seller_rating || 5).toFixed(1)}
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
