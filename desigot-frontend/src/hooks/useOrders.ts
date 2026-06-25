"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { Order, License, Payout, SellerBalance, SellerPlan, Subscription } from "@/types";
import { buildQueryString } from "@/lib/utils";

export const useMyOrders = (role: "buyer" | "seller" = "buyer", filters?: { status?: string; page?: number }) =>
  useQuery({
    queryKey: ["my-orders", role, filters],
    queryFn: () => apiGet<{ data: Order[]; pagination: unknown }>(`/orders/me?role=${role}${filters?.status ? `&status=${filters.status}` : ""}${filters?.page ? `&page=${filters.page}` : ""}`),
  });

export const useOrder = (id: string) =>
  useQuery({
    queryKey: ["order", id],
    queryFn: () => apiGet<Order>(`/orders/${id}`),
    enabled: !!id,
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { listing_id: string; license_type: string; promo_code?: string }) =>
      apiPost<Order>("/orders", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-orders"] }),
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiPost(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-orders"] }),
  });
};

export const useDownloadUrl = (orderId: string) =>
  useQuery({
    queryKey: ["download-url", orderId],
    queryFn: () => apiGet<{ url: string; fileName: string; expiresAt: string }>(`/orders/${orderId}/download`),
    enabled: false,
  });

export const useMyLicenses = () =>
  useQuery({
    queryKey: ["my-licenses"],
    queryFn: () => apiGet<{ data: License[] }>("/orders/me/licenses"),
  });

export const useCreatePaymentIntent = () =>
  useMutation({
    mutationFn: (orderId: string) => apiPost<{ clientSecret: string; intentId: string; amount: number }>("/payments/intents", { order_id: orderId }),
  });

export const useSimulatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => apiPost(`/payments/simulate/${orderId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["my-licenses"] });
    },
  });
};

export const useSellerBalance = () =>
  useQuery({
    queryKey: ["seller-balance"],
    queryFn: () => apiGet<SellerBalance>("/users/me/balance"),
  });

export const usePayouts = () =>
  useQuery({
    queryKey: ["payouts"],
    queryFn: () => apiGet<{ data: Payout[] }>("/payments/payouts"),
  });

export const useRequestPayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ methodId, amountCents }: { methodId: string; amountCents: number }) =>
      apiPost("/payments/payouts", { method_id: methodId, amount_cents: amountCents }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payouts"] });
      qc.invalidateQueries({ queryKey: ["seller-balance"] });
    },
  });
};

export const usePlans = () =>
  useQuery({
    queryKey: ["plans"],
    queryFn: () => apiGet<SellerPlan[]>("/payments/plans"),
    staleTime: 300_000,
  });

export const useMySubscription = () =>
  useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => apiGet<Subscription | null>("/payments/subscription"),
  });

export const useSubscribeToPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, billingCycle }: { planId: string; billingCycle: string }) =>
      apiPost("/payments/subscription", { plan_id: planId, billing_cycle: billingCycle }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-subscription"] }),
  });
};

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete("/payments/subscription"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-subscription"] }),
  });
};

export const usePayoutMethods = () =>
  useQuery({
    queryKey: ["payout-methods"],
    queryFn: () => apiGet<{ id: string; method_type: string; display_name: string; is_default: boolean }[]>("/payments/payout-methods"),
  });
