"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Eye,
  ShoppingBag,
  Calendar,
  Ban,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ArrowUpDown,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { CustomerStatusBadge } from "./CustomerStatusBadge";
import { CustomerStatusDialog } from "./CustomerStatusDialog";

export interface CustomerItem {
  id: string;
  name?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  account_status: string;
  customer_lifecycle_status?: string;
  customer_type?: string;
  company_name?: string;
  country?: string;
  city?: string;
  lifetime_spending_cents?: number;
  total_orders_count?: number;
  total_bookings_count?: number;
  risk_score?: number;
  days_inactive?: number;
  created_at: string;
  tags?: { name: string; slug: string; color: string }[];
}

interface Props {
  customers: CustomerItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  selectedIds?: string[];
  onSelectToggle?: (id: string) => void;
  onSelectAll?: () => void;
}

export function CustomerTable({
  customers,
  isLoading = false,
  onRefresh,
  selectedIds = [],
  onSelectToggle,
  onSelectAll,
}: Props) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [statusDialogCustomer, setStatusDialogCustomer] = useState<CustomerItem | null>(null);

  const formatCurrency = (cents?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format((cents || 0) / 100);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="w-full bg-[#0B1120]/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="w-full bg-[#0B1120]/70 border border-slate-800/80 rounded-2xl p-12 text-center backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500">
          <UserCheck className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No customers found</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          There are no customer profiles matching the current filter or search criteria.
        </p>
      </div>
    );
  }

  const allSelected = customers.length > 0 && selectedIds.length === customers.length;

  return (
    <>
      <div className="w-full bg-[#0B1120]/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4 w-10">
                  {onSelectAll && (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onSelectAll}
                      className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500/30"
                    />
                  )}
                </th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Contact & Location</th>
                <th className="py-4 px-4">Orders & Bookings</th>
                <th className="py-4 px-4">Total Spent</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Registered</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {customers.map((c) => {
                const displayName =
                  c.name ||
                  c.display_name ||
                  `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
                  c.email.split("@")[0];
                const isSelected = selectedIds.includes(c.id);
                const isSuspended = c.account_status === "suspended";

                return (
                  <tr
                    key={c.id}
                    className={`group hover:bg-slate-800/30 transition duration-150 ${
                      isSelected ? "bg-purple-950/20" : ""
                    }`}
                  >
                    <td className="py-4 px-4">
                      {onSelectToggle && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectToggle(c.id)}
                          className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500/30"
                        />
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {c.avatar_url ? (
                            <img
                              src={c.avatar_url}
                              alt={displayName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {isSuspended && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-[#0B1120] rounded-full" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/dashboard/customer-management/${c.id}`}
                            className="font-medium text-white hover:text-purple-400 transition flex items-center gap-1.5"
                          >
                            <span>{displayName}</span>
                            {c.customer_type === "vip" && (
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                          </Link>
                          {c.company_name && (
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">
                              {c.company_name}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            {c.tags && c.tags.length > 0
                              ? c.tags.slice(0, 2).map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                                  >
                                    {t.name}
                                  </span>
                                ))
                              : null}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {(c.city || c.country) && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{[c.city, c.country].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Orders
                          </span>
                          <span className="font-semibold text-white">
                            {c.total_orders_count || 0}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-slate-800" />
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Bookings
                          </span>
                          <span className="font-semibold text-white">
                            {c.total_bookings_count || 0}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs">
                        <span className="font-bold text-emerald-400 text-sm">
                          {formatCurrency(c.lifetime_spending_cents)}
                        </span>
                        <span className="block text-[10px] text-slate-400">Lifetime value</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <CustomerStatusBadge
                        status={c.customer_lifecycle_status || (isSuspended ? "suspended" : "active")}
                        accountStatus={c.account_status}
                        vip={c.customer_type === "vip"}
                      />
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-400">
                      <div>{formatDate(c.created_at)}</div>
                      {c.days_inactive !== undefined && c.days_inactive > 0 && (
                        <span className="text-[10px] text-slate-500">
                          {c.days_inactive}d inactive
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="relative inline-block text-left">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/customer-management/${c.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="View Customer Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {activeMenuId === c.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl z-30 py-1.5 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-150">
                              <Link
                                href={`/dashboard/customer-management/${c.id}?tab=overview`}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/80 hover:text-white transition"
                                onClick={() => setActiveMenuId(null)}
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>Overview Details</span>
                              </Link>
                              <Link
                                href={`/dashboard/customer-management/${c.id}?tab=orders`}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/80 hover:text-white transition"
                                onClick={() => setActiveMenuId(null)}
                              >
                                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Orders ({c.total_orders_count || 0})</span>
                              </Link>
                              <Link
                                href={`/dashboard/customer-management/${c.id}?tab=bookings`}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/80 hover:text-white transition"
                                onClick={() => setActiveMenuId(null)}
                              >
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Bookings ({c.total_bookings_count || 0})</span>
                              </Link>
                              <Link
                                href={`/dashboard/customer-management/${c.id}?tab=notes`}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/80 hover:text-white transition"
                                onClick={() => setActiveMenuId(null)}
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                <span>Add Internal Note</span>
                              </Link>

                              <div className="h-px bg-slate-800 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setStatusDialogCustomer(c);
                                }}
                                className={`w-full text-left flex items-center gap-2 px-3 py-2 transition ${
                                  isSuspended
                                    ? "text-emerald-400 hover:bg-emerald-500/10"
                                    : "text-red-400 hover:bg-red-500/10"
                                }`}
                              >
                                {isSuspended ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Reactivate Account</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>Suspend Account</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {statusDialogCustomer && (
        <CustomerStatusDialog
          isOpen={!!statusDialogCustomer}
          onClose={() => setStatusDialogCustomer(null)}
          customerId={statusDialogCustomer.id}
          customerName={
            statusDialogCustomer.name ||
            statusDialogCustomer.display_name ||
            statusDialogCustomer.email
          }
          currentStatus={statusDialogCustomer.account_status}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}
