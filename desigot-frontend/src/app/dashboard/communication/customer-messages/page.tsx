"use client";

import React from "react";
import { CommunicationKpiStats } from "@/components/communication/CommunicationKpiStats";
import { CustomerMessagesTable } from "@/components/communication/CustomerMessagesTable";

export default function CustomerMessagesPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Overview Banner */}
      <CommunicationKpiStats />

      {/* 2. Customer Messages Roster */}
      <CustomerMessagesTable />
    </div>
  );
}
