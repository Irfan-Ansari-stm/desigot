"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Scale,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Upload,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { CommunicationStatusBadge } from "./CommunicationStatusBadge";

export function DisputeDataTable() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Detail Modal
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [disputeDetail, setDisputeDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Resolution Form
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolutionType, setResolutionType] = useState("customer_favor");
  const [outcome, setOutcome] = useState("full_refund");
  const [resolutionReason, setResolutionReason] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/admin/communication/disputes", {
        page,
        limit: 15,
        search: search || undefined,
        status: status || undefined,
        category: category || undefined,
      });
      setDisputes(res?.disputes || []);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load disputes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, [page, status, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadDisputes();
  };

  const handleOpenDispute = async (id: string) => {
    setSelectedDisputeId(id);
    setDetailLoading(true);
    try {
      const data = await apiGet<any>(`/admin/communication/disputes/${id}`);
      setDisputeDetail(data);
    } catch (err) {
      console.error("Failed to load dispute detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExecuteResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeId || !resolutionReason.trim()) return;

    setIsResolving(true);
    try {
      await apiPost(`/admin/communication/disputes/${selectedDisputeId}/resolve`, {
        resolution_type: resolutionType,
        outcome,
        resolution_reason: resolutionReason.trim(),
      });
      alert("Dispute decision officially resolved and recorded in audit log. Notice: Payment refund transactions must be verified via Refund Management.");
      setIsResolveOpen(false);
      handleOpenDispute(selectedDisputeId);
      loadDisputes();
    } catch (err) {
      console.error("Dispute resolution failed:", err);
      alert("Resolution failed");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-500" />
            Marketplace Disputes & Mediation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Impartial investigation of customer-seller order claims, quality disputes, and deliverable reviews
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, customer, seller..."
              className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </form>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="service_delivery">Service Delivery</option>
            <option value="digital_product">Digital Product</option>
            <option value="quality">Quality Dispute</option>
            <option value="order_cancellation">Cancellation</option>
            <option value="chargeback">Chargeback</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Dispute ID</th>
              <th className="py-3 px-4">Related Order</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Seller</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Claim Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Investigator</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={9} className="py-4 px-4 h-12 bg-slate-50/50 dark:bg-slate-900/50" />
                </tr>
              ))
            ) : disputes.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                  No disputes match the criteria.
                </td>
              </tr>
            ) : (
              disputes.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => handleOpenDispute(d.id)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {d.dispute_reference}
                  </td>

                  <td className="py-3.5 px-4 max-w-xs truncate">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {d.order_title || `Order #${(d.order_id || '').slice(0, 8)}`}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{d.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{d.customer_email}</div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{d.seller_name || "—"}</div>
                    <div className="text-[11px] text-slate-400">{d.seller_email}</div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                    {(d.dispute_category || d.reason || "General").replace(/_/g, " ")}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                    ${((d.dispute_amount_cents || 0) / 100).toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={d.status} type="status" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {d.investigator_name ? (
                      <span className="font-medium text-slate-800 dark:text-slate-200">{d.investigator_name}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenDispute(d.id)}
                      className="py-1 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-colors"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          Page {page} of {pagination.totalPages || 1} ({pagination.total} disputes)
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dispute Investigation & Evidence Drawer */}
      {selectedDisputeId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-semibold text-xs text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200/50">
                    {disputeDetail?.dispute_reference}
                  </span>
                  <CommunicationStatusBadge status={disputeDetail?.status} type="status" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {disputeDetail?.order_title || "Marketplace Dispute"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {disputeDetail?.status !== "resolved" && (
                  <button
                    onClick={() => setIsResolveOpen(true)}
                    className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Resolve Dispute</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedDisputeId(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Context Stats */}
            <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Claim Amount:</span>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  ${((disputeDetail?.dispute_amount_cents || 0) / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Customer:</span>
                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{disputeDetail?.customer_name}</div>
              </div>
              <div>
                <span className="text-slate-400">Seller:</span>
                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{disputeDetail?.seller_name || "—"}</div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <>
                  {/* Case Description */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Claim Details</span>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                      {disputeDetail?.description}
                    </p>
                  </div>

                  {/* Evidence Exhibits */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span>Submitted Evidence & Exhibits ({disputeDetail?.evidence?.length || 0})</span>
                      </div>
                    </h4>

                    <div className="space-y-2">
                      {disputeDetail?.evidence?.length === 0 ? (
                        <div className="text-slate-400 text-xs italic py-2">No evidence uploaded yet.</div>
                      ) : (
                        disputeDetail?.evidence?.map((ev: any) => (
                          <div
                            key={ev.id}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-indigo-500" />
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100">{ev.title}</div>
                                <div className="text-[11px] text-slate-400">{ev.uploader_name} • {ev.party_type}</div>
                              </div>
                            </div>
                            <a
                              href={ev.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>View File</span>
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Investigation Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Investigation Activity Log ({disputeDetail?.timeline?.length || 0})</span>
                    </h4>

                    <div className="space-y-2">
                      {disputeDetail?.timeline?.map((ev: any) => (
                        <div key={ev.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
                          <div className="flex items-center justify-between mb-0.5 text-[11px]">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                              {ev.event_type?.replace(/_/g, " ")}
                            </span>
                            <span className="text-slate-400">{new Date(ev.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">{ev.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolution Dialog Modal */}
      {isResolveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-500" />
                Resolve Marketplace Dispute
              </h3>
              <button onClick={() => setIsResolveOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong>Compliance Safety Notice:</strong> This action records the mediation decision and locks the case. Financial refunds must proceed through the Refund Management platform.
              </div>
            </div>

            <form onSubmit={handleExecuteResolution} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Decision Type
                </label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="customer_favor">Customer Favor (Approved Claim)</option>
                  <option value="seller_favor">Seller Favor (Milestone Met)</option>
                  <option value="partial_refund">Partial Refund Agreement</option>
                  <option value="full_refund">Full Refund Agreement</option>
                  <option value="rework_redelivery">Rework / Redelivery Required</option>
                  <option value="mutual_agreement">Mutual Settlement Agreement</option>
                  <option value="other_policy">Other Policy-Based Decision</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Financial Outcome Flag
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="full_refund">Full Refund Recommendation</option>
                  <option value="partial_refund">Partial Refund Recommendation</option>
                  <option value="no_refund">No Refund (Funds Released)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Findings & Reason
                </label>
                <textarea
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  placeholder="Summarize the mediator findings, policy rules applied, and deliverable review notes..."
                  rows={4}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResolveOpen(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving || !resolutionReason.trim()}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Resolution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
