"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Star,
  ExternalLink,
  Eye,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface ServiceData {
  kpis: {
    totalServices: number;
    published: number;
    pending: number;
    rejected: number;
    suspended: number;
    featured: number;
    totalBookings: number;
    serviceRevenue: number;
    avgRating: number;
  };
  statusDistribution: Array<{
    name: string;
    count: number;
  }>;
  categories: Array<{
    category_name: string;
    listing_count: number;
    seller_count: number;
    total_orders: number;
    revenue: number;
    avg_rating: number;
  }>;
  topServices: Array<{
    id: string;
    title: string;
    avg_rating: number;
    total_sales: number;
    revenue: number;
    view_count: number;
    status: string;
    seller_name: string;
    category_name: string;
  }>;
}

const STATUS_COLORS = ["#10b981", "#f59e0b", "#64748b", "#ef4444"];

export default function ServiceAnalyticsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ServiceData | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<ServiceData>("/admin/analytics/services", { period });
      if (res) setData(res);
    } catch (err) {
      console.error("Service analytics load error:", err);
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
          Service Management Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Performance metrics for custom design offerings, seller capacity, review scores, and booking velocity.
        </p>
      </div>

      <DashboardFilterBar
        onRefresh={loadData}
        isRefreshing={loading}
        exportType="services"
      />

      {/* Service KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <DashboardStatCard
          title="Total Services"
          value={k?.totalServices ?? 0}
          icon={Briefcase}
          loading={loading}
        />
        <DashboardStatCard
          title="Published"
          value={k?.published ?? 0}
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
          iconTextColor="text-emerald-600 dark:text-emerald-400"
          loading={loading}
        />
        <DashboardStatCard
          title="In Review"
          value={k?.pending ?? 0}
          icon={Clock}
          iconBgColor="bg-amber-50 dark:bg-amber-950/50"
          iconTextColor="text-amber-600 dark:text-amber-400"
          loading={loading}
        />
        <DashboardStatCard
          title="Featured"
          value={k?.featured ?? 0}
          icon={Sparkles}
          iconBgColor="bg-purple-50 dark:bg-purple-950/50"
          iconTextColor="text-purple-600 dark:text-purple-400"
          loading={loading}
        />
        <DashboardStatCard
          title="Service Bookings"
          value={k?.totalBookings ?? 0}
          icon={ShoppingBag}
          loading={loading}
        />
        <DashboardStatCard
          title="Service Revenue"
          value={k?.serviceRevenue ?? 0}
          prefix="$"
          icon={DollarSign}
          loading={loading}
        />
      </div>

      {/* Two Column Grid: Status Breakdown & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Service Status Lifecycle
            </h3>
            <p className="text-xs text-slate-500">Distribution across active catalog states</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {(data?.statusDistribution || []).map((st, i) => (
              <div
                key={st.name}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <div className="text-[11px] font-semibold text-slate-500">{st.name}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {st.count}
                </div>
              </div>
            ))}
          </div>

          <div className="h-40 w-full">
            {data?.statusDistribution && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.statusDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Service Categories Breakdown
            </h3>
            <p className="text-xs text-slate-500">Service order volume and ratings across disciplines</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {(data?.categories || []).map((c) => (
              <div key={c.category_name} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{c.category_name}</div>
                  <div className="text-[11px] text-slate-400">
                    {c.listing_count} offerings • {c.seller_count} verified sellers
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">
                    ${Number(c.revenue).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span>{Number(c.avg_rating).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Services Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Top Performing Professional Services
          </h2>
          <p className="text-xs text-slate-500">Ranked by completed bookings, revenue, and client review ratings</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Service Name</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Seller</th>
                <th className="pb-3 font-semibold text-center">Views</th>
                <th className="pb-3 font-semibold text-center">Orders</th>
                <th className="pb-3 font-semibold text-right">Revenue</th>
                <th className="pb-3 font-semibold text-center">Rating</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {(data?.topServices || []).map((svc) => (
                <tr key={svc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-3 font-medium text-slate-900 dark:text-slate-100 max-w-sm truncate">
                    {svc.title}
                  </td>
                  <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{svc.category_name}</td>
                  <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{svc.seller_name}</td>
                  <td className="py-3 pr-3 text-center text-slate-500">{svc.view_count}</td>
                  <td className="py-3 pr-3 text-center font-bold text-slate-800 dark:text-slate-200">
                    {svc.total_sales}
                  </td>
                  <td className="py-3 pr-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                    ${Number(svc.revenue).toLocaleString()}
                  </td>
                  <td className="py-3 pr-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {Number(svc.avg_rating).toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        svc.status === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      {svc.status === "approved" ? "Published" : svc.status}
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
