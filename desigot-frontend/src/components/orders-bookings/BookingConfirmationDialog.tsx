"use client";

import React, { useState } from "react";
import { Calendar, Clock, X, Loader2, AlertCircle, Video, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface Booking {
  id: string;
  booking_number?: string;
  service_title?: string;
  customer_name?: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_platform?: string;
  meeting_link?: string;
}

interface Props {
  isOpen: boolean;
  booking: Booking | null;
  mode: "confirm" | "reschedule" | "cancel";
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingConfirmationDialog({
  isOpen,
  booking,
  mode,
  onClose,
  onSuccess,
}: Props) {
  const [meetingLink, setMeetingLink] = useState(booking?.meeting_link || "https://meet.google.com/dsg-team-sync");
  const [scheduledAt, setScheduledAt] = useState(
    booking?.scheduled_at ? new Date(booking.scheduled_at).toISOString().slice(0, 16) : ""
  );
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "confirm") {
        await api.post(`/admin/orders/bookings/${booking.id}/confirm`, {
          meeting_link: meetingLink,
        });
      } else if (mode === "reschedule") {
        await api.post(`/admin/orders/bookings/${booking.id}/reschedule`, {
          scheduled_at: new Date(scheduledAt).toISOString(),
          reason: reason || "Administrative calendar realignment",
        });
      } else if (mode === "cancel") {
        await api.patch(`/admin/orders/bookings/${booking.id}/status`, {
          status: "cancelled",
          cancellation_reason: reason || "Cancelled by platform administrator",
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to update booking");
    } finally {
      setLoading(false);
    }
  };

  const titleMap = {
    confirm: "Confirm Consultation Session",
    reschedule: "Reschedule Appointment Time",
    cancel: "Cancel Consultation Booking",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              mode === "confirm" ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
              mode === "reschedule" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
              "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{titleMap[mode]}</h3>
              <p className="text-xs text-slate-400">
                {booking.booking_number || booking.id.slice(0, 8)} • {booking.customer_name || "Customer"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Service:</span>
            <span className="font-semibold text-white">{booking.service_title || "Consultation"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current Slot:</span>
            <span className="text-purple-300 font-mono">
              {new Date(booking.scheduled_at).toLocaleString()} ({booking.duration_minutes}m)
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === "confirm" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Google Meet / Zoom Conference Link
              </label>
              <div className="relative">
                <Video className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          )}

          {mode === "reschedule" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                New Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          )}

          {(mode === "reschedule" || mode === "cancel") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Reason & Context to Customer
              </label>
              <textarea
                rows={3}
                required={mode === "cancel"}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Designer had an urgent scheduling conflict..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all ${
                mode === "confirm" ? "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20" :
                mode === "reschedule" ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20" :
                "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mode === "confirm" ? "Confirm & Notify" : mode === "reschedule" ? "Apply Reschedule" : "Confirm Cancellation"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
