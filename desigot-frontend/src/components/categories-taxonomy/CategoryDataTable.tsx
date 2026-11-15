"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Plus,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Folder,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  Lock,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { CategoryStatusBadge } from "./CategoryStatusBadge";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  parent_name?: string;
  depth: number;
  category_type: string;
  status: string;
  visibility: string;
  icon_name?: string;
  display_order: number;
  child_count: number;
  service_count: number;
  product_count: number;
  is_featured: boolean;
  created_at: string;
}

interface Props {
  initialType?: string;
  initialParent?: string;
  initialDepth?: number;
  title: string;
  subtitle: string;
}

export function CategoryDataTable({
  initialType,
  initialParent,
  initialDepth,
  title,
  subtitle,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("display_order");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
        sort_by: sortBy,
        order: sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.category_type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (initialParent !== undefined) params.parent_id = initialParent;
      if (initialDepth !== undefined) params.depth = initialDepth;

      const res = await api.get("/admin/categories", { params });
      if (res.data?.success) {
        setCategories(res.data.data.categories || []);
        setTotal(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, typeFilter, statusFilter, sortBy, sortOrder, initialParent, initialDepth]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleExportCSV = async () => {
    try {
      const res = await api.get("/admin/categories/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `desigot_categories_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleTogglePublish = async (category: Category) => {
    try {
      const nextStatus = category.status === "published" ? "draft" : "published";
      await api.put(`/admin/categories/${category.id}`, { status: nextStatus });
      fetchCategories();
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete or archive this category?")) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleRestoreCategory = async (id: string) => {
    try {
      await api.post(`/admin/categories/${id}/restore`);
      fetchCategories();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>{title}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              {total} Categories
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/dashboard/categories-taxonomy/create"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by category name, slug, or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {!initialType && (
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">All Marketplace Types</option>
            <option value="service">Service Categories</option>
            <option value="product">Product Categories</option>
            <option value="shared">Shared (Service & Product)</option>
            <option value="general">General</option>
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="display_order">Display Sequence</option>
          <option value="name">Category Name</option>
          <option value="created_at">Creation Date</option>
          <option value="depth">Hierarchy Depth</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm hover:bg-slate-800"
        >
          {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>

        {(search || typeFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setTypeFilter(initialType || "");
              setStatusFilter("");
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Category Name & Slug</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Parent Category</th>
                <th className="py-3.5 px-4">Depth</th>
                <th className="py-3.5 px-4">Counts</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Visibility</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="py-4 px-4">
                      <div className="h-6 bg-slate-800/50 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FolderTree className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300">No categories match criteria</p>
                    <p className="text-xs text-slate-500 mt-1">Try refining search parameters or filters</p>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Order */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      #{cat.display_order}
                    </td>

                    {/* Name & Slug */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-400">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="max-w-[220px]">
                          <Link
                            href={`/dashboard/categories-taxonomy/${cat.id}`}
                            className="font-bold text-white hover:text-purple-400 transition-colors truncate block text-sm"
                          >
                            {cat.name}
                          </Link>
                          <span className="font-mono text-[11px] text-slate-500 block truncate">
                            /{cat.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-4">
                      <CategoryStatusBadge type={cat.category_type} />
                    </td>

                    {/* Parent */}
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {cat.parent_name ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-purple-400 font-medium">{cat.parent_name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">None (Root Category)</span>
                      )}
                    </td>

                    {/* Depth */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        Level {cat.depth}
                      </span>
                    </td>

                    {/* Associated Counts */}
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span title="Subcategories" className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px]">
                          {cat.child_count} sub
                        </span>
                        <span title="Services" className="px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 font-mono text-[11px]">
                          {cat.service_count} srv
                        </span>
                        <span title="Products" className="px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-300 font-mono text-[11px]">
                          {cat.product_count} prd
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <CategoryStatusBadge status={cat.status} />
                    </td>

                    {/* Visibility */}
                    <td className="py-3.5 px-4">
                      <CategoryStatusBadge visibility={cat.visibility} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/categories-taxonomy/${cat.id}`}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-purple-600 transition-colors"
                          title="Open Complete Category Workspace"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleTogglePublish(cat)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
                          title={cat.status === "published" ? "Unpublish Category" : "Publish Category"}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${cat.status === "published" ? "text-emerald-400" : ""}`} />
                        </button>

                        {cat.status === "archived" ? (
                          <button
                            onClick={() => handleRestoreCategory(cat.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                            title="Restore Archived Category"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                            title="Delete or Archive Category"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Bar */}
        <div className="px-4 py-3.5 border-t border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{total === 0 ? 0 : (page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-white">{Math.min(page * pageSize, total)}</span> of{" "}
            <span className="font-semibold text-white">{total}</span> categories
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
            >
              <option value={15}>15 per page</option>
              <option value={30}>30 per page</option>
              <option value={60}>60 per page</option>
            </select>

            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
