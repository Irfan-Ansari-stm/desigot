"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Heart, Menu, X, ChevronDown, Plus, LogOut, Settings, LayoutDashboard, ShoppingBag, Star } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCategoryTree } from "@/hooks/useListings";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function Navbar() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isSeller } = useAuthStore();
  const { unreadCount, toggleNotificationsPanel, toggleMobileNav, mobileNavOpen, toggleSearchOverlay } = useUIStore();
  const { data: catTree } = useCategoryTree();
  const [scrolled, setScrolled]   = useState(false);
  const [megaOpen, setMegaOpen]   = useState(false);
  const [searchQ, setSearchQ]     = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-200",
        scrolled ? "bg-white border-b border-border shadow-sm" : "bg-white/95 backdrop-blur-sm"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">D</span>
            </div>
            <span className="font-black text-xl text-brand tracking-tight hidden sm:block">Desigot</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            <div
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-ink-60 hover:text-ink-primary rounded-lg hover:bg-surface-50 transition-colors">
                Browse <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", megaOpen && "rotate-180")} />
              </button>
              {megaOpen && (
                <div className="absolute top-full left-0 w-[720px] bg-white border border-border rounded-2xl shadow-xl p-6 animate-slide-up">
                  <div className="grid grid-cols-3 gap-4">
                    {(catTree as { id: string; name: string; slug: string; icon_name?: string }[] | undefined)?.slice(0, 18).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/browse?category_id=${cat.id}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-50 text-sm text-ink-60 hover:text-ink-primary transition-colors"
                        onClick={() => setMegaOpen(false)}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link href="/browse" className="text-sm font-medium text-accent hover:underline" onClick={() => setMegaOpen(false)}>
                      View all categories →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link href="/browse?listing_type=service" className="px-3 py-2 text-sm font-medium text-ink-60 hover:text-ink-primary rounded-lg hover:bg-surface-50 transition-colors">Services</Link>
            <Link href="/browse?is_featured=true" className="px-3 py-2 text-sm font-medium text-ink-60 hover:text-ink-primary rounded-lg hover:bg-surface-50 transition-colors">Featured</Link>
            <Link href="/browse?sort=popular" className="px-3 py-2 text-sm font-medium text-ink-60 hover:text-ink-primary rounded-lg hover:bg-surface-50 transition-colors">Trending</Link>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 hidden md:block max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-secondary/60" />
              <input
                ref={searchRef}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Search UI kits, icons, templates…"
                className="w-full h-9 pl-9 pr-4 text-sm bg-surface-50 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-border-md focus:bg-white transition-all"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={toggleSearchOverlay} className="md:hidden p-2 rounded-lg hover:bg-surface-50 text-ink-secondary">
              <Search className="h-5 w-5" />
            </button>

            {isAuthenticated() ? (
              <>
                <button
                  onClick={toggleNotificationsPanel}
                  className="relative p-2 rounded-lg hover:bg-surface-50 text-ink-secondary transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent rounded-full" />
                  )}
                </button>
                <Link href="/dashboard/saved" className="hidden sm:flex p-2 rounded-lg hover:bg-surface-50 text-ink-secondary transition-colors">
                  <Heart className="h-5 w-5" />
                </Link>
                {isSeller() && (
                  <Button
                    variant="accent"
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => router.push("/seller-dashboard/listings/new")}
                    className="hidden sm:flex"
                  >
                    Sell
                  </Button>
                )}
                <UserMenu user={user!} onLogout={logout} isSeller={isSeller()} />
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </>
            )}

            <button onClick={toggleMobileNav} className="lg:hidden p-2 rounded-lg hover:bg-surface-50 text-ink-secondary">
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleMobileNav} />
          <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-xl animate-slide-right overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2" onClick={toggleMobileNav}>
                <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xs">D</span>
                </div>
                <span className="font-black text-lg text-brand">Desigot</span>
              </Link>
              <button onClick={toggleMobileNav} className="p-1.5 rounded-lg hover:bg-surface-50">
                <X className="h-5 w-5 text-ink-secondary" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {[
                { href: "/browse", label: "Browse All" },
                { href: "/browse?listing_type=asset", label: "Assets" },
                { href: "/browse?listing_type=service", label: "Services" },
                { href: "/search", label: "Search" },
                { href: "/browse?sort=popular", label: "Trending" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={toggleMobileNav}
                  className="block px-3 py-2.5 text-sm font-medium text-ink-60 hover:text-ink-primary hover:bg-surface-50 rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {!isAuthenticated() && (
              <div className="p-4 border-t border-border space-y-2">
                <Link href="/auth/login" onClick={toggleMobileNav}>
                  <Button variant="secondary" fullWidth>Login</Button>
                </Link>
                <Link href="/auth/register" onClick={toggleMobileNav}>
                  <Button variant="primary" fullWidth>Sign Up Free</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}

function UserMenu({ user, onLogout, isSeller }: { user: { display_name: string; avatar_url?: string; email: string }; onLogout: () => void; isSeller: boolean }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="focus:outline-none rounded-full">
          <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="z-50 bg-white border border-border rounded-xl shadow-lg w-56 py-1 animate-slide-up" align="end" sideOffset={8}>
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-semibold text-ink-primary truncate">{user.display_name}</p>
            <p className="text-xs text-ink-secondary truncate">{user.email}</p>
          </div>
          {[
            { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
            { href: "/dashboard/purchases", label: "My Purchases", icon: <ShoppingBag className="h-4 w-4" /> },
            { href: "/dashboard/saved", label: "Saved Items", icon: <Heart className="h-4 w-4" /> },
            ...(isSeller ? [{ href: "/seller-dashboard", label: "Seller Dashboard", icon: <Star className="h-4 w-4" /> }] : []),
            { href: "/dashboard/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
          ].map((item) => (
            <DropdownMenu.Item key={item.href} asChild>
              <Link href={item.href} className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-60 hover:bg-surface-50 hover:text-ink-primary cursor-pointer outline-none">
                {item.icon} {item.label}
              </Link>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 border-t border-border" />
          <DropdownMenu.Item asChild>
            <button
              onClick={onLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-danger hover:bg-red-50 cursor-pointer outline-none"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
