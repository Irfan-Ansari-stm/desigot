"use client";
import React, { useEffect, useState } from "react";
import { MarketingNavHeader } from "@/components/marketing/MarketingNavHeader";
import { MarketingKpiStats } from "@/components/marketing/MarketingKpiStats";
import { FeaturedProductsTable } from "@/components/marketing/FeaturedProductsTable";
import { api } from "@/lib/api";

export default function FeaturedProductsDedicatedPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/admin/marketing/stats/summary");
        if (res.data?.success) setStats(res.data.data);
      } catch (err) {
        console.error("Error loading marketing stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <MarketingNavHeader
        title="4. Featured Digital Products & Templates"
        description="Pin highest-converting design systems, Figma UI kits, and vector graphics to prime marketplace display slots."
        activeTab="featured-products"
      />

      <MarketingKpiStats stats={stats} loading={loading} />

      <FeaturedProductsTable />
    </div>
  );
}
