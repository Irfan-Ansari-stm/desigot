"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, BarChart2, DollarSign, Settings, ChevronLeft, ChevronRight, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/seller-dashboard",           label: "Dashboard",    icon: LayoutDashboard },
  { href: "/seller-dashboard/listings",  label: "Listings",     icon: Package },
  { href: "/seller-dashboard/orders",    label: "Orders",       icon: ShoppingBag },
  { href: "/seller-dashboard/analytics", label: "Analytics",    icon: BarChart2 },
  { href: "/seller-dashboard/payouts",   label: "Payouts",      icon: DollarSign },
  { href: "/seller-dashboard/settings",  label: "Settings",     icon: Settings },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "hidden lg:flex flex-col border-r border-border bg-white transition-all duration-200 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-4 border-b border-border", collapsed && "justify-center px-2")}>
        <Link href="/seller-dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xs">D</span>
          </div>
          {!collapsed && <span className="font-black text-brand">Seller</span>}
        </Link>
      </div>

      {/* Quick add */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-border">
          <Link href="/seller-dashboard/listings/new" className="flex items-center gap-2 w-full px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Listing
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand text-white"
                  : "text-ink-60 hover:bg-surface-50 hover:text-ink-primary",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-3 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-ink-secondary hover:bg-surface-50 transition-colors", collapsed && "justify-center")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
