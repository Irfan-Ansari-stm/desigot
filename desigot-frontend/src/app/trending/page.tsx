"use client";
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { usePublicTrending } from "@/hooks/useMarketplace";
import {
  TrendingUp,
  Star,
  Download,
  Briefcase,
  Package,
  Layers,
  ArrowRight,
  Flame,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function TrendingMarketplacePage() {
  const { data, isLoading } = usePublicTrending();

  const services = data?.trending_services || [];
  const products = data?.trending_products || [];
  const categories = data?.trending_categories || [];
  const sellers = data?.popular_sellers || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14 flex-1 w-full">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white rounded-3xl p-8 sm:p-14 shadow-xl relative overflow-hidden text-center sm:text-left">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-3.5 py-1 text-xs font-bold text-white">
              <Flame className="w-4 h-4 text-amber-300" />
              Live Marketplace Activity Metrics
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Trending Marketplace Items
            </h1>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              Real-time rankings based on sales velocity, download volume, 5-star review frequency, and buyer engagement across the Desigot ecosystem.
            </p>
          </div>
        </div>

        {/* 1. Trending Services */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Trending Services This Week</h2>
                <p className="text-xs text-slate-500">Highest order volume and top turnaround speed</p>
              </div>
            </div>
            <Link href="/services?sort=popular" className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {services.map((s: any, idx: number) => (
              <div
                key={s.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative">
                    <img
                      src={s.featured_image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80"}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-md">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <img
                      src={s.seller_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${s.seller_name}`}
                      alt={s.seller_name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-xs font-semibold text-slate-700 truncate">{s.seller_name}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                    {s.title}
                  </h3>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-600">From ${(s.starting_price_cents / 100).toFixed(0)}</span>
                  <Link href={`/services/${s.slug}`} className="font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
                    Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Trending Digital Products */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Trending Downloads & UI Kits</h2>
                <p className="text-xs text-slate-500">Highest sales velocity and community favorites</p>
              </div>
            </div>
            <Link href="/products?sort=popular" className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((p: any, idx: number) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative">
                    <img
                      src={p.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center shadow-md">
                      #{idx + 1}
                    </span>
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
                  <Link href={`/products/${p.slug}`} className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
                    Inspect <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Popular Categories & Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Trending Categories */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" /> High-Velocity Categories
            </h2>
            <div className="space-y-2.5">
              {categories.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 group transition-colors"
                >
                  <span className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                    {c.name}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {c.item_count} items
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Sellers */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-current" /> Top Revenue Creators
            </h2>
            <div className="space-y-3">
              {sellers.map((sell: any) => (
                <div
                  key={sell.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={sell.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${sell.display_name}`}
                      alt={sell.display_name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{sell.display_name}</span>
                        {sell.seller_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{sell.total_sales || 120} sales completed</span>
                    </div>
                  </div>
                  <Link href={`/seller/${sell.username || sell.id}`}>
                    <Button variant="secondary" size="sm">
                      Profile
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
