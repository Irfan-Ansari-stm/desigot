"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AccountNav } from "@/components/account/AccountNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useMyOrders, useDownloadUrl } from "@/hooks/useOrders";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import {
  ShoppingBag,
  Download,
  ExternalLink,
  Search,
  FileCheck,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function AccountOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { data: ordersData, isLoading } = useMyOrders("buyer");

  const orders = ordersData?.data || [];

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      searchTerm.trim() === "" ||
      order.listing_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <AccountNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-2xl font-black text-ink-primary">My Orders</h1>
            <p className="text-sm text-ink-secondary mt-1">
              Access your digital downloads, invoices, and purchase records.
            </p>
          </div>
          <Link href="/products">
            <Button variant="primary" size="sm" className="flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              Browse More Assets
            </Button>
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-border rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {["all", "complete", "pending", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors capitalize ${
                  statusFilter === status
                    ? "bg-brand text-white"
                    : "text-ink-secondary hover:bg-surface-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-tertiary" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-border bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        {/* Orders Table / Cards */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-ink-tertiary">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-ink-primary text-base mb-1">No orders found</h3>
            <p className="text-xs text-ink-secondary mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters or search terms."
                : "You haven't made any purchases yet."}
            </p>
            <Link href="/products">
              <Button variant="outline" size="sm">Explore Digital Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="p-5 sm:p-6 hover:shadow-sm transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-ink-tertiary font-semibold">
                        #{order.id.slice(0, 8)}
                      </span>
                      <Badge
                        color={
                          order.status === "paid"
                            ? "success"
                            : order.status === "pending"
                            ? "warning"
                            : "default"
                        }
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                      <span className="text-xs text-ink-secondary font-medium">
                        {order.license_type || "commercial"} license
                      </span>
                    </div>

                    <h3 className="font-bold text-ink-primary text-base truncate">
                      {order.listing_title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-ink-secondary">
                      <span>Purchased on {formatDate(order.created_at)}</span>
                      <span>•</span>
                      <span className="font-semibold text-ink-primary">
                        {formatPrice(order.amount_cents - (order.discount_cents || 0))}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                    <Link href={`/checkout/success?order_id=${order.id}`}>
                      <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Download Asset
                      </Button>
                    </Link>
                    <Link href={`/products`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Invoice / Receipt
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
