"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { CategoriesPageCMS } from "@/components/cms/CategoriesPageCMS";
import { api } from "@/lib/api";

export default function CategoriesPageCMSPage() {
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
        title="6. Categories & Taxonomy Directory CMS"
        description="Layout options, hero presentation, and highlighted top-level design categories."
        activeTab="categories-page"
      />

      <CMSKpiStats stats={stats} />

      <CategoriesPageCMS />
    </div>
  );
}
