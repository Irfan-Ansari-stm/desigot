"use client";
import React, { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAuthenticated, fetchCurrentUser, login } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // If authenticated, refresh user to ensure latest permissions and superadmin status
    if (isAuthenticated()) {
      fetchCurrentUser().catch(() => {});
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isUserAuthenticated = isAuthenticated() && !!user;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans text-slate-800 dark:text-slate-100">
      {/* Enterprise Collapsible Dynamic Sidebar */}
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Administrative Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <AdminTopNav />

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/60 dark:bg-slate-950">
          {!isUserAuthenticated ? (
            <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center shadow-lg">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                Authentication Required
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                Please sign in to access the Desigot Unified Management Platform.
              </p>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    await login("superadmin@desigot.com", "Password123!");
                    window.location.reload();
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  ⚡ 1-Click Sign-In as Super Admin
                </button>
                <button
                  onClick={async () => {
                    await login("seller@desigot.com", "Password123!");
                    window.location.reload();
                  }}
                  className="w-full py-2 px-4 rounded-lg bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 transition-colors border border-slate-700 flex items-center justify-center gap-2"
                >
                  ⚡ 1-Click Sign-In as Seller
                </button>
                <button
                  onClick={() => router.push("/auth/login?redirect=/dashboard")}
                  className="w-full py-2 px-4 rounded-lg text-slate-400 hover:text-white font-medium text-xs transition-colors"
                >
                  Standard Login Form &rarr;
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
