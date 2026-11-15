"use client";

import React, { useState } from "react";
import { X, Cpu, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiPost } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GatewayConfigModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("stripe");
  const [environment, setEnvironment] = useState("sandbox");
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [feePercent, setFeePercent] = useState("2.90");
  const [feeFixedCents, setFeeFixedCents] = useState("30");
  const [priority, setPriority] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await apiPost("/admin/finance/gateways", {
        name,
        provider,
        environment,
        public_key: publicKey,
        secret_key: secretKey,
        webhook_secret: webhookSecret,
        transaction_fee_percent: parseFloat(feePercent),
        transaction_fee_fixed_cents: parseInt(feeFixedCents, 10),
        priority,
      });
      onSuccess();
    } catch (err: any) {
      console.error("Failed to add gateway:", err);
      setError(err?.message || "Failed to configure payment gateway");
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
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Configure Payment Gateway Rail</h3>
              <p className="text-xs text-slate-400">Register new payment provider infrastructure</p>
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
            <label className="block text-slate-400 font-semibold mb-1">Gateway Display Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Stripe Europe Production"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Provider Core</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="stripe">Stripe</option>
                <option value="razorpay">Razorpay</option>
                <option value="paypal">PayPal</option>
                <option value="payu">PayU</option>
                <option value="cashfree">Cashfree</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="sandbox">Sandbox / Test</option>
                <option value="production">Production Live</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Public Client Key</label>
            <input
              type="text"
              placeholder="pk_test_..."
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono text-[11px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Interchange Fee (%)</label>
              <input
                type="number"
                step="0.01"
                value={feePercent}
                onChange={(e) => setFeePercent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Fixed Fee (Cents)</label>
              <input
                type="number"
                value={feeFixedCents}
                onChange={(e) => setFeeFixedCents(e.target.value)}
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
              Save Gateway Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
