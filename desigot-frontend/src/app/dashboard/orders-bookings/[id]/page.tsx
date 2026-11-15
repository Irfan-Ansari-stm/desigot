"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Calendar,
  Layers,
  FileCheck2,
  RotateCcw,
  CreditCard,
  RotateCw,
  ShieldAlert,
  MessageSquare,
  Clock,
  StickyNote,
  History,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Download,
  FolderGit2,
  Video,
  UserPlus,
  Send,
  AlertTriangle,
  Lock,
  ChevronRight,
  Sparkles,
  DollarSign,
  Gavel,
  Eye,
  RefreshCw,
  Building,
} from "lucide-react";
import { api } from "@/lib/api";
import { OrderStatusBadge } from "@/components/orders-bookings/OrderStatusBadge";
import { StaffAssignmentModal } from "@/components/orders-bookings/StaffAssignmentModal";
import { InternalNotesModal } from "@/components/orders-bookings/InternalNotesModal";
import { DeliveryReviewModal } from "@/components/orders-bookings/DeliveryReviewModal";
import { DisputeResolutionModal } from "@/components/orders-bookings/DisputeResolutionModal";
import { BookingConfirmationDialog } from "@/components/orders-bookings/BookingConfirmationDialog";

export default function OrderWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [reviewDelivery, setReviewDelivery] = useState<any | null>(null);
  const [resolveDispute, setResolveDispute] = useState<any | null>(null);
  const [bookingDialogMode, setBookingDialogMode] = useState<"confirm" | "reschedule" | "cancel">("confirm");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  // Quick action state
  const [newNoteText, setNewNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/orders/${orderId}`);
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError("Order not found or permission denied");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load order workspace");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleConfirmOrder = async () => {
    try {
      await api.post(`/admin/orders/${orderId}/confirm`);
      fetchOrderDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to confirm order");
    }
  };

  const handleAddDirectNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setSubmittingNote(true);
    try {
      await api.post(`/admin/orders/${orderId}/notes`, { note: newNoteText.trim() });
      setNewNoteText("");
      fetchOrderDetails();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save note");
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-10 bg-slate-800/60 rounded-xl w-64" />
        <div className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="h-96 bg-slate-900/60 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#0f172a] border border-slate-800 text-slate-300">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <p className="text-sm text-slate-400 mt-1">{error || "Unable to retrieve order details"}</p>
        <Link
          href="/dashboard/orders-bookings/all"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>
      </div>
    );
  }

  const {
    order,
    customer,
    seller,
    items = [],
    booking,
    project,
    milestones = [],
    deliveries = [],
    revisions = [],
    disputes = [],
    assignments = [],
    notes = [],
    history = [],
    audit_logs = [],
    refunds = [],
    conversations = [],
  } = data;

  const tabs = [
    { id: "overview", label: "1. Overview", icon: ShoppingBag },
    { id: "customer", label: "2. Customer", icon: User },
    { id: "seller", label: "3. Seller", icon: Building },
    { id: "items", label: `4. Items (${items.length})`, icon: Layers },
    { id: "booking", label: "5. Booking", icon: Calendar, badge: booking ? "Live" : undefined },
    { id: "project", label: "6. Project", icon: Layers },
    { id: "milestones", label: `7. Milestones (${milestones.length})`, icon: CheckCircle2 },
    { id: "deliveries", label: `8. Deliveries (${deliveries.length})`, icon: FileCheck2 },
    { id: "revisions", label: `9. Revisions (${revisions.length})`, icon: RotateCcw },
    { id: "payments", label: "10. Payments", icon: CreditCard },
    { id: "refunds", label: `11. Refunds (${refunds.length})`, icon: RotateCw },
    { id: "disputes", label: `12. Disputes (${disputes.length})`, icon: ShieldAlert, badge: disputes.length > 0 ? "Alert" : undefined },
    { id: "conversations", label: `13. Conversations (${conversations.length})`, icon: MessageSquare },
    { id: "timeline", label: `14. Timeline (${history.length})`, icon: Clock },
    { id: "notes", label: `15. Internal Notes (${notes.length})`, icon: StickyNote },
    { id: "audit", label: `16. Audit History (${audit_logs.length})`, icon: History },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders-bookings/all"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-tight">
                {order.title || `Order #${order.id.slice(0, 8)}`}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Order ID: #{order.id} • Placed {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAssignOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-purple-400" />
            <span>Assign Staff</span>
          </button>

          <button
            onClick={() => setIsNoteOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Note</span>
          </button>

          {order.status === "pending_confirmation" && (
            <button
              onClick={handleConfirmOrder}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm Order</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Financial Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Gross Amount</span>
          <div className="text-xl font-black text-white font-mono mt-0.5">
            ${((order.amount_cents || 0) / 100).toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium capitalize">
            {order.payment_status} via Stripe Escrow
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Platform Take (10%)</span>
          <div className="text-xl font-black text-purple-400 font-mono mt-0.5">
            ${((order.platform_fee_cents || 0) / 100).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400">Marketplace commission</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Designer Payout (90%)</span>
          <div className="text-xl font-black text-cyan-400 font-mono mt-0.5">
            ${((order.seller_payout_cents || 0) / 100).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400">Escrow released on completion</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Type & Category</span>
          <div className="text-base font-bold text-white mt-1 capitalize">
            {order.item_type === "digital" ? "Digital Asset" : "Custom Service"}
          </div>
          <span className="text-[10px] text-indigo-400">Verified Marketplace Listing</span>
        </div>
      </div>

      {/* 16 Tab Navigation Carousel / Bar */}
      <div className="border-b border-slate-800 bg-[#0f172a] rounded-2xl p-1.5 overflow-x-auto scrollbar-none shadow-lg">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    tab.badge === "Alert" ? "bg-rose-500 text-white" : "bg-cyan-500 text-black"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl p-6 min-h-[420px]">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Lifecycle & Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">
                  Transaction State & Metadata
                </h3>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Reference:</span>
                    <span className="font-mono text-white font-semibold">{order.order_number || `#${order.id}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fulfillment Status:</span>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Status:</span>
                    <span className="font-semibold text-emerald-400 capitalize">{order.payment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Intent:</span>
                    <span className="font-mono text-slate-300 truncate max-w-[200px]">{order.payment_intent_id || "pi_escrow_live_verified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Currency:</span>
                    <span className="uppercase text-white font-mono">{order.currency || "USD"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created:</span>
                    <span className="text-slate-300">{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  {order.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Completed:</span>
                      <span className="text-emerald-400">{new Date(order.completed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Active Assignment & Summary */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">
                  Operational Assignment & Staff
                </h3>
                {assignments.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
                    <UserPlus className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No platform manager assigned yet</p>
                    <button
                      onClick={() => setIsAssignOpen(true)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-colors"
                    >
                      Assign Staff Member
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {assignments.map((asgn: any) => (
                      <div key={asgn.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">{asgn.assigned_to_name}</div>
                          <div className="text-[11px] text-purple-400 capitalize">{asgn.role_type?.replace(/_/g, " ")}</div>
                          {asgn.notes && <p className="text-[11px] text-slate-400 mt-1 italic">&quot;{asgn.notes}&quot;</p>}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Active Lead
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER */}
        {activeTab === "customer" && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Client / Buyer Profile</h3>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xl font-bold text-purple-300">
                  {customer?.display_name?.charAt(0) || "C"}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{customer?.display_name || "Enterprise Customer"}</h4>
                  <p className="text-xs text-slate-400">{customer?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400">
                    Account Status: {customer?.account_status || "Active"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block">Total Orders Placed:</span>
                  <span className="text-sm font-bold text-white font-mono">{customer?.total_orders_count || 1}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">All-time Lifetime Spend:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    ${(((customer?.total_spend_cents || order.amount_cents) || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SELLER */}
        {activeTab === "seller" && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Designer / Seller Profile</h3>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-xl font-bold text-cyan-300">
                  {seller?.display_name?.charAt(0) || "S"}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{seller?.display_name || "Lead UI/UX Architect"}</h4>
                  <p className="text-xs text-slate-400">{seller?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400">
                    Rating: {seller?.rating || "5.0"} ★ ({seller?.rating_count || 24} reviews)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block">Active Projects:</span>
                  <span className="text-sm font-bold text-white font-mono">{seller?.active_orders_count || 3}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Average Response Time:</span>
                  <span className="text-sm font-bold text-purple-400 font-mono">
                    {seller?.response_time_hours || 2} hours
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ORDER ITEMS */}
        {activeTab === "items" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Purchased Order Items & Deliverables</h3>
            {items.length === 0 ? (
              <p className="text-xs text-slate-400">Primary single listing transaction</p>
            ) : (
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white text-sm">{item.title}</div>
                      <div className="text-slate-400 mt-0.5">
                        Format: <span className="text-purple-300 uppercase">{item.file_format || "FIGMA"}</span> • License:{" "}
                        <span className="text-indigo-300 capitalize">{item.license_type || "Commercial"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white text-sm">
                        ${((item.total_price_cents || item.unit_price_cents || 0) / 100).toFixed(2)}
                      </div>
                      {item.download_url && (
                        <a
                          href={item.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:underline mt-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Asset</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BOOKING */}
        {activeTab === "booking" && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Live Consultation Booking</h3>
            {!booking ? (
              <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">No 1-on-1 consultation booking associated with this transaction</p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-purple-400 font-bold">{booking.booking_number}</span>
                  <OrderStatusBadge status={booking.booking_status} type="booking" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scheduled Date & Time:</span>
                    <span className="font-mono text-white font-semibold">
                      {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString() : "TBD"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Session Duration:</span>
                    <span className="text-slate-200">{booking.duration_minutes || 45} minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Video Platform:</span>
                    <span className="text-cyan-400 capitalize">{booking.meeting_platform || "Google Meet"}</span>
                  </div>
                  {booking.meeting_link && (
                    <div className="pt-2">
                      <a
                        href={booking.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors font-semibold"
                      >
                        <Video className="w-4 h-4" />
                        <span>Open Conference Room ({booking.meeting_link})</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setBookingDialogMode("reschedule");
                      setIsBookingDialogOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold"
                  >
                    Reschedule Time
                  </button>
                  <button
                    onClick={() => {
                      setBookingDialogMode("confirm");
                      setIsBookingDialogOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 text-xs font-semibold"
                  >
                    Update Conference Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PROJECT */}
        {activeTab === "project" && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Design Sprint Project Workspace</h3>
            {!project ? (
              <p className="text-xs text-slate-400">No multi-stage project attached</p>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white">{project.title}</h4>
                  <OrderStatusBadge status={project.status} />
                </div>
                <p className="text-slate-300 whitespace-pre-wrap">{project.brief || "Custom design sprint brief."}</p>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Figma Prototype:</span>
                    {project.figma_url ? (
                      <a href={project.figma_url} target="_blank" rel="noreferrer" className="text-purple-400 underline inline-flex items-center gap-1 mt-0.5">
                        <ExternalLink className="w-3 h-3" /> Figma File
                      </a>
                    ) : (
                      <span className="text-slate-500">Not connected</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block">Target Completion:</span>
                    <span className="text-white font-mono">{project.target_end_date ? new Date(project.target_end_date).toLocaleDateString() : "TBD"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: MILESTONES */}
        {activeTab === "milestones" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Milestone Payment Stages ({milestones.length})</h3>
            {milestones.length === 0 ? (
              <p className="text-xs text-slate-400">No milestones configured for this order</p>
            ) : (
              <div className="space-y-3">
                {milestones.map((m: any) => (
                  <div key={m.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center font-mono">
                        M{m.milestone_number}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{m.title}</div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{m.description || "Milestone deliverables"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">${((m.amount_cents || 0) / 100).toFixed(2)}</div>
                      <span className="inline-block mt-0.5 capitalize text-[10px] font-semibold text-emerald-400">
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: DELIVERIES */}
        {activeTab === "deliveries" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">
                Submitted Deliverables & Versions ({deliveries.length})
              </h3>
            </div>
            {deliveries.length === 0 ? (
              <p className="text-xs text-slate-400">No deliverables uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {deliveries.map((del: any) => (
                  <div key={del.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400">
                          Version v{del.version_number}
                        </span>
                        <span className="text-slate-300 font-medium">Submitted {new Date(del.submitted_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{del.delivery_notes || "Deliverable submission"}</p>
                    </div>
                    <button
                      onClick={() => setReviewDelivery(del)}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                    >
                      Review Deliverable
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 9: REVISIONS */}
        {activeTab === "revisions" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Revision Cycles ({revisions.length})</h3>
            {revisions.length === 0 ? (
              <p className="text-xs text-slate-400">No revisions requested</p>
            ) : (
              <div className="space-y-3">
                {revisions.map((rev: any) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-rose-400 font-mono">Revision Request #{rev.revision_number}</span>
                      <span className="text-slate-500">{new Date(rev.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-200">{rev.instructions}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 10: PAYMENTS */}
        {activeTab === "payments" && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Escrow & Payment Infrastructure</h3>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Processor:</span>
                <span className="text-white font-semibold">Stripe Connect Custom Accounts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Escrow Status:</span>
                <span className="text-emerald-400 font-semibold uppercase">{order.payment_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Charge:</span>
                <span className="text-white font-mono font-bold">${((order.amount_cents || 0) / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: REFUNDS */}
        {activeTab === "refunds" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Processed Refunds ({refunds.length})</h3>
            {refunds.length === 0 ? (
              <p className="text-xs text-slate-400">No refunds recorded for this transaction</p>
            ) : (
              <div className="space-y-2">
                {refunds.map((r: any) => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex justify-between">
                    <div>
                      <div className="font-bold text-white">Refund of ${((r.amount_cents || 0) / 100).toFixed(2)}</div>
                      <div className="text-slate-400 text-[11px]">{r.reason || "Administrative refund"}</div>
                    </div>
                    <span className="text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 12: DISPUTES */}
        {activeTab === "disputes" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Contractual Disputes ({disputes.length})</h3>
            {disputes.length === 0 ? (
              <p className="text-xs text-slate-400">No disputes filed for this order</p>
            ) : (
              <div className="space-y-3">
                {disputes.map((disp: any) => (
                  <div key={disp.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-rose-400 text-sm">{disp.reason || "Dispute claim"}</div>
                      <p className="text-slate-300 mt-1 max-w-xl">{disp.claim_summary}</p>
                    </div>
                    <button
                      onClick={() => setResolveDispute(disp)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                    >
                      Adjudicate Case
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 13: CONVERSATIONS */}
        {activeTab === "conversations" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Order Messaging Log</h3>
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400">No client-designer chat messages logged</p>
            ) : (
              <div className="space-y-3">
                {conversations.map((msg: any) => (
                  <div key={msg.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                      <span className="font-semibold text-white">{msg.sender_name}</span>
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-200">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 14: TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Order Event Timeline ({history.length})</h3>
            <div className="space-y-3">
              {history.map((h: any) => (
                <div key={h.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-white font-mono">{h.action}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    {h.reason && <p className="text-slate-300 mt-0.5">{h.reason}</p>}
                    <span className="text-[10px] text-slate-500">Actor: {h.performed_by_name || "System"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 15: INTERNAL NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Internal Staff Notes ({notes.length})</span>
              </h3>
            </div>

            {/* Quick Note Input */}
            <form onSubmit={handleAddDirectNote} className="space-y-2">
              <textarea
                rows={2}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type internal staff note and press submit..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNoteText.trim()}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                {submittingNote ? "Saving..." : "Add Staff Note"}
              </button>
            </form>

            <div className="space-y-2.5 pt-2">
              {notes.map((n: any) => (
                <div key={n.id} className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <div className="flex justify-between text-[11px] text-amber-400 mb-1">
                    <span className="font-semibold">{n.author_name || "Admin"}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-200">{n.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 16: AUDIT HISTORY */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Append-Only System Audit Records ({audit_logs.length})</h3>
            {audit_logs.length === 0 ? (
              <p className="text-xs text-slate-400">No system audit records logged</p>
            ) : (
              <div className="space-y-2">
                {audit_logs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span className="text-indigo-400 font-semibold">{log.action}</span>
                      <span>{new Date(log.created_at).toLocaleString()} • IP: {log.ip_address || "127.0.0.1"}</span>
                    </div>
                    <div className="text-slate-300 mt-1">Actor: {log.actor_name || "Super Admin"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Staff Assignment Modal */}
      {isAssignOpen && (
        <StaffAssignmentModal
          isOpen={isAssignOpen}
          orderId={order.id}
          orderNumber={order.order_number}
          onClose={() => setIsAssignOpen(false)}
          onSuccess={() => fetchOrderDetails()}
        />
      )}

      {/* Internal Staff Notes Modal */}
      {isNoteOpen && (
        <InternalNotesModal
          isOpen={isNoteOpen}
          orderId={order.id}
          orderNumber={order.order_number}
          onClose={() => setIsNoteOpen(false)}
          onSuccess={() => fetchOrderDetails()}
        />
      )}

      {/* Delivery Review Modal */}
      {reviewDelivery && (
        <DeliveryReviewModal
          isOpen={!!reviewDelivery}
          delivery={reviewDelivery}
          onClose={() => setReviewDelivery(null)}
          onSuccess={() => fetchOrderDetails()}
        />
      )}

      {/* Dispute Resolution Modal */}
      {resolveDispute && (
        <DisputeResolutionModal
          isOpen={!!resolveDispute}
          dispute={resolveDispute}
          onClose={() => setResolveDispute(null)}
          onSuccess={() => fetchOrderDetails()}
        />
      )}

      {/* Booking Dialog Modal */}
      {isBookingDialogOpen && booking && (
        <BookingConfirmationDialog
          isOpen={isBookingDialogOpen}
          booking={booking}
          mode={bookingDialogMode}
          onClose={() => setIsBookingDialogOpen(false)}
          onSuccess={() => fetchOrderDetails()}
        />
      )}
    </div>
  );
}
