"use client";
import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Calculator, Percent, DollarSign, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export function CommissionReportView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>("/admin/analytics/commissions")
      .then(setData)
      .catch((err) => console.error("Failed to load commission report:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading commission ledger & platform settlement records...</div>;
  }

  const kpis = data?.kpis || {};
  const statusBreakdown = data?.statusBreakdown || [];
  const ledger = data?.ledger || [];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Platform Commission</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            ${Number(kpis.total_commission_generated || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Platform fee retained</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Underlying Gross Volume</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            ${Number(kpis.total_gmv || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total orders processed</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Effective Commission Rate</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {Number(kpis.avg_commission_rate || 15).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Weighted platform take rate</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Net Seller Disbursals</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ${Number(kpis.total_seller_net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Transferred creator earnings</div>
        </div>
      </div>

      {/* Commission Status Breakdown (Approved, Pending, Reversed) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusBreakdown.map((sb: any) => (
          <div key={sb.status} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="capitalize font-bold text-xs text-slate-800 dark:text-slate-200">{sb.status} Commission</span>
              <span className="text-xs text-slate-400">{sb.count} records</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              ${Number(sb.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* Commission Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Live Commission Ledger</h3>
          <p className="text-xs text-slate-500">Immutable ledger entries with rate percentages and plan tiers</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Ledger ID</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3 text-right">Gross GMV</th>
                <th className="px-4 py-3 text-center">Rate</th>
                <th className="px-4 py-3 text-right">Commission Taken</th>
                <th className="px-4 py-3 text-right">Net Creator Payout</th>
                <th className="px-4 py-3">Plan Tier</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ledger.map((row: any) => (
                <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{row.id.substring(0, 8)}...</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{row.seller_name}</td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">${Number(row.gross_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{row.commission_rate}%</td>
                  <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">${Number(row.commission_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">${Number(row.net_seller_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize text-slate-500">{row.seller_plan || "Standard"}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(row.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
