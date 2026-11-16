"use strict";
import React from "react";
import { CheckCircle2, Clock, XCircle, EyeOff, AlertTriangle, ShieldCheck, Flag } from "lucide-react";

interface ReviewStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({ status, size = "md" }) => {
  const norm = (status || "").toLowerCase().trim();
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  switch (norm) {
    case "approved":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 ${padding}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Approved
        </span>
      );
    case "pending":
    case "pending_moderation":
    case "pending_approval":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 ${padding}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
          Pending Audit
        </span>
      );
    case "rejected":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 ${padding}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          Rejected
        </span>
      );
    case "hidden":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 ${padding}`}>
          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
          Hidden
        </span>
      );
    case "under_investigation":
    case "investigating":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 ${padding}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          Investigating
        </span>
      );
    case "removed":
    case "resolved_removed":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800 ${padding}`}>
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          Removed
        </span>
      );
    case "resolved_dismissed":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 ${padding}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          Dismissed
        </span>
      );
    case "escalated":
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800 ${padding}`}>
          <Flag className="w-3.5 h-3.5 text-orange-600" />
          Escalated
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${padding}`}>
          {status}
        </span>
      );
  }
};

export const VerifiedPurchaseBadge: React.FC<{ isVerified?: boolean }> = ({ isVerified = true }) => {
  if (!isVerified) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 rounded-full" title="Verified Customer Purchase">
      <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
      Verified Buyer
    </span>
  );
};

export const RiskScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const val = Number(score) || 0;
  if (val >= 0.7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-red-700 bg-red-100 dark:bg-red-950/50 dark:text-red-400 rounded-md">
        Risk: High ({(val * 100).toFixed(0)}%)
      </span>
    );
  } else if (val >= 0.35) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400 rounded-md">
        Risk: Med ({(val * 100).toFixed(0)}%)
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-md">
        Risk: Low ({(val * 100).toFixed(0)}%)
      </span>
    );
  }
};
