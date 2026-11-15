"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { ServiceTable, ServiceItem } from "@/components/service-management/ServiceTable";

export default function PendingApprovalPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/services", {
        status: "pending_approval",
        page,
        limit: 15,
      });
      const items = res?.services || res?.data?.services || (Array.isArray(res) ? res : []);
      setServices(items);
      setPagination(res?.pagination || { page: 1, limit: 15, total: items.length, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load pending services:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (serviceId: string, action: string, payload: any = {}) => {
    try {
      if (action === "approve") {
        await apiPost(`/admin/services/${serviceId}/approve`, payload);
      } else if (action === "reject") {
        await apiPost(`/admin/services/${serviceId}/reject`, payload);
      } else if (action === "suspend") {
        await apiPost(`/admin/services/${serviceId}/suspend`, payload);
      } else if (action === "delete") {
        const { apiDelete } = await import("@/lib/api");
        await apiDelete(`/admin/services/${serviceId}`);
      }
      await loadData();
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    }
  };

  const handleBulkAction = async (serviceIds: string[], action: string, payload: any = {}) => {
    try {
      await apiPost("/admin/services/bulk-action", {
        serviceIds,
        action,
        options: payload,
      });
      await loadData();
    } catch (err) {
      console.error("Bulk action failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Pending Approval Queue</h1>
            <p className="text-sm text-slate-400">
              Services submitted by sellers awaiting administrative compliance and quality approval.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Moderation Warning / Guideline Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-300/90 leading-relaxed">
          <span className="font-bold">Moderation Policy:</span> Confirm all copyright clearances, asset rights, realistic delivery schedules, and clear tier deliverables before approving services to the public marketplace.
        </div>
      </div>

      {/* Pending Services Table */}
      <ServiceTable
        services={services}
        isLoading={isLoading}
        onRefresh={loadData}
        onAction={handleAction}
        onBulkAction={handleBulkAction}
        pagination={pagination}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
}
