"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DollarSign, RefreshCw, Calculator, Percent, ShieldCheck, ArrowRight } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface PricingRule {
  id: string;
  name: string;
  category_name?: string;
  min_price_usd: string;
  max_price_usd: string;
  commission_percentage: string;
  allow_hourly: boolean;
  allow_packages: boolean;
  allow_custom_quotes: boolean;
  is_active: boolean;
}

export default function ServicePricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculator State
  const [calcInput, setCalcInput] = useState({
    basePrice: 500,
    addonsPrice: 150,
    commissionRate: 15, // percent
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/admin/services/pricing-rules");
      const list = Array.isArray(data) ? data : data?.rules || data?.data || [];
      setRules(list);
    } catch (err) {
      console.error("Failed to load pricing rules:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived calculation
  const subtotal = (Number(calcInput.basePrice) || 0) + (Number(calcInput.addonsPrice) || 0);
  const platformFee = Math.round((subtotal * ((Number(calcInput.commissionRate) || 0) / 100)) * 100) / 100;
  const sellerEarnings = Math.round((subtotal - platformFee) * 100) / 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Service Pricing & Commission Rules</h1>
            <p className="text-sm text-slate-400">
              Manage category pricing thresholds, commission percentages, and simulation calculator.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Live Calculator Widget */}
      <div className="bg-[#0f172a] border border-indigo-500/30 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Dynamic Pricing & Payout Simulator</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Base Service Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={calcInput.basePrice}
                  onChange={(e) =>
                    setCalcInput({ ...calcInput, basePrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Add-ons Total ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={calcInput.addonsPrice}
                  onChange={(e) =>
                    setCalcInput({ ...calcInput, addonsPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Platform Fee (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={calcInput.commissionRate}
                  onChange={(e) =>
                    setCalcInput({ ...calcInput, commissionRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold text-base focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Gross Order Value:</span>
              <span className="font-bold text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-rose-400">
              <span>Desigot Platform Fee:</span>
              <span className="font-bold">-${platformFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between text-sm font-bold text-emerald-400">
              <span>Net Seller Payout:</span>
              <span>${sellerEarnings.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configured Pricing Rules Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Active Pricing & Commission Matrix</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#1e293b]/70 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-4 px-4">Rule Name</th>
                <th className="py-4 px-4">Scope</th>
                <th className="py-4 px-4">Min Price</th>
                <th className="py-4 px-4">Max Price</th>
                <th className="py-4 px-4">Commission</th>
                <th className="py-4 px-4">Packages</th>
                <th className="py-4 px-4">Custom Quotes</th>
                <th className="py-4 px-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 font-bold text-white text-xs">{rule.name}</td>
                  <td className="py-4 px-4 text-xs text-slate-300">
                    {rule.category_name || "Platform Global Default"}
                  </td>
                  <td className="py-4 px-4 text-xs font-semibold text-white">${rule.min_price_usd}</td>
                  <td className="py-4 px-4 text-xs font-semibold text-white">${rule.max_price_usd}</td>
                  <td className="py-4 px-4 text-xs font-bold text-indigo-400">
                    {rule.commission_percentage}
                  </td>
                  <td className="py-4 px-4 text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                      Allowed
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                      Allowed
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
