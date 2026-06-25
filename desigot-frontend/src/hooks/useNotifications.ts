"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost, apiDelete, apiPut } from "@/lib/api";
import type { Notification } from "@/types";
import { useUIStore } from "@/store/ui.store";
import { useEffect } from "react";

export const useNotifications = (unreadOnly = false) =>
  useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => apiGet<{ data: Notification[]; pagination: unknown; unread_count: number }>(
      `/notifications${unreadOnly ? "?unread_only=true" : "?limit=30"}`
    ),
    refetchInterval: 30_000,
  });

export const useMarkAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: ["notification-prefs"],
    queryFn: () => apiGet<{ user_id: string; event_type: string; email_enabled: boolean; in_app_enabled: boolean }[]>("/notifications/preferences"),
  });

export const useUpdateNotificationPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: { event_type: string; email_enabled: boolean; in_app_enabled: boolean; push_enabled: boolean }[]) =>
      apiPut("/notifications/preferences", { preferences: prefs }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-prefs"] }),
  });
};

export const useNotificationSync = () => {
  const { data } = useNotifications();
  const setNotifications = useUIStore((s) => s.setNotifications);
  const setUnreadCount   = useUIStore((s) => s.setUnreadCount);

  useEffect(() => {
    if (data) {
      setNotifications(data.data as Notification[]);
      setUnreadCount((data as unknown as { unread_count: number }).unread_count || 0);
    }
  }, [data]);
};
