"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { FAQManager } from "@/components/cms/FAQManager";
import { api } from "@/lib/api";

export default function FAQManagementCMSPage() {
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
        title="11. FAQ & Knowledge Base Management"
        description="Organize frequently asked questions across categories with rich formatting and contextual page associations."
        activeTab="faq"
      />

      <CMSKpiStats stats={stats} />

      <FAQManager />
    </div>
  );
}
