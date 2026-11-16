"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { useCreateOrder } from "@/hooks/useOrders";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { items, removeItem, updateQuantity, clearCart, subtotalCents } = useCartStore();
  const createOrder = useCreateOrder();

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const subtotal = subtotalCents();
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const platformFee = items.length > 0 ? 150 : 0; // $1.50 processing
  const total = Math.max(0, subtotal - discountAmount + platformFee);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === "DESIGOT10" || code === "WELCOME10") {
      setAppliedPromo(code);
      setDiscountPercent(10);
      toast.success("Promo code applied! 10% discount added.");
    } else if (code === "SAVE20") {
      setAppliedPromo(code);
      setDiscountPercent(20);
      toast.success("Promo code applied! 20% discount added.");
    } else {
      toast.error("Invalid or expired promo code");
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to proceed with your order");
      router.push("/login?redirect=/cart");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsCheckingOut(true);
    try {
      // Create order for the primary item in cart or first item
      const primaryItem = items[0];
      const listingId = primaryItem.product_id || primaryItem.service_id || primaryItem.id;
      const licenseType = primaryItem.license_type || "commercial";

      const order = await createOrder.mutateAsync({
        listing_id: listingId,
        license_type: licenseType,
        promo_code: appliedPromo || undefined,
      });

      // Clear the ordered item from cart
      removeItem(primaryItem.id);
      toast.success("Order created! Proceeding to secure payment...");
      router.push(`/checkout?order_id=${order.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb & Heading */}
        <div className="flex items-center gap-2 text-sm text-ink-secondary mb-4">
          <Link href="/" className="hover:text-brand transition-colors">Home</Link>
          <span>/</span>
          <span className="text-ink-primary font-medium">Shopping Cart</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-primary tracking-tight">Shopping Cart</h1>
            <p className="text-ink-secondary text-sm mt-1">
              Review your items and proceed to secure instant checkout
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear your cart?")) {
                  clearCart();
                  toast.info("Cart cleared");
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 self-start md:self-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear entire cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-brand/5 border border-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-brand">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-ink-primary mb-2">Your cart is empty</h2>
            <p className="text-ink-secondary text-sm mb-8 leading-relaxed">
              Explore thousands of verified design assets, UI kits, templates, and top-tier creative services on Desigot.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products">
                <Button variant="primary" className="w-full sm:w-auto">
                  Browse Digital Products
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" className="w-full sm:w-auto">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items List */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                  {/* Thumbnail */}
                  <div className="relative w-24 h-20 sm:w-28 sm:h-24 bg-surface-100 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                    {item.thumbnail_url ? (
                      <Image
                        src={item.thumbnail_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-tertiary">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge color={item.item_type === "service" ? "warning" : "info"} size="sm">
                        {item.item_type === "service" ? "Custom Service" : "Digital Asset"}
                      </Badge>
                      {item.license_type && (
                        <span className="text-xs text-ink-tertiary font-medium capitalize">
                          {item.license_type} License
                        </span>
                      )}
                      {item.package_name && (
                        <span className="text-xs text-brand font-medium">
                          {item.package_name} Package
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-ink-primary text-base truncate mb-1" title={item.title}>
                      {item.title}
                    </h3>
                    {item.seller_name && (
                      <p className="text-xs text-ink-secondary mb-2">
                        Sold by <span className="font-medium text-ink-primary">{item.seller_name}</span>
                      </p>
                    )}
                    {item.delivery_time_days && (
                      <p className="text-xs text-emerald-600 font-medium">
                        Estimated delivery: {item.delivery_time_days} days
                      </p>
                    )}
                  </div>

                  {/* Quantity & Controls */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                    <span className="text-lg font-bold text-ink-primary">
                      {formatPrice(item.price_cents * item.quantity)}
                    </span>

                    <div className="flex items-center gap-2">
                      {item.item_type === "product" && (
                        <div className="flex items-center border border-border rounded-lg bg-surface-50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-surface-200 text-ink-secondary rounded-l-lg transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-ink-primary">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-surface-200 text-ink-secondary rounded-r-lg transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-ink-tertiary hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}

              <div className="pt-4 flex items-center justify-between">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Continue Shopping
                </Link>
                <div className="flex items-center gap-2 text-xs text-ink-tertiary">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>256-bit SSL encrypted & escrow protected</span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-6 sticky top-24">
                <h2 className="text-lg font-bold text-ink-primary mb-4">Order Summary</h2>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} className="mb-6">
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                    Have a promo coupon?
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-2.5 h-4 w-4 text-ink-tertiary" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="e.g. SAVE20"
                        className="w-full pl-9 pr-3 py-2 text-sm uppercase rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                      Apply
                    </Button>
                  </div>
                  {appliedPromo && (
                    <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold mt-2 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Code &apos;{appliedPromo}&apos; applied (-{discountPercent}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedPromo(null);
                          setDiscountPercent(0);
                        }}
                        className="text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </form>

                <div className="space-y-3 text-sm border-t border-border pt-4">
                  <div className="flex justify-between text-ink-secondary">
                    <span>Items subtotal</span>
                    <span className="font-semibold text-ink-primary">{formatPrice(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({discountPercent}%)</span>
                      <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-ink-secondary">
                    <span className="flex items-center gap-1">
                      Platform processing fee
                    </span>
                    <span className="font-semibold text-ink-primary">{formatPrice(platformFee)}</span>
                  </div>

                  <div className="border-t border-border pt-3 flex justify-between items-baseline">
                    <div>
                      <span className="text-base font-bold text-ink-primary">Total</span>
                      <span className="text-xs text-ink-tertiary block">Includes all applicable platform taxes</span>
                    </div>
                    <span className="text-2xl font-black text-ink-primary">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  loading={isCheckingOut}
                  variant="primary"
                  size="lg"
                  className="w-full mt-6 flex items-center justify-center gap-2 text-base font-bold shadow-lg shadow-brand/20"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="mt-4 bg-surface-50 border border-border rounded-xl p-3 text-xs text-ink-tertiary space-y-1.5">
                  <div className="flex items-center gap-2 text-ink-secondary font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-brand" />
                    Instant digital delivery upon payment
                  </div>
                  <p>14-day money-back guarantee on eligible digital assets and escrow milestone protection on services.</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
