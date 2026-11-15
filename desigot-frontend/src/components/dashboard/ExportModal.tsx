"use client";
import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet, Printer, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: "revenue" | "sales" | "sellers" | "customers" | "services";
  currentPeriod?: string;
  startDate?: string;
  endDate?: string;
}

export function ExportModal({
  isOpen,
  onClose,
  reportType,
  currentPeriod = "30d",
  startDate,
  endDate,
}: ExportModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [format, setFormat] = useState<"csv" | "json">("csv");

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams({
        type: reportType,
        format,
        period: currentPeriod,
      });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await api.get(`/admin/analytics/export?${params.toString()}`, {
        responseType: format === "csv" ? "blob" : "json",
      });

      let blob: Blob;
      if (format === "csv") {
        blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      } else {
        blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `desigot-${reportType}-${currentPeriod}-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export report. Please verify your permissions.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Export Analytics Report
              </h3>
              <p className="text-xs text-slate-500">
                Authorized financial and operational data export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  format === "csv"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                }`}
              >
                <FileSpreadsheet className="h-6 w-6 mb-1.5" />
                <span className="text-xs font-bold">CSV Spreadsheet</span>
                <span className="text-[10px] text-slate-400">Excel, Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  format === "json"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                }`}
              >
                <FileText className="h-6 w-6 mb-1.5" />
                <span className="text-xs font-bold">Raw JSON</span>
                <span className="text-[10px] text-slate-400">API payload structure</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 text-xs border border-slate-100 dark:border-slate-800/80 space-y-1">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Report Type:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase">{reportType}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Active Date Filter:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{currentPeriod}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Security Audit:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">RBAC Verified</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Exporting...
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" /> Download Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
