"use client";

import React, { useState, useEffect } from "react";
import { Send, CheckCircle2, RefreshCw, AlertCircle, Building, ShieldCheck, DollarSign } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { FinanceStatsCards } from "@/components/payments-finance/FinanceStatsCards";

export default function PayoutProcessingPage() {
  const [approvedPayouts, setApprovedPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadApprovedPayouts = async () => {
    try {
      setLoading(true);
      const res = await apiGet<any>("/admin/finance/payout-processing");
      if (res) {
        setApprovedPayouts(res.payouts || []);
      }
    } catch (err) {
      console.error("Failed to load approved payouts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovedPayouts();
  }, []);

  const handleProcess = async (id: string, ref: string) => {
    try {
      setProcessingId(id);
      setSuccessMessage(null);
      await apiPost(`/admin/finance/payout-processing/${id}/process`);
      setSuccessMessage(`Successfully disbursed ${ref} to destination banking rail and posted balanced journal entry.`);
      loadApprovedPayouts();
    } catch (err: any) {
      console.error("Processing failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatCents = (cents: number) => {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6 pb-16">
      <FinanceStatsCards />

      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-400" />
              Payout Processing & Banking Rail Clearance
            </h2>
            <p className="text-xs text-slate-400">
              Approved payout requests pending ACH, Wire, Stripe Connect, or UPI disbursement settlement
            </p>
          </div>
          <button
            onClick={loadApprovedPayouts}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Processing Queue */}
      <div className="space-y-4">
        {loading && approvedPayouts.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0f172a] border border-slate-800 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
            Checking banking rails queue...
          </div>
        ) : approvedPayouts.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">All Approved Payouts Disbursed</h3>
            <p className="text-xs text-slate-400">No approved payouts currently pending bank rail transmission.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedPayouts.map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4 hover:border-purple-500/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-purple-300 font-bold">{p.payout_reference}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Approved by Admin
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{p.seller_name}</h4>
                    <p className="text-[11px] text-slate-400">{p.seller_email}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span className="font-sans">Disbursement Amount:</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {formatCents(p.net_payout_cents || p.requested_amount_cents)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span className="font-sans">Target Method:</span>
                      <span className="text-slate-300 font-sans capitalize">{p.payout_method_type?.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Approved {p.approved_at ? new Date(p.approved_at).toLocaleDateString() : "Recently"}
                  </span>
                  <button
                    onClick={() => handleProcess(p.id, p.payout_reference)}
                    disabled={processingId === p.id}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5"
                  >
                    {processingId === p.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Disburse to Bank Rail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
