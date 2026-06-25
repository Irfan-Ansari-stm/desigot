"use client";
// @ts-nocheck
"use client";
import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { useSellerOverview, useTopListings, useConversionFunnel, useRevenueByLicense } from "@/hooks/useAnalytics";
import { StatCard, Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";
import { DollarSign, ShoppingBag, Eye, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const PERIODS = [{ label: "7d", value: 7 }, { label: "30d", value: 30 }, { label: "90d", value: 90 }];
const LICENSE_COLORS = { personal: "#1A1A2E", commercial: "#E94560", extended: "#533483" };

export default function SellerAnalyticsPage() {
  const [period, setPeriod] = useState(30);
  const { data: overview, isLoading } = useSellerOverview(period);
  const { data: topListings } = useTopListings(10);
  const { data: funnel } = useConversionFunnel(period);
  const { data: byLicense } = useRevenueByLicense(period);

  const chartData = (overview?.daily_revenue || []).map((d) => ({
    date: format(parseISO(d.day), "MMM d"),
    earnings: parseFloat((d.earnings / 100).toFixed(2)),
    orders: d.order_count,
  }));

  const licenseData = (byLicense as { license_type: string; order_count: number; total_earnings: number }[] | undefined) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-primary">Analytics</h1><p className="text-sm text-ink-secondary">Your performance metrics</p></div>
        <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-1">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", period === p.value ? "bg-brand text-white" : "text-ink-secondary hover:text-ink-primary")}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Earnings", value: formatPrice(overview?.summary?.total_earnings || 0), icon: <DollarSign className="h-5 w-5" /> },
          { label: `Orders (${period}d)`, value: overview?.summary?.orders_period || 0, icon: <ShoppingBag className="h-5 w-5" /> },
          { label: "Conversion Rate", value: funnel ? `${funnel.conversion_rate || 0}%` : "—", icon: <TrendingUp className="h-5 w-5" /> },
          { label: "Avg. Rating", value: overview?.reviews ? parseFloat(overview.reviews.avg_rating as unknown as string)?.toFixed(1) || "—" : "—", icon: <Star className="h-5 w-5" /> },
        ].map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} loading={isLoading} />
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <h2 className="text-base font-semibold text-ink-primary mb-4">Revenue Over Time</h2>
        {chartData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-ink-secondary">No revenue data for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E94560" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E94560" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E4F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: unknown) => [`$${Number(v).toFixed(2)}`, "Earnings"]} contentStyle={{ borderRadius: 8, border: "1px solid #E0E4F0", fontSize: 12 }} />
              <Area type="monotone" dataKey="earnings" stroke="#E94560" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Orders bar chart */}
        <Card>
          <h2 className="text-base font-semibold text-ink-primary mb-4">Daily Orders</h2>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-ink-secondary">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E4F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="orders" fill="#1A1A2E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Revenue by license */}
        <Card>
          <h2 className="text-base font-semibold text-ink-primary mb-4">Revenue by License</h2>
          {licenseData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-ink-secondary">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={licenseData} dataKey="total_earnings" nameKey="license_type" cx="50%" cy="50%" outerRadius={70}
                  label={({ name, percent }: {name?: string; percent?: number}) => name && percent !== undefined ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}>
                  {licenseData.map((entry, i) => (
                    <Cell key={entry.license_type} fill={Object.values(LICENSE_COLORS)[i % 3] ?? '#1A1A2E'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatPrice(v as number)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Top listings table */}
      {(topListings as { id: string; title: string; total_sales: number; total_revenue_cents: number; avg_rating?: number; view_count?: number }[] | undefined)?.length > 0 && (  // eslint-disable-next-line
        <Card padding="none">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-ink-primary">Top Listings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-border">
                <tr>{["Listing", "Sales", "Revenue", "Views", "Rating"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(topListings as { id: string; title: string; total_sales: number; total_revenue_cents: number; avg_rating?: number; view_count?: number }[]).map((l) => (
                  <tr key={l.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink-primary max-w-xs truncate">{l.title}</td>
                    <td className="px-4 py-3 text-ink-60">{l.total_sales}</td>
                    <td className="px-4 py-3 font-semibold text-ink-primary">{formatPrice(l.total_revenue_cents)}</td>
                    <td className="px-4 py-3 text-ink-60">{(l.view_count || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {l.avg_rating ? (
                        <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning" /><span className="font-medium">{parseFloat(l.avg_rating as unknown as string)?.toFixed(1)}</span></span>
                      ) : <span className="text-ink-secondary/40">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
