"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ArrowRight, Sparkles, Shield, Zap, Star, TrendingUp, Award } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useListings, useCategoryTree, useCollections } from "@/hooks/useListings";
import { useTrendingSearches } from "@/hooks/useListings";
import type { Listing } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [searchQ, setSearchQ] = useState("");
  const { data: categories, isLoading: catsLoading } = useCategoryTree();
  const { data: featured, isLoading: featuredLoading } = useListings({ sort: "popular", limit: 8 });
  const { data: newest,   isLoading: newestLoading   } = useListings({ sort: "newest",  limit: 8 });
  const { data: trending } = useTrendingSearches();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) router.push("/search?q=" + encodeURIComponent(searchQ.trim()));
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <NotificationsPanel />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand via-accent2 to-accent3 pt-16 pb-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-sm text-white/90 font-medium">AI-powered design discovery</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight mb-6">
            The Global UI/UX<br /><span className="text-accent">Design Marketplace</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover premium design assets, UI kits, and custom services from elite designers worldwide.
          </p>
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white rounded-2xl p-2 max-w-2xl mx-auto shadow-xl mb-8">
            <Search className="h-5 w-5 text-ink-secondary ml-2 shrink-0" />
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search UI kits, dashboards, icons, services…"
              className="flex-1 bg-transparent text-ink-primary placeholder:text-ink-secondary/60 text-base outline-none px-2" />
            <Button type="submit" variant="accent" size="md" className="shrink-0">Search</Button>
          </form>
          {((trending as {query_text:string}[]|undefined)?.length ?? 0) > 0 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-sm text-white/50">Trending:</span>
              {(trending as {query_text:string}[]).slice(0,5).map((t) => (
                <button key={t.query_text} onClick={() => router.push("/search?q="+encodeURIComponent(t.query_text))}
                  className="text-sm text-white/80 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">
                  {t.query_text}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative max-w-4xl mx-auto px-6 mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{value:"50K+",label:"Design Assets"},{value:"12K+",label:"Verified Sellers"},{value:"200K+",label:"Happy Buyers"},{value:"4.9★",label:"Avg. Rating"}].map((s) => (
            <div key={s.label} className="bg-white/10 border border-white/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-sm text-white/60 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div><h2 className="text-2xl font-bold text-ink-primary">Browse by Category</h2><p className="text-ink-secondary text-sm mt-1">40+ curated design categories</p></div>
          <Link href="/browse" className="text-sm font-medium text-accent hover:underline flex items-center gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {catsLoading ? Array.from({length:10}).map((_,i)=><div key={i} className="h-20 bg-surface-50 rounded-xl animate-pulse" />) :
            (categories as {id:string;name:string;slug:string}[]|undefined)?.slice(0,10).map((cat) => (
              <Link key={cat.id} href={"/browse?category_id="+cat.id}
                className="group flex flex-col items-center justify-center gap-2 p-4 bg-surface-50 hover:bg-accent/5 border border-border hover:border-accent/30 rounded-xl transition-all">
                <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center group-hover:bg-accent/10">
                  <span className="text-brand group-hover:text-accent text-xs font-bold">{cat.name.slice(0,2).toUpperCase()}</span>
                </div>
                <span className="text-xs font-medium text-ink-60 group-hover:text-ink-primary text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
        </div>
      </section>

      {/* Popular Listings */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" />
            <div><h2 className="text-2xl font-bold text-ink-primary">Most Popular</h2><p className="text-ink-secondary text-sm">Top selling this month</p></div>
          </div>
          <Link href="/browse?sort=popular" className="text-sm font-medium text-accent hover:underline flex items-center gap-1">See all <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featuredLoading ? Array.from({length:8}).map((_,i)=><ListingCardSkeleton key={i} />) :
            (featured as {data:Listing[]}|undefined)?.data?.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-surface-50 py-16 mt-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12"><h2 className="text-3xl font-bold text-ink-primary">Why Desigot?</h2><p className="text-ink-secondary mt-2">Built differently — for serious design commerce</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{icon:<Award className="h-6 w-6 text-accent"/>,title:"Quality-Gated Curation",desc:"Every listing passes our AI + human quality review. No clutter — only premium design work."},
              {icon:<Shield className="h-6 w-6 text-accent"/>,title:"Trust & Security",desc:"Verified sellers, 7-day inspection window, escrow protection, and robust dispute resolution."},
              {icon:<Zap className="h-6 w-6 text-accent"/>,title:"AI-Powered Discovery",desc:"Semantic search and personalized recommendations surface exactly the right design for your project."}
            ].map((item) => (
              <div key={item.title} className="bg-white border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center mb-4">{item.icon}</div>
                <h3 className="font-semibold text-ink-primary mb-2">{item.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2"><Star className="h-5 w-5 text-warning" />
            <div><h2 className="text-2xl font-bold text-ink-primary">Fresh Arrivals</h2><p className="text-ink-secondary text-sm">Just added to the marketplace</p></div>
          </div>
          <Link href="/browse?sort=newest" className="text-sm font-medium text-accent hover:underline flex items-center gap-1">See all <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {newestLoading ? Array.from({length:8}).map((_,i)=><ListingCardSkeleton key={i} />) :
            (newest as {data:Listing[]}|undefined)?.data?.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-brand rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-black text-white">Start selling your designs</h2>
            <p className="text-white/60 mt-2 text-base">Join 12,000+ sellers earning on Desigot. Free to start.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/auth/register?role=seller"><Button variant="accent" size="lg">Become a Seller</Button></Link>
            <Link href="/browse"><Button variant="secondary" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20">Browse Assets</Button></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
