"use client";
import React from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  ShoppingCart,
  CalendarCheck,
  Briefcase,
  Layers,
  Users,
  Store,
  Percent,
  Calculator,
  HelpCircle
} from "lucide-react";

export interface KpiItem {
  label: string;
  value: number;
  prevValue?: number;
  changePct: number;
  trend: "up" | "down";
  isCurrency?: boolean;
  isPct?: boolean;
  sparkline?: number[];
}

export interface KpiCardsData {
  grossRevenue: KpiItem;
  netRevenue: KpiItem;
  totalSales: KpiItem;
  totalOrders: KpiItem;
  totalBookings: KpiItem;
  servicesSold: KpiItem;
  digitalProductsSold: KpiItem;
  totalCustomers: KpiItem;
  activeSellers: KpiItem;
  totalCommission: KpiItem;
  conversionRate: KpiItem;
  averageOrderValue: KpiItem;
}

interface KpiCardsGridProps {
  kpis?: Partial<KpiCardsData>;
  loading?: boolean;
}

// Mini SVG Sparkline Component
function MiniSparkline({ points = [], trend = "up" }: { points?: number[]; trend?: "up" | "down" }) {
  if (!points || points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const padding = 3;

  const coordinates = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((p - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  });

  const polylinePoints = coordinates.join(" ");
  const strokeColor = trend === "up" ? "#10b981" : "#ef4444";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePoints}
      />
    </svg>
  );
}

export function KpiCardsGrid({ kpis, loading = false }: KpiCardsGridProps) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs animate-pulse space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      key: "grossRevenue",
      title: "Gross Revenue",
      data: kpis.grossRevenue,
      icon: DollarSign,
      color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60",
      tooltip: "Total recognized marketplace transaction value before deductions and payouts.",
    },
    {
      key: "netRevenue",
      title: "Net Revenue",
      data: kpis.netRevenue,
      icon: DollarSign,
      color: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200/60",
      tooltip: "Gross revenue minus completed refunds and customer cancellations.",
    },
    {
      key: "totalSales",
      title: "Total Sales",
      data: kpis.totalSales,
      icon: ShoppingBag,
      color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60",
      tooltip: "Total count of successfully completed marketplace purchases.",
    },
    {
      key: "totalOrders",
      title: "Total Orders",
      data: kpis.totalOrders,
      icon: ShoppingCart,
      color: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/60",
      tooltip: "All placed orders across services and digital products in any state.",
    },
    {
      key: "totalBookings",
      title: "Total Bookings",
      data: kpis.totalBookings,
      icon: CalendarCheck,
      color: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/60",
      tooltip: "Total design consultation and professional delivery bookings scheduled.",
    },
    {
      key: "servicesSold",
      title: "Services Sold",
      data: kpis.servicesSold,
      icon: Briefcase,
      color: "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200/60",
      tooltip: "Custom client service engagements successfully ordered and completed.",
    },
    {
      key: "digitalProductsSold",
      title: "Digital Products Sold",
      data: kpis.digitalProductsSold,
      icon: Layers,
      color: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200/60",
      tooltip: "Instant-download UI kits, design templates, and asset licenses delivered.",
    },
    {
      key: "totalCustomers",
      title: "Total Customers",
      data: kpis.totalCustomers,
      icon: Users,
      color: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200/60",
      tooltip: "Distinct registered buyers who placed orders on the platform.",
    },
    {
      key: "activeSellers",
      title: "Active Sellers",
      data: kpis.activeSellers,
      icon: Store,
      color: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60",
      tooltip: "Verified creators and design studios with active listings or orders.",
    },
    {
      key: "totalCommission",
      title: "Total Commission",
      data: kpis.totalCommission,
      icon: Calculator,
      color: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60",
      tooltip: "Platform transaction and referral fee revenue earned by Desigot.",
    },
    {
      key: "conversionRate",
      title: "Conversion Rate",
      data: kpis.conversionRate,
      icon: Percent,
      color: "bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200/60",
      tooltip: "Percentage of unique marketplace visitor sessions converted to purchases.",
    },
    {
      key: "averageOrderValue",
      title: "Average Order Value",
      data: kpis.averageOrderValue,
      icon: TrendingUp,
      color: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/60",
      tooltip: "Average gross dollar spend per completed transaction (AOV).",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((c) => {
        const item = c.data;
        const Icon = c.icon;
        if (!item) return null;

        const isPositive = item.changePct >= 0;
        let formattedValue = item.value?.toLocaleString();
        if (item.isCurrency) {
          formattedValue = `$${item.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (item.isPct) {
          formattedValue = `${item.value}%`;
        }

        return (
          <div
            key={c.key}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-indigo-400/80 dark:hover:border-indigo-800 transition-all group flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>{c.title}</span>
                  {c.tooltip && (
                    <span title={c.tooltip} className="cursor-help text-slate-400 hover:text-slate-600">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              {/* Main Value & Sparkline */}
              <div className="flex items-baseline justify-between mt-2.5">
                <span className="text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-slate-100">
                  {formattedValue}
                </span>
                {item.sparkline && (
                  <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                    <MiniSparkline points={item.sparkline} trend={item.trend} />
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Badge & Label */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                  isPositive
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50"
                    : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/50"
                }`}
              >
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isPositive ? `+${item.changePct}%` : `${item.changePct}%`}
              </span>
              <span className="text-slate-400 text-[11px]">vs previous period</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
