"use client";

import React, { Suspense, useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User as UserIcon,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Monitor,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Download,
  Trash2,
  LogOut,
  Crown,
  Key,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  Briefcase,
  ExternalLink,
  Shield,
  Clock,
  Check,
  X,
  FileText,
  AlertOctagon,
  Moon,
  Sun,
  Palette
} from "lucide-react";
import { apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export default function ProfileAccountPage() {
  return (
    <Suspense fallback={<ProfileLoadingSkeleton />}>
      <ProfileAccountContent />
    </Suspense>
  );
}

function ProfileLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="md:col-span-2 h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    </div>
  );
}

type TabType = "profile" | "password" | "mfa" | "sessions" | "security" | "preferences";

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "My Profile", icon: UserIcon },
  { id: "password", label: "Change Password", icon: Lock },
  { id: "mfa", label: "Two-Factor Auth", icon: Smartphone },
  { id: "sessions", label: "Active Sessions", icon: Laptop },
  { id: "security", label: "Account Security", icon: ShieldCheck },
  { id: "preferences", label: "Preferences", icon: Sliders }
];

function ProfileAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") as TabType;
  const currentTab: TabType = TABS.some((t) => t.id === rawTab) ? rawTab : "profile";

  const { user: authUser, isSuperAdmin } = useAuthStore();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Data State
  const [profile, setProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState<any>({});
  const [mfaStatus, setMfaStatus] = useState<any>({ enabled: false, recovery_codes_remaining: 0 });
  const [sessions, setSessions] = useState<any[]>([]);
  const [securityOverview, setSecurityOverview] = useState<any>(null);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>({});

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [revokeOthers, setRevokeOthers] = useState(true);

  // 2FA Setup State
  const [setupModal, setSetupModal] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qr_code: string; manual_entry_key: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCodesModal, setRecoveryCodesModal] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disable2faModal, setDisable2faModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  // Suspicious Activity Modal
  const [reportModal, setReportModal] = useState(false);
  const [reportNotes, setReportNotes] = useState("");

  const setTab = (tab: TabType) => {
    startTransition(() => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", tab);
      router.push(`/dashboard/profile?${p.toString()}`);
    });
  };

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [pRes, mRes, sRes, secRes, prefRes, histRes, evRes] = await Promise.all([
        apiGet<any>("/account/profile").catch(() => ({ data: null })),
        apiGet<any>("/account/2fa").catch(() => ({ data: { enabled: false, recovery_codes_remaining: 0 } })),
        apiGet<any>("/account/sessions").catch(() => ({ data: [] })),
        apiGet<any>("/account/security").catch(() => ({ data: null })),
        apiGet<any>("/account/preferences").catch(() => ({ data: {} })),
        apiGet<any>("/account/security/login-history?limit=10").catch(() => ({ data: [] })),
        apiGet<any>("/account/security/events?limit=10").catch(() => ({ data: [] }))
      ]);

      if (pRes?.data) {
        setProfile(pRes.data);
        setProfileForm({
          first_name: pRes.data.first_name || "",
          last_name: pRes.data.last_name || "",
          display_name: pRes.data.display_name || "",
          username: pRes.data.username || "",
          email: pRes.data.email || "",
          phone: pRes.data.phone || "",
          job_title: pRes.data.job_title || "",
          department: pRes.data.department || "",
          company: pRes.data.company || "",
          country: pRes.data.country || "India",
          state: pRes.data.state || "",
          city: pRes.data.city || "",
          address: pRes.data.address || "",
          postal_code: pRes.data.postal_code || "",
          bio: pRes.data.bio || "",
          website: pRes.data.website || "",
          linkedin_url: pRes.data.linkedin_url || ""
        });
      }

      setMfaStatus(mRes?.data || { enabled: false, recovery_codes_remaining: 0 });
      setSessions(sRes?.data || []);
      setSecurityOverview(secRes?.data || null);
      setPreferences(prefRes?.data || {});
      setLoginHistory(histRes?.data || []);
      setSecurityEvents(evRes?.data || []);
    } catch (err: any) {
      console.error("Failed to load profile data:", err);
      setErrorMsg(err.message || "Failed to load account information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const updated = await apiPatch<any>("/account/profile", profileForm);
      setProfile(updated.data);
      setSuccessMsg("Personal profile information updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      setSaving(false);
      return;
    }
    if (newPassword.length < 12) {
      setErrorMsg("New password must be at least 12 characters.");
      setSaving(false);
      return;
    }

    try {
      const res = await apiPost<any>("/account/password/change", {
        current_password: currentPassword,
        new_password: newPassword,
        revoke_others: revokeOthers
      });
      setSuccessMsg(res.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccessMsg(""), 5000);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  // 2FA Setup
  const handleInitiate2FASetup = async () => {
    try {
      const res = await apiPost<any>("/account/2fa/setup", {});
      setSetupData(res.data);
      setTotpCode("");
      setSetupModal(true);
    } catch (err: any) {
      alert("Failed to initiate 2FA setup: " + err.message);
    }
  };

  const handleVerify2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPost<any>("/account/2fa/verify-setup", { code: totpCode });
      setSetupModal(false);
      setRecoveryCodes(res.data?.recovery_codes || []);
      setRecoveryCodesModal(true);
      setSuccessMsg("Two-factor authentication enabled successfully!");
      loadData();
    } catch (err: any) {
      alert("2FA validation failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/account/2fa/disable", { password: disablePassword });
      setDisable2faModal(false);
      setDisablePassword("");
      setSuccessMsg("Two-factor authentication disabled.");
      loadData();
    } catch (err: any) {
      alert("Failed to disable 2FA: " + (err.response?.data?.message || err.message));
    }
  };

  // Revoke Session
  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to terminate this login session?")) return;
    try {
      await apiDelete(`/account/sessions/${sessionId}`);
      setSuccessMsg("Session terminated.");
      loadData();
    } catch (err: any) {
      alert("Failed to terminate session: " + err.message);
    }
  };

  const handleRevokeOthers = async () => {
    if (!confirm("Are you sure you want to terminate all other active sessions?")) return;
    try {
      await apiPost("/account/sessions/revoke-others", {});
      setSuccessMsg("All other active sessions have been terminated.");
      loadData();
    } catch (err: any) {
      alert("Failed to revoke sessions: " + err.message);
    }
  };

  // Save Preferences
  const handleSavePreferences = async (newPrefs: any) => {
    setSaving(true);
    try {
      const res = await apiPatch<any>("/account/preferences", newPrefs);
      setPreferences(res.data);
      setSuccessMsg("Preferences saved successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  // Report Suspicious Activity
  const handleReportActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/account/security/report-activity", { notes: reportNotes });
      setReportModal(false);
      setReportNotes("");
      alert("Suspicious activity reported to security operations team.");
      loadData();
    } catch (err: any) {
      alert("Failed to report activity: " + err.message);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: "None", color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score <= 25) return { score, text: "Weak", color: "bg-rose-500" };
    if (score <= 50) return { score, text: "Fair", color: "bg-amber-500" };
    if (score <= 75) return { score, text: "Good", color: "bg-indigo-500" };
    return { score: 100, text: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6">
      {/* Top Banner & Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              My Profile & Account Security
            </h1>
            {isSuperAdmin() && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                <Crown className="h-3 w-3" /> Application Owner
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal profile identity, credentials, active sessions, two-factor authentication, and personalization preferences.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2 self-start md:self-auto rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh Account Data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Alert Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-600 dark:text-emerald-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-rose-600 dark:text-rose-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      {profile && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group">
            <div className="h-20 w-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-600/30 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                profile.display_name?.charAt(0) || "A"
              )}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 justify-center sm:justify-start">
                  {profile.display_name}
                  {profile.is_super_admin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase">
                      Super Admin
                    </span>
                  )}
                </h2>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{profile.email}</div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 sm:pt-0">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {profile.account_status || "Active"}
                </span>
                {mfaStatus.enabled && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> 2FA Active
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Briefcase className="h-3.5 w-3.5 text-indigo-600" /> {profile.job_title}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-slate-400" /> {profile.department}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {profile.city}, {profile.country}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6-Tab Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 min-w-max pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-500"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: MY PROFILE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "profile" && profile && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <UserIcon className="h-4 w-4 text-indigo-600" /> Personal Details & Organizational Role
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.first_name || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.last_name || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Public Display Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.display_name || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={profileForm.job_title || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, job_title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={profileForm.department || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={profileForm.company || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={profile.email || ""}
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Verified
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileForm.phone || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                  {profile.phone_verified && (
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bio / Profile Summary</label>
              <textarea
                rows={3}
                value={profileForm.bio || ""}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                <input
                  type="text"
                  value={profileForm.country || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={profileForm.city || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">LinkedIn Profile</label>
                <input
                  type="text"
                  value={profileForm.linkedin_url || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Save className="h-4 w-4" /> Save Profile Details
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: CHANGE PASSWORD */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "password" && (
        <form onSubmit={handleChangePassword} className="space-y-6 max-w-2xl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Lock className="h-4 w-4 text-indigo-600" /> Update Account Password
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password *</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password *</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Password Strength:</span>
                    <span className="font-bold">{strength.text}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className={`${strength.color} h-full transition-all`} style={{ width: `${strength.score}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            {/* Security Policies Checklist */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-indigo-600" /> Security Requirements:
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`h-3 w-3 ${newPassword.length >= 12 ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Minimum 12 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`h-3 w-3 ${/[A-Z]/.test(newPassword) ? "text-emerald-600" : "text-slate-300"}`} />
                <span>At least one uppercase character</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`h-3 w-3 ${/[0-9]/.test(newPassword) ? "text-emerald-600" : "text-slate-300"}`} />
                <span>At least one number</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="revokeOthers"
                checked={revokeOthers}
                onChange={(e) => setRevokeOthers(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
              />
              <label htmlFor="revokeOthers" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Revoke all other active login sessions on password change
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Lock className="h-4 w-4" /> Change Password
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: TWO-FACTOR AUTHENTICATION */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "mfa" && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-indigo-600" /> Authenticator Application (TOTP)
                </h2>
                <p className="text-xs text-slate-500">Time-based one-time passwords generated via Google Authenticator, Authy, or 1Password.</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${mfaStatus.enabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                {mfaStatus.enabled ? "2FA Enabled" : "Not Configured"}
              </span>
            </div>

            {mfaStatus.enabled ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Your account is protected with 2FA</div>
                      <div className="text-[11px] text-slate-500">Recovery codes remaining: {mfaStatus.recovery_codes_remaining}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDisable2faModal(true)}
                    className="px-3.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                  >
                    Disable 2FA
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Two-Factor Authentication is currently disabled</div>
                  <div className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                    Protect your administrative account from credential compromise by enforcing secondary code verification at every login.
                  </div>
                </div>
                <button
                  onClick={handleInitiate2FASetup}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Key className="h-3.5 w-3.5" /> Enable Two-Factor Authentication
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: ACTIVE SESSIONS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "sessions" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Laptop className="h-4 w-4 text-indigo-600" /> Active Login Sessions ({sessions.length})
              </h2>
              <p className="text-xs text-slate-500">Inspect authenticated browser sessions and terminate unrecognized devices.</p>
            </div>
            {sessions.length > 1 && (
              <button
                onClick={handleRevokeOthers}
                className="px-3.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold"
              >
                Revoke All Other Sessions
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                  <th className="py-2.5 px-3">Device & Browser</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Last Active</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {s.device_type === "mobile" ? <Smartphone className="h-4 w-4 text-slate-400" /> : <Laptop className="h-4 w-4 text-slate-400" />}
                        <span>{s.device || s.browser}</span>
                        {s.is_current && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{s.os} • {s.browser}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">{s.ip_address}</td>
                    <td className="py-3 px-3">{s.location || "Unknown"}</td>
                    <td className="py-3 px-3 text-slate-500">{new Date(s.last_activity_at || s.created_at).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right">
                      {!s.is_current ? (
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          className="text-xs text-rose-600 hover:underline font-semibold"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: ACCOUNT SECURITY & LOGIN HISTORY */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "security" && securityOverview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold">Security Score</div>
              <div className="text-xl font-bold mt-1 text-emerald-600 flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5" /> {securityOverview.security_score}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{securityOverview.status}</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold">Two-Factor Authentication</div>
              <div className="text-xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                {securityOverview.two_factor_enabled ? "Active" : "Disabled"}
              </div>
              <div className="text-[11px] text-indigo-600 mt-0.5">TOTP Authenticator</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold">Password Age</div>
              <div className="text-xl font-bold mt-1 text-slate-900 dark:text-slate-100">14 Days</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Policy &lt; 90 Days</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-slate-500 text-xs font-semibold">Active Sessions</div>
              <div className="text-xl font-bold mt-1 text-indigo-600">{securityOverview.active_sessions_count} Devices</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Known Authorized</div>
            </div>
          </div>

          {/* Login History Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" /> Recent Account Login History
                </h2>
                <p className="text-xs text-slate-500">Audit trail of authenticated logins and blocked attempts.</p>
              </div>
              <button
                onClick={() => setReportModal(true)}
                className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold"
              >
                Report Suspicious Activity
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase font-semibold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loginHistory.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono">{l.ip_address}</td>
                      <td className="py-2.5 px-3 uppercase text-[10px] font-mono">{l.authentication_method || "password"}</td>
                      <td className="py-2.5 px-3">{l.location || "Unknown"}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${l.status === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: PREFERENCES */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === "preferences" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5 max-w-3xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="h-4 w-4 text-indigo-600" /> UI Personalization & Notification Preferences
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Color Palette Theme</label>
              <select
                value={preferences.theme || "dark"}
                onChange={(e) => handleSavePreferences({ ...preferences, theme: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              >
                <option value="dark">Dark Navy Theme (Recommended)</option>
                <option value="light">Light Theme</option>
                <option value="system">System Default</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Language</label>
              <select
                value={preferences.language || "en"}
                onChange={(e) => handleSavePreferences({ ...preferences, language: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              >
                <option value="en">English (US/UK)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="ar">Arabic (العربية)</option>
                <option value="fr">French (Français)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Timezone</label>
              <select
                value={preferences.timezone || "Asia/Kolkata"}
                onChange={(e) => handleSavePreferences({ ...preferences, timezone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              >
                <option value="Asia/Kolkata">India Standard Time (IST, +05:30)</option>
                <option value="UTC">Universal Coordinated Time (UTC, +00:00)</option>
                <option value="America/New_York">Eastern Time (EST, -05:00)</option>
                <option value="Europe/London">London Time (GMT, +00:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Format</label>
              <select
                value={preferences.date_format || "DD/MM/YYYY"}
                onChange={(e) => handleSavePreferences({ ...preferences, date_format: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Email & In-App Alerts</div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Security Notifications</div>
                  <div className="text-[11px] text-slate-500">Alert me when passwords change or 2FA is toggled</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.security_notifications !== false}
                  onChange={(e) => handleSavePreferences({ ...preferences, security_notifications: e.target.checked })}
                  className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">New Device Login Alerts</div>
                  <div className="text-[11px] text-slate-500">Immediate email when login occurs from unfamiliar IP/device</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.login_alerts !== false}
                  onChange={(e) => handleSavePreferences({ ...preferences, login_alerts: e.target.checked })}
                  className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: 2FA SETUP WIZARD */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {setupModal && setupData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-indigo-600" /> Setup Authenticator App
              </h3>
              <button onClick={() => setSetupModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Scan the QR code using Google Authenticator, Authy, or 1Password, or enter the manual key below.
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 flex justify-center">
              <img src={setupData.qr_code} alt="2FA QR Code" className="h-44 w-44" />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono text-[11px] break-all select-all flex items-center justify-between">
              <span>{setupData.manual_entry_key}</span>
              <button
                onClick={() => navigator.clipboard.writeText(setupData.manual_entry_key)}
                className="p-1 text-slate-500 hover:text-slate-800 ml-2"
                title="Copy Key"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleVerify2FASetup} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 6-Digit Code from App *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSetupModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Verify & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: RECOVERY CODES DISPLAY */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {recoveryCodesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="h-5 w-5" /> Save Your 2FA Recovery Codes
            </h3>
            <p className="text-xs text-slate-500">
              Store these single-use recovery codes in a secure location. You will need them if you lose access to your authenticator app.
            </p>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-center font-bold">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join("\n"));
                  alert("Recovery codes copied to clipboard!");
                }}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Codes
              </button>
              <button
                onClick={() => setRecoveryCodesModal(false)}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                I Have Saved Them
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: DISABLE 2FA */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {disable2faModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" /> Disable Two-Factor Authentication
            </h3>
            <p className="text-xs text-slate-500">Please enter your current account password to confirm disabling 2FA.</p>

            <form onSubmit={handleDisable2FA} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisable2faModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Disable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: REPORT SUSPICIOUS ACTIVITY */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {reportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-rose-600">
              <AlertOctagon className="h-5 w-5" /> Report Suspicious Account Activity
            </h3>
            <p className="text-xs text-slate-500">
              Provide details of any unauthorized login attempt or unrecognized session for investigation.
            </p>

            <form onSubmit={handleReportActivity} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Activity Notes / Context</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Unrecognized IP address from Frankfurt attempted login at 2:00 AM..."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Submit Incident Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
