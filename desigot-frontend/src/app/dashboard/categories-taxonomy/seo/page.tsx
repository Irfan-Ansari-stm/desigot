"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Search,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Shield,
  Eye,
  Folder,
} from "lucide-react";
import { api } from "@/lib/api";
import { CategoryStatsCards } from "@/components/categories-taxonomy/CategoryStatsCards";

interface CategorySEO {
  id: string;
  name: string;
  slug: string;
  seo_title?: string;
  meta_description?: string;
  canonical_url?: string;
  index_status?: string;
  follow_status?: string;
}

interface Redirect {
  id: string;
  category_id: string;
  category_name?: string;
  old_slug: string;
  new_slug: string;
  http_status_code: number;
  created_at: string;
}

export default function CategorySEOPage() {
  const [categories, setCategories] = useState<CategorySEO[]>([]);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [tab, setTab] = useState<"metadata" | "redirects">("metadata");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, redirRes] = await Promise.all([
        api.get("/admin/categories?limit=50"),
        api.get("/admin/categories/redirects"),
      ]);

      if (catRes.data?.success) {
        setCategories(catRes.data.data.categories || []);
      }
      if (redirRes.data?.success) {
        setRedirects(redirRes.data.data.redirects || []);
      }
    } catch (err) {
      console.error("Failed to load SEO data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCategories = categories.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.slug?.toLowerCase().includes(search.toLowerCase()) ||
      c.seo_title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <CategoryStatsCards />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Category SEO & URL Redirects</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {categories.length} Indexed Nodes
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Canonical URLs, SERP meta descriptions, indexing robots directives, and automated 301 slug redirect management
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 self-start md:self-auto rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
        </button>
      </div>

      {/* Segment Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0f172a] border border-slate-800 w-fit">
        <button
          onClick={() => setTab("metadata")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            tab === "metadata"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>SEO Metadata ({categories.length})</span>
        </button>

        <button
          onClick={() => setTab("redirects")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            tab === "redirects"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>301 Slug Redirects ({redirects.length})</span>
        </button>
      </div>

      {tab === "metadata" ? (
        <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Category Name & Canonical</th>
                  <th className="py-3.5 px-4">SERP Title</th>
                  <th className="py-3.5 px-4">Meta Description</th>
                  <th className="py-3.5 px-4">Robots Directives</th>
                  <th className="py-3.5 px-4 text-right">Edit SEO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{cat.name}</div>
                      <span className="font-mono text-[11px] text-blue-400 truncate max-w-[200px] block">
                        {cat.canonical_url || `https://desigot.com/categories/${cat.slug}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-300 max-w-[220px] truncate">
                      {cat.seo_title || `${cat.name} | Desigot Marketplace`}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-[260px] truncate">
                      {cat.meta_description || "Dynamic auto-generated marketplace description."}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-emerald-400 border border-slate-700">
                        {cat.index_status || "index"}, {cat.follow_status || "follow"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/categories-taxonomy/${cat.id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-blue-600 transition-colors text-xs font-semibold"
                      >
                        Edit SEO
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Original URL (Old Slug)</th>
                  <th className="py-3.5 px-4">Status Code</th>
                  <th className="py-3.5 px-4">Destination URL (New Slug)</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {redirects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No 301 redirects recorded. Slugs remain at initial configuration.
                    </td>
                  </tr>
                ) : (
                  redirects.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-rose-400">
                        /categories/{r.old_slug}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-emerald-400 font-semibold">
                        {r.http_status_code || 301} Permanent
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-blue-400">
                        /categories/{r.new_slug}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        <Link href={`/dashboard/categories-taxonomy/${r.category_id}`} className="hover:underline">
                          {r.category_name || "Target Category"}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-400 text-right">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
