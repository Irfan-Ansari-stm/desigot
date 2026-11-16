"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { TrendingUp, Plus, Edit2, Trash2, X } from "lucide-react";

export const TrendingSectionsCMS: React.FC = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    heading: "",
    subtitle: "",
    trending_type: "trending_products",
    ranking_method: "hybrid",
    min_activity_threshold: 10,
    display_count: 8,
    sort_order: 1,
    is_active: true
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/trending-sections");
      if (res.data?.data) {
        setSections(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load trending sections:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingSection(null);
    setFormData({
      name: "",
      heading: "",
      subtitle: "Algorithmically calculated",
      trending_type: "trending_products",
      ranking_method: "hybrid",
      min_activity_threshold: 10,
      display_count: 8,
      sort_order: sections.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sec: any) => {
    setEditingSection(sec);
    setFormData({
      name: sec.name,
      heading: sec.heading,
      subtitle: sec.subtitle || "",
      trending_type: sec.trending_type,
      ranking_method: sec.ranking_method || "hybrid",
      min_activity_threshold: sec.min_activity_threshold || 10,
      display_count: sec.display_count || 8,
      sort_order: sec.sort_order || 1,
      is_active: sec.is_active ?? true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await api.put(`/admin/cms/trending-sections/${editingSection.id}`, formData);
      } else {
        await api.post("/admin/cms/trending-sections", formData);
      }
      setIsModalOpen(false);
      fetchSections();
    } catch (err) {
      alert("Failed to save trending section");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete trending section "${name}"?`)) return;
    try {
      await api.delete(`/admin/cms/trending-sections/${id}`);
      fetchSections();
    } catch (err) {
      alert("Failed to delete section");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Algorithmic Trending Sections ({sections.length} Sections)
          </h2>
          <p className="text-xs text-slate-500">
            Dynamically rank items based on sales momentum, page views, or hybrid scoring algorithms.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Trending Section
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading trending sections...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                    Method: {sec.ranking_method}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Display: {sec.display_count} items</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">{sec.name}</h3>
                <p className="text-xs text-purple-600 font-semibold mt-0.5">{sec.heading}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Threshold: {sec.min_activity_threshold} actions</span>
                  <span>•</span>
                  <span>Type: {sec.trending_type}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sec.is_active ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" : "bg-slate-100 text-slate-400"
                }`}>
                  {sec.is_active ? "Active" : "Inactive"}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(sec)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sec.id, sec.name)}
                    className="p-1.5 text-rose-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingSection ? "Edit Trending Section" : "Add Trending Section"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Viral Digital Assets"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Public Heading *
                </label>
                <input
                  type="text"
                  required
                  value={formData.heading}
                  onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                  placeholder="e.g. Most Downloaded Assets This Month"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ranking Method
                  </label>
                  <select
                    value={formData.ranking_method}
                    onChange={(e) => setFormData({ ...formData, ranking_method: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  >
                    <option value="hybrid">Hybrid (Score)</option>
                    <option value="sales">Sales Volume</option>
                    <option value="views">Unique Page Views</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Count
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={formData.display_count}
                    onChange={(e) => setFormData({ ...formData, display_count: parseInt(e.target.value, 10) || 8 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  />
                </div>
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
                  {editingSection ? "Update Section" : "Create Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
