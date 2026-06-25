"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { apiPost, setAccessToken } from "@/lib/api";

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: () => boolean;
  isSeller: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => {
        set({ accessToken });
        setAccessToken(accessToken);
      },

      login: async (email, password, totpCode) => {
        set({ isLoading: true });
        try {
          const data = await apiPost<{ user: User; accessToken: string }>("/auth/login", {
            email, password, totp_code: totpCode,
          });
          set({ user: data.user, accessToken: data.accessToken, isLoading: false });
          setAccessToken(data.accessToken);
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      register: async (email, password, displayName, role = "buyer") => {
        set({ isLoading: true });
        try {
          const data = await apiPost<{ user: User; accessToken: string }>("/auth/register", {
            email, password, display_name: displayName, role,
          });
          set({ user: data.user, accessToken: data.accessToken, isLoading: false });
          setAccessToken(data.accessToken);
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        try {
          await apiPost("/auth/logout", {});
        } catch {}
        set({ user: null, accessToken: null });
        setAccessToken(null);
        window.location.href = "/";
      },

      refreshUser: async () => {
        try {
          const data = await apiPost<{ accessToken: string }>("/auth/refresh", {});
          set({ accessToken: data.accessToken });
          setAccessToken(data.accessToken);
        } catch {
          set({ user: null, accessToken: null });
        }
      },

      isAuthenticated: () => !!get().user && !!get().accessToken,
      isSeller: () => ["seller", "admin", "superadmin"].includes(get().user?.role || ""),
      isAdmin: () => ["admin", "superadmin"].includes(get().user?.role || ""),
    }),
    {
      name: "desigot-auth",
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAccessToken(state.accessToken);
      },
    }
  )
);
