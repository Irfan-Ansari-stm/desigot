"use client";
import React, { useEffect, useState } from "react";
import { MarketingNavHeader } from "@/components/marketing/MarketingNavHeader";
import { MarketingKpiStats } from "@/components/marketing/MarketingKpiStats";
import { HomepageBannersTable } from "@/components/marketing/HomepageBannersTable";
import { api } from "@/lib/api";

export default function HomepageBannersDedicatedPage() {
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
        title="5. Homepage Banners & Visual Campaigns"
        description="Manage responsive desktop, tablet, and mobile marketing banners with real-time impression and CTR analytics."
        activeTab="banners"
      />

      <MarketingKpiStats stats={stats} loading={loading} />

      <HomepageBannersTable />
    </div>
  );
}
