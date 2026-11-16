"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { apiPost, getErrorMessage } from "@/lib/api";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        await apiPost("/auth/verify-email", { token });
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMsg(getErrorMessage(err));
      }
    }

    if (token) {
      verify();
    } else {
      setStatus("error");
      setErrorMsg("No verification token was provided.");
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-12">
      <div className="w-full max-w-md bg-white border border-border rounded-3xl p-8 shadow-sm text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center">
            <span className="text-white font-black">D</span>
          </div>
          <span className="font-black text-xl text-brand">Desigot</span>
        </Link>

        {status === "loading" && (
          <div className="space-y-4 py-8">
            <div className="h-10 w-10 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-ink-primary">Verifying your email...</h2>
            <p className="text-xs text-ink-secondary">Please wait a moment while we confirm your email address.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-ink-primary">Email Verified!</h2>
            <p className="text-sm text-ink-secondary">
              Your email address has been successfully verified. You now have full access to marketplace features.
            </p>
            <div className="pt-4">
              <Link href="/dashboard">
                <Button variant="primary" fullWidth className="flex items-center justify-center gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-ink-primary">Verification Failed</h2>
            <p className="text-sm text-ink-secondary">
              {errorMsg || "The verification link is invalid or has expired."}
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Link href="/login">
                <Button variant="primary" fullWidth>
                  Return to Sign In
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="ghost" fullWidth size="sm">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-50 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
