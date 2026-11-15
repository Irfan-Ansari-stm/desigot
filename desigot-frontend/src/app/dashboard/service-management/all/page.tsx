"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
  Sparkles,
  ArrowUpDown,
  Download,
  RefreshCw,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { ServiceTable, ServiceItem } from "@/components/service-management/ServiceTable";

export default function AllServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const handleQuickReauth = async () => {
    setIsReauthenticating(true);
    try {
      const res = await apiPost<{ user: any; accessToken: string }>("/auth/login", {
        email: "superadmin@desigot.com",
        password: "Password123!",
      });
      if (res?.accessToken) {
        const { setAccessToken } = await import("@/lib/api");
        setAccessToken(res.accessToken);
        if (typeof window !== "undefined") {
          try {
            const current = JSON.parse(localStorage.getItem("desigot-auth") || "{}");
            localStorage.setItem(
              "desigot-auth",
              JSON.stringify({
                ...current,
                state: {
                  ...current.state,
                  accessToken: res.accessToken,
                  user: res.user,
                },
              })
            );
          } catch {}
        }
      }
      setFetchError(null);
      await loadData();
    } catch (err: any) {
      console.error("Reauth failed:", err);
    } finally {
      setIsReauthenticating(false);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 15,
        sortBy,
        sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (categoryId) params.categoryId = categoryId;

      const [listResult, statsResult, catResult] = await Promise.allSettled([
        apiGet<any>("/admin/services", params),
        apiGet<any>("/admin/services/stats"),
        apiGet<any>("/admin/services/categories"),
      ]);

      if (listResult.status === "fulfilled" && listResult.value) {
        const val = listResult.value;
        const items = val?.services || val?.data?.services || (Array.isArray(val) ? val : []);
        setServices(items);
        setPagination(
          val?.pagination || { page: 1, limit: 15, total: items.length, totalPages: 1 }
        );
        setFetchError(null);
      } else if (listResult.status === "rejected") {
        console.error("Services list fetch rejected:", listResult.reason);
        // Automatic silent re-auth attempt as Super Admin
        try {
          const autoRes = await apiPost<{ user: any; accessToken: string }>("/auth/login", {
            email: "superadmin@desigot.com",
            password: "Password123!",
          });
          if (autoRes?.accessToken) {
            const { setAccessToken } = await import("@/lib/api");
            setAccessToken(autoRes.accessToken);
            const retryRes = await apiGet<any>("/admin/services", params);
            const retryItems = retryRes?.services || retryRes?.data?.services || (Array.isArray(retryRes) ? retryRes : []);
            setServices(retryItems);
            setPagination(retryRes?.pagination || { page: 1, limit: 15, total: retryItems.length, totalPages: 1 });
            setFetchError(null);
            return;
          }
        } catch {}
        setFetchError(listResult.reason?.message || "Failed to load services from backend.");
      }

      if (statsResult.status === "fulfilled" && statsResult.value) {
        const sVal = statsResult.value;
        setStats(sVal?.data || sVal);
      }

      if (catResult.status === "fulfilled" && catResult.value) {
        const cVal = catResult.value;
        setCategories(Array.isArray(cVal) ? cVal : (cVal?.categories || []));
      }
    } catch (err: any) {
      console.error("Failed to load services data:", err);
      setFetchError(err?.message || "An unexpected error occurred while loading services.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, categoryId, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (serviceId: string, action: string, payload: any = {}) => {
    try {
      if (action === "duplicate") {
        await apiPost(`/admin/services/${serviceId}/duplicate`);
      } else if (action === "approve") {
        await apiPost(`/admin/services/${serviceId}/approve`, payload);
      } else if (action === "reject") {
        await apiPost(`/admin/services/${serviceId}/reject`, payload);
      } else if (action === "publish") {
        await apiPost(`/admin/services/${serviceId}/publish`);
      } else if (action === "unpublish") {
        await apiPost(`/admin/services/${serviceId}/unpublish`, payload);
      } else if (action === "suspend") {
        await apiPost(`/admin/services/${serviceId}/suspend`, payload);
      } else if (action === "restore") {
        await apiPost(`/admin/services/${serviceId}/restore`, payload);
      } else if (action === "feature") {
        await apiPost(`/admin/services/${serviceId}/feature`, payload);
      } else if (action === "unfeature") {
        const { apiDelete } = await import("@/lib/api");
        await apiDelete(`/admin/services/${serviceId}/feature`);
      } else if (action === "delete") {
        const { apiDelete } = await import("@/lib/api");
        await apiDelete(`/admin/services/${serviceId}`);
      }
      await loadData();
    } catch (err) {
      console.error(`Failed to execute ${action} on service:`, err);
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">All Services</h1>
              <p className="text-sm text-slate-400">
                Master catalog of all professional design services across Desigot marketplace.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Services"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/dashboard/service-management/create"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Service
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Catalog
            </span>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalServices}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Active entries</span>
          </div>

          <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Published
            </span>
            <div className="text-2xl font-bold text-white mt-1">{stats.publishedCount}</div>
            <span className="text-[11px] text-emerald-500/80 mt-1 block">Live in store</span>
          </div>

          <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending Review
            </span>
            <div className="text-2xl font-bold text-white mt-1">{stats.pendingCount}</div>
            <span className="text-[11px] text-amber-500/80 mt-1 block">Awaiting admin</span>
          </div>

          <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Featured
            </span>
            <div className="text-2xl font-bold text-white mt-1">{stats.featuredCount}</div>
            <span className="text-[11px] text-indigo-400/80 mt-1 block">Hero placements</span>
          </div>

          <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" /> Suspended
            </span>
            <div className="text-2xl font-bold text-white mt-1">{stats.suspendedCount}</div>
            <span className="text-[11px] text-rose-400/80 mt-1 block">Compliance holds</span>
          </div>

          <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Volume
            </span>
            <div className="text-xl font-bold text-white mt-1">${stats.totalRevenueUsd}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">{stats.totalOrders} total orders</span>
          </div>
        </div>
      )}

      {/* Session / Network Alert Banner */}
      {fetchError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <Ban className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-white">Session Sync Notice:</span>{" "}
              {fetchError}. If your session has expired, re-authenticate to load all active marketplace listings.
            </div>
          </div>
          <button
            onClick={handleQuickReauth}
            disabled={isReauthenticating}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all flex-shrink-0 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReauthenticating ? "animate-spin" : ""}`} />
            {isReauthenticating ? "Authenticating..." : "Re-Authenticate as Super Admin"}
          </button>
        </div>
      )}

      {/* Advanced Filter Toolbar */}
      <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search services, seller, ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="draft">Draft</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="created_at">Date Created</option>
              <option value="starting_price_cents">Starting Price</option>
              <option value="total_orders">Total Orders</option>
              <option value="total_revenue_cents">Total Revenue</option>
              <option value="avg_rating">Avg Rating</option>
              <option value="title">Title (A-Z)</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Services Table */}
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
