"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { Layers, ArrowRight, Sparkles } from "lucide-react";

export default function PublicCategoriesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoriesCMS() {
      try {
        const res = await api.get("/public/cms/categories-page");
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load categories page CMS:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCategoriesCMS();
  }, []);

  const settings = data?.settings || {};
  const categories = data?.categories || [];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-16 space-y-12 flex-1">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            Marketplace Taxonomy
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            {settings.page_title || "Explore Marketplace Taxonomy & Design Assets"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {settings.description || "Browse high-quality digital templates, UI kits, design systems, and creative assets."}
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading categories directory...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/browse?category_id=${cat.id}`}
                className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-800 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition">
                    {cat.name}
                  </h2>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {cat.description || "Explore curated assets and kits in this category."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600">
                  <span>Browse Category</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
