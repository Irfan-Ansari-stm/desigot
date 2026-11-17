"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Share2, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Gift,
  Copy,
  Check
} from "lucide-react";

export default function AffiliatePage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://desigot.com/?ref=partner");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const benefits = [
    {
      title: "Earn 30% Recurring Commission",
      desc: "Receive 30% on every initial purchase made by users you refer, plus 10% on subsequent subscription renewals during their first year."
    },
    {
      title: "60-Day Cookie Window",
      desc: "Our tracking cookies persist for 60 full days. If your referral visits today and purchases within two months, you get full credit."
    },
    {
      title: "Real-Time Tracking & Reporting",
      desc: "Live clicks, conversion attribution, EPC metrics, and payout status available 24/7 in your dedicated affiliate dashboard."
    },
    {
      title: "Marketing Assets & Creator Media Kit",
      desc: "Gain instant access to pre-made Figma banners, social graphics, promotional badges, and brand copy kits ready to publish."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-16 w-full space-y-12">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Gift className="w-3.5 h-3.5" />
            Desigot Partner Network
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Monetize Your Audience with Desigot Affiliates
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Share elite design systems, UI kits, and professional agency services with your community and earn industry-leading commissions.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/register?type=affiliate"
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md"
            >
              Join Affiliate Program
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                  0{idx + 1}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{b.title}</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-11">
                {b.desc}
              </p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center">
            How Desigot Affiliate Partnerships Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 mx-auto flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">Apply & Get Link</h3>
              <p className="text-xs text-slate-500">Sign up in 60 seconds. Receive your customized tracking URL and portal credentials instantly.</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 mx-auto flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">Share Content</h3>
              <p className="text-xs text-slate-500">Recommend UI templates, Figma systems, or design services via your blog, YouTube, newsletter, or X.</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 mx-auto flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">Collect Cash Monthly</h3>
              <p className="text-xs text-slate-500">Receive automatic electronic payouts to Stripe or PayPal on the 1st of every calendar month.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
