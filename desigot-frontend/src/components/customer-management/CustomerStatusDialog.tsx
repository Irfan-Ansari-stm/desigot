"use client";

import React, { useState } from "react";
import { AlertCircle, Ban, CheckCircle2, ShieldAlert, X } from "lucide-react";
import { apiPost } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  currentStatus: string;
  onSuccess: () => void;
}

export function CustomerStatusDialog({
  isOpen,
  onClose,
  customerId,
  customerName,
  currentStatus,
  onSuccess,
}: Props) {
  const [targetStatus, setTargetStatus] = useState<string>(
    currentStatus === "suspended" ? "active" : "suspended"
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiPost(`/admin/customers/${customerId}/status`, {
        status: targetStatus,
        reason: reason.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update customer status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuspending = targetStatus === "suspended";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isSuspending ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {isSuspending ? <Ban className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {isSuspending ? "Suspend Customer Account" : "Activate Customer Account"}
              </h3>
              <p className="text-xs text-slate-400">Account status lifecycle moderation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <p className="text-sm text-slate-300">
              You are about to change the status of customer{" "}
              <span className="font-semibold text-white">{customerName}</span>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Action Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetStatus("active")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition ${
                  targetStatus === "active"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </button>
              <button
                type="button"
                onClick={() => setTargetStatus("suspended")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition ${
                  targetStatus === "suspended"
                    ? "bg-red-500/20 border-red-500/40 text-red-300 shadow-sm shadow-red-500/10"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                Suspended
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Reason / Internal Admin Note
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context or explanation for this status update..."
              rows={3}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-xs font-medium text-white rounded-xl transition flex items-center gap-2 ${
                isSuspending
                  ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
              }`}
            >
              {isSubmitting ? "Processing..." : isSuspending ? "Confirm Suspension" : "Activate Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
