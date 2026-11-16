"use client";
import React, { useEffect, useState } from "react";
import { MarketingNavHeader } from "@/components/marketing/MarketingNavHeader";
import { MarketingKpiStats } from "@/components/marketing/MarketingKpiStats";
import { FeaturedServicesTable } from "@/components/marketing/FeaturedServicesTable";
import { api } from "@/lib/api";

export default function FeaturedServicesDedicatedPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/admin/marketing/stats/summary");
        if (res.data?.success) setStats(res.data.data);
      } catch (err) {
        console.error("Error loading marketing stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <MarketingNavHeader
        title="3. Featured Services Showcase"
        description="Curate top-tier agency and freelance services for homepage hero, category headers, and search result highlights."
        activeTab="featured-services"
      />

      <MarketingKpiStats stats={stats} loading={loading} />

      <FeaturedServicesTable />
    </div>
  );
}
