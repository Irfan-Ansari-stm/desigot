"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  AlertTriangle,
  Scale,
  CheckCircle2,
  DollarSign,
  Gavel,
} from "lucide-react";
import { api } from "@/lib/api";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderStatusBadge } from "@/components/orders-bookings/OrderStatusBadge";
import { DisputeResolutionModal } from "@/components/orders-bookings/DisputeResolutionModal";

interface Dispute {
  id: string;
  order_id: string;
  amount_cents: number;
  reason: string;
  claim_summary?: string;
  dispute_status: string;
  created_at: string;
  order_title?: string;
  buyer_name?: string;
  buyer_email?: string;
  seller_name?: string;
  seller_email?: string;
}

export default function DisputedOrdersPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/orders/disputes");
      if (res.data?.success) {
        let list = res.data.data.disputes || [];
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(
            (d: Dispute) =>
              d.order_title?.toLowerCase().includes(q) ||
              d.buyer_name?.toLowerCase().includes(q) ||
              d.reason?.toLowerCase().includes(q)
          );
        }
        setDisputes(list);
        setTotal(list.length);
      }
    } catch (err) {
      console.error("Failed to load disputes:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Disputed Orders & Mediation</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              {total} Active Cases
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Neutral arbitration, escrow hold resolution, contractual compliance reviews, and financial splits
          </p>
        </div>

        <button
          onClick={fetchDisputes}
          className="p-2.5 self-start md:self-auto rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh Disputes"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-400" : ""}`} />
        </button>
      </div>

      {/* Disputes Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Dispute / Order</th>
                <th className="py-3.5 px-4">Reason & Claim</th>
                <th className="py-3.5 px-4">Escrow Value</th>
                <th className="py-3.5 px-4">Buyer (Claimant)</th>
                <th className="py-3.5 px-4">Seller (Respondent)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Opened</th>
                <th className="py-3.5 px-4 text-right">Adjudicate</th>
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
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShieldAlert className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-200">No active disputes opened</p>
                  </td>
                </tr>
              ) : (
                disputes.map((dispute) => (
                  <tr
                    key={dispute.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/dashboard/orders-bookings/${dispute.order_id}?tab=disputes`}
                        className="font-semibold text-white hover:text-rose-400 transition-colors block truncate max-w-[200px]"
                      >
                        {dispute.order_title || `Order #${dispute.order_id.slice(0, 8)}`}
                      </Link>
                      <span className="text-[11px] font-mono text-slate-500">
                        Dispute #{dispute.id.slice(0, 8)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-rose-300 text-xs">
                        {dispute.reason || "Deliverable non-compliance"}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[260px] mt-0.5">
                        {dispute.claim_summary || "Buyer reported quality discrepancy."}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      ${((dispute.amount_cents || 0) / 100).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-200">{dispute.buyer_name || "Buyer"}</div>
                      <div className="text-[11px] text-slate-500">{dispute.buyer_email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-200">{dispute.seller_name || "Seller"}</div>
                      <div className="text-[11px] text-slate-500">{dispute.seller_email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={dispute.dispute_status} type="dispute" />
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(dispute.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveDispute(dispute)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all inline-flex items-center gap-1.5"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>Adjudicate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {activeDispute && (
        <DisputeResolutionModal
          isOpen={!!activeDispute}
          dispute={activeDispute}
          onClose={() => setActiveDispute(null)}
          onSuccess={() => fetchDisputes()}
        />
      )}
    </div>
  );
}
