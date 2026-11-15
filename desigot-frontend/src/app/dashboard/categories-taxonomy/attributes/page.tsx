"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sliders,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Folder,
} from "lucide-react";
import { api } from "@/lib/api";
import { CategoryStatsCards } from "@/components/categories-taxonomy/CategoryStatsCards";
import { CategoryAttributeModal } from "@/components/categories-taxonomy/CategoryAttributeModal";

interface Attribute {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  key: string;
  type: string;
  is_required: boolean;
  is_filterable: boolean;
  is_searchable: boolean;
  allowed_values: any[];
  display_order: number;
}

export default function CategoryAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories/attributes");
      if (res.data?.success) {
        let list = res.data.data.attributes || [];
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(
            (a: Attribute) =>
              a.name?.toLowerCase().includes(q) ||
              a.key?.toLowerCase().includes(q) ||
              a.category_name?.toLowerCase().includes(q)
          );
        }
        setAttributes(list);
      }
    } catch (err) {
      console.error("Failed to load attributes:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAttributes();
    // Load categories for modal default
    api.get("/admin/categories?limit=50").then((res) => {
      if (res.data?.success) {
        const cats = res.data.data.categories || [];
        setCategoryOptions(cats);
        if (cats.length > 0) setSelectedCatId(cats[0].id);
      }
    }).catch(console.error);
  }, [fetchAttributes]);

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attribute definition?")) return;
    try {
      await api.delete(`/admin/categories/attributes/${id}`);
      fetchAttributes();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <CategoryStatsCards />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Dynamic Category Attributes</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {attributes.length} Configured
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Category-specific specifications, filter controls, software tags, and seller creation fields
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAttributes}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Attribute</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attributes by label, key, or assigned category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Attributes Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Attribute Name & Key</th>
                <th className="py-3.5 px-4">Assigned Category</th>
                <th className="py-3.5 px-4">Input Type</th>
                <th className="py-3.5 px-4">Configured Options</th>
                <th className="py-3.5 px-4">Required</th>
                <th className="py-3.5 px-4">Filterable</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-6 bg-slate-800/50 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : attributes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Sliders className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300">No dynamic attributes found</p>
                  </td>
                </tr>
              ) : (
                attributes.map((attr) => (
                  <tr
                    key={attr.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{attr.name}</div>
                      <span className="font-mono text-[11px] text-amber-400">
                        {attr.key}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Link
                        href={`/dashboard/categories-taxonomy/${attr.category_id}`}
                        className="text-xs text-purple-400 hover:underline flex items-center gap-1.5"
                      >
                        <Folder className="w-3.5 h-3.5" />
                        <span>{attr.category_name || "Assigned Category"}</span>
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                        {attr.type?.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {Array.isArray(attr.allowed_values) && attr.allowed_values.length > 0 ? (
                        <span>{attr.allowed_values.length} option(s) defined</span>
                      ) : (
                        <span className="text-slate-600 italic">None (Direct Input)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {attr.is_required ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Optional</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {attr.is_filterable ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Filterable
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">No</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteAttribute(attr.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                        title="Delete Attribute"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attribute Creator Modal */}
      {isModalOpen && selectedCatId && (
        <CategoryAttributeModal
          isOpen={isModalOpen}
          categoryId={selectedCatId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => fetchAttributes()}
        />
      )}
    </div>
  );
}
