"use client";

import React from "react";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderDataTable } from "@/components/orders-bookings/OrderDataTable";

export default function InProgressOrdersPage() {
  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      <OrderDataTable
        initialStatus="in_progress"
        title="Orders In Progress"
        subtitle="Active design sprints undergoing creative drafting, asset preparation, and client milestones"
      />
    </div>
  );
}
