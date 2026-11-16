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
  ShoppingBag,
  LayoutDashboard,
  Briefcase,
  Package,
  DollarSign,
  TrendingUp,
  Search,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SellerOrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/seller/orders");
      return;
    }
    async function loadOrders() {
      try {
        const res = await api.get("/orders?limit=25");
        setOrders(res.data?.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Client Orders & Milestone Deliverables</h1>
          <p className="text-xs text-slate-500">Track client project deadlines, escrow releases, revision requests, and contract handoffs.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          {[
            { href: "/seller/dashboard", label: "Overview", icon: LayoutDashboard },
            { href: "/seller/services", label: "My Services", icon: Briefcase },
            { href: "/seller/products", label: "My Products", icon: Package },
            { href: "/seller/orders", label: "Client Orders", icon: ShoppingBag, active: true },
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

        {/* Orders Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Deliverable Item</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Order Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(orders.length > 0 ? orders : [
                  {
                    id: "ORD-8921",
                    item_title: "Design System Figma Component Tokens",
                    buyer_name: "FinTech Scale LLC",
                    total_price_cents: 180000,
                    status: "in_progress",
                  },
                  {
                    id: "ORD-8910",
                    item_title: "Executive BI Dashboard UI Kit",
                    buyer_name: "Starlight Digital",
                    total_price_cents: 4900,
                    status: "completed",
                  },
                ]).map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 font-bold text-slate-900">#{ord.id}</td>
                    <td className="py-3.5 font-semibold text-slate-800 truncate max-w-sm">{ord.item_title || ord.id}</td>
                    <td className="py-3.5 text-slate-600">{ord.buyer_name || "Customer Client"}</td>
                    <td className="py-3.5 font-bold text-slate-900">${((ord.total_price_cents || 4900) / 100).toFixed(2)}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ord.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {ord.status || "in_progress"}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link href={`/account/orders`} className="text-rose-600 hover:text-rose-700 font-bold">
                        Inspect →
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
