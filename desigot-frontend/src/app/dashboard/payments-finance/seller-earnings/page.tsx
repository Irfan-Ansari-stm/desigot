"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Wallet, Search, RefreshCw, ChevronLeft, ChevronRight, Eye, DollarSign, X } from "lucide-react";
import { apiGet } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";

export default function SellerEarningsPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);
  const [statementData, setStatementData] = useState<any | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const loadSellers = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      const res = await apiGet<any>("/admin/finance/seller-earnings", params);
      if (res) {
        setSellers(res.sellers || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load seller earnings:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  const viewStatement = async (seller: any) => {
    setSelectedSeller(seller);
    try {
      setStatementLoading(true);
      const res = await apiGet<any>(`/admin/finance/seller-earnings/${seller.seller_id}/statement`);
      setStatementData(res);
    } catch (err) {
      console.error("Failed to load statement:", err);
    } finally {
      setStatementLoading(false);
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
              <Wallet className="w-5 h-5 text-purple-400" />
              Seller Balances & Wallet Ledgers
            </h2>
            <p className="text-xs text-slate-400">
              Real-time available balances, pending escrow, lifetime earnings, and withdrawal tracking
            </p>
          </div>

          <button
            onClick={loadSellers}
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
            placeholder="Search seller by name or email..."
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
              <th className="py-3.5 px-4 font-semibold">Seller Profile</th>
              <th className="py-3.5 px-4 font-semibold text-right">Lifetime Gross</th>
              <th className="py-3.5 px-4 font-semibold text-right">Platform Comm</th>
              <th className="py-3.5 px-4 font-semibold text-right">Gateway Fees</th>
              <th className="py-3.5 px-4 font-semibold text-right">Pending Escrow</th>
              <th className="py-3.5 px-4 font-semibold text-right">Available Balance</th>
              <th className="py-3.5 px-4 font-semibold text-right">Paid to Date</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {loading && sellers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                  Loading seller balances...
                </td>
              </tr>
            ) : sellers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                  No seller financial accounts found.
                </td>
              </tr>
            ) : (
              sellers.map((s) => (
                <tr key={s.seller_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-bold text-white">{s.seller_name || "Designer"}</div>
                    <div className="text-[11px] text-slate-400">{s.seller_email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-white">{formatCents(s.total_gross_cents)}</td>
                  <td className="py-3.5 px-4 text-right text-rose-400">-{formatCents(s.total_commission_cents)}</td>
                  <td className="py-3.5 px-4 text-right text-slate-400">-{formatCents(s.total_gateway_fees_cents)}</td>
                  <td className="py-3.5 px-4 text-right text-amber-400 font-semibold">
                    {formatCents(s.pending_earnings_cents)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-bold text-sm">
                    {formatCents(s.available_earnings_cents)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-purple-300">{formatCents(s.paid_earnings_cents)}</td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    <button
                      onClick={() => viewStatement(s)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Statement
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
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} sellers
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

      {/* Statement Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedSeller.seller_name} — Financial Profile</h3>
                  <p className="text-xs text-slate-400">{selectedSeller.seller_email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSeller(null);
                  setStatementData(null);
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statementLoading ? (
              <div className="py-12 flex justify-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Available For Withdrawal</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">
                      {formatCents(selectedSeller.available_earnings_cents)}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Disbursed To Date</span>
                    <span className="text-xl font-bold text-purple-300 font-mono">
                      {formatCents(selectedSeller.paid_earnings_cents)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent Transactions</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {statementData?.recent_transactions?.map((t: any) => (
                      <div key={t.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-white font-medium">{t.transaction_reference}</span>
                          <span className="text-[10px] text-slate-500 block capitalize">{t.transaction_type?.replace(/_/g, " ")}</span>
                        </div>
                        <span className="font-mono text-purple-300 font-semibold">{formatCents(t.seller_net_amount_cents)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
