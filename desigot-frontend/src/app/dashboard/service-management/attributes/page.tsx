"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sliders, Plus, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface ServiceAttribute {
  id: string;
  name: string;
  slug: string;
  description?: string;
  input_type: string;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  is_active: boolean;
  applicable_category_name?: string;
  options: { id: string; label: string; value: string }[];
}

export default function ServiceAttributesPage() {
  const [attributes, setAttributes] = useState<ServiceAttribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    input_type: "select",
    is_required: false,
    is_filterable: true,
    is_searchable: true,
    options: ["Option 1", "Option 2"],
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/admin/services/attributes");
      const list = Array.isArray(data) ? data : data?.attributes || data?.data || [];
      setAttributes(list);
    } catch (err) {
      console.error("Failed to load attributes:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/admin/services/attributes", {
        ...form,
        options: form.options.map((o) => ({ label: o, value: o.toLowerCase().replace(/\s+/g, "_") })),
      });
      setIsModalOpen(false);
      setForm({ name: "", slug: "", input_type: "select", is_required: false, is_filterable: true, is_searchable: true, options: ["Option 1", "Option 2"] });
      await loadData();
    } catch (err) {
      console.error("Failed to create attribute:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Service Attributes</h1>
            <p className="text-sm text-slate-400">
              Structured specification fields (tools, deliverable formats, design style, responsive scope).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Attribute
          </button>
        </div>
      </div>

      {/* Attributes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 py-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading attributes...</p>
          </div>
        ) : (
          attributes.map((attr) => (
            <div
              key={attr.id}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{attr.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">/{attr.slug}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                  {attr.input_type}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  {attr.is_filterable ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  Filterable
                </span>
                <span className="flex items-center gap-1">
                  {attr.is_searchable ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  Searchable
                </span>
              </div>

              {attr.options?.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Defined Options ({attr.options.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {attr.options.map((opt) => (
                      <span
                        key={opt.id}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium"
                      >
                        {opt.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-white">Add Service Attribute</h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Attribute Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Input Type
              </label>
              <select
                value={form.input_type}
                onChange={(e) => setForm({ ...form, input_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="select">Select (Dropdown)</option>
                <option value="multi_select">Multi-Select</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
                <option value="text">Text Input</option>
                <option value="number">Number</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Options (Comma separated)
              </label>
              <textarea
                rows={2}
                value={form.options.join(", ")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
              >
                Create Attribute
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
