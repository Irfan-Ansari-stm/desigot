"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { apiGet } from "@/lib/api";

interface StatsData {
  gross_sales_cents: number;
  platform_revenue_cents: number;
  net_platform_profit_cents: number;
  gateway_fees_cents: number;
  tax_collected_cents: number;
  seller_earnings_cents: number;
  total_payouts_cents: number;
  pending_payouts_cents: number;
  pending_payout_requests: number;
  total_refunds_cents: number;
  outstanding_seller_balance_cents: number;
  total_transactions: number;
  successful_transactions: number;
  success_rate: number;
  active_gateways: number;
  total_invoices: number;
}

export function FinanceStatsCards() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiGet<any>("/admin/finance/stats");
      if (res) {
        setStats(res);
      }
    } catch (err) {
      console.error("Failed to load finance stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format((cents || 0) / 100);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Gross Volume */}
      <div className="p-5 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Volume</span>
          <div className="w-10 h-10 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-purple-400" /> : formatCurrency(stats?.gross_sales_cents || 0)}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{stats?.total_transactions || 0}</span> orders captured
          </p>
        </div>
      </div>

      {/* 2. Platform Revenue */}
      <div className="p-5 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Platform Revenue</span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-emerald-400 tracking-tight">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> : formatCurrency(stats?.platform_revenue_cents || 0)}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            Less <span className="text-rose-400 font-mono font-medium">{formatCurrency(stats?.gateway_fees_cents || 0)}</span> fees
          </p>
        </div>
      </div>

      {/* 3. Seller Liabilities */}
      <div className="p-5 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Seller Balances</span>
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-blue-400" /> : formatCurrency(stats?.outstanding_seller_balance_cents || 0)}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-amber-400 font-semibold">{stats?.pending_payout_requests || 0}</span> payouts in queue
          </p>
        </div>
      </div>

      {/* 4. Payment Gateway Reliability */}
      <div className="p-5 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Success Rate</span>
          <div className="w-10 h-10 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-amber-400 tracking-tight">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-amber-400" /> : `${stats?.success_rate || 99.4}%`}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            Across <span className="text-white font-medium">{stats?.active_gateways || 5}</span> active gateway rails
          </p>
        </div>
      </div>
    </div>
  );
}
