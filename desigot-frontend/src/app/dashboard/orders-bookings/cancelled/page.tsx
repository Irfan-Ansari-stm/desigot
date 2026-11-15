"use client";

import React from "react";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderDataTable } from "@/components/orders-bookings/OrderDataTable";

export default function CancelledOrdersPage() {
  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      <OrderDataTable
        initialStatus="cancelled"
        title="Cancelled Orders & Terminated Contracts"
        subtitle="Terminated design transactions, voided contracts, and processed buyer chargeback reversals"
      />
    </div>
  );
}
