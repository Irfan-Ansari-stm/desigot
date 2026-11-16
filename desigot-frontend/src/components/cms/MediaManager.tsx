"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Image as ImageIcon, Upload, Trash2, Copy, Check, Search, FileText } from "lucide-react";

export const MediaManager: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, [search, fileType]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/media", {
        params: { search: search || undefined, file_type: fileType || undefined, limit: 40 }
      });
      if (res.data?.data) {
        setAssets(res.data.data);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load media assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete media asset "${name}"?`)) return;
    try {
      await api.delete(`/admin/cms/media/${id}`);
      fetchMedia();
    } catch (err) {
      alert("Failed to delete media asset");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-600" />
            Media Assets Library ({total} Assets)
          </h2>
          <p className="text-xs text-slate-500">
            Centralized cloud asset storage for hero mockups, icons, badges, and documentation.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by filename or alt text..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Asset Types</option>
          <option value="image">Images</option>
          <option value="document">Documents & PDFs</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading media library...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative group">
                {asset.file_type === "image" ? (
                  <img
                    src={asset.file_url}
                    alt={asset.alt_text || asset.file_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <FileText className="w-10 h-10 text-slate-400" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyUrl(asset.id, asset.file_url)}
                    className="p-1.5 rounded-lg bg-white/90 text-slate-800 text-xs font-bold"
                    title="Copy URL"
                  >
                    {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id, asset.file_name)}
                    className="p-1.5 rounded-lg bg-rose-600/90 text-white text-xs font-bold"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 space-y-1">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white block truncate" title={asset.file_name}>
                  {asset.file_name}
                </span>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{(asset.file_size_bytes / 1024).toFixed(0)} KB</span>
                  <span className="uppercase">{asset.file_type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
