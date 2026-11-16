"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  status: string;
  type?: "status" | "priority" | "sla" | "type" | "channel" | "role";
  className?: string;
}

export function CommunicationStatusBadge({ status, type = "status", className }: Props) {
  const norm = (status || "").toLowerCase().replace(/\s+/g, "_");

  // SLA Badges
  if (type === "sla") {
    if (norm === "compliant") {
      return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20", className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Compliant
        </span>
      );
    }
    if (norm === "warning") {
      return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20", className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          SLA Warning
        </span>
      );
    }
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20", className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        SLA Breached
      </span>
    );
  }

  // Priority Badges
  if (type === "priority") {
    switch (norm) {
      case "critical":
        return <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-600 text-white shadow-sm", className)}>CRITICAL</span>;
      case "urgent":
        return <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30", className)}>URGENT</span>;
      case "high":
        return <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30", className)}>High</span>;
      case "normal":
        return <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20", className)}>Normal</span>;
      default:
        return <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20", className)}>Low</span>;
    }
  }

  // Status Badges
  switch (norm) {
    case "open":
    case "active":
    case "new":
      return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20", className)}>
          Open
        </span>
      );
    case "resolved":
    case "delivered":
    case "sent":
    case "completed":
    case "published":
      return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20", className)}>
          {norm === "delivered" ? "Delivered" : norm === "published" ? "Published" : "Resolved"}
        </span>
      );
    case "pending":
    case "waiting_customer":
    case "waiting_seller":
    case "waiting_support":
    case "under_review":
    case "in_progress":
    case "assigned":
    case "evidence_requested":
      return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 capitalize", className)}>
          {norm.replace(/_/g, " ")}
        </span>
      );
    case "escalated":
      return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30", className)}>
          Escalated
        </span>
      );
    case "closed":
    case "archived":
      return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 capitalize", className)}>
          {norm}
        </span>
      );
    case "failed":
    case "bounced":
    case "rejected":
    case "cancelled":
      return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 capitalize", className)}>
          {norm}
        </span>
      );
    case "queued":
    case "scheduled":
    case "draft":
      return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 capitalize", className)}>
          {norm}
        </span>
      );
    default:
      return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize", className)}>
          {status || "General"}
        </span>
      );
  }
}
