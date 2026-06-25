"use client";
import { useState } from "react";
import { useMyOrders, useDownloadUrl } from "@/hooks/useOrders";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { formatPrice, formatDate } from "@/lib/utils";
import { Download, ShoppingBag, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Order } from "@/types";

export default function PurchasesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data, isLoading } = useMyOrders("buyer", { status: status || undefined, page });
  const orders = (data as { data: Order[]; pagination: { totalPages: number } } | undefined);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-primary">My Purchases</h1><p className="text-sm text-ink-secondary">Your order history and downloads</p></div>
        <Select options={[
          { value: "", label: "All Status" },
          { value: "pending", label: "Pending" },
          { value: "active", label: "Active" },
          { value: "complete", label: "Complete" },
          { value: "disputed", label: "Disputed" },
          { value: "refunded", label: "Refunded" },
        ]} value={status} onChange={setStatus} className="w-40" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : !orders?.data?.length ? (
        <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="No purchases yet"
          description="Your purchase history will appear here." action={{ label: "Browse Marketplace", onClick: () => window.location.href = "/browse" }} />
      ) : (
        <>
          <div className="space-y-3">
            {orders.data.map((order) => <OrderRow key={order.id} order={order} />)}
          </div>
          <Pagination page={page} totalPages={orders.pagination?.totalPages || 1} onPageChange={setPage} className="mt-6" />
        </>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const { refetch: getUrl, isFetching } = useDownloadUrl(order.id);
  const canDownload = ["active", "complete"].includes(order.status);

  const handleDownload = async () => {
    const result = await getUrl();
    if (result.data?.url) window.open(result.data.url, "_blank");
  };

  return (
    <Card padding="sm" className="hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/listing/${order.listing_slug || order.listing_id}`} className="text-sm font-semibold text-ink-primary hover:text-accent transition-colors line-clamp-1">
              {order.listing_title}
            </Link>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-ink-secondary">
            <span>{formatDate(order.created_at)}</span>
            <span>•</span>
            <span className="capitalize">{order.license_type} license</span>
            <span>•</span>
            <span className="font-medium text-ink-primary">{formatPrice(order.amount_cents)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canDownload && (
            <Button variant="secondary" size="sm" loading={isFetching} leftIcon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>
              Download
            </Button>
          )}
          <Link href={`/listing/${order.listing_slug || order.listing_id}`}>
            <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
