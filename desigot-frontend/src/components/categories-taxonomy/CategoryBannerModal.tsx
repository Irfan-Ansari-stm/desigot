"use client";

import React, { useState } from "react";
import { Image, X, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  isOpen: boolean;
  categoryId: string;
  categoryName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryBannerModal({
  isOpen,
  categoryId,
  categoryName,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [desktopImageUrl, setDesktopImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [displayPriority, setDisplayPriority] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !desktopImageUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await api.post("/admin/categories/banners", {
        category_id: categoryId,
        name: name.trim(),
        desktop_image_url: desktopImageUrl.trim(),
        alt_text: altText.trim() || null,
        banner_link: bannerLink.trim() || null,
        display_priority: displayPriority,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create category banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Category Banner</h3>
              <p className="text-xs text-slate-400">{categoryName || "Target Category"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Banner Campaign Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q4 Figma Design Systems Spotlight"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Desktop Image URL (1600x400) *
            </label>
            <input
              type="url"
              required
              value={desktopImageUrl}
              onChange={(e) => setDesktopImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Alt Text (Accessibility)
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Image description..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Display Priority
              </label>
              <input
                type="number"
                min="1"
                value={displayPriority}
                onChange={(e) => setDisplayPriority(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Click-through Target Link
            </label>
            <input
              type="url"
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
              placeholder="https://desigot.com/deals/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !desktopImageUrl.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Banner</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
