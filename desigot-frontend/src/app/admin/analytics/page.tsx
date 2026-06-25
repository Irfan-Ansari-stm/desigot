"use client";
// @ts-nocheck
"use client";
import { useState } from "react";
import { usePlatformRevenue, useUserGrowth, useTopSellers } from "@/hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, StatCard } from "@/components/ui/Card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatPrice } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { DollarSign, Users, TrendingUp, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

const PERIODS = [{ label: "7d", value: 7 }, { label: "30d", value: 30 }, { label: "90d", value: 90 }];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState(30);
  const { data: revenue } = usePlatformRevenue(period);
  const { data: growth  } = useUserGrowth(period);
  const { data: topSellers } = useTopSellers(10);
  const { data: categories } = useQuery({
    queryKey: ["category-breakdown"],
    queryFn: () => apiGet<{ name: string; listing_count: number; total_gmv: number; order_count: number }[]>("/analytics/platform/categories"),
  });

  const revenueData = (revenue as { day: string; gmv: number; platform_revenue: number; order_count: number }[] | undefined)?.map((d) => ({
    date: format(parseISO(d.day), "MMM d"),
    gmv: parseFloat((d.gmv / 100).toFixed(2)),
    revenue: parseFloat((d.platform_revenue / 100).toFixed(2)),
    orders: d.order_count,
  })) || [];

  const growthData = (growth as { day: string; new_users: number; new_sellers: number; new_buyers: number }[] | undefined)?.map((d) => ({
    date: format(parseISO(d.day), "MMM d"),
    users: d.new_users, sellers: d.new_sellers, buyers: d.new_buyers,
  })) || [];

  const totalGMV     = revenueData.reduce((s, d) => s + d.gmv, 0);
  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = revenueData.reduce((s, d) => s + d.orders, 0);
  const totalUsers   = growthData.reduce((s, d) => s + d.users, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-ink-primary">Platform Analytics</h1><p className="text-sm text-ink-secondary">Business intelligence and growth metrics</p></div>
        <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-1">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", period === p.value ? "bg-brand text-white" : "text-ink-secondary hover:text-ink-primary")}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={`GMV (${period}d)`}      value={`$${totalGMV.toFixed(0)}`}    icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label={`Revenue (${period}d)`}  value={`$${totalRevenue.toFixed(0)}`} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label={`Orders (${period}d)`}   value={totalOrders.toLocaleString()}  icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard label={`New Users (${period}d)`}value={totalUsers.toLocaleString()}   icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-base font-semibold text-ink-primary mb-4">GMV vs Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E4F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => `$${Number(v).toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="gmv"     stroke="#1A1A2E" strokeWidth={2} dot={false} name="GMV" />
              <Line type="monotone" dataKey="revenue" stroke="#E94560" strokeWidth={2} dot={false} name="Platform Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-ink-primary mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={growthData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E4F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Bar dataKey="buyers"  fill="#1A1A2E" radius={[2,2,0,0]} name="Buyers"  stackId="a" />
              <Bar dataKey="sellers" fill="#E94560" radius={[2,2,0,0]} name="Sellers" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card padding="none">
          <div className="px-6 py-4 border-b border-border"><h3 className="text-base font-semibold text-ink-primary">Revenue by Category</h3></div>
          <div className="divide-y divide-border">
            {(categories as { name: string; listing_count: number; total_gmv: number; order_count: number }[] | undefined)?.slice(0, 8).map((c) => (
              <div key={c.name} className="flex items-center gap-3 px-6 py-3 hover:bg-surface-50">
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink-primary">{c.name}</p><p className="text-xs text-ink-secondary">{c.listing_count} listings · {c.order_count} orders</p></div>
                <span className="text-sm font-semibold text-ink-primary">{formatPrice(c.total_gmv)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card padding="none">
          <div className="px-6 py-4 border-b border-border"><h3 className="text-base font-semibold text-ink-primary">Top Sellers</h3></div>
          <div className="divide-y divide-border">
            {(topSellers as { id: string; display_name: string; avatar_url?: string; total_sales: number; lifetime_gmv_cents?: number }[] | undefined)?.slice(0, 8).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 px-6 py-3 hover:bg-surface-50">
                <span className="text-xs font-bold text-ink-secondary w-4">{i + 1}</span>
                <Avatar src={s.avatar_url} name={s.display_name} size="sm" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink-primary truncate">{s.display_name}</p><p className="text-xs text-ink-secondary">{s.total_sales} sales</p></div>
                {s.lifetime_gmv_cents && <span className="text-sm font-semibold text-ink-primary">{formatPrice(s.lifetime_gmv_cents)}</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
