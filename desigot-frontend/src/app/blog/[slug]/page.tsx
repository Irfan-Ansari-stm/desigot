"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { Clock, Eye, ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";

export default function PublicSingleBlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await api.get(`/public/cms/blog/posts/${slug}`);
        if (res.data?.data) {
          setPost(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load blog post:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-between">
        <Navbar />
        <div className="py-24 text-center text-xs text-slate-400">Loading article...</div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-between">
        <Navbar />
        <div className="py-24 text-center space-y-4">
          <h2 className="text-xl font-bold">Article Not Found</h2>
          <Link href="/blog" className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold inline-block">
            Back to Editorial Insights
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
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Editorial Articles
        </Link>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
              {post.category_name || "Insight"}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.reading_time_mins} min read
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.views_count?.toLocaleString()} reads
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
              {post.author_first_name?.[0] || "D"}
            </div>
            <div>
              <span className="text-xs font-bold block text-slate-900 dark:text-white">
                {post.author_first_name} {post.author_last_name}
              </span>
              <span className="text-[11px] text-slate-400">
                Published {new Date(post.published_at || post.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {post.featured_image_url && (
          <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 h-96 relative">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <article
          className="prose dark:prose-invert max-w-none text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tagged Topics</span>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((t: any) => (
                <span
                  key={t.id}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  #{t.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
