"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Eye,
  Edit2,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUpDown,
  Download,
  DollarSign,
  Star,
  ExternalLink,
  Layers,
  Archive,
  Ban,
  FileCode,
  Package,
} from "lucide-react";
import { DigitalProductStatusBadge } from "./DigitalProductStatusBadge";
import { apiPost, apiDelete, apiPut } from "@/lib/api";

export interface DigitalProductItem {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  category_name?: string;
  seller_name?: string;
  seller_email?: string;
  version: string;
  status: string;
  price_personal_cents: number;
  price_commercial_cents: number;
  price_extended_cents: number;
  price_enterprise_cents: number;
  currency: string;
  is_featured: boolean;
  featured_position: number;
  file_formats: string[];
  software_compatibility: string[];
  tags: string[];
  thumbnail_url?: string;
  total_sales: number;
  total_revenue_cents: number;
  total_downloads: number;
  view_count: number;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
}

interface Props {
  products: DigitalProductItem[];
  isLoading: boolean;
  onRefresh: () => void;
  showModerationActions?: boolean;
}

export function DigitalProductTable({
  products,
  isLoading,
  onRefresh,
  showModerationActions = false,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Moderation Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this digital product for public release?")) return;
    setIsProcessing(true);
    try {
      await apiPost(`/admin/digital-products/${id}/approve`, { notes: "Approved from product table queue" });
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve product");
    } finally {
      setIsProcessing(false);
      setActionMenuOpen(null);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectionReason("");
    setRejectModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetId || !rejectionReason.trim()) {
      alert("Please enter a rejection reason");
      return;
    }
    setIsProcessing(true);
    try {
      await apiPost(`/admin/digital-products/${rejectTargetId}/reject`, {
        reason: rejectionReason.trim(),
        notes: "Rejected via admin product moderation",
      });
      setRejectModalOpen(false);
      setRejectTargetId(null);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reject product");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setIsProcessing(true);
    try {
      await apiPost(`/admin/digital-products/${id}/duplicate`, {});
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to duplicate product");
    } finally {
      setIsProcessing(false);
      setActionMenuOpen(null);
    }
  };

  const handleToggleFeature = async (id: string, current: boolean) => {
    setIsProcessing(true);
    try {
      await apiPost(`/admin/digital-products/${id}/feature`, {
        is_featured: !current,
        position: !current ? 1 : 0,
        featured_type: "staff_pick",
      });
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to toggle featured status");
    } finally {
      setIsProcessing(false);
      setActionMenuOpen(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete / archive this digital product?")) return;
    setIsProcessing(true);
    try {
      await apiDelete(`/admin/digital-products/${id}`);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete product");
    } finally {
      setIsProcessing(false);
      setActionMenuOpen(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-[#0e1726] border border-slate-800 rounded-2xl p-6 overflow-hidden">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-slate-800/60 rounded-xl w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-800/30 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full bg-[#0e1726] border border-slate-800 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No digital products found</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          No digital assets match the current filter criteria. You can create a new product or adjust filters.
        </p>
        <Link
          href="/dashboard/digital-products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25"
        >
          <Package className="w-4 h-4" />
          Create First Product
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0e1726] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#121c2d] text-xs uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length === products.length && products.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </th>
              <th className="py-4 px-4">Product</th>
              <th className="py-4 px-3">Category</th>
              <th className="py-4 px-3">Licenses & Price</th>
              <th className="py-4 px-3">Downloads & Sales</th>
              <th className="py-4 px-3">Rating</th>
              <th className="py-4 px-3">Status</th>
              <th className="py-4 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-normal">
            {products.map((p) => {
              const personalPrice = (p.price_personal_cents / 100).toFixed(2);
              const commercialPrice = (p.price_commercial_cents / 100).toFixed(2);

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-800/30 transition-colors group cursor-default"
                >
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => handleSelectOne(p.id)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                  </td>

                  {/* Product Title & Thumbnail */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3.5 max-w-sm">
                      <div className="relative w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/60 overflow-hidden flex-shrink-0">
                        {p.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumbnail_url}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <Layers className="w-6 h-6" />
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 bg-slate-900/90 text-[10px] font-mono font-bold px-1 rounded-tl text-slate-300">
                          v{p.version}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/digital-products/${p.id}`}
                          className="font-medium text-white hover:text-indigo-400 transition truncate block text-sm"
                        >
                          {p.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>by {p.seller_name || "Official Desigot"}</span>
                          {p.file_formats?.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {p.file_formats.slice(0, 3).join(" ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-3">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs font-medium text-slate-300 border border-slate-700/50">
                      {p.category_name || "UI Kit"}
                    </span>
                  </td>

                  {/* Pricing Tiers */}
                  <td className="py-4 px-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-medium">Personal:</span>
                        <span className="text-xs font-semibold text-emerald-400 font-mono">
                          ${personalPrice}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-medium">Comm:</span>
                        <span className="text-xs font-semibold text-indigo-400 font-mono">
                          ${commercialPrice}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Downloads & Sales */}
                  <td className="py-4 px-3">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-medium">{p.total_downloads.toLocaleString()}</span>
                        <span className="text-slate-500">downloads</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{p.total_sales} sales</span>
                        <span className="text-slate-500 font-mono">
                          (${((p.total_revenue_cents || 0) / 100).toFixed(0)})
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Rating */}
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-white">
                        {Number(p.avg_rating || 5.0).toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">({p.review_count})</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-3">
                    <DigitalProductStatusBadge status={p.status} isFeatured={p.is_featured} />
                  </td>

                  {/* Actions Dropdown */}
                  <td className="py-4 px-4 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/digital-products/${p.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="View Full Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {p.status === "pending_review" && (
                        <>
                          <button
                            onClick={() => handleApprove(p.id)}
                            disabled={isProcessing}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition"
                            title="Approve & Publish"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openRejectModal(p.id)}
                            disabled={isProcessing}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <div className="relative">
                        <button
                          onClick={() =>
                            setActionMenuOpen(actionMenuOpen === p.id ? null : p.id)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {actionMenuOpen === p.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-[#162235] border border-slate-700/80 rounded-xl shadow-2xl py-1 z-30 text-left">
                            <Link
                              href={`/dashboard/digital-products/${p.id}`}
                              className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700/50"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" />
                              View 14-Tab Detail
                            </Link>

                            <button
                              onClick={() => handleDuplicate(p.id)}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700/50"
                            >
                              <Copy className="w-3.5 h-3.5 text-blue-400" />
                              Duplicate Asset
                            </button>

                            <button
                              onClick={() => handleToggleFeature(p.id, p.is_featured)}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700/50"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              {p.is_featured ? "Remove Featured" : "Mark Featured"}
                            </button>

                            {p.status !== "published" && (
                              <button
                                onClick={() => handleApprove(p.id)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-emerald-300 hover:bg-slate-700/50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Publish to Store
                              </button>
                            )}

                            {p.status === "pending_review" && (
                              <button
                                onClick={() => openRejectModal(p.id)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-300 hover:bg-slate-700/50"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                Reject with Reason
                              </button>
                            )}

                            <div className="h-px bg-slate-700/60 my-1" />

                            <button
                              onClick={() => handleDelete(p.id)}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              Delete / Archive
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121c2d] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Reject Digital Product</h3>
            <p className="text-sm text-slate-400 mb-4">
              Specify the quality or licensing reason for rejecting this product. The seller will see this feedback.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Asset archive missing vector layers, resolution below 4K standard, or font licensing terms omitted."
              rows={4}
              className="w-full bg-[#0a101d] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500 mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/25"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
