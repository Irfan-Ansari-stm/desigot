"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Video,
  Search,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { BookingConfirmationDialog } from "./BookingConfirmationDialog";

interface Booking {
  id: string;
  booking_number?: string;
  service_title?: string;
  customer_name?: string;
  customer_email?: string;
  seller_name?: string;
  seller_email?: string;
  scheduled_at: string;
  duration_minutes: number;
  booking_status: string;
  meeting_platform?: string;
  meeting_link?: string;
  created_at: string;
}

interface Props {
  initialStatus?: string;
  title: string;
  subtitle: string;
}

export function BookingDataTable({
  initialStatus,
  title,
  subtitle,
}: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus || "");

  // Modal controls
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [dialogMode, setDialogMode] = useState<"confirm" | "reschedule" | "cancel">("confirm");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/admin/orders/bookings", { params });
      if (res.data?.success) {
        setBookings(res.data.data.bookings || []);
        setTotal(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const openDialog = (booking: Booking, mode: "confirm" | "reschedule" | "cancel") => {
    setActiveBooking(booking);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>{title}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {total} Sessions
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>

        <button
          onClick={fetchBookings}
          className="p-2.5 self-start md:self-auto rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by client, designer, or booking reference..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {!initialStatus && (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="requested">Requested / New</option>
            <option value="pending_confirmation">Pending Confirmation</option>
            <option value="confirmed">Confirmed Session</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}

        {(search || statusFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter(initialStatus || "");
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Booking / Service</th>
                <th className="py-3.5 px-4">Client / Buyer</th>
                <th className="py-3.5 px-4">Designer</th>
                <th className="py-3.5 px-4">Appointment Time</th>
                <th className="py-3.5 px-4">Meeting Platform</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-6 bg-slate-800/50 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300">No consultation bookings found</p>
                    <p className="text-xs text-slate-500 mt-1">Check filter settings or search query</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
                          <Video className="w-5 h-5" />
                        </div>
                        <div className="max-w-[220px]">
                          <div className="font-semibold text-white truncate text-sm">
                            {booking.service_title || "Design Strategy Consultation"}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {booking.booking_number || `#${booking.id.slice(0, 8)}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200 text-xs">
                        {booking.customer_name || "Enterprise Client"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {booking.customer_email || "client@acme.corp"}
                      </div>
                    </td>

                    {/* Designer */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200 text-xs">
                        {booking.seller_name || "Lead UX Architect"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {booking.seller_email}
                      </div>
                    </td>

                    {/* Appointment Time */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-purple-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>
                          {booking.scheduled_at
                            ? new Date(booking.scheduled_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "TBD"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Duration: {booking.duration_minutes || 45} mins
                      </span>
                    </td>

                    {/* Meeting Link */}
                    <td className="py-3.5 px-4">
                      {booking.meeting_link ? (
                        <a
                          href={booking.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meeting</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Link pending</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={booking.booking_status} type="booking" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {["requested", "pending_confirmation"].includes(booking.booking_status) && (
                          <button
                            onClick={() => openDialog(booking, "confirm")}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-white transition-all text-xs font-semibold flex items-center gap-1"
                            title="Confirm Booking"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </button>
                        )}

                        <button
                          onClick={() => openDialog(booking, "reschedule")}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                          title="Reschedule Appointment"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        {booking.booking_status !== "cancelled" && (
                          <button
                            onClick={() => openDialog(booking, "cancel")}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3.5 border-t border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{total === 0 ? 0 : (page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-white">{Math.min(page * pageSize, total)}</span> of{" "}
            <span className="font-semibold text-white">{total}</span> bookings
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation & Reschedule Dialog */}
      {activeBooking && (
        <BookingConfirmationDialog
          isOpen={isDialogOpen}
          booking={activeBooking}
          mode={dialogMode}
          onClose={() => {
            setIsDialogOpen(false);
            setActiveBooking(null);
          }}
          onSuccess={() => fetchBookings()}
        />
      )}
    </div>
  );
}
