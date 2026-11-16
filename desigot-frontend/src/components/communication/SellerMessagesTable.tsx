"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Store,
  BadgeCheck,
  MessageSquare,
  ShoppingBag,
  Layers,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Loader2,
  Briefcase,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { CommunicationStatusBadge } from "./CommunicationStatusBadge";
import { ConversationDrawer } from "./ConversationDrawer";

export function SellerMessagesTable() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Seller Profile Drawer State
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Active Conversation Drawer
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const loadSellers = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/admin/communication/seller-messages", {
        page,
        limit: 15,
        search: search || undefined,
      });
      setSellers(res?.sellers || []);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load seller messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadSellers();
  };

  const handleOpenProfile = async (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setIsProfileOpen(true);
    setProfileLoading(true);
    try {
      const data = await apiGet<any>(`/admin/communication/seller-messages/${sellerId}/profile`);
      setProfile(data);
    } catch (err) {
      console.error("Failed to load seller profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSendDirectReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !profile?.conversations?.[0]?.id) return;

    setIsSendingReply(true);
    try {
      await apiPost(`/admin/communication/seller-messages/${profile.conversations[0].id}/reply`, {
        message_content: replyMessage.trim(),
        is_internal: false,
      });
      setReplyMessage("");
      alert("Direct reply sent to seller!");
      handleOpenProfile(selectedSellerId!);
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-500" />
            Seller Messages Management
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Coordinate with studio creators, review design delivery communications, and support seller queries
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search seller name or studio..."
            className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-72"
          />
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Seller & Studio</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Conversations</th>
              <th className="py-3 px-4">Unread Messages</th>
              <th className="py-3 px-4">Last Message</th>
              <th className="py-3 px-4">Assigned Agent</th>
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
            ) : sellers.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                  No sellers found.
                </td>
              </tr>
            ) : (
              sellers.map((s) => (
                <tr
                  key={s.seller_id}
                  onClick={() => handleOpenProfile(s.seller_id)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center shrink-0">
                        {s.seller_name?.[0] || "S"}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          {s.seller_name || "Creator Studio"}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {s.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {s.seller_verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Verified Creator
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Unverified</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={s.status} type="status" />
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {s.total_conversations}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {s.unread_messages > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                        {s.unread_messages} unread
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300">
                    {s.last_message || <span className="text-slate-400 italic">No messages yet</span>}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {s.assigned_agent_name || <span className="text-slate-400 italic">Unassigned</span>}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                    {s.last_activity
                      ? new Date(s.last_activity).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenProfile(s.seller_id)}
                      className="py-1 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-colors"
                    >
                      Studio Info
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
          Page {page} of {pagination.totalPages || 1} ({pagination.total} sellers)
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

      {/* Seller Profile Drawer */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                  {profile?.seller?.display_name?.[0] || "S"}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                    {profile?.seller?.display_name || "Seller Studio"}
                    {profile?.seller?.seller_verified && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                  </h3>
                  <div className="text-xs text-slate-500">{profile?.seller?.email}</div>
                </div>
              </div>

              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {profileLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <>
                  {/* Previous Conversations */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      Studio Conversations ({profile?.conversations?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {profile?.conversations?.map((conv: any) => (
                        <div
                          key={conv.id}
                          onClick={() => setActiveConvId(conv.id)}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {conv.conversation_reference}
                            </span>
                            <CommunicationStatusBadge status={conv.status} type="status" />
                          </div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {conv.subject}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {conv.last_message_preview}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Services */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-500" />
                      Published Services ({profile?.services?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {profile?.services?.map((svc: any) => (
                        <div key={svc.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                          <div className="truncate max-w-xs">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{svc.title}</div>
                            <div className="text-[11px] text-slate-500">Starting from ${(svc.starting_price_cents / 100).toFixed(2)}</div>
                          </div>
                          <CommunicationStatusBadge status={svc.status} type="status" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Reply Composer */}
                  {profile?.conversations?.[0] && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                        Quick Reply to Seller
                      </h4>
                      <form onSubmit={handleSendDirectReply} className="space-y-2">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type reply to studio..."
                          rows={3}
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        />
                        <button
                          type="submit"
                          disabled={isSendingReply || !replyMessage.trim()}
                          className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isSendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          <span>Reply to Studio</span>
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Embedded Conversation Drawer */}
      <ConversationDrawer
        conversationId={activeConvId}
        isOpen={Boolean(activeConvId)}
        onClose={() => setActiveConvId(null)}
        onUpdated={loadSellers}
      />
    </div>
  );
}
