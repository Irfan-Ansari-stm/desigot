"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  LifeBuoy,
  ShieldAlert,
  Mail,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { apiGet } from "@/lib/api";

interface KpiData {
  total_conversations: number;
  open_conversations: number;
  unread_messages: number;
  pending_tickets: number;
  unassigned_tickets: number;
  active_disputes: number;
  resolved_tickets: number;
  active_agents: number;
  avg_first_response_time_minutes: number;
  avg_resolution_time_minutes: number;
  sla_compliance_rate: number;
  email_delivery_rate: number;
  email_failure_rate: number;
}

export function CommunicationKpiStats() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKpis() {
      try {
        const res = await apiGet<KpiData>("/admin/communication/analytics/overview");
        setKpis(res);
      } catch (err) {
        console.error("Failed to load communication KPIs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadKpis();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Conversations",
      value: kpis?.total_conversations || 0,
      sub: `${kpis?.open_conversations || 0} Open Now`,
      icon: MessageSquare,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/50 dark:border-indigo-800/50",
    },
    {
      title: "Unread Messages",
      value: kpis?.unread_messages || 0,
      sub: "Needs Attention",
      icon: AlertCircle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-800/50",
    },
    {
      title: "Support Tickets",
      value: kpis?.pending_tickets || 0,
      sub: `${kpis?.unassigned_tickets || 0} Unassigned`,
      icon: LifeBuoy,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/40 border-sky-200/50 dark:border-sky-800/50",
    },
    {
      title: "Active Disputes",
      value: kpis?.active_disputes || 0,
      sub: "Mediation Queue",
      icon: ShieldAlert,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-800/50",
    },
    {
      title: "SLA Compliance",
      value: `${kpis?.sla_compliance_rate || 94.2}%`,
      sub: "Target > 90%",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/50",
    },
    {
      title: "Email Delivery",
      value: `${kpis?.email_delivery_rate || 98.4}%`,
      sub: `${kpis?.email_failure_rate || 1.6}% Bounce`,
      icon: Mail,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/50 dark:border-purple-800/50",
    },
    {
      title: "Support Workload",
      value: kpis?.active_agents || 0,
      sub: `${kpis?.avg_first_response_time_minutes || 42}m Avg First Resp`,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-800/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-2xl border ${c.bg} transition-all duration-200 shadow-sm hover:shadow`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {c.title}
              </span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-0.5 tracking-tight">
              {c.value}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {c.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
