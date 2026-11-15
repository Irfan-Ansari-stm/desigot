"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { GitBranch, Plus, RefreshCw, Search, CheckCircle2, Clock, Layers, ArrowUpRight } from "lucide-react";
import { apiGet } from "@/lib/api";

interface ProductVersion {
  id: string;
  product_id: string;
  version_string: string;
  release_notes?: string;
  changelog?: string;
  file_url?: string;
  file_size_bytes?: number;
  is_current: boolean;
  released_at: string;
  download_count: number;
  product_title?: string;
  product_slug?: string;
}

export default function ProductVersionsPage() {
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products/versions");
      const items = res?.versions || res?.data?.versions || (Array.isArray(res) ? res : []);
      setVersions(items);
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const filtered = versions.filter(
    (v) =>
      v.version_string.toLowerCase().includes(search.toLowerCase()) ||
      v.product_title?.toLowerCase().includes(search.toLowerCase()) ||
      v.changelog?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Product Version Control</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {versions.length} Releases
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Semantic version tracking (SemVer), changelog audit trail, and customer upgrade rollback history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadVersions}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex items-center gap-3 shadow-lg max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search version or product..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Versions Table */}
      <div className="w-full bg-[#0e1726] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#121c2d] text-xs uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-4">Release Version</th>
                <th className="py-4 px-3">Product Name</th>
                <th className="py-4 px-3">Status</th>
                <th className="py-4 px-4">Changelog & Notes</th>
                <th className="py-4 px-3">Downloads</th>
                <th className="py-4 px-3">Release Date</th>
                <th className="py-4 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold text-white text-sm bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                      v{v.version_string}
                    </span>
                  </td>

                  <td className="py-4 px-3 font-medium text-white max-w-xs truncate">
                    {v.product_title || "Unknown Asset"}
                  </td>

                  <td className="py-4 px-3">
                    {v.is_current ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Current Stable
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Historical</span>
                    )}
                  </td>

                  <td className="py-4 px-4 max-w-sm">
                    <p className="text-xs text-slate-300 line-clamp-2 font-mono whitespace-pre-line">
                      {v.changelog || v.release_notes || "General maintenance and asset refinement."}
                    </p>
                  </td>

                  <td className="py-4 px-3 font-mono text-xs text-slate-300">
                    {v.download_count?.toLocaleString() || 0}
                  </td>

                  <td className="py-4 px-3 text-xs text-slate-400">
                    {new Date(v.released_at).toLocaleDateString()}
                  </td>

                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/dashboard/digital-products/${v.product_id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition inline-block"
                      title="Inspect Product"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
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
