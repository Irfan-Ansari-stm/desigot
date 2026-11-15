"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  UserPlus,
  StickyNote,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Layers,
  Calendar,
  DollarSign,
  PackageCheck,
  FileCheck2,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { StaffAssignmentModal } from "./StaffAssignmentModal";
import { InternalNotesModal } from "./InternalNotesModal";

interface Order {
  id: string;
  order_number?: string;
  item_type: "digital" | "service" | string;
  title: string;
  thumbnail_url?: string;
  amount_cents: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  customer?: {
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string;
  };
  seller?: {
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string;
  };
  project?: {
    id: string;
    progress_percentage: number;
    status: string;
  };
  has_deliveries?: boolean;
}

interface Props {
  initialType?: string;
  initialStatus?: string;
  title: string;
  subtitle: string;
}

export function OrderDataTable({
  initialType,
  initialStatus,
  title,
  subtitle,
}: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus || "");
  const [typeFilter, setTypeFilter] = useState(initialType || "");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected order for modals
  const [assignModalOrder, setAssignModalOrder] = useState<Order | null>(null);
  const [noteModalOrder, setNoteModalOrder] = useState<Order | null>(null);
  const [actionDropdownId, setActionDropdownId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
        sort_by: sortBy,
        order: sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.item_type = typeFilter;

      const res = await api.get("/admin/orders", { params });
      if (res.data?.success) {
        setOrders(res.data.data.orders || []);
        setTotal(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, typeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleExportCSV = async () => {
    try {
      const res = await api.get("/admin/orders/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `desigot_orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/confirm`);
      fetchOrders();
    } catch (err) {
      console.error("Confirm failed:", err);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>{title}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              {total} Orders
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order ID, title, customer, or seller..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {!initialType && (
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">All Types (Digital & Service)</option>
            <option value="digital">Digital Product</option>
            <option value="service">Custom Service</option>
          </select>
        )}

        {!initialStatus && (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="pending_confirmation">Pending Confirmation</option>
            <option value="active">Active Projects</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="disputed">Disputed</option>
          </select>
        )}

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="created_at">Order Date</option>
          <option value="amount_cents">Order Value</option>
          <option value="status">Lifecycle Status</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm hover:bg-slate-800"
        >
          {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>

        {(search || statusFilter || typeFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter(initialStatus || "");
              setTypeFilter(initialType || "");
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Order / Package</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Designer / Seller</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4">Lifecycle Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-6 bg-slate-800/50 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300">No orders match criteria</p>
                    <p className="text-xs text-slate-500 mt-1">Try refining search parameters or filters</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Title & Order ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-400 font-bold text-xs uppercase">
                          {order.item_type === "digital" ? "DIG" : "SRV"}
                        </div>
                        <div className="max-w-[240px]">
                          <Link
                            href={`/dashboard/orders-bookings/${order.id}`}
                            className="font-semibold text-white hover:text-purple-400 transition-colors truncate block text-sm"
                          >
                            {order.title || `Order #${order.id.slice(0, 8)}`}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-slate-400">
                              #{order.id.slice(0, 8)}
                            </span>
                            {order.project && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 font-medium">
                                {order.project.progress_percentage}% done
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        order.item_type === "digital"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                      }`}>
                        {order.item_type === "digital" ? "Digital Asset" : "Custom Service"}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {order.customer?.display_name?.charAt(0) || "C"}
                        </div>
                        <div className="max-w-[130px]">
                          <div className="font-medium text-slate-200 text-xs truncate">
                            {order.customer?.display_name || "Guest Customer"}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {order.customer?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-900/30 border border-purple-700/50 flex items-center justify-center text-xs font-bold text-purple-300">
                          {order.seller?.display_name?.charAt(0) || "S"}
                        </div>
                        <div className="max-w-[130px]">
                          <div className="font-medium text-slate-200 text-xs truncate">
                            {order.seller?.display_name || "Desigot Pro"}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {order.seller?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white font-mono">
                        ${((order.amount_cents || 0) / 100).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-emerald-400 capitalize">
                        {order.payment_status || "paid"}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/orders-bookings/${order.id}`}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-purple-600 transition-colors"
                          title="Open 16-Tab Order Workspace"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => setAssignModalOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Assign Staff Member"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setNoteModalOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                          title="Add Internal Staff Note"
                        >
                          <StickyNote className="w-4 h-4" />
                        </button>

                        {order.status === "pending_confirmation" && (
                          <button
                            onClick={() => handleConfirmOrder(order.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-colors"
                            title="Confirm & Activate Order"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3.5 border-t border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-semibold text-white">
              {total === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>
            <span>to</span>
            <span className="font-semibold text-white">
              {Math.min(page * pageSize, total)}
            </span>
            <span>of</span>
            <span className="font-semibold text-white">{total}</span>
            <span>orders</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Staff Assignment Modal */}
      {assignModalOrder && (
        <StaffAssignmentModal
          isOpen={!!assignModalOrder}
          orderId={assignModalOrder.id}
          orderNumber={assignModalOrder.order_number}
          onClose={() => setAssignModalOrder(null)}
          onSuccess={() => fetchOrders()}
        />
      )}

      {/* Internal Staff Notes Modal */}
      {noteModalOrder && (
        <InternalNotesModal
          isOpen={!!noteModalOrder}
          orderId={noteModalOrder.id}
          orderNumber={noteModalOrder.order_number}
          onClose={() => setNoteModalOrder(null)}
          onSuccess={() => fetchOrders()}
        />
      )}
    </div>
  );
}
