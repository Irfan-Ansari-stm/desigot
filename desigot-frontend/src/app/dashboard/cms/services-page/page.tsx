"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { ServicesPageCMS } from "@/components/cms/ServicesPageCMS";
import { api } from "@/lib/api";

export default function ServicesPageCMSPage() {
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
        title="5. Services Hub Page Management"
        description="Configure copy, hero imagery, and featured services curated at the top of /services."
        activeTab="services-page"
      />

      <CMSKpiStats stats={stats} />

      <ServicesPageCMS />
    </div>
  );
}
