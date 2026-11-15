"use client";

import React from "react";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderDataTable } from "@/components/orders-bookings/OrderDataTable";

export default function CompletedOrdersPage() {
  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      <OrderDataTable
        initialStatus="completed"
        title="Completed Orders & Deliveries"
        subtitle="Successfully fulfilled design contracts, approved assets, and disbursed escrow payouts"
      />
    </div>
  );
}
