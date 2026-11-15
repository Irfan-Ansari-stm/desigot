"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import {
  Store,
  UserCheck,
  Clock,
  Ban,
  Star,
  DollarSign,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
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

interface SellerData {
  kpis: {
    totalSellers: number;
    activeSellers: number;
    verifiedSellers: number;
    pendingApplications: number;
    suspendedSellers: number;
    sellersWithSales: number;
    avgRating: number;
    totalSellerEarnings: number;
  };
  topSellers: Array<{
    id: string;
    display_name: string;
    username: string;
    email: string;
    avatar_url?: string;
    seller_type: string;
    seller_verified: boolean;
    total_sales: number;
    avg_seller_rating: number;
    seller_review_count: number;
    earnings: number;
    available_balance: number;
    active_listings: number;
    created_at: string;
  }>;
  segmentation: Array<{
    segment: string;
    count: number;
  }>;
  growth: Array<{
    date: string;
    new_sellers: number;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function SellerAnalyticsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SellerData | null>(null);
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<SellerData>("/admin/analytics/sellers", { period, page, limit: 12 });
      if (res) setData(res);
    } catch (err) {
      console.error("Seller analytics load error:", err);
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
          Seller Performance & Ecosystem Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Ecosystem health, onboarding velocity, seller tier distribution, and creator revenue generation.
        </p>
      </div>

      <DashboardFilterBar
        onRefresh={loadData}
        isRefreshing={loading}
        exportType="sellers"
      />

      {/* Seller KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Sellers"
          value={k?.totalSellers ?? 0}
          icon={Store}
          loading={loading}
        />
        <DashboardStatCard
          title="Verified Sellers"
          value={k?.verifiedSellers ?? 0}
          icon={UserCheck}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
          iconTextColor="text-emerald-600 dark:text-emerald-400"
          loading={loading}
        />
        <DashboardStatCard
          title="Pending Applications"
          value={k?.pendingApplications ?? 0}
          icon={Clock}
          iconBgColor="bg-amber-50 dark:bg-amber-950/50"
          iconTextColor="text-amber-600 dark:text-amber-400"
          loading={loading}
        />
        <DashboardStatCard
          title="Total Seller Earnings"
          value={k?.totalSellerEarnings ?? 0}
          prefix="$"
          icon={DollarSign}
          iconBgColor="bg-indigo-50 dark:bg-indigo-950/50"
          iconTextColor="text-indigo-600 dark:text-indigo-400"
          loading={loading}
        />
      </div>

      {/* Two Column Grid: Growth Chart & Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Seller Onboarding Trends
            </h2>
            <p className="text-xs text-slate-500">Daily creator registrations and portfolio submissions</p>
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
                  <Line type="monotone" dataKey="new_sellers" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No growth records found for this period.
              </div>
            )}
          </div>
        </div>

        {/* Segmentation (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Seller Segmentation
            </h2>
            <p className="text-xs text-slate-500">Performance cohorts</p>
          </div>

          <div className="space-y-3">
            {(data?.segmentation || []).map((seg) => (
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

      {/* Top Sellers Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Seller Performance Leaderboard
          </h2>
          <p className="text-xs text-slate-500">
            Top creators and studios ranked by volume, ratings, and revenue
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Seller Profile</th>
                <th className="pb-3 font-semibold">Model</th>
                <th className="pb-3 font-semibold text-center">Listings</th>
                <th className="pb-3 font-semibold text-center">Total Sales</th>
                <th className="pb-3 font-semibold text-right">Lifetime Earned</th>
                <th className="pb-3 font-semibold text-right">Available Balance</th>
                <th className="pb-3 font-semibold text-center">Rating</th>
                <th className="pb-3 font-semibold text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {(data?.topSellers || []).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {s.display_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{s.display_name}</span>
                          {s.seller_verified && (
                            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                      {s.seller_type || "creator"}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-center text-slate-600 dark:text-slate-400">
                    {s.active_listings}
                  </td>
                  <td className="py-3 pr-3 text-center font-bold text-slate-900 dark:text-slate-100">
                    {s.total_sales}
                  </td>
                  <td className="py-3 pr-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${Number(s.earnings).toLocaleString()}
                  </td>
                  <td className="py-3 pr-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                    ${Number(s.available_balance).toLocaleString()}
                  </td>
                  <td className="py-3 pr-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {Number(s.avg_seller_rating).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-400">
                    {new Date(s.created_at).toLocaleDateString([], { month: "short", year: "numeric" })}
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
