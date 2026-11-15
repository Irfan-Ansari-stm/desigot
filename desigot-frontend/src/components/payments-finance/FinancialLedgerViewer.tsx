"use client";

import React, { useEffect, useState } from "react";
import { Scale, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api";

export function FinancialLedgerViewer() {
  const [summary, setSummary] = useState<any>(null);
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const [sumRes, jrnRes] = await Promise.all([
        apiGet<any>("/admin/finance/ledger/summary"),
        apiGet<any>("/admin/finance/ledger/journals?limit=15"),
      ]);
      setSummary(sumRes);
      setJournals(jrnRes?.journals || []);
    } catch (err) {
      console.error("Failed to load financial ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const formatCents = (cents: number) => {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
        <p className="text-xs">Computing double-entry trial balance...</p>
      </div>
    );
  }

  const tb = summary?.trial_balance;
  const accounts = summary?.accounts || [];

  return (
    <div className="space-y-6">
      {/* Trial Balance Banner */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Double-Entry Trial Balance</h3>
              {tb?.is_all_balanced && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Debits == Credits
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Immutable ledger accounts governing marketplace funds, liabilities, and revenues
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Debits</span>
            <span className="text-emerald-400 font-bold">{formatCents(tb?.total_debits)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Credits</span>
            <span className="text-purple-400 font-bold">{formatCents(tb?.total_credits)}</span>
          </div>
        </div>
      </div>

      {/* Chart of Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {accounts.map((acc: any) => (
          <div key={acc.account_id} className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-purple-400 font-bold">#{acc.account_id}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 uppercase">
                {acc.account_type}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white truncate" title={acc.account_name}>
              {acc.account_name}
            </h4>
            <div className="flex justify-between text-[11px] font-mono pt-1 border-t border-slate-800/80">
              <span className="text-emerald-400 font-semibold">{formatCents(acc.total_debit_cents)} Dr</span>
              <span className="text-purple-400 font-semibold">{formatCents(acc.total_credit_cents)} Cr</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Posted Journals */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Posted Journal Transactions</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Journal Ref</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold text-right">Debit</th>
                <th className="py-3 px-4 font-semibold text-right">Credit</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {journals.map((j) => (
                <tr key={j.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-purple-300 font-bold">{j.journal_reference}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans text-xs truncate max-w-xs">{j.description}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{formatCents(j.total_debit_cents)}</td>
                  <td className="py-3 px-4 text-right text-purple-400 font-semibold">{formatCents(j.total_credit_cents)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                      Balanced
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 text-[11px] font-sans">
                    {j.posted_at ? new Date(j.posted_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
