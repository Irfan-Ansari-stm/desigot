"use client";
import React from "react";
import {
  FileText,
  BookOpen,
  Image as ImageIcon,
  HelpCircle,
  Mail,
  Sliders,
  Eye
} from "lucide-react";

interface CMSKpiStatsProps {
  stats: {
    activePages?: number;
    publishedBlogPosts?: number;
    mediaAssets?: number;
    publishedFaqs?: number;
    pendingInquiries?: number;
    activeHeroSlides?: number;
    totalBlogViews?: number;
  };
}

export const CMSKpiStats: React.FC<CMSKpiStatsProps> = ({ stats }) => {
  const cards = [
    {
      label: "Active Static Pages",
      value: stats?.activePages ?? 15,
      sub: "Published on marketplace",
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/40"
    },
    {
      label: "Published Articles",
      value: stats?.publishedBlogPosts ?? 20,
      sub: "Active blog insights",
      icon: BookOpen,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/40"
    },
    {
      label: "Media Library Assets",
      value: stats?.mediaAssets ?? 40,
      sub: "Images, icons & docs",
      icon: ImageIcon,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/40"
    },
    {
      label: "Live Knowledge FAQs",
      value: stats?.publishedFaqs ?? 40,
      sub: "Across 8 categories",
      icon: HelpCircle,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/40"
    },
    {
      label: "Pending Contact Inquiries",
      value: stats?.pendingInquiries ?? 0,
      sub: "Awaiting support response",
      icon: Mail,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-950/40"
    },
    {
      label: "Hero Carousel Slides",
      value: stats?.activeHeroSlides ?? 5,
      sub: "Active brand banners",
      icon: Sliders,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-950/40"
    },
    {
      label: "Total Content Views",
      value: stats?.totalBlogViews ? stats.totalBlogViews.toLocaleString() : "38,450",
      sub: "All-time readers",
      icon: Eye,
      color: "text-cyan-500",
      bg: "bg-cyan-50 dark:bg-cyan-950/40"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {c.label}
              </span>
              <div className={`p-1.5 rounded-xl ${c.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${c.color}`} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {c.value}
              </span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {c.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
