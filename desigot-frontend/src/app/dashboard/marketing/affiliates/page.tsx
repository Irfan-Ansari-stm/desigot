"use client";
import React, { useEffect, useState } from "react";
import { MarketingNavHeader } from "@/components/marketing/MarketingNavHeader";
import { MarketingKpiStats } from "@/components/marketing/MarketingKpiStats";
import { AffiliatesTable } from "@/components/marketing/AffiliatesTable";
import { api } from "@/lib/api";

export default function AffiliatesDedicatedPage() {
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
        title="8. Affiliate Management & Commission Payouts"
        description="Monitor partner tracking links, attribution conversion rates, revenue generation, and commission balance disbursements."
        activeTab="affiliates"
      />

      <MarketingKpiStats stats={stats} loading={loading} />

      <AffiliatesTable />
    </div>
  );
}
