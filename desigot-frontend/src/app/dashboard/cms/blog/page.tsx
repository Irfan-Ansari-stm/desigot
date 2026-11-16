"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { BlogManager } from "@/components/cms/BlogManager";
import { api } from "@/lib/api";

export default function BlogCMSPage() {
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
        title="17. Blog & Editorial Publication Engine"
        description="Publish in-depth design insights, manage taxonomy tags and categories, view readership metrics, and review revision drafts."
        activeTab="blog"
      />

      <CMSKpiStats stats={stats} />

      <BlogManager />
    </div>
  );
}
