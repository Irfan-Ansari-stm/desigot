"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { toast } from "@/store/ui.store";

function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");
    const orderId = searchParams.get("order_id");

    if (redirectStatus === "succeeded" || paymentIntent) {
      toast.success("Payment confirmed!");
      router.replace(`/checkout/success?order_id=${orderId || ""}`);
    } else if (redirectStatus === "failed") {
      toast.error("Payment failed. Please try again.");
      router.replace(`/checkout/failed?order_id=${orderId || ""}&reason=Payment+was+declined`);
    } else {
      router.replace(`/checkout/success?order_id=${orderId || ""}`);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-ink-primary">Verifying payment status...</h2>
          <p className="text-sm text-ink-secondary">Please wait while we confirm your transaction with the provider.</p>
        </div>
      </main>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-50 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
