"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { StaticPagesTable } from "@/components/cms/StaticPagesTable";
import { api } from "@/lib/api";

export default function StaticPagesCMSPage() {
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
        title="16. Static Pages & Version Controlled Builder"
        description="Publish custom landing pages (/pages/[slug]) with structured content blocks, SEO snippets, and instant revision rollback."
        activeTab="pages"
      />

      <CMSKpiStats stats={stats} />

      <StaticPagesTable />
    </div>
  );
}
