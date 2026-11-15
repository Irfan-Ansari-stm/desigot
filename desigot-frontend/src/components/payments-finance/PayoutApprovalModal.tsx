"use client";

import React, { useState } from "react";
import { X, CheckCircle2, XCircle, Loader2, AlertCircle, DollarSign } from "lucide-react";
import { apiPost } from "@/lib/api";

interface Props {
  payout: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayoutApprovalModal({ payout, isOpen, onClose, onSuccess }: Props) {
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payout) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (action === "approve") {
        await apiPost(`/admin/finance/payout-requests/${payout.id}/approve`);
      } else {
        await apiPost(`/admin/finance/payout-requests/${payout.id}/reject`, { reason });
      }
      onSuccess();
    } catch (err: any) {
      console.error("Failed to update payout:", err);
      setError(err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl space-y-5 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Review Payout Request</h3>
              <p className="text-xs text-slate-400 font-mono">{payout.payout_reference}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Seller:</span>
            <span className="text-white font-medium">{payout.seller_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Requested Amount:</span>
            <span className="text-emerald-400 font-mono font-bold">
              ${((payout.requested_amount_cents || 0) / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Payout Rail:</span>
            <span className="text-purple-300 font-medium capitalize">{payout.payout_method_type?.replace(/_/g, " ")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Administrative Decision</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAction("approve")}
                className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  action === "approve"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setAction("reject")}
                className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  action === "reject"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>

          {action === "reject" && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                required
                placeholder="State reason for rejecting this payout request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-white font-semibold flex items-center gap-1.5 ${
                action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm {action === "approve" ? "Approval" : "Rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
