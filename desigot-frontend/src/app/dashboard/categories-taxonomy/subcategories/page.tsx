"use client";

import React from "react";
import { CategoryStatsCards } from "@/components/categories-taxonomy/CategoryStatsCards";
import { CategoryDataTable } from "@/components/categories-taxonomy/CategoryDataTable";

export default function SubcategoriesPage() {
  return (
    <div className="space-y-6 pb-12">
      <CategoryStatsCards />

      <CategoryDataTable
        initialDepth={1}
        title="Subcategories Directory"
        subtitle="Second-level domain classifications linked to parent main categories"
      />
    </div>
  );
}
