"use client";

import React, { useState, useEffect, useCallback } from "react";
import { History, Search, RefreshCw, ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { apiGet } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";

export default function CommissionHistoryPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      const res = await apiGet<any>("/admin/finance/commission-history", params);
      if (res) {
        setCommissions(res.commissions || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load commission history:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
              <History className="w-5 h-5 text-purple-400" />
              Commission Audited History
            </h2>
            <p className="text-xs text-slate-400">
              Immutable calculation history recorded upon transaction settlement with applied rule snapshots
            </p>
          </div>

          <button
            onClick={loadHistory}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search commission reference, rule, or seller..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a] shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Commission Ref</th>
              <th className="py-3.5 px-4 font-semibold">Seller</th>
              <th className="py-3.5 px-4 font-semibold">Rule Applied</th>
              <th className="py-3.5 px-4 font-semibold text-right">Order Gross</th>
              <th className="py-3.5 px-4 font-semibold text-right">Rate</th>
              <th className="py-3.5 px-4 font-semibold text-right">Commission Taken</th>
              <th className="py-3.5 px-4 font-semibold text-right">Seller Net</th>
              <th className="py-3.5 px-4 font-semibold text-right">Calculated Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading && commissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                  Loading commission entries...
                </td>
              </tr>
            ) : commissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No commission records matching the criteria.
                </td>
              </tr>
            ) : (
              commissions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors font-mono">
                  <td className="py-3.5 px-4 font-bold text-white">{c.commission_reference}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-300 max-w-xs truncate">{c.seller_name}</td>
                  <td className="py-3.5 px-4 font-sans text-purple-300">{c.rule_name || "Global Rule"}</td>
                  <td className="py-3.5 px-4 text-right text-white font-semibold">{formatCents(c.gross_amount_cents)}</td>
                  <td className="py-3.5 px-4 text-right text-amber-400">{parseFloat(c.commission_rate).toFixed(1)}%</td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                    {formatCents(c.commission_amount_cents)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-purple-400">{formatCents(c.seller_net_amount_cents)}</td>
                  <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                    {c.calculated_at ? new Date(c.calculated_at).toLocaleDateString() : "—"}
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
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} entries
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
