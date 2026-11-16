"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { CategoriesReportView } from "@/components/dashboard/analytics/CategoriesReportView";

export default function AnalyticsCategoriesPage() {
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
            <Layers className="h-6 w-6 text-violet-500" />
            Popular Design Categories & Taxonomy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Marketplace gross GMV share, active listings density, order volume, and category AOV.
          </p>
        </div>
      </div>
      <CategoriesReportView />
    </div>
  );
}
