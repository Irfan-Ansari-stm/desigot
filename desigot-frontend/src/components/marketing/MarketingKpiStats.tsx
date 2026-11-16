"use client";
import React from "react";
import {
  Tag,
  Megaphone,
  Image as ImageIcon,
  Users,
  Tv,
  DollarSign
} from "lucide-react";

interface KpiData {
  coupons?: {
    total?: number;
    active?: number;
    total_redemptions?: number;
    total_discount_given_cents?: number;
  };
  campaigns?: {
    total?: number;
    active?: number;
    revenue_cents?: number;
  };
  featured?: {
    active_services?: number;
    active_products?: number;
  };
  banners?: {
    total?: number;
    active?: number;
    impressions?: number;
    clicks?: number;
    ctr?: number;
  };
  subscribers?: {
    total?: number;
    active?: number;
  };
  affiliates?: {
    total?: number;
    active?: number;
    revenue_cents?: number;
    paid_cents?: number;
    pending_cents?: number;
  };
  referrals?: {
    programs?: number;
    active_programs?: number;
    conversions?: number;
    rewards_spent_cents?: number;
  };
  advertisements?: {
    total?: number;
    active?: number;
    total_spend_cents?: number;
    impressions?: number;
    clicks?: number;
    ctr?: number;
  };
}

interface MarketingKpiStatsProps {
  stats: KpiData | null;
  loading?: boolean;
}

export const MarketingKpiStats: React.FC<MarketingKpiStatsProps> = ({ stats, loading = false }) => {
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
      title: "Active Coupons",
      value: (stats.coupons?.active ?? 0).toLocaleString(),
      subtext: `${(stats.coupons?.total_redemptions ?? 0).toLocaleString()} redemptions`,
      icon: Tag,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40"
    },
    {
      title: "Active Campaigns",
      value: (stats.campaigns?.active ?? 0).toLocaleString(),
      subtext: `$${((stats.campaigns?.revenue_cents ?? 0) / 100).toLocaleString()} GMV`,
      icon: Megaphone,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40"
    },
    {
      title: "Featured Assets",
      value: ((stats.featured?.active_services ?? 0) + (stats.featured?.active_products ?? 0)).toLocaleString(),
      subtext: `${stats.featured?.active_services ?? 0} srv / ${stats.featured?.active_products ?? 0} prod`,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40"
    },
    {
      title: "Banner CTR",
      value: `${stats.banners?.ctr ?? 0}%`,
      subtext: `${(stats.banners?.clicks ?? 0).toLocaleString()} clicks / ${(stats.banners?.impressions ?? 0).toLocaleString()} imp`,
      icon: ImageIcon,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40"
    },
    {
      title: "Affiliate Revenue",
      value: `$${((stats.affiliates?.revenue_cents ?? 0) / 100).toLocaleString()}`,
      subtext: `${stats.affiliates?.active ?? 0} active partners`,
      icon: Users,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40"
    },
    {
      title: "Ad Spend",
      value: `$${((stats.advertisements?.total_spend_cents ?? 0) / 100).toLocaleString()}`,
      subtext: `${stats.advertisements?.active ?? 0} active sponsored ads`,
      icon: Tv,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs transition hover:border-purple-300 dark:hover:border-purple-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${c.color}`} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {c.value}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {c.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
