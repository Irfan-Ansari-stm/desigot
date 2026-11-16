"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { ContactPageCMS } from "@/components/cms/ContactPageCMS";
import { api } from "@/lib/api";

export default function ContactCMSPage() {
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
        title="10. Contact Desk & Customer Inquiries"
        description="Public support channel coordinates and a centralized desk to triage, respond to, and resolve incoming customer submissions."
        activeTab="contact"
      />

      <CMSKpiStats stats={stats} />

      <ContactPageCMS />
    </div>
  );
}
