"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Undo2, RefreshCw, Search, CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface RefundRequest {
  id: string;
  order_id?: string;
  product_id: string;
  product_title?: string;
  product_thumbnail?: string;
  buyer_name?: string;
  buyer_email?: string;
  seller_name?: string;
  amount_cents: number;
  reason: string;
  status: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolver_name?: string;
  created_at: string;
}

export default function ProductRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Resolution modal
  const [resolveModal, setResolveModal] = useState(false);
  const [targetRefund, setTargetRefund] = useState<RefundRequest | null>(null);
  const [resolutionAction, setResolutionAction] = useState<"approve" | "reject">("approve");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRefunds = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products/refunds");
      const items = res?.refunds || res?.data?.refunds || (Array.isArray(res) ? res : []);
      setRefunds(items);
    } catch (err) {
      console.error("Failed to load refunds:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const openResolution = (ref: RefundRequest, action: "approve" | "reject") => {
    setTargetRefund(ref);
    setResolutionAction(action);
    setResolutionNotes("");
    setResolveModal(true);
  };

  const handleConfirmResolution = async () => {
    if (!targetRefund) return;
    setIsSubmitting(true);
    try {
      await apiPost(`/admin/digital-products/refunds/${targetRefund.id}/resolve`, {
        resolution: resolutionAction,
        notes: resolutionNotes.trim() || `${resolutionAction === "approve" ? "Approved" : "Rejected"} by administration`,
      });
      setResolveModal(false);
      setTargetRefund(null);
      loadRefunds();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to process refund resolution");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = refunds.filter(
    (r) =>
      r.product_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.buyer_email?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <Undo2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Product Refunds & Revocations</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {refunds.length} In Dispute Ledger
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Arbitrate customer refund requests, authorize payment reversals, and automatically revoke download entitlements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRefunds}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-rose-400" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex items-center gap-3 shadow-lg max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search refund claim by reason, user, product..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Refunds Table */}
      <div className="w-full bg-[#0e1726] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#121c2d] text-xs uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-4">Claimed Asset</th>
                <th className="py-4 px-3">Customer</th>
                <th className="py-4 px-3">Amount</th>
                <th className="py-4 px-4">Refund Reason</th>
                <th className="py-4 px-3">Status</th>
                <th className="py-4 px-4 text-right">Arbitration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-semibold text-white block text-sm max-w-xs truncate">
                      {r.product_title || "Digital Asset"}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Ref: {r.id.substring(0, 8)}
                    </span>
                  </td>

                  <td className="py-4 px-3">
                    <span className="font-medium text-white block text-xs">
                      {r.buyer_name || "Buyer"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {r.buyer_email || "buyer@desigot.com"}
                    </span>
                  </td>

                  <td className="py-4 px-3 font-mono font-bold text-white">
                    ${(r.amount_cents / 100).toFixed(2)}
                  </td>

                  <td className="py-4 px-4 max-w-sm">
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {r.reason}
                    </p>
                    {r.resolution_notes && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">
                        Resolution: {r.resolution_notes}
                      </p>
                    )}
                  </td>

                  <td className="py-4 px-3">
                    {r.status === "refunded" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Refunded
                      </span>
                    ) : r.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" />
                        Claim Denied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Pending Review
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-right">
                    {r.status === "requested" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openResolution(r, "approve")}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition"
                        >
                          Approve Refund
                        </button>
                        <button
                          onClick={() => openResolution(r, "reject")}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition"
                        >
                          Deny
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Resolved {r.resolver_name ? `by ${r.resolver_name}` : ""}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {resolveModal && targetRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121c2d] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              {resolutionAction === "approve" ? "Authorize Customer Refund" : "Deny Refund Request"}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {resolutionAction === "approve"
                ? `Authorizing this refund of $${(targetRefund.amount_cents / 100).toFixed(2)} will immediately revoke the buyer's license key and download entitlements.`
                : "Provide an explanation for why this claim is denied according to the marketplace digital goods policy."}
            </p>

            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Resolution notes / rationale..."
              className="w-full bg-[#0a101d] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setResolveModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolution}
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-sm font-medium text-white transition shadow-lg ${
                  resolutionAction === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
                    : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/25"
                }`}
              >
                Confirm {resolutionAction === "approve" ? "Refund" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
