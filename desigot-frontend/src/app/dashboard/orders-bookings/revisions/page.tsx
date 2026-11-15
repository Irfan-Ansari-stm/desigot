"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Search,
  RefreshCw,
  Clock,
  Eye,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderStatusBadge } from "@/components/orders-bookings/OrderStatusBadge";

interface Revision {
  id: string;
  order_id: string;
  revision_number: number;
  instructions: string;
  status: string;
  deadline_extension_days?: number;
  created_at: string;
  order_title?: string;
  customer?: {
    display_name: string;
    email: string;
  };
  seller?: {
    display_name: string;
    email: string;
  };
}

export default function RevisionRequestsPage() {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchRevisions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/orders/revisions");
      if (res.data?.success) {
        let list = res.data.data.revisions || [];
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(
            (r: Revision) =>
              r.order_title?.toLowerCase().includes(q) ||
              r.customer?.display_name?.toLowerCase().includes(q) ||
              r.instructions?.toLowerCase().includes(q)
          );
        }
        setRevisions(list);
        setTotal(list.length);
      }
    } catch (err) {
      console.error("Failed to load revisions:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Revision Requests</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              {total} Requests
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Design feedback cycles, typography/spacing tweaks, and iterative sprint adjustments requested by clients
          </p>
        </div>

        <button
          onClick={fetchRevisions}
          className="p-2.5 self-start md:self-auto rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh Revisions"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-400" : ""}`} />
        </button>
      </div>

      {/* Revisions Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Order / Project</th>
                <th className="py-3.5 px-4">Cycle</th>
                <th className="py-3.5 px-4">Client Request Directive</th>
                <th className="py-3.5 px-4">Designer</th>
                <th className="py-3.5 px-4">Extension</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Requested</th>
                <th className="py-3.5 px-4 text-right">Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-6 bg-slate-800/50 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : revisions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-200">No active revision requests</p>
                  </td>
                </tr>
              ) : (
                revisions.map((rev) => (
                  <tr
                    key={rev.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/dashboard/orders-bookings/${rev.order_id}`}
                        className="font-semibold text-white hover:text-rose-400 transition-colors block truncate max-w-[200px]"
                      >
                        {rev.order_title || `Order #${rev.order_id.slice(0, 8)}`}
                      </Link>
                      <span className="text-[11px] font-mono text-slate-500">
                        #{rev.order_id.slice(0, 8)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        Rev #{rev.revision_number}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-xs text-slate-300 line-clamp-2 max-w-[320px]">
                        {rev.instructions}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-200">{rev.seller?.display_name || "Designer"}</div>
                      <div className="text-[11px] text-slate-500">{rev.seller?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {rev.deadline_extension_days ? (
                        <span className="text-amber-400 font-mono">+{rev.deadline_extension_days} days</span>
                      ) : (
                        "Standard"
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={rev.status} type="delivery" />
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/orders-bookings/${rev.order_id}?tab=revisions`}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-600 transition-colors inline-block"
                        title="View Revision Details"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
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
