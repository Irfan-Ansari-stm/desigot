"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import { MapPin, Calendar, TrendingUp, MessageSquare, Star } from "lucide-react";
import type { User, Listing, Review } from "@/types";

export default function SellerProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data: seller, isLoading } = useQuery({
    queryKey: ["seller-profile", username],
    queryFn: () => apiGet<User>(`/users/profile/${username}`),
    enabled: !!username,
  });

  const { data: listings } = useQuery({
    queryKey: ["seller-listings", username],
    queryFn: () => apiGet<{ data: Listing[] }>(`/listings?seller_id=${seller?.id}&status=approved&limit=12`),
    enabled: !!seller?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["seller-reviews", seller?.id],
    queryFn: () => apiGet<{ data: Review[]; pagination: { total: number } }>(`/reviews/seller/${seller?.id}?limit=6`),
    enabled: !!seller?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold text-ink-primary">Seller not found</h2>
        </div>
        <Footer />
      </div>
    );
  }

  const sellerListings = (listings as { data: Listing[] } | undefined)?.data || [];
  const sellerReviews  = (reviews as { data: Review[]; pagination: { total: number } } | undefined)?.data || [];
  const reviewTotal    = (reviews as { data: Review[]; pagination: { total: number } } | undefined)?.pagination?.total || 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <NotificationsPanel />

      {/* Cover */}
      <div className="h-40 bg-gradient-to-r from-brand via-accent2 to-accent3" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Profile header */}
        <div className="relative -mt-16 pb-8 border-b border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <Avatar
              src={seller.avatar_url}
              name={seller.display_name}
              size="xl"
              verified={seller.seller_verified}
              className="border-4 border-white rounded-full shadow-md"
            />
            <div className="flex-1 min-w-0 sm:mb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-ink-primary">{seller.display_name}</h1>
                {seller.seller_verified && (
                  <Badge color="success" size="sm" dot>Verified Seller</Badge>
                )}
                {seller.seller_type && (
                  <Badge color="brand" variant="ghost" size="sm" className="capitalize">{seller.seller_type}</Badge>
                )}
              </div>
              {seller.username && <p className="text-sm text-ink-secondary">@{seller.username}</p>}
              {seller.bio && <p className="text-sm text-ink-60 mt-1 max-w-2xl">{seller.bio}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-ink-secondary">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since {formatDate(seller.created_at)}
                </span>
                {seller.avg_seller_rating && seller.seller_review_count > 0 && (
                  <StarRating rating={seller.avg_seller_rating} showValue count={seller.seller_review_count} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-8">
          {/* Sidebar stats */}
          <aside className="lg:col-span-1 space-y-4">
            <Card padding="sm">
              <h3 className="text-sm font-semibold text-ink-primary mb-3">Seller Stats</h3>
              <div className="space-y-3">
                {[
                  { label: "Total Sales",    value: seller.total_sales?.toLocaleString() || "0",         icon: <TrendingUp className="h-4 w-4" /> },
                  { label: "Reviews",        value: seller.seller_review_count?.toLocaleString() || "0",  icon: <Star className="h-4 w-4" /> },
                  { label: "Response Rate",  value: seller.response_rate ? `${Math.round(parseFloat(seller.response_rate as unknown as string) * 100)}%` : "—", icon: <MessageSquare className="h-4 w-4" /> },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <span className="text-ink-secondary">{stat.icon}</span>
                    <div>
                      <p className="text-xs text-ink-secondary">{stat.label}</p>
                      <p className="text-sm font-semibold text-ink-primary">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Listings */}
            {sellerListings.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-ink-primary mb-4">
                  Listings <span className="text-sm font-normal text-ink-secondary">({sellerListings.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {sellerListings.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
              </div>
            )}

            {/* Reviews */}
            {sellerReviews.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-ink-primary mb-4">
                  Reviews <span className="text-sm font-normal text-ink-secondary">({reviewTotal})</span>
                </h2>
                <div className="space-y-4">
                  {sellerReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card padding="sm" className="hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar src={review.reviewer_avatar} name={review.reviewer_name || "Reviewer"} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium text-ink-primary">{review.reviewer_name}</p>
            <StarRating rating={review.rating_overall} size="sm" />
          </div>
          {review.listing_title && (
            <p className="text-xs text-ink-secondary mt-0.5">on &quot;{review.listing_title}&quot;</p>
          )}
          <p className="text-sm text-ink-60 mt-2 leading-relaxed">{review.review_text}</p>
          {review.response_text && (
            <div className="mt-3 pl-3 border-l-2 border-accent/30 bg-surface-50 rounded-r-lg p-2">
              <p className="text-xs font-medium text-ink-primary mb-1">Seller response:</p>
              <p className="text-xs text-ink-secondary">{review.response_text}</p>
            </div>
          )}
          <p className="text-xs text-ink-secondary/60 mt-2">{formatDate(review.published_at || review.created_at)}</p>
        </div>
      </div>
    </Card>
  );
}
