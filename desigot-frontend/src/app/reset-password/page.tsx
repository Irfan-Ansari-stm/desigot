"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/store/ui.store";
import { apiPost, getErrorMessage } from "@/lib/api";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Missing password reset token. Please request a new link.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await apiPost("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      setIsSuccess(true);
      toast.success("Password reset successfully! You can now sign in.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center">
              <span className="text-white font-black">D</span>
            </div>
            <span className="font-black text-xl text-brand">Desigot</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink-primary">Set new password</h1>
          <p className="text-ink-secondary text-sm mt-1">
            Choose a strong password with at least 8 characters
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-ink-primary">Password Updated!</h2>
              <p className="text-xs text-ink-secondary">
                Your password has been changed successfully. You may now sign in with your new credentials.
              </p>
              <Link href="/login" className="block pt-2">
                <Button variant="primary" size="sm" className="w-full">
                  Sign in now
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New password"
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Input
                label="Confirm new password"
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                className="mt-2"
              >
                Reset Password
              </Button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-brand font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-50 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
