"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCcw, Search, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";
import { TransactionStatusBadge } from "@/components/payments-finance/TransactionStatusBadge";

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRefunds = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (status !== "all") params.status = status;
      const res = await apiGet<any>("/admin/finance/refunds", params);
      if (res) {
        setRefunds(res.refunds || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load refunds:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const handleProcessRefund = async (id: string) => {
    try {
      setProcessingId(id);
      await apiPost(`/admin/finance/refunds/${id}/process`);
      loadRefunds();
    } catch (err) {
      console.error("Refund processing failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatCents = (cents: number) => {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6 pb-16">
      <FinanceStatsCards />

      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-purple-400" />
              Customer & Order Refund Management
            </h2>
            <p className="text-xs text-slate-400">
              Review refund requests, cancellation disputes, partial goodwill refunds, and gateway reversals
            </p>
          </div>

          <button
            onClick={loadRefunds}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by refund reference, customer, or seller..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 capitalize"
            >
              <option value="all">All Refund Statuses</option>
              <option value="requested">Requested</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="succeeded">Settled / Succeeded</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a] shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Refund Ref</th>
              <th className="py-3.5 px-4 font-semibold">Txn Reference</th>
              <th className="py-3.5 px-4 font-semibold">Customer</th>
              <th className="py-3.5 px-4 font-semibold">Refund Type</th>
              <th className="py-3.5 px-4 font-semibold text-right">Original Gross</th>
              <th className="py-3.5 px-4 font-semibold text-right">Refund Amount</th>
              <th className="py-3.5 px-4 font-semibold text-center">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {loading && refunds.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                  Loading refund requests...
                </td>
              </tr>
            ) : refunds.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                  No refund requests matching the criteria.
                </td>
              </tr>
            ) : (
              refunds.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">{r.refund_reference}</td>
                  <td className="py-3.5 px-4 text-purple-300 font-bold">{r.transaction_reference || "Direct"}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-300 max-w-xs truncate">{r.customer_name}</td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize">
                      {r.refund_type?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400">{formatCents(r.original_amount_cents)}</td>
                  <td className="py-3.5 px-4 text-right text-rose-400 font-bold">{formatCents(r.refund_amount_cents)}</td>
                  <td className="py-3.5 px-4 text-center font-sans">
                    <TransactionStatusBadge status={r.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    {r.status === "requested" || r.status === "approved" ? (
                      <button
                        onClick={() => handleProcessRefund(r.id)}
                        disabled={processingId === r.id}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                      >
                        {processingId === r.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                        Process Gateway Refund
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Completed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {pagination.total_pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {(page - 1) * pagination.limit + 1} to{" "}
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} refunds
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white px-2">
                Page {page} of {pagination.total_pages}
              </span>
              <button
                disabled={page >= pagination.total_pages}
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
