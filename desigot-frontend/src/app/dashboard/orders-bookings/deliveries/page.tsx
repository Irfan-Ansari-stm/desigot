"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileCheck,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Clock,
  Eye,
  FileText,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderStatusBadge } from "@/components/orders-bookings/OrderStatusBadge";
import { DeliveryReviewModal } from "@/components/orders-bookings/DeliveryReviewModal";

interface Delivery {
  id: string;
  order_id: string;
  version_number: number;
  delivery_notes: string;
  files: any[];
  external_link?: string;
  status: string;
  submitted_at: string;
  order_title?: string;
  amount_cents?: number;
  customer?: {
    display_name: string;
    email: string;
  };
  seller?: {
    display_name: string;
    email: string;
  };
}

export default function SubmittedDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reviewDelivery, setReviewDelivery] = useState<Delivery | null>(null);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/orders/deliveries");
      if (res.data?.success) {
        let list = res.data.data.deliveries || [];
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(
            (d: Delivery) =>
              d.order_title?.toLowerCase().includes(q) ||
              d.customer?.display_name?.toLowerCase().includes(q) ||
              d.seller?.display_name?.toLowerCase().includes(q)
          );
        }
        setDeliveries(list);
        setTotal(list.length);
      }
    } catch (err) {
      console.error("Failed to load deliveries:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Submitted Deliverables</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30">
              {total} Submitted
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Design deliverables, production Figma files, and code packages submitted for client review or approval
          </p>
        </div>

        <button
          onClick={fetchDeliveries}
          className="p-2.5 self-start md:self-auto rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh Deliveries"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-violet-400" : ""}`} />
        </button>
      </div>

      {/* Deliveries Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Order / Package</th>
                <th className="py-3.5 px-4">Version</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Seller</th>
                <th className="py-3.5 px-4">Assets & Links</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4 text-right">Review</th>
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
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-200">No submitted deliverables pending review</p>
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr
                    key={delivery.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/dashboard/orders-bookings/${delivery.order_id}`}
                        className="font-semibold text-white hover:text-violet-400 transition-colors block truncate max-w-[220px]"
                      >
                        {delivery.order_title || `Order #${delivery.order_id.slice(0, 8)}`}
                      </Link>
                      <span className="text-[11px] font-mono text-slate-500">
                        #{delivery.order_id.slice(0, 8)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                        v{delivery.version_number}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-200">{delivery.customer?.display_name || "Client"}</div>
                      <div className="text-[11px] text-slate-500">{delivery.customer?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-200">{delivery.seller?.display_name || "Designer"}</div>
                      <div className="text-[11px] text-slate-500">{delivery.seller?.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {delivery.external_link && (
                          <a
                            href={delivery.external_link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-slate-800 text-purple-400 hover:text-white"
                            title="Open External Deliverable"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <span className="text-xs text-slate-400">
                          {delivery.files?.length || 1} file(s) attached
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={delivery.status} type="delivery" />
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(delivery.submitted_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setReviewDelivery(delivery)}
                        className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewDelivery && (
        <DeliveryReviewModal
          isOpen={!!reviewDelivery}
          delivery={reviewDelivery}
          onClose={() => setReviewDelivery(null)}
          onSuccess={() => fetchDeliveries()}
        />
      )}
    </div>
  );
}
