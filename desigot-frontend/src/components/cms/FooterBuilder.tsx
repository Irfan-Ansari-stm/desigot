"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Dock, Plus, Edit2, Trash2, Save, CheckCircle, X } from "lucide-react";

export const FooterBuilder: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    company_info: "",
    copyright_text: ""
  });
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [targetColId, setTargetColId] = useState("");
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [linkForm, setLinkForm] = useState({
    label: "",
    url: "",
    sort_order: 1
  });

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/footer");
      if (res.data?.data) {
        setSettings(res.data.data.settings || {});
        setColumns(res.data.data.columns || []);
      }
    } catch (err) {
      console.error("Failed to load footer configuration:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSuccessMsg("");
    try {
      await api.put("/admin/cms/footer/settings", settings);
      setSuccessMsg("Footer settings saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const openAddLink = (colId: string) => {
    setTargetColId(colId);
    setEditingLink(null);
    setLinkForm({
      label: "",
      url: "/browse",
      sort_order: 1
    });
    setIsLinkModalOpen(true);
  };

  const openEditLink = (colId: string, link: any) => {
    setTargetColId(colId);
    setEditingLink(link);
    setLinkForm({
      label: link.label,
      url: link.url,
      sort_order: link.sort_order || 1
    });
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLink) {
        await api.put(`/admin/cms/footer/links/${editingLink.id}`, linkForm);
      } else {
        await api.post(`/admin/cms/footer/columns/${targetColId}/links`, linkForm);
      }
      setIsLinkModalOpen(false);
      fetchFooterData();
    } catch (err) {
      alert("Failed to save footer link");
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this footer link?")) return;
    try {
      await api.delete(`/admin/cms/footer/links/${id}`);
      fetchFooterData();
    } catch (err) {
      alert("Failed to delete footer link");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading footer builder...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Dock className="w-4 h-4 text-purple-600" />
            Global Footer Builder & Navigation Directory ({columns.length} Columns)
          </h2>
          <p className="text-xs text-slate-500">
            Configure multi-column footer links, company copyright, and legal disclaimers.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">Footer Boilerplate & Brand Statements</h3>
          <button
            type="submit"
            disabled={savingSettings}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            {savingSettings ? "Saving..." : "Save Footer Text"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Tagline / Intro Description
            </label>
            <textarea
              rows={2}
              value={settings.company_info || ""}
              onChange={(e) => setSettings({ ...settings, company_info: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Copyright Notice Text
            </label>
            <textarea
              rows={2}
              value={settings.copyright_text || ""}
              onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </form>

      {/* Columns & Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {columns.map((col) => (
          <div
            key={col.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{col.title}</h4>
                  <span className="text-[10px] text-slate-400">Column #{col.column_order}</span>
                </div>
                <button
                  onClick={() => openAddLink(col.id)}
                  className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 hover:bg-purple-100 text-[11px] font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Link
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {col.links?.map((link: any) => (
                  <div
                    key={link.id}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">{link.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[180px]">{link.url}</span>
                    </div>

                    <div className="flex items-center gap-1">
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
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingLink ? "Edit Footer Link" : "Add Link to Column"}
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
                  placeholder="e.g. Terms of Service"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                  placeholder="e.g. /terms"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
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
                  {editingLink ? "Update Link" : "Add Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
