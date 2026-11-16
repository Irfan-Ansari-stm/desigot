"use client";

import React from "react";
import { CommunicationKpiStats } from "@/components/communication/CommunicationKpiStats";
import { NotificationTemplatesTable } from "@/components/communication/NotificationTemplatesTable";

export default function NotificationTemplatesPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Overview Banner */}
      <CommunicationKpiStats />

      {/* 9. Notification Templates Catalog */}
      <NotificationTemplatesTable />
    </div>
  );
}
