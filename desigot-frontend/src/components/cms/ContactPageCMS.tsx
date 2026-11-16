"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Mail, Phone, MapPin, Save, CheckCircle, Search, Filter, Eye, X } from "lucide-react";

export const ContactPageCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"settings" | "submissions">("submissions");
  const [settings, setSettings] = useState<any>({
    heading: "",
    description: "",
    support_email: "",
    phone: "",
    address: "",
    business_hours: ""
  });
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSubmissions();
  }, [statusFilter, searchQuery]);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/admin/cms/contact/settings");
      if (res.data?.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load contact settings:", err);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/contact/submissions", {
        params: { status: statusFilter || undefined, search: searchQuery || undefined }
      });
      if (res.data?.data) {
        setSubmissions(res.data.data);
        setTotalSubmissions(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load contact submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSuccessMsg("");
    try {
      await api.put("/admin/cms/contact/settings", settings);
      setSuccessMsg("Contact settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const openSubmissionModal = (sub: any) => {
    setSelectedSub(sub);
    setAdminNotes(sub.admin_notes || "");
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedSub) return;
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/admin/cms/contact/submissions/${selectedSub.id}/status`, {
        status: newStatus,
        adminNotes
      });
      setSelectedSub(res.data.data);
      setSubmissions(submissions.map((s) => (s.id === selectedSub.id ? res.data.data : s)));
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-purple-600" />
            Contact Page CMS & Customer Inquiries Desk
          </h2>
          <p className="text-xs text-slate-500">
            Manage public contact details and respond to customer service messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "submissions"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            Inquiries Inbox ({totalSubmissions})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "settings"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            Page Contact Info
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}

      {/* Submissions Inbox */}
      {activeTab === "submissions" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inquiries by sender, email, or subject..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
              <option value="spam">Spam</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sender</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject & Preview</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {submissions.map((sub) => {
                    const statusColors: any = {
                      new: "bg-blue-50 text-blue-600 dark:bg-blue-950/40",
                      in_progress: "bg-amber-50 text-amber-600 dark:bg-amber-950/40",
                      responded: "bg-purple-50 text-purple-600 dark:bg-purple-950/40",
                      closed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40",
                      spam: "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                    };
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">{sub.name}</span>
                          <span className="text-[11px] text-slate-400">{sub.email}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{sub.subject}</span>
                          <span className="text-[11px] text-slate-400 truncate block">{sub.message}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[sub.status] || "bg-slate-100"}`}>
                            {sub.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openSubmissionModal(sub)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                            title="Inspect Inquiry"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                        No contact inquiries found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Public Contact Details & Support Channels</h3>
              <p className="text-xs text-slate-500">Information presented on the /contact page.</p>
            </div>
            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" />
              {savingSettings ? "Saving..." : "Save Details"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Headline *
              </label>
              <input
                type="text"
                required
                value={settings.heading || ""}
                onChange={(e) => setSettings({ ...settings, heading: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subtitle Description
              </label>
              <textarea
                rows={2}
                value={settings.description || ""}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Support Email *
              </label>
              <input
                type="email"
                required
                value={settings.support_email || ""}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Support Telephone
              </label>
              <input
                type="text"
                value={settings.phone || ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Office Headquarters Address
              </label>
              <input
                type="text"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business & Operating Hours
              </label>
              <input
                type="text"
                value={settings.business_hours || ""}
                onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </form>
      )}

      {/* View & Resolve Submission Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Inquiry: {selectedSub.subject}
                </h3>
                <span className="text-[11px] text-slate-400">
                  from {selectedSub.name} ({selectedSub.email})
                </span>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {selectedSub.message}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Internal Administrator Notes
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Log internal follow-up actions or assignees..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Update Ticket Status
              </span>
              <div className="flex flex-wrap gap-2">
                {["new", "in_progress", "responded", "closed", "spam"].map((st) => (
                  <button
                    key={st}
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                      selectedSub.status === st
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
