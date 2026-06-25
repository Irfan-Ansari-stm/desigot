"use client";
import { useAuthStore } from "@/store/auth.store";
import { useMyOrders } from "@/hooks/useOrders";
import { useMyLicenses } from "@/hooks/useOrders";
import { Card, StatCard } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { ShoppingBag, Download, Heart, Star } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: orders } = useMyOrders("buyer");
  const { data: licenses } = useMyLicenses();
  const orderList = (orders as { data: import("@/types").Order[] } | undefined)?.data || [];
  const licenseList = (licenses as { data: import("@/types").License[] } | undefined)?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Welcome back, {user?.display_name?.split(" ")[0]}!</h1>
        <p className="text-ink-secondary text-sm">Here&apos;s your account overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={orderList.length} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard label="Active Licenses" value={licenseList.length} icon={<Download className="h-5 w-5" />} />
        <StatCard label="Saved Items" value={0} icon={<Heart className="h-5 w-5" />} />
        <StatCard label="Reviews Given" value={0} icon={<Star className="h-5 w-5" />} />
      </div>

      <Card>
        <h2 className="text-base font-semibold text-ink-primary mb-4">Recent Orders</h2>
        {orderList.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-10 w-10 text-border mx-auto mb-2" />
            <p className="text-ink-secondary text-sm">No orders yet</p>
            <Link href="/browse" className="text-accent text-sm hover:underline mt-1 block">Browse the marketplace</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orderList.slice(0, 5).map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 transition-colors group">
                <div>
                  <p className="text-sm font-medium text-ink-primary group-hover:text-accent transition-colors">{order.listing_title}</p>
                  <p className="text-xs text-ink-secondary">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink-primary">{formatPrice(order.amount_cents)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
            {orderList.length > 5 && <Link href="/dashboard/purchases" className="text-xs text-accent hover:underline block text-center pt-2">View all orders →</Link>}
          </div>
        )}
      </Card>
    </div>
  );
}
