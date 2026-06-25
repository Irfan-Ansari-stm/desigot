"use client";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, AlertTriangle, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/users",     label: "Users",      icon: Users },
  { href: "/admin/listings",  label: "Listings",   icon: Package },
  { href: "/admin/disputes",  label: "Disputes",   icon: AlertTriangle },
  { href: "/admin/analytics", label: "Analytics",  icon: BarChart2 },
  { href: "/admin/config",    label: "Config",     icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <NotificationsPanel />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-6">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-brand text-white text-xs font-bold uppercase tracking-widest">Admin Panel</div>
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-border last:border-0 transition-colors",
                  active ? "bg-brand/10 text-brand" : "text-ink-60 hover:bg-surface-50 hover:text-ink-primary"
                )}>
                  <Icon className="h-4 w-4" />{label}
                </Link>
              );
            })}
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
