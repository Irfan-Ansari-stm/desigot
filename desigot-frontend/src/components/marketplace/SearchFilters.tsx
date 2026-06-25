"use client";
import { useState } from "react";
import { useCategories, useListingFacets } from "@/hooks/useListings";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchFilters as Filters } from "@/types";

interface SearchFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function SearchFiltersBar({ filters, onChange }: SearchFiltersProps) {
  const { data: categories } = useCategories();
  const { data: facets } = useListingFacets();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const catOptions = [
    { value: "", label: "All Categories" },
    ...(categories as { id: string; name: string }[] | undefined || []).map((c) => ({ value: c.id, label: c.name })),
  ];
  const typeOptions = [
    { value: "", label: "All Types" },
    ...(facets?.listing_types || []).map((option) => ({
      value: option.value,
      label: option.label || option.value,
    })),
  ];
  const sortOptions = (facets?.sort_options || []).map((option) => ({
    value: option.value,
    label: option.label || option.value,
  }));
  const softwareOptions = (facets?.software || []).map((option) => ({
    value: option.value,
    label: option.value,
  }));
  const formatOptions = (facets?.file_formats || []).map((option) => ({
    value: option.value,
    label: option.value,
  }));

  const activeFilterCount = [
    filters.category_id, filters.listing_type, filters.min_price,
    filters.max_price, filters.software, filters.file_format,
  ].filter(Boolean).length;

  const reset = () => onChange({ sort: filters.sort, q: filters.q });

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          options={catOptions}
          value={filters.category_id || ""}
          onChange={(v) => onChange({ ...filters, category_id: v || undefined })}
          placeholder="All Categories"
          className="w-44"
        />
        <Select
          options={typeOptions}
          value={filters.listing_type || ""}
          onChange={(v) => onChange({ ...filters, listing_type: (v as "asset" | "service") || undefined })}
          placeholder="Type"
          className="w-36"
        />
        <Select
          options={sortOptions}
          value={filters.sort || "relevance"}
          onChange={(v) => onChange({ ...filters, sort: v as Filters["sort"] })}
          className="w-48"
          disabled={!sortOptions.length}
        />
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
            showAdvanced ? "bg-brand text-white border-brand" : "border-border text-ink-secondary hover:bg-surface-50"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full", showAdvanced ? "bg-white/20 text-white" : "bg-accent text-white")}>
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button onClick={reset} className="flex items-center gap-1 text-xs text-accent hover:underline">
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Min $"
              type="number"
              value={filters.min_price ? (filters.min_price / 100).toString() : ""}
              onChange={(e) => onChange({ ...filters, min_price: e.target.value ? parseInt(e.target.value) * 100 : undefined })}
              wrapperClassName="w-24"
            />
            <span className="text-ink-secondary">–</span>
            <Input
              placeholder="Max $"
              type="number"
              value={filters.max_price ? (filters.max_price / 100).toString() : ""}
              onChange={(e) => onChange({ ...filters, max_price: e.target.value ? parseInt(e.target.value) * 100 : undefined })}
              wrapperClassName="w-24"
            />
          </div>
          <Select
            options={[{ value: "", label: "Any Software" }, ...softwareOptions]}
            value={filters.software || ""}
            onChange={(v) => onChange({ ...filters, software: v || undefined })}
            placeholder="Software"
            className="w-40"
            disabled={!softwareOptions.length}
          />
          <Select
            options={[{ value: "", label: "Any Format" }, ...formatOptions]}
            value={filters.file_format || ""}
            onChange={(v) => onChange({ ...filters, file_format: v || undefined })}
            placeholder="File Format"
            className="w-36"
            disabled={!formatOptions.length}
          />
        </div>
      )}
    </div>
  );
}
