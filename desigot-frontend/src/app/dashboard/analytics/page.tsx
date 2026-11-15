"use client";
import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Store,
  Briefcase,
  Layers,
  Users,
  Activity,
  ArrowRight,
} from "lucide-react";

export default function AnalyticsIndexPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view");

  useEffect(() => {
    // If a specific view param is passed, seamlessly redirect to the dedicated page
    if (view) {
      const viewMap: Record<string, string> = {
        revenue: "/dashboard/revenue",
        marketplace: "/dashboard/marketplace",
        sales: "/dashboard/sales",
        services: "/dashboard/services",
        sellers: "/dashboard/sellers",
        customers: "/dashboard/customers",
      };
      if (viewMap[view]) {
        router.replace(viewMap[view]);
      }
    }
  }, [view, router]);

  const sections = [
    {
      title: "Revenue Analytics",
      href: "/dashboard/revenue",
      icon: DollarSign,
      color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      description: "GMV, net platform commissions, seller earnings, discounts, and financial ledger breakdown.",
    },
    {
      title: "Marketplace Analytics",
      href: "/dashboard/marketplace",
      icon: Store,
      color: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
      description: "Catalog inventory, conversion rates, design category velocity, and buyer search terms.",
    },
    {
      title: "Sales Analytics",
      href: "/dashboard/sales",
      icon: TrendingUp,
      color: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
      description: "Digital product downloads vs professional service sales, conversion funnels, and orders.",
    },
    {
      title: "Service Analytics",
      href: "/dashboard/services",
      icon: Briefcase,
      color: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
      description: "Custom service offerings, review score averages, review queues, and top booked designers.",
    },
    {
      title: "Seller Analytics",
      href: "/dashboard/sellers",
      icon: Users,
      color: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
      description: "Seller verification cohort metrics, ratings, lifetime earnings, and leaderboard rankings.",
    },
    {
      title: "Customer Analytics",
      href: "/dashboard/customers",
      icon: Layers,
      color: "bg-violet-500/20 text-violet-600 dark:text-violet-400",
      description: "Buyer acquisition growth, average lifetime value (LTV), and VIP cohort spending behavior.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
          Platform Business Intelligence & Analytics Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select a dedicated analytics module to review real-time database-driven reporting and charts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link
              key={sec.title}
              href={sec.href}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${sec.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {sec.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {sec.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Open Analytics</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
