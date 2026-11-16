"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { AboutUsEditor } from "@/components/cms/AboutUsEditor";
import { api } from "@/lib/api";

export default function AboutUsCMSPage() {
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
        title="9. About Us & Leadership Team Editor"
        description="Company founding history, mission, vision statements, key metrics, and executive team member profiles."
        activeTab="about"
      />

      <CMSKpiStats stats={stats} />

      <AboutUsEditor />
    </div>
  );
}
