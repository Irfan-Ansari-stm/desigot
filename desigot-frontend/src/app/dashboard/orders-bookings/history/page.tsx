"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  History,
  Search,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";

interface HistoryItem {
  id: string;
  order_id: string;
  previous_status?: string;
  new_status?: string;
  action: string;
  reason?: string;
  metadata?: any;
  created_at: string;
  performed_by?: {
    display_name: string;
    email: string;
  };
  order_title?: string;
}

export default function OrderHistoryAuditPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/admin/orders/history", { params });
      if (res.data?.success) {
        setHistory(res.data.data.history || []);
        setTotal(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to load order history:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Append-Only Order History Audit Trail</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              {total} Logged Events
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable blockchain-grade audit record of every state transition, escrow modification, milestone approval, and staff action
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="p-2.5 self-start md:self-auto rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search audit trail by order ID, action slug, actor name, or reason..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Order ID & Context</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">State Transition</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Audit Rationale</th>
                <th className="py-3.5 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-6 bg-slate-800/50 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-200">No audit events found</p>
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <Link
                        href={`/dashboard/orders-bookings/${item.order_id}`}
                        className="font-mono text-xs text-purple-400 hover:underline block"
                      >
                        #{item.order_id.slice(0, 8)}
                      </Link>
                      <span className="text-[11px] text-slate-400 truncate max-w-[180px] block">
                        {item.order_title || "Design Package"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-indigo-300 border border-slate-700">
                        {item.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {item.previous_status || item.new_status ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-slate-500">{item.previous_status || "init"}</span>
                          <span className="text-purple-400">→</span>
                          <span className="text-emerald-400 font-semibold">{item.new_status || "same"}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Non-state event</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-200">
                        {item.performed_by?.display_name || "System Automated"}
                      </div>
                      <div className="text-[10px] text-slate-500">{item.performed_by?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-300 max-w-[260px] truncate">
                      {item.reason || "Automatic state machine progression"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/orders-bookings/${item.order_id}`}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-purple-600 transition-colors inline-block"
                        title="Open Order Workspace"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3.5 border-t border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{total === 0 ? 0 : (page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-white">{Math.min(page * pageSize, total)}</span> of{" "}
            <span className="font-semibold text-white">{total}</span> events
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
