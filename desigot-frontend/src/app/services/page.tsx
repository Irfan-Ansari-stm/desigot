"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { usePublicServices, useMarketplaceNav } from "@/hooks/useMarketplace";
import {
  Briefcase,
  Search,
  Filter,
  Star,
  Clock,
  ShieldCheck,
  LayoutGrid,
  List,
  ChevronDown,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  X
} from "lucide-react";
import { Button } from "@/components/ui/Button";

function ServicesMarketplacePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const categoryParam = searchParams.get("category") || "";
  const sortParam = searchParams.get("sort") || "popular";
  const searchParam = searchParams.get("q") || "";

  // Local filter states
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [searchQ, setSearchQ] = useState(searchParam);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data: navData } = useMarketplaceNav();
  const categories = navData?.mega_menu_categories || [];

  const queryParams = useMemo(() => ({
    category: selectedCategory || undefined,
    sort: sortBy,
    search: searchQ || undefined,
    min_price: minPrice || undefined,
    max_price: maxPrice || undefined,
    min_rating: minRating || undefined,
    delivery_days: deliveryDays || undefined,
    featured: featuredOnly ? "true" : undefined,
    page,
    limit: 12,
  }), [selectedCategory, sortBy, searchQ, minPrice, maxPrice, minRating, deliveryDays, featuredOnly, page]);

  const { data, isLoading } = usePublicServices(queryParams);

  const services = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / 12) || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSortBy("popular");
    setSearchQ("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setDeliveryDays("");
    setFeaturedOnly(false);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Header Hero */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200/60 rounded-full px-3.5 py-1 text-xs font-bold text-rose-600">
              <Briefcase className="w-3.5 h-3.5" />
              Verified Custom Agency Services
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Hire Elite UI/UX Specialists & Product Designers
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              From bespoke Figma design systems to high-velocity conversion sprint deliverables. All services backed by Desigot Escrow protection and milestone inspection.
            </p>
          </div>

          {/* Quick Search & Sort Bar */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-slate-100">
            <form onSubmit={handleSearch} className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search services by keyword, tech, or scope..."
                className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white transition-all"
              />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-700"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Fresh Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              <div className="hidden sm:flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-100">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden flex items-center gap-1.5 px-3 h-10 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </button>
            </div>
          </div>
        </div>

        {/* Content Layout with Left Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* ── FILTERS SIDEBAR (DESKTOP) ───────────────────────────── */}
          <aside className="hidden lg:block space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-rose-500" /> Filter Services
                </span>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Reset
                </button>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Starting Price ($)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Seller Rating */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Seller Rating
                </label>
                <div className="space-y-1">
                  {[4.5, 4.0, 3.5].map((stars) => (
                    <label key={stars} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === String(stars)}
                        onChange={() => setMinRating(String(stars))}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="flex items-center gap-1 font-medium">
                        {stars}★ & above
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Delivery Speed */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Delivery Time
                </label>
                <div className="space-y-1">
                  {[
                    { label: "Up to 3 days", val: "3" },
                    { label: "Up to 7 days", val: "7" },
                    { label: "Up to 14 days", val: "14" },
                  ].map((d) => (
                    <label key={d.val} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryDays === d.val}
                        onChange={() => setDeliveryDays(d.val)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Featured Checkbox */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featuredOnly}
                    onChange={(e) => setFeaturedOnly(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Featured Agencies Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* ── SERVICES LISTING MAIN ───────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Showing <strong className="text-slate-800">{services.length}</strong> of{" "}
                <strong className="text-slate-800">{total}</strong> published services
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No services match your filters</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try broadening your price range, clearing delivery filters, or searching for other design services.
                </p>
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {services.map((s: any) => (
                  <div
                    key={s.id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative">
                        <img
                          src={s.featured_image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80"}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {s.is_featured && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-2.5 h-2.5" /> Featured
                          </span>
                        )}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-medium flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {s.delivery_time_days || 3}d delivery
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <img
                          src={s.seller_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${s.seller_name}`}
                          alt={s.seller_name}
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-xs font-medium text-slate-600 truncate">{s.seller_name}</span>
                        {s.seller_verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 leading-snug">
                        {s.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2">
                        {s.short_description || s.description || "High quality tailored bespoke deliverables."}
                      </p>
                    </div>

                    <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{Number(s.rating || s.avg_rating || 4.9).toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">({s.review_count || 14})</span>
                      </div>
                      <Link
                        href={`/services/${s.slug}`}
                        className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        From ${(s.starting_price_cents / 100).toFixed(0)}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-4">
                {services.map((s: any) => (
                  <div
                    key={s.id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col sm:flex-row gap-5 items-center justify-between group"
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                      <div className="w-full sm:w-44 aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden shrink-0">
                        <img
                          src={s.featured_image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80"}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-1.5 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="text-xs font-semibold text-slate-600">{s.seller_name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {s.category_name || "UI/UX Design"}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                          {s.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 max-w-lg">
                          {s.short_description || s.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Starting from</span>
                        <span className="text-lg font-black text-slate-900">
                          ${(s.starting_price_cents / 100).toFixed(0)}
                        </span>
                      </div>
                      <Link href={`/services/${s.slug}`} className="mt-2">
                        <Button variant="accent" size="sm">
                          View Scope
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-8 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate-700 px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ServicesMarketplacePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ServicesMarketplacePageInner />
    </React.Suspense>
  );
}
