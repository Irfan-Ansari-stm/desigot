"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api";
import { DollarSign, TrendingUp, CreditCard, ShieldCheck, FileSpreadsheet, ArrowDownRight, RefreshCw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export function RevenueReportView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/admin/analytics/revenue", { page, limit: 15 });
      setData(res);
    } catch (err) {
      console.error("Failed to load revenue report:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading revenue reports from database...</div>;
  }

  const summary = data?.summary || {};
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Gross Recognized Revenue</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            ${Number(summary.gross_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3.5 w-3.5" /> Total marketplace sales
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Net Settled Revenue</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            ${Number(summary.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Excludes cancelled & refunded</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Platform Fees & Take</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            ${Number(summary.marketplace_commission || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Desigot commission earnings</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Refunds & Liabilities</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            ${Number(summary.refunds || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Returned buyer charges</div>
        </div>
      </div>

      {/* Daily Revenue Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-500" />
          Daily Revenue & Commission Trajectory
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.dailyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, ""]} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              <Area type="monotone" dataKey="gross" name="Gross Sales" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Area type="monotone" dataKey="net" name="Net Settled" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              <Area type="monotone" dataKey="commission" name="Platform Take" stroke="#f43f5e" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Transactions Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Revenue Ledger Transactions</h3>
            <p className="text-xs text-slate-500">Live order settlements and commission allocations</p>
          </div>
          <button onClick={loadData} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Platform Fee</th>
                <th className="px-4 py-3 text-right">Seller Payout</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((tx: any) => (
                <tr key={tx.transaction_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">{tx.listing_title}</div>
                    <div className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {tx.listing_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{tx.customer_name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{tx.seller_name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">${Number(tx.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">${Number(tx.commission).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">${Number(tx.seller_payout).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      tx.status === "complete" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : "bg-amber-50 text-amber-600"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing page {page} of {data?.pagination?.totalPages || 1}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data?.pagination?.totalPages || 1, p + 1))}
              disabled={page >= (data?.pagination?.totalPages || 1)}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
