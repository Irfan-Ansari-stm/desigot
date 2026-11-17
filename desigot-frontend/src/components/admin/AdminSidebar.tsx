"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  Store,
  UserCheck,
  ShoppingBag,
  FolderTree,
  CreditCard,
  MessageSquare,
  Star,
  Megaphone,
  Globe,
  Shield,
  BarChart3,
  ShieldAlert,
  Cpu,
  Settings,
  User,
  Crown,
  ChevronDown,
  ChevronRight,
  Search,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  permission?: string;
  badge?: string;
}

export interface NavSection {
  title: string;
  icon: React.ElementType;
  permission?: string;
  superAdminOnly?: boolean;
  defaultOpen?: boolean;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    title: "1. Dashboard",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { title: "Overview", href: "/dashboard" },
      { title: "Revenue Analytics", href: "/dashboard/revenue" },
      { title: "Marketplace Analytics", href: "/dashboard/marketplace" },
      { title: "Sales Analytics", href: "/dashboard/analytics?view=sales" },
      { title: "Service Analytics", href: "/dashboard/services" },
      { title: "Seller Analytics", href: "/dashboard/sellers" },
      { title: "Customer Analytics", href: "/dashboard/customers" },
      { title: "Recent Activities", href: "/dashboard/recent-activities" },
      { title: "System Health", href: "/dashboard/system-health" },
    ],
  },
  {
    title: "2. Service Management",
    icon: Briefcase,
    permission: "services.read",
    items: [
      { title: "All Services", href: "/dashboard/service-management/all" },
      { title: "Create Service", href: "/dashboard/service-management/create" },
      { title: "Pending Approval", href: "/dashboard/service-management/pending", badge: "Queue" },
      { title: "Published Services", href: "/dashboard/service-management/published" },
      { title: "Draft Services", href: "/dashboard/service-management/drafts" },
      { title: "Rejected Services", href: "/dashboard/service-management/rejected" },
      { title: "Suspended Services", href: "/dashboard/service-management/suspended" },
      { title: "Featured Services", href: "/dashboard/service-management/featured" },
      { title: "Reported Services", href: "/dashboard/service-management/reported" },
      { title: "Service Categories", href: "/dashboard/service-management/categories" },
      { title: "Service Attributes", href: "/dashboard/service-management/attributes" },
      { title: "Service Tags", href: "/dashboard/service-management/tags" },
      { title: "Service Packages", href: "/dashboard/service-management/packages" },
      { title: "Custom Service Requests", href: "/dashboard/service-management/custom-requests" },
      { title: "Service Pricing", href: "/dashboard/service-management/pricing" },
      { title: "Service Availability", href: "/dashboard/service-management/availability" },
      { title: "Service Performance", href: "/dashboard/service-management/performance" },
    ],
  },
  {
    title: "3. Digital Product Management",
    icon: Layers,
    permission: "products.read",
    items: [
      { title: "All Products", href: "/dashboard/digital-products/all" },
      { title: "Add Product", href: "/dashboard/digital-products/new" },
      { title: "Pending Products", href: "/dashboard/digital-products/pending", badge: "Queue" },
      { title: "Published Products", href: "/dashboard/digital-products/published" },
      { title: "Draft Products", href: "/dashboard/digital-products/drafts" },
      { title: "Rejected Products", href: "/dashboard/digital-products/rejected" },
      { title: "Featured Products", href: "/dashboard/digital-products/featured" },
      { title: "Product Categories", href: "/dashboard/digital-products/categories" },
      { title: "Product Tags", href: "/dashboard/digital-products/tags" },
      { title: "Product Licenses", href: "/dashboard/digital-products/licenses" },
      { title: "Product Files", href: "/dashboard/digital-products/files" },
      { title: "Product Versions", href: "/dashboard/digital-products/versions" },
      { title: "Product Downloads", href: "/dashboard/digital-products/downloads" },
      { title: "Product Sales", href: "/dashboard/digital-products/sales" },
      { title: "Product Refunds", href: "/dashboard/digital-products/refunds" },
    ],
  },
  {
    title: "4. Seller Management",
    icon: Store,
    permission: "sellers.read",
    items: [
      { title: "All Sellers", href: "/dashboard/users?role=seller" },
      { title: "Seller Applications", href: "/dashboard/users?filter=applications", badge: "Pending" },
      { title: "Seller Verification", href: "/dashboard/users?filter=verification" },
      { title: "Approved Sellers", href: "/dashboard/users?role=seller&status=active" },
      { title: "Pending Sellers", href: "/dashboard/users?role=seller&status=pending" },
      { title: "Suspended Sellers", href: "/dashboard/users?role=seller&status=suspended" },
      { title: "Seller Profiles", href: "/dashboard/users?view=profiles" },
      { title: "Seller Portfolios", href: "/dashboard/listings?view=portfolios" },
      { title: "Seller Services", href: "/dashboard/listings?type=service" },
      { title: "Seller Products", href: "/dashboard/listings?type=asset" },
      { title: "Seller Performance", href: "/dashboard/analytics?view=sellers" },
      { title: "Seller Earnings", href: "/dashboard/reports/users?tab=earnings" },
      { title: "Seller Payouts", href: "/dashboard/disputes?view=payouts" },
      { title: "Seller Ratings", href: "/dashboard/reports/users?tab=ratings" },
    ],
  },
  {
    title: "5. Customer Management",
    icon: UserCheck,
    permission: "customers.read",
    items: [
      { title: "All Customers", href: "/dashboard/customer-management/all" },
      { title: "Active Customers", href: "/dashboard/customer-management/active" },
      { title: "Inactive Customers", href: "/dashboard/customer-management/inactive" },
      { title: "Customer Details", href: "/dashboard/customer-management/details" },
      { title: "Customer Orders", href: "/dashboard/customer-management/orders" },
      { title: "Customer Bookings", href: "/dashboard/customer-management/bookings" },
      { title: "Customer Reviews", href: "/dashboard/customer-management/reviews" },
      { title: "Customer Complaints", href: "/dashboard/customer-management/complaints" },
      { title: "Customer Activity", href: "/dashboard/customer-management/activity" },
    ],
  },
  {
    title: "6. Orders & Bookings",
    icon: ShoppingBag,
    permission: "orders.read",
    items: [
      { title: "All Orders", href: "/dashboard/orders-bookings/all" },
      { title: "Digital Product Orders", href: "/dashboard/orders-bookings/digital" },
      { title: "Service Orders", href: "/dashboard/orders-bookings/services" },
      { title: "New Bookings", href: "/dashboard/orders-bookings/new-bookings", badge: "Live" },
      { title: "Pending Confirmation", href: "/dashboard/orders-bookings/pending-confirmation" },
      { title: "Active Projects", href: "/dashboard/orders-bookings/active-projects" },
      { title: "In Progress", href: "/dashboard/orders-bookings/in-progress" },
      { title: "Submitted Deliveries", href: "/dashboard/orders-bookings/deliveries" },
      { title: "Revision Requests", href: "/dashboard/orders-bookings/revisions" },
      { title: "Completed Orders", href: "/dashboard/orders-bookings/completed" },
      { title: "Cancelled Orders", href: "/dashboard/orders-bookings/cancelled" },
      { title: "Disputed Orders", href: "/dashboard/orders-bookings/disputes" },
      { title: "Custom Quotes", href: "/dashboard/orders-bookings/quotes" },
      { title: "Order History", href: "/dashboard/orders-bookings/history" },
    ],
  },
  {
    title: "7. Categories & Taxonomy",
    icon: FolderTree,
    permission: "categories.read",
    items: [
      { title: "All Categories", href: "/dashboard/categories-taxonomy/all" },
      { title: "Create Category", href: "/dashboard/categories-taxonomy/create" },
      { title: "Main Categories", href: "/dashboard/categories-taxonomy/main" },
      { title: "Subcategories", href: "/dashboard/categories-taxonomy/subcategories" },
      { title: "Service Categories", href: "/dashboard/categories-taxonomy/services" },
      { title: "Product Categories", href: "/dashboard/categories-taxonomy/products" },
      { title: "Category Attributes", href: "/dashboard/categories-taxonomy/attributes" },
      { title: "Category Icons", href: "/dashboard/categories-taxonomy/icons" },
      { title: "Category Banners", href: "/dashboard/categories-taxonomy/banners" },
      { title: "Category SEO", href: "/dashboard/categories-taxonomy/seo" },
      { title: "Category Ordering", href: "/dashboard/categories-taxonomy/ordering" },
    ],
  },
  {
    title: "8. Payments & Finance",
    icon: CreditCard,
    permission: "payments.read",
    items: [
      { title: "Transactions", href: "/dashboard/payments-finance/transactions" },
      { title: "Payment Methods", href: "/dashboard/payments-finance/payment-methods" },
      { title: "Payment Gateway Config", href: "/dashboard/payments-finance/gateways" },
      { title: "Commission Settings", href: "/dashboard/payments-finance/commissions" },
      { title: "Commission History", href: "/dashboard/payments-finance/commission-history" },
      { title: "Seller Earnings", href: "/dashboard/payments-finance/seller-earnings" },
      { title: "Payout Requests", href: "/dashboard/payments-finance/payout-requests", badge: "Queue" },
      { title: "Payout Processing", href: "/dashboard/payments-finance/payout-processing" },
      { title: "Refund Management", href: "/dashboard/payments-finance/refunds" },
      { title: "Tax Configuration", href: "/dashboard/payments-finance/tax-rules" },
      { title: "Invoices", href: "/dashboard/payments-finance/invoices" },
      { title: "Financial Reports", href: "/dashboard/payments-finance/reports" },
    ],
  },
  {
    title: "9. Messages & Communication",
    icon: MessageSquare,
    permission: "messages.read",
    items: [
      { title: "All Conversations", href: "/dashboard/communication/conversations" },
      { title: "Customer Messages", href: "/dashboard/communication/customer-messages" },
      { title: "Seller Messages", href: "/dashboard/communication/seller-messages" },
      { title: "Order Conversations", href: "/dashboard/communication/order-conversations" },
      { title: "Support Tickets", href: "/dashboard/communication/tickets" },
      { title: "Disputes", href: "/dashboard/communication/disputes" },
      { title: "Announcements", href: "/dashboard/communication/announcements" },
      { title: "Email Notifications", href: "/dashboard/communication/emails" },
      { title: "Notification Templates", href: "/dashboard/communication/templates" },
    ],
  },
  {
    title: "10. Reviews & Moderation",
    icon: Star,
    permission: "reviews.read",
    items: [
      { title: "All Reviews", href: "/dashboard/reviews/all" },
      { title: "Pending Reviews", href: "/dashboard/reviews/pending", badge: "Audit" },
      { title: "Approved Reviews", href: "/dashboard/reviews/approved" },
      { title: "Rejected Reviews", href: "/dashboard/reviews/rejected" },
      { title: "Reported Reviews", href: "/dashboard/reviews/reported", badge: "Reports" },
      { title: "Seller Responses", href: "/dashboard/reviews/responses" },
      { title: "Review Moderation", href: "/dashboard/reviews/moderation" },
      { title: "Product Ratings", href: "/dashboard/reviews/products" },
      { title: "Service Ratings", href: "/dashboard/reviews/services" },
    ],
  },
  {
    title: "11. Marketing & Promotions",
    icon: Megaphone,
    permission: "marketing.read",
    items: [
      { title: "Coupons", href: "/dashboard/marketing/coupons" },
      { title: "Discount Campaigns", href: "/dashboard/marketing/campaigns" },
      { title: "Featured Services", href: "/dashboard/marketing/featured-services" },
      { title: "Featured Products", href: "/dashboard/marketing/featured-products" },
      { title: "Homepage Banners", href: "/dashboard/marketing/banners" },
      { title: "Promotional Sections", href: "/dashboard/marketing/sections" },
      { title: "Newsletter Campaigns", href: "/dashboard/marketing/newsletters" },
      { title: "Affiliate Management", href: "/dashboard/marketing/affiliates" },
      { title: "Referral Programs", href: "/dashboard/marketing/referrals" },
      { title: "Advertisement Management", href: "/dashboard/marketing/ads" },
    ],
  },
  {
    title: "12. CMS & Website Management",
    icon: Globe,
    permission: "cms.read",
    items: [
      { title: "Homepage Management", href: "/dashboard/cms/homepage" },
      { title: "Hero Section", href: "/dashboard/cms/hero" },
      { title: "Navigation Menus", href: "/dashboard/cms/navigation" },
      { title: "Browse Mega Menu", href: "/dashboard/cms/mega-menu" },
      { title: "Services Page", href: "/dashboard/cms/services-page" },
      { title: "Categories Page", href: "/dashboard/cms/categories-page" },
      { title: "Featured Sections", href: "/dashboard/cms/featured-sections" },
      { title: "Trending Sections", href: "/dashboard/cms/trending-sections" },
      { title: "About Us", href: "/dashboard/cms/about" },
      { title: "Contact Page", href: "/dashboard/cms/contact" },
      { title: "FAQ Management", href: "/dashboard/cms/faq" },
      { title: "Terms & Conditions", href: "/dashboard/cms/terms" },
      { title: "Privacy Policy", href: "/dashboard/cms/privacy" },
      { title: "Refund Policy", href: "/dashboard/cms/refund-policy" },
      { title: "Footer Management", href: "/dashboard/cms/footer" },
      { title: "Static Pages", href: "/dashboard/cms/pages" },
      { title: "Blog Management", href: "/dashboard/cms/blog" },
    ],
  },
  {
    title: "13. RBAC & Admin Management",
    icon: Shield,
    permission: "roles.read",
    items: [
      { title: "Admin Users", href: "/dashboard/users?role=admin" },
      { title: "All Roles", href: "/dashboard/roles" },
      { title: "Create Role", href: "/dashboard/roles/create" },
      { title: "Edit Role", href: "/dashboard/roles" },
      { title: "Permission Management", href: "/dashboard/permissions" },
      { title: "Permission Matrix", href: "/dashboard/permissions/matrix", badge: "Interactive" },
      { title: "Module Access", href: "/dashboard/access-control/policies?tab=modules" },
      { title: "API Permissions", href: "/dashboard/access-control/policies?tab=api" },
      { title: "Role Assignment", href: "/dashboard/rbac/assignments" },
      { title: "Admin Activity", href: "/dashboard/rbac/activity" },
      { title: "Login History", href: "/dashboard/security/login-history" },
      { title: "Active Sessions", href: "/dashboard/security/sessions" },
      { title: "Security Settings", href: "/dashboard/security/settings" },
      { title: "Access Control Policies", href: "/dashboard/access-control/policies" },
      { title: "Audit Logs", href: "/dashboard/audit/all-logs" },
      { title: "Admin Settings", href: "/dashboard/system" },
    ],
  },
  {
    title: "14. Analytics & Reports",
    icon: BarChart3,
    permission: "analytics.read",
    items: [
      { title: "Revenue Reports", href: "/dashboard/analytics?view=revenue" },
      { title: "Sales Reports", href: "/dashboard/analytics?view=sales" },
      { title: "Service Reports", href: "/dashboard/analytics?view=services" },
      { title: "Product Reports", href: "/dashboard/analytics?view=products" },
      { title: "Seller Reports", href: "/dashboard/analytics?view=sellers" },
      { title: "Customer Reports", href: "/dashboard/analytics?view=customers" },
      { title: "Commission Reports", href: "/dashboard/analytics?view=commissions" },
      { title: "Conversion Analytics", href: "/dashboard/analytics?view=conversion" },
      { title: "Popular Categories", href: "/dashboard/analytics?view=categories" },
      { title: "Popular Services", href: "/dashboard/analytics?view=popular-services" },
      { title: "Popular Products", href: "/dashboard/analytics?view=popular-products" },
      { title: "Export Reports", href: "/dashboard/analytics?view=exports" },
    ],
  },
  {
    title: "15. Security & Audit",
    icon: ShieldAlert,
    permission: "security.read",
    items: [
      { title: "Security Overview", href: "/dashboard/security?tab=overview", badge: "Live" },
      { title: "Login History", href: "/dashboard/security?tab=login-history" },
      { title: "Active Sessions", href: "/dashboard/security?tab=sessions" },
      { title: "Failed Login Attempts", href: "/dashboard/security?tab=failed-attempts" },
      { title: "Security Events", href: "/dashboard/security?tab=events" },
      { title: "Universal Audit Logs", href: "/dashboard/security?tab=audit-logs" },
      { title: "Administrative Actions", href: "/dashboard/security?tab=admin-actions" },
      { title: "API Access Telemetry", href: "/dashboard/security?tab=api-logs" },
      { title: "IP Access Rules", href: "/dashboard/security?tab=ip-rules" },
      { title: "Authentication Settings", href: "/dashboard/security?tab=auth-settings" },
      { title: "Two-Factor Auth (MFA)", href: "/dashboard/security?tab=mfa" },
      { title: "Password Policies", href: "/dashboard/security?tab=password-policies" },
      { title: "Blocked IP Addresses", href: "/dashboard/security?tab=blocked-ips" },
      { title: "Account Lockouts", href: "/dashboard/security?tab=lockouts" },
      { title: "Security Alerts & Triage", href: "/dashboard/security?tab=alerts" },
      { title: "Security Investigations", href: "/dashboard/security?tab=investigations" },
      { title: "Sensitive Data Access", href: "/dashboard/security?tab=data-access" },
      { title: "Device Management", href: "/dashboard/security?tab=devices" },
      { title: "Compliance Reports", href: "/dashboard/security?tab=compliance" },
    ],
  },
  {
    title: "16. Integrations & API",
    icon: Cpu,
    permission: "api.read",
    items: [
      { title: "API Overview", href: "/dashboard/api-management?tab=overview", badge: "Live" },
      { title: "API Keys", href: "/dashboard/api-management?tab=keys" },
      { title: "Payment Integrations", href: "/dashboard/api-management?tab=payments" },
      { title: "Email Integrations", href: "/dashboard/api-management?tab=email" },
      { title: "Cloud Storage", href: "/dashboard/api-management?tab=storage" },
      { title: "Webhooks", href: "/dashboard/api-management?tab=webhooks" },
      { title: "External Services", href: "/dashboard/api-management?tab=external-services" },
      { title: "Integration Logs", href: "/dashboard/api-management?tab=logs" },
      { title: "API Documentation", href: "/dashboard/api-management?tab=docs" },
      { title: "Integration Settings", href: "/dashboard/api-management?tab=settings" },
    ],
  },
  {
    title: "17. System Settings",
    icon: Settings,
    permission: "settings.read",
    items: [
      { title: "General Settings", href: "/dashboard/system/general" },
      { title: "Marketplace Configuration", href: "/dashboard/system/general?tab=marketplace" },
      { title: "Currency Settings", href: "/dashboard/system/general?tab=currency" },
      { title: "Language Settings", href: "/dashboard/system/general?tab=language" },
      { title: "Timezone Settings", href: "/dashboard/system/general?tab=timezone" },
      { title: "Commission Configuration", href: "/dashboard/system/general?tab=commissions" },
      { title: "Tax Settings", href: "/dashboard/system/general?tab=tax" },
      { title: "Authentication Settings", href: "/dashboard/system/general?tab=auth" },
      { title: "Email Settings", href: "/dashboard/system/general?tab=email" },
      { title: "Storage Settings", href: "/dashboard/system/general?tab=storage" },
      { title: "SEO Settings", href: "/dashboard/system/general?tab=seo" },
      { title: "Maintenance Mode", href: "/dashboard/system/general?tab=maintenance" },
      { title: "Feature Flags", href: "/dashboard/system/general?tab=feature-flags" },
      { title: "Backup & Restore", href: "/dashboard/system/general?tab=backup" },
      { title: "System Health", href: "/dashboard/system/general?tab=health" },
      { title: "Settings History & Audit", href: "/dashboard/system/general?tab=history" },
    ],
  },
  {
    title: "18. Profile & Account",
    icon: User,
    items: [
      { title: "My Profile", href: "/dashboard/profile" },
      { title: "Change Password", href: "/dashboard/profile/change-password" },
      { title: "Two-Factor Auth", href: "/dashboard/profile/two-factor-auth" },
      { title: "Active Sessions", href: "/dashboard/profile/active-sessions" },
      { title: "Account Security", href: "/dashboard/profile/security" },
      { title: "Preferences", href: "/dashboard/profile/preferences" },
    ],
  },
  {
    title: "Super Admin Only",
    icon: Crown,
    superAdminOnly: true,
    items: [
      { title: "Super Admin Control Center", href: "/dashboard/super-admin/control-center", badge: "Root" },
      { title: "Administrator Management", href: "/dashboard/super-admin/control-center?tab=admins" },
      { title: "Global System Access", href: "/dashboard/super-admin/control-center?tab=global" },
      { title: "System Ownership", href: "/dashboard/super-admin/control-center?tab=ownership" },
      { title: "Global Role Configuration", href: "/dashboard/super-admin/control-center?tab=roles" },
      { title: "Global Permission Configuration", href: "/dashboard/super-admin/control-center?tab=permissions" },
      { title: "Application Maintenance", href: "/dashboard/super-admin/control-center?tab=maintenance" },
      { title: "System Recovery", href: "/dashboard/super-admin/control-center?tab=recovery" },
      { title: "Critical Operations", href: "/dashboard/super-admin/control-center?tab=critical" },
      { title: "System Configuration Override", href: "/dashboard/super-admin/control-center?tab=override" },
    ],
  },
];

export function AdminSidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const { user, isSuperAdmin, hasPermission } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationConfig.forEach((sec) => {
      const isPathInSection = sec.items.some((item) => pathname === item.href);
      initial[sec.title] = sec.defaultOpen || isPathInSection;
    });
    return initial;
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Filter sections by permission and Super Admin guard
  const visibleSections = navigationConfig.filter((sec) => {
    // Strictly guard Super Admin Only
    if (sec.superAdminOnly) {
      return isSuperAdmin();
    }
    // Super admin bypasses all permission checks
    if (isSuperAdmin()) return true;

    // Check section permission
    if (sec.permission && !hasPermission(sec.permission)) {
      return false;
    }
    return true;
  });

  // Filter by search query if present
  const filteredSections = visibleSections
    .map((sec) => {
      if (!searchTerm) return sec;
      const matchingItems = sec.items.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchingItems.length > 0 || sec.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return {
          ...sec,
          items: matchingItems.length > 0 ? matchingItems : sec.items,
        };
      }
      return null;
    })
    .filter(Boolean) as NavSection[];

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-slate-900 text-slate-200 transition-all duration-300 border-r border-slate-800 z-30 select-none",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/40">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden hover:opacity-90 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                DESIGOT <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">DASHBOARD</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Unified Management</div>
            </div>
          </Link>
        )}

        {collapsed && (
          <div className="mx-auto h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow">
            <Shield className="h-5 w-5" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors",
            collapsed && "mx-auto mt-2"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation Filter / Search */}
      {!collapsed && (
        <div className="p-3 border-b border-slate-800/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter menu modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 custom-scrollbar">
        {filteredSections.map((sec) => {
          const Icon = sec.icon;
          const isOpen = openSections[sec.title] || !!searchTerm;
          const hasActiveChild = sec.items.some((item) => {
            const itemBase = item.href.split("?")[0];
            return pathname === itemBase || (pathname.startsWith(itemBase) && itemBase !== "/dashboard");
          });

          if (collapsed) {
            return (
              <div key={sec.title} className="relative group">
                <Link
                  href={sec.items[0]?.href || "/dashboard"}
                  className={cn(
                    "flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all",
                    hasActiveChild
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  )}
                  title={sec.title}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              </div>
            );
          }

          return (
            <div key={sec.title} className="rounded-lg overflow-hidden transition-colors">
              <button
                onClick={() => toggleSection(sec.title)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors",
                  sec.superAdminOnly
                    ? "bg-amber-950/30 text-amber-300 border border-amber-800/30 hover:bg-amber-900/40"
                    : hasActiveChild
                    ? "text-indigo-300 bg-indigo-950/40"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      sec.superAdminOnly
                        ? "text-amber-400"
                        : hasActiveChild
                        ? "text-indigo-400"
                        : "text-slate-400"
                    )}
                  />
                  <span>{sec.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {sec.superAdminOnly && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase border border-amber-500/40">
                      Owner
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="mt-1 pl-4 pr-1 py-0.5 space-y-0.5 border-l border-slate-800 ml-4">
                  {sec.items.map((item) => {
                    const itemBase = item.href.split("?")[0];
                    const isActive = pathname === item.href || (pathname === itemBase && !item.href.includes("?"));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-all font-medium",
                          isActive
                            ? "bg-indigo-600 text-white font-semibold shadow-sm"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                        )}
                      >
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[9px] px-1.5 py-0.2 rounded font-semibold ml-2 shrink-0",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>v2.4 Enterprise</span>
          </div>
          <span className="text-emerald-400 font-mono">ONLINE</span>
        </div>
      )}
    </aside>
  );
}
