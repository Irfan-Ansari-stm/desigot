"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { apiGet } from "@/lib/api";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Users,
  Store,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  Eye,
  Star,
  Zap,
  Crown,
  ChevronRight,
  UserCheck,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface OverviewData {
  summary: {
    grossRevenue: number;
    netPlatformRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    activeSellers: number;
    publishedServices: number;
    publishedProducts: number;
    totalTransactions: number;
    pendingSellerApplications: number;
    pendingServiceApprovals: number;
    openDisputes: number;
    pendingPayouts: number;
  };
  trends: {
    grossRevenueChange: number;
    netRevenueChange: number;
    ordersChange: number;
    completedOrdersChange: number;
  };
  revenueChart: Array<{
    date: string;
    gross_sales: number;
    platform_commission: number;
    refunds: number;
    seller_earnings: number;
    order_count: number;
  }>;
  recentOrders: Array<{
    id: string;
    listing_title: string;
    listing_type: string;
    amount_cents: number;
    discount_cents: number;
    platform_fee_cents: number;
    seller_payout_cents: number;
    currency: string;
    status: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    seller_name: string;
  }>;
  topServices: Array<{
    id: string;
    title: string;
    avg_rating: number;
    total_sales: number;
    total_revenue_cents: number;
    status: string;
    seller_name: string;
    category_name: string;
  }>;
  topSellers: Array<{
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
    seller_type: string;
    seller_verified: boolean;
    total_sales: number;
    avg_seller_rating: number;
    seller_review_count: number;
    lifetime_earned_cents: number;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
    actor_name: string;
    actor_role: string;
    metadata: { description?: string };
  }>;
  pendingActions: {
    pendingSellers: number;
    pendingApprovals: number;
    openDisputes: number;
    pendingPayouts: number;
  };
}

export default function DashboardOverviewPage() {
  const { user, isSuperAdmin } = useAuthStore();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const [chartMetric, setChartMetric] = useState<"gross" | "commission" | "earnings" | "refunds">("gross");
  const [orderSearch, setOrderSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<OverviewData>("/admin/dashboard/overview", { period });
      if (res) setData(res);
    } catch (err) {
      console.error("Overview data load error:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const s = data?.summary;
  const t = data?.trends;

  const filteredRecentOrders = (data?.recentOrders || []).filter((o) => {
    if (!orderSearch) return true;
    const term = orderSearch.toLowerCase();
    return (
      o.listing_title.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.seller_name.toLowerCase().includes(term) ||
      o.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Desigot Enterprise BI Engine
            </span>
            {isSuperAdmin() && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <Crown className="h-3 w-3" /> Application Owner
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Administrative Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time business intelligence, marketplace transaction metrics, and governance operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/revenue"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors"
          >
            Financial Analytics
          </Link>
          <Link
            href="/dashboard/recent-activities"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Audit Trail
          </Link>
        </div>
      </div>

      {/* Global Filter Bar */}
      <DashboardFilterBar
        onRefresh={loadData}
        isRefreshing={loading}
        exportType="revenue"
      />

      {/* 12 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Gross Revenue */}
        <DashboardStatCard
          title="Gross Revenue"
          value={s?.grossRevenue ?? 0}
          change={t?.grossRevenueChange}
          prefix="$"
          icon={DollarSign}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
          iconTextColor="text-emerald-600 dark:text-emerald-400"
          tooltip="Gross order sales volume processed in active date range"
          loading={loading}
        />

        {/* 2. Net Platform Revenue */}
        <DashboardStatCard
          title="Net Platform Revenue"
          value={s?.netPlatformRevenue ?? 0}
          change={t?.netRevenueChange}
          prefix="$"
          icon={TrendingUp}
          iconBgColor="bg-indigo-50 dark:bg-indigo-950/50"
          iconTextColor="text-indigo-600 dark:text-indigo-400"
          tooltip="Desigot platform commission revenue (15% take rate)"
          loading={loading}
        />

        {/* 3. Total Orders */}
        <DashboardStatCard
          title="Total Orders"
          value={s?.totalOrders ?? 0}
          change={t?.ordersChange}
          icon={ShoppingBag}
          iconBgColor="bg-blue-50 dark:bg-blue-950/50"
          iconTextColor="text-blue-600 dark:text-blue-400"
          tooltip="All orders initiated during this period"
          loading={loading}
        />

        {/* 4. Completed Orders */}
        <DashboardStatCard
          title="Completed Orders"
          value={s?.completedOrders ?? 0}
          change={t?.completedOrdersChange}
          icon={CheckCircle2}
          iconBgColor="bg-teal-50 dark:bg-teal-950/50"
          iconTextColor="text-teal-600 dark:text-teal-400"
          tooltip="Orders successfully fulfilled and delivered"
          loading={loading}
        />

        {/* 5. Pending Orders */}
        <DashboardStatCard
          title="Pending Orders"
          value={s?.pendingOrders ?? 0}
          icon={Clock}
          iconBgColor="bg-amber-50 dark:bg-amber-950/50"
          iconTextColor="text-amber-600 dark:text-amber-400"
          tooltip="Active orders currently in progress or awaiting inspection"
          loading={loading}
        />

        {/* 6. Total Customers */}
        <DashboardStatCard
          title="Total Customers"
          value={s?.totalCustomers ?? 0}
          icon={Users}
          iconBgColor="bg-purple-50 dark:bg-purple-950/50"
          iconTextColor="text-purple-600 dark:text-purple-400"
          tooltip="Registered marketplace buyer accounts"
          loading={loading}
        />

        {/* 7. Active Sellers */}
        <DashboardStatCard
          title="Active Sellers"
          value={s?.activeSellers ?? 0}
          icon={Store}
          iconBgColor="bg-cyan-50 dark:bg-cyan-950/50"
          iconTextColor="text-cyan-600 dark:text-cyan-400"
          tooltip="Verified sellers with active listings"
          loading={loading}
        />

        {/* 8. Published Services */}
        <DashboardStatCard
          title="Published Services"
          value={s?.publishedServices ?? 0}
          icon={Briefcase}
          iconBgColor="bg-sky-50 dark:bg-sky-950/50"
          iconTextColor="text-sky-600 dark:text-sky-400"
          tooltip="Active custom design services available on marketplace"
          loading={loading}
        />

        {/* 9. Published Products */}
        <DashboardStatCard
          title="Published Products"
          value={s?.publishedProducts ?? 0}
          icon={Layers}
          iconBgColor="bg-violet-50 dark:bg-violet-950/50"
          iconTextColor="text-violet-600 dark:text-violet-400"
          tooltip="Active digital UI kits, icons, and templates"
          loading={loading}
        />

        {/* 10. Total Transactions */}
        <DashboardStatCard
          title="Marketplace Transactions"
          value={s?.totalTransactions ?? 0}
          icon={DollarSign}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
          iconTextColor="text-emerald-600 dark:text-emerald-400"
          tooltip="Historical marketplace ledger entries"
          loading={loading}
        />

        {/* 11. Pending Seller Apps */}
        <DashboardStatCard
          title="Pending Sellers"
          value={s?.pendingSellerApplications ?? 0}
          icon={UserCheck}
          iconBgColor="bg-orange-50 dark:bg-orange-950/50"
          iconTextColor="text-orange-600 dark:text-orange-400"
          tooltip="Seller applications awaiting KYC and portfolio approval"
          loading={loading}
        />

        {/* 12. Pending Approvals */}
        <DashboardStatCard
          title="Pending Service Approvals"
          value={s?.pendingServiceApprovals ?? 0}
          icon={AlertCircle}
          iconBgColor="bg-rose-50 dark:bg-rose-950/50"
          iconTextColor="text-rose-600 dark:text-rose-400"
          tooltip="Listings submitted awaiting admin review"
          loading={loading}
        />
      </div>

      {/* Pending Actions Queue Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/sellers"
          className="bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 p-4 rounded-xl flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              {s?.pendingSellerApplications ?? 0}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Seller Verifications
              </div>
              <div className="text-[11px] text-slate-500">Awaiting portfolio review</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/dashboard/services"
          className="bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40 p-4 rounded-xl flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold">
              {s?.pendingServiceApprovals ?? 0}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Listing Approvals
              </div>
              <div className="text-[11px] text-slate-500">Quality check queue</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/dashboard/disputes"
          className="bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 p-4 rounded-xl flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold">
              {s?.openDisputes ?? 0}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Open Disputes
              </div>
              <div className="text-[11px] text-slate-500">Mediation required</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/dashboard/revenue"
          className="bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 p-4 rounded-xl flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              {s?.pendingPayouts ?? 0}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Pending Payouts
              </div>
              <div className="text-[11px] text-slate-500">Stripe Connect queue</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Revenue Trends Interactive Chart Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Marketplace Revenue Trends
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated transaction volume derived from real database orders
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(
              [
                { id: "gross", label: "Gross Sales" },
                { id: "commission", label: "Commission" },
                { id: "earnings", label: "Seller Earnings" },
                { id: "refunds", label: "Refunds" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setChartMetric(m.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  chartMetric === m.id
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          {data?.revenueChart && data.revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: unknown) => [`$${Number(val).toFixed(2)}`, "Amount"]}
                />
                <Area
                  type="monotone"
                  dataKey={
                    chartMetric === "gross"
                      ? "gross_sales"
                      : chartMetric === "commission"
                      ? "platform_commission"
                      : chartMetric === "earnings"
                      ? "seller_earnings"
                      : "refunds"
                  }
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No revenue records found for this period.
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Recent Marketplace Orders
            </h2>
            <p className="text-xs text-slate-500">Live order lifecycle and payment settlement</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-64"
              />
            </div>
            <Link
              href="/dashboard/sales"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
            >
              View All Orders →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Item & Title</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Seller</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
                <th className="pb-3 font-semibold text-right">Status</th>
                <th className="pb-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRecentOrders.slice(0, 8).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                    {o.listing_title}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        o.listing_type === "service"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      }`}
                    >
                      {o.listing_type === "service" ? "Service" : "Product"}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">
                    <div>{o.customer_name}</div>
                    <div className="text-[10px] text-slate-400">{o.customer_email}</div>
                  </td>
                  <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">
                    {o.seller_name}
                  </td>
                  <td className="py-3 pr-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    ${(o.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        o.status === "complete"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : o.status === "active"
                          ? "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                          : o.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : o.status === "refunded"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-400">
                    {new Date(o.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Top Services & Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Top Performing Services
              </h3>
              <p className="text-xs text-slate-500">Highest grossing custom design offerings</p>
            </div>
            <Link href="/dashboard/services" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.topServices || []).slice(0, 5).map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{s.seller_name}</span>
                      <span>•</span>
                      <span>{s.category_name}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    ${(s.total_revenue_cents / 100).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span>{Number(s.avg_rating).toFixed(1)}</span>
                    <span>({s.total_sales} orders)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Top Performing Sellers
              </h3>
              <p className="text-xs text-slate-500">Highest grossing agencies & creators</p>
            </div>
            <Link href="/dashboard/sellers" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              Leaderboard →
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.topSellers || []).slice(0, 5).map((seller, idx) => (
              <div
                key={seller.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {seller.display_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                      <span>{seller.display_name}</span>
                      {seller.seller_verified && (
                        <UserCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{seller.seller_type}</span>
                      <span>•</span>
                      <span>{seller.total_sales} sales</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    ${((seller.lifetime_earned_cents || 0) / 100).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span>{Number(seller.avg_seller_rating).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline Stream */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Recent Marketplace Activities
            </h3>
            <p className="text-xs text-slate-500">Live immutable administrative and operational event stream</p>
          </div>
          <Link
            href="/dashboard/recent-activities"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Full Activity Feed →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data?.recentActivities || []).map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
                    {act.action}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {act.metadata?.description || `Action executed on ${act.entity_type}`}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                  <span>Actor: {act.actor_name || "System"}</span>
                  <span>•</span>
                  <span className="capitalize">{act.actor_role}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {new Date(act.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
