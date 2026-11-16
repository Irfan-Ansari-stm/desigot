"use client";
import React, { useState } from "react";
import {
  Calendar,
  Filter,
  RefreshCw,
  Download,
  ChevronDown,
  Clock,
  ArrowRightLeft,
  Check
} from "lucide-react";

export const PERIOD_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "This Year", value: "this_year" },
  { label: "Custom Range", value: "custom" },
];

export interface AnalyticsFilterState {
  period: string;
  startDate?: string;
  endDate?: string;
  comparePrevious: boolean;
  orderStatus: string;
  sellerId?: string;
  categoryId?: string;
}

interface AnalyticsTopFilterBarProps {
  filters: AnalyticsFilterState;
  onChange: (newFilters: AnalyticsFilterState) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenExport?: () => void;
}

export function AnalyticsTopFilterBar({
  filters,
  onChange,
  onRefresh,
  isRefreshing = false,
  onOpenExport,
}: AnalyticsTopFilterBarProps) {
  const [showCustomDates, setShowCustomDates] = useState(filters.period === "custom");

  const handlePeriodChange = (p: string) => {
    if (p === "custom") {
      setShowCustomDates(true);
      onChange({ ...filters, period: "custom" });
    } else {
      setShowCustomDates(false);
      onChange({ ...filters, period: p, startDate: undefined, endDate: undefined });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
      {/* Top row: Presets & Primary Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
          {PERIOD_PRESETS.map((p) => {
            const isActive = filters.period === p.value;
            return (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs font-semibold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action buttons: Refresh, Compare, Export */}
        <div className="flex items-center gap-2">
          {/* Compare Previous Period Toggle */}
          <button
            onClick={() => onChange({ ...filters, comparePrevious: !filters.comparePrevious })}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              filters.comparePrevious
                ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
            title="Toggle previous period comparison"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Compare Previous</span>
            {filters.comparePrevious && <Check className="h-3 w-3 ml-0.5" />}
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            title="Reload real-time database records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {/* Export Report Modal Trigger */}
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Row: Custom dates & Dimension filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Date Range pickers */}
          {showCustomDates && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="h-4 w-4 text-slate-400 ml-1" />
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200"
              />
            </div>
          )}

          {/* Order Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={filters.orderStatus}
              onChange={(e) => onChange({ ...filters, orderStatus: e.target.value })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="complete">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Clock className="h-3 w-3" />
          <span>Calculated from live PostgreSQL database records (USD)</span>
        </div>
      </div>
    </div>
  );
}
