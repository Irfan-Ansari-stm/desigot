"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Search,
  RefreshCw,
  User,
  ShoppingBag,
  Calendar,
  AlertTriangle,
  FileText,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { apiGet } from "@/lib/api";

export default function CustomerActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 25,
      };
      if (search.trim()) params.search = search.trim();
      if (eventType) params.event_type = eventType;

      const res = await apiGet<any>("/admin/customers/activity", params);
      const items = res?.activities || res?.events || res?.data?.activities || (Array.isArray(res) ? res : []);
      setActivities(items);
      setPagination(
        res?.pagination || {
          page,
          limit: 25,
          total: items.length,
          totalPages: Math.ceil(items.length / 25) || 1,
        }
      );
    } catch (err) {
      console.error("Failed to load customer activities", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, eventType]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getEventBadge = (type: string) => {
    if (type.includes("order")) {
      return { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: ShoppingBag };
    }
    if (type.includes("booking")) {
      return { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Calendar };
    }
    if (type.includes("complaint")) {
      return { bg: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: AlertTriangle };
    }
    if (type.includes("login") || type.includes("registered")) {
      return { bg: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: User };
    }
    return { bg: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: FileText };
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold tracking-wider uppercase mb-1">
            <span>Customer Management</span>
            <span>•</span>
            <span className="text-slate-400">Timeline & Events</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Clock className="w-7 h-7 text-indigo-400" />
            Customer Activity Timeline
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time audit log of user behavior, logins, purchases, appointment bookings, and support inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadActivities()}
            className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
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
              placeholder="Search by event description, customer name, or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <select
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
          >
            <option value="">All Event Types</option>
            <option value="customer.registered">Customer Registered</option>
            <option value="customer.login">Customer Logins</option>
            <option value="order.placed">Orders Placed</option>
            <option value="booking.created">Bookings Scheduled</option>
            <option value="complaint.submitted">Complaints Submitted</option>
            <option value="customer.profile_updated">Profile Updates</option>
          </select>
        </div>
      </div>

      <div className="w-full bg-[#0B1120]/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No customer activity events found.
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
            {activities.map((a) => {
              const badge = getEventBadge(a.event_type);
              const Icon = badge.icon;

              return (
                <div key={a.id} className="flex items-start gap-4 relative pl-9 text-xs">
                  <div className="absolute left-2.5 top-2 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-[#0B1120] shadow-sm shadow-indigo-500/50" />
                  <div className="flex-1 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl hover:bg-slate-800/30 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border ${badge.bg}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{a.event_type}</span>
                        </span>
                        <Link
                          href={`/dashboard/customer-management/${a.customer_id}`}
                          className="font-medium text-white hover:text-indigo-400 transition"
                        >
                          {a.customer_name || "Customer"}
                        </Link>
                        <span className="text-slate-500 text-[11px]">({a.customer_email})</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{a.description}</p>
                    {a.ip_address && (
                      <span className="text-[10px] text-slate-500 block mt-1">
                        IP: {a.ip_address}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
            events
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
    </div>
  );
}
