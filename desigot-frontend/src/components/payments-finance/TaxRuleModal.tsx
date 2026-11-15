"use client";

import React, { useState } from "react";
import { X, Landmark, Loader2, AlertCircle } from "lucide-react";
import { apiPost } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TaxRuleModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [taxType, setTaxType] = useState("sales_tax");
  const [percentage, setPercentage] = useState("8.25");
  const [countryCode, setCountryCode] = useState("US");
  const [stateRegion, setStateRegion] = useState("");
  const [isInclusive, setIsInclusive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await apiPost("/admin/finance/tax-rules", {
        name,
        tax_type: taxType,
        tax_percentage: parseFloat(percentage),
        country_code: countryCode.toUpperCase(),
        state_region: stateRegion.trim() || null,
        is_inclusive: isInclusive,
      });
      onSuccess();
    } catch (err: any) {
      console.error("Failed to add tax rule:", err);
      setError(err?.message || "Failed to create tax rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl space-y-6 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Add Jurisdiction Tax Rule</h3>
              <p className="text-xs text-slate-400">Configure regional GST, VAT, or Sales Tax rates</p>
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
              placeholder="e.g. EU Cross-Border Digital VAT"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tax Classification</label>
              <select
                value={taxType}
                onChange={(e) => setTaxType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500 uppercase"
              >
                <option value="sales_tax">Sales Tax</option>
                <option value="vat">VAT</option>
                <option value="gst">GST</option>
                <option value="cgst">CGST (India)</option>
                <option value="sgst">SGST (India)</option>
                <option value="igst">IGST (Interstate)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Percentage Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Country Code (ISO 2)</label>
              <input
                type="text"
                maxLength={2}
                required
                placeholder="US, IN, GB..."
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">State / Province (Optional)</label>
              <input
                type="text"
                placeholder="California, Ontario..."
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="tax-inclusive"
              checked={isInclusive}
              onChange={(e) => setIsInclusive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="tax-inclusive" className="text-slate-300 font-medium cursor-pointer">
              Prices already include this tax (Tax-Inclusive)
            </label>
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
              Save Tax Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
