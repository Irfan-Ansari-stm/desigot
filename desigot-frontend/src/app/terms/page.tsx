"use client";
import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { ShieldCheck } from "lucide-react";

export default function PublicTermsPage() {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTerms() {
      try {
        const res = await api.get("/public/cms/legal/terms");
        if (res.data?.data) setDoc(res.data.data);
      } catch (err) {
        console.error("Failed to load terms:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTerms();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-8 flex-1">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
              Version {doc?.version || "2.0.0"}
            </span>
            <span className="text-xs text-slate-400">
              Effective: {doc?.effective_date ? new Date(doc.effective_date).toLocaleDateString() : "Active"}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            {doc?.title || "Terms of Service & Marketplace Agreement"}
          </h1>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading legal terms...</div>
        ) : (
          <div
            className="prose dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: doc?.content_html || "<p>Terms content loading...</p>" }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
