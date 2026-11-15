"use client";

import React, { useState, useEffect, useCallback } from "react";
import { XCircle, RefreshCw } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { ServiceTable, ServiceItem } from "@/components/service-management/ServiceTable";

export default function RejectedServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/services", {
        status: "rejected",
        page,
        limit: 15,
      });
      const items = res?.services || res?.data?.services || (Array.isArray(res) ? res : []);
      setServices(items);
      setPagination(res?.pagination || { page: 1, limit: 15, total: items.length, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load rejected services:", err);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Rejected Services</h1>
            <p className="text-sm text-slate-400">
              Services that failed editorial guidelines, copyright verification, or quality checks.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

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
