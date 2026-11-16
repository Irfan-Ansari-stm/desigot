"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api";
import { AnalyticsTopFilterBar, AnalyticsFilterState } from "./AnalyticsTopFilterBar";
import { KpiCardsGrid } from "./KpiCardsGrid";
import { InteractiveChartsSection } from "./InteractiveChartsSection";
import { ExportModal } from "@/components/dashboard/ExportModal";

export function AnalyticsOverviewTab({ onSelectView }: { onSelectView?: (view: string) => void }) {
  const [filters, setFilters] = useState<AnalyticsFilterState>({
    period: "30d",
    comparePrevious: true,
    orderStatus: "all",
  });

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams: any = {
        period: filters.period,
        orderStatus: filters.orderStatus !== "all" ? filters.orderStatus : undefined,
      };
      if (filters.period === "custom" && filters.startDate && filters.endDate) {
        queryParams.startDate = filters.startDate;
        queryParams.endDate = filters.endDate;
      }
      const res = await apiGet<any>("/admin/analytics/overview", queryParams);
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics overview:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <div className="space-y-6">
      {/* 1. TOP FILTER BAR */}
      <AnalyticsTopFilterBar
        filters={filters}
        onChange={setFilters}
        onRefresh={fetchOverview}
        isRefreshing={loading}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* 2. 12 TOP KPI CARDS */}
      <KpiCardsGrid kpis={data?.kpis} loading={loading} />

      {/* 3. 10 INTERACTIVE CHARTS */}
      <InteractiveChartsSection charts={data?.charts} loading={loading} />

      {/* Legacy Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        reportType="revenue"
        currentPeriod={filters.period}
      />
    </div>
  );
}
