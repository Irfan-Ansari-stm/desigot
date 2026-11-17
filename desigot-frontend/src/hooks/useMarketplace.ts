"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

// Helper for API GET
const fetcher = async <T>(url: string): Promise<T> => {
  const res = await api.get(url);
  return res.data?.data ?? res.data;
};

// 1. Navigation & Mega Menu
export const useMarketplaceNav = () => {
  return useQuery({
    queryKey: ["marketplace-nav"],
    queryFn: () => fetcher<{
      header_links: { label: string; href: string; has_dropdown?: boolean }[];
      mega_menu_categories: {
        id: string;
        name: string;
        slug: string;
        icon_name?: string;
        description?: string;
        subcategories: { id: string; name: string; slug: string }[];
        total_subcategories: number;
      }[];
      footer: {
        settings: Record<string, unknown>;
        columns: { id: string; title: string; links: { label: string; url: string }[] }[];
      };
    }>("/public/navigation"),
    staleTime: 60_000,
  });
};

// 2. Homepage
export const usePublicHomepage = () => {
  return useQuery({
    queryKey: ["public-homepage"],
    queryFn: () => fetcher<{
      settings: Record<string, unknown>;
      hero: Record<string, unknown>;
      hero_slides: Record<string, unknown>[];
      categories: { id: string; name: string; slug: string; icon_name?: string; description?: string }[];
      featured_services: any[];
      featured_products: any[];
      top_sellers: any[];
      stats: {
        total_services: number;
        total_products: number;
        total_sellers: number;
        total_reviews: number;
        assets_count: string;
        sellers_count: string;
        buyers_count: string;
        avg_rating: string;
      };
    }>("/public/homepage"),
    staleTime: 60_000,
  });
};

// 3. Services Listing
export const usePublicServices = (params: Record<string, unknown> = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      query.append(k, String(v));
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : "";

  return useQuery({
    queryKey: ["public-services", params],
    queryFn: async () => {
      const res = await api.get(`/public/services${queryString}`);
      return {
        data: res.data?.data || res.data?.services || [],
        pagination: res.data?.pagination || { total: 0, page: 1, limit: 12 },
      };
    },
    staleTime: 30_000,
  });
};

// 4. Service Detail
export const usePublicService = (slug: string) => {
  return useQuery({
    queryKey: ["public-service", slug],
    queryFn: () => fetcher<{
      service: any;
      packages: any[];
      media: any[];
      reviews: any[];
      related_services: any[];
      seller: any;
    }>(`/public/services/${slug}`),
    enabled: !!slug,
  });
};

// 5. Products Listing
export const usePublicProducts = (params: Record<string, unknown> = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      query.append(k, String(v));
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : "";

  return useQuery({
    queryKey: ["public-products", params],
    queryFn: async () => {
      const res = await api.get(`/public/products${queryString}`);
      return {
        data: res.data?.data || [],
        pagination: res.data?.pagination || { total: 0, page: 1, limit: 12 },
      };
    },
    staleTime: 30_000,
  });
};

// 6. Product Detail
export const usePublicProduct = (slug: string) => {
  return useQuery({
    queryKey: ["public-product", slug],
    queryFn: () => fetcher<{
      product: any;
      licenses: any[];
      files: any[];
      reviews: any[];
      related_products: any[];
      seller: any;
    }>(`/public/products/${slug}`),
    enabled: !!slug,
  });
};

// 7. Featured Content
export const usePublicFeatured = () => {
  return useQuery({
    queryKey: ["public-featured"],
    queryFn: () => fetcher<{
      services: any[];
      products: any[];
      sellers: any[];
      categories: any[];
    }>("/public/featured"),
    staleTime: 60_000,
  });
};

// 8. Trending Content
export const usePublicTrending = () => {
  return useQuery({
    queryKey: ["public-trending"],
    queryFn: () => fetcher<{
      trending_services: any[];
      trending_products: any[];
      trending_categories: any[];
      popular_sellers: any[];
    }>("/public/trending"),
    staleTime: 60_000,
  });
};

// 9. Categories
export const usePublicCategories = (params: { parent_id?: string; featured?: boolean; search?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.parent_id) query.append("parent_id", params.parent_id);
  if (params.featured) query.append("featured", "true");
  if (params.search) query.append("search", params.search);
  const qs = query.toString() ? `?${query.toString()}` : "";

  return useQuery({
    queryKey: ["public-categories", params],
    queryFn: () => fetcher<any[]>(`/public/categories${qs}`),
    staleTime: 60_000,
  });
};

// 10. Category Detail
export const usePublicCategory = (slug: string) => {
  return useQuery({
    queryKey: ["public-category", slug],
    queryFn: () => fetcher<{
      category: any;
      subcategories: any[];
      services: any[];
      products: any[];
      seo: any;
    }>(`/public/categories/${slug}`),
    enabled: !!slug,
  });
};

// 11. Seller Profile
export const usePublicSeller = (slug: string) => {
  return useQuery({
    queryKey: ["public-seller", slug],
    queryFn: () => fetcher<{
      seller: any;
      services: any[];
      products: any[];
      reviews: any[];
      stats: any;
    }>(`/public/sellers/${slug}`),
    enabled: !!slug,
  });
};

// 12. Blog
export const usePublicBlog = (params: { category?: string; search?: string; page?: number; limit?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.append("category", params.category);
  if (params.search) query.append("search", params.search);
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));
  const qs = query.toString() ? `?${query.toString()}` : "";

  return useQuery({
    queryKey: ["public-blog", params],
    queryFn: async () => {
      const res = await api.get(`/public/blog${qs}`);
      return {
        data: res.data?.data || [],
        pagination: res.data?.pagination || { total: 0, page: 1, limit: 9 },
        categories: res.data?.categories || [],
        featured_post: res.data?.featured_post || null,
      };
    },
    staleTime: 60_000,
  });
};

// 13. Blog Detail
export const usePublicBlogPost = (slug: string) => {
  return useQuery({
    queryKey: ["public-blog-post", slug],
    queryFn: () => fetcher<{
      post: any;
      related_posts: any[];
      seo: any;
    }>(`/public/blog/${slug}`),
    enabled: !!slug,
  });
};

// 14. Global Search
export const useGlobalSearch = (params: Record<string, unknown>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      query.append(k, String(v));
    }
  });
  const qs = query.toString() ? `?${query.toString()}` : "";

  return useQuery({
    queryKey: ["global-search", params],
    queryFn: () => fetcher<{
      query: string;
      type: string;
      services: any[];
      products: any[];
      categories: any[];
      sellers: any[];
      blog: any[];
      total: number;
    }>(`/public/search${qs}`),
    enabled: !!params.q || !!params.type,
    staleTime: 15_000,
  });
};

// 15. Search Suggestions
export const useSearchSuggestions = (q: string) => {
  return useQuery({
    queryKey: ["search-suggestions", q],
    queryFn: () => fetcher<{
      suggestions: { title: string; slug: string; type: string }[];
      categories: { title: string; slug: string; type: string }[];
    }>(`/public/search/suggestions?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
  });
};

// 16. Popular Searches
export const usePopularSearches = () => {
  return useQuery({
    queryKey: ["popular-searches"],
    queryFn: () => fetcher<string[]>("/public/search/popular"),
    staleTime: 60_000,
  });
};

// 17. Seller Onboarding Status
export const useSellerOnboarding = () => {
  return useQuery({
    queryKey: ["seller-onboarding"],
    queryFn: () => fetcher<{
      user_id: string;
      is_seller: boolean;
      is_approved: boolean;
      status: string;
      application: any;
    }>("/seller/onboarding"),
    staleTime: 10_000,
  });
};

// 18. Save/Update Seller Application
export const useSaveSellerApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: Record<string, unknown> }) => {
      if (id) {
        const res = await api.patch(`/seller/applications/${id}`, data);
        return res.data?.data;
      } else {
        const res = await api.post("/seller/applications", data);
        return res.data?.data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-onboarding"] });
    },
  });
};

// 19. Submit Seller Application
export const useSubmitSellerApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agreements }: { id: string; agreements: Record<string, boolean> }) => {
      const res = await api.post(`/seller/applications/${id}/submit`, agreements);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-onboarding"] });
    },
  });
};

// 20. Unread Notifications Count
export const useUnreadCount = (enabled: boolean = true) => {
  const token = useAuthStore((s) => s.accessToken);
  const isAuth = !!token;
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => fetcher<{ unread_count: number }>("/notifications/unread-count"),
    enabled: enabled && isAuth,
    staleTime: 15_000,
    refetchInterval: enabled && isAuth ? 30_000 : false,
  });
};
