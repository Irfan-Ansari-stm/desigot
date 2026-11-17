"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Palette, 
  FileCheck2, 
  ExternalLink 
} from "lucide-react";

export default function BrandKitPage() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const colors = [
    { name: "Brand Navy", hex: "#0B0F19", role: "Primary Background & Header Dark" },
    { name: "Brand Purple", hex: "#7C3AED", role: "Primary Accent & Brand Mark" },
    { name: "Accent Light Purple", hex: "#A78BFA", role: "Secondary Accents & Badges" },
    { name: "Slate Border", hex: "#263144", role: "Footer & Card Dividers" },
    { name: "Text Muted", hex: "#91A8C7", role: "Subtitles & Secondary Links" }
  ];

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-16 w-full space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Palette className="w-3.5 h-3.5" />
            Media & Design Resources
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Desigot Brand & Media Kit
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Official logos, vector badges, color palettes, and brand guidelines for press, partners, and media coverage.
          </p>
        </div>

        {/* Logos & Assets */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Official Logo Marks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dark background logo */}
            <div className="bg-[#0B0F19] rounded-3xl p-8 flex flex-col justify-between min-h-[220px] border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                  D
                </div>
                <span className="text-2xl font-black tracking-tight text-white font-sans">
                  desigot
                </span>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
                <span className="text-xs text-slate-400">Logo Mark on Dark Background (.SVG / .PNG)</span>
                <button
                  onClick={() => alert("Downloading official SVG logo package...")}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download SVG
                </button>
              </div>
            </div>

            {/* Light background logo */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between min-h-[220px] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                  D
                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                  desigot
                </span>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Logo Mark on Light Background (.SVG / .PNG)</span>
                <button
                  onClick={() => alert("Downloading official SVG logo package...")}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download SVG
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Brand Color Palette</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {colors.map((c, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2 shadow-sm"
              >
                <div
                  className="w-full h-16 rounded-xl border border-black/10 shadow-inner"
                  style={{ backgroundColor: c.hex }}
                />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</h3>
                  <p className="text-[10px] text-slate-400 leading-tight">{c.role}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(c.hex)}
                  className="w-full py-1 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1 transition"
                >
                  {copiedHex === c.hex ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      {c.hex}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Press Usage Terms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-purple-600" />
            Brand Usage Guidelines
          </h2>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
            <p>
              • Please do not modify, stretch, re-color, or rotate the Desigot mark or typography.
            </p>
            <p>
              • Always maintain clear space around the logo equal to at least 50% of the logo mark width.
            </p>
            <p>
              • For press inquiries, interview requests, or high-resolution custom exports, contact our communications desk at <Link href="/contact" className="text-purple-600 underline font-medium">press@desigot.com</Link>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
