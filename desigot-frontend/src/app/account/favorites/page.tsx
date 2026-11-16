"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AccountNav } from "@/components/account/AccountNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useMyWishlists, useCreateWishlist, useRemoveFromWishlist } from "@/hooks/useAccount";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import {
  Heart,
  Plus,
  Trash2,
  ExternalLink,
  ShoppingBag,
  FolderHeart,
} from "lucide-react";

export default function AccountFavoritesPage() {
  const { data: wishlistsData, isLoading } = useMyWishlists();
  const createWishlist = useCreateWishlist();
  const removeMutation = useRemoveFromWishlist();

  const [newListName, setNewListName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const wishlists = Array.isArray(wishlistsData) ? wishlistsData : wishlistsData?.data || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      await createWishlist.mutateAsync({ name: newListName.trim() });
      toast.success("Wishlist created!");
      setNewListName("");
      setShowCreate(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <AccountNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-2xl font-black text-ink-primary">Saved Items & Wishlists</h1>
            <p className="text-sm text-ink-secondary mt-1">
              Curate and organize your favorite UI kits, mockups, and services.
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Wishlist
          </Button>
        </div>

        {showCreate && (
          <Card className="p-5 mb-6 border-brand/30 bg-brand/5 max-w-md">
            <form onSubmit={handleCreate} className="space-y-3">
              <label className="block text-xs font-bold text-ink-primary">
                Create New Wishlist Collection
              </label>
              <input
                type="text"
                placeholder="e.g. Mobile UI Inspirations"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                required
              />
              <div className="flex gap-2 justify-end">
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
                  loading={createWishlist.isPending}
                >
                  Create Collection
                </Button>
              </div>
            </form>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : wishlists.length === 0 ? (
          <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-ink-primary text-base mb-1">No wishlists created yet</h3>
            <p className="text-xs text-ink-secondary mb-6">
              Save products and services as you browse the marketplace to view them here later.
            </p>
            <Link href="/products">
              <Button variant="outline" size="sm">Browse Marketplace</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((list: any) => (
              <Card key={list.id} className="p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                      <FolderHeart className="h-5 w-5" />
                    </div>
                    <Badge size="sm" color="info">
                      {list.item_count || 0} items
                    </Badge>
                  </div>
                  <h3 className="font-bold text-ink-primary text-base mb-1">{list.name}</h3>
                  <p className="text-xs text-ink-secondary">
                    {list.is_shared ? "Public collection" : "Private collection"}
                  </p>
                </div>

                <div className="pt-6 border-t border-border mt-6 flex items-center justify-between">
                  <Link href="/products" className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
                    Explore items
                    <ExternalLink className="h-3 w-3" />
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
