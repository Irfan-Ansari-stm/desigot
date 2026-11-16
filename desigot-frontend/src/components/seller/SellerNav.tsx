"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  User,
} from "lucide-react";

const SELLER_LINKS = [
  { href: "/seller/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/seller/services", label: "My Services", icon: Briefcase },
  { href: "/seller/products", label: "My Products", icon: Package },
  { href: "/seller/orders", label: "Client Orders", icon: ShoppingBag },
  { href: "/seller/earnings", label: "Earnings & Balance", icon: DollarSign },
  { href: "/seller/payouts", label: "Payout History", icon: TrendingUp },
  { href: "/seller/profile", label: "Storefront Profile", icon: User },
];

export function SellerNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-white sticky top-16 z-30 shadow-xs mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
          {SELLER_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-brand text-white shadow-sm"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-surface-100"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-ink-tertiary"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
