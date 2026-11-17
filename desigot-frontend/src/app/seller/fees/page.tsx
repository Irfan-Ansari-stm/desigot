"use client";
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Percent, 
  Coins, 
  Calendar, 
  CreditCard, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight 
} from "lucide-react";

export default function SellerFeesPage() {
  const tiers = [
    {
      name: "Creator Standard",
      commission: "80%",
      payout: "You keep 80% of every sale",
      desigotFee: "20% marketplace fee",
      features: [
        "Unlimited digital asset uploads",
        "Bi-weekly Stripe & PayPal payouts",
        "Built-in license management",
        "Standard marketplace analytics",
        "Community support & seller forums"
      ],
      popular: false
    },
    {
      name: "Exclusive Pro",
      commission: "90%",
      payout: "You keep 90% of every sale",
      desigotFee: "10% marketplace fee",
      features: [
        "Assets exclusive to Desigot",
        "Weekly automated payout cycle",
        "Featured homepage rotation & badges",
        "Dedicated Creator Success Manager",
        "Priority 12-hour submission review",
        "Direct custom service commission discounts"
      ],
      popular: true
    },
    {
      name: "Agency & Studio",
      commission: "85%",
      payout: "You keep 85% of custom service orders",
      desigotFee: "15% platform escrow fee",
      features: [
        "High-ticket custom service contracts",
        "Milestone-based escrow protection",
        "Multi-seat team collaborator seats",
        "Custom client invoicing & tax invoices",
        "Enterprise procurement matching"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-16 w-full space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Coins className="w-3.5 h-3.5" />
            Transparent Creator Economics
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Seller Earnings & Platform Fees
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            No hidden fees, no monthly listing charges. You only pay when you make a sale.
          </p>
        </div>

        {/* Pricing / Commission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-6 flex flex-col justify-between relative transition-all ${
                tier.popular
                  ? "bg-gradient-to-b from-purple-950 to-slate-900 border-2 border-purple-500 shadow-xl text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-purple-600 text-white text-[11px] font-bold tracking-wide uppercase shadow">
                  Most Popular
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <h3 className={`text-base font-bold ${tier.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {tier.name}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tight">{tier.commission}</span>
                    <span className={`text-xs ${tier.popular ? "text-purple-300" : "text-slate-500"}`}>
                      Take-home
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${tier.popular ? "text-purple-200" : "text-slate-500"}`}>
                    {tier.payout}
                  </p>
                  <span className={`inline-block mt-2 text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                    tier.popular ? "bg-purple-900/80 text-purple-200" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                    {tier.desigotFee}
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-200/20 space-y-2.5">
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                        tier.popular ? "text-purple-400" : "text-emerald-500"
                      }`} />
                      <span className={tier.popular ? "text-slate-200" : "text-slate-700 dark:text-slate-300"}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href="/seller/onboarding"
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                    tier.popular
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
                  }`}
                >
                  Apply as Creator
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Payout Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Payout Methods & Payout Schedule
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">Supported Gateways</h3>
              <p>Stripe Connect direct deposit (available in 45+ countries) and PayPal worldwide payouts with instant currency conversion.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">Minimum Withdrawal</h3>
              <p>Withdraw earnings once your account balance reaches $50.00 USD. No holding penalties or withdrawal wire charges on standard schedules.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">Tax Documentation</h3>
              <p>Automated W-9 / W-8BEN compliance validation and year-end 1099-K reporting directly downloadable from your seller portal.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
