"use client";

import React from "react";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderDataTable } from "@/components/orders-bookings/OrderDataTable";

export default function AllOrdersPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* KPI Stats Overview Banner */}
      <OrdersKpiStats />

      {/* Main Order Directory */}
      <OrderDataTable
        title="All Orders & Transactions"
        subtitle="Master directory of digital product downloads, custom service packages, and enterprise contracts"
      />
    </div>
  );
}
