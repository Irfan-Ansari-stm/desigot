"use client";

import React, { useState } from "react";
import { CategoryStatsCards } from "@/components/categories-taxonomy/CategoryStatsCards";
import { CategoryDataTable } from "@/components/categories-taxonomy/CategoryDataTable";
import { CategoryTreeView } from "@/components/categories-taxonomy/CategoryTreeView";
import { List, Layers } from "lucide-react";

export default function AllCategoriesPage() {
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");

  return (
    <div className="space-y-6 pb-12">
      <CategoryStatsCards />

      {/* View Switcher Toggle */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0f172a] border border-slate-800 w-fit">
        <button
          onClick={() => setViewMode("table")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            viewMode === "table"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Table Directory View</span>
        </button>

        <button
          onClick={() => setViewMode("tree")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            viewMode === "tree"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Interactive Hierarchy Tree</span>
        </button>
      </div>

      {viewMode === "table" ? (
        <CategoryDataTable
          title="All Marketplace Categories"
          subtitle="Master catalog of main categories, subcategories, digital assets, and custom design sprint taxonomies"
        />
      ) : (
        <CategoryTreeView />
      )}
    </div>
  );
}
