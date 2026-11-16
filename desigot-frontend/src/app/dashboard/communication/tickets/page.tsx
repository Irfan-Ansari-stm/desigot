"use client";

import React from "react";
import { CommunicationKpiStats } from "@/components/communication/CommunicationKpiStats";
import { SupportTicketDataTable } from "@/components/communication/SupportTicketDataTable";

export default function SupportTicketsPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Overview Banner */}
      <CommunicationKpiStats />

      {/* 5. Support Tickets Table */}
      <SupportTicketDataTable />
    </div>
  );
}
