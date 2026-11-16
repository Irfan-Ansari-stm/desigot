"use strict";
import React from "react";
import { Star, Clock, AlertTriangle, ShieldCheck, MessageSquare, CheckCircle, Scale } from "lucide-react";

interface KpiStatsData {
  total_reviews?: number;
  pending_reviews?: number;
  approved_reviews?: number;
  rejected_reviews?: number;
  hidden_reviews?: number;
  investigating_reviews?: number;
  average_rating?: number;
  five_star_percentage?: number;
  verified_purchase_percentage?: number;
  active_reports_count?: number;
  total_responses?: number;
  pending_responses?: number;
  active_rules_count?: number;
}

interface ReviewsKpiStatsProps {
  stats: KpiStatsData | null;
  loading?: boolean;
}

export const ReviewsKpiStats: React.FC<ReviewsKpiStatsProps> = ({ stats, loading = false }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 animate-pulse">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
            <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Reviews",
      value: (stats.total_reviews ?? 0).toLocaleString(),
      subtext: `${stats.approved_reviews ?? 0} published`,
      icon: MessageSquare,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40"
    },
    {
      title: "Avg Rating",
      value: (stats.average_rating ?? 0).toFixed(2),
      subtext: `${stats.five_star_percentage ?? 0}% 5-Star ratio`,
      icon: Star,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40"
    },
    {
      title: "Pending Audit",
      value: (stats.pending_reviews ?? 0).toLocaleString(),
      subtext: "Requires moderator review",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      alert: (stats.pending_reviews ?? 0) > 0
    },
    {
      title: "Active Reports",
      value: (stats.active_reports_count ?? 0).toLocaleString(),
      subtext: `${stats.investigating_reviews ?? 0} in investigation`,
      icon: AlertTriangle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      alert: (stats.active_reports_count ?? 0) > 0
    },
    {
      title: "Verified Buyers",
      value: `${stats.verified_purchase_percentage ?? 0}%`,
      subtext: "Order/booking confirmed",
      icon: ShieldCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40"
    },
    {
      title: "Seller Responses",
      value: (stats.total_responses ?? 0).toLocaleString(),
      subtext: `${stats.pending_responses ?? 0} pending approval`,
      icon: CheckCircle,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bg}`}>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {c.value}
              </span>
              {c.alert && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
              {c.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
