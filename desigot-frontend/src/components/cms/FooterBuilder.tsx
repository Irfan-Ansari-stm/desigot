"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Dock, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  CheckCircle, 
  X, 
  Share2, 
  ShieldCheck, 
  Mail, 
  History, 
  Layers, 
  Palette, 
  ExternalLink, 
  RotateCcw,
  Sparkles,
  Eye,
  ChevronRight
} from "lucide-react";

export const FooterBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"general" | "columns" | "social" | "legal" | "newsletter" | "versions">("columns");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // State data
  const [settings, setSettings] = useState<any>({
    brand_name: "desigot",
    brand_description: "Desigot is the global creative marketplace for enterprise design systems, digital assets, and vetted agency services.",
    copyright_text: "All rights reserved. Crafted for visionary design teams worldwide.",
    copyright_owner: "Desigot Inc.",
    copyright_year_mode: "dynamic",
    manual_copyright_year: new Date().getFullYear(),
    background_color: "#0B0F19",
    heading_color: "#FFFFFF",
    text_color: "#91A8C7",
    link_color: "#91A8C7",
    hover_color: "#FFFFFF",
    border_color: "#263144",
    max_width: "1280px",
    desktop_visibility: true,
    tablet_visibility: true,
    mobile_visibility: true,
    newsletter_enabled: true,
    newsletter_title: "Subscribe to our creative digest",
    newsletter_description: "Get weekly curated design systems, top UI templates, and marketplace release notes delivered to your inbox.",
    cta_enabled: false,
    cta_heading: "Start selling on Desigot",
    cta_description: "Join 10,000+ elite designers and agencies monetizing their creative work worldwide.",
    cta_button_text: "Become a Seller",
    cta_button_url: "/seller/onboarding",
    publication_status: "published"
  });

  const [columns, setColumns] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [legalLinks, setLegalLinks] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);

  // Modals
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<any | null>(null);
  const [columnForm, setColumnForm] = useState({
    title: "",
    slug: "",
    column_order: 1,
    width: "1fr",
    is_active: true
  });

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [targetColId, setTargetColId] = useState("");
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [linkForm, setLinkForm] = useState({
    label: "",
    url: "",
    route_type: "internal",
    open_behavior: "same_window",
    badge_text: "",
    badge_color: "",
    sort_order: 1,
    is_active: true
  });

  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState<any | null>(null);
  const [socialForm, setSocialForm] = useState({
    platform: "twitter",
    url: "https://x.com/desigot",
    display_order: 1,
    is_active: true
  });

  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [editingLegal, setEditingLegal] = useState<any | null>(null);
  const [legalForm, setLegalForm] = useState({
    label: "",
    url: "",
    route_type: "internal",
    open_behavior: "same_window",
    sort_order: 1,
    is_active: true
  });

  useEffect(() => {
    fetchAllFooterData();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  const fetchAllFooterData = async () => {
    setLoading(true);
    try {
      // 1. Settings & Columns
      const [resSettings, resCols, resSocial, resLegal, resHistory] = await Promise.all([
        api.get("/admin/footer/settings").catch(() => null),
        api.get("/admin/footer/columns").catch(() => null),
        api.get("/admin/footer/social-links").catch(() => null),
        api.get("/admin/footer/legal-links").catch(() => null),
        api.get("/admin/footer/history").catch(() => null),
      ]);

      if (resSettings?.data?.data) {
        setSettings(resSettings.data.data);
      }
      if (resCols?.data?.data) {
        setColumns(resCols.data.data);
      }
      if (resSocial?.data?.data) {
        setSocialLinks(resSocial.data.data);
      }
      if (resLegal?.data?.data) {
        setLegalLinks(resLegal.data.data);
      }
      if (resHistory?.data?.data) {
        setVersions(resHistory.data.data);
      }
    } catch (err) {
      console.error("Failed to load footer configuration:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── General Settings Save ──────────────────────────────────────────────
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/admin/footer/settings", settings);
      if (res.data?.success) {
        setSettings(res.data.data);
        showNotification("Footer settings saved successfully!");
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || "Failed to save settings", true);
    } finally {
      setSaving(false);
    }
  };

  // ── Column Handlers ───────────────────────────────────────────────────
  const openAddColumn = () => {
    setEditingColumn(null);
    setColumnForm({
      title: "",
      slug: "",
      column_order: columns.length + 1,
      width: "1fr",
      is_active: true
    });
    setIsColumnModalOpen(true);
  };

  const openEditColumn = (col: any) => {
    setEditingColumn(col);
    setColumnForm({
      title: col.title,
      slug: col.slug || "",
      column_order: col.column_order || 1,
      width: col.width || "1fr",
      is_active: col.is_active !== false
    });
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingColumn) {
        await api.put(`/admin/footer/columns/${editingColumn.id}`, columnForm);
        showNotification("Column updated successfully!");
      } else {
        await api.post("/admin/footer/columns", columnForm);
        showNotification("New column created!");
      }
      setIsColumnModalOpen(false);
      const res = await api.get("/admin/footer/columns");
      if (res.data?.data) setColumns(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save column");
    }
  };

  const handleDeleteColumn = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete column "${title}" and all its links?`)) return;
    try {
      await api.delete(`/admin/footer/columns/${id}`);
      showNotification("Column deleted");
      const res = await api.get("/admin/footer/columns");
      if (res.data?.data) setColumns(res.data.data);
    } catch (err) {
      alert("Failed to delete column");
    }
  };

  // ── Link Handlers ─────────────────────────────────────────────────────
  const openAddLink = (colId: string) => {
    setTargetColId(colId);
    setEditingLink(null);
    setLinkForm({
      label: "",
      url: "/browse",
      route_type: "internal",
      open_behavior: "same_window",
      badge_text: "",
      badge_color: "",
      sort_order: 1,
      is_active: true
    });
    setIsLinkModalOpen(true);
  };

  const openEditLink = (colId: string, link: any) => {
    setTargetColId(colId);
    setEditingLink(link);
    setLinkForm({
      label: link.label,
      url: link.url,
      route_type: link.route_type || "internal",
      open_behavior: link.open_behavior || "same_window",
      badge_text: link.badge_text || "",
      badge_color: link.badge_color || "",
      sort_order: link.sort_order || 1,
      is_active: link.is_active !== false
    });
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLink) {
        await api.put(`/admin/footer/links/${editingLink.id}`, linkForm);
        showNotification("Link updated!");
      } else {
        await api.post(`/admin/footer/columns/${targetColId}/links`, linkForm);
        showNotification("New link added!");
      }
      setIsLinkModalOpen(false);
      const res = await api.get("/admin/footer/columns");
      if (res.data?.data) setColumns(res.data.data);
    } catch (err) {
      alert("Failed to save link");
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this footer link?")) return;
    try {
      await api.delete(`/admin/footer/links/${id}`);
      showNotification("Link deleted");
      const res = await api.get("/admin/footer/columns");
      if (res.data?.data) setColumns(res.data.data);
    } catch (err) {
      alert("Failed to delete link");
    }
  };

  // ── Social Handlers ───────────────────────────────────────────────────
  const openAddSocial = () => {
    setEditingSocial(null);
    setSocialForm({
      platform: "twitter",
      url: "https://x.com/desigot",
      display_order: socialLinks.length + 1,
      is_active: true
    });
    setIsSocialModalOpen(true);
  };

  const openEditSocial = (item: any) => {
    setEditingSocial(item);
    setSocialForm({
      platform: item.platform,
      url: item.url,
      display_order: item.display_order || 1,
      is_active: item.is_active !== false
    });
    setIsSocialModalOpen(true);
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSocial) {
        await api.put(`/admin/footer/social-links/${editingSocial.id}`, socialForm);
        showNotification("Social account updated!");
      } else {
        await api.post("/admin/footer/social-links", socialForm);
        showNotification("Social account added!");
      }
      setIsSocialModalOpen(false);
      const res = await api.get("/admin/footer/social-links");
      if (res.data?.data) setSocialLinks(res.data.data);
    } catch (err) {
      alert("Failed to save social link");
    }
  };

  const handleDeleteSocial = async (id: string) => {
    if (!confirm("Remove this social account link?")) return;
    try {
      await api.delete(`/admin/footer/social-links/${id}`);
      showNotification("Social account removed");
      const res = await api.get("/admin/footer/social-links");
      if (res.data?.data) setSocialLinks(res.data.data);
    } catch (err) {
      alert("Failed to delete social account");
    }
  };

  // ── Legal Links Handlers ─────────────────────────────────────────────
  const openAddLegal = () => {
    setEditingLegal(null);
    setLegalForm({
      label: "",
      url: "/privacy",
      route_type: "internal",
      open_behavior: "same_window",
      sort_order: legalLinks.length + 1,
      is_active: true
    });
    setIsLegalModalOpen(true);
  };

  const openEditLegal = (item: any) => {
    setEditingLegal(item);
    setLegalForm({
      label: item.label,
      url: item.url,
      route_type: item.route_type || "internal",
      open_behavior: item.open_behavior || "same_window",
      sort_order: item.sort_order || 1,
      is_active: item.is_active !== false
    });
    setIsLegalModalOpen(true);
  };

  const handleSaveLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLegal) {
        await api.put(`/admin/footer/legal-links/${editingLegal.id}`, legalForm);
        showNotification("Legal link updated!");
      } else {
        await api.post("/admin/footer/legal-links", legalForm);
        showNotification("Legal link added!");
      }
      setIsLegalModalOpen(false);
      const res = await api.get("/admin/footer/legal-links");
      if (res.data?.data) setLegalLinks(res.data.data);
    } catch (err) {
      alert("Failed to save legal link");
    }
  };

  const handleDeleteLegal = async (id: string) => {
    if (!confirm("Delete this legal navigation link?")) return;
    try {
      await api.delete(`/admin/footer/legal-links/${id}`);
      showNotification("Legal link deleted");
      const res = await api.get("/admin/footer/legal-links");
      if (res.data?.data) setLegalLinks(res.data.data);
    } catch (err) {
      alert("Failed to delete legal link");
    }
  };

  // ── Publish & Restore Handlers ─────────────────────────────────────────
  const handlePublish = async () => {
    setSaving(true);
    try {
      const res = await api.post("/admin/footer/publish");
      if (res.data?.success) {
        showNotification("Footer published successfully! New version snapshot recorded.");
        setSettings({ ...settings, publication_status: "published" });
        const hRes = await api.get("/admin/footer/history");
        if (hRes.data?.data) setVersions(hRes.data.data);
      }
    } catch (err) {
      alert("Failed to publish footer");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm("Are you sure you want to restore this footer snapshot? Current unpublished changes will be replaced.")) return;
    setSaving(true);
    try {
      const res = await api.post(`/admin/footer/restore/${versionId}`);
      if (res.data?.success) {
        showNotification("Footer snapshot restored successfully!");
        fetchAllFooterData();
      }
    } catch (err) {
      alert("Failed to restore version");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading footer builder system...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Dock className="w-5 h-5 text-purple-600" />
              Footer Management System
            </h2>
            <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
              settings.publication_status === "published"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
            }`}>
              {settings.publication_status || "published"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure multi-column navigation, brand assets, social media networks, compliance links, and publish snapshots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            {saving ? "Publishing..." : "Publish Live Footer"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <X className="w-4 h-4 text-rose-500" />
          {errorMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: "columns", label: `Columns & Links (${columns.length})`, icon: Layers },
          { id: "general", label: "General & Styles", icon: Palette },
          { id: "social", label: `Social Accounts (${socialLinks.length})`, icon: Share2 },
          { id: "legal", label: `Legal & Compliance (${legalLinks.length})`, icon: ShieldCheck },
          { id: "newsletter", label: "Newsletter & CTA", icon: Mail },
          { id: "versions", label: `Version History (${versions.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                isActive
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: COLUMNS & LINKS ────────────────────────────────────────── */}
      {activeTab === "columns" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Navigation Columns ({columns.length})
            </h3>
            <button
              onClick={openAddColumn}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Column
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {columns.map((col) => (
              <div
                key={col.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{col.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>Col #{col.column_order}</span>
                        <span>•</span>
                        <span>{col.links?.length || 0} links</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditColumn(col)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Column"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteColumn(col.id, col.title)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Links List */}
                  <div className="mt-3 space-y-2">
                    {col.links && col.links.length > 0 ? (
                      col.links.map((link: any) => (
                        <div
                          key={link.id}
                          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {link.label}
                              </span>
                              {link.badge_text && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                  {link.badge_text}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">
                              {link.url}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditLink(col.id, link)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              className="p-1 text-rose-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 py-4 text-center">No links in this column.</div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openAddLink(col.id)}
                    className="w-full py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: GENERAL & STYLES ────────────────────────────────────────── */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Brand Identity & Copyright
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={settings.brand_name || ""}
                  onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Copyright Legal Owner
                </label>
                <input
                  type="text"
                  value={settings.copyright_owner || ""}
                  onChange={(e) => setSettings({ ...settings, copyright_owner: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand Description (Column 1)
                </label>
                <textarea
                  rows={2}
                  value={settings.brand_description || ""}
                  onChange={(e) => setSettings({ ...settings, brand_description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Copyright Subtitle Statement
                </label>
                <input
                  type="text"
                  value={settings.copyright_text || ""}
                  onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Copyright Year Mode
                </label>
                <select
                  value={settings.copyright_year_mode || "dynamic"}
                  onChange={(e) => setSettings({ ...settings, copyright_year_mode: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="dynamic">Dynamic (Always Current Year)</option>
                  <option value="manual">Manual Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manual Year (if manual mode selected)
                </label>
                <input
                  type="number"
                  value={settings.manual_copyright_year || new Date().getFullYear()}
                  onChange={(e) => setSettings({ ...settings, manual_copyright_year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Color Scheme Settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Color Palette & Theme Controls
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { label: "Background", key: "background_color" },
                { label: "Headings", key: "heading_color" },
                { label: "Text", key: "text_color" },
                { label: "Links", key: "link_color" },
                { label: "Hover State", key: "hover_color" },
                { label: "Borders", key: "border_color" },
              ].map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {f.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings[f.key] || "#000000"}
                      onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={settings[f.key] || ""}
                      onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                      className="w-20 px-2 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow transition"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save General Settings"}
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 3: SOCIAL ACCOUNTS ────────────────────────────────────────── */}
      {activeTab === "social" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Social Media Accounts ({socialLinks.length})
            </h3>
            <button
              onClick={openAddSocial}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Social Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialLinks.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {s.platform}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Order #{s.display_order}</span>
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1 font-mono truncate max-w-xs"
                  >
                    {s.url}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditSocial(s)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSocial(s.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: LEGAL & COMPLIANCE ────────────────────────────────────────── */}
      {activeTab === "legal" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Legal & Compliance Strip Links ({legalLinks.length})
            </h3>
            <button
              onClick={openAddLegal}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Legal Link
            </button>
          </div>

          <div className="space-y-3">
            {legalLinks.map((l) => (
              <div
                key={l.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{l.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Order #{l.sort_order}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      {l.open_behavior || "same_window"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono mt-0.5 block">{l.url}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditLegal(l)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLegal(l.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: NEWSLETTER & CTA ────────────────────────────────────────── */}
      {activeTab === "newsletter" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Footer Newsletter Digest Subscription
              </h3>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.newsletter_enabled !== false}
                  onChange={(e) => setSettings({ ...settings, newsletter_enabled: e.target.checked })}
                  className="rounded text-purple-600 accent-purple-600"
                />
                Enable Newsletter Bar
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={settings.newsletter_title || ""}
                  onChange={(e) => setSettings({ ...settings, newsletter_title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={settings.newsletter_description || ""}
                  onChange={(e) => setSettings({ ...settings, newsletter_description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pre-Footer Call to Action Banner
              </h3>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.cta_enabled === true}
                  onChange={(e) => setSettings({ ...settings, cta_enabled: e.target.checked })}
                  className="rounded text-purple-600 accent-purple-600"
                />
                Enable Pre-Footer CTA
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CTA Heading
                </label>
                <input
                  type="text"
                  value={settings.cta_heading || ""}
                  onChange={(e) => setSettings({ ...settings, cta_heading: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CTA Description
                </label>
                <input
                  type="text"
                  value={settings.cta_description || ""}
                  onChange={(e) => setSettings({ ...settings, cta_description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={settings.cta_button_text || ""}
                  onChange={(e) => setSettings({ ...settings, cta_button_text: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Button URL Destination
                </label>
                <input
                  type="text"
                  value={settings.cta_button_url || ""}
                  onChange={(e) => setSettings({ ...settings, cta_button_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow transition"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Newsletter & CTA"}
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 6: VERSION CONTROL ────────────────────────────────────────── */}
      {activeTab === "versions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Published Snapshot History ({versions.length} Versions)
            </h3>
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Create Snapshot Now
            </button>
          </div>

          <div className="space-y-3">
            {versions.map((ver) => (
              <div
                key={ver.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                      Version #{ver.version_number}
                    </span>
                    <span className="text-xs text-slate-500">
                      Published on {new Date(ver.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Snapshot contains complete footer state, navigation columns, links, and branding.
                  </p>
                </div>

                <button
                  onClick={() => handleRestoreVersion(ver.id)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────────── */}

      {/* Column Modal */}
      {isColumnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingColumn ? "Edit Column" : "Add Navigation Column"}
              </h3>
              <button onClick={() => setIsColumnModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Column Title *
                </label>
                <input
                  type="text"
                  required
                  value={columnForm.title}
                  onChange={(e) => setColumnForm({ ...columnForm, title: e.target.value })}
                  placeholder="e.g. Marketplace"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  value={columnForm.slug}
                  onChange={(e) => setColumnForm({ ...columnForm, slug: e.target.value })}
                  placeholder="e.g. marketplace"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={columnForm.column_order}
                  onChange={(e) => setColumnForm({ ...columnForm, column_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsColumnModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  Save Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingLink ? "Edit Navigation Link" : "Add Link"}
              </h3>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Label *
                </label>
                <input
                  type="text"
                  required
                  value={linkForm.label}
                  onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })}
                  placeholder="e.g. UI Kits & Systems"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination URL *
                </label>
                <input
                  type="text"
                  required
                  value={linkForm.url}
                  onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                  placeholder="e.g. /categories/ui-kits"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Route Type
                  </label>
                  <select
                    value={linkForm.route_type}
                    onChange={(e) => setLinkForm({ ...linkForm, route_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="internal">Internal Route (Next.js Link)</option>
                    <option value="external">External URL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Open Behavior
                  </label>
                  <select
                    value={linkForm.open_behavior}
                    onChange={(e) => setLinkForm({ ...linkForm, open_behavior: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="same_window">Same Window</option>
                    <option value="new_tab">New Tab</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Optional Badge
                  </label>
                  <input
                    type="text"
                    value={linkForm.badge_text}
                    onChange={(e) => setLinkForm({ ...linkForm, badge_text: e.target.value })}
                    placeholder="e.g. NEW or HOT"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={linkForm.sort_order}
                    onChange={(e) => setLinkForm({ ...linkForm, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  {editingLink ? "Update Link" : "Save Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social Modal */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingSocial ? "Edit Social Account" : "Add Social Account"}
              </h3>
              <button onClick={() => setIsSocialModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSocial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Platform *
                </label>
                <select
                  value={socialForm.platform}
                  onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="twitter">Twitter / X</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="github">GitHub</option>
                  <option value="figma">Figma</option>
                  <option value="dribbble">Dribbble</option>
                  <option value="youtube">YouTube</option>
                  <option value="discord">Discord</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Profile URL *
                </label>
                <input
                  type="url"
                  required
                  value={socialForm.url}
                  onChange={(e) => setSocialForm({ ...socialForm, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={socialForm.display_order}
                  onChange={(e) => setSocialForm({ ...socialForm, display_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSocialModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  Save Social
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legal Modal */}
      {isLegalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingLegal ? "Edit Legal Link" : "Add Legal Link"}
              </h3>
              <button onClick={() => setIsLegalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLegal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Title *
                </label>
                <input
                  type="text"
                  required
                  value={legalForm.label}
                  onChange={(e) => setLegalForm({ ...legalForm, label: e.target.value })}
                  placeholder="e.g. Privacy Policy"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination URL *
                </label>
                <input
                  type="text"
                  required
                  value={legalForm.url}
                  onChange={(e) => setLegalForm({ ...legalForm, url: e.target.value })}
                  placeholder="e.g. /privacy"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={legalForm.sort_order}
                  onChange={(e) => setLegalForm({ ...legalForm, sort_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLegalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  Save Legal Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
