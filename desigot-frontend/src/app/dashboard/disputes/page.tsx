"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import type { Dispute } from "@/types";

export default function AdminDisputesPage() {
  const qc = useQueryClient();
  const [now] = useState(() => Date.now());
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState("open");
  const [resolveModal, setResolveModal] = useState<Dispute | null>(null);
  const [outcome, setOutcome]           = useState<"full_refund"|"partial_refund"|"no_refund">("no_refund");
  const [refundAmount, setRefundAmount] = useState("");
  const [notes, setNotes]               = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-disputes", status, page],
    queryFn: () => apiGet<{ data: Dispute[]; pagination: { total: number; totalPages: number } }>(
      `/disputes/admin/all?status=${status}&page=${page}&limit=20`
    ),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, outcome, refundCents, notes }: { id: string; outcome: string; refundCents?: number; notes: string }) =>
      apiPost(`/disputes/admin/${id}/resolve`, { outcome, refund_amount_cents: refundCents, notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-disputes"] }); setResolveModal(null); toast.success("Dispute resolved"); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const reviewMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/disputes/admin/${id}/review`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-disputes"] }); toast.success("Marked as under review"); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const disputes = (data as { data: Dispute[]; pagination: { total: number; totalPages: number } } | undefined);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Disputes</h1>
          <p className="text-sm text-ink-secondary">{disputes?.pagination?.total || 0} disputes</p>
        </div>
        <Select options={[
          { value: "open", label: "Open" }, { value: "under_review", label: "Under Review" },
          { value: "resolved", label: "Resolved" }, { value: "cancelled", label: "Cancelled" },
        ]} value={status} onChange={setStatus} className="w-40" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : !disputes?.data?.length ? (
        <EmptyState icon={<AlertTriangle className="h-8 w-8" />} title="No disputes" description={`No ${status} disputes at this time.`} />
      ) : (
        <>
          <Card padding="none">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-border">
                <tr>{["Order", "Reason", "Amount", "Opened", "SLA", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {disputes.data.map((d) => {
                  const hoursLeft = (new Date(d.sla_deadline).getTime() - now) / 3_600_000;
                  const isBreached = hoursLeft < 0;
                  return (
                    <tr key={d.id} className={cn("hover:bg-surface-50 transition-colors", isBreached && "bg-red-50/30")}>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="font-medium text-ink-primary truncate">{d.listing_title || d.order_id.slice(0, 8) + "…"}</p>
                        <p className="text-xs text-ink-secondary">{d.amount_cents ? formatPrice(d.amount_cents) : ""}</p>
                      </td>
                      <td className="px-4 py-3"><Badge size="sm" className="capitalize">{d.reason?.replace("_", " ")}</Badge></td>
                      <td className="px-4 py-3 font-medium text-ink-primary whitespace-nowrap">{d.amount_cents ? formatPrice(d.amount_cents) : "—"}</td>
                      <td className="px-4 py-3 text-ink-60 whitespace-nowrap">{formatDate(d.opened_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("flex items-center gap-1 text-xs font-medium", isBreached ? "text-danger" : hoursLeft < 24 ? "text-warning" : "text-ink-secondary")}>
                          <Clock className="h-3 w-3" />
                          {isBreached ? "OVERDUE" : `${Math.round(hoursLeft)}h left`}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {d.status === "open" && (
                            <Button variant="secondary" size="sm" onClick={() => reviewMutation.mutate(d.id)}>Review</Button>
                          )}
                          {["open", "under_review"].includes(d.status) && (
                            <Button variant="accent" size="sm" leftIcon={<CheckCircle className="h-3.5 w-3.5" />} onClick={() => { setResolveModal(d); setOutcome("no_refund"); setNotes(""); setRefundAmount(""); }}>
                              Resolve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
          <Pagination page={page} totalPages={disputes.pagination?.totalPages || 1} onPageChange={setPage} className="mt-4" />
        </>
      )}

      {resolveModal && (
        <Modal open={!!resolveModal} onClose={() => setResolveModal(null)} title="Resolve Dispute"
          description={`Order: ${resolveModal.listing_title || resolveModal.order_id.slice(0, 12)}… · ${resolveModal.amount_cents ? formatPrice(resolveModal.amount_cents) : ""}`}
          size="md"
          footer={<>
            <Button variant="secondary" onClick={() => setResolveModal(null)}>Cancel</Button>
            <Button variant="accent" loading={resolveMutation.isPending}
              onClick={() => resolveMutation.mutate({
                id: resolveModal.id,
                outcome,
                refundCents: outcome === "partial_refund" && refundAmount ? parseInt(refundAmount) * 100 : undefined,
                notes,
              })}>
              Confirm Resolution
            </Button>
          </>}>
          <div className="space-y-4">
            <Select label="Outcome" options={[
              { value: "no_refund",       label: "No Refund — Release escrow to seller" },
              { value: "full_refund",     label: "Full Refund — Return payment to buyer" },
              { value: "partial_refund",  label: "Partial Refund — Split between parties" },
            ]} value={outcome} onChange={(v) => setOutcome(v as typeof outcome)} />
            {outcome === "partial_refund" && (
              <Input label="Refund Amount (USD)" type="number" min="0" placeholder="25.00" prefix="$"
                value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            )}
            <Textarea label="Resolution Notes" placeholder="Explain the decision to both parties…" rows={3}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
}
