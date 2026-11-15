"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderTree,
  ChevronRight,
  Layers,
  Briefcase,
  Package,
  Sliders,
  Image as ImageIcon,
  Globe,
  History,
  ArrowLeft,
  Plus,
  Edit,
  ExternalLink,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Trash2,
  AlertCircle,
  Tag,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { CategoryStatusBadge } from "@/components/categories-taxonomy/CategoryStatusBadge";
import { CategoryAttributeModal } from "@/components/categories-taxonomy/CategoryAttributeModal";
import { CategoryBannerModal } from "@/components/categories-taxonomy/CategoryBannerModal";

type ActiveTab =
  | "overview"
  | "children"
  | "services"
  | "products"
  | "attributes"
  | "banners"
  | "seo"
  | "history";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const fetchCategoryDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<any>(`/admin/categories-taxonomy/${categoryId}`);
      const payload = res?.data?.data || res?.data;
      if (payload && payload.category) {
        setData(payload);
      } else {
        setError("Category not found or invalid response");
      }
    } catch (err: any) {
      console.error("Failed to load category details:", err);
      setError(err?.message || "Could not retrieve category details");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    if (categoryId) {
      fetchCategoryDetails();
    }
  }, [categoryId, fetchCategoryDetails]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Hydrating category workspace & taxonomy relations...</p>
      </div>
    );
  }

  if (error || !data || !data.category) {
    return (
      <div className="p-8 max-w-2xl mx-auto rounded-3xl bg-[#0f172a] border border-red-500/20 text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Category Not Found</h2>
        <p className="text-xs text-slate-400">{error || "Unable to locate the requested category."}</p>
        <Link
          href="/dashboard/categories-taxonomy/all"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Categories Directory
        </Link>
      </div>
    );
  }

  const { category, breadcrumbs = [], children = [], services = [], products = [], attributes = [], banners = [], redirects = [], history = [] } = data;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Breadcrumb Path */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
            <Link
              href="/dashboard/categories-taxonomy/all"
              className="hover:text-purple-400 transition-colors flex items-center gap-1"
            >
              <FolderTree className="w-3.5 h-3.5" />
              Taxonomy
            </Link>
            {breadcrumbs.map((bc: any, idx: number) => (
              <React.Fragment key={bc.id}>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-white font-medium">{bc.name}</span>
                ) : (
                  <Link
                    href={`/dashboard/categories-taxonomy/${bc.id}`}
                    className="hover:text-purple-400 transition-colors"
                  >
                    {bc.name}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchCategoryDetails}
              className="p-2 rounded-xl bg-[#0f172a] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              href={`/dashboard/categories-taxonomy/create?parentId=${category.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f172a] border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              Add Child Node
            </Link>
            <Link
              href={`/category/${category.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f172a] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              Marketplace
            </Link>
          </div>
        </div>

        {/* Hero Card */}
        <div className="p-6 rounded-3xl bg-[#0b101b] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-lg shadow-purple-600/10">
              <FolderTree className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{category.name}</h1>
                <CategoryStatusBadge status={category.status} />
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                  Depth {category.depth}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300 capitalize">
                  {category.category_type} Type
                </span>
                {category.is_featured && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Featured
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                {category.short_description || category.description || "No public summary provided for this taxonomy node."}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span>Slug: <code className="text-purple-300 font-mono">/{category.slug}</code></span>
                <span>Display Order: <strong className="text-slate-300">{category.display_order ?? 0}</strong></span>
                {category.parent_name && (
                  <span>Parent: <strong className="text-slate-300">{category.parent_name}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div className="px-3.5 py-2.5 rounded-2xl bg-[#0f172a] border border-slate-800 text-center min-w-[70px]">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Children</span>
              <span className="text-base font-bold text-white">{children.length}</span>
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl bg-[#0f172a] border border-slate-800 text-center min-w-[70px]">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Services</span>
              <span className="text-base font-bold text-purple-400">{services.length}</span>
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl bg-[#0f172a] border border-slate-800 text-center min-w-[70px]">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Products</span>
              <span className="text-base font-bold text-emerald-400">{products.length}</span>
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl bg-[#0f172a] border border-slate-800 text-center min-w-[70px]">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Attrs</span>
              <span className="text-base font-bold text-amber-400">{attributes.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
        {[
          { id: "overview", label: "Overview & Info", icon: FolderTree, count: null },
          { id: "children", label: "Subcategories", icon: Layers, count: children.length },
          { id: "services", label: "Assigned Services", icon: Briefcase, count: services.length },
          { id: "products", label: "Assigned Products", icon: Package, count: products.length },
          { id: "attributes", label: "Dynamic Attributes", icon: Sliders, count: attributes.length },
          { id: "banners", label: "Media & Banners", icon: ImageIcon, count: banners.length },
          { id: "seo", label: "SEO & Redirects", icon: Globe, count: redirects.length ? `${redirects.length} 301s` : null },
          { id: "history", label: "Audit Timeline", icon: History, count: history.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                  : "bg-[#0f172a]/60 text-slate-400 hover:text-white hover:bg-[#0f172a] border border-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Meta & Descriptions */}
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-purple-400" />
                Category Summary & Metadata
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">
                    Full Description
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    {category.description || "No full description provided."}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] text-slate-500 uppercase font-bold">Category Icon Identifier</span>
                    <p className="text-xs text-purple-300 font-mono">{category.icon_name || "default-folder"}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] text-slate-500 uppercase font-bold">Visibility Scope</span>
                    <p className="text-xs text-slate-200 capitalize">{category.visibility || "public"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Display Controls */}
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Display & Navigation Directives
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Show on Homepage</span>
                  {category.show_on_homepage ? (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">No</span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Show in Nav Menu</span>
                  {category.show_in_navigation ? (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">No</span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Marketplace Filter</span>
                  {category.show_in_marketplace ? (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">No</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Taxonomy Info & Ownership */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                Taxonomy Details
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">UUID:</span>
                  <span className="text-slate-300 font-mono text-[11px] truncate max-w-[170px]" title={category.id}>
                    {category.id}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Created At:</span>
                  <span className="text-slate-300 font-medium">
                    {category.created_at ? new Date(category.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Created By:</span>
                  <span className="text-slate-300 font-medium">{category.creator_name || "System Admin"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Canonical Path:</span>
                  <span className="text-purple-400 font-mono text-[11px]">/category/{category.slug}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Published Status:</span>
                  <span className="text-emerald-400 font-semibold">{category.status}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900/20 to-slate-900/60 border border-purple-500/20 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Management Actions</h4>
              <p className="text-xs text-slate-400">
                Configure taxonomy rules, assign dynamic attributes, or upload visual marketing banners.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setIsAttrModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5" /> Add Category Attribute
                </button>
                <button
                  onClick={() => setIsBannerModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> Upload Category Banner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBCATEGORIES */}
      {activeTab === "children" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Direct Subcategories</h3>
              <p className="text-xs text-slate-400">Child nodes nested directly underneath {category.name}</p>
            </div>
            <Link
              href={`/dashboard/categories-taxonomy/create?parentId=${category.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subcategory
            </Link>
          </div>

          {children.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-2">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No child categories nested under this node.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Subcategory Name</th>
                    <th className="py-3 px-4 font-semibold">Slug</th>
                    <th className="py-3 px-4 font-semibold">Order</th>
                    <th className="py-3 px-4 font-semibold">Services</th>
                    <th className="py-3 px-4 font-semibold">Products</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {children.map((ch: any) => (
                    <tr key={ch.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <Link
                          href={`/dashboard/categories-taxonomy/${ch.id}`}
                          className="hover:text-purple-400 transition-colors flex items-center gap-2"
                        >
                          <FolderTree className="w-3.5 h-3.5 text-purple-400" />
                          {ch.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-300 text-[11px]">/{ch.slug}</td>
                      <td className="py-3 px-4 text-slate-400">{ch.display_order ?? 0}</td>
                      <td className="py-3 px-4 text-purple-400 font-semibold">{ch.service_count || 0}</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">{ch.product_count || 0}</td>
                      <td className="py-3 px-4">
                        <CategoryStatusBadge status={ch.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/dashboard/categories-taxonomy/${ch.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-all"
                        >
                          Workspace
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSIGNED SERVICES */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Assigned Marketplace Services</h3>
              <p className="text-xs text-slate-400">Design services currently classified under {category.name}</p>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-2">
              <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No active services assigned to this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Service Title</th>
                    <th className="py-3 px-4 font-semibold">Seller</th>
                    <th className="py-3 px-4 font-semibold">Starting Price</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {services.map((srv: any) => (
                    <tr key={srv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-white max-w-xs truncate">{srv.title}</td>
                      <td className="py-3 px-4 text-slate-300">{srv.seller_name || "Marketplace Seller"}</td>
                      <td className="py-3 px-4 text-purple-400 font-semibold font-mono">
                        ${((srv.starting_price_cents || 0) / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 capitalize">
                          {srv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {srv.created_at ? new Date(srv.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ASSIGNED PRODUCTS */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Assigned Digital Products</h3>
              <p className="text-xs text-slate-400">Digital design assets classified under {category.name}</p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No digital products assigned to this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product Title</th>
                    <th className="py-3 px-4 font-semibold">Seller</th>
                    <th className="py-3 px-4 font-semibold">Price</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map((prod: any) => (
                    <tr key={prod.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-white max-w-xs truncate">{prod.title}</td>
                      <td className="py-3 px-4 text-slate-300">{prod.seller_name || "Creator"}</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold font-mono">
                        ${((prod.price_cents || 0) / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 capitalize">
                          {prod.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {prod.created_at ? new Date(prod.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ATTRIBUTES */}
      {activeTab === "attributes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Dynamic Category Attributes</h3>
              <p className="text-xs text-slate-400">Custom filters, selectors, and specifications for items in this category</p>
            </div>
            <button
              onClick={() => setIsAttrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Attribute
            </button>
          </div>

          {attributes.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-2">
              <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No dynamic attributes configured for this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attributes.map((attr: any) => (
                <div key={attr.id} className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{attr.name}</h4>
                      <code className="text-[11px] text-purple-300 font-mono">{attr.key}</code>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
                      {attr.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {attr.is_required && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-red-500/10 text-red-400 font-medium">
                        Required
                      </span>
                    )}
                    {attr.is_filterable && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-blue-500/10 text-blue-400 font-medium">
                        Filterable
                      </span>
                    )}
                    {attr.is_searchable && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-500/10 text-emerald-400 font-medium">
                        Searchable
                      </span>
                    )}
                  </div>

                  {attr.options && Array.isArray(attr.options) && attr.options.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Preset Options ({attr.options.length})
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {attr.options.map((opt: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                          >
                            {opt.label || opt.value || opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: BANNERS & MEDIA */}
      {activeTab === "banners" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Visual Banners & Creatives</h3>
              <p className="text-xs text-slate-400">Header visual assets configured for {category.name}</p>
            </div>
            <button
              onClick={() => setIsBannerModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload Banner
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No marketing banners assigned to this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((bn: any) => (
                <div key={bn.id} className="rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden space-y-3 p-4">
                  <div className="h-32 w-full rounded-xl bg-slate-900 overflow-hidden relative border border-slate-800/80">
                    <img
                      src={bn.desktop_image_url}
                      alt={bn.alt_text || bn.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{bn.name}</h4>
                      <p className="text-[11px] text-slate-400">{bn.alt_text || "No alt text"}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-purple-300 font-semibold">
                      Priority: {bn.display_priority ?? 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: SEO & REDIRECTS */}
      {activeTab === "seo" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SEO Directives */}
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              Search Engine Directives & Tags
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block mb-1">Meta Title</span>
                <p className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                  {category.meta_title || `${category.name} | Desigot Marketplace`}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block mb-1">Meta Description</span>
                <p className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  {category.meta_description || "Explore curated UI/UX design deliverables, templates, and sprint services on Desigot."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Robot Index</span>
                  <span className="text-xs font-semibold text-emerald-400 capitalize">{category.index_status || "index"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Robot Follow</span>
                  <span className="text-xs font-semibold text-emerald-400 capitalize">{category.follow_status || "follow"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 301 Redirects Table */}
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              Active 301 Permanent Redirects
            </h3>
            {redirects.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No inbound 301 redirects mapped to this category.</p>
            ) : (
              <div className="space-y-2">
                {redirects.map((rd: any) => (
                  <div key={rd.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">{rd.source_path}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-purple-300 font-mono font-medium">{rd.destination_path}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT TIMELINE */}
      {activeTab === "history" && (
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              Category Event & Audit Log
            </h3>
            <span className="text-xs text-slate-400">{history.length} Events Logged</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No audit trail recorded for this category.</p>
          ) : (
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
              {history.map((ev: any) => (
                <div key={ev.id} className="relative flex items-start gap-3 pl-7">
                  <div className="absolute left-2 w-3.5 h-3.5 rounded-full bg-purple-600 border-2 border-[#0f172a] top-1" />
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs w-full space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-white capitalize">{ev.action}</span>
                      <span className="text-[10px] text-slate-500">
                        {ev.created_at ? new Date(ev.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      By <strong className="text-slate-300">{ev.actor_name || "Super Admin"}</strong>
                    </p>
                    {ev.meta && (
                      <pre className="p-2 rounded bg-[#0b101b] text-[10px] text-slate-400 overflow-x-auto">
                        {typeof ev.meta === "object" ? JSON.stringify(ev.meta) : ev.meta}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CategoryAttributeModal
        isOpen={isAttrModalOpen}
        categoryId={category.id}
        categoryName={category.name}
        onClose={() => setIsAttrModalOpen(false)}
        onSuccess={() => {
          setIsAttrModalOpen(false);
          fetchCategoryDetails();
        }}
      />

      <CategoryBannerModal
        isOpen={isBannerModalOpen}
        categoryId={category.id}
        categoryName={category.name}
        onClose={() => setIsBannerModalOpen(false)}
        onSuccess={() => {
          setIsBannerModalOpen(false);
          fetchCategoryDetails();
        }}
      />
    </div>
  );
}
