"use client";
import React, { useEffect, useState } from "react";
import { MarketingNavHeader } from "@/components/marketing/MarketingNavHeader";
import { MarketingKpiStats } from "@/components/marketing/MarketingKpiStats";
import { ReferralProgramsTable } from "@/components/marketing/ReferralProgramsTable";
import { api } from "@/lib/api";

export default function ReferralsDedicatedPage() {
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
        title="9. Referral Programs & Viral Attribution"
        description="Configure customer invite rewards, minimum order thresholds, self-referral blocks, and conversion disbursements."
        activeTab="referrals"
      />

      <MarketingKpiStats stats={stats} loading={loading} />

      <ReferralProgramsTable />
    </div>
  );
}
