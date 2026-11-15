"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Calendar,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { CustomerTable, CustomerItem } from "@/components/customer-management/CustomerTable";

export default function AllCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 15,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (customerType) params.customer_type = customerType;

      const [listRes, statsRes] = await Promise.allSettled([
        apiGet<any>("/admin/customers", params),
        apiGet<any>("/admin/customers/stats"),
      ]);

      if (listRes.status === "fulfilled" && listRes.value) {
        const val = listRes.value;
        const items = val?.customers || val?.data?.customers || (Array.isArray(val) ? val : []);
        setCustomers(items);
        setPagination(
          val?.pagination || {
            page,
            limit: 15,
            total: items.length,
            totalPages: Math.ceil(items.length / 15) || 1,
          }
        );
      }

      if (statsRes.status === "fulfilled" && statsRes.value) {
        const val = statsRes.value;
        setStats(val?.data || val);
      }
    } catch (err) {
      console.error("Failed to load customer management data", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortOrder, search, status, customerType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((c) => c.id));
    }
  };

  const handleExportCsv = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
    window.open(`${apiBase}/admin/customers/export`, "_blank");
  };

  const formatCurrency = (cents?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format((cents || 0) / 100);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold tracking-wider uppercase mb-1">
            <span>Customer Management</span>
            <span>•</span>
            <span className="text-slate-400">Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-purple-400" />
            All Customers
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Master directory of all registered buyer accounts, lifetime spend, orders, and activity.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export CSV
          </button>
          <button
            onClick={() => loadData()}
            className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0B1120]/80 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.totalCustomers || stats?.total_customers || 0}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">
              {stats?.activeCustomers || stats?.active_customers || 0} active
            </span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">
              {stats?.newCustomers || stats?.new_customers || 0} new (14d)
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B1120]/80 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Lifetime Spend
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatCurrency(stats?.totalSpendingCents || stats?.total_spending_cents)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span>Avg LTV:</span>
            <span className="text-white font-semibold">
              {formatCurrency(stats?.avgLTVCents || stats?.avg_ltv_cents)}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B1120]/80 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Orders & Bookings
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.totalOrders || stats?.total_orders || 0}
            <span className="text-sm font-normal text-slate-400 ml-2">
              / {stats?.totalBookings || stats?.total_bookings || 0} bookings
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-300 font-medium">Design services & products</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B1120]/80 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Open Support Tickets
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {stats?.openComplaints || stats?.open_complaints || 0}
            <span className="text-sm font-normal text-slate-400 ml-2">
              / {stats?.totalComplaints || stats?.total_complaints || 0} total
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-slate-300 font-medium">
              Retention: {stats?.retentionRate || 85}%
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#0B1120]/70 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, phone, or company..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="new">New (14d)</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={customerType}
            onChange={(e) => {
              setCustomerType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
          >
            <option value="">All Customer Types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="vip">VIP</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
          >
            <option value="created_at">Date Registered</option>
            <option value="display_name">Name</option>
            <option value="lifetime_spending_cents">Highest Spend</option>
            <option value="total_orders_count">Most Orders</option>
            <option value="last_login_at">Last Activity</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")}
            className="p-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        onRefresh={loadData}
        selectedIds={selectedIds}
        onSelectToggle={handleSelectToggle}
        onSelectAll={handleSelectAll}
      />

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
            customers
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-slate-300 hover:text-white transition"
            >
              Previous
            </button>
            <span className="font-semibold text-white px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-slate-300 hover:text-white transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
