"use client";
// @ts-nocheck
"use client";
import { usePlatformMetrics } from "@/hooks/useAnalytics";
import { usePlatformRevenue, useUserGrowth, useTopSellers } from "@/hooks/useAnalytics";
import { StatCard, Card } from "@/components/ui/Card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatPrice, formatDate } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Users, ShoppingBag, Package, DollarSign, AlertTriangle, Star } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: metrics, isLoading } = usePlatformMetrics();
  const { data: revenue } = usePlatformRevenue(30);
  const { data: growth  } = useUserGrowth(30);
  const { data: topSellers } = useTopSellers(5);
  const m = metrics as Record<string, number | string> | undefined;

  const revenueChart = (revenue as { day: string; gmv: number; platform_revenue: number }[] | undefined)?.map((d) => ({
    date: format(parseISO(d.day), "MMM d"),
    gmv:      parseFloat((d.gmv / 100).toFixed(2)),
    revenue:  parseFloat((d.platform_revenue / 100).toFixed(2)),
  })) || [];

  const growthChart = (growth as { day: string; new_users: number; new_sellers: number }[] | undefined)?.map((d) => ({
    date: format(parseISO(d.day), "MMM d"),
    users:   d.new_users,
    sellers: d.new_sellers,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Admin Dashboard</h1>
        <p className="text-sm text-ink-secondary">Platform overview and health metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Users",       value: (m?.total_active_users as number)?.toLocaleString() || "—",    icon: <Users className="h-5 w-5" /> },
          { label: "Verified Sellers",   value: (m?.total_verified_sellers as number)?.toLocaleString() || "—", icon: <Star className="h-5 w-5" /> },
          { label: "Live Listings",      value: (m?.total_approved_listings as number)?.toLocaleString() || "—",icon: <Package className="h-5 w-5" /> },
          { label: "Orders (24h)",       value: (m?.orders_last_24h as number) || 0,                            icon: <ShoppingBag className="h-5 w-5" /> },
          { label: "Revenue (30d)",      value: m?.revenue_last_30d_cents ? formatPrice(m.revenue_last_30d_cents as number) : "—", icon: <DollarSign className="h-5 w-5" /> },
          { label: "GMV (30d)",          value: m?.gmv_last_30d_cents ? formatPrice(m.gmv_last_30d_cents as number) : "—",         icon: <DollarSign className="h-5 w-5" /> },
          { label: "Open Disputes",      value: (m?.open_disputes as number) || 0,   icon: <AlertTriangle className="h-5 w-5 text-warning" /> },
          { label: "Pending Reviews",    value: (m?.pending_review_count as number) || 0, icon: <Package className="h-5 w-5 text-accent" /> },
        ].map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} loading={isLoading} />
        ))}
      </div>

      {(m?.open_disputes as number ?? 0) > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-primary">{m?.open_disputes as number} open dispute(s) require attention</p>
            {(m?.overdue_disputes as number) > 0 && <p className="text-xs text-warning mt-0.5">{Number(m?.overdue_disputes ?? 0)} past SLA deadline</p>}
          </div>
          <Link href="/admin/disputes" className="text-sm text-warning font-medium hover:underline">Review →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-base font-semibold text-ink-primary mb-4">Platform Revenue (30d)</h3>
          {revenueChart.length === 0 ? <div className="h-48 flex items-center justify-center text-sm text-ink-secondary">No data</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChart} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E94560" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E94560" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E4F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: unknown, name: unknown) => [`$${Number(v).toFixed(2)}`, name === "gmv" ? "GMV" : "Revenue"]} />
                <Area type="monotone" dataKey="gmv" stroke="#1A1A2E" strokeWidth={1.5} fill="none" />
                <Area type="monotone" dataKey="revenue" stroke="#E94560" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-ink-primary mb-4">User Growth (30d)</h3>
          {growthChart.length === 0 ? <div className="h-48 flex items-center justify-center text-sm text-ink-secondary">No data</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={growthChart} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E4F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="users" stroke="#1A1A2E" strokeWidth={2} fill="#1A1A2E" fillOpacity={0.05} />
                <Area type="monotone" dataKey="sellers" stroke="#E94560" strokeWidth={2} fill="#E94560" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {(topSellers as { id: string; display_name: string; total_sales: number; avg_seller_rating?: number }[] | undefined)?.length > 0 && (  // eslint-disable-next-line
        <Card padding="none">
          <div className="px-6 py-4 border-b border-border"><h3 className="text-base font-semibold text-ink-primary">Top Sellers</h3></div>
          <div className="divide-y divide-border">
            {(topSellers as { id: string; display_name: string; total_sales: number; avg_seller_rating?: number; lifetime_gmv_cents?: number }[]).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 px-6 py-3 hover:bg-surface-50">
                <span className="text-sm font-bold text-ink-secondary w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-primary">{s.display_name}</p>
                  <p className="text-xs text-ink-secondary">{s.total_sales} sales</p>
                </div>
                {s.lifetime_gmv_cents && <span className="text-sm font-semibold text-ink-primary">{formatPrice(s.lifetime_gmv_cents)}</span>}
                {s.avg_seller_rating && <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning" /><span className="text-xs font-medium">{parseFloat(s.avg_seller_rating as unknown as string)?.toFixed(1)}</span></div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-base font-semibold text-ink-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { href: "/admin/listings", label: "Review Listings" },
            { href: "/admin/disputes", label: "Resolve Disputes" },
            { href: "/admin/users",    label: "Manage Users" },
            { href: "/admin/config",   label: "Platform Config" },
            { href: "/admin/analytics",label: "Analytics" },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className="p-3 bg-surface-50 hover:bg-surface-100 rounded-xl text-sm font-medium text-ink-60 hover:text-ink-primary text-center transition-colors">
              {a.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
