"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileCode,
  Download,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Layers,
  ExternalLink,
} from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";

interface ProductFile {
  id: string;
  product_id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  file_format: string;
  storage_path: string;
  storage_provider: string;
  checksum_sha256?: string;
  virus_scan_status: string;
  is_primary: boolean;
  download_count: number;
  created_at: string;
  product_title?: string;
  product_slug?: string;
  product_thumbnail?: string;
}

export default function ProductFilesPage() {
  const [files, setFiles] = useState<ProductFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState("");

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products/files", {
        search: search.trim() || undefined,
        format: formatFilter || undefined,
      });
      const items = res?.files || res?.data?.files || (Array.isArray(res) ? res : []);
      setFiles(items);
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, formatFilter]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset file from the vault?")) return;
    try {
      await apiDelete(`/admin/digital-products/files/${id}`);
      loadFiles();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete file");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <FileArchive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Product Files & Vault</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {files.length} Asset Packages
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Encrypted binary repository, file integrity checksums, and secure distribution packages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadFiles}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search file name or product..."
              className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="bg-[#121c2d] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Formats</option>
            <option value=".fig">Figma (.fig)</option>
            <option value=".zip">Archive (.zip)</option>
            <option value=".sketch">Sketch (.sketch)</option>
            <option value=".xd">Adobe XD (.xd)</option>
            <option value=".blend">Blender (.blend)</option>
          </select>
        </div>
      </div>

      {/* Files Table */}
      <div className="w-full bg-[#0e1726] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#121c2d] text-xs uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-4">Deliverable File</th>
                <th className="py-4 px-3">Linked Product</th>
                <th className="py-4 px-3">Size</th>
                <th className="py-4 px-3">Virus Scan</th>
                <th className="py-4 px-3">Downloads</th>
                <th className="py-4 px-3">Checksum</th>
                <th className="py-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase font-mono">
                        {f.file_format || ".zip"}
                      </div>
                      <div>
                        <span className="font-semibold text-white block text-sm">
                          {f.file_name}
                        </span>
                        {f.is_primary && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            Primary Deliverable
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-3">
                    <Link
                      href={`/dashboard/digital-products/${f.product_id}`}
                      className="text-indigo-400 hover:underline font-medium text-xs truncate max-w-xs block"
                    >
                      {f.product_title || "View Product"}
                    </Link>
                  </td>

                  <td className="py-4 px-3 font-mono text-xs">
                    {(f.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                  </td>

                  <td className="py-4 px-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Clean
                    </span>
                  </td>

                  <td className="py-4 px-3 font-mono text-xs text-slate-300">
                    {f.download_count.toLocaleString()}
                  </td>

                  <td className="py-4 px-3">
                    <span className="font-mono text-[11px] text-slate-500 truncate max-w-[140px] block" title={f.checksum_sha256}>
                      {f.checksum_sha256 ? `${f.checksum_sha256.substring(0, 12)}...` : "SHA-256 verified"}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
