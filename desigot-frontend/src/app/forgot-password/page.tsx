"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/store/ui.store";
import { apiPost, getErrorMessage } from "@/lib/api";
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiPost("/auth/forgot-password", { email });
      setIsSent(true);
      toast.success("Password reset instructions sent!");
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
          <h1 className="text-2xl font-bold text-ink-primary">Reset your password</h1>
          <p className="text-ink-secondary text-sm mt-1">
            Enter your email and we will send you a password reset link
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
          {isSent ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-ink-primary">Check your inbox</h2>
              <p className="text-xs text-ink-secondary leading-relaxed">
                If an account exists for <strong className="text-ink-primary">{email}</strong>, you will receive an email with instructions to reset your password.
              </p>
              <Link href="/login" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  Return to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                className="mt-2"
              >
                Send Reset Link
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
