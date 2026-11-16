"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tag,
  Megaphone,
  Briefcase,
  Package,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  Users,
  Gift,
  Tv
} from "lucide-react";

interface MarketingNavHeaderProps {
  title: string;
  description: string;
  activeTab: string;
}

export const MarketingNavHeader: React.FC<MarketingNavHeaderProps> = ({
  title,
  description,
  activeTab
}) => {
  const pathname = usePathname();

  const tabs = [
    { id: "coupons", label: "Coupons", href: "/dashboard/marketing/coupons", icon: Tag },
    { id: "campaigns", label: "Discount Campaigns", href: "/dashboard/marketing/campaigns", icon: Megaphone },
    { id: "featured-services", label: "Featured Services", href: "/dashboard/marketing/featured-services", icon: Briefcase },
    { id: "featured-products", label: "Featured Products", href: "/dashboard/marketing/featured-products", icon: Package },
    { id: "banners", label: "Homepage Banners", href: "/dashboard/marketing/banners", icon: ImageIcon },
    { id: "sections", label: "Promotional Sections", href: "/dashboard/marketing/sections", icon: LayoutGrid },
    { id: "newsletters", label: "Newsletter Campaigns", href: "/dashboard/marketing/newsletters", icon: Mail },
    { id: "affiliates", label: "Affiliate Management", href: "/dashboard/marketing/affiliates", icon: Users },
    { id: "referrals", label: "Referral Programs", href: "/dashboard/marketing/referrals", icon: Gift },
    { id: "ads", label: "Advertisement Management", href: "/dashboard/marketing/ads", icon: Tv }
  ];

  return (
    <div className="mb-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id || pathname === t.href;
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                isActive
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
