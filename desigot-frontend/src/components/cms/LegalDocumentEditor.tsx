"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ShieldCheck, Save, History, RotateCcw, CheckCircle, FileText } from "lucide-react";

interface LegalDocumentEditorProps {
  docType: "terms" | "privacy" | "refund_policy";
  title: string;
  description: string;
}

export const LegalDocumentEditor: React.FC<LegalDocumentEditorProps> = ({
  docType,
  title,
  description
}) => {
  const [doc, setDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    version: "",
    content_html: "",
    change_summary: "",
    is_published: true
  });

  useEffect(() => {
    fetchDocument();
  }, [docType]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/cms/legal/${docType}`);
      if (res.data?.data) {
        setDoc(res.data.data);
        setFormData({
          title: res.data.data.title || "",
          version: res.data.data.version || "1.0.0",
          content_html: res.data.data.content_html || "",
          change_summary: "",
          is_published: res.data.data.is_published ?? true
        });
      }
    } catch (err) {
      console.error(`Failed to load ${docType}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await api.put(`/admin/cms/legal/${docType}`, formData);
      setDoc(res.data.data);
      setFormData({
        ...formData,
        change_summary: ""
      });
      setSuccessMsg(`Successfully updated ${title} and archived new version!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update legal document");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (versionId: string, versionNum: string) => {
    if (!confirm(`Are you sure you want to rollback to historical version ${versionNum}? A new restoration revision will be created to preserve audit trails.`)) return;
    setRestoringId(versionId);
    setSuccessMsg("");
    try {
      const res = await api.post(`/admin/cms/legal/${docType}/restore/${versionId}`);
      setDoc(res.data.data);
      setFormData({
        title: res.data.data.title || "",
        version: res.data.data.version || "",
        content_html: res.data.data.content_html || "",
        change_summary: "",
        is_published: true
      });
      setSuccessMsg(`Successfully restored historical version ${versionNum}!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to restore version");
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading legal document & version history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            {title} – Version Controlled Compliance Engine
          </h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}

      {/* Active Editor */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Active Published Version:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
              {doc?.version}
            </span>
            <span className="text-[11px] text-slate-400">
              (Effective: {doc?.effective_date ? new Date(doc.effective_date).toLocaleDateString() : "Active"})
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Publishing..." : "Publish New Revision"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Display Title *
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
              New Version Identifier (e.g. 2.1.0) *
            </label>
            <input
              type="text"
              required
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Change Summary / Changelog Note (Stored in Version History)
            </label>
            <input
              type="text"
              value={formData.change_summary}
              onChange={(e) => setFormData({ ...formData, change_summary: e.target.value })}
              placeholder="e.g. Updated milestone escrow terms and arbitration clause"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Legal Content (HTML Body) *
            </label>
            <textarea
              rows={12}
              required
              value={formData.content_html}
              onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
              className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 leading-relaxed"
            />
          </div>
        </div>
      </form>

      {/* Historical Versions Table with Rollback */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              Complete Revision History ({doc?.versions?.length || 0} Versions Archived)
            </h3>
            <p className="text-xs text-slate-500">
              Every update creates an immutable historical version. Super Admin can restore any previous revision at any time.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {doc?.versions?.map((v: any) => {
            const isCurrent = v.version === doc.version;
            return (
              <div key={v.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      Version {v.version}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Active Published
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {new Date(v.published_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {v.change_summary || "Document updated"}
                  </p>
                </div>

                {!isCurrent && (
                  <button
                    disabled={restoringId === v.id}
                    onClick={() => handleRestoreVersion(v.id, v.version)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {restoringId === v.id ? "Restoring..." : "Restore Version"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
