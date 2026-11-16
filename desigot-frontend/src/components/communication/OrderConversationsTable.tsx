"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ShoppingBag,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
  Store,
  Layers,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { CommunicationStatusBadge } from "./CommunicationStatusBadge";
import { ConversationDrawer } from "./ConversationDrawer";

export function OrderConversationsTable() {
  const [orderConvs, setOrderConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [convStatus, setConvStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const loadOrderConversations = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/admin/communication/order-conversations", {
        page,
        limit: 15,
        search: search || undefined,
        order_status: orderStatus || undefined,
        conversation_status: convStatus || undefined,
      });
      setOrderConvs(res?.order_conversations || []);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load order conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderConversations();
  }, [page, orderStatus, convStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadOrderConversations();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header & Filters */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-500" />
            Order Conversations Hub
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dedicated communication channels for custom design deliverables, revisions, and order milestones
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order title, customer, seller..."
              className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </form>

          <select
            value={orderStatus}
            onChange={(e) => { setOrderStatus(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="complete">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={convStatus}
            onChange={(e) => { setConvStatus(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Chat Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Order & Listing</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Seller Studio</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Order Status</th>
              <th className="py-3 px-4">Chat Status</th>
              <th className="py-3 px-4">Last Message</th>
              <th className="py-3 px-4">Last Activity</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={9} className="py-4 px-4 h-12 bg-slate-50/50 dark:bg-slate-900/50" />
                </tr>
              ))
            ) : orderConvs.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                  No order conversations found.
                </td>
              </tr>
            ) : (
              orderConvs.map((o) => (
                <tr
                  key={o.conversation_id}
                  onClick={() => setSelectedConvId(o.conversation_id)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{o.listing_title}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Order #{o.order_id.slice(0, 8)} • {o.conversation_reference}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{o.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{o.customer_email}</div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{o.seller_name || "—"}</div>
                    <div className="text-[11px] text-slate-400">{o.seller_email}</div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                    ${((o.amount_cents || 0) / 100).toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={o.order_status} type="status" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={o.conversation_status} type="status" />
                  </td>

                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400">
                    {o.last_message_preview || "No message preview"}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                    {new Date(o.last_message_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedConvId(o.conversation_id)}
                      className="py-1 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-colors"
                    >
                      Open Chat
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
          Page {page} of {pagination.totalPages || 1} ({pagination.total} orders)
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Conversation Drawer */}
      <ConversationDrawer
        conversationId={selectedConvId}
        isOpen={Boolean(selectedConvId)}
        onClose={() => setSelectedConvId(null)}
        onUpdated={loadOrderConversations}
      />
    </div>
  );
}
