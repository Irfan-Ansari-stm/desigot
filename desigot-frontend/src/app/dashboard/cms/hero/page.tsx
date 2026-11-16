"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { HeroEditor } from "@/components/cms/HeroEditor";
import { api } from "@/lib/api";

export default function HeroSectionCMSPage() {
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
        title="2. Hero Section & Slides Showcase"
        description="High-converting carousel slides with multi-device background images, customizable CTAs, and overlay contrast controls."
        activeTab="hero"
      />

      <CMSKpiStats stats={stats} />

      <HeroEditor />
    </div>
  );
}
