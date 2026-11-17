"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Key,
  Save,
  RotateCcw,
  AlertOctagon,
  Check,
  X,
  Loader2
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { ProfileNavHeader, ProfileData } from "@/components/profile/ProfileNavHeader";

export default function ChangePasswordPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form Fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [revokeOthers, setRevokeOthers] = useState(true);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiGet<any>("/account/profile");
      setProfile(res?.data || res);
    } catch (err: any) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Password Checklist
  const reqLength = newPassword.length >= 12;
  const reqUpper = /[A-Z]/.test(newPassword);
  const reqLower = /[a-z]/.test(newPassword);
  const reqNumber = /[0-9]/.test(newPassword);
  const reqSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Strength score
  const getStrength = () => {
    if (!newPassword) return { score: 0, label: "None", color: "bg-slate-200 dark:bg-slate-700" };
    let points = 0;
    if (reqLength) points += 25;
    if (reqUpper) points += 20;
    if (reqLower) points += 15;
    if (reqNumber) points += 20;
    if (reqSpecial) points += 20;

    if (points < 40) return { score: points, label: "Weak", color: "bg-rose-500" };
    if (points < 75) return { score: points, label: "Fair", color: "bg-amber-500" };
    if (points < 95) return { score: points, label: "Good", color: "bg-indigo-500" };
    return { score: 100, label: "Strong & Resilient", color: "bg-emerald-500" };
  };

  const strength = getStrength();

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!currentPassword) {
      setErrorMsg("Please enter your current account password.");
      return;
    }
    if (!reqLength) {
      setErrorMsg("New password must be at least 12 characters long.");
      return;
    }
    if (!reqUpper || !reqLower || !reqNumber || !reqSpecial) {
      setErrorMsg("New password must meet all complexity requirements.");
      return;
    }
    if (!passwordsMatch) {
      setErrorMsg("New password and confirmation password do not match.");
      return;
    }

    setConfirmModal(true);
  };

  const handleExecuteChange = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await apiPost<any>("/account/password/change", {
        current_password: currentPassword,
        new_password: newPassword,
        revoke_others: revokeOthers,
      });

      setSuccessMsg(res?.message || "Your password has been changed securely.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setConfirmModal(false);
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to update password");
      setConfirmModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <ProfileNavHeader
        profile={profile}
        onRefresh={fetchProfile}
        loading={loading}
        successMsg={successMsg}
        errorMsg={errorMsg}
        onDismissAlert={() => { setSuccessMsg(""); setErrorMsg(""); }}
      />

      <div className="max-w-2xl">
        <form onSubmit={handleOpenConfirm} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-600" /> Change Security Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ensure your account is protected using a strong, unique 12+ character password.
            </p>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
                className="w-full text-xs px-3.5 py-2.5 pr-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new 12+ character password"
                className="w-full text-xs px-3.5 py-2.5 pr-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Password Strength:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-type new password"
                className="w-full text-xs px-3.5 py-2.5 pr-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && (
              <p className={`text-[11px] mt-1 flex items-center gap-1 ${passwordsMatch ? "text-emerald-600" : "text-rose-500"}`}>
                {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>

          {/* Requirements Checklist */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Security Password Requirements:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className={`flex items-center gap-1.5 ${reqLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500"}`}>
                {reqLength ? <Check className="h-3.5 w-3.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 ml-1 mr-1" />}
                At least 12 characters
              </div>
              <div className={`flex items-center gap-1.5 ${reqUpper ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500"}`}>
                {reqUpper ? <Check className="h-3.5 w-3.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 ml-1 mr-1" />}
                At least 1 uppercase letter
              </div>
              <div className={`flex items-center gap-1.5 ${reqLower ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500"}`}>
                {reqLower ? <Check className="h-3.5 w-3.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 ml-1 mr-1" />}
                At least 1 lowercase letter
              </div>
              <div className={`flex items-center gap-1.5 ${reqNumber ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500"}`}>
                {reqNumber ? <Check className="h-3.5 w-3.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 ml-1 mr-1" />}
                At least 1 number
              </div>
              <div className={`flex items-center gap-1.5 ${reqSpecial ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500"}`}>
                {reqSpecial ? <Check className="h-3.5 w-3.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 ml-1 mr-1" />}
                At least 1 special character (!@#$%^&*)
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 ml-1 mr-1" />
                No recently reused passwords
              </div>
            </div>
          </div>

          {/* Session Invalidation Toggle */}
          <div className="flex items-start gap-3 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
            <input
              type="checkbox"
              id="revokeOthers"
              checked={revokeOthers}
              onChange={(e) => setRevokeOthers(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="revokeOthers" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span className="font-bold">Terminate all other active sessions</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Logs out all other devices, mobile phones, and active browsers upon password change. Recommended for account security.
              </p>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* ── SENSITIVE ACTION CONFIRMATION MODAL ───────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertOctagon className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Confirm Password Change</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to change your account password?{" "}
              {revokeOthers && (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  All other active browser and mobile sessions will be immediately terminated.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteChange}
                disabled={saving}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
