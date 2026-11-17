"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Key,
  Copy,
  Download,
  Check,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  Mail,
  HelpCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { ProfileNavHeader, ProfileData } from "@/components/profile/ProfileNavHeader";

export default function TwoFactorAuthPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [mfaStatus, setMfaStatus] = useState<any>({ enabled: false, recovery_codes_remaining: 0, method: "totp" });
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Setup Modal State
  const [setupModal, setSetupModal] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qr_code: string; manual_entry_key: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Recovery Codes Modal
  const [recoveryModal, setRecoveryModal] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Disable 2FA Modal
  const [disableModal, setDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling, setDisabling] = useState(false);

  // Regenerate Codes Modal
  const [regenModal, setRegenModal] = useState(false);
  const [regenPassword, setRegenPassword] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [pRes, mRes] = await Promise.all([
        apiGet<any>("/account/profile").catch(() => null),
        apiGet<any>("/account/2fa").catch(() => ({ enabled: false, recovery_codes_remaining: 0 })),
      ]);
      if (pRes) setProfile(pRes?.data || pRes);
      if (mRes) setMfaStatus(mRes?.data || mRes);
    } catch (err: any) {
      console.error("Failed to load 2FA status:", err);
      setErrorMsg(err.message || "Failed to load 2FA configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Initiate TOTP Setup
  const handleStartSetup = async () => {
    setErrorMsg("");
    try {
      const res = await apiPost<any>("/account/2fa/setup", {});
      const data = res?.data || res;
      setSetupData(data);
      setTotpCode("");
      setSetupModal(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to initiate 2FA setup");
    }
  };

  // Verify TOTP Setup
  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) return;
    setVerifyingCode(true);
    setErrorMsg("");

    try {
      const res = await apiPost<any>("/account/2fa/verify-setup", { code: totpCode });
      const data = res?.data || res;
      setSetupModal(false);
      setRecoveryCodes(data?.recovery_codes || []);
      setRecoveryModal(true);
      setSuccessMsg("Two-factor authentication enabled successfully!");
      fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Invalid authenticator code. Check your device time clock.");
    } finally {
      setVerifyingCode(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return;
    setDisabling(true);
    setErrorMsg("");

    try {
      await apiPost("/account/2fa/disable", { password: disablePassword });
      setDisableModal(false);
      setDisablePassword("");
      setSuccessMsg("Two-factor authentication has been disabled.");
      fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to disable 2FA. Check password.");
    } finally {
      setDisabling(false);
    }
  };

  // Regenerate Recovery Codes
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegenerating(true);
    setErrorMsg("");

    try {
      const res = await apiPost<any>("/account/2fa/recovery-codes/regenerate", { password: regenPassword });
      const data = res?.data || res;
      setRegenModal(false);
      setRegenPassword("");
      setRecoveryCodes(data?.recovery_codes || []);
      setRecoveryModal(true);
      setSuccessMsg("Fresh set of 8 emergency recovery codes generated.");
      fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to regenerate recovery codes");
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  const downloadRecoveryCodes = () => {
    const blob = new Blob(
      [
        `DESIGOT MARKETPLACE - EMERGENCY RECOVERY CODES\nAccount: ${profile?.email}\nGenerated: ${new Date().toISOString()}\n\nEach code can be used exactly once:\n\n${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nKeep this document in a secure offline location.`
      ],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `desigot-recovery-codes-${profile?.username || "account"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      <ProfileNavHeader
        profile={profile}
        onRefresh={fetchStatus}
        loading={loading}
        successMsg={successMsg}
        errorMsg={errorMsg}
        onDismissAlert={() => { setSuccessMsg(""); setErrorMsg(""); }}
      />

      <div className="max-w-3xl space-y-6">
        {/* Security Status Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  mfaStatus.enabled
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Two-Factor Authentication (2FA)
                  {mfaStatus.enabled ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase">
                      Disabled
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Protects your account by requiring an OTP code during login in addition to your password.
                </p>
              </div>
            </div>

            <div>
              {mfaStatus.enabled ? (
                <button
                  type="button"
                  onClick={() => setDisableModal(true)}
                  className="px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                >
                  Disable 2FA
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartSetup}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" /> Enable 2FA Now
                </button>
              )}
            </div>
          </div>

          {/* Details & Recovery Codes Remaining */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium">Primary Method</span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-indigo-600" /> Authenticator App (TOTP)
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium">Active Status</span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                {mfaStatus.enabled ? "Enforced on all sign-ins" : "Optional / Not Enforced"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium">Recovery Codes Remaining</span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-500" />
                {mfaStatus.enabled ? `${mfaStatus.recovery_codes_remaining ?? 8} available` : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* METHOD A: AUTHENTICATOR APP CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-indigo-600" /> Time-Based One-Time Passcode (TOTP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compatible with Google Authenticator, 1Password, Microsoft Authenticator, Authy, or Bitwarden.
              </p>
            </div>
            {mfaStatus.enabled && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" /> Connected
              </span>
            )}
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <p className="font-semibold text-slate-800 dark:text-slate-200">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>Scan the generated QR code with your authenticator mobile application.</li>
              <li>Your app generates a new 6-digit numeric passcode every 30 seconds.</li>
              <li>Provide this passcode upon logging in alongside your password.</li>
            </ol>
          </div>

          {!mfaStatus.enabled && (
            <button
              type="button"
              onClick={handleStartSetup}
              className="px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            >
              Configure Authenticator App
            </button>
          )}
        </div>

        {/* RECOVERY CODES MANAGEMENT CARD */}
        {mfaStatus.enabled && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Key className="h-4 w-4 text-amber-500" /> Emergency Recovery Codes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Use these one-time codes if you lose access to your authenticator phone device.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRegenModal(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Regenerate Codes
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400">
              You currently have <span className="font-bold text-slate-900 dark:text-slate-100">{mfaStatus.recovery_codes_remaining ?? 8}</span> remaining valid emergency codes. Once a code is used, it is permanently discarded.
            </div>
          </div>
        )}
      </div>

      {/* ── TOTP SETUP MODAL WITH REAL QR CODE ───────────────────────────── */}
      {setupModal && setupData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-indigo-600" /> Scan QR Code
              </h3>
              <button
                type="button"
                onClick={() => setSetupModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Open your authenticator app (Google Authenticator, Authy, 1Password) and scan this QR code:
            </p>

            {/* QR Code Container */}
            <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200 w-52 mx-auto shadow-inner">
              {setupData.qr_code ? (
                <img src={setupData.qr_code} alt="2FA QR Code" className="h-44 w-44 object-contain" />
              ) : (
                <div className="h-44 w-44 flex items-center justify-center text-xs text-slate-400">QR Code Error</div>
              )}
            </div>

            {/* Manual Entry Key */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Can't scan? Enter key manually:
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all">
                  {setupData.manual_entry_key}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(setupData.manual_entry_key, setCopiedKey)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold ml-2 shrink-0"
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedKey ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Verification Code Input */}
            <form onSubmit={handleVerifySetup} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Enter 6-digit code from app to confirm:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  required
                  className="w-full text-center text-xl tracking-widest font-mono font-bold py-2.5 px-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSetupModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingCode || totpCode.length < 6}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {verifyingCode && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RECOVERY CODES DISPLAY MODAL ─────────────────────────────────── */}
      {recoveryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-600">
              <Key className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Save Your Recovery Codes</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Store these emergency recovery codes in a secure place. If you ever lose access to your 2FA device, you can sign in using any of these codes.
            </p>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200/60 dark:border-slate-800 text-center select-all">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(recoveryCodes.join("\n"), setCopiedCodes)}
                className="px-3.5 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
              >
                {copiedCodes ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCodes ? "Codes Copied" : "Copy All"}
              </button>

              <button
                type="button"
                onClick={downloadRecoveryCodes}
                className="px-3.5 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
              >
                <Download className="h-3.5 w-3.5" /> Download (.txt)
              </button>

              <button
                type="button"
                onClick={() => setRecoveryModal(false)}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISABLE 2FA CONFIRMATION MODAL ──────────────────────────────── */}
      {disableModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Disable Two-Factor Authentication</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Disabling 2FA reduces your account security. Please verify your current account password to proceed:
            </p>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter account password"
                required
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisableModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disabling || !disablePassword}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {disabling && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Disable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REGENERATE RECOVERY CODES MODAL ──────────────────────────────── */}
      {regenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Regenerate Recovery Codes</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This will permanently invalidate all previously issued recovery codes. Please enter your password to confirm:
            </p>

            <form onSubmit={handleRegenerateCodes} className="space-y-4">
              <input
                type="password"
                value={regenPassword}
                onChange={(e) => setRegenPassword(e.target.value)}
                placeholder="Enter account password"
                required
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRegenModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regenerating || !regenPassword}
                  className="px-5 py-2 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {regenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Regenerate Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
