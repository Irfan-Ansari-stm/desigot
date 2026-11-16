"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AccountNav } from "@/components/account/AccountNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useMyReviews } from "@/hooks/useAccount";
import { formatDate } from "@/lib/utils";
import { Star, MessageSquare, ExternalLink } from "lucide-react";

export default function AccountReviewsPage() {
  const { data: reviewsData, isLoading } = useMyReviews();
  const reviews = reviewsData?.data || [];

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <AccountNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-2xl font-black text-ink-primary">My Reviews & Ratings</h1>
            <p className="text-sm text-ink-secondary mt-1">
              Feedback and ratings you provided to creators and service providers.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 fill-current" />
            </div>
            <h3 className="font-bold text-ink-primary text-base mb-1">No reviews yet</h3>
            <p className="text-xs text-ink-secondary mb-6">
              Once you purchase assets or complete service orders, you can leave helpful reviews for the creators.
            </p>
            <Link href="/account/orders">
              <Button variant="outline" size="sm">View My Purchases</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <Card key={rev.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= rev.rating_overall
                            ? "text-amber-400 fill-amber-400"
                            : "text-surface-200"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-ink-primary ml-1">
                      {rev.rating_overall}.0
                    </span>
                  </div>
                  <span className="text-xs text-ink-tertiary">
                    {formatDate(rev.created_at)}
                  </span>
                </div>

                <div className="py-4">
                  <p className="text-sm text-ink-primary leading-relaxed">
                    {rev.review_text}
                  </p>
                </div>

                {rev.seller_response && (
                  <div className="mt-2 bg-surface-50 border border-border rounded-xl p-3.5 text-xs text-ink-secondary">
                    <span className="font-semibold text-ink-primary block mb-1">
                      Seller Response:
                    </span>
                    <p>{rev.seller_response}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
