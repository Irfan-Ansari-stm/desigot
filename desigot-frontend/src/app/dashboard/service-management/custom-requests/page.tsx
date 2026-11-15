"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquarePlus, RefreshCw, DollarSign, Calendar, User, FileText, CheckCircle2 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface CustomRequest {
  id: string;
  title: string;
  description: string;
  budget_min_usd: string;
  budget_max_usd: string;
  expected_delivery_date?: string;
  status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  category_name?: string;
  assigned_seller_name?: string;
  quotes_count: number;
}

export default function CustomServiceRequestsPage() {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/admin/services/custom-requests");
      const list = Array.isArray(data) ? data : data?.requests || data?.data || [];
      setRequests(list);
    } catch (err) {
      console.error("Failed to load custom requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <MessageSquarePlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Custom Service Requests</h1>
            <p className="text-sm text-slate-400">
              Client RFPs, private custom briefs, quotation matching, and order conversion.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#1e293b]/70 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-4 px-4">Request Brief</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Budget Range</th>
                <th className="py-4 px-4">Quotes</th>
                <th className="py-4 px-4">Assigned Seller</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Loading custom requests...</p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <p className="text-base font-semibold text-slate-400">No custom service requests found.</p>
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-bold text-white text-xs">{r.title}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{r.description}</p>
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <div className="font-medium text-white">{r.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{r.customer_email}</div>
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {r.category_name || "General"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs font-semibold text-emerald-400">
                      ${r.budget_min_usd} - ${r.budget_max_usd}
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                        {r.quotes_count} quotes
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-300">
                      {r.assigned_seller_name || "Unassigned"}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
                        {r.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
