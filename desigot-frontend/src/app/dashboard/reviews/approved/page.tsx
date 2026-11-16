"use client";
import React, { useEffect, useState } from "react";
import { ReviewsNavHeader } from "@/components/reviews/ReviewsNavHeader";
import { ReviewsKpiStats } from "@/components/reviews/ReviewsKpiStats";
import { ApprovedReviewsTable } from "@/components/reviews/ApprovedReviewsTable";
import { api } from "@/lib/api";

export default function ApprovedReviewsPage() {
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
        title="Approved Reviews"
        description="Publicly visible reviews active on product and service listings contributing to rating calculations."
        activeTab="approved"
      />

      <ReviewsKpiStats stats={stats} loading={loading} />

      <ApprovedReviewsTable />
    </div>
  );
}
