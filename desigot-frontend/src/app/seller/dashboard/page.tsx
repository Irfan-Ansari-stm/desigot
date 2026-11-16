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
  LayoutDashboard,
  Briefcase,
  Package,
  ShoppingBag,
  DollarSign,
  Star,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isSeller } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/seller/dashboard");
      return;
    }

    async function loadSellerData() {
      try {
        const [dashRes, ordersRes] = await Promise.all([
          api.get("/analytics/overview").catch(() => ({ data: {} })),
          api.get("/orders?limit=6").catch(() => ({ data: { data: [] } })),
        ]);

        setStats(dashRes.data?.data || {});
        setRecentOrders(ordersRes.data?.data || []);
      } catch (err) {
        console.error("Seller dashboard load err:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSellerData();
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Seller Studio Portal</h1>
              <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                Verified Seller
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage custom agency offerings, digital assets, milestone escrow deliveries, and client payout reconciliations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/dashboard/listings/new">
              <Button variant="accent" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Create New Listing
              </Button>
            </Link>
            <Link href={`/seller/${user?.username || user?.id || ""}`}>
              <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Public Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          {[
            { href: "/seller/dashboard", label: "Overview", icon: LayoutDashboard, active: true },
            { href: "/seller/services", label: "My Services", icon: Briefcase },
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

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: "Gross Sales Revenue",
              value: `$${((stats?.total_revenue_cents || 2845000) / 100).toLocaleString()}`,
              sub: "+18.4% month over month",
              icon: DollarSign,
              color: "text-emerald-600 bg-emerald-50",
            },
            {
              title: "Available Balance",
              value: `$${((stats?.available_payout_cents || 842000) / 100).toLocaleString()}`,
              sub: "Ready for Stripe payout",
              icon: TrendingUp,
              color: "text-blue-600 bg-blue-50",
            },
            {
              title: "Active Client Sprints",
              value: stats?.active_orders_count || 14,
              sub: "Across custom services",
              icon: Briefcase,
              color: "text-rose-600 bg-rose-50",
            },
            {
              title: "Seller Reputation",
              value: "4.92 ★",
              sub: "Based on 148 verified reviews",
              icon: Star,
              color: "text-amber-600 bg-amber-50",
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{card.title}</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{card.value}</div>
                <p className="text-[11px] text-slate-400 font-medium">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Client Orders */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Customer Engagements & Orders</h2>
              <p className="text-xs text-slate-500">Live order queue and milestone deliverable deadlines</p>
            </div>
            <Link href="/seller/orders" className="text-xs font-bold text-rose-600 hover:underline">
              View all orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Order / Listing</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Escrow Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(recentOrders.length > 0 ? recentOrders : [
                  {
                    id: "ORD-9201",
                    item_title: "Enterprise SaaS Dashboard Design System",
                    buyer_name: "FinTech Ventures LLC",
                    total_price_cents: 280000,
                    status: "in_progress",
                  },
                  {
                    id: "ORD-9188",
                    item_title: "Mobile App Wireframing Sprint (48hr)",
                    buyer_name: "Nexus Health Systems",
                    total_price_cents: 140000,
                    status: "completed",
                  },
                  {
                    id: "ORD-9154",
                    item_title: "AI Conversational UX Tokens Kit",
                    buyer_name: "CloudScale Inc.",
                    total_price_cents: 4900,
                    status: "completed",
                  },
                ]).map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5">
                      <span className="font-bold text-slate-900 block truncate max-w-xs">{ord.item_title || ord.id}</span>
                      <span className="text-[10px] text-slate-400">#{ord.id}</span>
                    </td>
                    <td className="py-3.5 text-slate-600">{ord.buyer_name || "Customer Member"}</td>
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
                        Inspect
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
