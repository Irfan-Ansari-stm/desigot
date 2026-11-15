"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UserX,
  Search,
  RefreshCw,
  Clock,
  Ban,
  ArrowUpDown,
  Mail,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { CustomerTable, CustomerItem } from "@/components/customer-management/CustomerTable";

export default function InactiveCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("inactive"); // 'inactive' or 'suspended'
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
        status: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search.trim()) params.search = search.trim();

      const res = await apiGet<any>("/admin/customers", params);
      const items = res?.customers || res?.data?.customers || (Array.isArray(res) ? res : []);
      setCustomers(items);
      setPagination(
        res?.pagination || {
          page,
          limit: 15,
          total: items.length,
          totalPages: Math.ceil(items.length / 15) || 1,
        }
      );
    } catch (err) {
      console.error("Failed to load inactive customers", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortOrder, search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
            <span>Customer Management</span>
            <span>•</span>
            <span className="text-slate-400">Churn & Inactivity</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <UserX className="w-7 h-7 text-amber-400" />
            Inactive & Suspended Customers
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Accounts with no activity for more than 30 days or administratively suspended for policy violations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

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
              placeholder="Search by name, email, or company..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
            <button
              onClick={() => {
                setStatusFilter("inactive");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === "inactive"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Dormant (&gt;30d)
            </button>
            <button
              onClick={() => {
                setStatusFilter("suspended");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === "suspended"
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Suspended
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="created_at">Date Registered</option>
            <option value="last_login_at">Longest Inactive</option>
            <option value="lifetime_spending_cents">Highest Historical Spend</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")}
            className="p-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        onRefresh={loadData}
        selectedIds={selectedIds}
        onSelectToggle={(id) =>
          setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
          )
        }
      />

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
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-slate-300 transition"
            >
              Previous
            </button>
            <span className="font-semibold text-white px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-slate-300 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
