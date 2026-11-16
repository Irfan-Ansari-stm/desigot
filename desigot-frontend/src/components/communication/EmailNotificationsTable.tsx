"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ShieldCheck,
  Ban,
  ArrowRight,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { CommunicationStatusBadge } from "./CommunicationStatusBadge";

export function EmailNotificationsTable() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Email Detail Drawer
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [emailDetail, setEmailDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/admin/communication/emails", {
        page,
        limit: 15,
        search: search || undefined,
        status: status || undefined,
        provider: provider || undefined,
      });
      setEmails(res?.emails || []);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [page, status, provider]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEmails();
  };

  const handleOpenEmail = async (id: string) => {
    setSelectedEmailId(id);
    setDetailLoading(true);
    try {
      const data = await apiGet<any>(`/admin/communication/emails/${id}`);
      setEmailDetail(data);
    } catch (err) {
      console.error("Failed to load email details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    setIsRetrying(true);
    try {
      await apiPost(`/admin/communication/emails/${id}/retry`);
      alert("Email requeued for immediate provider delivery retry!");
      handleOpenEmail(id);
      loadEmails();
    } catch (err) {
      console.error("Retry failed:", err);
      alert("Retry failed");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiPost(`/admin/communication/emails/${id}/cancel`);
      alert("Queued email cancelled successfully!");
      handleOpenEmail(id);
      loadEmails();
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" />
            Transactional Email Delivery Logs
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor SMTP, SendGrid, Amazon SES, and Resend delivery health, retries, and bounces
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipient, subject, reference..."
              className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </form>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="sent">Sent</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={provider}
            onChange={(e) => { setProvider(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Providers</option>
            <option value="smtp">Direct SMTP</option>
            <option value="sendgrid">SendGrid</option>
            <option value="ses">Amazon SES</option>
            <option value="resend">Resend</option>
            <option value="mailgun">Mailgun</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Recipient</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Queued / Sent</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4 h-12 bg-slate-50/50 dark:bg-slate-900/50" />
                </tr>
              ))
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                  No email logs found.
                </td>
              </tr>
            ) : (
              emails.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => handleOpenEmail(e.id)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {e.notification_reference}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{e.recipient_name || "User"}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{e.recipient_email}</div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-800 dark:text-slate-200 font-medium">
                    {e.subject}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                    {e.email_category?.replace(/_/g, " ")}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap uppercase font-semibold text-[11px] text-slate-600 dark:text-slate-400">
                    {e.provider}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={e.status} type="status" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                    {new Date(e.sent_at || e.queued_at).toLocaleTimeString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEmail(e.id)}
                      className="py-1 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-colors"
                    >
                      Audit Log
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
          Page {page} of {pagination.totalPages || 1} ({pagination.total} logs)
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

      {/* Email Delivery Details & Events Drawer */}
      {selectedEmailId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-semibold text-xs text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50">
                    {emailDetail?.notification_reference}
                  </span>
                  <CommunicationStatusBadge status={emailDetail?.status} type="status" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                  {emailDetail?.subject}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {(emailDetail?.status === "failed" || emailDetail?.status === "bounced") && (
                  <button
                    disabled={isRetrying}
                    onClick={() => handleRetry(emailDetail.id)}
                    className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Dispatch</span>
                  </button>
                )}
                {emailDetail?.status === "queued" && (
                  <button
                    onClick={() => handleCancel(emailDetail.id)}
                    className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel Queue</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedEmailId(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content & Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <>
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs">
                    <div>
                      <span className="text-slate-400">Recipient Email:</span>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{emailDetail?.recipient_email}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Provider Service:</span>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 uppercase">{emailDetail?.provider}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Queued Timestamp:</span>
                      <div className="text-slate-700 dark:text-slate-300">{new Date(emailDetail?.queued_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Delivered Timestamp:</span>
                      <div className="text-slate-700 dark:text-slate-300">
                        {emailDetail?.delivered_at ? new Date(emailDetail.delivered_at).toLocaleString() : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Failure reason callout if failed */}
                  {emailDetail?.failure_reason && (
                    <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-900 dark:text-rose-200">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Provider Delivery Failure Diagnostic</span>
                      </div>
                      <p>{emailDetail.failure_reason}</p>
                    </div>
                  )}

                  {/* Provider Event Chain */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Webhook Delivery Timeline</span>
                    </h4>

                    <div className="space-y-2">
                      {Array.isArray(emailDetail?.delivery_events) && emailDetail.delivery_events.length > 0 ? (
                        emailDetail.delivery_events.map((ev: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                                {ev.event}
                              </span>
                              {ev.reason && <span className="text-rose-500">({ev.reason})</span>}
                            </div>
                            <span className="text-slate-400 text-[11px]">{new Date(ev.timestamp).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 text-xs italic py-2">No webhook events logged yet.</div>
                      )}
                    </div>
                  </div>

                  {/* Email Body Content */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                      Message Content Preview
                    </h4>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 text-xs whitespace-pre-wrap font-sans leading-relaxed text-slate-800 dark:text-slate-200">
                      {emailDetail?.body_text || "No plain text content available"}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
