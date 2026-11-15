"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  EyeOff,
  User,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const res = await apiGet<any>("/admin/customers/reviews", params);
      const items = res?.reviews || res?.data?.reviews || (Array.isArray(res) ? res : []);
      setReviews(items);
      setPagination(
        res?.pagination || {
          page,
          limit: 15,
          total: items.length,
          totalPages: Math.ceil(items.length / 15) || 1,
        }
      );
    } catch (err) {
      console.error("Failed to load customer reviews", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleModerate = async (reviewId: string, newStatus: string) => {
    try {
      await apiPost(`/admin/customers/reviews/${reviewId}/moderate`, { status: newStatus });
      await loadReviews();
    } catch (err) {
      console.error("Failed to moderate review", err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
            <span>Customer Management</span>
            <span>•</span>
            <span className="text-slate-400">Feedback & Moderation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Star className="w-7 h-7 text-amber-400 fill-amber-400/20" />
            Customer Reviews
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Moderation directory for ratings, feedback, and testimonials submitted by buyers across all marketplace listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadReviews()}
            className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-4 bg-[#0B1120]/70 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by review text or customer name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="">All Review Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending_moderation">Pending Moderation</option>
            <option value="rejected">Rejected</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="w-full bg-[#0B1120]/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-4 px-4">Rating</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Feedback / Comment</th>
                <th className="py-4 px-4">Target Seller</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No customer reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (r.rating || 5) ? "fill-amber-400" : "text-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">
                        {r.rating}.0 out of 5
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/customer-management/${r.author_id || r.customer_id}`}
                        className="font-medium text-white hover:text-amber-400 transition"
                      >
                        {r.author_name || r.customer_name || "Customer"}
                      </Link>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-200">{r.comment || r.review_text || "-"}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-300 whitespace-nowrap">
                      {r.seller_name || "Marketplace Seller"}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          r.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : r.status === "pending_moderation"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleModerate(r.id, "approved")}
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                          title="Approve Review"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleModerate(r.id, "rejected")}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Reject Review"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleModerate(r.id, "hidden")}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition"
                          title="Hide Review"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
            reviews
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-slate-300 transition"
            >
              Previous
            </button>
            <span className="font-semibold text-white px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-slate-300 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
