"use client";

import React from "react";
import { CommunicationKpiStats } from "@/components/communication/CommunicationKpiStats";
import { ConversationDataTable } from "@/components/communication/ConversationDataTable";

export default function CommunicationOverviewPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Overview Banner */}
      <CommunicationKpiStats />

      {/* Primary Inbox */}
      <ConversationDataTable />
    </div>
  );
}
