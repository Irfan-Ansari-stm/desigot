"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Search,
  Download,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";
import { TransactionStatusBadge } from "@/components/payments-finance/TransactionStatusBadge";
import { TransactionDetailsModal } from "@/components/payments-finance/TransactionDetailsModal";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (status !== "all") params.status = status;
      if (type !== "all") params.type = type;

      const res = await apiGet<any>("/admin/finance/transactions", params);
      if (res) {
        setTransactions(res.transactions || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, type]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const formatCents = (cents: number) => {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  };

  const handleExportCsv = () => {
    window.open("http://localhost:4000/api/v1/admin/finance/transactions/export", "_blank");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* KPI Stats */}
      <FinanceStatsCards />

      {/* Header & Controls */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              Master Financial Transactions
            </h2>
            <p className="text-xs text-slate-400">
              Live ledger of all order payments, design sprint disbursements, and marketplace transactions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={fetchTransactions}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search reference, customer, or seller..."
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
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Payment Statuses</option>
              <option value="succeeded">Succeeded</option>
              <option value="captured">Captured</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 capitalize"
            >
              <option value="all">All Transaction Types</option>
              <option value="service_payment">Design Services</option>
              <option value="digital_product_payment">Digital UI Products</option>
              <option value="booking_payment">Consultation Bookings</option>
              <option value="refund">Refunds</option>
              <option value="payout">Payouts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a] shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Transaction Ref</th>
              <th className="py-3.5 px-4 font-semibold">Type</th>
              <th className="py-3.5 px-4 font-semibold">Customer</th>
              <th className="py-3.5 px-4 font-semibold">Seller</th>
              <th className="py-3.5 px-4 font-semibold">Gateway Rail</th>
              <th className="py-3.5 px-4 font-semibold text-right">Gross</th>
              <th className="py-3.5 px-4 font-semibold text-right">Commission</th>
              <th className="py-3.5 px-4 font-semibold text-right">Seller Net</th>
              <th className="py-3.5 px-4 font-semibold text-center">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading && transactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                  Loading transactions ledger...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  No financial transactions matching the selected criteria.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    <button
                      onClick={() => setSelectedTxnId(t.id)}
                      className="hover:text-purple-400 transition-colors"
                    >
                      {t.transaction_reference}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize">
                      {t.transaction_type?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-[140px] truncate" title={t.customer_email}>
                    {t.customer_name || "Buyer"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-[140px] truncate" title={t.seller_email}>
                    {t.seller_name || "Seller"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    <span className="capitalize">{t.gateway_name || t.gateway_provider || "Stripe"}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    {formatCents(t.gross_amount_cents)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                    {formatCents(t.commission_amount_cents)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-purple-300 font-semibold">
                    {formatCents(t.seller_net_amount_cents)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <TransactionStatusBadge status={t.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedTxnId(t.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Breakdown
                    </button>
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
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} records
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

      {/* Details Modal */}
      <TransactionDetailsModal
        isOpen={!!selectedTxnId}
        transactionId={selectedTxnId}
        onClose={() => setSelectedTxnId(null)}
      />
    </div>
  );
}
