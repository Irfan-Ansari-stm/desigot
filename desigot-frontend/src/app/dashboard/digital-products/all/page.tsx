"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpDown,
  Download,
  RefreshCw,
  DollarSign,
  Package,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { DigitalProductTable, DigitalProductItem } from "@/components/digital-products/DigitalProductTable";

export default function AllDigitalProductsPage() {
  const [products, setProducts] = useState<DigitalProductItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 15,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (categoryId) params.category_id = categoryId;

      const [listResult, statsResult, catResult] = await Promise.allSettled([
        apiGet<any>("/admin/digital-products", params),
        apiGet<any>("/admin/digital-products/stats"),
        apiGet<any>("/categories"),
      ]);

      if (listResult.status === "fulfilled" && listResult.value) {
        const val = listResult.value;
        const items = val?.products || val?.data?.products || (Array.isArray(val) ? val : []);
        setProducts(items);
        setPagination(
          val?.pagination || { page: 1, limit: 15, total: items.length, totalPages: 1 }
        );
      }

      if (statsResult.status === "fulfilled" && statsResult.value) {
        setStats(statsResult.value?.data || statsResult.value);
      }

      if (catResult.status === "fulfilled" && catResult.value) {
        const catVal = catResult.value;
        setCategories(catVal?.data || (Array.isArray(catVal) ? catVal : []));
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortOrder, search, status, categoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">All Digital Products</h1>
            <p className="text-sm text-slate-400">
              Global catalog of UI kits, design systems, 3D assets, icons, and templates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
          <Link
            href="/dashboard/digital-products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Products</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalProducts ?? products.length}</p>
          <span className="text-[11px] text-slate-500">Across all categories</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats?.publishedProducts ?? 0}</p>
          <span className="text-[11px] text-emerald-500/80">Active in store</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats?.pendingProducts ?? 0}</p>
          <span className="text-[11px] text-amber-500/80">Moderation queue</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            ${(((stats?.totalRevenueCents ?? 0) / 100).toLocaleString())}
          </p>
          <span className="text-[11px] text-slate-500">Gross asset volume</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Downloads</span>
            <Download className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {(stats?.totalDownloads ?? 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500">Entitlements used</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Featured</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats?.featuredProducts ?? 0}</p>
          <span className="text-[11px] text-slate-500">Hero placements</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0e1726] border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product title, slug, software..."
              className="w-full bg-[#121c2d] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-[#121c2d] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="pending_review">Pending Review</option>
            <option value="draft">Drafts</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="bg-[#121c2d] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#121c2d] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="created_at">Date Created</option>
            <option value="total_sales">Total Sales</option>
            <option value="total_downloads">Downloads</option>
            <option value="price_personal_cents">Price</option>
            <option value="title">Title (A-Z)</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")}
            className="p-2 rounded-xl bg-[#121c2d] border border-slate-700/80 text-slate-400 hover:text-white transition"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <DigitalProductTable
        products={products}
        isLoading={isLoading}
        onRefresh={loadData}
        showModerationActions={true}
      />

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0e1726] border border-slate-800 text-sm text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{(page - 1) * 15 + 1}</span> to{" "}
            <span className="font-semibold text-white">{Math.min(page * 15, pagination.total)}</span> of{" "}
            <span className="font-semibold text-white">{pagination.total}</span> products
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className={`px-3 py-1.5 rounded-lg border border-slate-700 ${
                page <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800 text-white"
              }`}
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs font-mono font-bold text-white bg-slate-800 rounded-lg">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page >= pagination.totalPages}
              className={`px-3 py-1.5 rounded-lg border border-slate-700 ${
                page >= pagination.totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800 text-white"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
