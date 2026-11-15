"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Plus, CheckCircle2, XCircle, RefreshCw, Smartphone, Landmark, Wallet, Building } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const res = await apiGet<any[]>("/admin/finance/payment-methods");
      if (res) setMethods(res);
    } catch (err) {
      console.error("Failed to load payment methods:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const toggleStatus = async (id: string, currentActive: boolean) => {
    try {
      if (currentActive) {
        await apiPost(`/admin/finance/payment-methods/${id}/disable`);
      } else {
        await apiPost(`/admin/finance/payment-methods/${id}/enable`);
      }
      loadMethods();
    } catch (err) {
      console.error("Failed to toggle payment method:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "upi":
        return <Smartphone className="w-5 h-5 text-purple-400" />;
      case "netbanking":
        return <Landmark className="w-5 h-5 text-blue-400" />;
      case "wallet":
      case "paypal":
        return <Wallet className="w-5 h-5 text-emerald-400" />;
      case "bank_transfer":
        return <Building className="w-5 h-5 text-amber-400" />;
      default:
        return <CreditCard className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <FinanceStatsCards />

      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            Payment Methods Catalog
          </h2>
          <p className="text-xs text-slate-400">
            Configure customer checkout methods, provider associations, and transaction fee parameters
          </p>
        </div>
        <button
          onClick={loadMethods}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
        </button>
      </div>

      {/* Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((m) => (
          <div
            key={m.id}
            className="p-5 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4 hover:border-purple-500/30 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {getIcon(m.type)}
                </div>
                {m.is_active ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enabled
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Disabled
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{m.name}</h3>
                <span className="text-[11px] text-slate-400 capitalize">
                  {m.provider} Rail ({m.type})
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Merchant Processing Fee:</span>
                  <span className="text-white font-mono font-semibold">{m.processing_fee_percent}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Min - Max Limits:</span>
                  <span className="text-slate-300 font-mono">
                    ${((m.min_transaction_cents || 100) / 100).toFixed(0)} - $
                    {((m.max_transaction_cents || 10000000) / 100).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gateway Association:</span>
                  <span className="text-purple-300 font-medium">{m.gateway_name || m.provider}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Priority Order: #{m.display_order}</span>
              <button
                onClick={() => toggleStatus(m.id, m.is_active)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  m.is_active
                    ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                }`}
              >
                {m.is_active ? "Disable Method" : "Enable Method"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
