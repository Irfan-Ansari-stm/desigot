"use client";

import React from "react";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderDataTable } from "@/components/orders-bookings/OrderDataTable";

export default function ServiceOrdersPage() {
  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      <OrderDataTable
        initialType="service"
        title="Custom Service Orders"
        subtitle="Design sprints, UI/UX redesigns, design systems, and milestone-tracked contracts"
      />
    </div>
  );
}
