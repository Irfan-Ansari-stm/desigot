"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import {
  Layers,
  Briefcase,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  RotateCcw,
  CheckCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
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
} from "recharts";

interface SalesData {
  products: {
    totalOrders: number;
    completedOrders: number;
    refunds: number;
    revenue: number;
    avgPrice: number;
  };
  services: {
    totalOrders: number;
    completedOrders: number;
    refunds: number;
    revenue: number;
    avgPrice: number;
  };
  funnel: Array<{
    step: string;
    count: number;
  }>;
  trends: Array<{
    date: string;
    product_sales: number;
    service_sales: number;
    total_orders: number;
  }>;
  orders: Array<{
    id: string;
    listing_title: string;
    listing_type: string;
    gross_amount: number;
    discount: number;
    commission: number;
    seller_payout: number;
    status: string;
    created_at: string;
    customer_name: string;
    seller_name: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function SalesAnalyticsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalesData | null>(null);
  const [orderType, setOrderType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { period, page, limit: 12 };
      if (orderType !== "all") params.orderType = orderType;
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await apiGet<SalesData>("/admin/analytics/sales", params);
      if (res) setData(res);
    } catch (err) {
      console.error("Sales analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, [period, page, orderType, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const p = data?.products;
  const s = data?.services;
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
          Sales Analytics & Conversion Engine
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Separated digital product and professional service revenue models, conversion funnels, and order settlement.
        </p>
      </div>

      <DashboardFilterBar
        onRefresh={loadData}
        isRefreshing={loading}
        exportType="sales"
        showOrderTypeFilter={true}
        orderType={orderType}
        onOrderTypeChange={(val) => {
          setOrderType(val);
          setPage(1);
        }}
        showStatusFilter={true}
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
      />

      {/* Two Model Comparison Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Digital Products Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Digital Product Sales
              </h2>
              <p className="text-[11px] text-slate-500">Self-service downloadable assets & UI kits</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Orders</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {p?.totalOrders ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Revenue</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${p?.revenue?.toLocaleString() ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Avg Price</div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                ${p?.avgPrice?.toFixed(2) ?? "0.00"}
              </div>
            </div>
          </div>
        </div>

        {/* Professional Services Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Professional Service Bookings
              </h2>
              <p className="text-[11px] text-slate-500">Custom design sprints, retainers, and contracts</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Bookings</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {s?.totalOrders ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Revenue</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${s?.revenue?.toLocaleString() ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Avg Booking</div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                ${s?.avgPrice?.toFixed(2) ?? "0.00"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel Visualization */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Marketplace Conversion Funnel
          </h2>
          <p className="text-xs text-slate-500">
            Real-time step-by-step conversion from discovery view to order completion
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {(data?.funnel || []).map((step, idx) => {
            const firstCount = data?.funnel[0]?.count || 1;
            const pct = Math.round((step.count / firstCount) * 100);
            return (
              <div
                key={step.step}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
                  <span>Step 0{idx + 1}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{pct}%</span>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {step.count.toLocaleString()}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 truncate">
                  {step.step}
                </div>
                {/* Visual bar fill */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Marketplace Transaction Records
            </h2>
            <p className="text-xs text-slate-500">
              Showing {data?.orders?.length || 0} of {pagination?.total || 0} matching orders
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Order ID</th>
                <th className="pb-3 font-semibold">Deliverable Item</th>
                <th className="pb-3 font-semibold">Model</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Seller</th>
                <th className="pb-3 font-semibold text-right">Gross</th>
                <th className="pb-3 font-semibold text-right">Fee (15%)</th>
                <th className="pb-3 font-semibold text-right">Payout</th>
                <th className="pb-3 font-semibold text-right">Status</th>
                <th className="pb-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {(data?.orders || []).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-2 font-mono text-[10px] text-slate-400">
                    {o.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 pr-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                    {o.listing_title}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        o.listing_type === "service"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      }`}
                    >
                      {o.listing_type === "service" ? "Service" : "Product"}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{o.customer_name}</td>
                  <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{o.seller_name}</td>
                  <td className="py-3 pr-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    ${Number(o.gross_amount).toFixed(2)}
                  </td>
                  <td className="py-3 pr-3 text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                    ${Number(o.commission).toFixed(2)}
                  </td>
                  <td className="py-3 pr-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    ${Number(o.seller_payout).toFixed(2)}
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

        {/* Pagination Bar */}
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
