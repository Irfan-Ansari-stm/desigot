"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import {
  Store,
  Layers,
  Briefcase,
  Users,
  UserCheck,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Percent,
  AlertTriangle,
  RotateCcw,
  Search,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

interface MarketplaceData {
  kpis: {
    totalListings: number;
    activeServices: number;
    publishedProducts: number;
    totalSellers: number;
    verifiedSellers: number;
    totalCustomers: number;
    totalOrders: number;
    gmv: number;
    aov: number;
    conversionRate: number;
    refundRate: number;
    disputeRate: number;
  };
  categoryPerformance: Array<{
    id: string;
    name: string;
    icon_name: string;
    service_count: number;
    product_count: number;
    order_count: number;
    revenue: number;
  }>;
  userGrowth: Array<{
    date: string;
    new_customers: number;
    new_sellers: number;
  }>;
  topSearches: Array<{
    query_text: string;
    search_count: number;
    avg_results: number;
    clicks: number;
  }>;
  distribution: {
    services: number;
    products: number;
    activeSellers: number;
    pendingSellers: number;
  };
}

export default function MarketplaceAnalyticsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MarketplaceData | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<MarketplaceData>("/admin/analytics/marketplace", { period });
      if (res) setData(res);
    } catch (err) {
      console.error("Marketplace analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const k = data?.kpis;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
          Marketplace Health & Growth Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Catalog metrics, conversion performance, design category volume, and buyer search trends.
        </p>
      </div>

      <DashboardFilterBar
        onRefresh={loadData}
        isRefreshing={loading}
        exportType="sales"
      />

      {/* 12 Marketplace KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <DashboardStatCard
          title="Catalog Listings"
          value={k?.totalListings ?? 0}
          icon={Store}
          loading={loading}
        />
        <DashboardStatCard
          title="Active Services"
          value={k?.activeServices ?? 0}
          icon={Briefcase}
          loading={loading}
        />
        <DashboardStatCard
          title="Published Products"
          value={k?.publishedProducts ?? 0}
          icon={Layers}
          loading={loading}
        />
        <DashboardStatCard
          title="Verified Sellers"
          value={k?.verifiedSellers ?? 0}
          icon={UserCheck}
          loading={loading}
        />
        <DashboardStatCard
          title="Total Customers"
          value={k?.totalCustomers ?? 0}
          icon={Users}
          loading={loading}
        />
        <DashboardStatCard
          title="Marketplace GMV"
          value={k?.gmv ?? 0}
          prefix="$"
          icon={DollarSign}
          loading={loading}
        />
      </div>

      {/* Operational Efficiency KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <DashboardStatCard
          title="Total Orders"
          value={k?.totalOrders ?? 0}
          icon={ShoppingBag}
          loading={loading}
        />
        <DashboardStatCard
          title="Average Order (AOV)"
          value={k?.aov ?? 0}
          prefix="$"
          icon={TrendingUp}
          loading={loading}
        />
        <DashboardStatCard
          title="Conversion Rate"
          value={k?.conversionRate ?? 0}
          suffix="%"
          icon={Percent}
          loading={loading}
        />
        <DashboardStatCard
          title="Refund Rate"
          value={k?.refundRate ?? 0}
          suffix="%"
          icon={RotateCcw}
          loading={loading}
        />
        <DashboardStatCard
          title="Dispute Rate"
          value={k?.disputeRate ?? 0}
          suffix="%"
          icon={AlertTriangle}
          loading={loading}
        />
        <DashboardStatCard
          title="Pending Sellers"
          value={data?.distribution?.pendingSellers ?? 0}
          icon={UserCheck}
          loading={loading}
        />
      </div>

      {/* Growth Trends Over Time */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Marketplace Acquisition & Growth
          </h2>
          <p className="text-xs text-slate-500">New customer registrations vs verified seller onboarding</p>
        </div>

        <div className="h-64 w-full">
          {data?.userGrowth && data.userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.userGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="new_customers" name="New Customers" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="new_sellers" name="New Sellers" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No user growth records for this period.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Category Performance & Search Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Top Category Performance
            </h3>
            <p className="text-xs text-slate-500">Listings inventory, order velocity, and gross revenue</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold text-center">Services</th>
                  <th className="pb-3 font-semibold text-center">Products</th>
                  <th className="pb-3 font-semibold text-center">Orders</th>
                  <th className="pb-3 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(data?.categoryPerformance || []).map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 pr-2 font-medium text-slate-900 dark:text-slate-100">
                      {cat.name}
                    </td>
                    <td className="py-2.5 pr-2 text-center text-slate-600 dark:text-slate-400">
                      {cat.service_count}
                    </td>
                    <td className="py-2.5 pr-2 text-center text-slate-600 dark:text-slate-400">
                      {cat.product_count}
                    </td>
                    <td className="py-2.5 pr-2 text-center font-semibold text-slate-800 dark:text-slate-200">
                      {cat.order_count}
                    </td>
                    <td className="py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      ${Number(cat.revenue).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Search Analytics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Search Intelligence & Intent
            </h3>
            <p className="text-xs text-slate-500">Customer search terms and catalog discovery metrics</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Search Keyword</th>
                  <th className="pb-3 font-semibold text-center">Searches</th>
                  <th className="pb-3 font-semibold text-center">Avg Results</th>
                  <th className="pb-3 font-semibold text-right">Result Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(data?.topSearches || []).map((term) => (
                  <tr key={term.query_text} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 pr-2 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span className="capitalize">{term.query_text}</span>
                    </td>
                    <td className="py-2.5 pr-2 text-center text-slate-600 dark:text-slate-400">
                      {term.search_count}
                    </td>
                    <td className="py-2.5 pr-2 text-center text-slate-500">
                      {Math.round(term.avg_results)} items
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {term.clicks} clicks
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
