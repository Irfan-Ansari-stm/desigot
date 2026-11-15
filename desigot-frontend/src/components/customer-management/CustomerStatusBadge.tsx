import React from "react";
import { CheckCircle2, Clock, AlertCircle, Ban, Sparkles, UserX, UserCheck, ShieldAlert } from "lucide-react";

export type CustomerLifecycleStatus = "active" | "inactive" | "new" | "suspended" | string;

interface Props {
  status: CustomerLifecycleStatus;
  accountStatus?: string;
  vip?: boolean;
  className?: string;
}

export function CustomerStatusBadge({ status, accountStatus, vip = false, className = "" }: Props) {
  const getBadgeConfig = () => {
    if (accountStatus === "suspended" || status === "suspended") {
      return {
        label: "Suspended",
        bg: "bg-red-500/10 text-red-400 border-red-500/20",
        dot: "bg-red-400",
        icon: Ban,
      };
    }

    switch (status) {
      case "active":
        return {
          label: "Active",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          dot: "bg-emerald-400",
          icon: UserCheck,
        };
      case "inactive":
        return {
          label: "Inactive",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          dot: "bg-amber-400",
          icon: Clock,
        };
      case "new":
        return {
          label: "New",
          bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          dot: "bg-indigo-400",
          icon: Sparkles,
        };
      case "locked":
        return {
          label: "Locked",
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          dot: "bg-purple-400",
          icon: ShieldAlert,
        };
      default:
        return {
          label: status || "Standard",
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          dot: "bg-slate-400",
          icon: CheckCircle2,
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <Icon className="w-3 h-3" />
        <span className="capitalize">{config.label}</span>
      </span>

      {vip && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Sparkles className="w-3 h-3 text-amber-400" />
          VIP
        </span>
      )}
    </div>
  );
}
