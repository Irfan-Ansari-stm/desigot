"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { useAuthStore } from "@/store/auth.store";
import {
  TrendingUp,
  LayoutDashboard,
  Briefcase,
  Package,
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SellerPayoutsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [payoutRequested, setPayoutRequested] = useState(false);

  const payouts = [
    {
      id: "PO-7821",
      amount_cents: 420000,
      currency: "USD",
      status: "completed",
      destination: "Stripe ACH Bank ending in •••• 4218",
      date: "Nov 14, 2026",
    },
    {
      id: "PO-7740",
      amount_cents: 315000,
      currency: "USD",
      status: "completed",
      destination: "Stripe ACH Bank ending in •••• 4218",
      date: "Nov 07, 2026",
    },
    {
      id: "PO-7622",
      amount_cents: 580000,
      currency: "USD",
      status: "completed",
      destination: "Stripe ACH Bank ending in •••• 4218",
      date: "Oct 31, 2026",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />
      <NotificationsPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Payout Transfer History</h1>
            <p className="text-xs text-slate-500">View electronic bank transfers, payout status, and transfer identifiers.</p>
          </div>

          <Button
            variant="accent"
            size="md"
            onClick={() => setPayoutRequested(true)}
            disabled={payoutRequested}
          >
            {payoutRequested ? "Payout Transfer Initiated" : "Withdraw Available Funds"}
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          {[
            { href: "/seller/dashboard", label: "Overview", icon: LayoutDashboard },
            { href: "/seller/services", label: "My Services", icon: Briefcase },
            { href: "/seller/products", label: "My Products", icon: Package },
            { href: "/seller/orders", label: "Client Orders", icon: ShoppingBag },
            { href: "/seller/earnings", label: "Earnings & Balance", icon: DollarSign },
            { href: "/seller/payouts", label: "Payout History", icon: TrendingUp, active: true },
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

        {payoutRequested && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Success: Payout transfer of $8,420.00 has been sent to Stripe for processing. Funds will settle within 2 business days.</span>
          </div>
        )}

        {/* Payouts Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Transfer Reference</th>
                  <th className="pb-3">Transfer Amount</th>
                  <th className="pb-3">Destination</th>
                  <th className="pb-3">Disbursement Date</th>
                  <th className="pb-3 text-right">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {payouts.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 font-bold text-slate-900">#{po.id}</td>
                    <td className="py-3.5 font-black text-slate-900">${(po.amount_cents / 100).toFixed(2)}</td>
                    <td className="py-3.5 text-slate-500">{po.destination}</td>
                    <td className="py-3.5 text-slate-500">{po.date}</td>
                    <td className="py-3.5 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                        {po.status}
                      </span>
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
