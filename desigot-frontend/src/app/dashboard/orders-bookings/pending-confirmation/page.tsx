"use client";

import React, { useState } from "react";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderDataTable } from "@/components/orders-bookings/OrderDataTable";
import { BookingDataTable } from "@/components/orders-bookings/BookingDataTable";
import { ShoppingBag, Calendar } from "lucide-react";

export default function PendingConfirmationPage() {
  const [tab, setTab] = useState<"orders" | "bookings">("orders");

  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      {/* Segment Switcher */}
      <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-[#0f172a] border border-slate-800 w-fit">
        <button
          onClick={() => setTab("orders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === "orders"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Pending Orders</span>
        </button>

        <button
          onClick={() => setTab("bookings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === "bookings"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Pending Bookings</span>
        </button>
      </div>

      {tab === "orders" ? (
        <OrderDataTable
          initialStatus="pending_confirmation"
          title="Orders Pending Confirmation"
          subtitle="Customer payments verified; awaiting seller acceptance and kickoff briefing"
        />
      ) : (
        <BookingDataTable
          initialStatus="pending_confirmation"
          title="Bookings Pending Confirmation"
          subtitle="Consultation reservations requiring designer schedule verification"
        />
      )}
    </div>
  );
}
