"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api";
import type { User, Wishlist, Review } from "@/types";

export interface UserProfile extends User {
  phone?: string;
  bio?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  country?: string;
  created_at: string;
}

export const useMyProfile = () =>
  useQuery({
    queryKey: ["my-profile"],
    queryFn: () => apiGet<UserProfile>("/users/me"),
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => apiPatch<UserProfile>("/users/me", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["auth-me"] });
    },
  });
};

export const useMyWishlists = () =>
  useQuery({
    queryKey: ["my-wishlists"],
    queryFn: () => apiGet<{ data: Wishlist[] } | Wishlist[]>("/wishlists/me"),
  });

export const useCreateWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; is_shared?: boolean }) =>
      apiPost<Wishlist>("/wishlists", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-wishlists"] }),
  });
};

export const useAddToWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ wishlistId, listingId }: { wishlistId: string; listingId: string }) =>
      apiPost(`/wishlists/${wishlistId}/items`, { listing_id: listingId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-wishlists"] }),
  });
};

export const useRemoveFromWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ wishlistId, listingId }: { wishlistId: string; listingId: string }) =>
      apiDelete(`/wishlists/${wishlistId}/items/${listingId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-wishlists"] }),
  });
};

export const useMyReviews = () =>
  useQuery({
    queryKey: ["my-reviews"],
    queryFn: () => apiGet<{ data: Review[]; total: number }>("/reviews/me/reviews"),
  });
