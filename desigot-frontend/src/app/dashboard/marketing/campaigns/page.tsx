"use client";
import React, { useEffect, useState } from "react";
import { MarketingNavHeader } from "@/components/marketing/MarketingNavHeader";
import { MarketingKpiStats } from "@/components/marketing/MarketingKpiStats";
import { CampaignsTable } from "@/components/marketing/CampaignsTable";
import { api } from "@/lib/api";

export default function CampaignsDedicatedPage() {
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
        title="2. Discount Campaigns & Flash Sales"
        description="Schedule marketplace-wide sales, seasonal discounts, flash sprints, budget tracking, and item-level discount rules."
        activeTab="campaigns"
      />

      <MarketingKpiStats stats={stats} loading={loading} />

      <CampaignsTable />
    </div>
  );
}
