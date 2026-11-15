"use client";

import React, { useState } from "react";
import { ShieldAlert, X, Loader2, AlertCircle, DollarSign, CheckCircle2, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";

interface Dispute {
  id: string;
  order_id: string;
  amount_cents?: number;
  reason: string;
  claim_summary?: string;
  dispute_status: string;
}

interface Props {
  isOpen: boolean;
  dispute: Dispute | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisputeResolutionModal({
  isOpen,
  dispute,
  onClose,
  onSuccess,
}: Props) {
  const [resolution, setResolution] = useState<"refund_buyer_full" | "refund_buyer_partial" | "release_seller" | "split">("refund_buyer_full");
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !dispute) return null;

  const totalAmountDollars = (dispute.amount_cents || 0) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const refundCents = resolution === "refund_buyer_full"
        ? (dispute.amount_cents || 0)
        : resolution === "release_seller"
        ? 0
        : Math.round(refundAmount * 100);

      await api.post(`/admin/orders/disputes/${dispute.id}/resolve`, {
        resolution,
        refund_amount_cents: refundCents,
        resolution_notes: notes || "Resolved by platform compliance officer.",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to resolve dispute");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Dispute Investigation & Resolution</h3>
              <p className="text-xs text-slate-400">
                Dispute #{dispute.id.slice(0, 8)} • Order #{dispute.order_id.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Dispute Reason:</span>
            <span className="text-xs font-semibold text-rose-400">{dispute.reason || "Not specified"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Escrowed Value:</span>
            <span className="text-sm font-bold text-white">${totalAmountDollars.toFixed(2)}</span>
          </div>
          {dispute.claim_summary && (
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Buyer Claim</span>
              <p className="text-xs text-slate-300 mt-1">{dispute.claim_summary}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Adjudication Outcome
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: "refund_buyer_full", title: "Full Refund to Buyer", desc: "100% of escrow returned" },
                { key: "refund_buyer_partial", title: "Partial Refund", desc: "Split with custom amount" },
                { key: "release_seller", title: "Release to Seller", desc: "No refund, payout released" },
                { key: "split", title: "50/50 Equal Split", desc: "Half refunded, half paid" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setResolution(item.key as any);
                    if (item.key === "split") setRefundAmount(totalAmountDollars / 2);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    resolution === item.key
                      ? "bg-purple-600/15 border-purple-500/50 text-white shadow-lg shadow-purple-600/10"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-xs text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {resolution === "refund_buyer_partial" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Partial Refund Amount ($ USD)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={totalAmountDollars}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Compliance Adjudication Summary & Notes
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="State the contractual rationale, deliverable assessment, and agreed terms..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Execute Final Resolution</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
