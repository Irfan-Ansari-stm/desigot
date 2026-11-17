"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Cookie, 
  ShieldCheck, 
  Settings, 
  CheckCircle2, 
  Save 
} from "lucide-react";

export default function CookiePolicyPage() {
  const [preferences, setPreferences] = useState({
    strictlyNecessary: true,
    functional: true,
    performance: true,
    marketing: false
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-16 w-full space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Cookie className="w-3.5 h-3.5" />
            Compliance & Privacy
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Cookie Policy & Consent Preferences
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Last Updated: November 2026 • Compliant with GDPR, ePrivacy Directive, and CCPA
          </p>
        </div>

        {/* Narrative */}
        <div className="prose dark:prose-invert max-w-none text-xs text-slate-600 dark:text-slate-400 space-y-4 leading-relaxed">
          <p>
            Desigot Inc. ("we", "us", or "our") uses cookies and similar automated tracking technologies (such as web beacons, pixels, and local storage) to provide, enhance, and personalize your experience across our digital marketplace, authenticate your sessions, maintain your shopping cart, and compile aggregate statistical analytics.
          </p>
          <p>
            By using our marketplace website, you consent to the use of cookies in accordance with this Cookie Policy. You can adjust your consent settings below at any time without impacting your core browsing experience.
          </p>
        </div>

        {/* Preference Center */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-600" />
              Manage Tracking & Cookie Preferences
            </h2>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {saved ? "Preferences Saved!" : "Save Preferences"}
            </button>
          </div>

          <div className="space-y-4">
            {/* Strictly Necessary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Strictly Necessary Cookies</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    Always Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Essential for basic website operations, session authentication, CSRF security tokens, and preserving your checkout cart state. These cannot be disabled.
                </p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="mt-1 h-4 w-4 rounded text-purple-600 accent-purple-600 cursor-not-allowed"
              />
            </div>

            {/* Functional */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Functional & Preferences</h3>
                <p className="text-[11px] text-slate-500">
                  Remember your currency selections, dark/light theme choice, regional locale, and preferred preview view modes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                className="mt-1 h-4 w-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Performance */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Performance & Analytics</h3>
                <p className="text-[11px] text-slate-500">
                  Allow us to aggregate anonymous visitor flows, bounce rates, and load performance to identify and resolve software bottlenecks.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.performance}
                onChange={(e) => setPreferences({ ...preferences, performance: e.target.checked })}
                className="mt-1 h-4 w-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Marketing */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Marketing & Attribution</h3>
                <p className="text-[11px] text-slate-500">
                  Used by our affiliate partners to attribute referral sales and optimize targeted design discovery campaigns.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                className="mt-1 h-4 w-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Legal Links Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:text-purple-600 underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-purple-600 underline">Terms of Service</Link>
          <Link href="/accessibility" className="hover:text-purple-600 underline">Accessibility Statement</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
