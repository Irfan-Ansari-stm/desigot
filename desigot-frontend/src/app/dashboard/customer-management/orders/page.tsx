"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  DollarSign,
  User,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { apiGet } from "@/lib/api";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const res = await apiGet<any>("/admin/customers/orders", params);
      const items = res?.orders || res?.data?.orders || (Array.isArray(res) ? res : []);
      setOrders(items);
      setPagination(
        res?.pagination || {
          page,
          limit: 15,
          total: items.length,
          totalPages: Math.ceil(items.length / 15) || 1,
        }
      );
    } catch (err) {
      console.error("Failed to load customer orders", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const formatCurrency = (cents?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format((cents || 0) / 100);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold tracking-wider uppercase mb-1">
            <span>Customer Management</span>
            <span>•</span>
            <span className="text-slate-400">Order History</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-purple-400" />
            Customer Orders
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Consolidated directory of all marketplace digital product and design service transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadOrders()}
            className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
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
              placeholder="Search by order number or customer name..."
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
            <option value="complete">Complete</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="disputed">Disputed</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="w-full bg-[#0B1120]/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-4 px-4">Order #</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Seller</th>
                <th className="py-4 px-4">Total Amount</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Placed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No customer orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-4 font-mono font-medium text-purple-400">
                      {o.order_number}
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/dashboard/customer-management/${o.buyer_id}`}
                        className="font-medium text-white hover:text-purple-400 transition"
                      >
                        {o.customer_name || "Customer"}
                      </Link>
                      <span className="block text-[11px] text-slate-500">{o.customer_email}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{o.seller_name || "Platform Seller"}</td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-emerald-400 text-sm">
                        {formatCurrency(o.total_cents)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          o.status === "complete"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : o.status === "refunded"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{formatDate(o.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
            orders
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
