"use client";
import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Briefcase, CalendarCheck, CheckCircle2, Star, Clock } from "lucide-react";

export function ServiceReportView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>("/admin/analytics/services")
      .then(setData)
      .catch((err) => console.error("Failed to load service report:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading service metrics & booking statistics...</div>;
  }

  const metrics = data?.metrics || {};
  const bookings = data?.bookings || {};
  const topServices = data?.topServices || [];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Services Sold</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {Number(metrics.total_services_sold || 0).toLocaleString()}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">Completed creative contracts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Service GMV Revenue</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ${Number(metrics.service_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Recognized customer payments</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Consultation Bookings</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {Number(bookings.total_bookings || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">{bookings.active_bookings || 0} active appointments</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Booking Completion Rate</div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2">
            {bookings.completion_rate || 0}%
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Verified deliverables fulfilled</div>
        </div>
      </div>

      {/* Top Performing Services Catalog Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Top Performing Services by Revenue</h3>
          <p className="text-xs text-slate-500">Live rankings based on orders, customer ratings, and turnaround days</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Service Title</th>
                <th className="px-4 py-3">Designer / Studio</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-center">Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {topServices.map((srv: any) => (
                <tr key={srv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 max-w-sm truncate">
                    {srv.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{srv.seller_name}</td>
                  <td className="px-4 py-3 text-slate-500">{srv.category_name || "General"}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                    ${Number(srv.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                    {srv.total_orders}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${Number(srv.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(srv.avg_rating || 5).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">{srv.delivery_time_days} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
