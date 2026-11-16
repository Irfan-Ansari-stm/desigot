"use strict";
import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { api } from "@/lib/api";
import { ReviewRatingStars } from "./ReviewRatingStars";
import { RiskScoreBadge, VerifiedPurchaseBadge } from "./ReviewStatusBadge";
import { ReviewDetailsDrawer } from "./ReviewDetailsDrawer";

export const PendingReviewsTable: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Multi-select for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [singleRejectId, setSingleRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  // Drawer
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: "pending_moderation"
      });
      if (search) params.append("search", search);

      const res = await api.get(`/admin/reviews/pending?${params.toString()}`);
      if (res.data?.success) {
        setReviews(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error("Error fetching pending reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [page, limit]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(reviews.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSingleApprove = async (id: string, note = "Approved from pending queue") => {
    try {
      await api.post(`/admin/reviews/pending/${id}/approve`, { note });
      await fetchPending();
    } catch (err) {
      console.error("Error approving review:", err);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBatchActionLoading(true);
      await api.post("/admin/reviews/pending/batch-approve", {
        ids: selectedIds,
        note: "Batch approved by moderator"
      });
      await fetchPending();
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleOpenReject = (id: string) => {
    setSingleRejectId(id);
    setRejectReason("");
    setRejectNote("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      setBatchActionLoading(true);
      if (singleRejectId) {
        await api.post(`/admin/reviews/pending/${singleRejectId}/reject`, {
          reason: rejectReason,
          note: rejectNote
        });
      } else if (selectedIds.length > 0) {
        await api.post("/admin/reviews/pending/batch-reject", {
          ids: selectedIds,
          reason: rejectReason,
          note: rejectNote
        });
      }
      setRejectModalOpen(false);
      await fetchPending();
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleOpenDrawer = async (rev: any) => {
    try {
      const res = await api.get(`/admin/reviews/${rev.id}`);
      if (res.data?.success) {
        setSelectedReview(res.data.data);
      } else {
        setSelectedReview(rev);
      }
    } catch {
      setSelectedReview(rev);
    }
    setDrawerOpen(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Top Banner / Batch Actions */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchPending();
            }}
            className="relative w-64"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pending reviews..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="font-semibold text-purple-700 dark:text-purple-300">
                {selectedIds.length} selected
              </span>
              <button
                disabled={batchActionLoading}
                onClick={handleBatchApprove}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition disabled:opacity-50"
              >
                Approve Selected
              </button>
              <button
                disabled={batchActionLoading}
                onClick={() => {
                  setSingleRejectId(null);
                  setRejectReason("");
                  setRejectNote("");
                  setRejectModalOpen(true);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium transition disabled:opacity-50"
              >
                Reject Selected
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            {total} Pending Audits
          </span>
          <button
            onClick={() => fetchPending()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={reviews.length > 0 && selectedIds.length === reviews.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Target Item</th>
              <th className="py-3 px-4">Rating</th>
              <th className="py-3 px-4">Review Content</th>
              <th className="py-3 px-4">Risk & Triggers</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  🎉 All caught up! No pending reviews awaiting moderation audit.
                </td>
              </tr>
            ) : (
              reviews.map((rev) => {
                const isSelected = selectedIds.includes(rev.id);
                return (
                  <tr
                    key={rev.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer ${
                      isSelected ? "bg-purple-50/40 dark:bg-purple-950/20" : ""
                    }`}
                    onClick={() => handleOpenDrawer(rev)}
                  >
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(rev.id)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {rev.review_reference || `REV-${rev.id.slice(0, 6)}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-[180px]">
                      <span className="font-semibold text-slate-900 dark:text-white truncate block">
                        {rev.item_title || "Marketplace Listing"}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-slate-400">
                        {rev.item_type || "product"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ReviewRatingStars rating={rev.rating_overall} showScore />
                    </td>

                    <td className="py-3.5 px-4 max-w-[260px]">
                      {rev.title && (
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {rev.title}
                        </p>
                      )}
                      <p className="text-slate-500 dark:text-slate-400 truncate">
                        {rev.review_text}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <RiskScoreBadge score={rev.risk_score || 0.1} />
                      {rev.moderator_notes && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 truncate max-w-[150px]">
                          {rev.moderator_notes}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {rev.customer_first_name} {rev.customer_last_name}
                      </span>
                      {rev.is_verified_purchase && <VerifiedPurchaseBadge />}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSingleApprove(rev.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenReject(rev.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {reviews.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, total)} of {total.toLocaleString()} pending reviews
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

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Reject Review {singleRejectId ? "Submission" : `(${selectedIds.length} Reviews)`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter the reason for rejection according to marketplace guidelines.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Violation / Rejection Reason *
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Profanity / Inappropriate content / Unverified claims"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Internal Moderator Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Internal audit notes..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={!rejectReason.trim() || batchActionLoading}
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                Confirm Rejection
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
        onApprove={async (id, note) => {
          await handleSingleApprove(id, note);
          setDrawerOpen(false);
        }}
        onReject={async (id, reason, note) => {
          await api.post(`/admin/reviews/${id}/reject`, { reason, note });
          setDrawerOpen(false);
          await fetchPending();
        }}
        onHide={async () => {}}
        onRestore={async () => {}}
      />
    </div>
  );
};
