"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useMyOrders } from "@/hooks/useOrders";
import { formatDate } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function SupportTicketsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("quality_issue");
  const [description, setDescription] = useState("");

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => apiGet<{ data: any[]; total: number }>("/disputes/me?role=buyer"),
  });

  const { data: ordersData } = useMyOrders("buyer");
  const orders = ordersData?.data || [];
  const tickets = ticketsData?.data || [];

  const createTicket = useMutation({
    mutationFn: (data: any) => apiPost("/disputes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Support ticket opened! Our team will review shortly.");
      setShowCreate(false);
      setDescription("");
      setOrderId("");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      toast.error("Please select an order associated with your ticket");
      return;
    }
    if (description.length < 20) {
      toast.error("Please provide at least 20 characters explaining the issue");
      return;
    }

    createTicket.mutate({
      order_id: orderId,
      reason,
      description,
    });
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <LifeBuoy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-ink-primary">Support & Mediation Tickets</h1>
              <p className="text-sm text-ink-secondary mt-0.5">
                Review active inquiry tickets or submit a dispute to Desigot resolution center.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreate(!showCreate)}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            {showCreate ? "Close Form" : "Open New Ticket"}
          </Button>
        </div>

        {showCreate && (
          <Card className="p-6 mb-8 border-brand/30 bg-brand/5 max-w-2xl">
            <h2 className="text-base font-bold text-ink-primary mb-1">
              Submit a Support Ticket / Order Dispute
            </h2>
            <p className="text-xs text-ink-secondary mb-4">
              All tickets are tracked and reviewed by Desigot marketplace dispute resolution agents.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Associated Order
                </label>
                <select
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                >
                  <option value="">Select an order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id.slice(0, 8)} — {o.listing_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Reason / Category
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                >
                  <option value="quality_issue">Quality issue or defective file</option>
                  <option value="not_as_described">Not as described in listing preview</option>
                  <option value="non_delivery">Non-delivery of custom milestone</option>
                  <option value="unauthorized">Unauthorized transaction</option>
                  <option value="other">Other general assistance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Detailed Description (min 20 characters)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain the problem in detail to help our concierge team resolve it quickly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={createTicket.isPending}
                >
                  Submit Ticket
                </Button>
              </div>
            </form>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-ink-tertiary">
              <LifeBuoy className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-ink-primary text-base mb-1">No open tickets</h3>
            <p className="text-xs text-ink-secondary mb-6">
              You do not have any unresolved disputes or support tickets with Desigot.
            </p>
            <Link href="/faq">
              <Button variant="outline" size="sm">Browse Help Articles</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <Card key={t.id} className="p-5 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-tertiary font-semibold">
                        #{t.id.slice(0, 8)}
                      </span>
                      <Badge
                        color={
                          t.status === "resolved"
                            ? "success"
                            : t.status === "opened"
                            ? "warning"
                            : "info"
                        }
                        size="sm"
                      >
                        {t.status}
                      </Badge>
                      <span className="text-xs text-ink-secondary capitalize">
                        {t.reason?.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-ink-primary line-clamp-1">
                      {t.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-ink-tertiary">
                      <span>Opened {formatDate(t.created_at)}</span>
                      {t.order_id && <span>• Order #{t.order_id.slice(0, 8)}</span>}
                    </div>
                  </div>

                  <Link href={`/support/tickets/${t.id}`}>
                    <Button variant="secondary" size="sm" className="flex items-center gap-1">
                      View Ticket
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
