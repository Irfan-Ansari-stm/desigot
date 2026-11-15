"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  ShoppingBag,
  Calendar,
  Star,
  AlertTriangle,
  CreditCard,
  RotateCcw,
  Clock,
  Bell,
  FileText,
  ShieldAlert,
  MapPin,
  Mail,
  Phone,
  Building,
  Sparkles,
  Ban,
  CheckCircle2,
  Trash2,
  Plus,
  Send,
  Save,
  MessageSquare,
  Lock,
  ExternalLink,
  ChevronRight,
  Eye,
} from "lucide-react";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api";
import { CustomerStatusBadge } from "@/components/customer-management/CustomerStatusBadge";
import { CustomerStatusDialog } from "@/components/customer-management/CustomerStatusDialog";
import { ComplaintConversationModal } from "@/components/customer-management/ComplaintConversationModal";

export default function CustomerDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals & sub-actions
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Form state for Personal Information tab
  const [personalForm, setPersonalForm] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    phone: "",
    company_name: "",
    vat_tax_id: "",
    preferred_language: "English",
    timezone: "UTC",
    risk_score: 0,
    customer_type: "individual",
  });

  // New Note state
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // New Address state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address_type: "shipping",
    recipient_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "United States",
    is_default: true,
  });

  const loadCustomer = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const res = await apiGet<any>(`/admin/customers/${customerId}`);
      const data = res?.customer || res?.data || res;
      setCustomer(data);

      setPersonalForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        display_name: data.display_name || data.name || "",
        phone: data.phone || "",
        company_name: data.company_name || "",
        vat_tax_id: data.vat_tax_id || "",
        preferred_language: data.preferred_language || "English",
        timezone: data.timezone || "UTC",
        risk_score: data.risk_score || 0,
        customer_type: data.customer_type || "individual",
      });
    } catch (err: any) {
      console.error("Failed to load customer", err);
      setErrorMsg(err?.message || "Failed to load customer details");
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const handleUpdatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);
    try {
      await apiPut(`/admin/customers/${customerId}`, personalForm);
      setSaveSuccess(true);
      await loadCustomer();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      await apiPost(`/admin/customers/${customerId}/notes`, { note: newNote.trim() });
      setNewNote("");
      await loadCustomer();
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this internal note?")) return;
    try {
      await apiDelete(`/admin/customers/${customerId}/notes/${noteId}`);
      await loadCustomer();
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost(`/admin/customers/${customerId}/addresses`, addressForm);
      setIsAddingAddress(false);
      setAddressForm({
        address_type: "shipping",
        recipient_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "United States",
        is_default: true,
      });
      await loadCustomer();
    } catch (err) {
      console.error("Failed to add address", err);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Delete this address from the address book?")) return;
    try {
      await apiDelete(`/admin/customers/${customerId}/addresses/${addressId}`);
      await loadCustomer();
    } catch (err) {
      console.error("Failed to delete address", err);
    }
  };

  const formatCurrency = (cents?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format((cents || 0) / 100);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B14] p-8 space-y-6">
        <div className="h-28 bg-[#0B1120] border border-slate-800 rounded-2xl animate-pulse" />
        <div className="h-96 bg-[#0B1120] border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#070B14] p-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-white mb-2">Customer Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">The requested customer profile could not be located.</p>
        <Link
          href="/dashboard/customer-management/all"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
        >
          Return to Customer Directory
        </Link>
      </div>
    );
  }

  const displayName =
    customer.name ||
    customer.display_name ||
    `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
    customer.email;
  const isSuspended = customer.account_status === "suspended";

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "personal", label: "Personal Information", icon: User },
    { id: "addresses", label: "Address Book", icon: MapPin, count: customer.addresses?.length },
    { id: "orders", label: "Orders", icon: ShoppingBag, count: customer.orders?.length },
    { id: "bookings", label: "Bookings", icon: Calendar, count: customer.bookings?.length },
    { id: "reviews", label: "Reviews", icon: Star, count: customer.reviews?.length },
    { id: "complaints", label: "Complaints", icon: AlertTriangle, count: customer.complaints?.length },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "refunds", label: "Refunds", icon: RotateCcw },
    { id: "timeline", label: "Activity Timeline", icon: Clock, count: customer.activity?.length },
    { id: "notifications", label: "Notifications", icon: Bell, count: customer.communications?.length },
    { id: "notes", label: "Customer Notes", icon: FileText, count: customer.notes?.length },
    { id: "audit", label: "Audit History", icon: ShieldAlert, count: customer.audit_logs?.length },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-6 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/customer-management/all"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Customers</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStatusDialogOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
              isSuspended
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                : "bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30"
            }`}
          >
            {isSuspended ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
            <span>{isSuspended ? "Reactivate Account" : "Suspend Account"}</span>
          </button>
        </div>
      </div>

      {/* Header Profile Hero Card */}
      <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {customer.avatar_url ? (
                <img
                  src={customer.avatar_url}
                  alt={displayName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 shadow-xl"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {isSuspended && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 border-2 border-[#0B1120] rounded-full" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white">{displayName}</h1>
                <CustomerStatusBadge
                  status={customer.customer_lifecycle_status || (isSuspended ? "suspended" : "active")}
                  accountStatus={customer.account_status}
                  vip={customer.customer_type === "vip"}
                />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60 uppercase">
                  {customer.customer_type || "individual"}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.company_name && (
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <Building className="w-3.5 h-3.5 text-purple-400" />
                    <span>{customer.company_name}</span>
                  </div>
                )}
                {(customer.city || customer.country) && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{[customer.city, customer.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Total Spend
              </span>
              <span className="text-lg font-bold text-emerald-400">
                {formatCurrency(customer.lifetime_spending_cents)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Orders</span>
              <span className="text-lg font-bold text-white">{customer.total_orders_count || 0}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Bookings
              </span>
              <span className="text-lg font-bold text-white">{customer.total_bookings_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 13-Tab Navigation Bar */}
      <div className="border-b border-slate-800/80 overflow-x-auto scrollbar-thin">
        <nav className="flex space-x-1 pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-white mb-4">Customer Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-1">Customer ID</span>
                  <span className="font-mono text-slate-300 truncate block">{customer.id}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-1">Registered On</span>
                  <span className="text-white font-medium">{formatDate(customer.created_at)}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-1">Last Active</span>
                  <span className="text-white font-medium">
                    {customer.last_login_at ? formatDate(customer.last_login_at) : "Never logged in"}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-1">Email Verified</span>
                  <span
                    className={`font-semibold ${
                      customer.email_verified_at ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {customer.email_verified_at ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-1">Risk Score</span>
                  <span
                    className={`font-semibold ${
                      (customer.risk_score || 0) > 50 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {customer.risk_score || 0} / 100
                  </span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-1">Avg Rating Given</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {customer.avg_rating_given ? Number(customer.avg_rating_given).toFixed(1) : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                >
                  View All ({customer.orders?.length || 0})
                </button>
              </div>

              {customer.orders && customer.orders.length > 0 ? (
                <div className="divide-y divide-slate-800/80">
                  {customer.orders.slice(0, 3).map((o: any) => (
                    <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-purple-300 font-medium">{o.order_number}</span>
                        <div className="text-slate-500 text-[11px]">{formatDate(o.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-emerald-400">
                          {formatCurrency(o.total_cents)}
                        </span>
                        <span className="block text-[10px] text-slate-400 capitalize">{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No orders placed yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Tags Box */}
            <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-white mb-3">Customer Tags</h3>
              <div className="flex flex-wrap gap-2">
                {customer.tags && customer.tags.length > 0 ? (
                  customer.tags.map((t: any) => (
                    <span
                      key={t.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                      style={{
                        backgroundColor: `${t.color || "#6366f1"}15`,
                        borderColor: `${t.color || "#6366f1"}40`,
                        color: t.color || "#a5b4fc",
                      }}
                    >
                      {t.name}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No tags assigned.</p>
                )}
              </div>
            </div>

            {/* Internal Notes Box */}
            <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Staff Notes</h3>
                <button
                  onClick={() => setActiveTab("notes")}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Manage
                </button>
              </div>
              {customer.notes && customer.notes.length > 0 ? (
                <div className="space-y-2">
                  {customer.notes.slice(0, 2).map((n: any) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300"
                    >
                      <p className="line-clamp-2">{n.note}</p>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No staff notes recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Personal Information */}
      {activeTab === "personal" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl max-w-3xl">
          <h3 className="text-base font-semibold text-white mb-4">Edit Personal Information</h3>
          {saveSuccess && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Customer attributes updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleUpdatePersonal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">First Name</label>
                <input
                  type="text"
                  value={personalForm.first_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, first_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Last Name</label>
                <input
                  type="text"
                  value={personalForm.last_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, last_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={personalForm.display_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, display_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  value={personalForm.company_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, company_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">VAT / Tax ID</label>
                <input
                  type="text"
                  value={personalForm.vat_tax_id}
                  onChange={(e) => setPersonalForm({ ...personalForm, vat_tax_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Type</label>
                <select
                  value={personalForm.customer_type}
                  onChange={(e) => setPersonalForm({ ...personalForm, customer_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Risk Score (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={personalForm.risk_score}
                  onChange={(e) =>
                    setPersonalForm({ ...personalForm, risk_score: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving Changes..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Address Book */}
      {activeTab === "addresses" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Saved Addresses</h3>
            <button
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingAddress ? "Cancel" : "Add Address"}</span>
            </button>
          </div>

          {isAddingAddress && (
            <div className="p-6 bg-[#0B1120]/80 border border-slate-800 rounded-2xl backdrop-blur-xl">
              <h4 className="text-xs font-semibold uppercase text-purple-400 tracking-wider mb-4">
                New Address Details
              </h4>
              <form onSubmit={handleAddAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={addressForm.recipient_name}
                    onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Address Type</label>
                  <select
                    value={addressForm.address_type}
                    onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="shipping">Shipping Address</option>
                    <option value="billing">Billing Address</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={addressForm.address_line1}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.addresses && customer.addresses.length > 0 ? (
              customer.addresses.map((addr: any) => (
                <div
                  key={addr.id}
                  className="p-5 rounded-2xl bg-[#0B1120]/80 border border-slate-800/80 backdrop-blur-xl relative"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {addr.address_type}
                    </span>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{addr.recipient_name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{addr.address_line1}</p>
                  <p className="text-xs text-slate-400">
                    {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{addr.country}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No saved addresses.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Orders */}
      {activeTab === "orders" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-4">Customer Orders</h3>
          {customer.orders && customer.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-3">Order #</th>
                    <th className="py-3 px-3">Seller</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customer.orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono text-purple-400 font-medium">
                        {o.order_number}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{o.seller_name || "Platform Seller"}</td>
                      <td className="py-3 px-3 font-semibold text-emerald-400">
                        {formatCurrency(o.total_cents)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No orders found for this customer.</p>
          )}
        </div>
      )}

      {/* Tab 5: Bookings */}
      {activeTab === "bookings" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-4">Design Service Bookings</h3>
          {customer.bookings && customer.bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-3">Booking #</th>
                    <th className="py-3 px-3">Service / Seller</th>
                    <th className="py-3 px-3">Scheduled Slot</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customer.bookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono text-blue-400 font-medium">
                        {b.booking_number}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{b.seller_name || "Lead Designer"}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {formatDate(b.appointment_date)} at {b.start_time}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                          {b.booking_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {formatCurrency(b.total_fee_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No bookings scheduled.</p>
          )}
        </div>
      )}

      {/* Tab 6: Reviews */}
      {activeTab === "reviews" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-4">Marketplace Reviews</h3>
          {customer.reviews && customer.reviews.length > 0 ? (
            <div className="space-y-3">
              {customer.reviews.map((r: any) => (
                <div key={r.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (r.rating || 5) ? "fill-amber-400" : "text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-slate-500">{formatDate(r.created_at)}</span>
                  </div>
                  <p className="text-slate-200">{r.comment || r.review_text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No reviews authored by this customer.</p>
          )}
        </div>
      )}

      {/* Tab 7: Complaints */}
      {activeTab === "complaints" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-4">Support Complaints & Tickets</h3>
          {customer.complaints && customer.complaints.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {customer.complaints.map((c: any) => (
                <div key={c.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-purple-400 font-semibold">{c.ticket_number}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 capitalize">
                        {c.status}
                      </span>
                    </div>
                    <h4 className="font-medium text-white">{c.subject}</h4>
                    <p className="text-slate-400 line-clamp-1 mt-0.5">{c.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedComplaintId(c.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition shrink-0"
                  >
                    Open Ticket Thread
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No complaints reported.</p>
          )}
        </div>
      )}

      {/* Tab 8: Payments */}
      {activeTab === "payments" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-4">Payment Transactions</h3>
          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-300">
            Total lifetime volume processed for this customer:{" "}
            <strong className="text-emerald-400 text-sm">
              {formatCurrency(customer.lifetime_spending_cents)}
            </strong>
          </div>
        </div>
      )}

      {/* Tab 9: Refunds */}
      {activeTab === "refunds" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-4">Refund History</h3>
          <p className="text-xs text-slate-400">
            Total refunds issued to date:{" "}
            <span className="text-red-400 font-semibold">
              {formatCurrency(customer.total_refunds_cents || 0)}
            </span>
          </p>
        </div>
      )}

      {/* Tab 10: Activity Timeline */}
      {activeTab === "timeline" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-4">Customer Activity Events</h3>
          {customer.activity && customer.activity.length > 0 ? (
            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800">
              {customer.activity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 relative pl-6 text-xs">
                  <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-[#0B1120]" />
                  <div className="flex-1 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{a.event_type}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No activity logged.</p>
          )}
        </div>
      )}

      {/* Tab 11: Notifications */}
      {activeTab === "notifications" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-4">Communication Log</h3>
          {customer.communications && customer.communications.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {customer.communications.map((c: any) => (
                <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">{c.subject}</span>
                    <span className="text-slate-500 block text-[11px]">{c.channel}</span>
                  </div>
                  <span className="text-slate-400">{formatDate(c.sent_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No outbound notifications logged.</p>
          )}
        </div>
      )}

      {/* Tab 12: Internal Notes */}
      {activeTab === "notes" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl space-y-6">
          <h3 className="text-base font-semibold text-white">Private Internal Staff Notes</h3>
          <form onSubmit={handleAddNote} className="space-y-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add confidential customer note visible only to admins and support agents..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
            />
            <button
              type="submit"
              disabled={isAddingNote || !newNote.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold"
            >
              Add Internal Note
            </button>
          </form>

          <div className="space-y-3">
            {customer.notes && customer.notes.length > 0 ? (
              customer.notes.map((n: any) => (
                <div
                  key={n.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs relative flex items-start justify-between"
                >
                  <div>
                    <p className="text-slate-200 whitespace-pre-wrap">{n.note}</p>
                    <span className="text-[10px] text-slate-500 mt-2 block">
                      Added on {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(n.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No internal notes written for this customer.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 13: Audit History */}
      {activeTab === "audit" && (
        <div className="p-6 bg-[#0B1120]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-4">Account Audit History</h3>
          {customer.audit_logs && customer.audit_logs.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {customer.audit_logs.map((log: any) => (
                <div key={log.id} className="py-3 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-purple-400">{log.action}</span>
                    <span className="text-slate-400 block text-[11px]">
                      By {log.actor_name || "System"} ({log.ip_address || "127.0.0.1"})
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No audit log entries found.</p>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CustomerStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        customerId={customer.id}
        customerName={displayName}
        currentStatus={customer.account_status}
        onSuccess={loadCustomer}
      />

      {selectedComplaintId && (
        <ComplaintConversationModal
          isOpen={!!selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
          complaintId={selectedComplaintId}
          onUpdated={loadCustomer}
        />
      )}
    </div>
  );
}
