"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Image,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  Folder,
} from "lucide-react";
import { api } from "@/lib/api";
import { CategoryStatsCards } from "@/components/categories-taxonomy/CategoryStatsCards";
import { CategoryBannerModal } from "@/components/categories-taxonomy/CategoryBannerModal";

interface Banner {
  id: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  name: string;
  desktop_image_url: string;
  alt_text?: string;
  banner_link?: string;
  display_priority: number;
  status: string;
  created_at: string;
}

export default function CategoryBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories/banners");
      if (res.data?.success) {
        let list = res.data.data.banners || [];
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(
            (b: Banner) =>
              b.name?.toLowerCase().includes(q) ||
              b.category_name?.toLowerCase().includes(q)
          );
        }
        setBanners(list);
      }
    } catch (err) {
      console.error("Failed to load banners:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchBanners();
    api.get("/admin/categories?limit=50").then((res) => {
      if (res.data?.success) {
        const cats = res.data.data.categories || [];
        setCategories(cats);
        if (cats.length > 0) setSelectedCatId(cats[0].id);
      }
    }).catch(console.error);
  }, [fetchBanners]);

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category banner?")) return;
    try {
      await api.delete(`/admin/categories/banners/${id}`);
      fetchBanners();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <CategoryStatsCards />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Category Banner Management</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              {banners.length} Campaigns
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Featured landing page hero banners, promotional header graphics, and seasonal campaign creatives
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBanners}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Banners"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Banner</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search banners by campaign title or category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))
        ) : banners.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Image className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-xs">No banners configured</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className="rounded-2xl bg-[#0f172a] border border-slate-800/80 overflow-hidden shadow-xl flex flex-col justify-between"
            >
              <div className="relative h-36 bg-slate-800 overflow-hidden">
                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.desktop_image_url}
                  alt={banner.alt_text || banner.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-purple-300 border border-purple-500/30">
                    Priority #{banner.display_priority}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">{banner.name}</h4>
                    <Link
                      href={`/dashboard/categories-taxonomy/${banner.category_id}`}
                      className="text-xs text-purple-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Folder className="w-3 h-3" />
                      <span>{banner.category_name || "Assigned Category"}</span>
                    </Link>
                  </div>

                  <button
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {banner.banner_link && (
                  <a
                    href={banner.banner_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-white truncate block flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{banner.banner_link}</span>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && selectedCatId && (
        <CategoryBannerModal
          isOpen={isModalOpen}
          categoryId={selectedCatId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => fetchBanners()}
        />
      )}
    </div>
  );
}
