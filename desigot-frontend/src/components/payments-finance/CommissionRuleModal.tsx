"use client";

import React, { useState } from "react";
import { X, Sliders, Loader2, AlertCircle } from "lucide-react";
import { apiPost } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CommissionRuleModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState("global");
  const [rate, setRate] = useState("12.0");
  const [fixedFeeCents, setFixedFeeCents] = useState("0");
  const [priority, setPriority] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await apiPost("/admin/finance/commission-rules", {
        name,
        rule_type: ruleType,
        percentage_rate: parseFloat(rate),
        fixed_fee_cents: parseInt(fixedFeeCents, 10),
        priority,
      });
      onSuccess();
    } catch (err: any) {
      console.error("Failed to add commission rule:", err);
      setError(err?.message || "Failed to create commission rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl space-y-6 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">New Commission Rule</h3>
              <p className="text-xs text-slate-400">Configure marketplace revenue cut and precedence</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Rule Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Design Systems Special Take-Rate"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Scope Type</label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500 capitalize"
              >
                <option value="global">Global Marketplace</option>
                <option value="service">Design Services</option>
                <option value="digital_product">Digital Products</option>
                <option value="category_specific">Category Specific</option>
                <option value="seller_specific">Seller Tier Override</option>
                <option value="promotional">Promotional Sprint</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Precedence Priority (1 = Highest)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Take-Rate Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Fixed Fee (Cents)</label>
              <input
                type="number"
                value={fixedFeeCents}
                onChange={(e) => setFixedFeeCents(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
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
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Commission Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
