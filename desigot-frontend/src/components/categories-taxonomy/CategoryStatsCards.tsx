"use client";

import React, { useEffect, useState } from "react";
import {
  FolderTree,
  CheckCircle2,
  Layers,
  Briefcase,
  Package,
  Sparkles,
  Sliders,
  Image,
} from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
  total_categories: number;
  published_categories: number;
  draft_categories: number;
  archived_categories: number;
  main_categories: number;
  subcategories: number;
  service_categories: number;
  product_categories: number;
  shared_categories: number;
  featured_categories: number;
  total_assigned_services: number;
  total_assigned_products: number;
  total_attributes: number;
  total_icons: number;
  total_banners: number;
}

export function CategoryStatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/admin/categories/stats");
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load category stats:", err);
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
          <div key={i} className="h-24 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Taxonomy",
      value: stats?.total_categories || 0,
      sub: `${stats?.published_categories || 0} published`,
      icon: FolderTree,
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400",
    },
    {
      label: "Main Categories",
      value: stats?.main_categories || 0,
      sub: `${stats?.subcategories || 0} subcategories`,
      icon: Layers,
      color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400",
    },
    {
      label: "Service Taxonomy",
      value: stats?.service_categories || 0,
      sub: `${stats?.total_assigned_services || 0} active services`,
      icon: Briefcase,
      color: "from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400",
    },
    {
      label: "Product Taxonomy",
      value: stats?.product_categories || 0,
      sub: `${stats?.total_assigned_products || 0} digital products`,
      icon: Package,
      color: "from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-400",
    },
    {
      label: "Dynamic Attributes",
      value: stats?.total_attributes || 0,
      sub: "Reusable field schemas",
      icon: Sliders,
      color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
    },
    {
      label: "Media & Banners",
      value: stats?.total_banners || 0,
      sub: `${stats?.total_icons || 0} registered icons`,
      icon: Image,
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
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
