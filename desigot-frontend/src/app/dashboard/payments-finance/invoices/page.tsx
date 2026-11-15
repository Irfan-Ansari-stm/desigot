"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileText, Search, RefreshCw, ChevronLeft, ChevronRight, Eye, Download, Printer } from "lucide-react";
import { apiGet } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";
import { TransactionStatusBadge } from "@/components/payments-finance/TransactionStatusBadge";
import { InvoicePreviewModal } from "@/components/payments-finance/InvoicePreviewModal";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (status !== "all") params.status = status;
      const res = await apiGet<any>("/admin/finance/invoices", params);
      if (res) {
        setInvoices(res.invoices || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

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
              <FileText className="w-5 h-5 text-purple-400" />
              Customer & Seller Invoice Management
            </h2>
            <p className="text-xs text-slate-400">
              Generated marketplace tax invoices, line-item receipts, credit notes, and downloadable statements
            </p>
          </div>

          <button
            onClick={loadInvoices}
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
              placeholder="Search invoice number, client, or designer..."
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
              <option value="all">All Invoice Statuses</option>
              <option value="issued">Issued / Unpaid</option>
              <option value="paid">Paid & Settled</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a] shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Invoice Number</th>
              <th className="py-3.5 px-4 font-semibold">Billed Client</th>
              <th className="py-3.5 px-4 font-semibold">Seller</th>
              <th className="py-3.5 px-4 font-semibold text-right">Subtotal</th>
              <th className="py-3.5 px-4 font-semibold text-right">Tax</th>
              <th className="py-3.5 px-4 font-semibold text-right">Total Amount</th>
              <th className="py-3.5 px-4 font-semibold text-center">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Invoice Date</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {loading && invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                  No invoices found matching criteria.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <button
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className="hover:text-purple-400 transition-colors"
                    >
                      {inv.invoice_number}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-300 max-w-xs truncate">{inv.customer_name}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-400 max-w-xs truncate">{inv.seller_name}</td>
                  <td className="py-3.5 px-4 text-right text-slate-300">{formatCents(inv.subtotal_cents)}</td>
                  <td className="py-3.5 px-4 text-right text-slate-400">{formatCents(inv.tax_cents)}</td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">{formatCents(inv.total_cents)}</td>
                  <td className="py-3.5 px-4 text-center font-sans">
                    <TransactionStatusBadge status={inv.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                    {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    <button
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Preview
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
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} invoices
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

      <InvoicePreviewModal
        isOpen={!!selectedInvoiceId}
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </div>
  );
}
