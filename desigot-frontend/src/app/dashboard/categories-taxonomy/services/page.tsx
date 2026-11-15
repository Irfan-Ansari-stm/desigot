"use client";

import React from "react";
import { CategoryStatsCards } from "@/components/categories-taxonomy/CategoryStatsCards";
import { CategoryDataTable } from "@/components/categories-taxonomy/CategoryDataTable";

export default function ServiceCategoriesPage() {
  return (
    <div className="space-y-6 pb-12">
      <CategoryStatsCards />

      <CategoryDataTable
        initialType="service"
        title="Custom Service Categories"
        subtitle="Specialized categories configured for bespoke design sprints, consultation bookings, and team contracts"
      />
    </div>
  );
}
