"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Globe,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  depth: number;
}

interface Props {
  initialData?: any;
  isEdit?: boolean;
}

export function CategoryForm({ initialData, isEdit = false }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [categoryType, setCategoryType] = useState(initialData?.category_type || "shared");
  const [parentId, setParentId] = useState(initialData?.parent_id || "");
  const [status, setStatus] = useState(initialData?.status || "published");
  const [visibility, setVisibility] = useState(initialData?.visibility || "public");
  const [iconName, setIconName] = useState(initialData?.icon_name || "Folder");
  const [displayOrder, setDisplayOrder] = useState<number>(initialData?.display_order || 1);
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.is_featured || false);
  const [showOnHomepage, setShowOnHomepage] = useState<boolean>(initialData?.show_on_homepage ?? true);
  const [showInNavigation, setShowInNavigation] = useState<boolean>(initialData?.show_in_navigation ?? true);
  const [showInMarketplace, setShowInMarketplace] = useState<boolean>(initialData?.show_in_marketplace ?? true);

  // SEO fields
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonical_url || "");
  const [ogTitle, setOgTitle] = useState(initialData?.og_title || "");
  const [ogDescription, setOgDescription] = useState(initialData?.og_description || "");
  const [indexStatus, setIndexStatus] = useState(initialData?.index_status || "index");
  const [followStatus, setFollowStatus] = useState(initialData?.follow_status || "follow");

  // Parent choices list
  const [parentOptions, setParentOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadParents() {
      try {
        const res = await api.get("/admin/categories?limit=200");
        if (res.data?.success) {
          const list: CategoryOption[] = (res.data.data.categories || [])
            .filter((c: any) => !isEdit || c.id !== initialData?.id)
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              depth: c.depth || 0,
            }));
          setParentOptions(list);
        }
      } catch (err) {
        console.error("Failed to load parent categories:", err);
      }
    }
    loadParents();
  }, [isEdit, initialData?.id]);

  // Auto-slugify on name change if not editing
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit && !slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generated);
      setSeoTitle(`${val} | Desigot Marketplace`);
      setCanonicalUrl(`https://desigot.com/categories/${generated}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      short_description: shortDescription.trim() || null,
      description: description.trim() || null,
      category_type: categoryType,
      parent_id: parentId || null,
      status,
      visibility,
      icon_name: iconName || "Folder",
      display_order: displayOrder,
      is_featured: isFeatured,
      show_on_homepage: showOnHomepage,
      show_in_navigation: showInNavigation,
      show_in_marketplace: showInMarketplace,
      seo_title: seoTitle.trim() || `${name} | Desigot Marketplace`,
      meta_description: metaDescription.trim() || shortDescription || null,
      canonical_url: canonicalUrl.trim() || `https://desigot.com/categories/${slug}`,
      og_title: ogTitle.trim() || seoTitle || name,
      og_description: ogDescription.trim() || metaDescription || null,
      index_status: indexStatus,
      follow_status: followStatus,
    };

    try {
      if (isEdit) {
        await api.put(`/admin/categories/${initialData.id}`, payload);
        router.push(`/dashboard/categories-taxonomy/${initialData.id}`);
      } else {
        const res = await api.post("/admin/categories", payload);
        const newId = res.data?.data?.id;
        router.push(`/dashboard/categories-taxonomy/${newId || "all"}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to save category");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      {/* Top action header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/categories-taxonomy/all"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isEdit ? `Edit Category: ${name}` : "Create New Marketplace Category"}
            </h1>
            <p className="text-xs text-slate-400">
              Configure hierarchy depth, dynamic marketplace associations, and SEO metadata
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isEdit ? "Update Category" : "Save & Publish Category"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Category Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Information */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              <span>Category Identity & Hierarchy</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Design Systems & Tokens"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. design-systems-tokens"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Parent Category
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">None (Top-Level Main Category)</option>
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {"— ".repeat(opt.depth)} {opt.name} (/{opt.slug})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Selecting a parent nests this category as a subcategory.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Marketplace Category Type
                </label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="shared">Shared (Both Services & Digital Products)</option>
                  <option value="service">Service Management Only</option>
                  <option value="product">Digital Product Management Only</option>
                  <option value="general">General Marketplace</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Short Description (Listing Cards)
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief one-line overview of this category..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Description (Category Landing Page)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed scope, design requirements, and marketplace guidelines..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Card 2: SEO Settings */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Search Engine Optimization & Open Graph</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="e.g. Design Systems & Tokens | Desigot UI/UX Marketplace"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Meta Description
                </label>
                <textarea
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Recommended 150-160 characters for high click-through in search results..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Indexing Directive
                  </label>
                  <select
                    value={indexStatus}
                    onChange={(e) => setIndexStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value="index">index (Include in search)</option>
                    <option value="noindex">noindex (Hide from search engines)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Link Following
                  </label>
                  <select
                    value={followStatus}
                    onChange={(e) => setFollowStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value="follow">follow (Pass link equity)</option>
                    <option value="nofollow">nofollow (No follow)</option>
                  </select>
                </div>
              </div>

              {/* Live Google Search Card Preview */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Google Search Preview</span>
                <div className="text-xs text-emerald-400 truncate font-mono">
                  https://desigot.com/categories/{slug || "example-category"}
                </div>
                <div className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                  {seoTitle || name || "Category Title Preview"}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2">
                  {metaDescription || description || "Preview description for search engine result snippets."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Publishing & Visibility Controls */}
        <div className="space-y-6">
          {/* Card: Status & Visibility */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">
              Publishing & Visibility
            </h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              >
                <option value="published">Published (Live)</option>
                <option value="draft">Draft (Work in progress)</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Access Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              >
                <option value="public">Public (Everyone)</option>
                <option value="private">Private (Restricted)</option>
                <option value="internal">Internal (Staff only)</option>
                <option value="hidden">Hidden from navigation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Icon Reference
              </label>
              <input
                type="text"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                placeholder="e.g. Layout, Code, Palette"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                />
                <span>Featured Category (Spotlight)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnHomepage}
                  onChange={(e) => setShowOnHomepage(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                />
                <span>Show on Homepage</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInNavigation}
                  onChange={(e) => setShowInNavigation(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                />
                <span>Show in Global Navigation Menus</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInMarketplace}
                  onChange={(e) => setShowInMarketplace(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                />
                <span>Show in Seller Creation Selectors</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
