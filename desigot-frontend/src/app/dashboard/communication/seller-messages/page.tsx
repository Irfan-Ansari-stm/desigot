"use client";

import React from "react";
import { CommunicationKpiStats } from "@/components/communication/CommunicationKpiStats";
import { SellerMessagesTable } from "@/components/communication/SellerMessagesTable";

export default function SellerMessagesPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Overview Banner */}
      <CommunicationKpiStats />

      {/* 3. Seller Messages Roster */}
      <SellerMessagesTable />
    </div>
  );
}
