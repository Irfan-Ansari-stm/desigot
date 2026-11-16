"use client";
import React, { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Briefcase,
  Layers,
  Users,
  Store,
  Calculator,
  Percent,
  Download,
  Star,
  LayoutDashboard
} from "lucide-react";

import { AnalyticsOverviewTab } from "@/components/dashboard/analytics/AnalyticsOverviewTab";
import { RevenueReportView } from "@/components/dashboard/analytics/RevenueReportView";
import { SalesReportView } from "@/components/dashboard/analytics/SalesReportView";
import { ServiceReportView } from "@/components/dashboard/analytics/ServiceReportView";
import { ProductReportView } from "@/components/dashboard/analytics/ProductReportView";
import { SellerReportView } from "@/components/dashboard/analytics/SellerReportView";
import { CustomerReportView } from "@/components/dashboard/analytics/CustomerReportView";
import { CommissionReportView } from "@/components/dashboard/analytics/CommissionReportView";
import { ConversionReportView } from "@/components/dashboard/analytics/ConversionReportView";
import { CategoriesReportView } from "@/components/dashboard/analytics/CategoriesReportView";
import { PopularServicesReportView } from "@/components/dashboard/analytics/PopularServicesReportView";
import { PopularProductsReportView } from "@/components/dashboard/analytics/PopularProductsReportView";
import { ExportsReportView } from "@/components/dashboard/analytics/ExportsReportView";

const TABS = [
  { id: "overview", label: "Unified Overview", icon: LayoutDashboard },
  { id: "revenue", label: "Revenue Reports", icon: DollarSign },
  { id: "sales", label: "Sales Reports", icon: TrendingUp },
  { id: "services", label: "Service Reports", icon: Briefcase },
  { id: "products", label: "Product Reports", icon: Layers },
  { id: "sellers", label: "Seller Reports", icon: Store },
  { id: "customers", label: "Customer Reports", icon: Users },
  { id: "commissions", label: "Commission Reports", icon: Calculator },
  { id: "conversion", label: "Conversion Funnel", icon: Percent },
  { id: "categories", label: "Popular Categories", icon: Layers },
  { id: "popular-services", label: "Popular Services", icon: Star },
  { id: "popular-products", label: "Popular Products", icon: Layers },
  { id: "exports", label: "Export Reports", icon: Download },
];

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawView = searchParams.get("view") || "overview";
  // Normalize alternative spellings from sidebar
  let currentView = rawView.toLowerCase();
  if (currentView === "conversions") currentView = "conversion";
  if (currentView === "popular_services") currentView = "popular-services";
  if (currentView === "popular_products") currentView = "popular-products";

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "overview") {
      params.delete("view");
    } else {
      params.set("view", tabId);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Module 14 – Analytics & Business Intelligence Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise database-driven reporting, 7-stage conversion tracking, and multi-dimensional sales intelligence.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active View */}
      {currentView === "overview" && <AnalyticsOverviewTab onSelectView={handleTabChange} />}
      {currentView === "revenue" && <RevenueReportView />}
      {currentView === "sales" && <SalesReportView />}
      {currentView === "services" && <ServiceReportView />}
      {currentView === "products" && <ProductReportView />}
      {currentView === "sellers" && <SellerReportView />}
      {currentView === "customers" && <CustomerReportView />}
      {currentView === "commissions" && <CommissionReportView />}
      {currentView === "conversion" && <ConversionReportView />}
      {currentView === "categories" && <CategoriesReportView />}
      {currentView === "popular-services" && <PopularServicesReportView />}
      {currentView === "popular-products" && <PopularProductsReportView />}
      {currentView === "exports" && <ExportsReportView />}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Analytics Hub...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
