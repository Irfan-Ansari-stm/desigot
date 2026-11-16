"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { FooterBuilder } from "@/components/cms/FooterBuilder";
import { api } from "@/lib/api";

export default function FooterCMSPage() {
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
        title="15. Footer Builder & Navigation Columns"
        description="Build multi-column links, manage copyright text, configure social links, and showcase accepted payment methods."
        activeTab="footer"
      />

      <CMSKpiStats stats={stats} />

      <FooterBuilder />
    </div>
  );
}
