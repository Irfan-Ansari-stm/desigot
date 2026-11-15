"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Eye,
  Edit,
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  Ban,
  Trash2,
  ExternalLink,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { ServiceStatusBadge } from "./ServiceStatusBadge";

export interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  status: string;
  is_featured: boolean;
  starting_price_usd: string;
  currency: string;
  delivery_time_days: number;
  revision_limit: number;
  total_orders: number;
  total_revenue_usd: string;
  avg_rating: string;
  review_count: number;
  created_at: string;
  updated_at: string;
  seller_name: string;
  seller_email: string;
  seller_avatar?: string;
  seller_verified: boolean;
  category_name?: string;
  category_slug?: string;
  thumbnail_url?: string;
  package_count: number;
}

interface Props {
  services: ServiceItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onAction: (serviceId: string, action: string, payload?: any) => Promise<void>;
  onBulkAction: (serviceIds: string[], action: string, payload?: any) => Promise<void>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (newPage: number) => void;
}

export function ServiceTable({
  services,
  isLoading,
  onRefresh,
  onAction,
  onBulkAction,
  pagination,
  onPageChange,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "reject" | "suspend" | "delete" | null;
    serviceId?: string;
    isBulk?: boolean;
    reason?: string;
  }>({ isOpen: false, type: null });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(services.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const confirmActionModal = async () => {
    if (!actionModal.type) return;

    if (actionModal.isBulk) {
      await onBulkAction(selectedIds, actionModal.type, {
        reason: actionModal.reason || "Administrative action",
      });
      setSelectedIds([]);
    } else if (actionModal.serviceId) {
      await onAction(actionModal.serviceId, actionModal.type, {
        reason: actionModal.reason || "Administrative action",
      });
    }

    setActionModal({ isOpen: false, type: null, reason: "" });
  };

  return (
    <div className="relative">
      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 mb-4 px-4 py-3 bg-[#1e293b] border border-indigo-500/40 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-3 text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium text-white">
            <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 rounded-full text-xs font-bold">
              {selectedIds.length}
            </span>
            <span>services selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkAction(selectedIds, "approve")}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => onBulkAction(selectedIds, "feature")}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Feature
            </button>
            <button
              onClick={() =>
                setActionModal({ isOpen: true, type: "suspend", isBulk: true })
              }
              className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Ban className="w-4 h-4" /> Suspend
            </button>
            <button
              onClick={() =>
                setActionModal({ isOpen: true, type: "delete", isBulk: true })
              }
              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#1e293b]/70 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      services.length > 0 && selectedIds.length === services.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-3">Service</th>
                <th className="py-4 px-3">Seller</th>
                <th className="py-4 px-3">Category</th>
                <th className="py-4 px-3">Price</th>
                <th className="py-4 px-3">Packages</th>
                <th className="py-4 px-3">Orders & Rating</th>
                <th className="py-4 px-3">Status</th>
                <th className="py-4 px-3">Date</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                      <p className="text-sm font-medium">Loading services from database...</p>
                    </div>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <p className="text-base font-semibold text-slate-400">
                      No services found matching current criteria.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try updating your search query or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                services.map((service) => {
                  const isChecked = selectedIds.includes(service.id);
                  const isMenuOpen = activeMenuId === service.id;

                  return (
                    <tr
                      key={service.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isChecked ? "bg-indigo-950/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(service.id)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                        />
                      </td>

                      {/* Service Info */}
                      <td className="py-4 px-3 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden flex-shrink-0 relative">
                            {service.thumbnail_url ? (
                              <img
                                src={service.thumbnail_url}
                                alt={service.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-600">
                                NO IMG
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/service-management/${service.id}`}
                              className="font-medium text-white hover:text-indigo-400 transition-colors line-clamp-1 text-sm block"
                            >
                              {service.title}
                            </Link>
                            <span className="text-xs text-slate-500 font-mono">
                              ID: {service.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Seller */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                            {service.seller_avatar ? (
                              <img
                                src={service.seller_avatar}
                                alt={service.seller_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                {service.seller_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-slate-200 text-xs truncate">
                                {service.seller_name}
                              </span>
                              {service.seller_verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {service.seller_email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-xs border border-slate-700/60 font-medium">
                          {service.category_name || "General"}
                        </span>
                      </td>

                      {/* Starting Price */}
                      <td className="py-4 px-3">
                        <div className="font-semibold text-white">
                          ${service.starting_price_usd}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {service.delivery_time_days}d delivery
                        </div>
                      </td>

                      {/* Package Count */}
                      <td className="py-4 px-3">
                        <span className="text-xs font-medium text-slate-300">
                          {service.package_count} tier{service.package_count !== 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* Orders & Rating */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{parseFloat(service.avg_rating || "5.0").toFixed(1)}</span>
                          <span className="text-slate-500">({service.review_count})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {service.total_orders} sales (${service.total_revenue_usd})
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-3">
                        <ServiceStatusBadge
                          status={service.status}
                          isFeatured={service.is_featured}
                        />
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-3 text-xs text-slate-400">
                        {new Date(service.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions Dropdown */}
                      <td className="py-4 px-4 text-right relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(isMenuOpen ? null : service.id)
                          }
                          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-4 top-12 z-50 w-48 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl py-1 text-xs text-left overflow-hidden">
                              <Link
                                href={`/dashboard/service-management/${service.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-700/60"
                                onClick={() => setActiveMenuId(null)}
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                View Details & Tabs
                              </Link>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onAction(service.id, "duplicate");
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-700/60 text-left"
                              >
                                <Copy className="w-3.5 h-3.5 text-blue-400" />
                                Duplicate Service
                              </button>

                              {service.status === "pending_approval" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onAction(service.id, "approve", { autoPublish: true });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-emerald-400 hover:bg-slate-700/60 text-left"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Approve & Publish
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setActionModal({
                                        isOpen: true,
                                        type: "reject",
                                        serviceId: service.id,
                                      });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-slate-700/60 text-left"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Reject Service
                                  </button>
                                </>
                              )}

                              {service.status === "approved" && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onAction(service.id, "publish");
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-emerald-400 hover:bg-slate-700/60 text-left"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Publish Live
                                </button>
                              )}

                              {service.status === "published" && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onAction(service.id, "unpublish");
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-amber-400 hover:bg-slate-700/60 text-left"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Unpublish Service
                                </button>
                              )}

                              {service.status !== "suspended" ? (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setActionModal({
                                      isOpen: true,
                                      type: "suspend",
                                      serviceId: service.id,
                                    });
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-slate-700/60 text-left"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Suspend Service
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onAction(service.id, "restore");
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-emerald-400 hover:bg-slate-700/60 text-left"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Restore Service
                                </button>
                              )}

                              {service.is_featured ? (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onAction(service.id, "unfeature");
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700/60 text-left"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                                  Remove Featured
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onAction(service.id, "feature", { priority: 10, days: 30 });
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-indigo-400 hover:bg-slate-700/60 text-left"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Mark Featured
                                </button>
                              )}

                              <div className="border-t border-slate-700/60 my-1" />

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setActionModal({
                                    isOpen: true,
                                    type: "delete",
                                    serviceId: service.id,
                                  });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Service
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing Page <span className="font-semibold text-white">{pagination.page}</span> of{" "}
              <span className="font-semibold text-white">{pagination.totalPages}</span> ({pagination.total} total)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange && onPageChange(pagination.page - 1)}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation & Reason Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white capitalize">
              {actionModal.type === "reject" && "Reject Service"}
              {actionModal.type === "suspend" && "Suspend Service"}
              {actionModal.type === "delete" && "Delete Service"}
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              {actionModal.type === "delete"
                ? "Are you sure you want to delete this service? This action will archive the listing."
                : `Please provide a reason for ${actionModal.type}ing this service. This will be recorded in the audit and moderation log.`}
            </p>

            {actionModal.type !== "delete" && (
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={actionModal.reason || ""}
                  onChange={(e) =>
                    setActionModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder={`Reason for ${actionModal.type}ing...`}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setActionModal({ isOpen: false, type: null, reason: "" })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmActionModal}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
