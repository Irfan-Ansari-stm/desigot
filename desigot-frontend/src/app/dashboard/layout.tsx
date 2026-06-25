"use client";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Heart, Settings, FolderOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard",          label: "Overview",   icon: LayoutDashboard },
  { href: "/dashboard/purchases",label: "Purchases",  icon: ShoppingBag },
  { href: "/dashboard/projects", label: "Projects",   icon: FolderOpen },
  { href: "/dashboard/saved",    label: "Saved",      icon: Heart },
  { href: "/dashboard/settings", label: "Settings",   icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <NotificationsPanel />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="bg-white border border-border rounded-xl overflow-hidden">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-border last:border-0 transition-colors",
                  active ? "bg-brand text-white" : "text-ink-60 hover:bg-surface-50 hover:text-ink-primary"
                )}>
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        {/* Mobile tab bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex z-40">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              pathname === href ? "text-accent" : "text-ink-secondary"
            )}>
              <Icon className="h-5 w-5" /> {label}
            </Link>
          ))}
        </div>
        <main className="flex-1 min-w-0 pb-16 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
