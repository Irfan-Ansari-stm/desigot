"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import {
  Bell,
  Search,
  Moon,
  Sun,
  Shield,
  Crown,
  LogOut,
  User as UserIcon,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export function AdminTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSuperAdmin, logout, login } = useAuthStore();
  const [isDark, setIsDark] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);

  // Generate breadcrumbs from pathname
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const url = "/" + pathParts.slice(0, index + 1).join("/");
    const label = part
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return { url, label };
  });

  const handlePersonaSwitch = async (role: "superadmin" | "admin" | "manager" | "seller" | "user") => {
    setIsSwitchingPersona(true);
    setIsUserMenuOpen(false);
    try {
      const emailMap = {
        superadmin: "superadmin@desigot.com",
        admin: "admin@desigot.com",
        manager: "manager@desigot.com",
        seller: "seller@desigot.com",
        user: "user@desigot.com",
      };
      await login(emailMap[role], "Password123!");
      window.location.reload();
    } catch (err) {
      console.error("Persona switch error:", err);
    } finally {
      setIsSwitchingPersona(false);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link
          href="/dashboard"
          className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
        >
          <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Dashboard</span>
        </Link>

        {breadcrumbs.slice(1).map((crumb, idx) => (
          <React.Fragment key={crumb.url}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link
              href={crumb.url}
              className={
                idx === breadcrumbs.length - 2
                  ? "font-semibold text-slate-900 dark:text-slate-100"
                  : "hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              }
            >
              {crumb.label}
            </Link>
          </React.Fragment>
        ))}
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Role Persona Switcher (For live demonstration of RBAC permissions) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 px-2">Role View:</span>
          <button
            onClick={() => handlePersonaSwitch("superadmin")}
            disabled={isSwitchingPersona}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              isSuperAdmin()
                ? "bg-amber-500 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Switch to Super Admin"
          >
            <Crown className="h-3 w-3" /> Super Admin
          </button>
          <button
            onClick={() => handlePersonaSwitch("admin")}
            disabled={isSwitchingPersona}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              user?.role === "admin" && !isSuperAdmin()
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Switch to Admin"
          >
            Admin
          </button>
          <button
            onClick={() => handlePersonaSwitch("manager")}
            disabled={isSwitchingPersona}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              user?.email === "manager@desigot.com"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Switch to Manager"
          >
            Manager
          </button>
          <button
            onClick={() => handlePersonaSwitch("seller")}
            disabled={isSwitchingPersona}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              user?.role === "seller"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Switch to Seller"
          >
            Seller
          </button>
          <button
            onClick={() => handlePersonaSwitch("user")}
            disabled={isSwitchingPersona}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              user?.role === "buyer" || (user?.role as string) === "standard"
                ? "bg-slate-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Switch to Standard User"
          >
            Standard
          </button>
        </div>

        {/* User Menu Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.display_name?.charAt(0) || "U"}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                {user?.display_name || "Admin"}
              </div>
              <div className="text-[10px] text-slate-500">
                {isSuperAdmin() ? "System Owner" : user?.role}
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {user?.display_name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                <div className="mt-1">
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {isSuperAdmin() ? "Super Admin (Owner)" : user?.role}
                  </span>
                </div>
              </div>

              <Link
                href="/dashboard/profile"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <UserIcon className="h-3.5 w-3.5 text-slate-400" /> My Profile
              </Link>

              {isSuperAdmin() && (
                <Link
                  href="/dashboard/super-admin/control-center"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold"
                >
                  <Crown className="h-3.5 w-3.5" /> Super Admin Control
                </Link>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
