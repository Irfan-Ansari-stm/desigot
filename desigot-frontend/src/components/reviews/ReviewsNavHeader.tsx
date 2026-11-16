"use strict";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Briefcase
} from "lucide-react";

interface ReviewsNavHeaderProps {
  title: string;
  description: string;
  activeTab: string;
}

export const ReviewsNavHeader: React.FC<ReviewsNavHeaderProps> = ({
  title,
  description,
  activeTab
}) => {
  const pathname = usePathname();

  const tabs = [
    { id: "all", label: "All Reviews", href: "/dashboard/reviews/all", icon: Star },
    { id: "pending", label: "Pending Reviews", href: "/dashboard/reviews/pending", icon: Clock, badge: "Audit" },
    { id: "approved", label: "Approved Reviews", href: "/dashboard/reviews/approved", icon: CheckCircle2 },
    { id: "rejected", label: "Rejected Reviews", href: "/dashboard/reviews/rejected", icon: XCircle },
    { id: "reported", label: "Reported Reviews", href: "/dashboard/reviews/reported", icon: Flag, badge: "Reports" },
    { id: "responses", label: "Seller Responses", href: "/dashboard/reviews/responses", icon: MessageSquare },
    { id: "moderation", label: "Review Moderation", href: "/dashboard/reviews/moderation", icon: ShieldCheck },
    { id: "products", label: "Product Ratings", href: "/dashboard/reviews/products", icon: ShoppingBag },
    { id: "services", label: "Service Ratings", href: "/dashboard/reviews/services", icon: Briefcase }
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* Page Title & Context */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>

      {/* Navigation tabs */}
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
              {t.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
