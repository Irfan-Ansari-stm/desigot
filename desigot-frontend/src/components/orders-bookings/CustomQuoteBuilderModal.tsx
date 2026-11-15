"use client";

import React, { useState } from "react";
import { FileText, X, Loader2, AlertCircle, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CustomQuoteBuilderModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [buyerEmail, setBuyerEmail] = useState("");
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState("");
  const [price, setPrice] = useState<number>(1200);
  const [timelineDays, setTimelineDays] = useState<number>(7);
  const [revisionsAllowed, setRevisionsAllowed] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Find buyer by email or use first buyer
      const userRes = await api.get(`/users?search=${encodeURIComponent(buyerEmail)}`);
      const buyer = userRes.data?.data?.[0];

      if (!buyer) {
        throw new Error("No buyer found with that email. Please check the email address.");
      }

      // Fetch sellers or me
      const meRes = await api.get("/auth/me");
      const currentUserId = meRes.data?.data?.id || meRes.data?.data?.user?.id;

      await api.post("/admin/orders/quotes", {
        buyer_id: buyer.id,
        seller_id: currentUserId,
        title,
        scope_of_work: scope,
        price_cents: Math.round(price * 100),
        estimated_delivery_days: timelineDays,
        revisions_allowed: revisionsAllowed,
        notes: "Directly issued by Desigot Executive Concierge",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create quote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Custom Enterprise Quote</h3>
              <p className="text-xs text-slate-400">
                Direct B2B tailored proposal with milestone escrow capability
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
              Client / Buyer Email
            </label>
            <input
              type="email"
              required
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="e.g. enterprise.client@acme.corp"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Global Design System & Web App UI/UX Redesign"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Price ($ USD)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="50"
                  step="10"
                  required
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-2 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Timeline (Days)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="1"
                  required
                  value={timelineDays}
                  onChange={(e) => setTimelineDays(parseInt(e.target.value) || 1)}
                  className="w-full pl-8 pr-2 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Revisions
              </label>
              <input
                type="number"
                min="0"
                required
                value={revisionsAllowed}
                onChange={(e) => setRevisionsAllowed(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Scope of Work & Deliverables Specification
            </label>
            <textarea
              rows={4}
              required
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Outline deliverables, Figma source files, interactive prototypes, responsiveness breakdown..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
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
              <span>Issue Official Quote</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
