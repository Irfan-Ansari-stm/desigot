"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { SellerReportView } from "@/components/dashboard/analytics/SellerReportView";

export default function AnalyticsSellersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/analytics"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans flex items-center gap-2">
            <Store className="h-6 w-6 text-amber-500" />
            Seller Performance & Payout Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Seller verification cohorts, GMV revenue leaderboards, ratings, and balance reserves.
          </p>
        </div>
      </div>
      <SellerReportView />
    </div>
  );
}
