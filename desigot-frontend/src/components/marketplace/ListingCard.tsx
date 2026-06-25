"use client";
import Link from "next/link";
import { Heart, ShoppingCart, ImageOff } from "lucide-react";
import { useState } from "react";
import type { Listing } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/auth.store";
import { apiPost } from "@/lib/api";
import { toast } from "@/store/ui.store";

interface ListingCardProps {
  listing: Listing;
  variant?: "standard" | "featured" | "compact";
  wishlistId?: string;
}

export function ListingCard({ listing, variant = "standard", wishlistId }: ListingCardProps) {
  const { isAuthenticated } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);

  const lowestPrice = Math.min(
    ...[listing.price_personal, listing.price_commercial, listing.price_extended]
      .filter(Boolean) as number[]
  );

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated()) { toast.info("Please log in to save listings"); return; }
    try {
      setSaved(!saved);
      // If wishlistId given, toggle directly; otherwise prompt would come from wishlist modal
      toast.success(saved ? "Removed from saved" : "Saved to wishlist");
    } catch {
      setSaved(!saved);
    }
  };

  if (variant === "compact") {
    return (
      <Link href={`/listing/${listing.slug}`} className="flex items-center gap-3 group">
        <div className="w-12 h-12 rounded-lg bg-surface-100 overflow-hidden shrink-0">
          {listing.primary_image && !imgError ? (
            <img src={listing.primary_image} alt={listing.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : <ImageOff className="h-5 w-5 text-border m-auto mt-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink-primary line-clamp-1 group-hover:text-accent transition-colors">{listing.title}</p>
          <p className="text-xs text-ink-secondary">{lowestPrice ? `From ${formatPrice(lowestPrice)}` : "Custom pricing"}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/listing/${listing.slug}`} className="group block">
      <div className={cn(
        "bg-white border border-border rounded-xl overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        variant === "featured" && "border-accent/20"
      )}>
        {/* Image */}
        <div className="relative aspect-[4/3] bg-surface-100 overflow-hidden">
          {listing.primary_image && !imgError ? (
            <img
              src={listing.primary_image}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="h-10 w-10 text-border" />
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Save button */}
          <button
            onClick={handleSave}
            className={cn(
              "absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm",
              "opacity-0 group-hover:opacity-100 sm:opacity-100 transition-all hover:scale-110",
              saved && "opacity-100"
            )}
          >
            <Heart className={cn("h-4 w-4 transition-colors", saved ? "fill-accent text-accent" : "text-ink-secondary")} />
          </button>

          {/* Featured badge */}
          {listing.is_featured && (
            <div className="absolute top-2.5 left-2.5">
              <Badge color="error" size="sm">Featured</Badge>
            </div>
          )}

          {/* Seller avatar */}
          {listing.seller_avatar !== undefined && (
            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Avatar
                src={listing.seller_avatar}
                name={listing.seller_name || "Seller"}
                size="xs"
                verified={listing.seller_verified}
                className="border-2 border-white"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          <p className="text-sm font-semibold text-ink-primary line-clamp-2 leading-snug group-hover:text-accent transition-colors">
            {listing.title}
          </p>

          {listing.seller_name && (
            <p className="text-xs text-ink-secondary mt-1 truncate">{listing.seller_name}</p>
          )}

          <div className="flex items-center justify-between mt-2.5">
            <div>
              {lowestPrice ? (
                <span className="text-base font-bold text-ink-primary">
                  From {formatPrice(lowestPrice)}
                </span>
              ) : (
                <span className="text-sm text-ink-secondary">Custom price</span>
              )}
            </div>
            {listing.avg_rating && listing.review_count > 0 ? (
              <StarRating rating={listing.avg_rating} showValue count={listing.review_count} />
            ) : null}
          </div>

          {listing.tags?.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {listing.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs bg-surface-50 text-ink-secondary px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
