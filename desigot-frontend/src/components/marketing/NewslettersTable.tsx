"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Mail,
  Send,
  Plus,
  Users,
  CheckCircle,
  Clock,
  Trash2,
  Calendar,
  AlertCircle
} from "lucide-react";

export const NewslettersTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"campaigns" | "subscribers">("campaigns");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: "",
    preview_text: "",
    html_content: "<h1>Marketplace Highlights</h1><p>Check out our latest releases!</p>",
    audience_segment: "all_customers"
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "campaigns") {
        const res = await api.get("/admin/marketing/newsletters");
        if (res.data?.success) setCampaigns(res.data.data);
      } else {
        const res = await api.get("/admin/marketing/newsletters/subscribers");
        if (res.data?.success) setSubscribers(res.data.data);
      }
    } catch (err) {
      console.error("Error loading newsletters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSendNow = async (id: string, subject: string) => {
    if (!confirm(`Send newsletter "${subject}" to all active subscribers now?`)) return;
    try {
      await api.post(`/admin/marketing/newsletters/${id}/send`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send newsletter");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this newsletter draft?")) return;
    try {
      await api.delete(`/admin/marketing/newsletters/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete newsletter");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/admin/marketing/newsletters", createForm);
      setShowCreate(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create newsletter");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Sub-nav switch */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              activeTab === "campaigns"
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Newsletter Broadcasts
          </button>
          <button
            onClick={() => setActiveTab("subscribers")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              activeTab === "subscribers"
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Subscribers Roster
          </button>
        </div>

        {activeTab === "campaigns" && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Campaign Draft
          </button>
        )}
      </div>

      {/* Campaigns View */}
      {activeTab === "campaigns" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                <th className="py-3 px-3">Subject / Campaign</th>
                <th className="py-3 px-3">Audience Segment</th>
                <th className="py-3 px-3">Recipients</th>
                <th className="py-3 px-3">Open Rate</th>
                <th className="py-3 px-3">Click Rate</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Sent / Scheduled</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-3"><div className="h-4 bg-slate-200 rounded w-full" /></td>
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No campaigns found.</td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const rec = c.recipient_count || c.total_recipients || 0;
                  const open = c.open_count || 0;
                  const openPct = rec > 0 ? ((open / rec) * 100).toFixed(1) : 0;
                  const clicks = c.click_count || 0;
                  const clickPct = rec > 0 ? ((clicks / rec) * 100).toFixed(1) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        <div>{c.subject}</div>
                        <div className="text-[11px] text-slate-500 font-normal line-clamp-1">{c.preview_text || "No preview text"}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 capitalize">
                        {c.target_segment?.replace("_", " ")}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800 dark:text-slate-200">
                        {rec.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-blue-600">
                        {openPct}%
                      </td>
                      <td className="py-3 px-3 font-semibold text-purple-600">
                        {clickPct}%
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === "sent"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : (c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString() : "Draft")}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.status !== "sent" && (
                            <button
                              onClick={() => handleSendNow(c.id, c.subject)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              Send Now
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Subscribers View */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                <th className="py-3 px-3">Subscriber Email</th>
                <th className="py-3 px-3">Source Channel</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Subscribed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="py-4 px-3"><div className="h-4 bg-slate-200 rounded w-full" /></td>
                  </tr>
                ))
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">No subscribers found.</td>
                </tr>
              ) : (
                subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {s.email}
                    </td>
                    <td className="py-3 px-3 text-slate-500 capitalize">
                      {s.source?.replace("_", " ")}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(s.subscribed_at || s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Draft Newsletter Broadcast</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🎨 Discover Top 10 High-Converting Figma Templates"
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Preview Snippet</label>
                <input
                  type="text"
                  placeholder="e.g. Curated weekly by the Desigot design team"
                  value={createForm.preview_text}
                  onChange={(e) => setCreateForm({ ...createForm, preview_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Target Segment</label>
                <select
                  value={createForm.audience_segment}
                  onChange={(e) => setCreateForm({ ...createForm, audience_segment: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all_customers">All Newsletter Subscribers</option>
                  <option value="active_buyers">Active Buyers (Past 30 Days)</option>
                  <option value="sellers">Design Creators & Agencies</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">HTML Message Content *</label>
                <textarea
                  rows={4}
                  required
                  value={createForm.html_content}
                  onChange={(e) => setCreateForm({ ...createForm, html_content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold">
                  {submitting ? "Saving Draft..." : "Save Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
