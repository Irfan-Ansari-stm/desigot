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
  DollarSign,
  TrendingUp,
  CreditCard,
  LayoutDashboard,
  Briefcase,
  Package,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SellerEarningsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [balance, setBalance] = useState<any>({
    available_cents: 842000,
    pending_escrow_cents: 360000,
    lifetime_earnings_cents: 2845000,
    payout_method: "Stripe Connect Direct",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/seller/earnings");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Earnings & Financial Settlement</h1>
          <p className="text-xs text-slate-500">Track escrow releases, commission deductions, available balances, and Stripe payout batches.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          {[
            { href: "/seller/dashboard", label: "Overview", icon: LayoutDashboard },
            { href: "/seller/services", label: "My Services", icon: Briefcase },
            { href: "/seller/products", label: "My Products", icon: Package },
            { href: "/seller/orders", label: "Client Orders", icon: ShoppingBag },
            { href: "/seller/earnings", label: "Earnings & Balance", icon: DollarSign, active: true },
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

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available for Payout</span>
            <div className="text-3xl font-black text-slate-900">${(balance.available_cents / 100).toLocaleString()}</div>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for withdrawal
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Held in Escrow</span>
            <div className="text-3xl font-black text-slate-900">${(balance.pending_escrow_cents / 100).toLocaleString()}</div>
            <p className="text-xs text-blue-600 font-semibold">Active client milestone deliverables</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lifetime Gross</span>
            <div className="text-3xl font-black text-slate-900">${(balance.lifetime_earnings_cents / 100).toLocaleString()}</div>
            <p className="text-xs text-slate-500 font-semibold">Cumulative creator revenue</p>
          </div>
        </div>

        {/* Payout Action */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Connected Payout Method: {balance.payout_method}</h2>
              <p className="text-xs text-slate-500">Direct automatic transfers occur every Friday to your connected bank account.</p>
            </div>
          </div>
          <Link href="/seller/payouts">
            <Button variant="accent" size="md">
              Request Instant Payout
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
