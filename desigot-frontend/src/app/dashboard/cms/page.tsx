"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { HomepageManager } from "@/components/cms/HomepageManager";
import { api } from "@/lib/api";

export default function CMSOverviewDashboard() {
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
        title="12. CMS & Website Management System"
        description="Complete administrative control over all public pages, dynamic sections, navigation hierarchy, legal policies, and editorial blog."
        activeTab="homepage"
      />

      <CMSKpiStats stats={stats} />

      <HomepageManager />
    </div>
  );
}
