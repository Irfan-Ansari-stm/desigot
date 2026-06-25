"use client";
import { create } from "zustand";
import type { Notification } from "@/types";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

interface UIStore {
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  notificationsPanelOpen: boolean;
  setNotifications: (n: Notification[]) => void;
  setUnreadCount: (n: number) => void;
  toggleNotificationsPanel: () => void;
  // Mobile nav
  mobileNavOpen: boolean;
  toggleMobileNav: () => void;
  // Search
  searchOverlayOpen: boolean;
  toggleSearchOverlay: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => get().removeToast(id), toast.duration ?? 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  notifications: [],
  unreadCount: 0,
  notificationsPanelOpen: false,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  toggleNotificationsPanel: () => set((s) => ({ notificationsPanelOpen: !s.notificationsPanelOpen })),

  mobileNavOpen: false,
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),

  searchOverlayOpen: false,
  toggleSearchOverlay: () => set((s) => ({ searchOverlayOpen: !s.searchOverlayOpen })),
}));

export const toast = {
  success: (message: string) => useUIStore.getState().addToast({ type: "success", message }),
  error:   (message: string) => useUIStore.getState().addToast({ type: "error", message }),
  warning: (message: string) => useUIStore.getState().addToast({ type: "warning", message }),
  info:    (message: string) => useUIStore.getState().addToast({ type: "info", message }),
};
