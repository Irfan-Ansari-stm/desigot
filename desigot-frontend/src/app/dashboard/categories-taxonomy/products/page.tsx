"use client";

import React from "react";
import { CategoryStatsCards } from "@/components/categories-taxonomy/CategoryStatsCards";
import { CategoryDataTable } from "@/components/categories-taxonomy/CategoryDataTable";

export default function ProductCategoriesPage() {
  return (
    <div className="space-y-6 pb-12">
      <CategoryStatsCards />

      <CategoryDataTable
        initialType="product"
        title="Digital Product Categories"
        subtitle="Taxonomies for UI kits, Figma design systems, mobile app wireframes, and instant download templates"
      />
    </div>
  );
}
