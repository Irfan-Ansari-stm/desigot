"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Check,
  ChevronDown,
} from "lucide-react";
import { ExportModal } from "./ExportModal";

export const PERIOD_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Year", value: "this_year" },
];

interface DashboardFilterBarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  exportType?: "revenue" | "sales" | "sellers" | "customers" | "services";
  showOrderTypeFilter?: boolean;
  orderType?: string;
  onOrderTypeChange?: (val: string) => void;
  showStatusFilter?: boolean;
  statusFilter?: string;
  onStatusChange?: (val: string) => void;
  extraControls?: React.ReactNode;
}

export function DashboardFilterBar({
  onRefresh,
  isRefreshing = false,
  exportType,
  showOrderTypeFilter = false,
  orderType = "all",
  onOrderTypeChange,
  showStatusFilter = false,
  statusFilter = "all",
  onStatusChange,
  extraControls,
}: DashboardFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activePeriod = searchParams.get("period") || "30d";
  const [isExportOpen, setIsExportOpen] = useState(false);

  const setPeriod = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Quick Period Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2 shrink-0">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            <span>Range:</span>
          </div>
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = activePeriod === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Right: Secondary Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {showOrderTypeFilter && onOrderTypeChange && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Type:</span>
              <select
                value={orderType}
                onChange={(e) => onOrderTypeChange(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="asset">Digital Products</option>
                <option value="service">Services</option>
              </select>
            </div>
          )}

          {showStatusFilter && onStatusChange && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="complete">Completed</option>
                <option value="pending">Pending</option>
                <option value="active">In Progress</option>
                <option value="refunded">Refunded</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          )}

          {extraControls}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Refresh Analytics Data"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-indigo-500" : ""}`} />
            </button>
          )}

          {exportType && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-indigo-500" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {exportType && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          reportType={exportType}
          currentPeriod={activePeriod}
        />
      )}
    </>
  );
}
