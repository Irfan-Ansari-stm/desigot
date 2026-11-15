import React from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle, Ban, Archive, Sparkles } from "lucide-react";

export type ServiceStatus =
  | "draft"
  | "pending_approval"
  | "changes_requested"
  | "approved"
  | "published"
  | "rejected"
  | "suspended"
  | "archived";

interface Props {
  status: ServiceStatus | string;
  isFeatured?: boolean;
  className?: string;
}

export function ServiceStatusBadge({ status, isFeatured = false, className = "" }: Props) {
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
      case "pending_approval":
        return {
          label: "Pending Approval",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: Clock,
        };
      case "changes_requested":
        return {
          label: "Changes Requested",
          bg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          icon: AlertCircle,
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
          bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
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

  const { label, bg, icon: Icon } = getBadgeConfig();

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      {isFeatured && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Featured
        </span>
      )}
    </div>
  );
}
