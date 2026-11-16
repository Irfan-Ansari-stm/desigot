"use client";

import React from "react";
import { CommunicationKpiStats } from "@/components/communication/CommunicationKpiStats";
import { AnnouncementsDataTable } from "@/components/communication/AnnouncementsDataTable";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Overview Banner */}
      <CommunicationKpiStats />

      {/* 7. Platform Announcements Table */}
      <AnnouncementsDataTable />
    </div>
  );
}
