"use client";
import { Suspense } from "react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useOrder } from "@/hooks/useOrders";
import { useCreatePaymentIntent, useSimulatePayment } from "@/hooks/useOrders";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { Shield, CreditCard, CheckCircle2, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

function CheckoutPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("order_id") || "";
  const { data: order, isLoading } = useOrder(orderId);
  const createIntent = useCreatePaymentIntent();
  const simulatePay  = useSimulatePayment();
  const [step, setStep] = useState<"review" | "payment" | "done">("review");
  const [clientSecret, setClientSecret] = useState("");

  const handleProceedToPayment = async () => {
    try {
      const result = await createIntent.mutateAsync(orderId);
      setClientSecret(result.clientSecret);
      setStep("payment");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleSimulatePay = async () => {
    try {
      await simulatePay.mutateAsync(orderId);
      setStep("done");
      toast.success("Payment successful! 🎉");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-surface-50"><Navbar />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    </div>
  );

  if (step === "done") return (
    <div className="min-h-screen bg-surface-50"><Navbar />
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h1 className="text-3xl font-bold text-ink-primary">Purchase Complete!</h1>
        <p className="text-ink-secondary mt-2 mb-8">Your download is ready. Check your email for the invoice.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" onClick={() => router.push("/dashboard/purchases")}>View My Purchases</Button>
          <Button variant="secondary" onClick={() => router.push("/browse")}>Continue Browsing</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/browse" className="p-2 rounded-lg hover:bg-surface-100 text-ink-secondary"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-ink-primary">Checkout</h1>
            <p className="text-sm text-ink-secondary">Secure checkout powered by Stripe</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Main */}
          <div className="md:col-span-3 space-y-4">
            {step === "review" && (
              <Card>
                <h2 className="text-lg font-semibold text-ink-primary mb-4">Order Review</h2>
                {order && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-ink-primary">{order.listing_title}</p>
                        <Badge color="info" size="sm" className="mt-1">{order.license_type} license</Badge>
                      </div>
                      <p className="font-semibold text-ink-primary">{formatPrice(order.amount_cents)}</p>
                    </div>
                    {order.discount_cents > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Promo discount</span>
                        <span>-{formatPrice(order.discount_cents)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span>{formatPrice(order.amount_cents - order.discount_cents)}</span>
                    </div>
                    <div className="bg-surface-50 rounded-xl p-3 text-xs text-ink-secondary space-y-1">
                      <p className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-success" /> 7-day inspection period after purchase</p>
                      <p className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-info" /> Secure checkout — powered by Stripe</p>
                    </div>
                    <Button variant="accent" size="lg" fullWidth loading={createIntent.isPending}
                      leftIcon={<CreditCard className="h-5 w-5" />} onClick={handleProceedToPayment}>
                      Proceed to Payment
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {step === "payment" && (
              <Card>
                <h2 className="text-lg font-semibold text-ink-primary mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-success" /> Secure Payment
                </h2>
                <div className="bg-surface-50 rounded-xl p-4 mb-4 text-sm text-ink-secondary">
                  <p>In production, the Stripe payment form renders here using the client secret:</p>
                  <code className="text-xs bg-surface-100 px-2 py-1 rounded mt-2 block break-all">{clientSecret}</code>
                </div>
                <div className="space-y-3">
                  <Button variant="accent" size="lg" fullWidth loading={simulatePay.isPending}
                    leftIcon={<CreditCard className="h-5 w-5" />} onClick={handleSimulatePay}>
                    Simulate Payment (Dev Mode)
                  </Button>
                  <Button variant="ghost" size="md" fullWidth onClick={() => setStep("review")}>← Back to Review</Button>
                </div>
              </Card>
            )}
          </div>

          {/* Summary */}
          <div className="md:col-span-2">
            <Card padding="sm">
              <h3 className="font-semibold text-ink-primary mb-3">Order Summary</h3>
              {order && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-ink-secondary">Item</span><span className="font-medium text-right max-w-[120px] line-clamp-1">{order.listing_title}</span></div>
                  <div className="flex justify-between"><span className="text-ink-secondary">License</span><Badge size="sm">{order.license_type}</Badge></div>
                  <div className="flex justify-between"><span className="text-ink-secondary">Price</span><span>{formatPrice(order.amount_cents)}</span></div>
                  {order.discount_cents > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatPrice(order.discount_cents)}</span></div>}
                  <div className="border-t border-border pt-2 flex justify-between font-bold"><span>Total</span><span>{formatPrice(order.amount_cents - order.discount_cents)}</span></div>
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-ink-secondary text-center">Protected by 256-bit SSL encryption</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-50 flex items-center justify-center"><div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <CheckoutPageInner />
    </Suspense>
  );
}
