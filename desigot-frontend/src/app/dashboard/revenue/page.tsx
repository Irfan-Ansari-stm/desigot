"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  PieChart as PieIcon,
  BarChart2,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface RevenueData {
  kpis: {
    gmv: number;
    collectedPayments: number;
    platformCommission: number;
    sellerEarnings: number;
    refunds: number;
    netPlatformRevenue: number;
    pendingPayouts: number;
    completedPayouts: number;
  };
  trendsPct: {
    gmvChange: number;
    commissionChange: number;
    sellerEarningsChange: number;
    refundsChange: number;
  };
  breakdown: {
    grossOrderValue: number;
    discounts: number;
    refunds: number;
    taxesCollected: number;
    platformCommission: number;
    paymentProcessingFees: number;
    sellerPayableAmount: number;
    netPlatformProfit: number;
  };
  trends: Array<{
    date: string;
    gmv: number;
    commission: number;
    seller_earnings: number;
    refunds: number;
    orders: number;
  }>;
  byCategory: Array<{
    category_name: string;
    order_count: number;
    gmv: number;
    commission: number;
  }>;
  byType: Array<{
    listing_type: string;
    order_count: number;
    gmv: number;
    commission: number;
  }>;
  byPaymentMethod: Array<{
    payment_method: string;
    transaction_count: number;
    total_amount: number;
  }>;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#14b8a6", "#64748b"];

export default function RevenueAnalyticsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<RevenueData>("/admin/analytics/revenue", { period });
      if (res) setData(res);
    } catch (err) {
      console.error("Revenue analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const k = data?.kpis;
  const t = data?.trendsPct;
  const b = data?.breakdown;

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
            Revenue Analytics & Financial Visibility
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconciled marketplace ledger, GMV calculations, platform commissions, and seller disbursements.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilterBar
        onRefresh={loadData}
        isRefreshing={loading}
        exportType="revenue"
      />

      {/* 8 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Gross Merchandise Value (GMV)"
          value={k?.gmv ?? 0}
          change={t?.gmvChange}
          prefix="$"
          icon={DollarSign}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
          iconTextColor="text-emerald-600 dark:text-emerald-400"
          tooltip="Total value of successful customer orders before fees"
          loading={loading}
        />

        <DashboardStatCard
          title="Total Collected Payments"
          value={k?.collectedPayments ?? 0}
          prefix="$"
          icon={CreditCard}
          iconBgColor="bg-blue-50 dark:bg-blue-950/50"
          iconTextColor="text-blue-600 dark:text-blue-400"
          tooltip="Total payment charges authorized via payment gateway"
          loading={loading}
        />

        <DashboardStatCard
          title="Platform Commission Revenue"
          value={k?.platformCommission ?? 0}
          change={t?.commissionChange}
          prefix="$"
          icon={TrendingUp}
          iconBgColor="bg-indigo-50 dark:bg-indigo-950/50"
          iconTextColor="text-indigo-600 dark:text-indigo-400"
          tooltip="Desigot platform fee retained from completed orders"
          loading={loading}
        />

        <DashboardStatCard
          title="Seller Earnings"
          value={k?.sellerEarnings ?? 0}
          change={t?.sellerEarningsChange}
          prefix="$"
          icon={Wallet}
          iconBgColor="bg-violet-50 dark:bg-violet-950/50"
          iconTextColor="text-violet-600 dark:text-violet-400"
          tooltip="Net earnings credited to sellers balances"
          loading={loading}
        />

        <DashboardStatCard
          title="Total Refunds"
          value={k?.refunds ?? 0}
          change={t?.refundsChange}
          prefix="$"
          icon={ArrowDownRight}
          iconBgColor="bg-rose-50 dark:bg-rose-950/50"
          iconTextColor="text-rose-600 dark:text-rose-400"
          tooltip="Total refund transactions processed for cancelled or disputed orders"
          loading={loading}
        />

        <DashboardStatCard
          title="Net Platform Profit"
          value={k?.netPlatformRevenue ?? 0}
          prefix="$"
          icon={ShieldCheck}
          iconBgColor="bg-teal-50 dark:bg-teal-950/50"
          iconTextColor="text-teal-600 dark:text-teal-400"
          tooltip="Platform commission minus payment gateway processing fees"
          loading={loading}
        />

        <DashboardStatCard
          title="Pending Seller Payouts"
          value={k?.pendingPayouts ?? 0}
          prefix="$"
          icon={Clock}
          iconBgColor="bg-amber-50 dark:bg-amber-950/50"
          iconTextColor="text-amber-600 dark:text-amber-400"
          tooltip="Accumulated seller earnings queued for next payout cycle"
          loading={loading}
        />

        <DashboardStatCard
          title="Completed Payouts"
          value={k?.completedPayouts ?? 0}
          prefix="$"
          icon={CheckCircle}
          iconBgColor="bg-cyan-50 dark:bg-cyan-950/50"
          iconTextColor="text-cyan-600 dark:text-cyan-400"
          tooltip="Total disbursements processed via Stripe Connect"
          loading={loading}
        />
      </div>

      {/* Main Revenue Over Time Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Revenue & Financial Distribution Over Time
            </h2>
            <p className="text-xs text-slate-500">
              Comparative trends: GMV vs Platform Commissions vs Seller Earnings
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {data?.trends && data.trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: unknown) => [`$${Number(val).toFixed(2)}`]}
                />
                <Legend />
                <Area type="monotone" dataKey="gmv" name="Gross Merchandise Value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gmvGrad)" />
                <Area type="monotone" dataKey="commission" name="Platform Commission" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#commGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No revenue timeline records available for this filter.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Financial Breakdown & Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canonical Financial Ledger Breakdown Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Financial Ledger Breakdown
            </h3>
            <p className="text-xs text-slate-500">Strict reconciliation of marketplace transaction streams</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Gross Order Sales Volume (GMV)</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">${b?.grossOrderValue?.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span>(-) Promotional Discounts Applied</span>
              <span>-${b?.discounts?.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span>(-) Processed Customer Refunds</span>
              <span>-${b?.refunds?.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Taxes Collected</span>
              <span className="text-slate-500">${b?.taxesCollected?.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20 px-2 rounded-lg font-semibold text-indigo-700 dark:text-indigo-300">
              <span>(=) Platform Fee Revenue (15%)</span>
              <span>${b?.platformCommission?.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-slate-500">
              <span>(-) Est. Payment Processing Fees (Stripe)</span>
              <span>-${b?.paymentProcessingFees?.toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Seller Payable Amount (Net Earnings)</span>
              <span>${b?.sellerPayableAmount?.toLocaleString()}</span>
            </div>
            <div className="py-3 flex items-center justify-between bg-slate-900 text-white px-3 rounded-xl font-bold text-sm mt-2">
              <span>Net Platform Operating Margin</span>
              <span className="text-emerald-400">${b?.netPlatformProfit?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Revenue by Category Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Revenue by Category
            </h3>
            <p className="text-xs text-slate-500">Gross sales volume generated across design disciplines</p>
          </div>

          <div className="h-64 w-full">
            {data?.byCategory && data.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byCategory} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} opacity={0.6} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="category_name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: unknown) => [`$${Number(val).toFixed(2)}`, "GMV"]}
                  />
                  <Bar dataKey="gmv" fill="#6366f1" radius={[0, 4, 4, 0]}>
                    {data.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No category breakdown data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Digital Products vs Services & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products vs Services Split */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Revenue by Business Model
            </h3>
            <p className="text-xs text-slate-500">Digital Asset downloads vs Professional Custom Services</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(data?.byType || []).map((t) => (
              <div
                key={t.listing_type}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t.listing_type === "service" ? "Professional Services" : "Digital Products"}
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  ${t.gmv.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>{t.order_count} completed orders</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    ${t.commission.toLocaleString()} fees
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Payment Methods Volume
            </h3>
            <p className="text-xs text-slate-500">Distribution across supported payment gateways</p>
          </div>

          <div className="space-y-3">
            {(data?.byPaymentMethod || []).map((pm) => (
              <div
                key={pm.payment_method}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-500" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                    {pm.payment_method.replace("_", " ")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    ${pm.total_amount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-2">({pm.transaction_count} charges)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
