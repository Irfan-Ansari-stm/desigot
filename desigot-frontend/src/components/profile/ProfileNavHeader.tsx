"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User as UserIcon,
  Lock,
  Smartphone,
  Laptop,
  ShieldCheck,
  Sliders,
  Camera,
  Trash2,
  Crown,
  Check,
  Briefcase,
  Building,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink
} from "lucide-react";
import { apiUpload, apiDelete } from "@/lib/api";

export interface ProfileData {
  id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  username?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  is_super_admin?: boolean;
  account_status?: string;
  job_title?: string;
  department?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  email_verified_at?: string;
  phone_verified?: boolean;
  two_factor_enabled?: boolean;
  [key: string]: any;
}

interface ProfileNavHeaderProps {
  profile: ProfileData | null;
  onRefresh?: () => void;
  loading?: boolean;
  successMsg?: string;
  errorMsg?: string;
  onDismissAlert?: () => void;
  onAvatarUpdated?: (newAvatarUrl: string | null) => void;
}

const NAV_TABS = [
  { href: "/dashboard/profile", label: "My Profile", icon: UserIcon },
  { href: "/dashboard/profile/change-password", label: "Change Password", icon: Lock },
  { href: "/dashboard/profile/two-factor-auth", label: "Two-Factor Auth", icon: Smartphone },
  { href: "/dashboard/profile/active-sessions", label: "Active Sessions", icon: Laptop },
  { href: "/dashboard/profile/security", label: "Account Security", icon: ShieldCheck },
  { href: "/dashboard/profile/preferences", label: "Preferences", icon: Sliders },
];

export function ProfileNavHeader({
  profile,
  onRefresh,
  loading = false,
  successMsg,
  errorMsg,
  onDismissAlert,
  onAvatarUpdated,
}: ProfileNavHeaderProps) {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("File size exceeds 5MB limit.");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setAvatarError("Only JPG, PNG, WEBP, or GIF images are allowed.");
      return;
    }

    setAvatarError("");
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await apiUpload<any>("/account/profile/avatar", formData);
      const newUrl = res?.avatar_url || res?.url;
      if (onAvatarUpdated) {
        onAvatarUpdated(newUrl);
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      setAvatarError(err.response?.data?.message || err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) return;
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      await apiDelete("/account/profile/avatar");
      if (onAvatarUpdated) {
        onAvatarUpdated(null);
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setAvatarError(err.response?.data?.message || err.message || "Failed to remove avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Hidden File Input for Avatar ─────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* ── Top Title & Refresh Action ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Profile & Account Management
            </h1>
            {profile?.is_super_admin && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                <Crown className="h-3 w-3" /> Root Super Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centrally manage your personal identity, credentials, active sessions, 2FA security, and platform preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {profile?.username && (
            <Link
              href={`/sellers/${profile.username}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Public Profile
            </Link>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Refresh Account Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── Global Alerts ────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          {onDismissAlert && (
            <button onClick={onDismissAlert} className="text-emerald-600 dark:text-emerald-400 hover:underline">
              Dismiss
            </button>
          )}
        </div>
      )}

      {(errorMsg || avatarError) && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{errorMsg || avatarError}</span>
          </div>
          {onDismissAlert && (
            <button onClick={() => { onDismissAlert(); setAvatarError(""); }} className="text-rose-600 dark:text-rose-400 hover:underline">
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* ── Profile Summary Card ─────────────────────────────────────────── */}
      {profile && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group shrink-0">
            <div className="h-20 w-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-600/30 overflow-hidden relative">
              {uploadingAvatar ? (
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              ) : profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                profile.display_name?.charAt(0) || profile.first_name?.charAt(0) || "U"
              )}

              {/* Hover overlay to change avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[10px] font-semibold"
                title="Change Avatar"
              >
                <Camera className="h-5 w-5 mb-0.5" />
                Change
              </button>
            </div>

            {profile.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors"
                title="Remove Picture"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 justify-center sm:justify-start">
                  {profile.display_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Administrator"}
                  {profile.is_super_admin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase">
                      Super Admin
                    </span>
                  )}
                  {profile.role && !profile.is_super_admin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase">
                      {profile.role}
                    </span>
                  )}
                </h2>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{profile.email}</div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 sm:pt-0">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {profile.account_status || "Active"}
                </span>
                {profile.two_factor_enabled ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> 2FA Active
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
                    2FA Disabled
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Briefcase className="h-3.5 w-3.5 text-indigo-600" /> {profile.job_title || "Platform Specialist"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-slate-400" /> {profile.department || "Core Operations"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {profile.city ? `${profile.city}, ` : ""}{profile.country || "India"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 6 Dedicated Nested Subpage Tabs ──────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 min-w-max pb-1">
          {NAV_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-4 py-2.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
