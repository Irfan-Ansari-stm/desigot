"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { HomepageManager } from "@/components/cms/HomepageManager";
import { api } from "@/lib/api";

export default function HomepageCMSPage() {
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
        title="1. Homepage Management & Dynamic Sections"
        description="Configure headline SEO tags, top announcement ticker, module visibility, and layout display ordering."
        activeTab="homepage"
      />

      <CMSKpiStats stats={stats} />

      <HomepageManager />
    </div>
  );
}
