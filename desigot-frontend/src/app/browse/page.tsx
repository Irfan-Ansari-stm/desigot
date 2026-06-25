"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { SearchFiltersBar } from "@/components/marketplace/SearchFilters";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useListings } from "@/hooks/useListings";
import { LayoutGrid, List, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchFilters } from "@/types";

function BrowsePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({
    category_id: searchParams.get("category_id") || undefined,
    listing_type: (searchParams.get("listing_type") as "asset"|"service") || undefined,
    sort: (searchParams.get("sort") as SearchFilters["sort"]) || "newest",
    q: searchParams.get("q") || undefined,
  });

  const { data, isLoading } = useListings({ ...filters, page, limit: 24 });
  const results = (data as { data: import("@/types").Listing[]; pagination: { total: number; totalPages: number } } | undefined);

  const updateFilters = (f: SearchFilters) => { setFilters(f); setPage(1); };

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <NotificationsPanel />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink-primary">
              {filters.category_id ? "Category" : filters.listing_type === "service" ? "Services" : "All Assets"}
            </h1>
            {results && (
              <p className="text-sm text-ink-secondary mt-0.5">
                {results.pagination?.total?.toLocaleString() || 0} results found
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView("grid")} className={cn("p-2 rounded-lg transition-colors", view === "grid" ? "bg-white shadow-sm text-ink-primary" : "text-ink-secondary hover:bg-surface-50")}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={cn("p-2 rounded-lg transition-colors", view === "list" ? "bg-white shadow-sm text-ink-primary" : "text-ink-secondary hover:bg-surface-50")}><List className="h-4 w-4" /></button>
          </div>
        </div>

        <SearchFiltersBar filters={filters} onChange={updateFilters} />

        <div className="mt-6">
          {isLoading ? (
            <div className={cn("grid gap-5", view === "grid" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1")}>
              {Array.from({ length: 12 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : !results?.data?.length ? (
            <EmptyState icon={<Search className="h-8 w-8" />} title="No listings found"
              description="Try adjusting your filters or search with different keywords."
              action={{ label: "Clear Filters", onClick: () => updateFilters({ sort: "newest" }) }} />
          ) : (
            <>
              <div className={cn("grid gap-5", view === "grid" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2")}>
                {results.data.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
              <Pagination page={page} totalPages={results.pagination?.totalPages || 1} onPageChange={setPage} className="mt-10" />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-50 flex items-center justify-center"><div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <BrowsePageInner />
    </Suspense>
  );
}
