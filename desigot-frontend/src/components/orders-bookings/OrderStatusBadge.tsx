"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PlayCircle,
  HelpCircle,
  FileCheck2,
  RotateCcw,
  ShieldAlert,
  Send,
  Sparkles,
  Archive,
  RefreshCw,
  Video,
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type?: "order" | "booking" | "dispute" | "quote" | "delivery";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OrderStatusBadge({
  status,
  type = "order",
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase().trim();

  const getConfig = () => {
    switch (normalized) {
      // Order & Booking Completed
      case "completed":
        return {
          label: "Completed",
          bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-400",
          icon: CheckCircle2,
        };

      // Order Active / In Progress
      case "active":
        return {
          label: "Active Project",
          bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          dot: "bg-blue-400",
          icon: PlayCircle,
        };
      case "in_progress":
        return {
          label: "In Progress",
          bg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
          dot: "bg-indigo-400",
          icon: RefreshCw,
        };

      // Paid / Payment Confirmed
      case "paid":
        return {
          label: "Paid & Escrowed",
          bg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
          dot: "bg-teal-400",
          icon: CheckCircle2,
        };

      // Pending Confirmation / Requested
      case "pending_confirmation":
        return {
          label: "Pending Confirmation",
          bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          dot: "bg-amber-400",
          icon: Clock,
        };
      case "requested":
        return {
          label: "Booking Requested",
          bg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
          dot: "bg-purple-400",
          icon: Sparkles,
        };
      case "confirmed":
        return {
          label: "Confirmed Booking",
          bg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
          dot: "bg-cyan-400",
          icon: Video,
        };
      case "rescheduled":
        return {
          label: "Rescheduled",
          bg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
          dot: "bg-orange-400",
          icon: RotateCcw,
        };

      // Pending Payment
      case "pending_payment":
        return {
          label: "Pending Payment",
          bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          dot: "bg-amber-400",
          icon: Clock,
        };

      // Deliveries & Revisions
      case "delivered":
      case "submitted":
        return {
          label: "Delivery Submitted",
          bg: "bg-violet-500/15 text-violet-300 border-violet-500/30",
          dot: "bg-violet-400",
          icon: FileCheck2,
        };
      case "revision_requested":
      case "revision":
        return {
          label: "Revision Requested",
          bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          dot: "bg-rose-400",
          icon: RotateCcw,
        };

      // Disputed
      case "disputed":
      case "opened":
        return {
          label: "Dispute Opened",
          bg: "bg-red-500/15 text-red-400 border-red-500/30",
          dot: "bg-red-400",
          icon: ShieldAlert,
        };
      case "under_review":
        return {
          label: "Dispute Investigating",
          bg: "bg-red-500/15 text-red-400 border-red-500/30",
          dot: "bg-red-400",
          icon: AlertTriangle,
        };
      case "resolved_buyer":
      case "resolved_seller":
      case "resolved":
      case "split":
        return {
          label: "Dispute Resolved",
          bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-400",
          icon: CheckCircle2,
        };

      // Cancelled / Rejected / Refunded
      case "cancelled":
        return {
          label: "Cancelled",
          bg: "bg-slate-500/15 text-slate-400 border-slate-600/30",
          dot: "bg-slate-400",
          icon: XCircle,
        };
      case "rejected":
        return {
          label: "Rejected",
          bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          dot: "bg-rose-400",
          icon: XCircle,
        };
      case "refunded":
        return {
          label: "Refunded",
          bg: "bg-pink-500/15 text-pink-400 border-pink-500/30",
          dot: "bg-pink-400",
          icon: RotateCcw,
        };

      // Custom Quotes
      case "draft":
        return {
          label: "Draft Quote",
          bg: "bg-slate-500/15 text-slate-400 border-slate-600/30",
          dot: "bg-slate-400",
          icon: Archive,
        };
      case "sent":
        return {
          label: "Quote Sent",
          bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          dot: "bg-blue-400",
          icon: Send,
        };
      case "negotiating":
        return {
          label: "Negotiating",
          bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          dot: "bg-amber-400",
          icon: RefreshCw,
        };
      case "accepted":
        return {
          label: "Quote Accepted",
          bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-400",
          icon: CheckCircle2,
        };
      case "converted_to_order":
        return {
          label: "Converted To Order",
          bg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
          dot: "bg-purple-400",
          icon: Sparkles,
        };

      default:
        return {
          label: status.replace(/_/g, " "),
          bg: "bg-slate-500/15 text-slate-300 border-slate-700/50",
          dot: "bg-slate-400",
          icon: HelpCircle,
        };
    }
  };

  const { label, bg, dot, icon: Icon } = getConfig();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium gap-1.5",
    md: "px-2.5 py-1 text-xs font-semibold gap-2",
    lg: "px-3 py-1.5 text-sm font-semibold gap-2.5",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm backdrop-blur-sm uppercase tracking-wider capitalize ${sizeClasses} ${bg} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse`} />
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span className="capitalize">{label}</span>
    </span>
  );
}
