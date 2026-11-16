"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Info, Plus, Edit2, Trash2, Save, CheckCircle, Users, X } from "lucide-react";

export const AboutUsEditor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [content, setContent] = useState<any>({
    title: "",
    hero_image_url: "",
    intro: "",
    story_html: "",
    mission: "",
    vision: "",
    version: 1
  });
  const [team, setTeam] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "",
    bio: "",
    photo_url: "",
    sort_order: 1
  });

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/about");
      if (res.data?.data) {
        setContent(res.data.data.content || {});
        setTeam(res.data.data.team || []);
      }
    } catch (err) {
      console.error("Failed to load about us data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await api.put("/admin/cms/about", content);
      setContent(res.data.data);
      setSuccessMsg("About Us story & mission saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: "",
      role: "",
      bio: "",
      photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
      sort_order: team.length + 1
    });
    setIsModalOpen(true);
  };

  const openEditMember = (tm: any) => {
    setEditingMember(tm);
    setMemberForm({
      name: tm.name,
      role: tm.role,
      bio: tm.bio || "",
      photo_url: tm.photo_url || "",
      sort_order: tm.sort_order || 1
    });
    setIsModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await api.put(`/admin/cms/about/team/${editingMember.id}`, memberForm);
      } else {
        await api.post("/admin/cms/about/team", memberForm);
      }
      setIsModalOpen(false);
      fetchAboutData();
    } catch (err) {
      alert("Failed to save team member");
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Delete team member "${name}"?`)) return;
    try {
      await api.delete(`/admin/cms/about/team/${id}`);
      fetchAboutData();
    } catch (err) {
      alert("Failed to delete team member");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading About Us content...</div>;
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}

      {/* Main Story & Values Form */}
      <form onSubmit={handleSaveContent} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-600" />
              Company Story, Mission & Strategic Vision (v{content.version || 1})
            </h2>
            <p className="text-xs text-slate-500">
              Live content displayed on the public /about page.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Story"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Headline Title *
            </label>
            <input
              type="text"
              required
              value={content.title || ""}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hero Cover Image URL
            </label>
            <input
              type="url"
              value={content.hero_image_url || ""}
              onChange={(e) => setContent({ ...content, hero_image_url: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Introduction Summary
            </label>
            <textarea
              rows={2}
              value={content.intro || ""}
              onChange={(e) => setContent({ ...content, intro: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Mission Statement
            </label>
            <textarea
              rows={3}
              value={content.mission || ""}
              onChange={(e) => setContent({ ...content, mission: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Long-term Vision
            </label>
            <textarea
              rows={3}
              value={content.vision || ""}
              onChange={(e) => setContent({ ...content, vision: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Origin Story (HTML Rich Text)
            </label>
            <textarea
              rows={5}
              value={content.story_html || ""}
              onChange={(e) => setContent({ ...content, story_html: e.target.value })}
              className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </form>

      {/* Leadership Team Members */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Executive Leadership & Founding Team ({team.length} Members)
            </h3>
            <p className="text-xs text-slate-500">
              Profiles displayed on the public About page team section.
            </p>
          </div>
          <button
            onClick={openAddMember}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Team Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map((member) => (
            <div
              key={member.id}
              className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
            >
              <div>
                <img
                  src={member.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"}
                  alt={member.name}
                  className="w-16 h-16 rounded-2xl object-cover mb-3"
                />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{member.name}</h4>
                <p className="text-[11px] font-semibold text-purple-600 mt-0.5">{member.role}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{member.bio || "No biography provided"}</p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Order #{member.sort_order}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditMember(member)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="p-1 text-rose-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingMember ? "Edit Team Member" : "Add Team Member"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Role / Title *
                </label>
                <input
                  type="text"
                  required
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  placeholder="e.g. Co-Founder & Chief Product Officer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Portrait Photo URL
                </label>
                <input
                  type="url"
                  value={memberForm.photo_url}
                  onChange={(e) => setMemberForm({ ...memberForm, photo_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Biography
                </label>
                <textarea
                  rows={2}
                  value={memberForm.bio}
                  onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  {editingMember ? "Update Member" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
