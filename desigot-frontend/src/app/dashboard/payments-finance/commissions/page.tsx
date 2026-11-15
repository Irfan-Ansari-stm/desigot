"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Plus, RefreshCw, CheckCircle2, ShieldCheck, ArrowRight, Layers } from "lucide-react";
import { apiGet } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";
import { CommissionRuleModal } from "@/components/payments-finance/CommissionRuleModal";

export default function CommissionSettingsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await apiGet<any[]>("/admin/finance/commission-rules");
      if (res) setRules(res);
    } catch (err) {
      console.error("Failed to load commission rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <FinanceStatsCards />

      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            Marketplace Commission Rules & Take-Rates
          </h2>
          <p className="text-xs text-slate-400">
            Define global, category-specific, tier-based, and individual seller commission precedence
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Commission Rule
        </button>
      </div>

      {/* Precedence Banner */}
      <div className="p-4 rounded-2xl bg-[#0b101b] border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-400">
        <span className="font-semibold text-slate-300">Rule Resolution Precedence:</span>
        <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
          <span className="px-2 py-1 rounded bg-purple-900/30 text-purple-300 border border-purple-500/20">
            1. Seller Specific
          </span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
            2. Category Specific
          </span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
            3. Product Scope
          </span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
            4. Global Default (15%)
          </span>
        </div>
      </div>

      {/* Rules Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a] shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Priority</th>
              <th className="py-3.5 px-4 font-semibold">Rule Title</th>
              <th className="py-3.5 px-4 font-semibold">Scope Type</th>
              <th className="py-3.5 px-4 font-semibold">Target Entity</th>
              <th className="py-3.5 px-4 font-semibold text-right">Commission Rate</th>
              <th className="py-3.5 px-4 font-semibold text-right">Fixed Fee</th>
              <th className="py-3.5 px-4 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                  Loading commission rules...
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No commission rules configured.
                </td>
              </tr>
            ) : (
              rules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-400">#{r.priority}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{r.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize">
                      {r.rule_type?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {r.category_name || r.seller_name || r.product_type || "Marketplace Wide"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                    {parseFloat(r.percentage_rate).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    {r.fixed_fee_cents > 0 ? `$${(r.fixed_fee_cents / 100).toFixed(2)}` : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CommissionRuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadRules();
        }}
      />
    </div>
  );
}
