"use strict";
import React, { useState, useEffect } from "react";
import {
  Search,
  Flag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Eye,
  ArrowUpRight
} from "lucide-react";
import { api } from "@/lib/api";
import { ReviewRatingStars } from "./ReviewRatingStars";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { ReviewDetailsDrawer } from "./ReviewDetailsDrawer";

export const ReportedReviewsTable: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");

  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Investigation/Remove action modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"investigate" | "dismiss" | "remove" | "escalate">("investigate");
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (reasonFilter !== "all") params.append("reason", reasonFilter);

      const res = await api.get(`/admin/reviews/reports?${params.toString()}`);
      if (res.data?.success) {
        setReports(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching review reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, limit, statusFilter, reasonFilter]);

  const handleOpenAction = (type: "investigate" | "dismiss" | "remove" | "escalate", id: string) => {
    setModalType(type);
    setActiveReportId(id);
    setActionReason("");
    setActionModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!activeReportId) return;
    try {
      setActionLoading(true);
      if (modalType === "investigate") {
        await api.post(`/admin/reviews/reports/${activeReportId}/investigate`, { notes: actionReason });
      } else if (modalType === "dismiss") {
        await api.post(`/admin/reviews/reports/${activeReportId}/dismiss`, { notes: actionReason });
      } else if (modalType === "remove") {
        await api.post(`/admin/reviews/reports/${activeReportId}/remove-review`, { reason: actionReason || "Violated guidelines" });
      } else if (modalType === "escalate") {
        await api.post(`/admin/reviews/reports/${activeReportId}/escalate`, { notes: actionReason });
      }
      setActionModalOpen(false);
      await fetchReports();
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDrawer = async (rep: any) => {
    try {
      const res = await api.get(`/admin/reviews/${rep.review_id}`);
      if (res.data?.success) setSelectedReview(res.data.data);
      else setSelectedReview(rep);
    } catch {
      setSelectedReview(rep);
    }
    setDrawerOpen(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchReports();
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search report reference, review, reason..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" />
              {total} Reports Filed
            </span>
            <button
              onClick={() => fetchReports()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
            <span className="text-slate-500 text-[11px] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="investigating">Under Investigation</option>
              <option value="resolved_dismissed">Dismissed</option>
              <option value="resolved_removed">Review Removed</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
            <span className="text-slate-500 text-[11px] font-medium">Reason:</span>
            <select
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Reasons</option>
              <option value="Spam">Spam or Promotional</option>
              <option value="Fake">Fake / Inauthentic</option>
              <option value="Harassment">Harassment / Hate Speech</option>
              <option value="Offensive">Offensive Language</option>
              <option value="Irrelevant">Irrelevant Content</option>
              <option value="Competitor">Competitor Sabotage</option>
              <option value="Privacy">Privacy Violation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Report Ref</th>
              <th className="py-3 px-4">Violation Category</th>
              <th className="py-3 px-4">Report Description</th>
              <th className="py-3 px-4">Reported Review</th>
              <th className="py-3 px-4">Reporter</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Investigation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td colSpan={7} className="py-4 px-4">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No reports found matching criteria.
                </td>
              </tr>
            ) : (
              reports.map((rep) => (
                <tr
                  key={rep.id}
                  onClick={() => handleOpenDrawer(rep)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {rep.report_reference}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(rep.reported_at).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {rep.reason}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-[240px]">
                    <p className="text-slate-600 dark:text-slate-400 truncate">
                      {rep.description || "No description provided."}
                    </p>
                    {rep.investigation_notes && (
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-0.5 truncate">
                        Notes: {rep.investigation_notes}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 max-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        {rep.review_reference}
                      </span>
                      <ReviewRatingStars rating={rep.rating_overall} size="xs" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 truncate text-[11px] mt-0.5">
                      {rep.review_text}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    <span className="block font-medium">
                      {rep.reporter_first_name} {rep.reporter_last_name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {rep.reporter_email}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ReviewStatusBadge status={rep.report_status} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {rep.report_status === "pending" && (
                        <button
                          onClick={() => handleOpenAction("investigate", rep.id)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded text-[11px] font-semibold transition"
                        >
                          Investigate
                        </button>
                      )}

                      {["pending", "investigating"].includes(rep.report_status) && (
                        <>
                          <button
                            onClick={() => handleOpenAction("dismiss", rep.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium transition"
                            title="Dismiss report"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleOpenAction("remove", rep.id)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition"
                            title="Remove review"
                          >
                            Remove Review
                          </button>
                          <button
                            onClick={() => handleOpenAction("escalate", rep.id)}
                            className="p-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded transition"
                            title="Escalate to Legal"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
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
          Showing {reports.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, total)} of {total.toLocaleString()} reports
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 capitalize">
              {modalType === "remove"
                ? "Substantiate Violation & Remove Review"
                : `${modalType} Report`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {modalType === "remove"
                ? "This will remove the review from the marketplace, exclude it from ratings calculations, and record the action in the audit trail."
                : modalType === "dismiss"
                ? "This will dismiss the report as non-violating and restore the review to active published status if no other active reports exist."
                : modalType === "escalate"
                ? "This will flag the review to Trust & Safety and Legal teams for formal subpoena or policy review."
                : "This marks the report under active investigation and updates the review status to Under Investigation."}
            </p>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Moderator Notes / Rationale *
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Document your findings and policy citations..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActionModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || (modalType === "remove" && !actionReason.trim())}
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-white text-xs font-medium rounded-lg disabled:opacity-50 ${
                  modalType === "remove"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Confirm {modalType}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <ReviewDetailsDrawer
        review={selectedReview}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={async () => {}}
        onReject={async () => {}}
        onHide={async () => {}}
        onRestore={async () => {}}
      />
    </div>
  );
};
