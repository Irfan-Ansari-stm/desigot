"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layout,
  Sliders,
  Menu as MenuIcon,
  Grid,
  Briefcase,
  Layers,
  Sparkles,
  TrendingUp,
  Info,
  Mail,
  HelpCircle,
  FileText,
  ShieldCheck,
  RefreshCcw,
  Dock,
  FileCode,
  BookOpen
} from "lucide-react";

interface CMSNavHeaderProps {
  title: string;
  description: string;
  activeTab: string;
}

export const CMSNavHeader: React.FC<CMSNavHeaderProps> = ({
  title,
  description,
  activeTab
}) => {
  const pathname = usePathname();

  const tabs = [
    { id: "homepage", label: "Homepage", href: "/dashboard/cms/homepage", icon: Layout },
    { id: "hero", label: "Hero Section", href: "/dashboard/cms/hero", icon: Sliders },
    { id: "navigation", label: "Navigation Menus", href: "/dashboard/cms/navigation", icon: MenuIcon },
    { id: "mega-menu", label: "Browse Mega Menu", href: "/dashboard/cms/mega-menu", icon: Grid },
    { id: "services-page", label: "Services Page", href: "/dashboard/cms/services-page", icon: Briefcase },
    { id: "categories-page", label: "Categories Page", href: "/dashboard/cms/categories-page", icon: Layers },
    { id: "featured-sections", label: "Featured Sections", href: "/dashboard/cms/featured-sections", icon: Sparkles },
    { id: "trending-sections", label: "Trending Sections", href: "/dashboard/cms/trending-sections", icon: TrendingUp },
    { id: "about", label: "About Us", href: "/dashboard/cms/about", icon: Info },
    { id: "contact", label: "Contact Page", href: "/dashboard/cms/contact", icon: Mail },
    { id: "faq", label: "FAQ Management", href: "/dashboard/cms/faq", icon: HelpCircle },
    { id: "terms", label: "Terms & Conditions", href: "/dashboard/cms/terms", icon: FileText },
    { id: "privacy", label: "Privacy Policy", href: "/dashboard/cms/privacy", icon: ShieldCheck },
    { id: "refund-policy", label: "Refund Policy", href: "/dashboard/cms/refund-policy", icon: RefreshCcw },
    { id: "footer", label: "Footer Builder", href: "/dashboard/cms/footer", icon: Dock },
    { id: "pages", label: "Static Pages", href: "/dashboard/cms/pages", icon: FileCode },
    { id: "blog", label: "Blog Management", href: "/dashboard/cms/blog", icon: BookOpen }
  ];

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </p>
        </div>
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
