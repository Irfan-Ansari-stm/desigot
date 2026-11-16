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
  Briefcase,
  Plus,
  Star,
  Clock,
  LayoutDashboard,
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SellerServicesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/seller/services");
      return;
    }
    async function loadServices() {
      try {
        const res = await api.get("/public/services?limit=20");
        setServices(res.data?.data || res.data?.services || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Agency Services</h1>
            <p className="text-xs text-slate-500">Manage your published offerings, milestone scopes, pricing tiers, and packages.</p>
          </div>
          <Link href="/dashboard/listings/new">
            <Button variant="accent" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add Service
            </Button>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          {[
            { href: "/seller/dashboard", label: "Overview", icon: LayoutDashboard },
            { href: "/seller/services", label: "My Services", icon: Briefcase, active: true },
            { href: "/seller/products", label: "My Products", icon: Package },
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

        {/* Services Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Active Service Listings ({services.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Service Title</th>
                  <th className="pb-3">Starting Price</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Turnaround</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {services.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 font-bold text-slate-900 truncate max-w-sm">{s.title}</td>
                    <td className="py-3.5 font-bold text-slate-900">${(s.starting_price_cents / 100).toFixed(0)}</td>
                    <td className="py-3.5 text-amber-500 font-bold">★ {Number(s.rating || s.avg_rating || 4.9).toFixed(1)}</td>
                    <td className="py-3.5 text-slate-500">{s.delivery_time_days || 3} days</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                        Published
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link href={`/services/${s.slug}`} className="text-rose-600 hover:text-rose-700 font-bold">
                        View Public Listing →
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
