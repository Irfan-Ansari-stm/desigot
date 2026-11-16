"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Download, FileText, Plus, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export function ExportsReportView() {
  const [exportsList, setExportsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [reportType, setReportType] = useState("revenue");
  const [format, setFormat] = useState("csv");
  const [reportName, setReportName] = useState("");

  const loadExports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/admin/analytics/exports", { page: 1, limit: 30 });
      setExportsList(res?.exports || []);
    } catch (err) {
      console.error("Failed to load exports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExports();
  }, [loadExports]);

  const handleCreateExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiPost("/admin/analytics/exports", {
        reportType,
        format,
        reportName: reportName.trim() || undefined,
      });
      setIsModalOpen(false);
      setReportName("");
      await loadExports();
    } catch (err) {
      console.error("Failed to create export:", err);
      alert("Failed to queue export job.");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (id: string, name: string, fmt: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/admin/analytics/exports/${id}/download`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Automated Business Intelligence Export History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generated CSV and JSON report snapshots with audit tracking and expiration management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadExports}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Export</span>
            </button>
          </div>
        </div>

        {loading && !exportsList.length ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading export history logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Report Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3 text-center">Records</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Generated At</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {exportsList.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {exp.report_name}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                      {exp.report_type}
                    </td>
                    <td className="px-4 py-3 uppercase font-mono text-[11px] text-slate-500">
                      {exp.format}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">
                      {exp.record_count?.toLocaleString() || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        exp.status === "completed"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                          : exp.status === "failed"
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                      }`}>
                        {exp.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                        {exp.status === "failed" && <AlertCircle className="h-3 w-3" />}
                        {exp.status !== "completed" && exp.status !== "failed" && <Clock className="h-3 w-3" />}
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(exp.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {exp.status === "completed" ? (
                        <button
                          onClick={() => handleDownload(exp.id, exp.report_name, exp.format)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer text-xs"
                        >
                          <Download className="h-3 w-3" /> Download
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Queue Custom Analytics Export</h3>
            <p className="text-xs text-slate-500">Select parameters to extract real database records into CSV or JSON format.</p>

            <form onSubmit={handleCreateExport} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Report Subject</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                >
                  <option value="revenue">Revenue Breakdown & Ledger</option>
                  <option value="sales">Sales & Fulfillment Orders</option>
                  <option value="services">Service Catalog & Bookings</option>
                  <option value="products">Digital Product Downloads & Sales</option>
                  <option value="sellers">Seller Performance & Payouts</option>
                  <option value="customers">Customer Cohorts & Lifetime Value</option>
                  <option value="commissions">Platform Commission Ledger</option>
                  <option value="conversion">7-Stage Funnel & Conversion Rates</option>
                  <option value="categories">Design Category Performance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">File Format</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {["csv", "json"].map((fmt) => (
                    <button
                      type="button"
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`text-xs p-2 rounded-lg border font-semibold uppercase cursor-pointer ${
                        format === fmt
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Custom Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Executive Marketplace Summary"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {creating ? "Generating..." : "Generate & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
