"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Search,
  Plus,
  Eye,
  MousePointerClick,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { CommunicationStatusBadge } from "./CommunicationStatusBadge";

export function AnnouncementsDataTable() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    announcement_type: "platform_updates",
    target_audience: "all_users",
    priority: "normal",
    status: "published",
    cta_label: "Learn More",
    cta_url: "/dashboard",
  });

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/admin/communication/announcements", {
        page,
        limit: 15,
        search: search || undefined,
        status: status || undefined,
        type: type || undefined,
      });
      setAnnouncements(res?.announcements || []);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [page, status, type]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAnnouncements();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);
    try {
      await apiPost("/admin/communication/announcements", formData);
      alert("Announcement created successfully!");
      setIsCreateOpen(false);
      setFormData({
        title: "",
        content: "",
        announcement_type: "platform_updates",
        target_audience: "all_users",
        priority: "normal",
        status: "published",
        cta_label: "Learn More",
        cta_url: "/dashboard",
      });
      loadAnnouncements();
    } catch (err) {
      console.error("Failed to create announcement:", err);
      alert("Creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishNow = async (id: string) => {
    try {
      await apiPost(`/admin/communication/announcements/${id}/publish`);
      alert("Announcement broadcasted live to selected audience!");
      loadAnnouncements();
    } catch (err) {
      console.error("Publishing failed:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-500" />
            Platform Announcements & Broadcasts
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Broadcast platform releases, maintenance downtime notices, policy updates, and creative alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements..."
              className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </form>

          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="platform_updates">Platform Updates</option>
            <option value="maintenance_notifications">Maintenance</option>
            <option value="new_features">New Features</option>
            <option value="seller_announcements">Seller Announcements</option>
            <option value="policy_updates">Policy Updates</option>
            <option value="security_alerts">Security Alerts</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
          </select>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Title & Reference</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Audience</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Views / Clicks</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4 h-12 bg-slate-50/50 dark:bg-slate-900/50" />
                </tr>
              ))
            ) : announcements.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                  No announcements found.
                </td>
              </tr>
            ) : (
              announcements.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{a.title}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{a.announcement_reference}</div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                    {a.announcement_type?.replace(/_/g, " ")}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                    {a.target_audience?.replace(/_/g, " ")}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={a.priority} type="priority" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <CommunicationStatusBadge status={a.status} type="status" />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {a.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5 text-indigo-500" />
                        {a.clicks_count}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                    {new Date(a.published_at || a.created_at).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {a.status !== "published" ? (
                      <button
                        onClick={() => handlePublishNow(a.id)}
                        className="py-1 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition-colors"
                      >
                        Publish Now
                      </button>
                    ) : (
                      <span className="text-emerald-500 text-xs font-medium flex items-center justify-end gap-1">
                        <Radio className="w-3 h-3 animate-ping" />
                        Live
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          Page {page} of {pagination.totalPages || 1} ({pagination.total} announcements)
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create Announcement Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-500" />
                Create Platform Announcement
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Scheduled Maintenance Notice or Platform Update"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Announcement Type
                  </label>
                  <select
                    value={formData.announcement_type}
                    onChange={(e) => setFormData({ ...formData, announcement_type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="platform_updates">Platform Update</option>
                    <option value="maintenance_notifications">Maintenance Notice</option>
                    <option value="new_features">New Feature</option>
                    <option value="seller_announcements">Seller Broadcast</option>
                    <option value="customer_announcements">Customer Broadcast</option>
                    <option value="policy_updates">Policy Update</option>
                    <option value="security_alerts">Security Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="all_users">All Users</option>
                    <option value="customers">Customers Only</option>
                    <option value="sellers">Sellers Only</option>
                    <option value="verified_sellers">Verified Creators</option>
                    <option value="internal_staff">Internal Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Content Body
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide clear announcement details..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={formData.cta_label}
                    onChange={(e) => setFormData({ ...formData, cta_label: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Publish Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="published">Publish Immediately</option>
                    <option value="draft">Save as Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Announcement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
