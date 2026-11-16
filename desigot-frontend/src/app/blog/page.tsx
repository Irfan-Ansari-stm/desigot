"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { BookOpen, Eye, Clock, ArrowRight, Tag } from "lucide-react";

export default function PublicBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlog() {
      setLoading(true);
      try {
        const res = await api.get("/public/cms/blog/posts", {
          params: { category_id: selectedCat || undefined }
        });
        if (res.data?.data) setPosts(res.data.data);

        const catRes = await api.get("/public/cms/blog/categories");
        if (catRes.data?.data) setCategories(catRes.data.data);
      } catch (err) {
        console.error("Failed to load blog:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBlog();
  }, [selectedCat]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-12 flex-1">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
            <BookOpen className="w-3.5 h-3.5 text-purple-600" />
            Design & Engineering Insights
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">The Desigot Editorial</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Deep dives into Figma token architecture, accessibility guidelines, product sprints, and creator economics.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              !selectedCat
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
            }`}
          >
            All Disciplines
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCat === c.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading articles...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="relative h-48 bg-slate-800 overflow-hidden">
                  <img
                    src={post.featured_image_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white">
                      {post.category_name || "Insight"}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.reading_time_mins} min read
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views_count?.toLocaleString()} reads
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600">
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
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
