"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
  DollarSign,
  Clock,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderStatusBadge } from "@/components/orders-bookings/OrderStatusBadge";
import { CustomQuoteBuilderModal } from "@/components/orders-bookings/CustomQuoteBuilderModal";

interface Quote {
  id: string;
  quote_number: string;
  title: string;
  price_cents: number;
  status: string;
  estimated_delivery_days: number;
  revisions_allowed: number;
  negotiation_count: number;
  created_at: string;
  buyer_name?: string;
  buyer_email?: string;
  seller_name?: string;
  seller_email?: string;
  converted_order_id?: string;
}

export default function CustomQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/orders/quotes");
      if (res.data?.success) {
        let list = res.data.data.quotes || [];
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(
            (item: Quote) =>
              item.title?.toLowerCase().includes(q) ||
              item.quote_number?.toLowerCase().includes(q) ||
              item.buyer_name?.toLowerCase().includes(q)
          );
        }
        setQuotes(list);
        setTotal(list.length);
      }
    } catch (err) {
      console.error("Failed to load quotes:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleConvertQuote = async (quoteId: string) => {
    setConvertingId(quoteId);
    try {
      await api.post(`/admin/orders/quotes/${quoteId}/convert`);
      fetchQuotes();
    } catch (err) {
      console.error("Failed to convert quote to order:", err);
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Custom Quotes & Enterprise Proposals</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              {total} Custom Proposals
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Bespoke design scopes, custom pricing negotiations, and one-click conversion to active escrow contracts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchQuotes}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Quotes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Quote</span>
          </button>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Quote Number & Scope</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4">Timeline</th>
                <th className="py-3.5 px-4">Buyer / Client</th>
                <th className="py-3.5 px-4">Negotiations</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Issued</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
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
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-200">No custom quotes created</p>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white truncate max-w-[240px]">
                        {quote.title}
                      </div>
                      <span className="font-mono text-[11px] text-purple-400 font-semibold">
                        {quote.quote_number}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      ${((quote.price_cents || 0) / 100).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div>{quote.estimated_delivery_days} days</div>
                      <div className="text-[10px] text-slate-500">{quote.revisions_allowed} revs</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-200">{quote.buyer_name || "Enterprise"}</div>
                      <div className="text-[11px] text-slate-500">{quote.buyer_email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {quote.negotiation_count} rounds
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={quote.status} type="quote" />
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(quote.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {quote.status === "converted_to_order" && quote.converted_order_id ? (
                        <Link
                          href={`/dashboard/orders-bookings/${quote.converted_order_id}`}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <span>View Order</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleConvertQuote(quote.id)}
                          disabled={convertingId === quote.id}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all inline-flex items-center gap-1.5"
                          title="Convert Accepted Quote into Formal Order"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Convert to Order</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Builder Modal */}
      <CustomQuoteBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={() => fetchQuotes()}
      />
    </div>
  );
}
