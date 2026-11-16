"use client";
import React, { useEffect, useState } from "react";
import { MarketingNavHeader } from "@/components/marketing/MarketingNavHeader";
import { MarketingKpiStats } from "@/components/marketing/MarketingKpiStats";
import { PromotionalSectionsTable } from "@/components/marketing/PromotionalSectionsTable";
import { api } from "@/lib/api";

export default function PromotionalSectionsDedicatedPage() {
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
        title="6. Promotional Homepage Sections"
        description="Build dynamic curated rails, multi-column grid collections, and carousel showcases for the public marketplace."
        activeTab="sections"
      />

      <MarketingKpiStats stats={stats} loading={loading} />

      <PromotionalSectionsTable />
    </div>
  );
}
