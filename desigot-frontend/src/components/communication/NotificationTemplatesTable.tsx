"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode,
  Search,
  Eye,
  Send,
  Edit3,
  Copy,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  Layers,
  Save,
} from "lucide-react";
import { apiGet, apiPut, apiPost } from "@/lib/api";
import { CommunicationStatusBadge } from "./CommunicationStatusBadge";

export function NotificationTemplatesTable() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [category, setCategory] = useState("");

  // Editor Modal
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "test" | "versions">("edit");
  const [editSubject, setEditSubject] = useState("");
  const [editBodyHtml, setEditBodyHtml] = useState("");
  const [editBodyText, setEditBodyText] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Preview State
  const [previewData, setPreviewData] = useState<any>(null);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await apiGet<any[]>("/admin/communication/templates", {
        search: search || undefined,
        channel: channel || undefined,
        category: category || undefined,
      });
      setTemplates(data || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [channel, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTemplates();
  };

  const handleOpenEditor = async (t: any) => {
    setSelectedTemplate(t);
    setEditSubject(t.subject);
    setEditBodyHtml(t.body_html || "");
    setEditBodyText(t.body_text || "");
    setEditSummary("");
    setActiveTab("edit");
    setIsEditorOpen(true);

    // Fetch full version details
    try {
      const full = await apiGet<any>(`/admin/communication/templates/${t.id}`);
      setSelectedTemplate(full);
    } catch (err) {
      console.error("Failed to load full template details:", err);
    }
  };

  const handleInsertVariable = (varName: string) => {
    const placeholder = `{{${varName}}}`;
    setEditBodyText((prev) => prev + " " + placeholder);
    setEditBodyHtml((prev) => prev + " " + placeholder);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsSaving(true);
    try {
      await apiPut(`/admin/communication/templates/${selectedTemplate.id}`, {
        subject: editSubject,
        body_html: editBodyHtml,
        body_text: editBodyText,
        change_summary: editSummary || "Admin updated template content",
      });
      alert("Template updated and new version archived successfully!");
      setIsEditorOpen(false);
      loadTemplates();
    } catch (err) {
      console.error("Failed to save template:", err);
      alert("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!selectedTemplate) return;
    try {
      const preview = await apiPost<any>(`/admin/communication/templates/${selectedTemplate.id}/preview`, {
        variables: {},
      });
      setPreviewData(preview);
      setActiveTab("preview");
    } catch (err) {
      console.error("Failed to generate preview:", err);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !testEmail.trim()) return;

    setIsSendingTest(true);
    try {
      await apiPost(`/admin/communication/templates/${selectedTemplate.id}/test`, {
        recipient_email: testEmail.trim(),
      });
      alert(`Test notification dispatched to ${testEmail}!`);
    } catch (err) {
      console.error("Test send failed:", err);
      alert("Test dispatch failed");
    } finally {
      setIsSendingTest(false);
    }
  };

  const variableChips = [
    "customer_name", "seller_name", "order_id", "booking_id", "ticket_id",
    "dispute_id", "transaction_id", "invoice_number", "refund_amount",
    "payout_amount", "platform_name", "support_email"
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-500" />
            Transactional Notification Templates Catalog
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure multi-channel email, in-app, push, and SMS templates with variable token validation
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search template name, code..."
              className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </form>

          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Channels</option>
            <option value="email">Email</option>
            <option value="in_app">In-App</option>
            <option value="push">Push Notification</option>
            <option value="sms">SMS</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Template Name</th>
              <th className="py-3 px-4">Template Code</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4">Status</th>
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
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                  No templates found.
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => handleOpenEditor(t)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {t.template_name}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {t.template_code}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                    {t.category?.replace(/_/g, " ")}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap uppercase font-bold text-[10px] text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {t.channel}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                    {t.subject}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">
                    v{t.version || 1}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditor(t)}
                      className="py-1 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-colors"
                    >
                      Edit Template
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Template Editor Modal */}
      {isEditorOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-semibold text-xs text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50">
                    {selectedTemplate.template_code}
                  </span>
                  <span className="text-xs uppercase font-bold text-slate-500">
                    {selectedTemplate.channel}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    v{selectedTemplate.version || 1}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {selectedTemplate.template_name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 py-2 bg-slate-100/70 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("edit")}
                className={`py-1.5 px-3 rounded-lg transition-colors ${
                  activeTab === "edit"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Template Editor
              </button>
              <button
                onClick={handleGeneratePreview}
                className={`py-1.5 px-3 rounded-lg transition-colors ${
                  activeTab === "preview"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Live Preview
              </button>
              <button
                onClick={() => setActiveTab("test")}
                className={`py-1.5 px-3 rounded-lg transition-colors ${
                  activeTab === "test"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Test Dispatch
              </button>
              <button
                onClick={() => setActiveTab("versions")}
                className={`py-1.5 px-3 rounded-lg transition-colors ${
                  activeTab === "versions"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Version History ({selectedTemplate?.versions?.length || 1})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "edit" && (
                <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email / Message Subject Line
                    </label>
                    <input
                      type="text"
                      required
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Variable Chip Inserters */}
                  <div>
                    <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                      Click to Insert Allowed Variable Tokens:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {variableChips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleInsertVariable(chip)}
                          className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 text-[11px] font-mono transition-colors"
                        >
                          +{`{{${chip}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Plain Text Template Body
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={editBodyText}
                      onChange={(e) => setEditBodyText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100 resize-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      HTML Email Markup Template
                    </label>
                    <textarea
                      rows={6}
                      value={editBodyHtml}
                      onChange={(e) => setEditBodyHtml(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100 resize-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Version Change Summary (for audit history)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Updated CTA instructions and refund disclaimer"
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save & Create Version</span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "preview" && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="text-slate-400 font-semibold mb-1">Rendered Subject:</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {previewData?.subject || "Subject Preview"}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 min-h-[220px]">
                    <div className="text-slate-400 font-semibold mb-2">HTML Rendered Preview:</div>
                    <div
                      className="prose dark:prose-invert max-w-none text-xs"
                      dangerouslySetInnerHTML={{ __html: previewData?.bodyHtml || previewData?.bodyText || "" }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "test" && (
                <form onSubmit={handleSendTestEmail} className="space-y-4 text-xs max-w-md">
                  <p className="text-slate-500">
                    Dispatch an immediate test notification with rendered dummy variables to verify mail server formatting:
                  </p>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@desigot.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingTest || !testEmail.trim()}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Dispatch Test Message</span>
                  </button>
                </form>
              )}

              {activeTab === "versions" && (
                <div className="space-y-3 text-xs">
                  {selectedTemplate?.versions?.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100">Version {v.version}</span>
                        <span className="text-slate-400">{new Date(v.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-medium mb-1">
                        Subject: {v.subject}
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        {v.change_summary || "Routine update"} • Changed by {v.changed_by_name || "Admin"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
