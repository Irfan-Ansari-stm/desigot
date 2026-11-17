"use client";
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Newspaper, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  ExternalLink, 
  Mail 
} from "lucide-react";

export default function PressPage() {
  const releases = [
    {
      date: "October 14, 2026",
      title: "Desigot Announces Series A Financing to Scale Global Design Asset Infrastructure",
      summary: "Funding round led by prominent design and enterprise SaaS venture funds will accelerate AI-assisted design asset verification, escrow protection for custom creative services, and international seller payouts.",
      tag: "Corporate",
      link: "#"
    },
    {
      date: "August 28, 2026",
      title: "Desigot Surpasses 10,000 Verified Creator Studios Across 65 Countries",
      summary: "Rapid expansion of the creator economy establishes Desigot as the premier marketplace destination for enterprise design systems, Figma UI kits, and specialized mobile application templates.",
      tag: "Milestone",
      link: "#"
    },
    {
      date: "June 12, 2026",
      title: "Introducing Desigot Services Escrow: Secure Milestone-Based Agency Contracting",
      summary: "New escrow engine allows product teams to commission vetted design agencies with 100% money-back guarantee, automated revision tracking, and streamlined corporate billing.",
      tag: "Product Launch",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-16 w-full space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Newspaper className="w-3.5 h-3.5" />
            Desigot Newsroom
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Press Releases & Announcements
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Latest company news, product releases, industry milestones, and official press statements from Desigot.
          </p>
        </div>

        {/* Press Releases List */}
        <div className="space-y-4">
          {releases.map((rel, idx) => (
            <article
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-3 hover:border-purple-300 dark:hover:border-purple-700 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                  {rel.tag}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {rel.date}
                </span>
              </div>

              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {rel.title}
              </h2>

              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {rel.summary}
              </p>

              <div className="pt-2">
                <Link
                  href="/contact?subject=PressInquiry"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700"
                >
                  Request Press Briefing / Media Kit
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Media Contact Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-600" />
              Media Relations Desk
            </h3>
            <p className="text-xs text-slate-500">
              Journalists and media outlets can reach our communications team directly for statements, executive commentary, or assets.
            </p>
          </div>
          <Link
            href="/contact?subject=Media"
            className="shrink-0 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow transition"
          >
            Contact PR Team
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
