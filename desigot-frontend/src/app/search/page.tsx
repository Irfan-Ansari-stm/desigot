"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { useGlobalSearch, useMarketplaceNav } from "@/hooks/useMarketplace";
import {
  Search as SearchIcon,
  X,
  Star,
  Briefcase,
  Package,
  Layers,
  User as UserIcon,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/Button";

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "all";
  const initialCategory = searchParams.get("category_id") || "";
  const initialMinPrice = searchParams.get("min_price") || "";
  const initialMaxPrice = searchParams.get("max_price") || "";

  const [inputQ, setInputQ] = useState(initialQ);
  const [activeType, setActiveType] = useState(initialType);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [page, setPage] = useState(1);

  const { data: navData } = useMarketplaceNav();
  const categories = navData?.mega_menu_categories || [];

  const { data, isLoading } = useGlobalSearch({
    q: inputQ,
    type: activeType === "all" ? undefined : activeType,
    category_id: categoryId || undefined,
    min_price: minPrice || undefined,
    max_price: maxPrice || undefined,
    page,
    limit: 16,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qp = new URLSearchParams();
    if (inputQ.trim()) qp.append("q", inputQ.trim());
    if (activeType !== "all") qp.append("type", activeType);
    if (categoryId) qp.append("category_id", categoryId);
    router.replace(`/search?${qp.toString()}`);
    setPage(1);
  };

  const handleTypeTab = (t: string) => {
    setActiveType(t);
    setPage(1);
    const qp = new URLSearchParams(searchParams.toString());
    if (t === "all") qp.delete("type");
    else qp.set("type", t);
    router.replace(`/search?${qp.toString()}`);
  };

  const totalResults = data?.total || 0;
  const services = data?.services || [];
  const products = data?.products || [];
  const foundCategories = data?.categories || [];
  const sellers = data?.sellers || [];
  const blogs = data?.blog || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Search Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              placeholder="Search across services, digital assets, categories, sellers, and articles..."
              className="w-full h-12 sm:h-14 pl-12 pr-28 text-sm sm:text-base bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white transition-all text-slate-800"
            />
            {inputQ && (
              <button
                type="button"
                onClick={() => setInputQ("")}
                className="absolute right-24 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-full shadow-sm transition-all"
            >
              Search
            </button>
          </form>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All Results", icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
              { id: "services", label: "Services", icon: <Briefcase className="w-3.5 h-3.5" /> },
              { id: "products", label: "Digital Products", icon: <Package className="w-3.5 h-3.5" /> },
              { id: "categories", label: "Categories", icon: <Layers className="w-3.5 h-3.5" /> },
              { id: "sellers", label: "Sellers", icon: <UserIcon className="w-3.5 h-3.5" /> },
              { id: "blog", label: "Blog Articles", icon: <FileText className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTypeTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${activeType === tab.id ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            {inputQ ? (
              <>Search results for &quot;<strong className="text-slate-900">{inputQ}</strong>&quot;</>
            ) : (
              <>Showing all marketplace offerings</>
            )}
            {totalResults > 0 && <span className="ml-2 font-semibold text-rose-600">({totalResults} matches)</span>}
          </span>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : totalResults === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
              <SearchIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No results found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn&apos;t find anything matching &quot;{inputQ}&quot;. Try different keywords, checking spelling, or clearing filters.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setInputQ("");
                setActiveType("all");
                router.replace("/search");
              }}
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* 1. Services Section */}
            {(activeType === "all" || activeType === "services") && services.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-rose-500" /> Services ({services.length})
                  </h2>
                  <Link href={`/services?search=${encodeURIComponent(inputQ)}`} className="text-xs font-bold text-rose-600 hover:underline">
                    View in Services →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {services.map((s: any) => (
                    <div key={s.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
                      <div className="space-y-3">
                        <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative">
                          <img src={s.featured_image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80"} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {s.delivery_time_days || 3}d
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img src={s.seller_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${s.seller_name}`} alt={s.seller_name} className="w-5 h-5 rounded-full" />
                          <span className="text-xs font-semibold text-slate-700 truncate">{s.seller_name}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                          {s.title}
                        </h3>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-rose-600">From ${(s.starting_price_cents / 100).toFixed(0)}</span>
                        <Link href={`/services/${s.slug}`} className="font-semibold text-slate-500 hover:text-slate-900">
                          Inspect →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 2. Digital Products Section */}
            {(activeType === "all" || activeType === "products") && products.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-500" /> Digital Products ({products.length})
                  </h2>
                  <Link href={`/products?search=${encodeURIComponent(inputQ)}`} className="text-xs font-bold text-rose-600 hover:underline">
                    View in Products →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {products.map((p: any) => (
                    <div key={p.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
                      <div className="space-y-3">
                        <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative">
                          <img src={p.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[10px] font-bold">
                            ${(p.price_cents / 100).toFixed(0)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                          {p.title}
                        </h3>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">by {p.seller_name}</span>
                        <Link href={`/products/${p.slug}`} className="font-bold text-rose-600 hover:text-rose-700">
                          Inspect →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Categories Section */}
            {(activeType === "all" || activeType === "categories") && foundCategories.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" /> Categories ({foundCategories.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {foundCategories.map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/categories/${c.slug}`}
                      className="bg-white border border-slate-200 hover:border-rose-300 p-4 rounded-2xl group transition-all"
                    >
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{c.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Sellers Section */}
            {(activeType === "all" || activeType === "sellers") && sellers.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-emerald-500" /> Sellers ({sellers.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {sellers.map((s: any) => (
                    <div key={s.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={s.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.display_name}`} alt={s.display_name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-900">{s.display_name}</span>
                            {s.seller_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                          </div>
                          <span className="text-[10px] text-slate-400">★ {Number(s.avg_seller_rating || 4.9).toFixed(1)} • {s.total_sales || 80} sales</span>
                        </div>
                      </div>
                      <Link href={`/seller/${s.username || s.id}`}>
                        <Button variant="secondary" size="sm">Profile</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Blog Section */}
            {(activeType === "all" || activeType === "blog") && blogs.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Blog Articles ({blogs.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {blogs.map((b: any) => (
                    <Link key={b.id} href={`/blog/${b.slug}`} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all group block">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                        {b.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{b.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="h-8 w-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchPageInner />
    </Suspense>
  );
}
