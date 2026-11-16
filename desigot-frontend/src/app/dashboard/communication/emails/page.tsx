"use client";

import React from "react";
import { CommunicationKpiStats } from "@/components/communication/CommunicationKpiStats";
import { EmailNotificationsTable } from "@/components/communication/EmailNotificationsTable";

export default function EmailNotificationsPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Overview Banner */}
      <CommunicationKpiStats />

      {/* 8. Email Delivery Notifications Table */}
      <EmailNotificationsTable />
    </div>
  );
}
