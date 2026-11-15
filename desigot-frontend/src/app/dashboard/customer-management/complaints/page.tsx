"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  MessageSquare,
  Shield,
  Clock,
  User,
  Filter,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { ComplaintConversationModal } from "@/components/customer-management/ComplaintConversationModal";

export default function CustomerComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);

  const loadComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (priority) params.priority = priority;

      const res = await apiGet<any>("/admin/customers/complaints", params);
      const items = res?.complaints || res?.data?.complaints || (Array.isArray(res) ? res : []);
      setComplaints(items);
      setPagination(
        res?.pagination || {
          page,
          limit: 15,
          total: items.length,
          totalPages: Math.ceil(items.length / 15) || 1,
        }
      );
    } catch (err) {
      console.error("Failed to load customer complaints", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, priority]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold tracking-wider uppercase mb-1">
            <span>Customer Management</span>
            <span>•</span>
            <span className="text-slate-400">Support & Disputes</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
            Customer Complaints & Support Tickets
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Incoming support disputes, order delivery issues, refund escalation requests, and quality inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadComplaints()}
            className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-rose-400" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-4 bg-[#0B1120]/70 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ticket #, subject, or customer..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-rose-500/50"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_customer">Waiting for Customer</option>
            <option value="waiting_for_seller">Waiting for Seller</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-rose-500/50"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="w-full bg-[#0B1120]/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-4 px-4">Ticket #</th>
                <th className="py-4 px-4">Priority</th>
                <th className="py-4 px-4">Subject & Description</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Assigned Agent</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Created Date</th>
                <th className="py-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading support tickets...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No complaints found matching criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-4 font-mono font-medium text-rose-400">
                      {c.ticket_number}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          c.priority === "urgent"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : c.priority === "high"
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4 max-w-sm">
                      <div className="font-medium text-white truncate">{c.subject}</div>
                      <p className="text-slate-400 line-clamp-1 text-[11px] mt-0.5">{c.description}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/dashboard/customer-management/${c.customer_id}`}
                        className="font-medium text-white hover:text-rose-400 transition"
                      >
                        {c.customer_name || "Customer"}
                      </Link>
                      <span className="block text-[11px] text-slate-500">{c.customer_email}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {c.assigned_agent_name ? (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <Shield className="w-3.5 h-3.5" />
                          <span>{c.assigned_agent_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          c.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : c.status === "escalated"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}
                      >
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{formatDate(c.created_at)}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setActiveComplaintId(c.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                        <span>View Thread</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
            tickets
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-slate-300 transition"
            >
              Previous
            </button>
            <span className="font-semibold text-white px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-slate-300 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {activeComplaintId && (
        <ComplaintConversationModal
          isOpen={!!activeComplaintId}
          onClose={() => setActiveComplaintId(null)}
          complaintId={activeComplaintId}
          onUpdated={loadComplaints}
        />
      )}
    </div>
  );
}
