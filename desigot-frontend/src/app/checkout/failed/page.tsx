"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { XCircle, RefreshCw, ShoppingCart, HelpCircle } from "lucide-react";

function CheckoutFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const reason = searchParams.get("reason") || "The payment transaction could not be completed.";

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-16">
        <div className="bg-white border border-border rounded-3xl p-8 sm:p-10 shadow-sm text-center">
          <div className="w-20 h-20 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600">
            <XCircle className="h-10 w-10" />
          </div>

          <h1 className="text-2xl font-extrabold text-ink-primary tracking-tight">
            Payment Unsuccessful
          </h1>
          <p className="text-ink-secondary text-sm mt-2 mb-6">
            {reason} No funds were charged to your account.
          </p>

          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 text-xs text-rose-800 text-left mb-6 space-y-1">
            <p className="font-semibold">Possible reasons:</p>
            <ul className="list-disc list-inside space-y-0.5 text-rose-700">
              <li>Insufficient funds or daily card limit reached</li>
              <li>Card declined by issuing bank</li>
              <li>Session timed out or connection interrupted</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {orderId ? (
              <Button
                onClick={() => router.push(`/checkout?order_id=${orderId}`)}
                variant="primary"
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Payment
              </Button>
            ) : (
              <Button
                onClick={() => router.push(`/cart`)}
                variant="primary"
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Return to Cart
              </Button>
            )}

            <Link href="/support">
              <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-1.5">
                <HelpCircle className="h-4 w-4" />
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-50 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutFailedContent />
    </Suspense>
  );
}
