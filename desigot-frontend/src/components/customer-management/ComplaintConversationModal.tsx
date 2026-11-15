"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Lock,
  Send,
  User,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  onUpdated?: () => void;
}

export function ComplaintConversationModal({
  isOpen,
  onClose,
  complaintId,
  onUpdated,
}: Props) {
  const [complaint, setComplaint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadComplaint = async () => {
    if (!complaintId) return;
    setIsLoading(true);
    try {
      const res = await apiGet<any>(`/admin/customers/complaints/${complaintId}`);
      const data = res?.complaint || res?.data || res;
      setComplaint(data);
      if (data?.status) setStatus(data.status);
    } catch (err) {
      console.error("Failed to load complaint", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && complaintId) {
      loadComplaint();
    }
  }, [isOpen, complaintId]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await apiPost(`/admin/customers/complaints/${complaintId}/messages`, {
        message: message.trim(),
        is_internal_note: isInternalNote,
      });
      setMessage("");
      await loadComplaint();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await apiPost(`/admin/customers/complaints/${complaintId}/status`, {
        status: newStatus,
        resolution_details: resolutionDetails.trim() || undefined,
      });
      setStatus(newStatus);
      await loadComplaint();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-3xl h-[85vh] bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-purple-400">
                  {complaint?.ticket_number || "TICKET"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                    complaint?.priority === "urgent"
                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      : complaint?.priority === "high"
                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                      : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  {complaint?.priority || "Normal"}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white truncate max-w-lg">
                {complaint?.subject || "Customer Complaint"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
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
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-slate-900/30 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>
              Customer:{" "}
              <strong className="text-white">
                {complaint?.customer_name || complaint?.customer_email || "Customer"}
              </strong>
            </span>
          </div>
          {complaint?.assigned_agent_name && (
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Assigned: <strong className="text-white">{complaint.assigned_agent_name}</strong>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date(complaint?.created_at || Date.now()).toLocaleString()}</span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Original Complaint Description */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-purple-300 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Original Ticket Description
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(complaint?.created_at || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {complaint?.description}
                </p>
              </div>

              {/* Messages list */}
              {complaint?.messages && complaint.messages.length > 0 ? (
                complaint.messages.map((m: any) => {
                  const isStaff = m.sender_role !== "customer";
                  const isInternal = m.is_internal_note;

                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl text-sm border transition ${
                        isInternal
                          ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                          : isStaff
                          ? "bg-purple-950/20 border-purple-500/30 text-slate-200"
                          : "bg-slate-800/30 border-slate-700/50 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">
                            {m.sender_name || (isStaff ? "Support Staff" : "Customer")}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              isStaff
                                ? "bg-purple-500/20 text-purple-300"
                                : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {m.sender_role}
                          </span>
                          {isInternal && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Lock className="w-2.5 h-2.5" />
                              Internal Note
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  No replies on this ticket yet.
                </div>
              )}
            </>
          )}
        </div>

        {/* Reply input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setIsInternalNote(false)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                !isInternalNote
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Public Reply to Customer
            </button>
            <button
              type="button"
              onClick={() => setIsInternalNote(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                isInternalNote
                  ? "bg-amber-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Lock className="w-3 h-3" />
              Private Internal Note
            </button>
          </div>

          <div className="flex items-center gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isInternalNote
                  ? "Write an internal note (only visible to support agents and admins)..."
                  : "Type a response to the customer..."
              }
              rows={2}
              className={`flex-1 bg-slate-900 border rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none resize-none ${
                isInternalNote
                  ? "border-amber-500/40 focus:border-amber-500"
                  : "border-slate-800 focus:border-purple-500"
              }`}
            />
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className={`px-4 py-3 rounded-xl font-medium text-white transition flex items-center justify-center shrink-0 ${
                isInternalNote
                  ? "bg-amber-600 hover:bg-amber-500 disabled:opacity-40"
                  : "bg-purple-600 hover:bg-purple-500 disabled:opacity-40"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
