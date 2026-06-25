"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { SellerAnalytics } from "@/types";

export const useSellerOverview = (days = 30) =>
  useQuery({
    queryKey: ["seller-overview", days],
    queryFn: () => apiGet<SellerAnalytics>(`/analytics/seller/overview?days=${days}`),
    staleTime: 60_000,
  });

export const useTopListings = (limit = 10) =>
  useQuery({
    queryKey: ["top-listings", limit],
    queryFn: () => apiGet<unknown[]>(`/analytics/seller/top-listings?limit=${limit}`),
    staleTime: 60_000,
  });

export const useConversionFunnel = (days = 30) =>
  useQuery({
    queryKey: ["conversion", days],
    queryFn: () => apiGet<{ total_views: number; total_orders: number; conversion_rate: number }>(`/analytics/seller/conversion?days=${days}`),
  });

export const useRevenueByLicense = (days = 90) =>
  useQuery({
    queryKey: ["revenue-by-license", days],
    queryFn: () => apiGet<{ license_type: string; order_count: number; total_gmv: number; total_earnings: number }[]>(`/analytics/seller/by-license?days=${days}`),
  });

export const usePlatformRevenue = (days = 30) =>
  useQuery({
    queryKey: ["platform-revenue", days],
    queryFn: () => apiGet<{ day: string; order_count: number; gmv: number; platform_revenue: number }[]>(`/analytics/platform/revenue?days=${days}`),
  });

export const useTopSellers = (limit = 20) =>
  useQuery({
    queryKey: ["top-sellers", limit],
    queryFn: () => apiGet<unknown[]>(`/analytics/platform/top-sellers?limit=${limit}`),
  });

export const usePlatformMetrics = () =>
  useQuery({
    queryKey: ["platform-metrics"],
    queryFn: () => apiGet<Record<string, unknown>>("/admin/metrics"),
    refetchInterval: 60_000,
  });

export const useUserGrowth = (days = 30) =>
  useQuery({
    queryKey: ["user-growth", days],
    queryFn: () => apiGet<{ day: string; new_users: number; new_sellers: number; new_buyers: number }[]>(`/analytics/platform/user-growth?days=${days}`),
  });
