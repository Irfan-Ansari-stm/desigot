"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DollarSign, Search, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react";
import { apiGet } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";
import { TransactionStatusBadge } from "@/components/payments-finance/TransactionStatusBadge";
import { PayoutApprovalModal } from "@/components/payments-finance/PayoutApprovalModal";

export default function PayoutRequestsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);

  const loadPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (status !== "all") params.status = status;
      const res = await apiGet<any>("/admin/finance/payout-requests", params);
      if (res) {
        setPayouts(res.payouts || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load payout requests:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

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
              <DollarSign className="w-5 h-5 text-purple-400" />
              Seller Payout Requests Queue
            </h2>
            <p className="text-xs text-slate-400">
              Review seller withdrawal requests, verify KYC and available balances, approve or reject disbursements
            </p>
          </div>

          <button
            onClick={loadPayouts}
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
              placeholder="Search by payout reference or seller..."
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
              <option value="all">All Request Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="paid">Settled / Paid</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed Rail</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a] shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Payout Ref</th>
              <th className="py-3.5 px-4 font-semibold">Seller</th>
              <th className="py-3.5 px-4 font-semibold">Destination Rail</th>
              <th className="py-3.5 px-4 font-semibold text-right">Requested</th>
              <th className="py-3.5 px-4 font-semibold text-right">Express Fee</th>
              <th className="py-3.5 px-4 font-semibold text-right">Net Payout</th>
              <th className="py-3.5 px-4 font-semibold text-center">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Requested Date</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {loading && payouts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                  Loading payout requests...
                </td>
              </tr>
            ) : payouts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                  No payout requests matching the criteria.
                </td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">{p.payout_reference}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-300 max-w-xs truncate">{p.seller_name}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-400 capitalize">
                    {p.payout_method_type?.replace(/_/g, " ")}
                  </td>
                  <td className="py-3.5 px-4 text-right text-white font-bold">{formatCents(p.requested_amount_cents)}</td>
                  <td className="py-3.5 px-4 text-right text-rose-400">
                    {p.fee_cents > 0 ? `-${formatCents(p.fee_cents)}` : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                    {formatCents(p.net_payout_cents || p.requested_amount_cents)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-sans">
                    <TransactionStatusBadge status={p.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                    {p.requested_at ? new Date(p.requested_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    {p.status === "pending" || p.status === "under_review" ? (
                      <button
                        onClick={() => setSelectedPayout(p)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold transition-all"
                      >
                        Review
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Handled</span>
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
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} requests
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

      <PayoutApprovalModal
        isOpen={!!selectedPayout}
        payout={selectedPayout}
        onClose={() => setSelectedPayout(null)}
        onSuccess={() => {
          setSelectedPayout(null);
          loadPayouts();
        }}
      />
    </div>
  );
}
