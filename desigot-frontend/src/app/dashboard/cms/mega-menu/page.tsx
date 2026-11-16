"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { MegaMenuBuilder } from "@/components/cms/MegaMenuBuilder";
import { api } from "@/lib/api";

export default function MegaMenuCMSPage() {
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/admin/cms/stats/summary");
        if (res.data?.success) setStats(res.data.data);
      } catch (err) {
        console.error("Error loading CMS stats:", err);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <CMSNavHeader
        title="4. Browse Mega Menu Builder"
        description="Configure the full-width categorized mega menu dropdown with featured asset collections, agency services, and taxonomy badges."
        activeTab="mega-menu"
      />

      <CMSKpiStats stats={stats} />

      <MegaMenuBuilder />
    </div>
  );
}
