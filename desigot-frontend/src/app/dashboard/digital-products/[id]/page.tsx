"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Image as ImageIcon,
  FileText,
  Upload,
  DollarSign,
  ShieldCheck,
  GitBranch,
  ShoppingBag,
  Download,
  Star,
  BarChart3,
  History,
  Activity,
  CheckCircle2,
  XCircle,
  Copy,
  Sparkles,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Ban,
  Clock,
  Key,
} from "lucide-react";
import { apiGet, apiPost, apiDelete, apiPut } from "@/lib/api";
import { DigitalProductStatusBadge } from "@/components/digital-products/DigitalProductStatusBadge";

const TABS = [
  { id: "overview", name: "1. Overview", icon: Layers },
  { id: "basic", name: "2. Basic Info", icon: FileText },
  { id: "media", name: "3. Media & Previews", icon: ImageIcon },
  { id: "description", name: "4. Description", icon: FileText },
  { id: "files", name: "5. Files & Vault", icon: Upload },
  { id: "pricing", name: "6. Pricing & Tiers", icon: DollarSign },
  { id: "licenses", name: "7. Licenses", icon: ShieldCheck },
  { id: "versions", name: "8. Versions", icon: GitBranch },
  { id: "sales", name: "9. Sales & Orders", icon: ShoppingBag },
  { id: "downloads", name: "10. Downloads", icon: Download },
  { id: "reviews", name: "11. Reviews", icon: Star },
  { id: "analytics", name: "12. Analytics", icon: BarChart3 },
  { id: "moderation", name: "13. Moderation", icon: History },
  { id: "timeline", name: "14. Timeline", icon: Activity },
];

export default function DigitalProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [product, setProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editShortDesc, setEditShortDesc] = useState("");
  const [editPricePersonal, setEditPricePersonal] = useState(0);
  const [editPriceCommercial, setEditPriceCommercial] = useState(0);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>(`/admin/digital-products/${id}`);
      const data = res?.data || res;
      setProduct(data);
      setEditTitle(data.title || "");
      setEditShortDesc(data.short_description || "");
      setEditPricePersonal(data.price_personal_cents ? data.price_personal_cents / 100 : 0);
      setEditPriceCommercial(data.price_commercial_cents ? data.price_commercial_cents / 100 : 0);
    } catch (err) {
      console.error("Failed to load product detail:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleApprove = async () => {
    if (!confirm("Approve this product for public release?")) return;
    setIsProcessing(true);
    try {
      await apiPost(`/admin/digital-products/${id}/approve`, { notes: "Approved from master product overview" });
      loadProduct();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve product");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFeatured = async () => {
    setIsProcessing(true);
    try {
      await apiPost(`/admin/digital-products/${id}/feature`, {
        is_featured: !product?.is_featured,
        position: !product?.is_featured ? 1 : 0,
        featured_type: "staff_pick",
      });
      loadProduct();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to toggle featured status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdits = async () => {
    setIsProcessing(true);
    try {
      await apiPut(`/admin/digital-products/${id}`, {
        title: editTitle,
        short_description: editShortDesc,
        price_personal_cents: Math.round(editPricePersonal * 100),
        price_commercial_cents: Math.round(editPriceCommercial * 100),
      });
      setIsEditing(false);
      loadProduct();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update product");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="h-64 bg-slate-800/40 rounded-2xl w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p className="mb-4">Digital product not found.</p>
        <Link href="/dashboard/digital-products/all" className="text-indigo-400 hover:underline">
          Return to Product Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/digital-products/all"
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">{product.title}</h1>
              <DigitalProductStatusBadge status={product.status} isFeatured={product.is_featured} />
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Category: <strong className="text-white">{product.category_name || "UI Kit"}</strong></span>
              <span>•</span>
              <span>Seller: <strong className="text-white">{product.seller_name || "Official"}</strong></span>
              <span>•</span>
              <span className="font-mono">v{product.version}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadProduct}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Product"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          <button
            onClick={handleToggleFeatured}
            disabled={isProcessing}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              product.is_featured
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {product.is_featured ? "Featured Spotlight" : "Feature Asset"}
          </button>

          {product.status !== "published" && (
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve & Publish
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
          >
            <Edit2 className="w-3.5 h-3.5" />
            {isEditing ? "Cancel Edit" : "Quick Edit"}
          </button>
        </div>
      </div>

      {/* Quick Edit Panel */}
      {isEditing && (
        <div className="p-6 rounded-2xl bg-[#0e1726] border border-indigo-500/40 shadow-xl space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Product Core Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Product Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-[#121c2d] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Short Description</label>
              <input
                type="text"
                value={editShortDesc}
                onChange={(e) => setEditShortDesc(e.target.value)}
                className="w-full bg-[#121c2d] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Personal License Price ($)</label>
              <input
                type="number"
                value={editPricePersonal}
                onChange={(e) => setEditPricePersonal(Number(e.target.value))}
                className="w-full bg-[#121c2d] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Commercial License Price ($)</label>
              <input
                type="number"
                value={editPriceCommercial}
                onChange={(e) => setEditPriceCommercial(Number(e.target.value))}
                className="w-full bg-[#121c2d] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdits}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* 14 Tabs Navigation Strip */}
      <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-1.5 shadow-xl overflow-x-auto">
        <div className="flex items-center gap-1 min-w-[950px]">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display Area */}
      <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[480px]">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#121c2d] border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-1">Gross Revenue</span>
                <p className="text-2xl font-bold text-emerald-400 font-mono">
                  ${((product.total_revenue_cents || 0) / 100).toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-500">From {product.total_sales || 0} sales</span>
              </div>
              <div className="p-4 rounded-xl bg-[#121c2d] border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-1">Total Downloads</span>
                <p className="text-2xl font-bold text-indigo-400 font-mono">
                  {(product.total_downloads || 0).toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-500">Authorized package downloads</span>
              </div>
              <div className="p-4 rounded-xl bg-[#121c2d] border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-1">Catalog Views</span>
                <p className="text-2xl font-bold text-white font-mono">
                  {(product.view_count || 0).toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-500">Unique store visits</span>
              </div>
              <div className="p-4 rounded-xl bg-[#121c2d] border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-1">Customer Rating</span>
                <p className="text-2xl font-bold text-amber-400 flex items-center gap-1 font-mono">
                  <Star className="w-5 h-5 fill-amber-400" />
                  {Number(product.avg_rating || 5.0).toFixed(1)}
                </p>
                <span className="text-[11px] text-slate-500">Based on {product.review_count || 0} reviews</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Asset Highlights</h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>

                {product.included_assets?.length > 0 && (
                  <div className="pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Package Contents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                      {product.included_assets.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Visual Cover</h3>
                <div className="w-full h-48 rounded-2xl bg-slate-800 overflow-hidden border border-slate-700">
                  {product.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[#121c2d] border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Personal License:</span>
                    <span className="font-mono font-bold text-emerald-400">${(product.price_personal_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Commercial License:</span>
                    <span className="font-mono font-bold text-indigo-400">${(product.price_commercial_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Software:</span>
                    <span className="font-medium text-white">{product.software_compatibility?.join(", ") || "Figma"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Files:</span>
                    <span className="font-medium text-white">{product.files?.length || 0} deliverable(s)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BASIC INFO */}
        {activeTab === "basic" && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Core Registry Attributes</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-[#121c2d] border border-slate-800 flex justify-between">
                <span className="text-slate-400">Canonical Slug:</span>
                <span className="font-mono text-indigo-300">/products/{product.slug}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121c2d] border border-slate-800 flex justify-between">
                <span className="text-slate-400">Unique UUID:</span>
                <span className="font-mono text-slate-300">{product.id}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121c2d] border border-slate-800 flex justify-between">
                <span className="text-slate-400">Seller Entity:</span>
                <span className="text-white font-medium">{product.seller_name} ({product.seller_email})</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121c2d] border border-slate-800 flex justify-between">
                <span className="text-slate-400">Taxonomy Category:</span>
                <span className="text-white font-medium">{product.category_name}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121c2d] border border-slate-800 flex justify-between">
                <span className="text-slate-400">Created Timestamp:</span>
                <span className="text-white font-mono">{new Date(product.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA & PREVIEWS */}
        {activeTab === "media" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Gallery Showcase & Previews</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.preview_images?.map((url: string, i: number) => (
                <div key={i} className="rounded-xl overflow-hidden border border-slate-700 bg-slate-800 h-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {product.demo_url && (
              <div className="p-4 rounded-xl bg-[#121c2d] border border-slate-800 flex items-center justify-between text-sm">
                <span className="text-slate-400">Live Interactive Demo URL:</span>
                <a href={product.demo_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                  {product.demo_url} <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DESCRIPTION */}
        {activeTab === "description" && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Detailed Specification</h3>
            <div className="p-6 rounded-2xl bg-[#121c2d] border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {product.description}
            </div>
          </div>
        )}

        {/* TAB 5: FILES & VAULT */}
        {activeTab === "files" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Distribution Archive Vault</h3>
            <div className="space-y-3">
              {product.files?.map((f: any) => (
                <div key={f.id} className="p-4 rounded-xl bg-[#121c2d] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-xs uppercase flex items-center justify-center font-mono">
                      {f.file_format}
                    </div>
                    <div>
                      <span className="font-semibold text-white block text-sm">{f.file_name}</span>
                      <span className="text-xs text-slate-400">
                        {(f.file_size_bytes / 1024 / 1024).toFixed(2)} MB • {f.download_count} downloads • SHA-256 verified
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Clean (Virus Scan Passed)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PRICING & TIERS */}
        {activeTab === "pricing" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Standard Pricing Matrix</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#121c2d] border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-1">Personal Tier</span>
                <p className="text-2xl font-bold text-white font-mono">${(product.price_personal_cents / 100).toFixed(2)}</p>
                <span className="text-xs text-slate-500">1 non-commercial product</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#121c2d] border border-indigo-500/30">
                <span className="text-xs font-semibold text-indigo-400 block mb-1">Commercial Tier</span>
                <p className="text-2xl font-bold text-indigo-400 font-mono">${(product.price_commercial_cents / 100).toFixed(2)}</p>
                <span className="text-xs text-slate-500">Single commercial deliverable</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#121c2d] border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-1">Extended Commercial</span>
                <p className="text-2xl font-bold text-white font-mono">${(product.price_extended_cents / 100).toFixed(2)}</p>
                <span className="text-xs text-slate-500">Unlimited SaaS products</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#121c2d] border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-1">Enterprise Unlimited</span>
                <p className="text-2xl font-bold text-amber-400 font-mono">${(product.price_enterprise_cents / 100).toFixed(2)}</p>
                <span className="text-xs text-slate-500">Organizational rights & SLA</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: LICENSES */}
        {activeTab === "licenses" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">License Terms Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.licenses?.map((lic: any) => (
                <div key={lic.id} className="p-4 rounded-xl bg-[#121c2d] border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-white text-sm">{lic.license_name}</span>
                    <span className="font-mono text-xs font-bold text-emerald-400">${((lic.custom_price_cents || 0) / 100).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{lic.terms_summary}</p>
                  <span className="text-[11px] text-slate-500 font-mono">Multiplier: {lic.price_multiplier}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: VERSIONS */}
        {activeTab === "versions" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Release History & SemVer</h3>
            <div className="space-y-3">
              {product.versions?.map((v: any) => (
                <div key={v.id} className="p-4 rounded-xl bg-[#121c2d] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-white text-sm">v{v.version_string}</span>
                    {v.is_current && (
                      <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                        Current
                      </span>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{v.release_notes}</p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(v.released_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: SALES & ORDERS */}
        {activeTab === "sales" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Purchase History</h3>
            <div className="p-8 rounded-xl bg-[#121c2d] border border-slate-800 text-center">
              <ShoppingBag className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Total Completed Sales: {product.total_sales}</p>
              <p className="text-xs text-slate-400 mt-1">Accumulated Gross Revenue: ${((product.total_revenue_cents || 0) / 100).toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* TAB 10: DOWNLOADS */}
        {activeTab === "downloads" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Recent Download Access Telemetry</h3>
            <div className="space-y-2">
              {product.recent_downloads?.map((d: any) => (
                <div key={d.id} className="p-3 rounded-xl bg-[#121c2d] border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-slate-300">IP: {d.ip_address}</span>
                    <span className="text-slate-500 ml-2">v{d.file_version}</span>
                  </div>
                  <span className="text-slate-400 font-mono">{new Date(d.downloaded_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 11: REVIEWS */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Customer Feedback & Ratings</h3>
            <div className="p-6 rounded-xl bg-[#121c2d] border border-slate-800 flex items-center gap-6">
              <div className="text-center">
                <span className="text-4xl font-extrabold text-white font-mono">{Number(product.avg_rating || 5.0).toFixed(1)}</span>
                <div className="flex items-center gap-1 justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">{product.review_count} verified reviews</span>
              </div>
              <div className="flex-1 text-xs text-slate-400 border-l border-slate-800 pl-6">
                All buyer ratings verified through digital download confirmation receipts.
              </div>
            </div>
          </div>
        )}

        {/* TAB 12: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Conversion & Performance Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#121c2d] border border-slate-800">
                <span className="text-slate-400 block mb-1">Conversion Rate (Sales / Views)</span>
                <span className="text-xl font-bold text-white font-mono">
                  {product.view_count > 0 ? ((product.total_sales / product.view_count) * 100).toFixed(2) : "0.00"}%
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#121c2d] border border-slate-800">
                <span className="text-slate-400 block mb-1">Download Efficiency</span>
                <span className="text-xl font-bold text-white font-mono">
                  {product.total_sales > 0 ? (product.total_downloads / product.total_sales).toFixed(1) : "0.0"} per buyer
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#121c2d] border border-slate-800">
                <span className="text-slate-400 block mb-1">Revenue Per Visit (RPV)</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  ${product.view_count > 0 ? ((product.total_revenue_cents / 100) / product.view_count).toFixed(2) : "0.00"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 13: MODERATION */}
        {activeTab === "moderation" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Curator Moderation Audit Trail</h3>
            <div className="space-y-3">
              {product.moderation_history?.map((mh: any) => (
                <div key={mh.id} className="p-4 rounded-xl bg-[#121c2d] border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white uppercase tracking-wider text-[11px] bg-slate-800 px-2 py-0.5 rounded">
                      {mh.action}
                    </span>
                    <p className="text-slate-300 mt-1">{mh.notes || "No curator notes recorded."}</p>
                    <span className="text-slate-500 text-[10px]">By {mh.moderator_name || "Super Admin"}</span>
                  </div>
                  <span className="text-slate-400 font-mono">{new Date(mh.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 14: TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">System Lifecycle Timeline</h3>
            <div className="space-y-3 border-l-2 border-slate-800 pl-4 text-xs">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-bold text-white block">Product Ingestion Completed</span>
                <span className="text-slate-400 font-mono">{new Date(product.created_at).toLocaleString()}</span>
              </div>
              {product.published_at && (
                <div className="relative pt-3">
                  <div className="absolute -left-[21px] top-4 w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <span className="font-bold text-white block">Published to Global Marketplace</span>
                  <span className="text-slate-400 font-mono">{new Date(product.published_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
