"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  Archive,
  Eye,
  EyeOff,
  Lock,
  Layers,
  Sparkles,
  Briefcase,
  Package,
} from "lucide-react";

interface StatusBadgeProps {
  status?: string;
  type?: string;
  visibility?: string;
  size?: "sm" | "md";
  className?: string;
}

export function CategoryStatusBadge({
  status,
  type,
  visibility,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  // If visibility is passed, render visibility badge
  if (visibility) {
    const v = visibility.toLowerCase();
    const config = {
      public: { label: "Public", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Eye },
      private: { label: "Private", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Lock },
      internal: { label: "Internal", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Lock },
      hidden: { label: "Hidden", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: EyeOff },
    }[v] || { label: visibility, bg: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: Eye };

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${className}`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{config.label}</span>
      </span>
    );
  }

  // If type is passed, render category type badge
  if (type) {
    const t = type.toLowerCase();
    const typeConfig = {
      service: { label: "Service", bg: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: Briefcase },
      product: { label: "Digital Product", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", icon: Package },
      shared: { label: "Shared (Both)", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", icon: Layers },
      general: { label: "General", bg: "bg-slate-500/10 text-slate-300 border-slate-600/30", icon: Sparkles },
    }[t] || { label: type, bg: "bg-slate-500/10 text-slate-300 border-slate-600/30", icon: Layers };

    const Icon = typeConfig.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typeConfig.bg} ${className}`}>
        <Icon className="w-3 h-3" />
        <span>{typeConfig.label}</span>
      </span>
    );
  }

  // Lifecycle status badge
  const s = (status || "").toLowerCase();
  const statusConfig = {
    published: { label: "Published", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400", icon: CheckCircle2 },
    draft: { label: "Draft", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400", icon: Clock },
    inactive: { label: "Inactive", bg: "bg-slate-500/10 text-slate-400 border-slate-600/30", dot: "bg-slate-400", icon: Clock },
    archived: { label: "Archived", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20", dot: "bg-rose-400", icon: Archive },
  }[s] || { label: status || "Unknown", bg: "bg-slate-500/10 text-slate-400 border-slate-600/30", dot: "bg-slate-400", icon: Clock };

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeClasses} ${statusConfig.bg} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} animate-pulse`} />
      <span className="capitalize">{statusConfig.label}</span>
    </span>
  );
}
