"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldAlert,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
  total_orders: number;
  digital_orders: number;
  service_orders: number;
  total_bookings: number;
  new_bookings: number;
  pending_confirmation: number;
  in_progress: number;
  active_projects: number;
  submitted_deliveries: number;
  revision_requests: number;
  completed_orders: number;
  cancelled_orders: number;
  disputed_orders: number;
  custom_quotes: number;
  total_gmv_cents: number;
  platform_revenue_cents: number;
}

export function OrdersKpiStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/admin/orders/stats");
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load orders stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse" />
        ))}
      </div>
    );
  }

  const gmvDollars = ((stats?.total_gmv_cents || 0) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const cards = [
    {
      label: "Total Volume (GMV)",
      value: `$${gmvDollars}`,
      sub: "All-time marketplace GMV",
      icon: DollarSign,
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400",
    },
    {
      label: "Total Orders",
      value: stats?.total_orders?.toLocaleString() || "0",
      sub: `${stats?.digital_orders || 0} Digital • ${stats?.service_orders || 0} Service`,
      icon: ShoppingBag,
      color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400",
    },
    {
      label: "Live Bookings",
      value: stats?.total_bookings?.toLocaleString() || "0",
      sub: `${stats?.new_bookings || 0} pending sessions`,
      icon: Calendar,
      color: "from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-400",
    },
    {
      label: "Active Projects",
      value: stats?.active_projects?.toLocaleString() || "0",
      sub: `${stats?.in_progress || 0} in development`,
      icon: TrendingUp,
      color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
    },
    {
      label: "Deliveries in Review",
      value: stats?.submitted_deliveries?.toLocaleString() || "0",
      sub: `${stats?.revision_requests || 0} active revisions`,
      icon: Sparkles,
      color: "from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400",
    },
    {
      label: "Disputed Escrow",
      value: stats?.disputed_orders?.toLocaleString() || "0",
      sub: "Active legal investigations",
      icon: ShieldAlert,
      color: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-3.5 rounded-2xl bg-gradient-to-br ${c.color} border shadow-lg backdrop-blur-sm relative overflow-hidden flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {c.label}
              </span>
              <Icon className="w-4 h-4 opacity-75 shrink-0" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-white tracking-tight">{c.value}</div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{c.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
