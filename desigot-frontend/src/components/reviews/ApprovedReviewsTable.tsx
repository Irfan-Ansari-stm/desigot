"use strict";
import React, { useState, useEffect } from "react";
import {
  Search,
  EyeOff,
  CheckCircle2,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Star
} from "lucide-react";
import { api } from "@/lib/api";
import { ReviewRatingStars } from "./ReviewRatingStars";
import { ReviewStatusBadge, VerifiedPurchaseBadge } from "./ReviewStatusBadge";
import { ReviewDetailsDrawer } from "./ReviewDetailsDrawer";

export const ApprovedReviewsTable: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [targetHideId, setTargetHideId] = useState<string | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApproved = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: "approved"
      });
      if (search) params.append("search", search);
      if (ratingFilter !== "all") params.append("rating", ratingFilter);

      const res = await api.get(`/admin/reviews/approved?${params.toString()}`);
      if (res.data?.success) {
        setReviews(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching approved reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, [page, limit, ratingFilter]);

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

  const handleOpenHide = (id: string) => {
    setTargetHideId(id);
    setHideReason("");
    setHideModalOpen(true);
  };

  const handleConfirmHide = async () => {
    if (!targetHideId) return;
    try {
      setActionLoading(true);
      await api.post(`/admin/reviews/approved/${targetHideId}/hide`, {
        reason: hideReason || "Administratively hidden"
      });
      setHideModalOpen(false);
      await fetchApproved();
    } finally {
      setActionLoading(false);
    }
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
              fetchApproved();
            }}
            className="relative w-64"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search approved reviews..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Stars</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {total} Active Published
          </span>
          <button
            onClick={() => fetchApproved()}
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
              <th className="py-3 px-4">Review Content</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Seller</th>
              <th className="py-3 px-4 text-right">Actions</th>
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
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No approved reviews found.
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
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-[200px]">
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">
                      {rev.item_title || "Marketplace Item"}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-slate-400">
                      {rev.item_type || "product"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ReviewRatingStars rating={rev.rating_overall} showScore />
                  </td>

                  <td className="py-3.5 px-4 max-w-[280px]">
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
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {rev.customer_first_name} {rev.customer_last_name}
                    </span>
                    {rev.is_verified_purchase && <VerifiedPurchaseBadge />}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {rev.seller_first_name} {rev.seller_last_name}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenHide(rev.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-medium flex items-center gap-1 ml-auto transition"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      Hide Review
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
          Showing {reviews.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, total)} of {total.toLocaleString()} approved reviews
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

      {/* Hide Modal */}
      {hideModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Hide Approved Review
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Hiding this review will remove it from the public marketplace and automatically exclude its star rating from product and seller rating calculations.
            </p>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Reason for Hiding
              </label>
              <input
                type="text"
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                placeholder="e.g. Under order dispute investigation / Requested by customer"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setHideModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmHide}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                Confirm Hide
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
        onHide={async (id, reason) => {
          await api.post(`/admin/reviews/approved/${id}/hide`, { reason });
          setDrawerOpen(false);
          await fetchApproved();
        }}
        onRestore={async () => {}}
      />
    </div>
  );
};
