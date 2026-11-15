"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ShieldAlert, CheckCircle2, XCircle, Ban, Eye } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api";

interface ServiceReport {
  id: string;
  service_id: string;
  reason: string;
  description: string;
  status: string;
  resolution_notes?: string;
  created_at: string;
  service_title: string;
  service_slug: string;
  service_status: string;
  reporter_name: string;
  reporter_email: string;
  seller_name: string;
  seller_email: string;
  moderator_name?: string;
}

export default function ReportedServicesPage() {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<ServiceReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionChoice, setActionChoice] = useState<"resolve" | "dismiss" | "suspend_service">("resolve");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/admin/services/reports");
      const list = Array.isArray(data) ? data : data?.reports || data?.data || [];
      setReports(list);
    } catch (err) {
      console.error("Failed to load moderation reports:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResolve = async () => {
    if (!activeReport) return;
    try {
      const targetStatus = actionChoice === "dismiss" ? "dismissed" : "resolved";
      await apiPatch(`/admin/services/reports/${activeReport.id}`, {
        status: targetStatus,
        resolution_notes: resolutionNotes || "Reviewed and addressed by moderation team.",
        action_taken: actionChoice,
      });
      setActiveReport(null);
      setResolutionNotes("");
      await loadData();
    } catch (err) {
      console.error("Failed to update report:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Reported Services</h1>
            <p className="text-sm text-slate-400">
              Community and customer incident reports alleging copyright, misrepresentation, or quality violations.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Reports Table Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#1e293b]/70 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-4 px-4">Service</th>
                <th className="py-4 px-4">Reason</th>
                <th className="py-4 px-4">Description</th>
                <th className="py-4 px-4">Reporter</th>
                <th className="py-4 px-4">Seller</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Loading incident reports...</p>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <p className="text-base font-semibold text-slate-400">No active service reports.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      No customer flags or copyright claims pending investigation.
                    </p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 max-w-xs">
                      <Link
                        href={`/dashboard/service-management/${report.service_id}`}
                        className="font-medium text-white hover:text-indigo-400 transition-colors text-xs line-clamp-1 block"
                      >
                        {report.service_title}
                      </Link>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Service ID: {report.service_id.slice(0, 8)}...
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {report.reason.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-xs text-slate-300 line-clamp-2">{report.description}</p>
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <div className="font-medium text-white">{report.reporter_name}</div>
                      <div className="text-[11px] text-slate-500">{report.reporter_email}</div>
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <div className="font-medium text-white">{report.seller_name}</div>
                      <div className="text-[11px] text-slate-500">{report.seller_email}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          report.status === "new"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : report.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setActiveReport(report);
                          setResolutionNotes(report.resolution_notes || "");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Resolution Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" /> Review Incident Report
              </h3>
              <button
                onClick={() => setActiveReport(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="text-slate-400">Target Service:</div>
              <div className="font-bold text-white text-sm">{activeReport.service_title}</div>
              <div className="text-slate-400 pt-2">Claimant Statement:</div>
              <p className="text-slate-200 italic">{activeReport.description}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Administrative Resolution Action
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActionChoice("resolve")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    actionChoice === "resolve"
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  Resolve (Keep Live)
                </button>
                <button
                  type="button"
                  onClick={() => setActionChoice("suspend_service")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    actionChoice === "suspend_service"
                      ? "bg-rose-600/20 border-rose-500 text-rose-300"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  Suspend Service
                </button>
                <button
                  type="button"
                  onClick={() => setActionChoice("dismiss")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    actionChoice === "dismiss"
                      ? "bg-slate-700 border-slate-600 text-slate-200"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  Dismiss (No Action)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Moderator Notes / Reasoning
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Log internal notes regarding this resolution..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                onClick={() => setActiveReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
