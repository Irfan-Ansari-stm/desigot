"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { ExportsReportView } from "@/components/dashboard/analytics/ExportsReportView";

export default function AnalyticsExportsPage() {
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
            <Download className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Analytics Export Reports & Audit History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            On-demand CSV & JSON data extraction with audit history, download links, and lifecycle expiration.
          </p>
        </div>
      </div>
      <ExportsReportView />
    </div>
  );
}
