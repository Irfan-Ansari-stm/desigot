"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Send,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { CommunicationStatusBadge } from "./CommunicationStatusBadge";

export function SupportTicketDataTable() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [slaStatus, setSlaStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Ticket Detail Drawer
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/admin/communication/tickets", {
        page,
        limit: 15,
        search: search || undefined,
        category: category || undefined,
        priority: priority || undefined,
        status: status || undefined,
        sla_status: slaStatus || undefined,
      });
      setTickets(res?.tickets || []);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [page, category, priority, status, slaStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTickets();
  };

  const handleExportCsv = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/admin/communication/tickets/export`, "_blank");
  };

  const handleOpenTicket = async (id: string) => {
    setSelectedTicketId(id);
    setDetailLoading(true);
    try {
      const data = await apiGet<any>(`/admin/communication/tickets/${id}`);
      setTicketDetail(data);
    } catch (err) {
      console.error("Failed to load ticket detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedTicketId || isReplying) return;

    setIsReplying(true);
    try {
      await apiPost(`/admin/communication/tickets/${selectedTicketId}/reply`, {
        content: replyContent.trim(),
        is_internal: isInternalNote,
      });
      setReplyContent("");
      setIsInternalNote(false);
      handleOpenTicket(selectedTicketId);
      loadTickets();
    } catch (err) {
      console.error("Failed to reply to ticket:", err);
      alert("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicketId) return;
    try {
      await apiPost(`/admin/communication/tickets/${selectedTicketId}/escalate`, {
        reason: "Escalated by administrator for immediate operations review",
      });
      alert("Ticket successfully escalated!");
      handleOpenTicket(selectedTicketId);
      loadTickets();
    } catch (err) {
      console.error("Escalation failed:", err);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicketId) return;
    try {
      await apiPost(`/admin/communication/tickets/${selectedTicketId}/resolve`, {
        resolution_notes: "Issue addressed and resolved by support lead",
      });
      alert("Ticket marked as resolved!");
      handleOpenTicket(selectedTicketId);
      loadTickets();
    } catch (err) {
      console.error("Resolution failed:", err);
    }
  };

  const handleAutoAssign = async () => {
    if (!selectedTicketId) return;
    try {
      await apiPost(`/admin/communication/tickets/${selectedTicketId}/assign`, {
        assigned_agent_id: "auto",
      });
      alert("Round-robin assigned to available support specialist!");
      handleOpenTicket(selectedTicketId);
      loadTickets();
    } catch (err) {
      console.error("Assignment failed:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-indigo-500" />
            Support Desk & Incident Tickets
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            SLA-monitored client inquiries, technical bugs, payment issues and escalations
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, subject, customer..."
              className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </form>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="payment_issues">Payment Issues</option>
            <option value="refund_requests">Refund Requests</option>
            <option value="order_issues">Order Issues</option>
            <option value="booking_issues">Booking Issues</option>
            <option value="service_delivery">Service Delivery</option>
            <option value="technical_problems">Technical Problems</option>
          </select>

          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          <select
            value={slaStatus}
            onChange={(e) => { setSlaStatus(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All SLA</option>
            <option value="compliant">Compliant</option>
            <option value="warning">Warning</option>
            <option value="breached">Breached</option>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Ticket</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">SLA Compliance</th>
              <th className="py-3 px-4">Assigned Agent</th>
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
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                  No tickets match the selected filters.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => handleOpenTicket(t.id)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {t.ticket_reference}
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {t.subject}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {t.description?.slice(0, 70)}...
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                    {t.category?.replace(/_/g, " ")}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                      {t.customer_name || t.customer_email}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={t.priority} type="priority" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={t.status} type="status" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={t.sla_status} type="sla" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {t.assigned_agent_name ? (
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {t.assigned_agent_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenTicket(t.id)}
                      className="py-1 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-colors"
                    >
                      Inspect Ticket
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
          Page {page} of {pagination.totalPages || 1} ({pagination.total} tickets)
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

      {/* Ticket Details & Comments Drawer */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono font-semibold px-2 py-0.5 rounded text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                    {ticketDetail?.ticket_reference}
                  </span>
                  <CommunicationStatusBadge status={ticketDetail?.priority} type="priority" />
                  <CommunicationStatusBadge status={ticketDetail?.status} type="status" />
                  <CommunicationStatusBadge status={ticketDetail?.sla_status} type="sla" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">
                  {ticketDetail?.subject}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-slate-500">Customer: <strong className="text-slate-900 dark:text-slate-100">{ticketDetail?.customer_name}</strong></span>
                <span className="text-slate-500">Agent: <strong className="text-slate-900 dark:text-slate-100">{ticketDetail?.assigned_agent_name || "Unassigned"}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoAssign}
                  className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 font-medium text-slate-700 dark:text-slate-200"
                >
                  Auto-Assign
                </button>
                <button
                  onClick={handleEscalate}
                  className="py-1 px-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-semibold"
                >
                  Escalate
                </button>
                <button
                  onClick={handleResolve}
                  className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                >
                  Resolve
                </button>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/20">
              {detailLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                ticketDetail?.comments?.map((c: any) => (
                  <div
                    key={c.id}
                    className={`rounded-2xl p-4 text-xs ${
                      c.is_internal
                        ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-slate-900 dark:text-slate-100"
                        : c.comment_type === "escalation"
                        ? "bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {c.is_internal && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{c.author_name || "User"}</span>
                        {c.author_role === "admin" && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600">Staff</span>
                        )}
                      </div>
                      <span className="text-slate-400 font-normal">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Composer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form onSubmit={handleSendReply} className="space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={isInternalNote ? "Write an internal support note..." : "Type reply to customer..."}
                  rows={3}
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none resize-none ${
                    isInternalNote
                      ? "bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-slate-100"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  }`}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Post as Internal Note</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isReplying || !replyContent.trim()}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Submit Comment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
