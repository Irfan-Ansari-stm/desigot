"use strict";
import React, { useState, useEffect } from "react";
import {
  Search,
  RotateCcw,
  Trash2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";
import { ReviewRatingStars } from "./ReviewRatingStars";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { ReviewDetailsDrawer } from "./ReviewDetailsDrawer";

export const RejectedReviewsTable: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [targetRestoreId, setTargetRestoreId] = useState<string | null>(null);
  const [restoreReason, setRestoreReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRejected = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: "rejected"
      });
      if (search) params.append("search", search);

      const res = await api.get(`/admin/reviews/rejected?${params.toString()}`);
      if (res.data?.success) {
        setReviews(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching rejected reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejected();
  }, [page, limit]);

  const handleOpenDrawer = async (rev: any) => {
    try {
      const res = await api.get(`/admin/reviews/${rev.id}`);
      if (res.data?.success) setSelectedReview(res.data.data);
      else setSelectedReview(rev);
    } catch {
      setSelectedReview(rev);
    }
    setDrawerOpen(true);
  };

  const handleOpenRestore = (id: string) => {
    setTargetRestoreId(id);
    setRestoreReason("");
    setRestoreModalOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!targetRestoreId) return;
    try {
      setActionLoading(true);
      await api.post(`/admin/reviews/rejected/${targetRestoreId}/restore`, {
        reason: restoreReason || "Review reconsidered and restored by administrator"
      });
      setRestoreModalOpen(false);
      await fetchRejected();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently remove this rejected review record?")) return;
    try {
      await api.delete(`/admin/reviews/rejected/${id}`);
      await fetchRejected();
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchRejected();
          }}
          className="relative w-64"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rejected reviews..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            {total} Rejected Reviews
          </span>
          <button
            onClick={() => fetchRejected()}
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
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Target Item</th>
              <th className="py-3 px-4">Rating</th>
              <th className="py-3 px-4">Review Text</th>
              <th className="py-3 px-4">Rejection Reason</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4 text-right">Reconsider Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td colSpan={7} className="py-4 px-4">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No rejected reviews found.
                </td>
              </tr>
            ) : (
              reviews.map((rev) => (
                <tr
                  key={rev.id}
                  onClick={() => handleOpenDrawer(rev)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {rev.review_reference || `REV-${rev.id.slice(0, 6)}`}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Rejected: {rev.rejected_at ? new Date(rev.rejected_at).toLocaleDateString() : new Date(rev.updated_at).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-[180px]">
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">
                      {rev.item_title || "Marketplace Listing"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ReviewRatingStars rating={rev.rating_overall} showScore />
                  </td>

                  <td className="py-3.5 px-4 max-w-[220px]">
                    <p className="text-slate-600 dark:text-slate-400 truncate">
                      {rev.review_text}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 max-w-[220px]">
                    <span className="font-semibold text-rose-600 dark:text-rose-400 truncate block">
                      {rev.rejection_reason || "Policy violation"}
                    </span>
                    {rev.moderator_notes && (
                      <span className="text-[10px] text-slate-400 block truncate">
                        {rev.moderator_notes}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {rev.customer_first_name} {rev.customer_last_name}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenRestore(rev.id)}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reconsider & Restore
                      </button>
                      <button
                        onClick={() => handleDelete(rev.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
          Showing {reviews.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, total)} of {total.toLocaleString()} rejected reviews
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

      {/* Restore Modal */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Restore Rejected Review
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Restoring this review will mark it as Approved, make it visible on the marketplace, and recalculate target product and seller rating averages.
            </p>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Reconsideration Note / Justification
              </label>
              <input
                type="text"
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
                placeholder="e.g. Seller clarified misunderstanding; evidence verified."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRestoreModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmRestore}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                Confirm Restore
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
        onRestore={async (id, reason) => {
          await api.post(`/admin/reviews/rejected/${id}/restore`, { reason });
          setDrawerOpen(false);
          await fetchRejected();
        }}
      />
    </div>
  );
};
