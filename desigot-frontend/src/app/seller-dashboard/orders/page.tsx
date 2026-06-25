"use client";
import { useState } from "react";
import { useMyOrders } from "@/hooks/useOrders";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice, formatDate } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import type { Order } from "@/types";

export default function SellerOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data, isLoading } = useMyOrders("seller", { status: status || undefined, page });
  const orders = (data as { data: Order[]; pagination: { totalPages: number; total: number } } | undefined);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-primary">Orders</h1>
          <p className="text-sm text-ink-secondary">{orders?.pagination?.total || 0} total orders</p></div>
        <Select options={[
          { value: "", label: "All Status" }, { value: "pending", label: "Pending" },
          { value: "active", label: "Active" }, { value: "complete", label: "Complete" },
          { value: "disputed", label: "Disputed" },
        ]} value={status} onChange={setStatus} className="w-36" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : !orders?.data?.length ? (
        <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="No orders yet" description="Orders will appear here when buyers purchase your listings." />
      ) : (
        <>
          <Card padding="none">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-border">
                <tr>{["Listing", "Buyer", "License", "Amount", "Payout", "Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.data.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="font-medium text-ink-primary truncate">{o.listing_title}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-60 whitespace-nowrap">{o.buyer_name || "Buyer"}</td>
                    <td className="px-4 py-3 capitalize text-ink-60">{o.license_type}</td>
                    <td className="px-4 py-3 font-medium text-ink-primary whitespace-nowrap">{formatPrice(o.amount_cents)}</td>
                    <td className="px-4 py-3 font-semibold text-success whitespace-nowrap">{formatPrice(o.seller_payout_cents)}</td>
                    <td className="px-4 py-3 text-ink-60 whitespace-nowrap">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination page={page} totalPages={orders.pagination?.totalPages || 1} onPageChange={setPage} className="mt-4" />
        </>
      )}
    </div>
  );
}
