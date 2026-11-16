"use strict";
import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  MessageSquare,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2
} from "lucide-react";
import { api } from "@/lib/api";
import { ReviewRatingStars } from "./ReviewRatingStars";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { ReviewDetailsDrawer } from "./ReviewDetailsDrawer";

export const SellerResponsesTable: React.FC = () => {
  const [responses, setResponses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await api.get(`/admin/reviews/responses?${params.toString()}`);
      if (res.data?.success) {
        setResponses(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching seller responses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [page, limit, statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/admin/reviews/responses/${id}/approve`, {
        note: "Approved by administrator"
      });
      await fetchResponses();
    } catch (err) {
      console.error("Error approving response:", err);
    }
  };

  const handleOpenReject = (id: string) => {
    setRejectId(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await api.post(`/admin/reviews/responses/${rejectId}/reject`, {
        reason: rejectReason
      });
      setRejectModalOpen(false);
      await fetchResponses();
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReview = async (reviewId: string) => {
    try {
      const res = await api.get(`/admin/reviews/${reviewId}`);
      if (res.data?.success) setSelectedReview(res.data.data);
    } catch (err) {
      console.error(err);
    }
    setDrawerOpen(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchResponses();
            }}
            className="relative w-64"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search response text, seller..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Responses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved & Visible</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            {total} Total Responses
          </span>
          <button
            onClick={() => fetchResponses()}
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
              <th className="py-3 px-4">Response Ref</th>
              <th className="py-3 px-4">Seller</th>
              <th className="py-3 px-4">Seller Response Text</th>
              <th className="py-3 px-4">Associated Review</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Moderation Actions</th>
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
            ) : responses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No seller responses found.
                </td>
              </tr>
            ) : (
              responses.map((resp) => (
                <tr
                  key={resp.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  onClick={() => handleOpenReview(resp.review_id)}
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {resp.response_reference || `RSP-${resp.id.slice(0, 6)}`}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(resp.created_at).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {resp.seller_first_name} {resp.seller_last_name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {resp.seller_email}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-[280px]">
                    <p className="text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                      "{resp.response_text}"
                    </p>
                    {resp.rejection_reason && (
                      <span className="text-[10px] text-rose-600 block mt-0.5">
                        Rejected: {resp.rejection_reason}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 max-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        {resp.review_reference}
                      </span>
                      <ReviewRatingStars rating={resp.rating_overall} size="xs" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 truncate text-[11px] mt-0.5">
                      {resp.review_text}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {resp.customer_first_name} {resp.customer_last_name}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ReviewStatusBadge status={resp.status} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {resp.status !== "approved" && (
                        <button
                          onClick={() => handleApprove(resp.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}

                      {resp.status !== "rejected" && (
                        <button
                          onClick={() => handleOpenReject(resp.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
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
          Showing {responses.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, total)} of {total.toLocaleString()} seller responses
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
              Reject Seller Response
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Specify the reason why this seller response violates the marketplace professional communication guidelines.
            </p>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Rejection Reason *
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Inappropriate / defensive tone / contact info sharing"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !rejectReason.trim()}
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
        onApprove={async () => {}}
        onReject={async () => {}}
        onHide={async () => {}}
        onRestore={async () => {}}
      />
    </div>
  );
};
