"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Plus, RefreshCw, CheckCircle2, XCircle, Edit2, Scale, DollarSign, Layers } from "lucide-react";
import { apiGet, apiPost, apiPut } from "@/lib/api";

interface License {
  id: string;
  name: string;
  slug: string;
  description?: string;
  terms_summary?: string;
  allowed_uses?: string[];
  prohibited_uses?: string[];
  max_end_products: number;
  can_resell: boolean;
  can_modify: boolean;
  is_default: boolean;
  price_multiplier: number;
  is_active: boolean;
  sort_order: number;
}

export default function ProductLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit/Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [formName, setFormName] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formMultiplier, setFormMultiplier] = useState(1.0);
  const [formMaxProducts, setFormMaxProducts] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLicenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products/licenses");
      const items = res?.data || (Array.isArray(res) ? res : []);
      setLicenses(items);
    } catch (err) {
      console.error("Failed to load licenses:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  const openCreateModal = () => {
    setEditingLicense(null);
    setFormName("");
    setFormSummary("");
    setFormMultiplier(1.0);
    setFormMaxProducts(1);
    setModalOpen(true);
  };

  const openEditModal = (lic: License) => {
    setEditingLicense(lic);
    setFormName(lic.name);
    setFormSummary(lic.terms_summary || "");
    setFormMultiplier(Number(lic.price_multiplier) || 1.0);
    setFormMaxProducts(lic.max_end_products || 1);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingLicense) {
        await apiPut(`/admin/digital-products/licenses/${editingLicense.id}`, {
          name: formName.trim(),
          terms_summary: formSummary.trim(),
          price_multiplier: formMultiplier,
          max_end_products: formMaxProducts,
        });
      } else {
        await apiPost("/admin/digital-products/licenses", {
          name: formName.trim(),
          terms_summary: formSummary.trim(),
          price_multiplier: formMultiplier,
          max_end_products: formMaxProducts,
        });
      }
      setModalOpen(false);
      loadLicenses();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save license");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Product Licenses & Terms</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {licenses.length} Standard Templates
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Contractual usage rights, commercial multipliers, and digital asset distribution agreements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLicenses}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25"
          >
            <Plus className="w-4 h-4" />
            New License Tier
          </button>
        </div>
      </div>

      {/* Licenses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {licenses.map((lic) => (
          <div
            key={lic.id}
            className={`p-6 rounded-2xl bg-[#0e1726] border transition shadow-xl flex flex-col justify-between ${
              lic.slug === "commercial"
                ? "border-indigo-500/50 shadow-indigo-500/5 ring-1 ring-indigo-500/30"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-mono font-bold text-slate-300">
                  {lic.slug.toUpperCase()}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {Number(lic.price_multiplier).toFixed(1)}x Multiplier
                  </span>
                  <button
                    onClick={() => openEditModal(lic)}
                    className="p-1 rounded text-slate-400 hover:text-white transition"
                    title="Edit License"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{lic.name}</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                {lic.description || lic.terms_summary || "Standard marketplace digital license agreement."}
              </p>

              {/* Terms list */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Max End Products: <strong className="text-white">{lic.max_end_products > 100 ? "Unlimited" : lic.max_end_products}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Modifications: <strong className="text-white">{lic.can_modify ? "Allowed" : "Prohibited"}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  {lic.can_resell ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>Redistribution / Resell: <strong className="text-white">{lic.can_resell ? "Permitted" : "Strictly Forbidden"}</strong></span>
                </div>
              </div>

              {lic.allowed_uses && lic.allowed_uses.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Permitted Uses
                  </span>
                  <ul className="text-xs text-slate-400 space-y-1">
                    {lic.allowed_uses.slice(0, 3).map((use, i) => (
                      <li key={i}>• {use}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-5 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-medium">Active Template</span>
              <span className="text-slate-500 font-mono">Order: {lic.sort_order}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121c2d] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              {editingLicense ? "Edit License Tier" : "Create License Template"}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Configure contractual permissions and price calculation multiplier.
            </p>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  License Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Agency Pro License"
                  className="w-full bg-[#0a101d] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Terms Summary
                </label>
                <textarea
                  rows={3}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Summary of rights granted to purchaser..."
                  className="w-full bg-[#0a101d] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Price Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formMultiplier}
                    onChange={(e) => setFormMultiplier(Number(e.target.value))}
                    className="w-full bg-[#0a101d] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Max End Products
                  </label>
                  <input
                    type="number"
                    value={formMaxProducts}
                    onChange={(e) => setFormMaxProducts(Number(e.target.value))}
                    className="w-full bg-[#0a101d] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting || !formName.trim()}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/25"
              >
                Save License
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
