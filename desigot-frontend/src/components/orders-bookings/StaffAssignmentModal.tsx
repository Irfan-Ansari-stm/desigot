"use client";

import React, { useState } from "react";
import { UserCheck, X, Loader2, AlertCircle, Shield } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  isOpen: boolean;
  orderId: string;
  orderNumber?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function StaffAssignmentModal({
  isOpen,
  orderId,
  orderNumber,
  onClose,
  onSuccess,
}: Props) {
  const [roleType, setRoleType] = useState("order_manager");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First get current user id from auth/me or current session
      const meRes = await api.get("/auth/me");
      const currentUserId = meRes.data?.data?.id || meRes.data?.data?.user?.id;

      await api.post(`/admin/orders/${orderId}/assign`, {
        staff_id: currentUserId,
        role_type: roleType,
        notes: notes || "Assigned via Administrative Workspace",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to assign staff member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Assign Order to Staff</h3>
              <p className="text-xs text-slate-400">
                Order #{orderNumber || orderId.slice(0, 8)}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Assignment Role
            </label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="order_manager">Order Fulfillment Manager (Lead)</option>
              <option value="qa_reviewer">QA & Deliverable Inspector</option>
              <option value="dispute_officer">Dispute Resolution Officer</option>
              <option value="support_lead">VIP Customer Success Lead</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Assignee will receive instant real-time alerts on revisions, uploads, and buyer notes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Fulfillment Directive & Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ensure source Figma files adhere to enterprise guidelines and milestone 2 timeline is respected..."
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
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
