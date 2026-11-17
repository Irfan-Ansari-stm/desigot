"use client";

import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  Briefcase,
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Send,
  KeyRound,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Loader2
} from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { ProfileNavHeader, ProfileData } from "@/components/profile/ProfileNavHeader";

export default function MyProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [initialData, setInitialData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Email verification state
  const [sendingEmailVerif, setSendingEmailVerif] = useState(false);
  const [emailVerifSent, setEmailVerifSent] = useState(false);
  const [emailTokenModal, setEmailTokenModal] = useState(false);
  const [emailTokenInput, setEmailTokenInput] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  // Phone verification state
  const [phoneOtpModal, setPhoneOtpModal] = useState(false);
  const [phoneOtpInput, setPhoneOtpInput] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await apiGet<any>("/account/profile");
      const data = res?.data || res;
      setProfile(data);
      const initial = {
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        display_name: data.display_name || "",
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
        gender: data.gender || "",
        dob: data.dob ? String(data.dob).substring(0, 10) : "",
        job_title: data.job_title || "",
        company: data.company || "",
        department: data.department || "",
        country: data.country || "India",
        state: data.state || "",
        city: data.city || "",
        address: data.address || "",
        postal_code: data.postal_code || "",
        bio: data.bio || "",
        website: data.website || "",
        linkedin_url: data.linkedin_url || "",
        github_url: data.github_url || "",
        portfolio_url: data.portfolio_url || "",
      };
      setFormData(initial);
      setInitialData(initial);
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(initialData);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await apiPatch<any>("/account/profile", formData);
      const updated = res?.data || res;
      setProfile(updated);
      setSuccessMsg("Personal profile information saved successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Profile save error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  // Email verification handlers
  const handleSendEmailVerification = async () => {
    setSendingEmailVerif(true);
    setErrorMsg("");
    try {
      await apiPost("/account/email/send-verification");
      setEmailVerifSent(true);
      setEmailTokenModal(true);
      setSuccessMsg("Verification token dispatched to your email address.");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to send email verification");
    } finally {
      setSendingEmailVerif(false);
    }
  };

  const handleVerifyEmailToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTokenInput.trim()) return;
    setVerifyingEmail(true);
    setErrorMsg("");
    try {
      await apiPost("/account/email/verify", { token: emailTokenInput.trim() });
      setEmailTokenModal(false);
      setEmailTokenInput("");
      setSuccessMsg("Email verified successfully!");
      fetchProfile();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Invalid or expired verification token");
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Phone OTP handlers
  const handleSendPhoneOtp = async () => {
    if (!formData.phone) {
      setErrorMsg("Please enter a valid phone number first.");
      return;
    }
    setSendingOtp(true);
    setErrorMsg("");
    try {
      await apiPost("/account/phone/send-otp", { phone: formData.phone });
      setPhoneOtpModal(true);
      setOtpCooldown(60);
      setSuccessMsg(`OTP sent to ${formData.phone}. Please check your messages.`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to dispatch phone OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtpInput.trim()) return;
    setVerifyingOtp(true);
    setErrorMsg("");
    try {
      await apiPost("/account/phone/verify", { otp: phoneOtpInput.trim(), phone: formData.phone });
      setPhoneOtpModal(false);
      setPhoneOtpInput("");
      setSuccessMsg("Phone number verified successfully!");
      fetchProfile();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Invalid or expired verification code");
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Reusable Profile Navigation & Header */}
      <ProfileNavHeader
        profile={profile}
        onRefresh={fetchProfile}
        loading={loading}
        successMsg={successMsg}
        errorMsg={errorMsg}
        onDismissAlert={() => { setSuccessMsg(""); setErrorMsg(""); }}
        onAvatarUpdated={(newUrl) => {
          if (profile) setProfile({ ...profile, avatar_url: newUrl || undefined });
        }}
      />

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION A: Personal Identity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <UserIcon className="h-4 w-4 text-indigo-600" /> Personal Identity & Display Name
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name || ""}
                onChange={handleChange}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name || ""}
                onChange={handleChange}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name || ""}
                onChange={handleChange}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Shown publicly on listings, reviews, and messaging.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username (@handle)
              </label>
              <input
                type="text"
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                placeholder="vikram.desigot"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender (Optional)
              </label>
              <select
                name="gender"
                value={formData.gender || ""}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth (Optional)
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob || ""}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: Contact & Verification */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Mail className="h-4 w-4 text-indigo-600" /> Contact Channels & Security Verification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Email Address & Verification */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  required
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {profile?.email_verified_at ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="h-4 w-4" /> Verified on {new Date(profile.email_verified_at).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <AlertTriangle className="h-4 w-4" /> Unverified Email
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendEmailVerification}
                    disabled={sendingEmailVerif}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold underline disabled:opacity-50"
                  >
                    {sendingEmailVerif ? "Sending..." : profile?.email_verified_at ? "Resend Token" : "Send Verification"}
                  </button>
                  {emailVerifSent && (
                    <button
                      type="button"
                      onClick={() => setEmailTokenModal(true)}
                      className="text-xs text-slate-700 dark:text-slate-300 font-semibold underline"
                    >
                      Enter Token
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Phone Number & Verification */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone Number (E.164 Format)
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {profile?.phone_verified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="h-4 w-4" /> Phone Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {formData.phone ? "Pending OTP verification" : "No phone registered"}
                  </span>
                )}

                {formData.phone && (
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={sendingOtp || otpCooldown > 0}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold underline disabled:opacity-50"
                  >
                    {sendingOtp ? "Sending..." : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : "Send OTP"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: Professional & Organization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Briefcase className="h-4 w-4 text-indigo-600" /> Professional Role & Corporate Context
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Professional Title / Role
              </label>
              <input
                type="text"
                name="job_title"
                value={formData.job_title || ""}
                onChange={handleChange}
                placeholder="Lead Systems Architect"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                name="company"
                value={formData.company || ""}
                onChange={handleChange}
                placeholder="Desigot Global Technologies"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department || ""}
                onChange={handleChange}
                placeholder="Platform Engineering"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Professional Biography
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio || ""}
              onChange={handleChange}
              placeholder="Tell buyers, colleagues, and collaborators about your background, experience, and expertise..."
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* SECTION D: Address & Location */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <MapPin className="h-4 w-4 text-indigo-600" /> Physical Address & Geographic Location
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Country
              </label>
              <select
                name="country"
                value={formData.country || "India"}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Germany">Germany</option>
                <option value="Australia">Australia</option>
                <option value="Singapore">Singapore</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                State / Province
              </label>
              <input
                type="text"
                name="state"
                value={formData.state || ""}
                onChange={handleChange}
                placeholder="Maharashtra"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city || ""}
                onChange={handleChange}
                placeholder="Mumbai"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="404 Innovation Tower, Cyber City"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Postal / Zip Code
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code || ""}
                onChange={handleChange}
                placeholder="400051"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION E: Online Presence & Portfolios */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Globe className="h-4 w-4 text-indigo-600" /> Online Presence, Social & Portfolio Links
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Website URL
              </label>
              <input
                type="url"
                name="website"
                value={formData.website || ""}
                onChange={handleChange}
                placeholder="https://vikram.io"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url || ""}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/vikram-desigot"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GitHub Profile URL
              </label>
              <input
                type="url"
                name="github_url"
                value={formData.github_url || ""}
                onChange={handleChange}
                placeholder="https://github.com/desigot-team"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Portfolio / Dribbble / Behance URL
              </label>
              <input
                type="url"
                name="portfolio_url"
                value={formData.portfolio_url || ""}
                onChange={handleChange}
                placeholder="https://dribbble.com/vikram"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="h-4 w-4" /> Cancel / Reset
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Profile Changes
          </button>
        </div>
      </form>

      {/* ── EMAIL VERIFICATION MODAL ────────────────────────────────────── */}
      {emailTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Mail className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Enter Email Verification Token</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              We dispatched a secure 6-character token to <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formData.email}</span>.
            </p>

            <form onSubmit={handleVerifyEmailToken} className="space-y-4">
              <input
                type="text"
                value={emailTokenInput}
                onChange={(e) => setEmailTokenInput(e.target.value)}
                placeholder="e.g. 849201"
                required
                className="w-full text-center tracking-widest text-lg font-mono font-bold px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailTokenModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingEmail || !emailTokenInput.trim()}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {verifyingEmail ? "Verifying..." : "Verify Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PHONE OTP MODAL ─────────────────────────────────────────────── */}
      {phoneOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Phone className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Verify Phone Number OTP</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please enter the 6-digit one-time passcode sent to <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formData.phone}</span>.
            </p>

            <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={phoneOtpInput}
                onChange={(e) => setPhoneOtpInput(e.target.value)}
                placeholder="• • • • • •"
                required
                className="w-full text-center tracking-widest text-2xl font-mono font-bold px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSendPhoneOtp}
                  disabled={otpCooldown > 0}
                  className="text-xs text-indigo-600 font-semibold underline disabled:opacity-50"
                >
                  {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : "Resend code"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPhoneOtpModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingOtp || phoneOtpInput.length < 6}
                    className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {verifyingOtp ? "Verifying..." : "Confirm OTP"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
