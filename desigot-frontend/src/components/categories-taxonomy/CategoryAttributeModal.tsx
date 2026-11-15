"use client";

import React, { useState } from "react";
import { Sliders, X, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  isOpen: boolean;
  categoryId: string;
  categoryName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryAttributeModal({
  isOpen,
  categoryId,
  categoryName,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [type, setType] = useState("single_select");
  const [isRequired, setIsRequired] = useState(false);
  const [isFilterable, setIsFilterable] = useState(true);
  const [isSearchable, setIsSearchable] = useState(true);
  const [options, setOptions] = useState<{ label: string; value: string }[]>([
    { label: "Option 1", value: "option_1" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key) {
      setKey(val.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, ""));
    }
  };

  const addOption = () => {
    setOptions([...options, { label: "", value: "" }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: "label" | "value", val: string) => {
    const next = [...options];
    next[index][field] = val;
    if (field === "label" && !next[index].value) {
      next[index].value = val.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    }
    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await api.post("/admin/categories/attributes", {
        category_id: categoryId,
        name: name.trim(),
        key: key.trim().toLowerCase(),
        type,
        is_required: isRequired,
        is_filterable: isFilterable,
        is_searchable: isSearchable,
        allowed_values: ["single_select", "multi_select"].includes(type) ? options.filter((o) => o.label) : [],
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create category attribute");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Dynamic Category Attribute</h3>
              <p className="text-xs text-slate-400">{categoryName || "Target Category"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Attribute Label *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Design Software"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Database Key *
              </label>
              <input
                type="text"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. design_software"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Attribute Input Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="single_select">Single Select (Dropdown / Radio)</option>
              <option value="multi_select">Multi Select (Pills / Checkboxes)</option>
              <option value="boolean">Boolean Toggle (Yes / No)</option>
              <option value="number">Numeric Integer</option>
              <option value="text">Short Text</option>
              <option value="textarea">Long Textarea</option>
            </select>
          </div>

          {["single_select", "multi_select"].includes(type) && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Allowed Selection Options</span>
                <button
                  type="button"
                  onClick={addOption}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Option</span>
                </button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Display Label"
                      value={opt.label}
                      onChange={(e) => updateOption(idx, "label", e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="key_value"
                      value={opt.value}
                      onChange={(e) => updateOption(idx, "value", e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
              />
              <span>Required</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isFilterable}
                onChange={(e) => setIsFilterable(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
              />
              <span>Filterable</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isSearchable}
                onChange={(e) => setIsSearchable(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
              />
              <span>Searchable</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Attribute</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
