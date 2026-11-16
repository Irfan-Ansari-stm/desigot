"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { usePublicCategory } from "@/hooks/useMarketplace";
import {
  Layers,
  Sparkles,
  ArrowRight,
  Star,
  Download,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { data, isLoading, error } = usePublicCategory(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-600">Loading category details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data?.category) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Category Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">
            The category you are looking for does not exist or may have been moved.
          </p>
          <Link href="/categories">
            <Button variant="accent">View All Categories</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { category, subcategories, services, products, seo } = data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12 flex-1 w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-rose-600">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href="/categories" className="hover:text-rose-600">Categories</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-900">{category.name}</span>
        </div>

        {/* Hero Banner */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200/60 rounded-full px-3.5 py-1 text-xs font-bold text-rose-600">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Taxonomy Category
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              {category.name}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              {category.description || "Discover verified digital assets, design kits, and agency services in this category."}
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href={`/browse?category_id=${category.id}`}>
                <Button variant="accent" size="md">
                  Browse All Items
                </Button>
              </Link>
              <Link href={`/services?category=${category.slug}`}>
                <Button variant="secondary" size="md">
                  Hire Specialists
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Subcategories Grid */}
        {subcategories && subcategories.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Subcategories</h2>
                <p className="text-xs text-slate-500">Explore specialized sub-branches within {category.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {subcategories.map((sub: any) => (
                <Link
                  key={sub.id}
                  href={`/categories/${sub.slug}`}
                  className="bg-white border border-slate-200 hover:border-rose-300 hover:shadow-md p-4 rounded-2xl group transition-all text-center flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-rose-50 text-slate-600 group-hover:text-rose-600 flex items-center justify-center transition-colors">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                    {sub.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {(sub.service_count || 0) + (sub.product_count || 0)} items
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Services in this category */}
        {services && services.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Services in {category.name}</h2>
                <p className="text-xs text-slate-500">Hire verified agencies and senior designers</p>
              </div>
              <Link
                href={`/services?category=${category.slug}`}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                View all services <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {services.map((s: any) => (
                <div
                  key={s.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative">
                      <img
                        src={s.featured_image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80"}
                        alt={s.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-800">
                        {s.delivery_time_days || 3} days delivery
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <img
                        src={s.seller_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${s.seller_name}`}
                        alt={s.seller_name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs text-slate-600 font-medium truncate">{s.seller_name}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                      {s.title}
                    </h3>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{Number(s.rating || 4.9).toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({s.review_count || 12})</span>
                    </div>
                    <Link
                      href={`/services/${s.slug}`}
                      className="font-bold text-rose-600 hover:text-rose-700"
                    >
                      From ${(s.starting_price_cents / 100).toFixed(0)}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Digital Products in this category */}
        {products && products.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Digital Assets & UI Kits in {category.name}</h2>
                <p className="text-xs text-slate-500">Download instantly with commercial licensing</p>
              </div>
              <Link
                href={`/products?category=${category.slug}`}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                View all products <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden relative">
                      <img
                        src={p.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold">
                        ${(p.price_cents / 100).toFixed(0)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                      {p.title}
                    </h3>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      by {p.seller_name}
                    </span>
                    <Link
                      href={`/products/${p.slug}`}
                      className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    >
                      Inspect <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
