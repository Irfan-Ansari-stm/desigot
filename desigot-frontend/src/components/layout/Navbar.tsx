"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Calendar,
  Heart,
  MessageSquare,
  Settings,
  Star,
  User as UserIcon,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Package,
  DollarSign,
  CreditCard
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useMarketplaceNav, useSearchSuggestions, usePopularSearches, useUnreadCount } from "@/hooks/useMarketplace";
import { useCartStore } from "@/store/cart.store";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isSeller, isAdmin } = useAuthStore();
  const { toggleNotificationsPanel, toggleMobileNav, mobileNavOpen } = useUIStore();
  const { data: navData } = useMarketplaceNav();
  const { data: unreadData } = useUnreadCount();
  const totalCartItems = useCartStore((s) => s.totalItems());

  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);

  // Suggestions API
  const { data: suggestionsData } = useSearchSuggestions(searchQ);
  const { data: popularSearches } = usePopularSearches();

  const unreadCount = unreadData?.unread_count ?? 0;

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mega menu on route change
  useEffect(() => {
    setMegaOpen(false);
    setSearchFocused(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      setSearchFocused(false);
      router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
    }
  };

  const handleSellClick = () => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      router.push("/login?redirect=/seller/onboarding");
      return;
    }
    if (isSeller()) {
      router.push("/seller/dashboard");
    } else {
      router.push("/seller/onboarding");
    }
  };

  const megaCategories = navData?.mega_menu_categories || [];
  const filteredMegaCategories = catSearch.trim()
    ? megaCategories.filter(c =>
        c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
        c.subcategories.some(s => s.name.toLowerCase().includes(catSearch.toLowerCase()))
      )
    : megaCategories;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-200 bg-white",
          scrolled ? "border-b border-slate-200 shadow-sm" : "border-b border-slate-100"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* ── LEFT: Desigot Logo & Brand ────────────────────────────── */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg tracking-wider">D</span>
              </div>
              <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
                Desigot
              </span>
            </Link>

            {/* ── CENTER NAVIGATION ───────────────────────────────────── */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Browse Mega Menu Trigger */}
              <div
                className="relative"
                ref={megaRef}
                onMouseEnter={() => setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setMegaOpen(!megaOpen)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors",
                    megaOpen
                      ? "text-slate-900 bg-slate-100"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <span>Browse</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-slate-500 transition-transform duration-200",
                      megaOpen && "rotate-180 text-rose-500"
                    )}
                  />
                </button>

                {/* Browse Mega Menu Panel */}
                {megaOpen && (
                  <div className="absolute top-full left-0 w-[840px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Explore Marketplace Categories</h3>
                        <p className="text-xs text-slate-500">Over 50,000 vetted assets & agency services</p>
                      </div>
                      <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={catSearch}
                          onChange={(e) => setCatSearch(e.target.value)}
                          placeholder="Filter categories..."
                          className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-h-[380px] overflow-y-auto pr-2 mt-4 scrollbar-thin">
                      {filteredMegaCategories.slice(0, 18).map((cat) => (
                        <div key={cat.id} className="space-y-1">
                          <Link
                            href={`/categories/${cat.slug}`}
                            onClick={() => setMegaOpen(false)}
                            className="flex items-center gap-2 group/item"
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500/80 group-hover/item:scale-125 transition-transform" />
                            <span className="text-xs font-bold text-slate-900 group-hover/item:text-rose-600 transition-colors">
                              {cat.name}
                            </span>
                          </Link>
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <div className="pl-4 space-y-0.5">
                              {cat.subcategories.slice(0, 3).map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/categories/${sub.slug}`}
                                  onClick={() => setMegaOpen(false)}
                                  className="block text-[11px] text-slate-500 hover:text-slate-900 truncate"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href="/categories"
                        onClick={() => setMegaOpen(false)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        View all categories <ArrowRight className="h-3 w-3" />
                      </Link>
                      <Link
                        href="/browse"
                        onClick={() => setMegaOpen(false)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Browse all assets & services
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/services"
                className={cn(
                  "px-3 py-2 text-sm font-semibold rounded-lg transition-colors",
                  pathname.startsWith("/services")
                    ? "text-rose-600 bg-rose-50/60"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                Services
              </Link>
              <Link
                href="/featured"
                className={cn(
                  "px-3 py-2 text-sm font-semibold rounded-lg transition-colors",
                  pathname === "/featured"
                    ? "text-rose-600 bg-rose-50/60"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                Featured
              </Link>
              <Link
                href="/trending"
                className={cn(
                  "px-3 py-2 text-sm font-semibold rounded-lg transition-colors",
                  pathname === "/trending"
                    ? "text-rose-600 bg-rose-50/60"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                Trending
              </Link>
              <Link
                href="/blog"
                className={cn(
                  "px-3 py-2 text-sm font-semibold rounded-lg transition-colors",
                  pathname.startsWith("/blog")
                    ? "text-rose-600 bg-rose-50/60"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                Blog
              </Link>
            </nav>
          </div>

          {/* ── SEARCH (SCREENSHOT SPEC: Rounded search field) ──────── */}
          <div className="flex-1 max-w-md hidden md:block relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search UI kits, icons, templates..."
                className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchQ && (
                <button
                  type="button"
                  onClick={() => setSearchQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* Suggestions Overlay */}
            {searchFocused && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSearchFocused(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                  {suggestionsData?.suggestions && suggestionsData.suggestions.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Matching Results
                      </p>
                      <div className="space-y-1">
                        {suggestionsData.suggestions.map((s, idx) => (
                          <Link
                            key={idx}
                            href={s.type === "service" ? `/services/${s.slug}` : `/products/${s.slug}`}
                            onClick={() => setSearchFocused(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-xs text-slate-800 font-medium group transition-colors"
                          >
                            <span className="truncate group-hover:text-rose-600">{s.title}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                              {s.type}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : searchQ.trim().length >= 2 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      Press enter to search for &quot;<span className="font-semibold text-slate-800">{searchQ}</span>&quot;
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Popular Searches
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(popularSearches || [
                          "UI Kits",
                          "Mobile App",
                          "Dashboards",
                          "Icons",
                          "Design Systems",
                          "Landing Pages",
                        ]).map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setSearchQ(term);
                              setSearchFocused(false);
                              router.push(`/search?q=${encodeURIComponent(term)}`);
                            }}
                            className="text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 px-3 py-1 rounded-full transition-colors font-medium"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT ACTIONS: Notification, Sell Button, User Profile ── */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Mobile Search Button */}
            <Link
              href="/search"
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Search className="h-5 w-5" />
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {mounted && totalCartItems > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalCartItems > 9 ? "9+" : totalCartItems}
                </span>
              )}
            </Link>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={toggleNotificationsPanel}
              className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Pink/Red Sell Button */}
            <button
              type="button"
              onClick={handleSellClick}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-full shadow-sm shadow-rose-500/25 hover:shadow-md hover:shadow-rose-500/30 transition-all active:scale-95"
            >
              Sell
            </button>

            {/* Authenticated Profile Dropdown / Guest Auth */}
            {!mounted ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
            ) : isAuthenticated() && user ? (
              <UserMenu user={user} onLogout={logout} isSellerRole={isSeller()} isAdminRole={isAdmin()} />
            ) : (
              <GuestMenu />
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={toggleMobileNav}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE NAV DRAWER ────────────────────────────────────────── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleMobileNav} />
          <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200 z-50">
            <div>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2" onClick={toggleMobileNav}>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white font-black text-sm">
                    D
                  </div>
                  <span className="font-extrabold text-xl text-slate-900">Desigot</span>
                </Link>
                <button onClick={toggleMobileNav} className="p-1.5 rounded-lg hover:bg-slate-100">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="p-4 border-b border-slate-100">
                <form
                  onSubmit={(e) => {
                    handleSearchSubmit(e);
                    toggleMobileNav();
                  }}
                  className="relative"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search UI kits, icons, templates..."
                    className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </form>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="p-4 space-y-1">
                {[
                  { href: "/browse", label: "Browse All Assets & Kits" },
                  { href: "/categories", label: "Categories Catalog" },
                  { href: "/services", label: "Services Marketplace" },
                  { href: "/featured", label: "Featured Collections" },
                  { href: "/trending", label: "Trending This Month" },
                  { href: "/blog", label: "Design Blog & Insights" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={toggleMobileNav}
                    className="block px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Mobile Drawer Bottom Actions */}
            <div className="p-4 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => {
                  toggleMobileNav();
                  handleSellClick();
                }}
                className="w-full py-2.5 text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl shadow-sm"
              >
                Sell on Desigot
              </button>

              {!isAuthenticated() ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={toggleMobileNav}
                    className="flex items-center justify-center py-2 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    onClick={toggleMobileNav}
                    className="flex items-center justify-center py-2 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <Link
                  href="/account"
                  onClick={toggleMobileNav}
                  className="flex items-center justify-center py-2 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl"
                >
                  My Account
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent content jump behind fixed header */}
      <div className="h-16" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GUEST PROFILE MENU (PART 11)
// ─────────────────────────────────────────────────────────────────────────────
function GuestMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors focus:outline-none">
          <UserIcon className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 bg-white border border-slate-200 rounded-2xl shadow-xl w-52 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
          align="end"
          sideOffset={8}
        >
          <div className="px-3.5 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-900">Welcome to Desigot</p>
            <p className="text-[11px] text-slate-500">Sign in to buy, sell, and hire</p>
          </div>
          <DropdownMenu.Item asChild>
            <Link
              href="/login"
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer outline-none"
            >
              <UserIcon className="h-4 w-4 text-rose-500" /> Log In
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link
              href="/register"
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer outline-none"
            >
              <Sparkles className="h-4 w-4 text-purple-500" /> Create Account
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 border-t border-slate-100" />
          <DropdownMenu.Item asChild>
            <Link
              href="/seller/onboarding"
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer outline-none"
            >
              <Briefcase className="h-4 w-4 text-rose-500" /> Become a Seller
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED PROFILE MENU (PART 11)
// ─────────────────────────────────────────────────────────────────────────────
function UserMenu({
  user,
  onLogout,
  isSellerRole,
  isAdminRole,
}: {
  user: any;
  onLogout: () => void;
  isSellerRole: boolean;
  isAdminRole: boolean;
}) {
  const router = useRouter();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="focus:outline-none rounded-full ring-2 ring-transparent hover:ring-rose-500/30 transition-all">
          <Avatar src={user.avatar_url} name={user.display_name || user.email} size="sm" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 bg-white border border-slate-200 rounded-2xl shadow-xl w-60 py-2 animate-in fade-in slide-in-from-top-1 duration-150"
          align="end"
          sideOffset={8}
        >
          {/* User Info Header */}
          <div className="px-3.5 py-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900 truncate">{user.display_name || "Desigot Member"}</p>
              {isAdminRole ? (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                  Admin
                </span>
              ) : isSellerRole ? (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                  Seller
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  Buyer
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
          </div>

          {/* ADMIN SECTION */}
          {isAdminRole && (
            <div className="py-1 border-b border-slate-100">
              <DropdownMenu.Item asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 cursor-pointer outline-none"
                >
                  <LayoutDashboard className="h-4 w-4 text-purple-600" /> Admin Dashboard
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/dashboard/marketplace"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                >
                  <Briefcase className="h-4 w-4 text-slate-400" /> Marketplace Management
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/dashboard/system"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                >
                  <Settings className="h-4 w-4 text-slate-400" /> System Administration
                </Link>
              </DropdownMenu.Item>
            </div>
          )}

          {/* SELLER SECTION */}
          {isSellerRole && (
            <div className="py-1 border-b border-slate-100">
              <DropdownMenu.Item asChild>
                <Link
                  href="/seller/dashboard"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer outline-none"
                >
                  <LayoutDashboard className="h-4 w-4 text-rose-500" /> Seller Dashboard
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/seller/services"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                >
                  <Briefcase className="h-4 w-4 text-slate-400" /> My Services
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/seller/products"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                >
                  <Package className="h-4 w-4 text-slate-400" /> My Products
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/seller/orders"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                >
                  <ShoppingBag className="h-4 w-4 text-slate-400" /> Seller Orders
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/seller/earnings"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                >
                  <DollarSign className="h-4 w-4 text-slate-400" /> Earnings & Payouts
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/seller/profile"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" /> Public Seller Profile
                </Link>
              </DropdownMenu.Item>
            </div>
          )}

          {/* CUSTOMER SECTION */}
          <div className="py-1">
            <DropdownMenu.Item asChild>
              <Link
                href="/account/profile"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
              >
                <UserIcon className="h-4 w-4 text-slate-400" /> My Profile
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/account/orders"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
              >
                <ShoppingBag className="h-4 w-4 text-slate-400" /> My Orders
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/account/bookings"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
              >
                <Calendar className="h-4 w-4 text-slate-400" /> My Bookings
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/account/messages"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
              >
                <MessageSquare className="h-4 w-4 text-slate-400" /> Messages
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/account/favorites"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
              >
                <Heart className="h-4 w-4 text-slate-400" /> Favorites
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/account/reviews"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
              >
                <Star className="h-4 w-4 text-slate-400" /> My Reviews
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/account/settings"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
              >
                <Settings className="h-4 w-4 text-slate-400" /> Account Settings
              </Link>
            </DropdownMenu.Item>
          </div>

          {/* SIGN OUT */}
          <DropdownMenu.Separator className="my-1 border-t border-slate-100" />
          <DropdownMenu.Item asChild>
            <button
              onClick={onLogout}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer outline-none"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
