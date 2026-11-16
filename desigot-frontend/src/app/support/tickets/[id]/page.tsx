"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import {
  LifeBuoy,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export default function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = use(params);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["support-ticket", id],
    queryFn: () => apiGet<any>(`/disputes/${id}`),
    enabled: !!id,
  });

  const cancelTicket = useMutation({
    mutationFn: () => apiPost(`/disputes/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-ticket", id] });
      toast.success("Ticket closed");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            href="/support/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Tickets
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-ink-primary">
                  Support Ticket #{id.slice(0, 8)}
                </h1>
                {ticket && (
                  <Badge
                    color={
                      ticket.status === "resolved"
                        ? "success"
                        : ticket.status === "cancelled"
                        ? "default"
                        : "warning"
                    }
                    size="sm"
                  >
                    {ticket.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-ink-secondary mt-1">
                Category: <span className="font-semibold capitalize">{ticket?.reason?.replace("_", " ")}</span>
              </p>
            </div>

            {ticket && ticket.status !== "resolved" && ticket.status !== "cancelled" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to close this ticket?")) {
                    cancelTicket.mutate();
                  }
                }}
                loading={cancelTicket.isPending}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Close Ticket
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-48 bg-white border border-border rounded-2xl animate-pulse" />
          </div>
        ) : !ticket ? (
          <div className="bg-white border border-border rounded-3xl p-12 text-center">
            <p className="text-ink-secondary">Ticket not found or you do not have permission.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-sm font-bold text-ink-primary uppercase tracking-wider mb-2">
                Problem Description
              </h2>
              <p className="text-sm text-ink-primary leading-relaxed bg-surface-50 p-4 rounded-xl border border-border">
                {ticket.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-border text-xs">
                <div>
                  <span className="text-ink-tertiary block font-semibold">Opened</span>
                  <span className="text-ink-primary font-medium">{formatDate(ticket.created_at)}</span>
                </div>
                <div>
                  <span className="text-ink-tertiary block font-semibold">Order ID</span>
                  <span className="text-ink-primary font-mono font-medium">#{ticket.order_id?.slice(0, 8)}</span>
                </div>
                <div>
                  <span className="text-ink-tertiary block font-semibold">Review Status</span>
                  <span className="text-ink-primary font-medium">{ticket.status}</span>
                </div>
              </div>
            </Card>

            {ticket.resolution_notes && (
              <Card className="p-6 border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Resolution from Support Concierge
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">
                  {ticket.resolution_notes}
                </p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
