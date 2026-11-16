"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Paperclip,
  Lock,
  User,
  ShoppingBag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Download,
  Loader2,
  Pin,
  Clock,
  Sparkles,
} from "lucide-react";
import { apiGet, apiPost, apiPut, apiUpload } from "@/lib/api";
import { CommunicationStatusBadge } from "./CommunicationStatusBadge";

interface Props {
  conversationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function ConversationDrawer({ conversationId, isOpen, onClose, onUpdated }: Props) {
  const [conv, setConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageContent, setMessageContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [assignedAgentId, setAssignedAgentId] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversationData = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const convData = await apiGet<any>(`/admin/communication/conversations/${conversationId}`);
      setConv(convData);
      setStatus(convData.status);
      setPriority(convData.priority);
      setAssignedAgentId(convData.assigned_agent_id || "");

      const msgs = await apiGet<any[]>(`/admin/communication/conversations/${conversationId}/messages`);
      setMessages(msgs || []);
    } catch (err) {
      console.error("Failed to load conversation details:", err);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    if (isOpen && conversationId) {
      loadConversationData();
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen || !conversationId) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageContent.trim() && attachments.length === 0) || isSending) return;

    setIsSending(true);
    try {
      const newMsg = await apiPost<any>(`/admin/communication/conversations/${conversationId}/messages`, {
        message_content: messageContent.trim() || (attachments.length > 0 ? "Shared attachments" : ""),
        is_internal: isInternalNote,
        attachments,
      });

      setMessages((prev) => [...prev, newMsg]);
      setMessageContent("");
      setAttachments([]);
      setIsInternalNote(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploaded = await apiUpload<any>("/admin/communication/upload", formData);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (err) {
      console.error("File upload failed:", err);
      alert("File upload failed. Ensure file is an allowed type and under 15MB.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await apiPut(`/admin/communication/conversations/${conversationId}`, { status: newStatus });
      setStatus(newStatus);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    try {
      await apiPut(`/admin/communication/conversations/${conversationId}`, { priority: newPriority });
      setPriority(newPriority);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    try {
      await apiPost(`/admin/communication/conversations/${conversationId}/assign`, {
        assigned_agent_id: agentId,
      });
      setAssignedAgentId(agentId);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error("Failed to assign agent:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 md:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                {conv?.conversation_reference || "CONV"}
              </span>
              <CommunicationStatusBadge status={status} type="status" />
              <CommunicationStatusBadge status={priority} type="priority" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                {conv?.conversation_type?.replace(/_/g, " ")}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {conv?.subject || "Conversation"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar / Meta Context Pills */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-400">Customer:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{conv?.customer_name || conv?.customer_email}</span>
            </div>
            {conv?.seller_name && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-400">Seller:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{conv.seller_name}</span>
              </div>
            )}
            {conv?.order_title && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-medium text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]">{conv.order_title}</span>
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="waiting_customer">Waiting for Customer</option>
              <option value="waiting_seller">Waiting for Seller</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priority}
              onChange={(e) => handleUpdatePriority(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No messages yet in this conversation thread.
            </div>
          ) : (
            messages.map((m) => {
              const isInternal = m.visibility === "internal_only" || m.message_type === "internal_note";
              const isStaff = m.sender_type === "agent" || m.sender_type === "admin";
              const isCustomer = m.sender_type === "customer";

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    isInternal
                      ? "items-center"
                      : isStaff
                      ? "items-end"
                      : "items-start"
                  }`}
                >
                  {isInternal ? (
                    /* Internal Staff Note */
                    <div className="w-full max-w-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl p-3.5 my-1 text-xs shadow-sm">
                      <div className="flex items-center justify-between font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Internal Staff Note ({m.sender_name || "Support Lead"})</span>
                        </div>
                        <span className="text-[11px] font-normal text-amber-600/80 dark:text-amber-400/80">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {m.message_content}
                      </p>
                    </div>
                  ) : (
                    /* Standard Message Bubble */
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs shadow-sm ${
                        isStaff
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : isCustomer
                          ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-none"
                          : "bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/50 rounded-bl-none"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5 opacity-90 text-[11px]">
                        <span className="font-semibold">
                          {m.sender_name || (isStaff ? "Support Specialist" : isCustomer ? "Customer" : "Seller")}
                        </span>
                        <span>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <p className="whitespace-pre-wrap leading-relaxed">{m.message_content}</p>

                      {/* Attachments */}
                      {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/20 dark:border-slate-700 space-y-1.5">
                          {m.attachments.map((att: any, idx: number) => (
                            <a
                              key={idx}
                              href={att.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-lg text-[11px] font-medium transition-colors ${
                                isStaff
                                  ? "bg-white/10 hover:bg-white/20 text-white"
                                  : "bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 text-indigo-600 dark:text-indigo-400"
                              }`}
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="truncate flex-1">{att.file_name}</span>
                              <Download className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Pending Attachments */}
          {attachments.length > 0 && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="truncate max-w-[150px]">{att.file_name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-rose-500 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="relative">
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder={isInternalNote ? "Write an internal staff note (never visible to customer or seller)..." : "Type your reply to customer and seller..."}
                rows={3}
                className={`w-full p-3 pr-24 rounded-xl border text-xs focus:outline-none transition-all resize-none ${
                  isInternalNote
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500"
                    : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                }`}
              />

              <div className="absolute right-2 bottom-2.5 flex items-center gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                  title="Attach file"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <Paperclip className="w-4 h-4" />}
                </button>

                <button
                  type="submit"
                  disabled={isSending || (!messageContent.trim() && attachments.length === 0)}
                  className={`py-2 px-3.5 rounded-lg text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 ${
                    isInternalNote ? "bg-amber-600 hover:bg-amber-500" : "bg-indigo-600 hover:bg-indigo-500"
                  }`}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isInternalNote ? "Note" : "Send"}</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 select-none hover:text-slate-900 dark:hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium">Make Internal Note</span>
              </label>

              <span className="text-[11px] text-slate-400">
                Enter to submit • Supports Markdown
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
