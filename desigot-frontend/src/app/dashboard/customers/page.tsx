"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import {
  Users,
  UserPlus,
  RotateCw,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface CustomerData {
  kpis: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    customersWithPurchases: number;
    avgLtv: number;
    aov: number;
  };
  topCustomers: Array<{
    id: string;
    display_name: string;
    email: string;
    order_count: number;
    total_spend: number;
    last_purchase_date: string;
    created_at: string;
  }>;
  segments: Array<{
    segment: string;
    count: number;
  }>;
  growth: Array<{
    date: string;
    new_customers: number;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function CustomerAnalyticsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomerData | null>(null);
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<CustomerData>("/admin/analytics/customers", { period, page, limit: 12 });
      if (res) setData(res);
    } catch (err) {
      console.error("Customer analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, [period, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const k = data?.kpis;
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
          Customer Intelligence & Lifetime Value
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Buyer cohort retention, repeat purchasing patterns, lifetime value (LTV), and account segmentation.
        </p>
      </div>

      <DashboardFilterBar
        onRefresh={loadData}
        isRefreshing={loading}
        exportType="customers"
      />

      {/* Customer KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <DashboardStatCard
          title="Total Customers"
          value={k?.totalCustomers ?? 0}
          icon={Users}
          loading={loading}
        />
        <DashboardStatCard
          title="Active Buyers"
          value={k?.activeCustomers ?? 0}
          icon={ShoppingBag}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
          iconTextColor="text-emerald-600 dark:text-emerald-400"
          loading={loading}
        />
        <DashboardStatCard
          title="Repeat Buyers"
          value={k?.returningCustomers ?? 0}
          icon={RotateCw}
          iconBgColor="bg-purple-50 dark:bg-purple-950/50"
          iconTextColor="text-purple-600 dark:text-purple-400"
          loading={loading}
        />
        <DashboardStatCard
          title="New Onboarding"
          value={k?.newCustomers ?? 0}
          icon={UserPlus}
          iconBgColor="bg-blue-50 dark:bg-blue-950/50"
          iconTextColor="text-blue-600 dark:text-blue-400"
          loading={loading}
        />
        <DashboardStatCard
          title="Avg Lifetime (LTV)"
          value={k?.avgLtv ?? 0}
          prefix="$"
          icon={DollarSign}
          iconBgColor="bg-indigo-50 dark:bg-indigo-950/50"
          iconTextColor="text-indigo-600 dark:text-indigo-400"
          loading={loading}
        />
        <DashboardStatCard
          title="Avg Order (AOV)"
          value={k?.aov ?? 0}
          prefix="$"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Two Column Grid: Acquisition Trends & Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Growth Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Customer Registration & Acquisition
            </h2>
            <p className="text-xs text-slate-500">Daily new account signups across marketing channels</p>
          </div>

          <div className="h-60 w-full">
            {data?.growth && data.growth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="new_customers" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No growth records for this period.
              </div>
            )}
          </div>
        </div>

        {/* Customer Cohort Segments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Buyer Segmentation
            </h2>
            <p className="text-xs text-slate-500">Value cohorts</p>
          </div>

          <div className="space-y-3">
            {(data?.segments || []).map((seg) => (
              <div
                key={seg.segment}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {seg.segment}
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {seg.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Top Customers by Lifetime Spending
          </h2>
          <p className="text-xs text-slate-500">
            Highest grossing client accounts across enterprise subscriptions and design kits
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Customer Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold text-center">Completed Orders</th>
                <th className="pb-3 font-semibold text-right">Total Lifetime Spend</th>
                <th className="pb-3 font-semibold text-right">Last Purchase</th>
                <th className="pb-3 font-semibold text-right">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {(data?.topCustomers || []).map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                      {cust.display_name.charAt(0)}
                    </div>
                    <span>{cust.display_name}</span>
                  </td>
                  <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{cust.email}</td>
                  <td className="py-3 pr-3 text-center font-bold text-slate-800 dark:text-slate-200">
                    {cust.order_count}
                  </td>
                  <td className="py-3 pr-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${Number(cust.total_spend).toLocaleString()}
                  </td>
                  <td className="py-3 pr-3 text-right text-slate-500">
                    {cust.last_purchase_date
                      ? new Date(cust.last_purchase_date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="py-3 text-right text-slate-400">
                    {new Date(cust.created_at).toLocaleDateString([], { month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
