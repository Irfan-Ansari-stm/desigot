"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Package,
  Plus,
  HelpCircle,
  Sliders,
  Tag,
  User,
  History,
  DollarSign,
  Calendar,
  ShoppingCart,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { ServiceStatusBadge } from "@/components/service-management/ServiceStatusBadge";

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const serviceId = resolvedParams.id;

  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const loadService = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>(`/admin/services/${serviceId}`);
      const sData = data?.service || data?.data || data;
      if (sData) setService(sData);
    } catch (err) {
      console.error("Failed to load service detail:", err);
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  const tabs = [
    { id: "overview", label: "Overview", icon: Briefcase },
    { id: "media", label: "Media & Gallery", icon: ImageIcon },
    { id: "packages", label: "Packages & Tiers", icon: Package },
    { id: "addons", label: "Add-ons", icon: Plus },
    { id: "deliverables", label: "Deliverables & FAQs", icon: HelpCircle },
    { id: "attributes", label: "Attributes & Specs", icon: Sliders },
    { id: "tags", label: "Tags", icon: Tag },
    { id: "seller", label: "Seller & Trust", icon: User },
    { id: "moderation", label: "Moderation Log", icon: History },
    { id: "pricing", label: "Pricing & Split", icon: DollarSign },
    { id: "availability", label: "Availability", icon: Calendar },
    { id: "orders", label: "Orders & Sales", icon: ShoppingCart },
    { id: "reviews", label: "Reviews & Ratings", icon: Star },
    { id: "reports", label: "Reports & Incidents", icon: ShieldAlert },
    { id: "performance", label: "Performance", icon: TrendingUp },
  ];

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-3" />
        <p className="text-base font-medium">Loading comprehensive service records...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-24 text-center text-slate-400">
        <h2 className="text-xl font-bold text-white mb-2">Service Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          The requested service ID does not exist or has been archived.
        </p>
        <Link
          href="/dashboard/service-management/all"
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to All Services
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Detail Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/service-management/all"
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors mt-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{service.title}</h1>
              <ServiceStatusBadge
                status={service.status}
                isFeatured={service.is_featured}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
              <span>ID: {service.id}</span>
              <span>•</span>
              <span>Slug: /{service.slug}</span>
              <span>•</span>
              <span className="text-slate-300">Category: {service.category_name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadService()}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 15 Horizontal Navigation Tabs */}
      <div className="border-b border-slate-800 overflow-x-auto">
        <div className="flex items-center gap-2 pb-2 min-w-max">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-base">Service Summary</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {service.description}
              </p>
            </div>

            <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-base">Target Audience & Language</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold">
                    Target Demographic
                  </span>
                  <span className="font-semibold text-slate-200 mt-1 block">
                    {service.target_audience || "Universal Design Clients"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold">
                    Communication Language
                  </span>
                  <span className="font-semibold text-slate-200 mt-1 block">
                    {service.language || "English"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-base">Commercial Metrics</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Starting Price:</span>
                  <span className="font-bold text-white">${service.starting_price_usd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Completed Orders:</span>
                  <span className="font-bold text-emerald-400">{service.total_orders} sales</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Gross Revenue:</span>
                  <span className="font-bold text-emerald-400">${service.total_revenue_usd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Customer Rating:</span>
                  <span className="font-bold text-amber-400">
                    ★ {parseFloat(service.avg_rating || "5.0").toFixed(1)} ({service.review_count} reviews)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Marketplace Views:</span>
                  <span className="font-bold text-indigo-400">{service.view_count} impressions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MEDIA TAB */}
      {activeTab === "media" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="font-bold text-white text-base">Service Media & Gallery Assets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {service.media?.map((m: any) => (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md"
              >
                <img src={m.file_url} alt={m.caption || "Asset"} className="w-full h-44 object-cover" />
                <div className="p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white capitalize">{m.media_type.replace(/_/g, " ")}</span>
                    {m.is_primary && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                        Primary Hero
                      </span>
                    )}
                  </div>
                  {m.caption && <p className="text-slate-400 text-[11px] mt-1">{m.caption}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PACKAGES TAB */}
      {activeTab === "packages" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {service.packages?.map((pkg: any) => (
            <div
              key={pkg.id}
              className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl flex flex-col justify-between space-y-6 shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300">
                    {pkg.package_type}
                  </span>
                  <span className="text-xl font-bold text-white">${pkg.price_usd}</span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-base">{pkg.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{pkg.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {pkg.delivery_days} days
                  </span>
                  <span>{pkg.revisions} revisions</span>
                </div>

                {pkg.features?.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Included Scope
                    </span>
                    <div className="space-y-1.5">
                      {pkg.features.map((f: any) => (
                        <div key={f.id} className="flex items-center gap-2 text-xs text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{f.feature_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. ADD-ONS TAB */}
      {activeTab === "addons" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Service Add-ons & Optional Extras</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {service.addons?.map((addon: any) => (
              <div
                key={addon.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{addon.name}</h4>
                  <span className="font-bold text-indigo-400 text-sm">${addon.price_usd}</span>
                </div>
                <p className="text-xs text-slate-400">{addon.description}</p>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                  +{addon.delivery_days_added} days turnaround added
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DELIVERABLES TAB */}
      {activeTab === "deliverables" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-emerald-400 text-base">What is Included</h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {service.what_is_included?.map((inc: string, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-rose-400 text-base">What is Excluded</h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {service.what_is_not_included?.map((exc: string, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 6. ATTRIBUTES TAB */}
      {activeTab === "attributes" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Service Technical Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {service.attributes?.map((attr: any) => (
              <div key={attr.value_id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {attr.attribute_name}
                </span>
                <div className="font-semibold text-white text-sm">
                  {attr.option_label || attr.custom_value || "Specified"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAGS TAB */}
      {activeTab === "tags" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Associated Search & Catalog Tags</h3>
          <div className="flex flex-wrap gap-2">
            {service.tags?.map((t: any) => (
              <span
                key={t.id}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300"
              >
                #{t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 8. SELLER TAB */}
      {activeTab === "seller" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden border border-slate-700">
              {service.seller_avatar ? (
                <img src={service.seller_avatar} alt={service.seller_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xl text-white">
                  {service.seller_name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{service.seller_name}</h3>
                {service.seller_verified && (
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <p className="text-xs text-slate-400">{service.seller_email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 block">Rating:</span>
              <span className="font-bold text-amber-400 mt-1 block">★ {service.seller_rating || "5.0"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Reviews:</span>
              <span className="font-bold text-white mt-1 block">{service.seller_total_reviews || 0}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Response Rate:</span>
              <span className="font-bold text-emerald-400 mt-1 block">{service.response_rate || "98%"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Sales:</span>
              <span className="font-bold text-white mt-1 block">{service.total_sales || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODERATION LOG TAB */}
      {activeTab === "moderation" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Editorial & Moderation History Audit Trail</h3>
          <div className="space-y-3">
            {service.moderation_history?.map((log: any) => (
              <div
                key={log.id}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                      {log.action}
                    </span>
                    <span className="text-slate-400">By {log.moderator_name || "System Automation"}</span>
                  </div>
                  {log.reason && <p className="text-rose-300 text-xs mt-1">Reason: {log.reason}</p>}
                  {log.internal_notes && (
                    <p className="text-slate-400 text-xs mt-1 italic">{log.internal_notes}</p>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. PRICING TAB */}
      {activeTab === "pricing" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Commercial Terms & Financial Split</h3>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Standard Platform Commission:</span>
              <span className="font-bold text-indigo-400">15.0%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Seller Minimum Payout Share:</span>
              <span className="font-bold text-emerald-400">85.0%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Processing:</span>
              <span className="font-bold text-white">Stripe Marketplace Escrow</span>
            </div>
          </div>
        </div>
      )}

      {/* 11. AVAILABILITY TAB */}
      {activeTab === "availability" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Seller Working Hours & Booking Horizon</h3>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Maximum Concurrent Active Orders:</span>
              <span className="font-bold text-white">
                {service.availability?.max_active_orders || 5} orders
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Advance Notice Required:</span>
              <span className="font-bold text-white">
                {service.availability?.booking_notice_days || 1} day(s)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vacation Mode:</span>
              <span className="font-bold text-slate-300">
                {service.availability?.vacation_mode ? "Active (Orders Paused)" : "Normal Operating Hours"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 12. ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Client Orders for this Service</h3>
          <div className="p-8 text-center text-xs text-slate-500">
            {service.total_orders > 0 ? (
              <p className="text-slate-300 font-semibold">{service.total_orders} lifetime bookings registered.</p>
            ) : (
              <p>No client bookings placed yet for this service.</p>
            )}
          </div>
        </div>
      )}

      {/* 13. REVIEWS TAB */}
      {activeTab === "reviews" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Client Ratings & Testimonials</h3>
          <div className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-3xl font-bold text-amber-400">
              ★ {parseFloat(service.avg_rating || "5.0").toFixed(1)}
            </div>
            <div>
              <span className="text-sm font-semibold text-white">Overall Satisfaction</span>
              <p className="text-xs text-slate-400">Based on {service.review_count} verified reviews</p>
            </div>
          </div>
        </div>
      )}

      {/* 14. REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Incident & Compliance Reports</h3>
          <p className="text-xs text-slate-400">
            No unresolved client incident reports currently open for this listing.
          </p>
        </div>
      )}

      {/* 15. PERFORMANCE TAB */}
      {activeTab === "performance" && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Traffic & Conversion Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-500">Total Views</span>
              <div className="text-xl font-bold text-white mt-1">{service.view_count}</div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-500">Sales Inquiries</span>
              <div className="text-xl font-bold text-indigo-400 mt-1">{service.inquiry_count}</div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-500">Gross Sales</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">${service.total_revenue_usd}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
