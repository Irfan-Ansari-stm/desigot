"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  CreditCard,
  DollarSign,
  User,
  ShoppingBag,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  RefreshCw,
  Scale,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { TransactionStatusBadge } from "./TransactionStatusBadge";

interface Props {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailsModal({ transactionId, isOpen, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transactionId && isOpen) {
      setLoading(true);
      apiGet<any>(`/admin/finance/transactions/${transactionId}`)
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
          console.error("Failed to load transaction details:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setData(null);
    }
  }, [transactionId, isOpen]);

  if (!isOpen) return null;

  const txn = data?.transaction;
  const refunds = data?.refunds || [];
  const journals = data?.journals || [];
  const comm = data?.commission;

  const formatCents = (cents: number) => {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Financial Transaction Breakdown</h3>
              <p className="text-xs text-slate-400 font-mono">
                {txn ? txn.transaction_reference : "Loading..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-xs">Hydrating transaction and double-entry ledger journals...</p>
          </div>
        ) : !txn ? (
          <div className="py-12 text-center text-slate-400 text-xs">Transaction not found.</div>
        ) : (
          <div className="space-y-6">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500">Gross Captured</span>
                <p className="text-lg font-bold text-white font-mono">{formatCents(txn.gross_amount_cents)}</p>
                <span className="text-[11px] text-slate-400 capitalize">{txn.currency}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500">Platform Commission</span>
                <p className="text-lg font-bold text-emerald-400 font-mono">
                  {formatCents(txn.commission_amount_cents)}
                </p>
                <span className="text-[11px] text-slate-400">Desigot Take-Rate</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500">Gateway Interchange</span>
                <p className="text-lg font-bold text-rose-400 font-mono">{formatCents(txn.gateway_fee_cents)}</p>
                <span className="text-[11px] text-slate-400">Merchant processing</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500">Net Seller Settlement</span>
                <p className="text-lg font-bold text-purple-400 font-mono">
                  {formatCents(txn.seller_net_amount_cents)}
                </p>
                <span className="text-[11px] text-slate-400">Credited to wallet</span>
              </div>
            </div>

            {/* Counterparties & Rails */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-purple-400" /> Parties Involved
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Buyer Customer:</span>
                    <span className="text-white font-medium">{txn.customer_name || "Guest Customer"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Seller Creator:</span>
                    <span className="text-white font-medium">{txn.seller_name || "Marketplace Seller"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Transaction Status:</span>
                    <TransactionStatusBadge status={txn.status} />
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Order ID:</span>
                    <span className="text-purple-300 font-mono text-[11px] truncate max-w-[200px]">
                      {txn.order_id || "Direct Payment"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Gateway & Rail Processing
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Payment Gateway:</span>
                    <span className="text-white font-semibold">{txn.gateway_name || "Stripe"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Payment Method:</span>
                    <span className="text-white font-medium">{txn.payment_method_name || "Credit Card"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Provider Ref:</span>
                    <span className="text-purple-300 font-mono text-[11px] truncate max-w-[200px]">
                      {txn.provider_reference || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Captured At:</span>
                    <span className="text-slate-300">
                      {txn.captured_at ? new Date(txn.captured_at).toLocaleString() : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Double-Entry Balanced Journal Entries */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-purple-400" /> Double-Entry Ledger Journal Records
              </h4>
              {journals.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No posted journals found for this transaction.</p>
              ) : (
                <div className="space-y-3">
                  {journals.map((j: any) => (
                    <div key={j.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-purple-300 font-bold">{j.journal_reference}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold">
                          Balanced: Debits == Credits
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{j.description}</p>
                      <div className="overflow-x-auto pt-1">
                        <table className="w-full text-left text-[11px]">
                          <thead className="text-slate-500 border-b border-slate-800">
                            <tr>
                              <th className="py-1">Account</th>
                              <th className="py-1">Type</th>
                              <th className="py-1 text-right">Debit</th>
                              <th className="py-1 text-right">Credit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {j.entries &&
                              j.entries.map((e: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="py-1 text-white font-medium">{e.account_name}</td>
                                  <td className="py-1 text-slate-400 capitalize">{e.account_type}</td>
                                  <td className="py-1 text-right font-mono text-emerald-400">
                                    {e.debit_cents > 0 ? formatCents(e.debit_cents) : "—"}
                                  </td>
                                  <td className="py-1 text-right font-mono text-purple-400">
                                    {e.credit_cents > 0 ? formatCents(e.credit_cents) : "—"}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
