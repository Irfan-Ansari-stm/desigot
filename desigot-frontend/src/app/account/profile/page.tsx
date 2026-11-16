"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AccountNav } from "@/components/account/AccountNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth.store";
import { useMyProfile, useUpdateProfile } from "@/hooks/useAccount";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { User, Mail, Phone, Globe, FileText, CheckCircle2 } from "lucide-react";

export default function AccountProfilePage() {
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPhone(profile.phone || "");
      setCountry(profile.country || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
    } else if (user) {
      setDisplayName(user.display_name || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        phone,
        country,
        bio,
        avatar_url: avatarUrl,
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <AccountNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-ink-primary">Profile Information</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Manage your personal profile details, contact information, and public bio.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-surface-100 rounded-xl" />
              <div className="h-10 bg-surface-100 rounded-xl" />
              <div className="h-24 bg-surface-100 rounded-xl" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Preview */}
              <div className="flex items-center gap-5 pb-6 border-b border-border">
                <div className="w-20 h-20 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-2xl overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{displayName?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    Profile Avatar URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                  <p className="text-xs text-ink-tertiary mt-1">
                    Paste an image URL for your profile photo
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-ink-tertiary" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-ink-tertiary" />
                    <input
                      type="email"
                      disabled
                      value={profile?.email || user?.email || ""}
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-border bg-surface-100 text-ink-tertiary cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-ink-tertiary mt-1">Email cannot be changed directly</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-ink-tertiary" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-ink-tertiary" />
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United States"
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                  Bio / About You
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell sellers and creators a little about your design preferences and business..."
                  className="w-full p-3.5 text-sm rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  type="submit"
                  loading={updateProfile.isPending}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
