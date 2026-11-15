"use client";

import React from "react";
import { CategoryStatsCards } from "@/components/categories-taxonomy/CategoryStatsCards";
import { CategoryDataTable } from "@/components/categories-taxonomy/CategoryDataTable";

export default function MainCategoriesPage() {
  return (
    <div className="space-y-6 pb-12">
      <CategoryStatsCards />

      <CategoryDataTable
        initialDepth={0}
        initialParent="root"
        title="Main Categories (Top-Level)"
        subtitle="Primary root taxonomy pillars containing subcategories and top-level marketplace browse nodes"
      />
    </div>
  );
}
