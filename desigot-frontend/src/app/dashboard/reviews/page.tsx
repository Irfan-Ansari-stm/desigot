"use client";
import React, { useEffect, useState } from "react";
import { ReviewsNavHeader } from "@/components/reviews/ReviewsNavHeader";
import { ReviewsKpiStats } from "@/components/reviews/ReviewsKpiStats";
import { ReviewsTable } from "@/components/reviews/ReviewsTable";
import { api } from "@/lib/api";

export default function AllReviewsPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/admin/reviews/stats/summary");
        if (res.data?.success) setStats(res.data.data);
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <ReviewsNavHeader
        title="All Reviews & Ratings"
        description="Comprehensive marketplace reviews repository with real-time moderation, search, dimensional ratings, and verified purchases."
        activeTab="all"
      />

      <ReviewsKpiStats stats={stats} loading={loading} />

      <ReviewsTable />
    </div>
  );
}
