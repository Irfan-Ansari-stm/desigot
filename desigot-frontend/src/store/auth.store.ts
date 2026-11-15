"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { apiGet, apiPost, setAccessToken } from "@/lib/api";

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
  fetchCurrentUser: () => Promise<User | null>;
  isAuthenticated: () => boolean;
  isSeller: () => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  hasPermission: (permissionSlug: string) => boolean;
  hasAnyPermission: (permissionSlugs: string[]) => boolean;
  canAccessModule: (moduleSlug: string) => boolean;
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
          // Also fetch fresh profile and permissions
          await get().fetchCurrentUser();
        } catch {
          set({ user: null, accessToken: null });
        }
      },

      fetchCurrentUser: async () => {
        try {
          const user = await apiGet<User>("/auth/me");
          set({ user });
          return user;
        } catch {
          return null;
        }
      },

      isAuthenticated: () => !!get().user && !!get().accessToken,
      isSeller: () => ["seller", "admin", "superadmin"].includes(get().user?.role || ""),
      isAdmin: () => ["admin", "superadmin"].includes(get().user?.role || "") || !!get().user?.is_super_admin,
      isSuperAdmin: () => !!get().user?.is_super_admin || get().user?.role === "superadmin",

      hasPermission: (permissionSlug: string) => {
        const u = get().user;
        if (!u) return false;
        if (u.is_super_admin || u.role === "superadmin") return true;
        if (!u.permissions || !Array.isArray(u.permissions)) return false;
        return u.permissions.includes("*") || u.permissions.includes(permissionSlug);
      },

      hasAnyPermission: (permissionSlugs: string[]) => {
        const u = get().user;
        if (!u) return false;
        if (u.is_super_admin || u.role === "superadmin") return true;
        if (!u.permissions || !Array.isArray(u.permissions)) return false;
        if (u.permissions.includes("*")) return true;
        return permissionSlugs.some((p) => u.permissions?.includes(p));
      },

      canAccessModule: (moduleSlug: string) => {
        const u = get().user;
        if (!u) return false;
        if (u.is_super_admin || u.role === "superadmin") return true;
        if (!u.permissions || !Array.isArray(u.permissions)) return false;
        if (u.permissions.includes("*")) return true;
        return u.permissions.some((p) => p.startsWith(`${moduleSlug}.`));
      },
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
