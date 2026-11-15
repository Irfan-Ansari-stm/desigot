"use client";

import React from "react";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { BookingDataTable } from "@/components/orders-bookings/BookingDataTable";

export default function NewBookingsPage() {
  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      <BookingDataTable
        initialStatus="requested"
        title="New & Live Bookings"
        subtitle="Incoming customer consultation requests awaiting calendar assignment and meeting link"
      />
    </div>
  );
}
