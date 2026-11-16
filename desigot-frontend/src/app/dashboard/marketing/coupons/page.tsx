"use client";
import React, { useEffect, useState } from "react";
import { MarketingNavHeader } from "@/components/marketing/MarketingNavHeader";
import { MarketingKpiStats } from "@/components/marketing/MarketingKpiStats";
import { CouponsTable } from "@/components/marketing/CouponsTable";
import { api } from "@/lib/api";

export default function CouponsDedicatedPage() {
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
        title="1. Coupon Management & Redemption Engine"
        description="Configure percentage & fixed discount coupons, minimum order constraints, usage limits, and checkout validation."
        activeTab="coupons"
      />

      <MarketingKpiStats stats={stats} loading={loading} />

      <CouponsTable />
    </div>
  );
}
