"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import { ServiceWizard } from "@/components/service-management/ServiceWizard";

export default function CreateServicePage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/service-management/all"
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create New Service</h1>
            <p className="text-xs text-slate-400">
              8-step enterprise creation wizard with instant previews and multi-package support.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Super Admin Authority Active</span>
        </div>
      </div>

      {/* 8-Step Wizard Container */}
      <ServiceWizard />
    </div>
  );
}
