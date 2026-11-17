"use client";
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Trophy, 
  Star, 
  Quote, 
  ArrowUpRight, 
  TrendingUp, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function SuccessStoriesPage() {
  const stories = [
    {
      name: "Marcus Vance",
      role: "Lead UI Engineer & Design System Creator",
      handle: "@marcusvance",
      stat: "$184,000+",
      statLabel: "Gross Earnings in 12 Months",
      product: "Apex UI Enterprise Design Kit",
      quote: "Desigot completely transformed how I monetize my design work. Instead of trading hours for client fees, my Figma systems generate reliable six-figure passive income every single month.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
    },
    {
      name: "Studio Chroma",
      role: "Boutique UX Agency (London)",
      handle: "@studiochroma",
      stat: "42 Enterprise Clients",
      statLabel: "Acquired via Desigot Services",
      product: "SaaS UX Audit & Design Sprint",
      quote: "The quality of buyers on Desigot is superior to typical freelance boards. We regularly close $15k–$30k custom product design contracts through inbound marketplace service leads.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
    },
    {
      name: "Elena Rostova",
      role: "Mobile App Designer & Prototyper",
      handle: "@elena_ux",
      stat: "14,800+ Downloads",
      statLabel: "Worldwide Creator Reach",
      product: "Fintech & Crypto Mobile UI Kit",
      quote: "The seller analytics and licensing tools give me full control over my business. Launching a new kit on Desigot gives me instant exposure to thousands of product managers and developers.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-16 w-full space-y-12">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            Creator Spotlight
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Creator Success Stories
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Meet the top designers, studios, and agencies building thriving independent digital businesses on Desigot.
          </p>
        </div>

        {/* Stories List */}
        <div className="space-y-8">
          {stories.map((story, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8"
            >
              <div className="shrink-0 flex flex-col items-center text-center space-y-3">
                <img
                  src={story.avatar}
                  alt={story.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-100 dark:ring-purple-900/40"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{story.name}</h3>
                  <p className="text-xs text-slate-400">{story.handle}</p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">{story.role}</p>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                  <span className="text-xs text-slate-400 ml-2 font-mono">Featured: {story.product}</span>
                </div>

                <div className="relative">
                  <Quote className="w-8 h-8 text-slate-200 dark:text-slate-800 absolute -top-4 -left-3 -z-10" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{story.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6">
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{story.stat}</span>
                    <p className="text-[11px] text-slate-500">{story.statLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="bg-purple-950 text-white rounded-3xl p-8 md:p-12 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-black">Ready to build your design empire?</h2>
          <p className="text-xs md:text-sm text-purple-200 max-w-xl mx-auto">
            Join thousands of world-class UI/UX creators monetizing their design systems today.
          </p>
          <div className="pt-2">
            <Link
              href="/seller/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-purple-950 font-bold text-xs shadow transition"
            >
              Start Selling on Desigot
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
