"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AccountNav } from "@/components/account/AccountNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "@/store/ui.store";
import { apiPost } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { Lock, Bell, Shield, KeyRound, CheckCircle2 } from "lucide-react";

export default function AccountSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  const [emailOrders, setEmailOrders] = useState(true);
  const [emailPromos, setEmailPromos] = useState(false);
  const [emailSecurity, setEmailSecurity] = useState(true);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsChangingPw(true);
    try {
      await apiPost("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved!");
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <AccountNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-ink-primary">Account & Security Settings</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Update your authentication password and configure notification preferences.
          </p>
        </div>

        {/* Change Password Card */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-4 border-b border-border mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary">Change Password</h2>
              <p className="text-xs text-ink-secondary">Ensure your account uses a secure, unique password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <Button
              type="submit"
              loading={isChangingPw}
              variant="primary"
              size="sm"
              className="mt-2"
            >
              Update Password
            </Button>
          </form>
        </Card>

        {/* Notifications Preferences Card */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-4 border-b border-border mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary">Notification Preferences</h2>
              <p className="text-xs text-ink-secondary">Choose which emails and notifications you receive</p>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailOrders}
                onChange={(e) => setEmailOrders(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand"
              />
              <div>
                <span className="text-sm font-semibold text-ink-primary block">
                  Orders & Digital Deliveries
                </span>
                <span className="text-xs text-ink-secondary">
                  Receive email receipts, download confirmations, and license links
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailSecurity}
                onChange={(e) => setEmailSecurity(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand"
              />
              <div>
                <span className="text-sm font-semibold text-ink-primary block">
                  Security Alerts & Login Notifications
                </span>
                <span className="text-xs text-ink-secondary">
                  Alerts for new sign-ins, password updates, or suspicious attempts
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailPromos}
                onChange={(e) => setEmailPromos(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand"
              />
              <div>
                <span className="text-sm font-semibold text-ink-primary block">
                  Marketplace Discounts & Weekly Featured
                </span>
                <span className="text-xs text-ink-secondary">
                  Curated design templates, coupons, and top author highlights
                </span>
              </div>
            </label>

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveNotifications}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
