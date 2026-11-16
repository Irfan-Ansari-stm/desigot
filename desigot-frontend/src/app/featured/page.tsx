"use client";
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { usePublicFeatured } from "@/hooks/useMarketplace";
import {
  Sparkles,
  Star,
  ShieldCheck,
  ArrowRight,
  Briefcase,
  Package,
  Layers,
  Award,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function FeaturedMarketplacePage() {
  const { data, isLoading } = usePublicFeatured();

  const services = data?.services || [];
  const products = data?.products || [];
  const sellers = data?.sellers || [];
  const categories = data?.categories || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14 flex-1 w-full">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-14 shadow-xl relative overflow-hidden text-center sm:text-left">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-500/40 rounded-full px-3.5 py-1 text-xs font-bold text-rose-300">
              <Award className="w-4 h-4 text-rose-400" />
              Editor Curated & Administrator Verified
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Featured Marketplace Showcase
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Hand-picked design systems, benchmark agency offerings, and elite verified creator studios chosen for outstanding craft and conversion impact.
            </p>
          </div>
        </div>

        {/* 1. Featured Services */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Featured Agency Services</h2>
                <p className="text-xs text-slate-500">Milestone-protected bespoke design engagements</p>
              </div>
            </div>
            <Link href="/services?featured=true" className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1">
              Explore all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
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
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Featured
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
          )}
        </section>

        {/* 2. Featured Digital Products */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Featured UI Kits & Assets</h2>
                <p className="text-xs text-slate-500">Top-rated design systems and components ready for download</p>
              </div>
            </div>
            <Link href="/products?featured=true" className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1">
              Explore all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((p: any) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative">
                    <img
                      src={p.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Editor Choice
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
                    Download <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Featured Creators & Studios */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Featured Creators & Studios</h2>
              <p className="text-xs text-slate-500">Top-tier verified sellers maintaining benchmark 4.8★+ ratings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {sellers.map((sell: any) => (
              <div
                key={sell.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={sell.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${sell.display_name}`}
                      alt={sell.display_name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900">{sell.display_name}</h3>
                        {sell.seller_verified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                      </div>
                      <p className="text-xs text-amber-500 font-bold flex items-center gap-1">
                        ★ {Number(sell.avg_seller_rating || 4.9).toFixed(1)}
                        <span className="text-slate-400 font-normal">({sell.seller_review_count || 24} reviews)</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {sell.bio || "Specialist in mobile applications, responsive dashboards, and interactive design token workflows."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">{sell.total_sales || 180} sales</span>
                  <Link href={`/seller/${sell.username || sell.id}`}>
                    <Button variant="secondary" size="sm">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Featured Categories */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Featured Categories</h2>
              <p className="text-xs text-slate-500">Popular design domains with highest buyer demand</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="bg-white border border-slate-200 hover:border-rose-400 hover:shadow-md p-5 rounded-2xl group transition-all text-center flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-rose-50 text-slate-700 group-hover:text-rose-600 flex items-center justify-center transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
