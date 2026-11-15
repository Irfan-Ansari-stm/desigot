"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, Star, TrendingUp, Eye, MousePointerClick, Calendar, Trash2 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface FeaturedCampaign {
  campaign_id: string;
  service_id: string;
  priority: number;
  placement: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  impressions_count: number;
  clicks_count: number;
  orders_count: number;
  revenue_usd: string;
  ctr: string;
  service_title: string;
  service_slug: string;
  starting_price_usd: string;
  avg_rating: string;
  service_status: string;
  seller_name: string;
  seller_avatar?: string;
  thumbnail_url?: string;
}

export default function FeaturedServicesPage() {
  const [campaigns, setCampaigns] = useState<FeaturedCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<any>("/admin/services/featured");
      const list = Array.isArray(data) ? data : data?.campaigns || data?.data || [];
      setCampaigns(list);
    } catch (err) {
      console.error("Failed to load featured campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemove = async (serviceId: string) => {
    try {
      const { apiDelete } = await import("@/lib/api");
      await apiDelete(`/admin/services/${serviceId}/feature`);
      await loadData();
    } catch (err) {
      console.error("Failed to remove featured:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Featured Services & Spotlight</h1>
            <p className="text-sm text-slate-400">
              Manage promotional campaigns, priority positioning, and conversion performance.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 py-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading featured campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-500 bg-[#0f172a] border border-slate-800 rounded-2xl">
            <p className="text-base font-semibold text-slate-400">No active featured services.</p>
            <p className="text-xs text-slate-500 mt-1">
              Select services from All Services to promote to featured status.
            </p>
          </div>
        ) : (
          campaigns.map((c) => (
            <div
              key={c.campaign_id}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-800">
                  {c.thumbnail_url ? (
                    <img
                      src={c.thumbnail_url}
                      alt={c.service_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">
                      NO HERO IMAGE
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600/90 text-white text-xs font-bold shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" /> Priority {c.priority}
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-[11px] font-semibold text-slate-300 border border-slate-700">
                    {c.placement}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <Link
                      href={`/dashboard/service-management/${c.service_id}`}
                      className="font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1 text-base"
                    >
                      {c.service_title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">By {c.seller_name}</p>
                  </div>

                  {/* Campaign Metrics */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl text-center">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" /> Views
                      </span>
                      <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                        {c.impressions_count}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1">
                        <MousePointerClick className="w-3 h-3" /> CTR
                      </span>
                      <span className="text-xs font-bold text-indigo-400 mt-0.5 block">
                        {c.ctr}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Orders
                      </span>
                      <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                        {c.orders_count}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Until {new Date(c.end_date).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-white">${c.starting_price_usd}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href={`/dashboard/service-management/${c.service_id}`}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                >
                  View Service &rarr;
                </Link>
                <button
                  onClick={() => handleRemove(c.service_id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Spotlight
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
