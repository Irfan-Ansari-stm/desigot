"use client";

import React from "react";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderDataTable } from "@/components/orders-bookings/OrderDataTable";

export default function DigitalOrdersPage() {
  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      <OrderDataTable
        initialType="digital"
        title="Digital Product Orders"
        subtitle="UI kits, design systems, mobile mockups, and instant download asset purchases"
      />
    </div>
  );
}
