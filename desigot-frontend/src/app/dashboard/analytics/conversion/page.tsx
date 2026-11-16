"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Percent } from "lucide-react";
import { ConversionReportView } from "@/components/dashboard/analytics/ConversionReportView";

export default function AnalyticsConversionPage() {
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
            <Percent className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Conversion Funnel & Acquisition Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            7-stage conversion funnel drop-offs, device breakdowns (Desktop, Mobile), and traffic channel performance.
          </p>
        </div>
      </div>
      <ConversionReportView />
    </div>
  );
}
