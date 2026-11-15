"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Download, RefreshCw, Search, ShieldCheck, CheckCircle2, XCircle, Clock, ExternalLink, Key } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface DownloadEvent {
  id: string;
  product_id: string;
  product_title?: string;
  file_name?: string;
  file_format?: string;
  user_name?: string;
  user_email?: string;
  ip_address: string;
  user_agent?: string;
  downloaded_at: string;
  status: string;
  file_version: string;
}

export default function ProductDownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Signed link generator tester modal
  const [signedUrlModal, setSignedUrlModal] = useState(false);
  const [testProductId, setTestProductId] = useState("");
  const [generatedLink, setGeneratedLink] = useState<{ downloadUrl: string; fileName: string; expiresAt: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadDownloads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/admin/digital-products/downloads");
      const items = res?.downloads || res?.data?.downloads || (Array.isArray(res) ? res : []);
      setDownloads(items);
      if (items.length > 0 && !testProductId) {
        setTestProductId(items[0].product_id);
      }
    } catch (err) {
      console.error("Failed to load downloads:", err);
    } finally {
      setIsLoading(false);
    }
  }, [testProductId]);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const handleGenerateSignedUrl = async () => {
    if (!testProductId) return;
    setIsGenerating(true);
    try {
      // First get files for this product
      const pRes = await apiGet<any>(`/admin/digital-products/${testProductId}`);
      const prod = pRes?.data || pRes;
      const fileId = prod?.files?.[0]?.id;

      const signRes = await apiPost<any>("/admin/digital-products/downloads/signed-url", {
        productId: testProductId,
        fileId: fileId,
      });

      setGeneratedLink(signRes?.data || signRes);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to generate signed download token");
    } finally {
      setIsGenerating(false);
    }
  };

  const filtered = downloads.filter(
    (d) =>
      d.product_title?.toLowerCase().includes(search.toLowerCase()) ||
      d.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      d.ip_address?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Product Downloads & Delivery</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {downloads.length} Events Logged
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Real-time audit log of digital file delivery, HMAC-signed token issuance, and IP address telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDownloads}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
          <button
            onClick={() => setSignedUrlModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25"
          >
            <Key className="w-4 h-4" />
            Test Signed Delivery URL
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex items-center gap-3 shadow-lg max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product, user email, or IP..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Downloads Table */}
      <div className="w-full bg-[#0e1726] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#121c2d] text-xs uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-3">Asset Downloaded</th>
                <th className="py-4 px-3">Version</th>
                <th className="py-4 px-3">IP Address</th>
                <th className="py-4 px-3">Status</th>
                <th className="py-4 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <span className="font-semibold text-white block text-sm">
                        {d.user_name || "Verified Customer"}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {d.user_email || "buyer@desigot.com"}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-3">
                    <span className="font-medium text-white block text-sm max-w-xs truncate">
                      {d.product_title || "Design Bundle"}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {d.file_name || "main-deliverable.fig"}
                    </span>
                  </td>

                  <td className="py-4 px-3 font-mono text-xs">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      v{d.file_version || "1.0.0"}
                    </span>
                  </td>

                  <td className="py-4 px-3 font-mono text-xs text-slate-400">
                    {d.ip_address}
                  </td>

                  <td className="py-4 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Success
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right text-xs text-slate-400 font-mono">
                    {new Date(d.downloaded_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signed Delivery Link Modal */}
      {signedUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121c2d] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Secure Signed Download URL Simulator</h3>
            <p className="text-sm text-slate-400 mb-4">
              Simulate customer entitlement verification and generate an ephemeral 15-minute signed token URL.
            </p>

            <button
              onClick={handleGenerateSignedUrl}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25 mb-4"
            >
              {isGenerating ? "Validating Entitlement..." : "Generate Signed Token URL"}
            </button>

            {generatedLink && (
              <div className="p-4 rounded-xl bg-[#0a101d] border border-slate-700 space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>File: <strong className="text-white">{generatedLink.fileName}</strong></span>
                  <span className="text-amber-400">Expires: {new Date(generatedLink.expiresAt).toLocaleTimeString()}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300 break-all select-all">
                  {generatedLink.downloadUrl}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSignedUrlModal(false);
                  setGeneratedLink(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
