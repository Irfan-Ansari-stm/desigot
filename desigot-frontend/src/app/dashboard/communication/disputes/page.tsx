"use client";

import React from "react";
import { CommunicationKpiStats } from "@/components/communication/CommunicationKpiStats";
import { DisputeDataTable } from "@/components/communication/DisputeDataTable";

export default function DisputesPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Overview Banner */}
      <CommunicationKpiStats />

      {/* 6. Disputes & Mediation Table */}
      <DisputeDataTable />
    </div>
  );
}
