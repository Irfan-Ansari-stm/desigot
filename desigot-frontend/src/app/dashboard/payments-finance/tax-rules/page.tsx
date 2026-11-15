"use client";

import React, { useState, useEffect } from "react";
import { Landmark, Plus, RefreshCw, Trash2, CheckCircle2, Globe } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";
import { TaxRuleModal } from "@/components/payments-finance/TaxRuleModal";

export default function TaxConfigurationPage() {
  const [taxRules, setTaxRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTaxRules = async () => {
    try {
      setLoading(true);
      const res = await apiGet<any[]>("/admin/finance/tax-rules");
      if (res) setTaxRules(res);
    } catch (err) {
      console.error("Failed to load tax rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxRules();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this tax jurisdiction rule?")) return;
    try {
      await apiDelete(`/admin/finance/tax-rules/${id}`);
      loadTaxRules();
    } catch (err) {
      console.error("Failed to delete tax rule:", err);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <FinanceStatsCards />

      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-purple-400" />
            Tax Jurisdiction Rules & Compliance
          </h2>
          <p className="text-xs text-slate-400">
            Configure regional GST, VAT, Sales Tax rates, Indian CGST/SGST/IGST, and tax-inclusive pricing
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Tax Rule
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
            Loading jurisdiction tax rules...
          </div>
        ) : taxRules.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No tax rules configured.
          </div>
        ) : (
          taxRules.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4 hover:border-purple-500/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 uppercase tracking-wider">
                    {t.tax_type}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" /> {t.country_code}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{t.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {t.state_region ? `State: ${t.state_region}` : "Country-wide jurisdiction"}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-400 font-sans">
                    <span>Tax Percentage:</span>
                    <span className="text-emerald-400 font-bold text-base font-mono">
                      {parseFloat(t.tax_percentage).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-sans text-[11px]">
                    <span>Pricing Policy:</span>
                    <span className="text-slate-300">
                      {t.is_inclusive ? "Tax-Inclusive" : "Tax-Exclusive (Added at checkout)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Remove rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <TaxRuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadTaxRules();
        }}
      />
    </div>
  );
}
