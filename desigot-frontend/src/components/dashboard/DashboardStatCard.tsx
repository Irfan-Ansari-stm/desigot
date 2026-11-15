"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  prevValue?: string | number;
  change?: number; // percentage change
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
  iconBgColor?: string;
  iconTextColor?: string;
  tooltip?: string;
  loading?: boolean;
  prefix?: string;
  suffix?: string;
}

export function DashboardStatCard({
  title,
  value,
  prevValue,
  change,
  trend,
  icon: Icon,
  iconBgColor = "bg-indigo-50 dark:bg-indigo-950/50",
  iconTextColor = "text-indigo-600 dark:text-indigo-400",
  tooltip,
  loading = false,
  prefix = "",
  suffix = "",
}: DashboardStatCardProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded mt-3" />
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
      </div>
    );
  }

  const isPositive = change !== undefined ? change >= 0 : trend === "up";
  const formattedValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>{title}</span>
          {tooltip && (
            <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-600">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105", iconBgColor, iconTextColor)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      <div className="mt-2.5">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
          {prefix}{formattedValue}{suffix}
        </div>

        {change !== undefined && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold",
                isPositive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
              )}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change)}%
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">
              vs previous period
            </span>
          </div>
        )}

        {prevValue !== undefined && change === undefined && (
          <div className="mt-1 text-[11px] text-slate-400">
            Prior: {prefix}{typeof prevValue === "number" ? prevValue.toLocaleString() : prevValue}{suffix}
          </div>
        )}
      </div>
    </div>
  );
}
