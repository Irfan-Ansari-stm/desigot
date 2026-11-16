"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { LegalDocumentEditor } from "@/components/cms/LegalDocumentEditor";
import { api } from "@/lib/api";

export default function TermsCMSPage() {
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
        title="12. Terms & Conditions Policy Editor"
        description="Version-controlled marketplace agreement governing account responsibilities, intellectual property, and commercial usage."
        activeTab="terms"
      />

      <CMSKpiStats stats={stats} />

      <LegalDocumentEditor
        docType="terms"
        title="Terms of Service & Commercial Agreement"
        description="Publish revisions with change summaries and instantly restore previous versions with one click."
      />
    </div>
  );
}
