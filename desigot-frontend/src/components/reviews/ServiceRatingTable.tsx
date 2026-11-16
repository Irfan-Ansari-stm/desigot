"use strict";
import React, { useState, useEffect } from "react";
import {
  Search,
  Star,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  SlidersHorizontal
} from "lucide-react";
import { api } from "@/lib/api";
import { ReviewRatingStars, RatingHistogramBar } from "./ReviewRatingStars";

export const ServiceRatingTable: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState("all");
  const [sortBy, setSortBy] = useState("average_rating");
  const [sortDir, setSortDir] = useState("DESC");

  const [recalcId, setRecalcId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort_by: sortBy,
        sort_dir: sortDir
      });
      if (search) params.append("search", search);
      if (minRating !== "all") params.append("min_rating", minRating);

      const res = await api.get(`/admin/reviews/services/ratings?${params.toString()}`);
      if (res.data?.success) {
        setServices(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching service ratings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [page, limit, minRating, sortBy, sortDir]);

  const handleRecalculate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRecalcId(id);
      await api.post(`/admin/reviews/services/${id}/recalculate`);
      await fetchServices();
    } catch (err) {
      console.error(err);
    } finally {
      setRecalcId(null);
    }
  };

  const handleExportCSV = () => {
    if (services.length === 0) return;
    const headers = ["Title", "Seller", "Avg Rating", "Total Reviews", "Verified Reviews", "Recommendation %", "Total Orders", "Starting Price (Cents)"];
    const rows = services.map((s) => [
      `"${s.title.replace(/"/g, '""')}"`,
      `"${s.seller_first_name} ${s.seller_last_name}"`,
      s.average_rating,
      s.total_reviews,
      s.verified_reviews,
      `${s.recommendation_percentage}%`,
      s.total_orders,
      s.starting_price_cents
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `desigot-service-ratings-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              fetchServices();
            }}
            className="relative w-64"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search design services..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Min Rating:</span>
            <select
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="4.5">≥ 4.5 Stars</option>
              <option value="4.0">≥ 4.0 Stars</option>
              <option value="3.0">≥ 3.0 Stars</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="average_rating">Average Rating</option>
              <option value="total_reviews">Total Reviews</option>
              <option value="total_orders">Orders Volume</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Ratings
          </button>
          <button
            onClick={() => fetchServices()}
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
              <th className="py-3 px-4">Service Title</th>
              <th className="py-3 px-4">Provider / Seller</th>
              <th className="py-3 px-4">Average Rating</th>
              <th className="py-3 px-4">Review Volume</th>
              <th className="py-3 px-4">Recommendation</th>
              <th className="py-3 px-4">Client Orders</th>
              <th className="py-3 px-4 text-right">Recalculate</th>
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
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No services found.
                </td>
              </tr>
            ) : (
              services.map((s) => {
                const isExpanded = expandedId === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate">
                          {s.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate block">
                          Starts at ${(s.starting_price_cents / 100).toLocaleString()} • {s.delivery_time_days || 3}d delivery
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {s.seller_first_name} {s.seller_last_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {Number(s.average_rating || 0).toFixed(2)}
                          </span>
                          <ReviewRatingStars rating={Number(s.average_rating || 0)} size="xs" />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {s.total_reviews} reviews
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400">
                          {s.verified_reviews} verified bookings
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {s.recommendation_percentage}%
                          </span>
                          <span className="text-[10px] text-slate-400">recommended</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {s.total_orders || 0} completed
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          disabled={recalcId === s.id}
                          onClick={(e) => handleRecalculate(s.id, e)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded text-[11px] font-semibold flex items-center gap-1 ml-auto transition disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${recalcId === s.id ? "animate-spin" : ""}`} />
                          Recalculate
                        </button>
                      </td>
                    </tr>

                    {/* Star & Dimensional Breakdown */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50 dark:bg-slate-950/30">
                        <td colSpan={7} className="p-4 border-y border-slate-200 dark:border-slate-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                            <div>
                              <h5 className="font-semibold text-slate-900 dark:text-white text-xs mb-2">
                                Star Rating Distribution ({s.total_reviews} reviews)
                              </h5>
                              <div className="space-y-1.5">
                                <RatingHistogramBar star={5} count={s.star_5_count || 0} total={s.total_reviews} />
                                <RatingHistogramBar star={4} count={s.star_4_count || 0} total={s.total_reviews} />
                                <RatingHistogramBar star={3} count={s.star_3_count || 0} total={s.total_reviews} />
                                <RatingHistogramBar star={2} count={s.star_2_count || 0} total={s.total_reviews} />
                                <RatingHistogramBar star={1} count={s.star_1_count || 0} total={s.total_reviews} />
                              </div>
                            </div>

                            <div>
                              <h5 className="font-semibold text-slate-900 dark:text-white text-xs mb-2">
                                Client Satisfaction Dimensions
                              </h5>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Deliverable Quality</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {Number(s.avg_quality || 4.9).toFixed(1)} / 5.0
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Communication</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {Number(s.avg_communication || 4.9).toFixed(1)} / 5.0
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Value for Price</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {Number(s.avg_value || 4.8).toFixed(1)} / 5.0
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Adherence to Deadlines</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {Number(s.avg_delivery || 4.9).toFixed(1)} / 5.0
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {services.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, total)} of {total.toLocaleString()} services
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
    </div>
  );
};
