"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatPrice } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { CheckCircle, XCircle, Eye, Package } from "lucide-react";
import Link from "next/link";
import type { Listing } from "@/types";

export default function AdminListingsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending_review");
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings", status, page],
    queryFn: () =>
      status === "pending_review"
        ? apiGet<{ data: Listing[]; pagination: { total: number; totalPages: number } }>(`/listings/admin/pending?page=${page}&limit=20`)
        : apiGet<{ data: Listing[]; pagination: { total: number; totalPages: number } }>(`/listings?status=${status}&page=${page}&limit=20`),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: string; reason?: string }) =>
      apiPost(`/listings/${id}/review`, { action, reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-listings"] }); toast.success("Listing reviewed"); setRejectModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const listings = (data as { data: Listing[]; pagination: { total: number; totalPages: number } } | undefined);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Listings Management</h1>
          <p className="text-sm text-ink-secondary">{listings?.pagination?.total || 0} listings</p>
        </div>
        <Select options={[
          { value: "pending_review", label: "Pending Review" },
          { value: "approved",       label: "Approved" },
          { value: "rejected",       label: "Rejected" },
          { value: "paused",         label: "Paused" },
        ]} value={status} onChange={setStatus} className="w-44" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : !listings?.data?.length ? (
        <EmptyState icon={<Package className="h-8 w-8" />} title="No listings" description={`No listings with status: ${status}`} />
      ) : (
        <>
          <Card padding="none">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-border">
                <tr>{["Listing", "Seller", "Type", "Price", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {listings.data.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="font-medium text-ink-primary truncate">{l.title}</p>
                      <p className="text-xs text-ink-secondary truncate">{l.category_name}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-60 whitespace-nowrap">{l.seller_name || "—"}</td>
                    <td className="px-4 py-3 capitalize text-ink-60">{l.listing_type}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{l.price_personal ? formatPrice(l.price_personal) : "—"}</td>
                    <td className="px-4 py-3 text-ink-60 whitespace-nowrap">{formatDate(l.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/listing/${l.slug}`} target="_blank">
                          <Button variant="ghost" size="icon" title="Preview"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        {l.status === "pending_review" && (
                          <>
                            <Button variant="ghost" size="icon" title="Approve" className="text-success hover:bg-green-50"
                              onClick={() => reviewMutation.mutate({ id: l.id, action: "approve" })} loading={reviewMutation.isPending}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Reject" className="text-danger hover:bg-red-50"
                              onClick={() => setRejectModal({ id: l.id, title: l.title })}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination page={page} totalPages={listings.pagination?.totalPages || 1} onPageChange={setPage} className="mt-4" />
        </>
      )}

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Listing"
        description={`Provide a reason for rejecting "${rejectModal?.title}". This will be shown to the seller.`}
        footer={<>
          <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
          <Button variant="danger" loading={reviewMutation.isPending}
            onClick={() => rejectModal && reviewMutation.mutate({ id: rejectModal.id, action: "reject", reason: rejectReason })}>
            Reject Listing
          </Button>
        </>}>
        <Textarea label="Rejection Reason" placeholder="e.g. Preview images are low resolution. Please upload high-quality screenshots." rows={4}
          value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      </Modal>
    </div>
  );
}
