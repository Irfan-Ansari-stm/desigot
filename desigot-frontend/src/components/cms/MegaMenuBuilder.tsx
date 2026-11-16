"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Grid, Plus, Edit2, Trash2, Tag, Star, X } from "lucide-react";

export const MegaMenuBuilder: React.FC = () => {
  const [columns, setColumns] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string>("");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    custom_url: "",
    badge_text: "",
    is_featured: false,
    sort_order: 1
  });

  useEffect(() => {
    fetchMegaMenu();
  }, []);

  const fetchMegaMenu = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/mega-menu");
      if (res.data?.data) {
        setColumns(res.data.data);
      }
      const catRes = await api.get("/categories");
      if (catRes.data?.data) {
        setCategories(catRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load mega menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddItemModal = (columnId: string) => {
    setTargetColumnId(columnId);
    setEditingItem(null);
    setFormData({
      title: "",
      category_id: "",
      custom_url: "/browse",
      badge_text: "",
      is_featured: false,
      sort_order: 1
    });
    setIsModalOpen(true);
  };

  const openEditItemModal = (columnId: string, item: any) => {
    setTargetColumnId(columnId);
    setEditingItem(item);
    setFormData({
      title: item.title,
      category_id: item.category_id || "",
      custom_url: item.custom_url || "",
      badge_text: item.badge_text || "",
      is_featured: item.is_featured ?? false,
      sort_order: item.sort_order || 1
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/admin/cms/mega-menu/items/${editingItem.id}`, formData);
      } else {
        await api.post(`/admin/cms/mega-menu/columns/${targetColumnId}/items`, formData);
      }
      setIsModalOpen(false);
      fetchMegaMenu();
    } catch (err) {
      alert("Failed to save mega menu item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to remove this item?")) return;
    try {
      await api.delete(`/admin/cms/mega-menu/items/${id}`);
      fetchMegaMenu();
    } catch (err) {
      alert("Failed to delete item");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Grid className="w-4 h-4 text-purple-600" />
            Marketplace Browse Mega Menu Columns & Direct Taxonomy Links
          </h2>
          <p className="text-xs text-slate-500">
            Multi-column dropdown that appears when users hover over Browse in the main navigation.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading mega menu columns...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => (
            <div
              key={col.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{col.title}</h3>
                    <span className="text-[10px] text-slate-400">Column #{col.column_order}</span>
                  </div>
                  <button
                    onClick={() => openAddItemModal(col.id)}
                    className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {col.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.title}</span>
                          {item.badge_text && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300">
                              {item.badge_text}
                            </span>
                          )}
                          {item.is_featured && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                          {item.custom_url || (item.category_name ? `/browse?category=${item.category_name}` : "#")}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditItemModal(col.id, item)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
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
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingItem ? "Edit Mega Menu Link" : "Add Link to Column"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Enterprise Design Systems"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Associate Category (Optional)
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                >
                  <option value="">(None - Custom URL)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={formData.custom_url}
                  onChange={(e) => setFormData({ ...formData, custom_url: e.target.value })}
                  placeholder="e.g. /browse?filter=top"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Badge Text (e.g. Hot, New, Pro)
                </label>
                <input
                  type="text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  placeholder="Leave empty for no badge"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="featuredCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Highlight as Featured Item
                </label>
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
                  {editingItem ? "Update Link" : "Add Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
