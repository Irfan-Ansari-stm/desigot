"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, RefreshCw, Sparkles, Filter, Search } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { ServiceTable, ServiceItem } from "@/components/service-management/ServiceTable";

export default function PublishedServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        status: "published",
        page,
        limit: 15,
      };
      if (search.trim()) params.search = search.trim();

      const res = await apiGet<any>("/admin/services", params);
      const items = res?.services || res?.data?.services || (Array.isArray(res) ? res : []);
      setServices(items);
      setPagination(res?.pagination || { page: 1, limit: 15, total: items.length, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load published services:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (serviceId: string, action: string, payload: any = {}) => {
    try {
      if (action === "unpublish") {
        await apiPost(`/admin/services/${serviceId}/unpublish`, payload);
      } else if (action === "feature") {
        await apiPost(`/admin/services/${serviceId}/feature`, payload);
      } else if (action === "unfeature") {
        const { apiDelete } = await import("@/lib/api");
        await apiDelete(`/admin/services/${serviceId}/feature`);
      } else if (action === "suspend") {
        await apiPost(`/admin/services/${serviceId}/suspend`, payload);
      } else if (action === "duplicate") {
        await apiPost(`/admin/services/${serviceId}/duplicate`);
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
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Published Services</h1>
            <p className="text-sm text-slate-400">
              Live marketplace services available for immediate client discovery and order checkout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Filter published services..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-white font-bold">{services.length}</span> live services
        </div>
      </div>

      {/* Table */}
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
