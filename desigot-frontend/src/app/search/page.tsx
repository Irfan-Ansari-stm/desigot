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
import { useSearch, useAutocomplete } from "@/hooks/useListings";
import { Search as SearchIcon, X } from "lucide-react";
import type { SearchFilters } from "@/types";

function SearchPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const initialQ = params.get("q") || "";
  const [inputQ, setInputQ] = useState(initialQ);
  const [filters, setFilters] = useState<SearchFilters>({
    q: initialQ,
    sort: (params.get("sort") as SearchFilters["sort"]) || "relevance",
  });

  const { data, isLoading } = useSearch({ ...filters, page, limit: 20 });
  const { data: suggestions } = useAutocomplete(inputQ);
  const results = data as { data: import("@/types").Listing[]; pagination: { total: number; totalPages: number } } | undefined;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, q: inputQ });
    router.replace(`/search?q=${encodeURIComponent(inputQ)}`);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <NotificationsPanel />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-secondary/60" />
          <input value={inputQ} onChange={(e) => setInputQ(e.target.value)}
            placeholder="Search UI kits, dashboards, icons, design services…"
            className="w-full h-14 pl-12 pr-14 text-base bg-white border border-border rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-border-md transition-all" />
          {inputQ && (
            <button type="button" onClick={() => { setInputQ(""); setFilters({ ...filters, q: "" }); }}
              className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-ink-secondary hover:text-ink-primary">
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors">
            Search
          </button>
        </form>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-ink-primary">
              {filters.q ? `Results for "${filters.q}"` : "All Listings"}
            </h2>
            <p className="text-sm text-ink-secondary">{results?.pagination?.total?.toLocaleString() || 0} results</p>
          </div>
        </div>

        <SearchFiltersBar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />

        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 12 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : !results?.data?.length ? (
            <EmptyState icon={<SearchIcon className="h-8 w-8" />} title="No results found"
              description={`We couldn't find anything for "${filters.q}". Try different keywords or remove some filters.`}
              action={{ label: "Clear Search", onClick: () => { setInputQ(""); setFilters({}); } }} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-50 flex items-center justify-center"><div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchPageInner />
    </Suspense>
  );
}
