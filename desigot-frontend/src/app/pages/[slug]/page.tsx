"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PublicStaticPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [page, setPage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPage() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await api.get(`/public/cms/pages/${slug}`);
        if (res.data?.data) {
          setPage(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load page:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-between">
        <Navbar />
        <div className="py-24 text-center text-xs text-slate-400">Loading page...</div>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-between">
        <Navbar />
        <div className="py-24 text-center space-y-4">
          <h2 className="text-xl font-bold">Page Not Found</h2>
          <p className="text-xs text-slate-500">The requested content page does not exist or has been archived.</p>
          <Link href="/" className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold inline-block">
            Back to Marketplace
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 flex-1">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-3">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {page.title}
          </h1>
          {page.description && (
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {page.description}
            </p>
          )}
        </div>

        {page.featured_image_url && (
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 h-80 relative">
            <img
              src={page.featured_image_url}
              alt={page.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div
          className="prose dark:prose-invert max-w-none text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: page.content_html || "" }}
        />
      </main>

      <Footer />
    </div>
  );
}
