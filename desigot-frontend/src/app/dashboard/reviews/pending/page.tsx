"use client";
import React, { useEffect, useState } from "react";
import { ReviewsNavHeader } from "@/components/reviews/ReviewsNavHeader";
import { ReviewsKpiStats } from "@/components/reviews/ReviewsKpiStats";
import { PendingReviewsTable } from "@/components/reviews/PendingReviewsTable";
import { api } from "@/lib/api";

export default function PendingReviewsPage() {
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
        title="Pending Reviews Queue"
        description="Priority moderation queue for unverified or high-risk review submissions requiring manual approval."
        activeTab="pending"
      />

      <ReviewsKpiStats stats={stats} loading={loading} />

      <PendingReviewsTable />
    </div>
  );
}
