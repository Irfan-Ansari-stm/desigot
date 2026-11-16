"use client";
import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Users,
  Briefcase,
  Store,
  DollarSign,
  Filter,
  ArrowRight,
  Percent
} from "lucide-react";

interface InteractiveChartsSectionProps {
  charts?: {
    revenueTrend?: Array<{ date: string; gross_revenue: number; net_revenue: number; commission: number }>;
    salesGrowth?: Array<{ date: string; order_volume: number; completed_sales: number; revenue: number }>;
    ordersOverview?: Array<{ status: string; count: number; total_amount: number }>;
    serviceVsProductRevenue?: Array<{ date: string; service_revenue: number; product_revenue: number }>;
    commissionOverview?: Array<{ date: string; commission_earned: number; seller_payout: number }>;
    sellerPerformance?: Array<{ seller_id: string; name: string; gross_revenue: number; order_count: number; rating: number }>;
    customerGrowth?: Array<{ date: string; new_customers: number }>;
    orderStatusDistribution?: Array<{ status: string; count: number; percentage: number }>;
    popularCategories?: Array<{ category_id: string; name: string; revenue: number; order_count: number }>;
    conversionFunnel?: Array<{ stage: string; label: string; count: number; dropOffPct: number; conversionRatePct: number }>;
  };
  loading?: boolean;
}

const PIE_COLORS = ["#10b981", "#6366f1", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export function InteractiveChartsSection({ charts, loading = false }: InteractiveChartsSectionProps) {
  const [funnelStageHover, setFunnelStageHover] = useState<number | null>(null);

  if (loading || !charts) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 h-80 shadow-xs animate-pulse"
          />
        ))}
      </div>
    );
  }

  const {
    revenueTrend = [],
    salesGrowth = [],
    ordersOverview = [],
    serviceVsProductRevenue = [],
    commissionOverview = [],
    sellerPerformance = [],
    customerGrowth = [],
    orderStatusDistribution = [],
    popularCategories = [],
    conversionFunnel = []
  } = charts;

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Interactive Business Intelligence Charts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time visual aggregations across orders, services, products, commissions, and conversion stages.
          </p>
        </div>
      </div>

      {/* ROW 1: REVENUE TREND & SALES GROWTH (2 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Revenue Trend Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                1. Revenue Trend Analysis (USD)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Gross vs Net Revenue vs Platform Commission</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50">
              Live SQL Feed
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="gross_revenue" name="Gross Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#grossGrad)" />
                <Area type="monotone" dataKey="net_revenue" name="Net Revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#netGrad)" />
                <Area type="monotone" dataKey="commission" name="Commission" stroke="#f59e0b" strokeWidth={1.5} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Sales Growth Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                2. Sales Growth & Order Volume
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily orders placed vs successfully completed sales</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/50">
              Orders Pipeline
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="order_volume" name="Orders Placed" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed_sales" name="Completed Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: SERVICE VS PRODUCT REVENUE & COMMISSION OVERVIEW (2 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Service vs Product Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-500" />
                3. Service vs Digital Product Revenue
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">High-touch client design services vs instant downloadable assets</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serviceVsProductRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="srvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="service_revenue" name="Services Revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#srvGrad)" />
                <Area type="monotone" dataKey="product_revenue" name="Digital Products Revenue" stroke="#06b6d4" fillOpacity={1} fill="url(#prodGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Commission Overview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-rose-500" />
                4. Commission & Seller Payout Split
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Platform revenue retained vs creator net disbursals</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commissionOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="seller_payout" name="Seller Net Payout" stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} />
                <Bar dataKey="commission_earned" name="Platform Commission" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 3: SELLER PERFORMANCE & ORDER STATUS DISTRIBUTION (2 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Seller Performance Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Store className="h-4 w-4 text-amber-500" />
                5. Top Sellers Revenue Leaderboard
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Top performing design studios & freelancers by gross GMV</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sellerPerformance.slice(0, 7)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, "Gross GMV"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="gross_revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Order Status Distribution (Donut Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-indigo-500" />
                6. Order Status Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Breakdown of orders by fulfillment lifecycle status</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {orderStatusDistribution.map((entry, idx) => (
                    <Cell key={entry.status} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val} orders (${item.payload.percentage}%)`,
                    `Status: ${name}`
                  ]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 4: CUSTOMER GROWTH & POPULAR CATEGORIES (2 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7. Customer Growth Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-500" />
                7. Customer Acquisition & Growth
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">New buyer signups registered across timeline</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="new_customers" name="New Buyers" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 8. Popular Categories by Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-500" />
                8. Popular Categories by Revenue
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Gross GMV by design taxonomy category</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={popularCategories.slice(0, 6)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, "Revenue"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 5: 7-STAGE CONVERSION FUNNEL (Full Width Interactive Step Progression) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Percent className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              9 & 10. 7-Stage End-to-End Marketplace Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live event tracking from Visitor arrival through Checkout, Escrow Payment, and Completed Purchase.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
            Overall Funnel: {conversionFunnel[conversionFunnel.length - 1]?.conversionRatePct || 0}%
          </span>
        </div>

        {/* Funnel Stage Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {conversionFunnel.map((stg, i) => {
            const isHovered = funnelStageHover === i;
            const isFirst = i === 0;
            const isLast = i === conversionFunnel.length - 1;

            return (
              <div
                key={stg.stage}
                onMouseEnter={() => setFunnelStageHover(i)}
                onMouseLeave={() => setFunnelStageHover(null)}
                className={`relative rounded-xl p-3.5 transition-all cursor-pointer border ${
                  isHovered
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 shadow-md scale-102"
                    : isLast
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Stage {i + 1}
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                  {stg.label.split(". ")[1] || stg.label}
                </div>
                <div className="text-lg font-bold font-sans text-slate-900 dark:text-slate-100 mt-2">
                  {stg.count.toLocaleString()}
                </div>

                {/* Conversion metric from start */}
                <div className="mt-2 text-[11px] font-medium text-slate-500 flex items-center justify-between">
                  <span>Conv:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {stg.conversionRatePct}%
                  </span>
                </div>

                {/* Drop-off metric from previous stage */}
                {!isFirst && (
                  <div className="mt-1 text-[11px] text-rose-500 dark:text-rose-400 flex items-center justify-between">
                    <span>Drop:</span>
                    <span className="font-semibold">-{stg.dropOffPct}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
