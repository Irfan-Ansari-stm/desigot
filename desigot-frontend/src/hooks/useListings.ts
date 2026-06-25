"use client";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from "@/lib/api";
import type { Listing, ListingMedia, ListingCollection, ListingFacets, PaginatedResponse, SearchFilters } from "@/types";
import { buildQueryString } from "@/lib/utils";

export const useListings = (filters: SearchFilters) => {
  const qs = buildQueryString(filters as Record<string, unknown>);
  return useQuery({
    queryKey: ["listings", filters],
    queryFn: () => apiGet<{ data: Listing[]; pagination: PaginatedResponse<Listing>["pagination"] }>(`/listings${qs}`),
    staleTime: 30_000,
  });
};

export const useListing = (idOrSlug: string) =>
  useQuery({
    queryKey: ["listing", idOrSlug],
    queryFn: () => apiGet<Listing>(`/listings/${idOrSlug}`),
    enabled: !!idOrSlug,
  });

export const useMyListings = (filters?: { status?: string; page?: number }) =>
  useQuery({
    queryKey: ["my-listings", filters],
    queryFn: () => apiGet<{ data: Listing[] }>(`/listings/me/listings${buildQueryString(filters || {})}`),
  });

export const useCreateListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Listing>) => apiPost<Listing>("/listings", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-listings"] }),
  });
};

export const useUpdateListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Listing> & { id: string }) =>
      apiPatch<Listing>(`/listings/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["listing", vars.id] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
};

export const useDeleteListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/listings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-listings"] }),
  });
};

export const useSubmitListingForReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/listings/${id}/submit`),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ["listing", id] }),
  });
};

export const useUploadMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, file, mediaType, sortOrder }: { listingId: string; file: File; mediaType: string; sortOrder?: number }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("media_type", mediaType);
      if (sortOrder !== undefined) fd.append("sort_order", String(sortOrder));
      return apiUpload<ListingMedia>(`/listings/${listingId}/media`, fd);
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["listing", vars.listingId] }),
  });
};

export const useDeleteMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, mediaId }: { listingId: string; mediaId: string }) =>
      apiDelete(`/listings/${listingId}/media/${mediaId}`),
    onSuccess: (_, { listingId }) => qc.invalidateQueries({ queryKey: ["listing", listingId] }),
  });
};

export const useCollections = () =>
  useQuery({
    queryKey: ["collections"],
    queryFn: () => apiGet<ListingCollection[]>("/listings/collections"),
    staleTime: 60_000,
  });

export const useCollection = (slug: string) =>
  useQuery({
    queryKey: ["collection", slug],
    queryFn: () => apiGet<ListingCollection>(`/listings/collections/${slug}`),
    enabled: !!slug,
  });

export const useListingFacets = () =>
  useQuery({
    queryKey: ["listing-facets"],
    queryFn: () => apiGet<ListingFacets>("/listings/facets"),
    staleTime: 120_000,
  });

export const useSearch = (filters: SearchFilters) => {
  const qs = buildQueryString(filters as Record<string, unknown>);
  return useQuery({
    queryKey: ["search", filters],
    queryFn: () => apiGet<{ data: Listing[]; pagination: PaginatedResponse<Listing>["pagination"] }>(`/search${qs}`),
    staleTime: 10_000,
  });
};

export const useAutocomplete = (q: string) =>
  useQuery({
    queryKey: ["autocomplete", q],
    queryFn: () => apiGet<{ title: string; slug: string }[]>(`/search/autocomplete?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
    staleTime: 10_000,
  });

export const useTrendingSearches = () =>
  useQuery({
    queryKey: ["trending-searches"],
    queryFn: () => apiGet<{ query_text: string; search_count: number }[]>("/search/trending"),
    staleTime: 60_000,
  });

export const useRecommendations = (context = "homepage") =>
  useQuery({
    queryKey: ["recommendations", context],
    queryFn: () => apiGet<Listing[]>(`/search/recommendations?context=${context}`),
    staleTime: 30_000,
  });

export const useCategories = (parentId?: string) =>
  useQuery({
    queryKey: ["categories", parentId],
    queryFn: () => apiGet<{ id: string; name: string; slug: string; icon_name?: string; listing_count: number; children?: unknown[] }[]>(
      `/categories${parentId ? `?parent_id=${parentId}` : ""}`
    ),
    staleTime: 120_000,
  });

export const useCategoryTree = () =>
  useQuery({
    queryKey: ["category-tree"],
    queryFn: () => apiGet<{ id: string; name: string; slug: string; children: unknown[] }[]>("/categories/tree"),
    staleTime: 120_000,
  });
