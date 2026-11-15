import React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, RefreshCcw, ShieldAlert } from "lucide-react";

interface Props {
  status: string;
}

export function TransactionStatusBadge({ status }: Props) {
  const norm = (status || "").toLowerCase();

  switch (norm) {
    case "succeeded":
    case "captured":
    case "paid":
    case "matched":
    case "active":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span className="capitalize">{status}</span>
        </span>
      );

    case "pending":
    case "under_review":
    case "initiated":
    case "issued":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Clock className="w-3 h-3" />
          <span className="capitalize">{status.replace(/_/g, " ")}</span>
        </span>
      );

    case "processing":
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
          <RefreshCcw className="w-3 h-3 animate-spin" />
          <span className="capitalize">{status}</span>
        </span>
      );

    case "partially_refunded":
    case "refunded":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <RefreshCcw className="w-3 h-3" />
          <span className="capitalize">{status.replace(/_/g, " ")}</span>
        </span>
      );

    case "failed":
    case "rejected":
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <XCircle className="w-3 h-3" />
          <span className="capitalize">{status}</span>
        </span>
      );

    case "disputed":
    case "exception":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-400">
          <ShieldAlert className="w-3 h-3" />
          <span className="capitalize">{status}</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
          <span className="capitalize">{status}</span>
        </span>
      );
  }
}
