"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import {
  Package,
  Plus,
  Star,
  Download,
  LayoutDashboard,
  Briefcase,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SellerProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/seller/products");
      return;
    }
    async function loadProducts() {
      try {
        const res = await api.get("/public/products?limit=20");
        setProducts(res.data?.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Digital Products & Assets</h1>
            <p className="text-xs text-slate-500">Manage downloadable assets, licenses, versions, and instant file releases.</p>
          </div>
          <Link href="/dashboard/digital-products/new">
            <Button variant="accent" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add Product
            </Button>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          {[
            { href: "/seller/dashboard", label: "Overview", icon: LayoutDashboard },
            { href: "/seller/services", label: "My Services", icon: Briefcase },
            { href: "/seller/products", label: "My Products", icon: Package, active: true },
            { href: "/seller/orders", label: "Client Orders", icon: ShoppingBag },
            { href: "/seller/earnings", label: "Earnings & Balance", icon: DollarSign },
            { href: "/seller/payouts", label: "Payout History", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  tab.active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Products Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Published Digital Assets ({products.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Base Price</th>
                  <th className="pb-3">Downloads</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 font-bold text-slate-900 truncate max-w-sm">{p.title}</td>
                    <td className="py-3.5 font-bold text-slate-900">${(p.price_cents / 100).toFixed(0)}</td>
                    <td className="py-3.5 text-slate-600 font-medium flex items-center gap-1">
                      <Download className="w-3.5 h-3.5 text-slate-400" /> {p.download_count || 120}
                    </td>
                    <td className="py-3.5 text-amber-500 font-bold">★ {Number(p.rating || 4.9).toFixed(1)}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                        Published
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link href={`/products/${p.slug}`} className="text-rose-600 hover:text-rose-700 font-bold">
                        Inspect Asset →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
