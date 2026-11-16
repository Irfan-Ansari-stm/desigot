"use client";
import React, { useEffect, useState } from "react";
import { CMSNavHeader } from "@/components/cms/CMSNavHeader";
import { CMSKpiStats } from "@/components/cms/CMSKpiStats";
import { LegalDocumentEditor } from "@/components/cms/LegalDocumentEditor";
import { api } from "@/lib/api";

export default function PrivacyCMSPage() {
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
        title="13. Global Privacy Policy & Cookie Disclosures"
        description="GDPR, CCPA, and telemetry privacy commitments with complete revision tracking."
        activeTab="privacy"
      />

      <CMSKpiStats stats={stats} />

      <LegalDocumentEditor
        docType="privacy"
        title="Global Privacy & Cookie Policy"
        description="Maintain GDPR and CCPA compliant privacy disclosures with full audit history."
      />
    </div>
  );
}
