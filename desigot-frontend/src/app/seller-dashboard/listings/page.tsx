"use client";
import { useState } from "react";
import Link from "next/link";
import { useMyListings } from "@/hooks/useListings";
import { useDeleteListing, useSubmitListingForReview } from "@/hooks/useListings";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { Plus, Edit, Trash2, Eye, Send, Package, Pause, Play } from "lucide-react";
import type { Listing } from "@/types";
import { apiPost } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function SellerListingsPage() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = useMyListings({ status: status || undefined });
  const deleteListing  = useDeleteListing();
  const submitReview   = useSubmitListingForReview();
  const qc             = useQueryClient();
  const listings = (data as { data: Listing[] } | undefined)?.data || [];

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteListing.mutateAsync(id);
      toast.success("Listing deleted");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitReview.mutateAsync(id);
      toast.success("Submitted for review!");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handlePause = async (id: string, isPaused: boolean) => {
    try {
      await apiPost(`/listings/${id}/${isPaused ? "unpause" : "pause"}`);
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      toast.success(isPaused ? "Listing resumed" : "Listing paused");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-primary">My Listings</h1><p className="text-sm text-ink-secondary">{listings.length} listings</p></div>
        <div className="flex items-center gap-3">
          <Select options={[
            { value: "", label: "All Status" }, { value: "draft", label: "Draft" },
            { value: "pending_review", label: "In Review" }, { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" }, { value: "paused", label: "Paused" },
          ]} value={status} onChange={setStatus} className="w-36" />
          <Link href="/seller-dashboard/listings/new">
            <Button variant="accent" size="sm" leftIcon={<Plus className="h-4 w-4" />}>New Listing</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}</div>
      ) : listings.length === 0 ? (
        <EmptyState icon={<Package className="h-8 w-8" />} title="No listings yet"
          description="Create your first listing to start selling on Desigot."
          action={{ label: "Create Listing", onClick: () => window.location.href = "/seller-dashboard/listings/new" }} />
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <Card key={listing.id} padding="sm" className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                {listing.primary_image ? (
                  <img src={listing.primary_image} alt={listing.title} className="w-16 h-16 rounded-lg object-cover shrink-0 bg-surface-100" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-surface-100 flex items-center justify-center shrink-0"><Package className="h-6 w-6 text-border" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-ink-primary line-clamp-1">{listing.title}</p>
                    <StatusBadge status={listing.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ink-secondary flex-wrap">
                    <span>{listing.category_name}</span>
                    <span>·</span>
                    <span className="capitalize">{listing.listing_type}</span>
                    {listing.price_personal && <><span>·</span><span className="font-medium text-ink-primary">From {formatPrice(listing.price_personal)}</span></>}
                    <span>·</span>
                    <span>{listing.total_sales} sales</span>
                    <span>·</span>
                    <span>{listing.view_count?.toLocaleString()} views</span>
                  </div>
                  {listing.rejection_reason && (
                    <p className="mt-1 text-xs text-danger bg-red-50 px-2 py-1 rounded">{listing.rejection_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {listing.status === "approved" && (
                    <Link href={`/listing/${listing.slug}`} target="_blank">
                      <Button variant="ghost" size="icon" title="View listing"><Eye className="h-4 w-4" /></Button>
                    </Link>
                  )}
                  {listing.status === "draft" && (
                    <Button variant="secondary" size="sm" onClick={() => handleSubmit(listing.id)} leftIcon={<Send className="h-3.5 w-3.5" />}>
                      Submit
                    </Button>
                  )}
                  {listing.status === "approved" && (
                    <Button variant="ghost" size="icon" title="Pause" onClick={() => handlePause(listing.id, false)}><Pause className="h-4 w-4" /></Button>
                  )}
                  {listing.status === "paused" && (
                    <Button variant="ghost" size="icon" title="Resume" onClick={() => handlePause(listing.id, true)}><Play className="h-4 w-4" /></Button>
                  )}
                  <Link href={`/seller-dashboard/listings/${listing.id}/edit`}>
                    <Button variant="ghost" size="icon" title="Edit"><Edit className="h-4 w-4" /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" title="Delete" className="text-danger hover:bg-red-50"
                    onClick={() => handleDelete(listing.id, listing.title)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
