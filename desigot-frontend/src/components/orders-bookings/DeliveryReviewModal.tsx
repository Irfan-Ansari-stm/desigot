"use client";

import React, { useState } from "react";
import { FileCheck, X, Loader2, AlertCircle, ExternalLink, RotateCcw, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface Delivery {
  id: string;
  order_id: string;
  version_number: number;
  delivery_notes: string;
  files: any[];
  external_link?: string;
  status: string;
}

interface Props {
  isOpen: boolean;
  delivery: Delivery | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliveryReviewModal({
  isOpen,
  delivery,
  onClose,
  onSuccess,
}: Props) {
  const [action, setAction] = useState<"approve" | "revision">("approve");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !delivery) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post(`/admin/orders/deliveries/${delivery.id}/review`, {
        action,
        feedback: feedback || (action === "approve" ? "Delivery approved by platform QA." : "Revisions required."),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to process delivery review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Review Deliverables (v{delivery.version_number})</h3>
              <p className="text-xs text-slate-400">
                Order #{delivery.order_id?.slice(0, 8)} • Status: {delivery.status}
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

        <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Seller Deliverable Notes</span>
            <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">{delivery.delivery_notes || "No notes provided."}</p>
          </div>

          {delivery.external_link && (
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">External Assets / Figma Link</span>
              <a
                href={delivery.external_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 underline mt-1"
              >
                <span>{delivery.external_link}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {delivery.files && delivery.files.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Attached Assets ({delivery.files.length})</span>
              <div className="space-y-1.5">
                {delivery.files.map((f: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs text-slate-300">
                    <span className="truncate">{f.name || f.filename || `File #${idx + 1}`}</span>
                    <span className="text-slate-500 shrink-0 ml-2">{f.size ? `${Math.round(f.size / 1024)} KB` : 'Archive'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction("approve")}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                action === "approve"
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <div className="font-semibold text-sm text-white">Approve Delivery</div>
                <div className="text-xs text-slate-400 mt-0.5">Release escrow or complete milestone</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAction("revision")}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                action === "revision"
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/10"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <RotateCcw className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <div className="font-semibold text-sm text-white">Request Revision</div>
                <div className="text-xs text-slate-400 mt-0.5">Send work back to seller with notes</div>
              </div>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Reviewer Feedback & Instructions
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={action === "approve" ? "Optional approval notes..." : "Specify exactly what adjustments are required before approval..."}
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
              className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all ${
                action === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{action === "approve" ? "Approve & Complete" : "Submit Revision Request"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
