import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "solid" | "outlined" | "ghost";
  color?: "default" | "success" | "warning" | "error" | "info" | "brand" | "accent3";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

const colorMap = {
  default: { solid: "bg-surface-100 text-ink-secondary border-transparent", outlined: "border-border text-ink-secondary", ghost: "bg-surface-50 text-ink-secondary" },
  success: { solid: "bg-green-100 text-success border-transparent", outlined: "border-green-300 text-success", ghost: "bg-green-50 text-success" },
  warning: { solid: "bg-orange-100 text-warning border-transparent", outlined: "border-orange-300 text-warning", ghost: "bg-orange-50 text-warning" },
  error:   { solid: "bg-red-100 text-danger border-transparent", outlined: "border-red-300 text-danger", ghost: "bg-red-50 text-danger" },
  info:    { solid: "bg-blue-100 text-info border-transparent", outlined: "border-blue-300 text-info", ghost: "bg-blue-50 text-info" },
  brand:   { solid: "bg-brand text-white border-transparent", outlined: "border-brand/40 text-brand", ghost: "bg-brand/10 text-brand" },
  accent3: { solid: "bg-accent3 text-white border-transparent", outlined: "border-accent3/40 text-accent3", ghost: "bg-accent3/10 text-accent3" },
};

const dotColorMap: Record<string, string> = {
  default: "bg-ink-secondary", success: "bg-success", warning: "bg-warning",
  error: "bg-danger", info: "bg-info", brand: "bg-brand", accent3: "bg-accent3",
};

export function Badge({ children, variant = "solid", color = "default", size = "sm", className, dot }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 border font-medium rounded-full",
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
      colorMap[color]?.[variant] || colorMap.default.solid,
      className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotColorMap[color])} />}
      {children}
    </span>
  );
}

// Status-aware badge
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: BadgeProps["color"] }> = {
    active:          { label: "Active",          color: "success" },
    approved:        { label: "Approved",        color: "success" },
    complete:        { label: "Complete",        color: "success" },
    paid:            { label: "Paid",            color: "success" },
    pending:         { label: "Pending",         color: "warning" },
    pending_review:  { label: "In Review",       color: "warning" },
    in_progress:     { label: "In Progress",     color: "info" },
    submitted:       { label: "Submitted",       color: "info" },
    in_revision:     { label: "In Revision",     color: "warning" },
    draft:           { label: "Draft",           color: "default" },
    paused:          { label: "Paused",          color: "default" },
    cancelled:       { label: "Cancelled",       color: "default" },
    archived:        { label: "Archived",        color: "default" },
    rejected:        { label: "Rejected",        color: "error" },
    disputed:        { label: "Disputed",        color: "error" },
    suspended:       { label: "Suspended",       color: "error" },
    banned:          { label: "Banned",          color: "error" },
    refunded:        { label: "Refunded",        color: "info" },
    open:            { label: "Open",            color: "warning" },
    under_review:    { label: "Under Review",    color: "info" },
    resolved:        { label: "Resolved",        color: "success" },
    not_started:     { label: "Not Started",     color: "default" },
  };
  const cfg = map[status] || { label: status, color: "default" as const };
  return <Badge color={cfg.color} dot>{cfg.label}</Badge>;
}
