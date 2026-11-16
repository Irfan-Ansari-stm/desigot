"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  MessageSquare,
  Pin,
  Clock,
  User,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { CommunicationStatusBadge } from "./CommunicationStatusBadge";
import { ConversationDrawer } from "./ConversationDrawer";

export function ConversationDataTable() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/admin/communication/conversations", {
        page,
        limit: 15,
        search: search || undefined,
        type: type || undefined,
        status: status || undefined,
        priority: priority || undefined,
      });
      setConversations(res?.conversations || []);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [page, type, status, priority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadConversations();
  };

  const handleExportCsv = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/admin/communication/conversations/export`, "_blank");
  };

  const handleOpenConversation = (id: string) => {
    setSelectedConvId(id);
    setIsDrawerOpen(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Header & Filters */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Centralized Communication Inbox
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage customer, seller, order and booking communication threads
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, subject, users..."
              className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </form>

          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="customer_support">Customer Support</option>
            <option value="seller_support">Seller Support</option>
            <option value="customer_seller">Customer-Seller</option>
            <option value="order_communication">Order Discussions</option>
            <option value="booking_communication">Booking Discussions</option>
            <option value="general_inquiry">General Inquiry</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="waiting_customer">Waiting for Customer</option>
            <option value="waiting_seller">Waiting for Seller</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <button
            onClick={handleExportCsv}
            className="py-1.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Subject & Preview</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Participants</th>
              <th className="py-3 px-4">Assigned Agent</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Activity</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={9} className="py-4 px-4 h-12 bg-slate-50/50 dark:bg-slate-900/50" />
                </tr>
              ))
            ) : conversations.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                  No conversations match the current criteria.
                </td>
              </tr>
            ) : (
              conversations.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => handleOpenConversation(c.id)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {c.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      <span>{c.conversation_reference}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {c.subject}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {c.last_message_preview || "No message preview available"}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                    {c.conversation_type?.replace(/_/g, " ")}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[140px]">
                      {c.customer_name || c.customer_email}
                    </div>
                    {c.seller_name && (
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        Seller: {c.seller_name}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {c.assigned_agent_name ? (
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {c.assigned_agent_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={c.priority} type="priority" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={c.status} type="status" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                    {new Date(c.last_message_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenConversation(c.id)}
                      className="py-1 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-colors"
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

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing page <span className="font-semibold text-slate-900 dark:text-slate-100">{page}</span> of{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{pagination.totalPages || 1}</span> ({pagination.total} total)
        </div>

        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-Time Message Thread Drawer */}
      <ConversationDrawer
        conversationId={selectedConvId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdated={loadConversations}
      />
    </div>
  );
}
