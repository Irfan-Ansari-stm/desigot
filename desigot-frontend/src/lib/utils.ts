import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));

export const timeAgo = (date: string | Date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60)    return "just now";
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800)return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
};

export const truncate = (str: string, n: number) =>
  str.length > n ? str.slice(0, n - 1) + "…" : str;

export const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export const getPlanColor = (plan: string) => {
  const map: Record<string, string> = {
    free: "text-ink-secondary bg-surface-100",
    pro:  "text-accent2 bg-blue-50",
    agency: "text-accent3 bg-purple-50",
    enterprise: "text-warning bg-orange-50",
  };
  return map[plan] || map.free;
};

export const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    active:    "text-success bg-green-50",
    approved:  "text-success bg-green-50",
    complete:  "text-success bg-green-50",
    pending:   "text-warning bg-orange-50",
    pending_review: "text-warning bg-orange-50",
    draft:     "text-ink-secondary bg-surface-100",
    paused:    "text-ink-secondary bg-surface-100",
    rejected:  "text-danger bg-red-50",
    suspended: "text-danger bg-red-50",
    banned:    "text-danger bg-red-50",
    disputed:  "text-danger bg-red-50",
    refunded:  "text-info bg-blue-50",
    cancelled: "text-ink-secondary bg-surface-100",
  };
  return map[status] || "text-ink-secondary bg-surface-100";
};

export const buildQueryString = (params: Record<string, unknown>) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
};
