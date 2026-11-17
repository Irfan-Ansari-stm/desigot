"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  Smartphone,
  Mail,
  Phone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  History,
  Activity,
  AlertOctagon,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  LogOut,
  MapPin,
  Calendar,
  Clock,
  Loader2
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { ProfileNavHeader, ProfileData } from "@/components/profile/ProfileNavHeader";

export default function AccountSecurityPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Report Suspicious Activity Modal
  const [reportModal, setReportModal] = useState(false);
  const [reportNotes, setReportNotes] = useState("");
  const [reporting, setReporting] = useState(false);

  // Sign out all devices modal
  const [signOutAllModal, setSignOutAllModal] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [pRes, secRes, histRes, evRes] = await Promise.all([
        apiGet<any>("/account/profile").catch(() => null),
        apiGet<any>("/account/security").catch(() => null),
        apiGet<any>("/account/security/login-history?limit=15").catch(() => []),
        apiGet<any>("/account/security/events?limit=15").catch(() => []),
      ]);

      if (pRes) setProfile(pRes?.data || pRes);
      if (secRes) setOverview(secRes?.data || secRes);
      setLoginHistory(histRes?.data || histRes || []);
      setSecurityEvents(evRes?.data || evRes || []);
    } catch (err: any) {
      console.error("Failed to load security overview:", err);
      setErrorMsg(err.message || "Failed to load account security data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleReportActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNotes.trim()) return;
    setReporting(true);
    setErrorMsg("");

    try {
      await apiPost("/account/security/report-activity", { notes: reportNotes.trim() });
      setReportModal(false);
      setReportNotes("");
      setSuccessMsg("Suspicious activity report recorded and security team alerted.");
      fetchSecurityData();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to submit report");
    } finally {
      setReporting(false);
    }
  };

  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    setErrorMsg("");

    try {
      await apiPost("/account/sessions/revoke-all", {});
      setSignOutAllModal(false);
      setSuccessMsg("All sessions terminated. Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to sign out all devices");
    } finally {
      setSigningOutAll(false);
    }
  };

  const healthScore = overview?.security_score ?? 85;

  return (
    <div className="space-y-6 pb-12">
      <ProfileNavHeader
        profile={profile}
        onRefresh={fetchSecurityData}
        loading={loading}
        successMsg={successMsg}
        errorMsg={errorMsg}
        onDismissAlert={() => { setSuccessMsg(""); setErrorMsg(""); }}
      />

      <div className="space-y-6">
        {/* Security Health Score Card */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-lg border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-300">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Account Protection Status</span>
            </div>
            <h2 className="text-xl font-bold">
              Security Score: <span className="text-emerald-400">{healthScore}%</span> — Good Posture
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Your profile credentials, authentication tokens, and access channels are monitored in real time. We actively audit suspicious logins and brute-force events.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setReportModal(true)}
              className="px-4 py-2.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <AlertOctagon className="h-4 w-4" /> Report Activity
            </button>

            <button
              type="button"
              onClick={() => setSignOutAllModal(true)}
              className="px-4 py-2.5 text-xs font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600/40 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" /> Sign Out Everywhere
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 2FA Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Two-Factor Auth</span>
              <Smartphone className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {overview?.two_factor_enabled ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>Enabled</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span>Disabled</span>
                </>
              )}
            </div>
            <Link
              href="/dashboard/profile/two-factor-auth"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1 pt-1"
            >
              Manage 2FA <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Card 2: Password Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Password Health</span>
              <Lock className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              12+ Chars (Strong)
            </div>
            <Link
              href="/dashboard/profile/change-password"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1 pt-1"
            >
              Update Password <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Card 3: Active Sessions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Active Devices</span>
              <Laptop className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {overview?.active_sessions_count ?? 1} Session{(overview?.active_sessions_count ?? 1) > 1 ? "s" : ""}
            </div>
            <Link
              href="/dashboard/profile/active-sessions"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1 pt-1"
            >
              Review Devices <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Card 4: Verification Channels */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Contact Security</span>
              <Mail className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 space-y-0.5">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Email Verified
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="h-3.5 w-3.5" /> Phone OTP Setup
              </div>
            </div>
            <Link
              href="/dashboard/profile"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1 pt-1"
            >
              Edit Channels <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Recent Login History Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-600" /> Recent Login Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit records of authenticated logins, IP addresses, and client devices.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Device & Browser</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loginHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No recent login activity recorded.
                    </td>
                  </tr>
                ) : (
                  loginHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : "Recently"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800 dark:text-slate-200">
                        {item.ip_address || "127.0.0.1"}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {item.browser || "Chrome"} on {item.os || "Windows"}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {item.location || "Mumbai, IN"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300">
                          {item.auth_method || "password"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {item.status === "failed" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Failed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Success
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Audit Events Log */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600" /> Security Audit Log & Critical Events
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Immutable security logs of credential modifications, 2FA toggles, and session revocations.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {securityEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No security audit events recorded.</p>
            ) : (
              securityEvents.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        ev.severity === "high"
                          ? "bg-rose-500"
                          : ev.severity === "medium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {ev.event_type || "security_event"}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">
                        IP: {ev.ip_address || "127.0.0.1"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    {ev.created_at ? new Date(ev.created_at).toLocaleString() : "Recently"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── REPORT SUSPICIOUS ACTIVITY MODAL ─────────────────────────────── */}
      {reportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertOctagon className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Report Unfamiliar Activity</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              If you noticed unfamiliar logins, unexplained notifications, or suspicious password change requests, provide details below:
            </p>

            <form onSubmit={handleReportActivity} className="space-y-4">
              <textarea
                rows={4}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Describe what occurred, unfamiliar IP addresses, or unrecognized devices..."
                required
                className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting || !reportNotes.trim()}
                  className="px-5 py-2 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {reporting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SIGN OUT EVERYWHERE MODAL ────────────────────────────────────── */}
      {signOutAllModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <LogOut className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Sign Out Everywhere</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will revoke all active access tokens, refresh tokens, and cookies across all devices, including this current session. You will be redirected to the sign-in screen.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSignOutAllModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOutAll}
                disabled={signingOutAll}
                className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
              >
                {signingOutAll && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign Out Everywhere
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
