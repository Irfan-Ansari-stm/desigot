"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { NavigationBuilder } from "@/components/cms/NavigationBuilder";
import { api } from "@/lib/api";

export default function NavigationCMSPage() {
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
        title="3. Navigation Menus & Hierarchical Links"
        description="Build multi-level header menus, sub-links, external redirections, and mobile navigation drawers."
        activeTab="navigation"
      />

      <CMSKpiStats stats={stats} />

      <NavigationBuilder />
    </div>
  );
}
