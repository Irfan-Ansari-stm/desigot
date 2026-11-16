"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useOrder, useDownloadUrl } from "@/hooks/useOrders";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import {
  CheckCircle2,
  Download,
  FileText,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "";
  const { data: order, isLoading } = useOrder(orderId);
  const { refetch: fetchDownload, isFetching: isDownloading } = useDownloadUrl(orderId);

  const handleDownload = async () => {
    try {
      const res = await fetchDownload();
      if (res.data?.url) {
        window.location.href = res.data.url;
        toast.success("Download starting...");
      } else {
        toast.info("Download link will be active once payment clears fully.");
      }
    } catch {
      toast.error("Could not retrieve download link. Please check My Orders.");
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="bg-white border border-border rounded-3xl p-8 sm:p-10 shadow-sm text-center">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <Badge color="success" size="md" className="mb-3">
            Payment Confirmed
          </Badge>

          <h1 className="text-3xl font-extrabold text-ink-primary tracking-tight">
            Thank you for your order!
          </h1>
          <p className="text-ink-secondary text-sm mt-2 max-w-md mx-auto">
            Your transaction has been processed securely. A confirmation email with receipt and license details has been sent to your account.
          </p>

          {isLoading ? (
            <div className="my-8 h-40 bg-surface-100 rounded-2xl animate-pulse" />
          ) : order ? (
            <div className="my-8 bg-surface-50 border border-border rounded-2xl p-6 text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
                <div>
                  <span className="text-xs text-ink-tertiary uppercase tracking-wider font-semibold">Order ID</span>
                  <p className="font-mono text-xs font-semibold text-ink-primary">{order.id}</p>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs text-ink-tertiary uppercase tracking-wider font-semibold">Date</span>
                  <p className="text-xs font-medium text-ink-primary">{formatDate(order.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-ink-primary text-base">{order.listing_title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge size="sm" color="info">{order.license_type || "standard"} license</Badge>
                    <span className="text-xs text-ink-secondary">Digital Delivery</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-ink-primary">
                    {formatPrice(order.amount_cents - (order.discount_cents || 0))}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleDownload}
                  loading={isDownloading}
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Assets Now
                </Button>
                <Button
                  onClick={() => router.push(`/account/orders`)}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View in My Orders
                </Button>
              </div>
            </div>
          ) : (
            <div className="my-6 p-4 bg-surface-100 rounded-xl text-sm text-ink-secondary">
              Order reference: {orderId || "Pending confirmation"}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-border">
            <Link href="/account/orders">
              <Button variant="secondary" className="w-full sm:w-auto">
                Go to Account Orders
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost" className="w-full sm:w-auto flex items-center gap-1.5">
                Continue Browsing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-ink-tertiary">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Desigot Purchase Protection & verified author guarantee</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-50 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
