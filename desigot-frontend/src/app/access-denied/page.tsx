"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { ShieldX, Home, ArrowLeft } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-20 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-rose-50 border border-rose-200 rounded-3xl flex items-center justify-center text-rose-600 mb-6 shadow-sm">
          <ShieldX className="h-10 w-10" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-100/60 px-3 py-1 rounded-full mb-3">
          403 Forbidden
        </span>

        <h1 className="text-3xl font-extrabold text-ink-primary tracking-tight mb-2">
          Access Restricted
        </h1>
        <p className="text-sm text-ink-secondary max-w-md mb-8 leading-relaxed">
          You do not have the required permissions or account tier to view this administrative area. If you believe this is an error, please reach out to an administrator.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs">
          <Link href="/" className="w-full">
            <Button variant="primary" fullWidth className="flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full">
            <Button variant="outline" fullWidth className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              My Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
