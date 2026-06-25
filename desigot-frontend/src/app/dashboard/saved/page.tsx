"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { formatDate } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { Heart, Plus, Share2, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Wishlist, Listing } from "@/types";

export default function SavedPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName]       = useState("");
  const [activeList, setActiveList] = useState<string | null>(null);

  const { data: wishlists, isLoading } = useQuery({
    queryKey: ["wishlists"],
    queryFn: () => apiGet<Wishlist[]>("/wishlists/me"),
  });

  const createWishlist = useMutation({
    mutationFn: (name: string) => apiPost<Wishlist>("/wishlists", { name, is_shared: false }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["wishlists"] });
      setShowCreate(false);
      setNewName("");
      setActiveList(data.id);
      toast.success("Wishlist created");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteWishlist = useMutation({
    mutationFn: (id: string) => apiDelete(`/wishlists/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wishlists"] }); toast.success("Wishlist deleted"); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const lists = wishlists as Wishlist[] | undefined || [];
  const selectedList = lists.find((w) => w.id === activeList) || lists[0];

  const { data: wishlistDetail } = useQuery({
    queryKey: ["wishlist-detail", selectedList?.id],
    queryFn: () => apiGet<Wishlist & { items: Listing[] }>(`/wishlists/${selectedList?.id}`),
    enabled: !!selectedList?.id,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-primary">Saved Items</h1><p className="text-sm text-ink-secondary">Your wishlists and saved listings</p></div>
        <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          New List
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : lists.length === 0 ? (
        <EmptyState icon={<Heart className="h-8 w-8" />} title="No wishlists yet"
          description="Create a wishlist to save listings you love."
          action={{ label: "Create Wishlist", onClick: () => setShowCreate(true) }} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Sidebar list selector */}
          <aside className="lg:w-56 shrink-0 space-y-1">
            {lists.map((w) => (
              <button key={w.id} onClick={() => setActiveList(w.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  selectedList?.id === w.id ? "bg-brand text-white" : "bg-white border border-border text-ink-60 hover:bg-surface-50"
                }`}>
                <span className="truncate">{w.name}</span>
                <span className={`text-xs ${selectedList?.id === w.id ? "text-white/60" : "text-ink-secondary"}`}>{w.item_count || 0}</span>
              </button>
            ))}
          </aside>

          {/* Listings grid */}
          <div className="flex-1 min-w-0">
            {selectedList && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-ink-primary">{selectedList.name}</h2>
                  <div className="flex items-center gap-2">
                    {selectedList.is_shared && selectedList.share_token && (
                      <Button variant="ghost" size="sm" leftIcon={<Share2 className="h-3.5 w-3.5" />}
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/wishlists/share/${selectedList.share_token}`); toast.success("Share link copied!"); }}>
                        Share
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-danger hover:bg-red-50"
                      onClick={() => { if (confirm("Delete this wishlist?")) deleteWishlist.mutate(selectedList.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {!(wishlistDetail as (Wishlist & { items: Listing[] }) | undefined)?.items?.length ? (
                  <div className="bg-white border border-border rounded-xl p-12 text-center">
                    <Heart className="h-10 w-10 text-border mx-auto mb-2" />
                    <p className="text-sm text-ink-secondary">This list is empty.</p>
                    <Link href="/browse" className="text-accent text-sm hover:underline mt-1 block">Browse & save items</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(wishlistDetail as (Wishlist & { items: Listing[] }) | undefined)?.items?.map((l) => (
                      <ListingCard key={l.id} listing={l} wishlistId={selectedList.id} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Wishlist" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="accent" loading={createWishlist.isPending} onClick={() => newName.trim() && createWishlist.mutate(newName)}>
            Create
          </Button>
        </>}>
        <Input label="List Name" placeholder="e.g. Figma Resources, Dashboard Inspiration…"
          value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && newName.trim() && createWishlist.mutate(newName)} />
      </Modal>
    </div>
  );
}
