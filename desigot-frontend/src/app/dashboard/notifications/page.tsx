"use client";
import React, { useState, useEffect } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import {
  Bell,
  Mail,
  Send,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Edit2,
  Save,
  X,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  updated_at: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  target: "all" | "admins" | "managers";
  sentAt: string;
  status: "delivered" | "scheduled";
}

export default function NotificationsPage() {
  const { hasPermission, isSuperAdmin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"system" | "templates" | "settings">("system");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<{
    subject: string;
    body_html: string;
    body_text: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "error" | "success",
    target: "all" as "all" | "admins" | "managers",
  });

  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Scheduled Maintenance Window",
      message: "System upgrade scheduled for Sunday at 02:00 AM UTC. Estimated downtime is 15 minutes.",
      type: "warning",
      target: "all",
      sentAt: "2026-11-15 14:00",
      status: "delivered",
    },
    {
      id: "notif-2",
      title: "Security Policy Enforcement: MFA Mandatory",
      message: "Multi-Factor Authentication will be enforced for all administrator accounts starting next week.",
      type: "info",
      target: "admins",
      sentAt: "2026-11-14 09:30",
      status: "delivered",
    },
    {
      id: "notif-3",
      title: "Quarterly Audit Report Ready",
      message: "The Q4 compliance and access control report has been generated and archived.",
      type: "success",
      target: "managers",
      sentAt: "2026-11-12 18:45",
      status: "delivered",
    },
  ]);

  const fetchEmailTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiGet<EmailTemplate[]>("/rbac/email-templates");
      if (Array.isArray(res)) {
        setTemplates(res);
      }
    } catch (err) {
      console.error("Failed to load email templates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailTemplates();
  }, []);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.title || !broadcastMessage.message) return;

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: broadcastMessage.title,
      message: broadcastMessage.message,
      type: broadcastMessage.type,
      target: broadcastMessage.target,
      sentAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "delivered",
    };

    setNotificationsList([newNotif, ...notificationsList]);
    setBroadcastMessage({
      title: "",
      message: "",
      type: "info",
      target: "all",
    });
    setSaveSuccess("Broadcast notification dispatched immediately to all target users.");
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate || !editingTemplate) return;
    try {
      await apiPut(`/rbac/email-templates/${selectedTemplate.id}`, editingTemplate);
      setSaveSuccess("Email template updated successfully.");
      setSelectedTemplate(null);
      setEditingTemplate(null);
      fetchEmailTemplates();
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err) {
      console.error("Failed to save template", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Notifications & Communications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dispatch administrative broadcasts, configure automated alerts, and manage system email templates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchEmailTemplates()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 space-x-6">
        <button
          onClick={() => setActiveTab("system")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === "system"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          )}
        >
          <Bell className="w-4 h-4" />
          System Broadcasts & Alerts
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === "templates"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          )}
        >
          <Mail className="w-4 h-4" />
          Email Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === "settings"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          )}
        >
          <Settings className="w-4 h-4" />
          Delivery Configuration
        </button>
      </div>

      {/* Tab: System Broadcasts */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Send className="w-4 h-4 text-indigo-600" />
              Dispatch New Broadcast
            </h2>
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Security Notice"
                  value={broadcastMessage.title}
                  onChange={(e) => setBroadcastMessage({ ...broadcastMessage, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Severity / Type
                </label>
                <select
                  value={broadcastMessage.type}
                  onChange={(e) =>
                    setBroadcastMessage({
                      ...broadcastMessage,
                      type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="error">Critical (Red)</option>
                  <option value="success">Success (Emerald)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Audience
                </label>
                <select
                  value={broadcastMessage.target}
                  onChange={(e) =>
                    setBroadcastMessage({
                      ...broadcastMessage,
                      target: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="all">All Authenticated Users</option>
                  <option value="admins">Administrators Only</option>
                  <option value="managers">Managers & Admins</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message Body
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed message contents..."
                  value={broadcastMessage.message}
                  onChange={(e) => setBroadcastMessage({ ...broadcastMessage, message: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Dispatch Broadcast
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Active Broadcasts & Notification Feed
            </h2>
            <div className="space-y-3">
              {notificationsList.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-start gap-3 shadow-sm"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg mt-0.5",
                      notif.type === "warning" && "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
                      notif.type === "info" && "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
                      notif.type === "success" && "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
                      notif.type === "error" && "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {notif.type === "warning" && <AlertTriangle className="w-4 h-4" />}
                    {notif.type === "info" && <Info className="w-4 h-4" />}
                    {notif.type === "success" && <CheckCircle2 className="w-4 h-4" />}
                    {notif.type === "error" && <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {notif.title}
                      </h4>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {notif.sentAt}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        Audience: {notif.target}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        {notif.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Email Templates */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              System Templates
            </h2>
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  setSelectedTemplate(tpl);
                  setEditingTemplate({
                    subject: tpl.subject,
                    body_html: tpl.body_html,
                    body_text: tpl.body_text,
                  });
                }}
                className={cn(
                  "p-3.5 rounded-xl border cursor-pointer transition-all",
                  selectedTemplate?.id === tpl.id
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {tpl.name}
                  </h3>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">
                    {tpl.slug}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {tpl.subject}
                </p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedTemplate && editingTemplate ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Edit Template: {selectedTemplate.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      Slug: {selectedTemplate.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        setEditingTemplate(null);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      HTML Content
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Supports Handlebars template variables
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={editingTemplate.body_html}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, body_html: e.target.value })
                    }
                    className="w-full font-mono text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Plain Text Version
                  </label>
                  <textarea
                    rows={4}
                    value={editingTemplate.body_text}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, body_text: e.target.value })
                    }
                    className="w-full font-mono text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Available Placeholders
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTemplate.variables.map((v) => (
                        <span
                          key={v}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono text-xs rounded border border-gray-200 dark:border-gray-700"
                        >
                          {"{{"} {v} {"}}"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setEditingTemplate(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center text-gray-500 dark:text-gray-400">
                <Mail className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  No Template Selected
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Select a template from the list to preview and modify its HTML markup and subject.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === "settings" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm max-w-3xl space-y-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            SMTP & Delivery Gateway Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                readOnly
                value="smtp.mailtrap.io"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Port
              </label>
              <input
                type="text"
                readOnly
                value="2525"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Email Address
              </label>
              <input
                type="email"
                readOnly
                value="security-alerts@desigot.com"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Encryption
              </label>
              <input
                type="text"
                readOnly
                value="STARTTLS (TLSv1.3)"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  Mail Gateway Active & Connected
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  System notifications, password resets, and audit alerts are dispatched in real-time.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSaveSuccess("Test email successfully dispatched to administrator inbox.");
                setTimeout(() => setSaveSuccess(null), 4000);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
            >
              Send Test Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
