"use client";

import React, { useState, useEffect } from "react";
import {
  Laptop,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
  RefreshCw,
  LogOut,
  MapPin,
  Calendar,
  Loader2
} from "lucide-react";
import { apiGet, apiDelete, apiPost } from "@/lib/api";
import { ProfileNavHeader, ProfileData } from "@/components/profile/ProfileNavHeader";

export default function ActiveSessionsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Confirmation Modals
  const [revokeAllModal, setRevokeAllModal] = useState(false);
  const [selectedSessionToRevoke, setSelectedSessionToRevoke] = useState<any | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [pRes, sRes] = await Promise.all([
        apiGet<any>("/account/profile").catch(() => null),
        apiGet<any>("/account/sessions"),
      ]);
      if (pRes) setProfile(pRes?.data || pRes);
      setSessions(sRes?.data || sRes || []);
    } catch (err: any) {
      console.error("Failed to fetch sessions:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load active sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSingle = async () => {
    if (!selectedSessionToRevoke) return;
    setRevoking(true);
    setErrorMsg("");

    try {
      await apiDelete(`/account/sessions/${selectedSessionToRevoke.id}`);
      setSuccessMsg(`Session for ${selectedSessionToRevoke.device_name || "device"} terminated.`);
      setSelectedSessionToRevoke(null);
      fetchSessions();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to revoke session");
    } finally {
      setRevoking(false);
    }
  };

  const handleRevokeOthers = async () => {
    setRevoking(true);
    setErrorMsg("");

    try {
      await apiPost("/account/sessions/revoke-others", {});
      setSuccessMsg("All other active sessions have been terminated.");
      setRevokeAllModal(false);
      fetchSessions();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to revoke other sessions");
    } finally {
      setRevoking(false);
    }
  };

  const getDeviceIcon = (deviceType: string = "") => {
    const lower = deviceType.toLowerCase();
    if (lower.includes("mobile") || lower.includes("iphone") || lower.includes("android")) {
      return <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    }
    if (lower.includes("tablet") || lower.includes("ipad")) {
      return <Tablet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    }
    if (lower.includes("desktop") || lower.includes("macintosh")) {
      return <Monitor className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    }
    return <Laptop className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
  };

  return (
    <div className="space-y-6 pb-12">
      <ProfileNavHeader
        profile={profile}
        onRefresh={fetchSessions}
        loading={loading}
        successMsg={successMsg}
        errorMsg={errorMsg}
        onDismissAlert={() => { setSuccessMsg(""); setErrorMsg(""); }}
      />

      <div className="max-w-4xl space-y-6">
        {/* Header Card with Session Count and Revoke All Action */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Laptop className="h-4 w-4 text-indigo-600" /> Authorized Login Sessions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review and manage logged-in web and mobile sessions currently authorized to access your account.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSessions}
              disabled={loading}
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Refresh Sessions"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            {sessions.filter((s) => !s.is_current).length > 0 && (
              <button
                type="button"
                onClick={() => setRevokeAllModal(true)}
                className="px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" /> Terminate All Other Sessions
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {sessions.length === 0 && !loading && (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Laptop className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No active sessions found.</p>
            </div>
          )}

          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                sess.is_current
                  ? "border-indigo-300 dark:border-indigo-700/60 ring-2 ring-indigo-500/10"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getDeviceIcon(sess.device_name || sess.user_agent)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {sess.browser || "Web Browser"} on {sess.os || "Desktop OS"}
                    </span>
                    {sess.is_current && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                        Current Device
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      IP: {sess.ip_address || "127.0.0.1"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {sess.location || "Mumbai, India"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Logged in: {sess.created_at ? new Date(sess.created_at).toLocaleString() : "Recently"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Last active: {sess.last_active_at ? new Date(sess.last_active_at).toLocaleTimeString() : "Just now"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {sess.is_current ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Active Now
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedSessionToRevoke(sess)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Terminate Session
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── REVOKE SINGLE SESSION MODAL ──────────────────────────────────── */}
      {selectedSessionToRevoke && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Terminate Session</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to log out the session on{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {selectedSessionToRevoke.browser} ({selectedSessionToRevoke.ip_address})
              </span>
              ? Any unsaved work on that device will be lost.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSessionToRevoke(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeSingle}
                disabled={revoking}
                className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
              >
                {revoking && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Terminate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REVOKE ALL OTHER SESSIONS MODAL ──────────────────────────────── */}
      {revokeAllModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Terminate All Other Sessions</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This action will immediately log out your account from all other browsers, laptops, and mobile devices except this current session.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRevokeAllModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeOthers}
                disabled={revoking}
                className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
              >
                {revoking && <Loader2 className="h-4 w-4 animate-spin" />}
                Terminate All Others
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
