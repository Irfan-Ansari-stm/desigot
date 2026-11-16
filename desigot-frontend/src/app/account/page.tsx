"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AccountNav } from "@/components/account/AccountNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/auth.store";
import { useMyProfile, useMyWishlists } from "@/hooks/useAccount";
import { useMyOrders } from "@/hooks/useOrders";
import { useMyProjects } from "@/hooks/useProjects";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  CalendarCheck,
  Heart,
  User,
  ArrowRight,
  Shield,
  Download,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function AccountOverviewPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { data: profile } = useMyProfile();
  const { data: ordersData, isLoading: ordersLoading } = useMyOrders("buyer");
  const { data: projectsData } = useMyProjects("buyer");
  const { data: wishlistsData } = useMyWishlists();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/account");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const orders = ordersData?.data || [];
  const projects = projectsData?.data || [];
  const wishlists = Array.isArray(wishlistsData) ? wishlistsData : wishlistsData?.data || [];
  const totalSaved = wishlists.reduce((acc: number, w: any) => acc + (w.item_count || 0), 0);

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <AccountNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        {/* Profile Welcome Banner */}
        <div className="bg-white border border-border rounded-3xl p-6 sm:p-8 mb-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-2xl overflow-hidden flex-shrink-0">
              {profile?.avatar_url || user?.avatar_url ? (
                <img
                  src={profile?.avatar_url || user?.avatar_url}
                  alt={user?.display_name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.display_name?.[0]?.toUpperCase() || "U"}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-ink-primary">
                  {user?.display_name || "Welcome back"}
                </h1>
                <Badge color="info" size="sm" className="capitalize">
                  {user?.role || "Customer"}
                </Badge>
              </div>
              <p className="text-sm text-ink-secondary">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-ink-tertiary">
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" /> Verified Account
                </span>
                <span>•</span>
                <span>Member since {formatDate(user?.created_at || new Date().toISOString())}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/account/profile">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </Link>
            {user?.role === "seller" ? (
              <Link href="/seller/dashboard">
                <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Seller Studio
                </Button>
              </Link>
            ) : (
              <Link href="/seller/onboarding">
                <Button variant="accent" size="sm" className="flex items-center gap-1.5">
                  Become a Seller
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/account/orders" className="block group">
            <Card className="p-5 group-hover:border-brand/40 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Orders</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-ink-primary">{orders.length}</p>
              <p className="text-xs text-ink-secondary mt-1 flex items-center gap-1">
                Completed purchases <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </Card>
          </Link>

          <Link href="/account/bookings" className="block group">
            <Card className="p-5 group-hover:border-brand/40 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Active Bookings</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-ink-primary">{projects.length}</p>
              <p className="text-xs text-ink-secondary mt-1 flex items-center gap-1">
                Service milestones <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </Card>
          </Link>

          <Link href="/account/favorites" className="block group">
            <Card className="p-5 group-hover:border-brand/40 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Saved Items</span>
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Heart className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-ink-primary">{totalSaved}</p>
              <p className="text-xs text-ink-secondary mt-1 flex items-center gap-1">
                In wishlists <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </Card>
          </Link>

          <Link href="/account/profile" className="block group">
            <Card className="p-5 group-hover:border-brand/40 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Account Tier</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-ink-primary capitalize">{user?.role || "Buyer"}</p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                Active & verified
              </p>
            </Card>
          </Link>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white border border-border rounded-3xl p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-ink-primary">Recent Orders</h2>
              <p className="text-xs text-ink-secondary">Your latest marketplace purchases and digital assets</p>
            </div>
            <Link
              href="/account/orders"
              className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
            >
              View all orders
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-surface-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-surface-100 text-ink-tertiary rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="font-semibold text-ink-primary text-sm">No orders placed yet</p>
              <p className="text-xs text-ink-secondary mt-1 mb-4">
                Explore thousands of UI kits, templates, and 3D graphics on Desigot.
              </p>
              <Link href="/products">
                <Button variant="primary" size="sm">Browse Digital Products</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-ink-primary text-sm">{order.listing_title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-ink-secondary">
                      <Badge size="sm" color={order.status === "complete" ? "success" : "default"}>
                        {order.status}
                      </Badge>
                      <span>•</span>
                      <span>{formatDate(order.created_at)}</span>
                      <span>•</span>
                      <span className="font-medium text-ink-primary">
                        {formatPrice(order.amount_cents - (order.discount_cents || 0))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/checkout/success?order_id=${order.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Bookings / Services Section */}
        <div className="bg-white border border-border rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-ink-primary">Active Service Bookings</h2>
              <p className="text-xs text-ink-secondary">Monitor milestone progress and seller deliveries</p>
            </div>
            <Link
              href="/account/bookings"
              className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
            >
              View all bookings
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-surface-100 text-ink-tertiary rounded-xl flex items-center justify-center mx-auto mb-3">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <p className="font-semibold text-ink-primary text-sm">No active service bookings</p>
              <p className="text-xs text-ink-secondary mt-1 mb-4">
                Need custom design work? Hire top vetted creators for UI/UX, branding, and development.
              </p>
              <Link href="/services">
                <Button variant="outline" size="sm">Explore Creative Services</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projects.slice(0, 3).map((proj) => (
                <div key={proj.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-ink-primary text-sm">{proj.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-ink-secondary">
                      <Badge size="sm" color="warning">{proj.status}</Badge>
                      <span>•</span>
                      <span>Created {formatDate(proj.created_at)}</span>
                    </div>
                  </div>
                  <Link href={`/projects/${proj.id}`}>
                    <Button variant="secondary" size="sm">Open Workspace</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
