import React from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle, Ban, Archive, Sparkles } from "lucide-react";

export type DigitalProductStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "published"
  | "rejected"
  | "suspended"
  | "archived";

interface Props {
  status: DigitalProductStatus | string;
  isFeatured?: boolean;
  className?: string;
}

export function DigitalProductStatusBadge({ status, isFeatured = false, className = "" }: Props) {
  const getBadgeConfig = () => {
    switch (status) {
      case "published":
        return {
          label: "Published",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: CheckCircle2,
        };
      case "approved":
        return {
          label: "Approved",
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          icon: CheckCircle2,
        };
      case "pending_review":
        return {
          label: "Pending Review",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: Clock,
        };
      case "draft":
        return {
          label: "Draft",
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          icon: Clock,
        };
      case "rejected":
        return {
          label: "Rejected",
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: XCircle,
        };
      case "suspended":
        return {
          label: "Suspended",
          bg: "bg-red-500/10 text-red-400 border-red-500/20",
          icon: Ban,
        };
      case "archived":
        return {
          label: "Archived",
          bg: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
          icon: Archive,
        };
      default:
        return {
          label: status,
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          icon: Clock,
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${className}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
      {isFeatured && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Sparkles className="w-2.5 h-2.5" />
          Featured
        </span>
      )}
    </div>
  );
}
