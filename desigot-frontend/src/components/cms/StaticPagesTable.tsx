"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FileCode, Plus, Edit2, Trash2, History, RotateCcw, Search, Eye, X, CheckCircle } from "lucide-react";

export const StaticPagesTable: React.FC = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    content_html: "",
    seo_title: "",
    seo_description: "",
    status: "published"
  });

  useEffect(() => {
    fetchPages();
  }, [search, statusFilter]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/pages", {
        params: { search: search || undefined, status: statusFilter || undefined, limit: 30 }
      });
      if (res.data?.data) {
        setPages(res.data.data);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load static pages:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedPage(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      content_html: "<h2>Page Heading</h2><p>Page body content...</p>",
      seo_title: "",
      seo_description: "",
      status: "published"
    });
    setIsEditorOpen(true);
  };

  const openEditModal = async (page: any) => {
    try {
      const res = await api.get(`/admin/cms/pages/${page.id}`);
      setSelectedPage(res.data.data);
      setFormData({
        title: res.data.data.title,
        slug: res.data.data.slug,
        description: res.data.data.description || "",
        content_html: res.data.data.content_html || "",
        seo_title: res.data.data.seo_title || "",
        seo_description: res.data.data.seo_description || "",
        status: res.data.data.status || "published"
      });
      setIsEditorOpen(true);
    } catch (err) {
      alert("Failed to load page details");
    }
  };

  const openHistoryModal = async (page: any) => {
    try {
      const res = await api.get(`/admin/cms/pages/${page.id}`);
      setSelectedPage(res.data.data);
      setIsHistoryOpen(true);
    } catch (err) {
      alert("Failed to load version history");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      if (selectedPage) {
        await api.put(`/admin/cms/pages/${selectedPage.id}`, formData);
        setSuccessMsg(`Page "${formData.title}" updated and version saved!`);
      } else {
        await api.post("/admin/cms/pages", formData);
        setSuccessMsg(`Page "${formData.title}" created successfully!`);
      }
      setIsEditorOpen(false);
      fetchPages();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete page "${title}"?`)) return;
    try {
      await api.delete(`/admin/cms/pages/${id}`);
      fetchPages();
    } catch (err) {
      alert("Failed to delete page");
    }
  };

  const handleRestoreVersion = async (versionId: string, versionNum: number) => {
    if (!confirm(`Rollback page to historical version ${versionNum}?`)) return;
    try {
      await api.post(`/admin/cms/pages/${selectedPage.id}/restore/${versionId}`);
      setIsHistoryOpen(false);
      fetchPages();
      setSuccessMsg(`Restored page to version ${versionNum}!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert("Failed to restore page version");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-purple-600" />
            Static Pages & Dynamic CMS Builder ({total} Pages)
          </h2>
          <p className="text-xs text-slate-500">
            Create rich informative pages with historical revision control, block schema, and SEO tags.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Static Page
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages by title or slug..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Page Title & Slug</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Updated</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block">{page.title}</span>
                    <a
                      href={`/pages/${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-purple-600 hover:text-purple-700 font-mono"
                    >
                      /pages/{page.slug}
                    </a>
                  </td>
                  <td className="py-3 px-4 max-w-xs text-slate-500 truncate">
                    {page.description || "No description provided"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      page.status === "published"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {page.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openHistoryModal(page)}
                        className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 hover:bg-purple-100"
                        title="Version History & Restore"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(page)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        title="Edit Page"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(page.id, page.title)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                    No static pages found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedPage ? `Edit Page: ${selectedPage.title}` : "Create New Static Page"}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Page Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    HTML Page Content *
                  </label>
                  <textarea
                    rows={10}
                    required
                    value={formData.content_html}
                    onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {saving ? "Saving..." : selectedPage ? "Save & Create Version" : "Create Page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Drawer Modal */}
      {isHistoryOpen && selectedPage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Version History: {selectedPage.title}
                </h3>
                <span className="text-[11px] text-slate-400">{selectedPage.versions?.length || 0} Saved Revisions</span>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {selectedPage.versions?.map((v: any, idx: number) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">Version #{v.version}</span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                          Active
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{new Date(v.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{v.change_notes || "Page edited"}</p>
                  </div>

                  {idx > 0 && (
                    <button
                      onClick={() => handleRestoreVersion(v.id, v.version)}
                      className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
