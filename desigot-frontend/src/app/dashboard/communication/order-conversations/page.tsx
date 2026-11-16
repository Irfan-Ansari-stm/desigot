"use client";

import React from "react";
import { CommunicationKpiStats } from "@/components/communication/CommunicationKpiStats";
import { OrderConversationsTable } from "@/components/communication/OrderConversationsTable";

export default function OrderConversationsPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Overview Banner */}
      <CommunicationKpiStats />

      {/* 4. Order Conversations Directory */}
      <OrderConversationsTable />
    </div>
  );
}
