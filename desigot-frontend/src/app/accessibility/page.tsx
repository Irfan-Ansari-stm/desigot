"use client";
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Eye, 
  CheckCircle2, 
  Keyboard, 
  Sparkles, 
  ShieldCheck, 
  Mail, 
  HelpCircle 
} from "lucide-react";

export default function AccessibilityPage() {
  const standards = [
    {
      title: "WCAG 2.1 AA Color Contrast",
      desc: "All text and interactive controls maintain a minimum contrast ratio of 4.5:1 against their adjacent backgrounds, with large text exceeding 3:1."
    },
    {
      title: "Full Keyboard Navigation",
      desc: "Every button, dropdown menu, search bar, and marketplace link can be navigated using Tab, Shift+Tab, Enter, Escape, and Space without keyboard traps."
    },
    {
      title: "Screen Reader Semantics & ARIA",
      desc: "All page landmarks (<header>, <nav>, <main>, <footer>), buttons, modals, and dynamic alerts feature aria-label, aria-expanded, and semantic HTML tags."
    },
    {
      title: "Reduced Motion & Responsive Scaling",
      desc: "Respects user prefers-reduced-motion OS preferences by disabling non-essential CSS transitions, and cleanly scales typography up to 200% without horizontal scroll clipping."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-16 w-full space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Eye className="w-3.5 h-3.5" />
            Digital Inclusivity
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Accessibility Statement
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Desigot is committed to digital accessibility for people of all abilities.
          </p>
        </div>

        {/* Statement */}
        <div className="prose dark:prose-invert max-w-none text-xs text-slate-600 dark:text-slate-400 space-y-4 leading-relaxed">
          <p>
            At Desigot, we believe that design tools, UI resources, and creative services should be barrier-free and accessible to everyone. We continually inspect, test, and enhance our digital marketplace to conform to the World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
          </p>
          <p>
            Our frontend engineering guidelines mandate automated accessibility audits via axe-core and manual screen-reader testing (NVDA, VoiceOver) across all public marketplace flows, including search, checkout, asset downloading, and seller communication.
          </p>
        </div>

        {/* Implemented Standards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {standards.map((s, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">{s.title}</h3>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Feedback & Remediation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-600" />
            Accessibility Feedback & Assistance
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            If you encounter any accessibility barriers while browsing Desigot, or if you need an asset converted into an accessible format, please contact our Accessibility Remediation team. We respond within 24 business hours.
          </p>
          <div className="pt-2">
            <Link
              href="/contact?subject=Accessibility"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow transition"
            >
              <Mail className="w-3.5 h-3.5" />
              Submit Accessibility Feedback
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
