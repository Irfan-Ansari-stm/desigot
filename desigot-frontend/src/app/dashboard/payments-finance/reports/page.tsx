"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Scale,
  Download,
  Calendar,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";
import { FinancialLedgerViewer } from "@/components/payments-finance/FinancialLedgerViewer";
import { TransactionStatusBadge } from "@/components/payments-finance/TransactionStatusBadge";

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "ledger" | "reconciliation">("overview");
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReconciliations = async () => {
    try {
      setLoading(true);
      const res = await apiGet<any[]>("/admin/finance/reconciliations");
      if (res) setReconciliations(res);
    } catch (err) {
      console.error("Failed to load reconciliations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reconciliation") {
      loadReconciliations();
    }
  }, [activeTab]);

  const formatCents = (cents: number) => {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6 pb-16">
      <FinanceStatsCards />

      {/* Tabs Header */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0f172a] border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "overview"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Financial Reports & KPIs</span>
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "ledger"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Double-Entry Financial Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab("reconciliation")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "reconciliation"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Gateway Reconciliation</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & REPORTS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Platform Revenue & Gross Volume Architecture
            </h3>
            <p className="text-xs text-slate-400">
              Desigot applies automated GAAP-compliant revenue recognition upon delivery sign-off, distinguishing gross
              marketplace transaction volume from net platform commission profit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Gross Transaction Flow</span>
                <p className="text-xs text-slate-300">
                  Total client capital flowing into escrow cleared through multi-rail gateways (Stripe, Razorpay, PayPal).
                </p>
                <div className="pt-2 text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Persisted to PostgreSQL
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Commission Take-Rate</span>
                <p className="text-xs text-slate-300">
                  Calculated dynamically from precedence rules (seller privilege &gt; category override &gt; 15% global).
                </p>
                <div className="pt-2 text-purple-400 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Historical Snapshots
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Seller Escrow Trust</span>
                <p className="text-xs text-slate-300">
                  Seller net earnings held in trust liabilities, withdrawable upon delivery verification via banking rails.
                </p>
                <div className="pt-2 text-blue-400 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Zero Unbalanced Balances
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIAL LEDGER */}
      {activeTab === "ledger" && <FinancialLedgerViewer />}

      {/* TAB 3: GATEWAY RECONCILIATIONS */}
      {activeTab === "reconciliation" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Gateway Automated Reconciliation Batches</h3>
              <p className="text-xs text-slate-400">
                End-of-day statement matching between gateway merchant reports and Desigot internal ledger entries
              </p>
            </div>
            <button
              onClick={loadReconciliations}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Reconciliation Ref</th>
                  <th className="py-3.5 px-4 font-semibold">Gateway Rail</th>
                  <th className="py-3.5 px-4 font-semibold">Statement File Ref</th>
                  <th className="py-3.5 px-4 font-semibold text-right">System Gross</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Gateway Gross</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Variance</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {loading && reconciliations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                      Loading reconciliation batches...
                    </td>
                  </tr>
                ) : (
                  reconciliations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{r.reconciliation_reference}</td>
                      <td className="py-3.5 px-4 font-sans text-purple-300 font-semibold">{r.gateway_name}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">{r.gateway_statement_ref}</td>
                      <td className="py-3.5 px-4 text-right text-white font-bold">{formatCents(r.system_gross_cents)}</td>
                      <td className="py-3.5 px-4 text-right text-slate-300">{formatCents(r.gateway_gross_cents)}</td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          r.difference_cents === 0 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {formatCents(r.difference_cents)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-sans">
                        <TransactionStatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                        {r.reconciliation_date ? new Date(r.reconciliation_date).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
