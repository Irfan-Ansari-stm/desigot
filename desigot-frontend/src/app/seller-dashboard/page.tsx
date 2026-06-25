"use client";
import { useAuthStore } from "@/store/auth.store";
import { useSellerOverview, useTopListings, useConversionFunnel } from "@/hooks/useAnalytics";
import { useMyListings } from "@/hooks/useListings";
import { useMyOrders } from "@/hooks/useOrders";
import { StatCard, Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { formatPrice, formatDate } from "@/lib/utils";
import { DollarSign, ShoppingBag, Package, Star, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";
import type { Order } from "@/types";

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const { data: overview, isLoading } = useSellerOverview(30);
  const { data: topListings } = useTopListings(5);
  const { data: orders } = useMyOrders("seller", { status: "active" });
  const { data: conversion } = useConversionFunnel(30);

  const summary = overview?.summary;
  const orderList = (orders as { data: Order[] } | undefined)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-primary">Seller Dashboard</h1><p className="text-sm text-ink-secondary">Last 30 days performance</p></div>
        <Link href="/seller-dashboard/listings/new" className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">+ New Listing</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Revenue (30d)" value={summary ? formatPrice(summary.total_earnings || 0) : "—"} icon={<DollarSign className="h-5 w-5" />} loading={isLoading} />
        <StatCard label="Orders (30d)" value={summary?.orders_period || 0} icon={<ShoppingBag className="h-5 w-5" />} loading={isLoading} />
        <StatCard label="Total Sales" value={summary?.total_orders || 0} icon={<TrendingUp className="h-5 w-5" />} loading={isLoading} />
        <StatCard label="Conversion" value={conversion ? `${conversion.conversion_rate || 0}%` : "—"} icon={<Eye className="h-5 w-5" />} loading={isLoading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><RevenueChart /></div>
        <Card>
          <h3 className="text-base font-semibold text-ink-primary mb-4">Listing Stats</h3>
          {overview?.listings && (
            <div className="space-y-3">
              {[
                { label: "Total Listings", value: overview.listings.total },
                { label: "Approved",       value: overview.listings.approved },
                { label: "Pending Review", value: overview.listings.pending },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-ink-secondary">{item.label}</span>
                  <span className="font-semibold text-ink-primary">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          {overview?.reviews && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                <span className="text-sm font-semibold text-ink-primary">{parseFloat(overview.reviews.avg_rating as unknown as string)?.toFixed(1) || "—"}</span>
                <span className="text-xs text-ink-secondary">({overview.reviews.total_reviews} reviews)</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Top listings */}
      {(topListings as unknown[])?.length > 0 && (
        <Card>
          <h3 className="text-base font-semibold text-ink-primary mb-4">Top Performing Listings</h3>
          <div className="space-y-3">
            {(topListings as { id: string; title: string; total_sales: number; total_revenue_cents: number; avg_rating?: number }[])?.slice(0, 5).map((l, i) => (
              <div key={l.id} className="flex items-center gap-3 p-2 hover:bg-surface-50 rounded-lg">
                <span className="text-sm font-bold text-ink-secondary w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-primary line-clamp-1">{l.title}</p>
                  <p className="text-xs text-ink-secondary">{l.total_sales} sales · {formatPrice(l.total_revenue_cents)} earned</p>
                </div>
                {l.avg_rating && <div className="flex items-center gap-1 shrink-0"><Star className="h-3.5 w-3.5 text-warning" /><span className="text-xs font-medium">{parseFloat(l.avg_rating as unknown as string)?.toFixed(1)}</span></div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending orders */}
      {orderList.length > 0 && (
        <Card>
          <h3 className="text-base font-semibold text-ink-primary mb-4">Active Orders</h3>
          <div className="space-y-2">
            {orderList.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between p-2 hover:bg-surface-50 rounded-lg">
                <div><p className="text-sm font-medium text-ink-primary">{o.listing_title}</p><p className="text-xs text-ink-secondary">{formatDate(o.created_at)} · {o.buyer_name}</p></div>
                <div className="flex items-center gap-2"><span className="text-sm font-semibold">{formatPrice(o.seller_payout_cents)}</span><StatusBadge status={o.status} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
