"use strict";
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Paperclip,
  RefreshCw,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import { ReviewRatingStars } from "./ReviewRatingStars";
import { ReviewStatusBadge, RiskScoreBadge, VerifiedPurchaseBadge } from "./ReviewStatusBadge";
import { ReviewDetailsDrawer } from "./ReviewDetailsDrawer";

export const ReviewsTable: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("DESC");

  // Selected review for drawer
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort_by: sortBy,
        sort_dir: sortDir
      });
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (ratingFilter !== "all") params.append("rating", ratingFilter);
      if (typeFilter !== "all") params.append("entity_type", typeFilter);
      if (verifiedFilter !== "all") params.append("verified", verifiedFilter);

      const res = await api.get(`/admin/reviews?${params.toString()}`);
      if (res.data?.success) {
        setReviews(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, limit, statusFilter, ratingFilter, typeFilter, verifiedFilter, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
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

  const handleApprove = async (id: string, note?: string) => {
    await api.post(`/admin/reviews/${id}/approve`, { note });
    await fetchReviews();
    if (selectedReview?.id === id) {
      setSelectedReview((prev: any) => ({ ...prev, status: "approved", visibility_status: "visible" }));
    }
  };

  const handleReject = async (id: string, reason: string, note?: string) => {
    await api.post(`/admin/reviews/${id}/reject`, { reason, note });
    await fetchReviews();
    if (selectedReview?.id === id) {
      setSelectedReview((prev: any) => ({ ...prev, status: "rejected", rejection_reason: reason }));
    }
  };

  const handleHide = async (id: string, reason: string) => {
    await api.post(`/admin/reviews/${id}/hide`, { reason });
    await fetchReviews();
    if (selectedReview?.id === id) {
      setSelectedReview((prev: any) => ({ ...prev, status: "hidden", visibility_status: "hidden" }));
    }
  };

  const handleRestore = async (id: string, reason: string) => {
    await api.post(`/admin/reviews/${id}/restore`, { reason });
    await fetchReviews();
    if (selectedReview?.id === id) {
      setSelectedReview((prev: any) => ({ ...prev, status: "approved", visibility_status: "visible" }));
    }
  };

  const handleExportCSV = () => {
    if (reviews.length === 0) return;
    const headers = ["Reference", "Item", "Type", "Rating", "Customer", "Seller", "Status", "Date"];
    const rows = reviews.map((r) => [
      r.review_reference || r.id,
      `"${(r.item_title || "").replace(/"/g, '""')}"`,
      r.item_type || "product",
      r.rating_overall,
      `"${r.customer_first_name || ""} ${r.customer_last_name || ""}"`,
      `"${r.seller_first_name || ""} ${r.seller_last_name || ""}"`,
      r.status,
      new Date(r.created_at).toISOString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `desigot-reviews-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Control Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, customer, seller, item, keywords..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </form>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => fetchReviews()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Refresh reviews"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Status filter */}
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
              <option value="approved">Approved</option>
              <option value="pending_moderation">Pending Audit</option>
              <option value="rejected">Rejected</option>
              <option value="hidden">Hidden</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="removed">Removed</option>
            </select>
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
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

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
            <span className="text-slate-500 text-[11px] font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Items</option>
              <option value="product">Digital Products</option>
              <option value="service">Services</option>
            </select>
          </div>

          {/* Verified buyer */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
            <span className="text-slate-500 text-[11px] font-medium">Verified:</span>
            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Buyers</option>
              <option value="true">Verified Purchases</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg ml-auto">
            <span className="text-slate-500 text-[11px] font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="created_at">Date Created</option>
              <option value="rating_overall">Rating Score</option>
              <option value="helpful_count">Most Helpful</option>
              <option value="risk_score">Highest Risk</option>
              <option value="reported_count">Most Reported</option>
            </select>
            <button
              onClick={() => setSortDir(sortDir === "ASC" ? "DESC" : "ASC")}
              className="font-mono font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white px-1"
            >
              {sortDir === "ASC" ? "↑" : "↓"}
            </button>
          </div>
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
              <th className="py-3 px-4">Review Preview</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Seller</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No reviews found matching the selected filters.
                </td>
              </tr>
            ) : (
              reviews.map((rev) => (
                <tr
                  key={rev.id}
                  onClick={() => handleOpenDrawer(rev)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                >
                  {/* Reference */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {rev.review_reference || `REV-${rev.id.slice(0, 6)}`}
                      </span>
                      {rev.pinned && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-bold">
                          PIN
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </td>

                  {/* Target item */}
                  <td className="py-3.5 px-4 max-w-[200px]">
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">
                      {rev.item_title || "Marketplace Purchase"}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {rev.item_type || "product"}
                    </span>
                  </td>

                  {/* Rating */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ReviewRatingStars rating={rev.rating_overall} showScore />
                    {rev.risk_score >= 0.5 && (
                      <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                        High Risk ({(rev.risk_score * 100).toFixed(0)}%)
                      </span>
                    )}
                  </td>

                  {/* Review preview */}
                  <td className="py-3.5 px-4 max-w-[280px]">
                    {rev.title && (
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {rev.title}
                      </p>
                    )}
                    <p className="text-slate-500 dark:text-slate-400 truncate">
                      {rev.review_text}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      {rev.attachments_count > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400">
                          <Paperclip className="w-2.5 h-2.5" />
                          {rev.attachments_count} files
                        </span>
                      )}
                      {rev.seller_response && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ✓ Responded
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {rev.customer_first_name} {rev.customer_last_name}
                    </span>
                    {rev.is_verified_purchase && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Verified
                      </span>
                    )}
                  </td>

                  {/* Seller */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {rev.seller_first_name} {rev.seller_last_name}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ReviewStatusBadge status={rev.status} size="sm" />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenDrawer(rev)}
                        className="px-2.5 py-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-[11px] font-medium transition"
                      >
                        Inspect
                      </button>

                      {rev.status !== "approved" && (
                        <button
                          onClick={() => handleApprove(rev.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition"
                          title="Approve Review"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {rev.status === "approved" && (
                        <button
                          onClick={() => handleHide(rev.id, "Quick hide")}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                          title="Hide Review"
                        >
                          <EyeOff className="w-4 h-4" />
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

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {reviews.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, total)} of {total.toLocaleString()} reviews
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide-over Drawer */}
      <ReviewDetailsDrawer
        review={selectedReview}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onHide={handleHide}
        onRestore={handleRestore}
      />
    </div>
  );
};
