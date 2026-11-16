"use client";
import React, { useEffect, useState } from "react";
import { ReviewsNavHeader } from "@/components/reviews/ReviewsNavHeader";
import { ReviewsKpiStats } from "@/components/reviews/ReviewsKpiStats";
import { ServiceRatingTable } from "@/components/reviews/ServiceRatingTable";
import { api } from "@/lib/api";

export default function ServiceRatingsPage() {
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
        title="Service Ratings & Analytics"
        description="Client satisfaction dimensional scores: deliverable quality, communication, value, and delivery speed."
        activeTab="services"
      />

      <ReviewsKpiStats stats={stats} loading={loading} />

      <ServiceRatingTable />
    </div>
  );
}
