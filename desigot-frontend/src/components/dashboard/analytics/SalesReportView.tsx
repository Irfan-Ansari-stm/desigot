"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api";
import { ShoppingCart, TrendingUp, Users, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export function SalesReportView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/admin/analytics/sales", { page, limit: 15, type: filterType });
      setData(res);
    } catch (err) {
      console.error("Failed to load sales report:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading sales report data...</div>;
  }

  const summary = data?.summary || {};
  const orders = data?.orders || [];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Order Volume</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {Number(summary.total_orders || 0).toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 mt-1 font-medium">Completed: {summary.completed_orders || 0}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Gross Sales Value</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ${Number(summary.total_volume || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total recognized checkouts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Average Order Value (AOV)</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            ${Number(summary.avg_order_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Per transaction basket size</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Repeat Purchase Rate</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {summary.repeatPurchaseRate || 0}%
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
            {summary.repeatBuyers || 0} returning buyers
          </div>
        </div>
      </div>

      {/* Orders Volume Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-blue-500" />
          Sales & Order Volume Timeline
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.volumeSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}`, "Orders"]} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="order_count" name="Daily Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Orders & Fulfillment Log</h3>
            <p className="text-xs text-slate-500">All customer purchases with live status verification</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1.5"
            >
              <option value="all">All Types</option>
              <option value="service">Services Only</option>
              <option value="asset">Digital Products Only</option>
            </select>
            <button onClick={loadData} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Item / Service</th>
                <th className="px-4 py-3">Category Type</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((ord: any) => (
                <tr key={ord.order_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                    {ord.listing_title}
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {ord.listing_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{ord.customer_name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{ord.seller_name}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    ${Number(ord.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      ord.status === "complete" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{new Date(ord.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {data?.pagination?.totalPages || 1}</span>
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
