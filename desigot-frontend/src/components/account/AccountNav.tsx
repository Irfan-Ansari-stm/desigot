"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  CalendarCheck,
  MessageSquare,
  Heart,
  Star,
  Settings,
} from "lucide-react";

const ACCOUNT_LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/account/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/account/messages", label: "Messages", icon: MessageSquare },
  { href: "/account/favorites", label: "Saved Items", icon: Heart },
  { href: "/account/reviews", label: "Reviews", icon: Star },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-white sticky top-16 z-30 shadow-xs mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
          {ACCOUNT_LINKS.map((link) => {
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
