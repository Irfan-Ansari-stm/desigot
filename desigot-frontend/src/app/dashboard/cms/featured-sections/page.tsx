"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { FeaturedSectionsCMS } from "@/components/cms/FeaturedSectionsCMS";
import { api } from "@/lib/api";

export default function FeaturedSectionsCMSPage() {
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
        title="7. Curated Featured Sections"
        description="Handcrafted carousels, staff picks, and specialized collections displayed on marketplace landing pages."
        activeTab="featured-sections"
      />

      <CMSKpiStats stats={stats} />

      <FeaturedSectionsCMS />
    </div>
  );
}
