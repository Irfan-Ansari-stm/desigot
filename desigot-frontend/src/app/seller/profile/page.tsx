"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { SellerNav } from "@/components/seller/SellerNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/auth.store";
import { useMyProfile, useUpdateProfile } from "@/hooks/useAccount";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import {
  User,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Briefcase,
  Star,
} from "lucide-react";

export default function SellerProfileSettingsPage() {
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [skills, setSkills] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
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
        bio,
        avatar_url: avatarUrl,
      });
      toast.success("Seller profile updated successfully!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <SellerNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-2xl font-black text-ink-primary">Creator Storefront Profile</h1>
            <p className="text-sm text-ink-secondary mt-1">
              Customize how your profile appears to buyers on the public marketplace.
            </p>
          </div>
          {user?.username && (
            <Link href={`/sellers/${user.username}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                View Public Storefront
              </Button>
            </Link>
          )}
        </div>

        <Card className="p-6 sm:p-8">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-surface-100 rounded-xl" />
              <div className="h-24 bg-surface-100 rounded-xl" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-5 pb-6 border-b border-border">
                <div className="w-20 h-20 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-2xl overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Seller Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{displayName?.[0]?.toUpperCase() || "S"}</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    Storefront Avatar URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                  <p className="text-xs text-ink-tertiary mt-1">
                    Square ratio recommended (at least 400x400px)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                  Creator Display Name / Brand Studio Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                  Professional Bio & Studio Pitch
                </label>
                <textarea
                  rows={5}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your design specialties, software proficiencies, and studio experience..."
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
                  Save Storefront Profile
                </Button>
              </div>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
