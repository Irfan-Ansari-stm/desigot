"use client";

import React from "react";
import { CommunicationKpiStats } from "@/components/communication/CommunicationKpiStats";
import { ConversationDataTable } from "@/components/communication/ConversationDataTable";

export default function AllConversationsPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Overview Banner */}
      <CommunicationKpiStats />

      {/* 1. All Conversations Master Table */}
      <ConversationDataTable />
    </div>
  );
}
