"use client";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { useSellerOverview } from "@/hooks/useAnalytics";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const PERIODS = [{ label: "7d", value: 7 }, { label: "30d", value: 30 }, { label: "90d", value: 90 }];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const earningsFormatter = (v: any) => [`$${Number(v).toFixed(2)}`, "Earnings"];

export function RevenueChart() {
  const [period, setPeriod] = useState(30);
  const { data, isLoading } = useSellerOverview(period);

  const chartData = (data?.daily_revenue || []).map((d) => ({
    date: format(parseISO(d.day), "MMM d"),
    earnings: d.earnings / 100,
    orders: d.order_count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <div className="flex items-center gap-1 bg-surface-50 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all",
                period === p.value ? "bg-white shadow-sm text-ink-primary" : "text-ink-secondary hover:text-ink-primary")}>
              {p.label}
            </button>
          ))}
        </div>
      </CardHeader>
      {isLoading ? (
        <div className="h-48 bg-surface-50 rounded-lg animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-ink-secondary">No revenue data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#E94560" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#E94560" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E4F0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ border: "1px solid #E0E4F0", borderRadius: 8, fontSize: 12 }} formatter={earningsFormatter} />
            <Area type="monotone" dataKey="earnings" stroke="#E94560" strokeWidth={2} fill="url(#earningsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
