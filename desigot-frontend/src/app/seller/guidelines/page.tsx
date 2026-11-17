"use client";
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  ShieldCheck, 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Palette, 
  Code2, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function SellerGuidelinesPage() {
  const guidelines = [
    {
      icon: Layers,
      title: "1. Asset Quality & Layer Organization",
      description: "All design deliverables must feature clean, logically named layers and structured component architectures. Auto-layout is required for all Figma frames and components.",
      rules: [
        "Use semantic naming conventions (e.g., 'Button / Primary / Hover')",
        "Enforce Figma Auto-Layout v4 on all responsive components",
        "Include light and dark mode variants where applicable",
        "No ungrouped shapes, flattened vector masks, or unnamed layers"
      ]
    },
    {
      icon: Palette,
      title: "2. Typography & Color Variables",
      description: "Assets must use free Google Fonts or clearly licensed open-source typefaces. Color palettes must be defined using global color styles or Figma design tokens.",
      rules: [
        "Include link to free font source in the documentation file",
        "Define typography hierarchy (H1-H6, Body, Caption)",
        "Zero missing font warnings upon initial asset inspection",
        "Ensure WCAG 2.1 AA contrast ratios for all UI states"
      ]
    },
    {
      icon: ShieldCheck,
      title: "3. Originality & Intellectual Property",
      description: "You must own 100% of the copyright for submitted files. Reselling existing marketplace templates or unauthorized third-party brand assets results in immediate account suspension.",
      rules: [
        "100% original artwork, vectors, and layouts",
        "Stock imagery must carry CC0 or commercial resale permissions",
        "Do not include proprietary corporate trademarks or logos without written license",
        "Disclose any AI-assisted asset generations in the product description"
      ]
    },
    {
      icon: Code2,
      title: "4. Documentation & Deliverables",
      description: "Each package must include a Quick Start guide, change log, and setup instructions. Clean export files (.fig, .sketch, .xd, or .zip) must be tested prior to upload.",
      rules: [
        "Include a 'Readme.md' or Figma Cover Page with instructions",
        "Provide component showcase frames with real data examples",
        "Single-file deliverables must not exceed 250MB compressed",
        "Verify all external library links are detached or properly packaged"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-16 w-full space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Desigot Quality Standard
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Creator & Seller Guidelines
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Our curation team reviews every submission against enterprise-grade benchmarks before publishing to the marketplace.
          </p>
        </div>

        {/* Guidelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guidelines.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{g.title}</h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {g.description}
                </p>
                <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {g.rules.map((rule, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Review Process Banner */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-8 md:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-300" />
              Submission Turnaround Time: 24–48 Hours
            </h3>
            <p className="text-xs text-purple-200/90 leading-relaxed">
              Every item is tested by our Design Quality Engineering team across Figma, Sketch, and code frameworks. Once approved, your listing is indexed across global search instantly.
            </p>
          </div>
          <Link
            href="/seller/onboarding"
            className="shrink-0 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-purple-950 font-bold text-xs flex items-center gap-2 transition shadow"
          >
            Start Selling Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
