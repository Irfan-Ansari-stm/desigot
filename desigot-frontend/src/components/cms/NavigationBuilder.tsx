"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Edit2, Trash2, Menu as MenuIcon, ArrowUp, ArrowDown, Folder, CornerDownRight, ExternalLink, X } from "lucide-react";

export const NavigationBuilder: React.FC = () => {
  const [menus, setMenus] = useState<any[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    parent_id: "",
    item_type: "internal_page",
    target_url: "",
    icon: "",
    target_blank: false,
    desktop_visible: true,
    mobile_visible: true,
    sort_order: 1
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/navigation");
      if (res.data?.data) {
        setMenus(res.data.data);
        if (res.data.data.length > 0 && !activeMenuId) {
          setActiveMenuId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load menus:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentMenu = menus.find((m) => m.id === activeMenuId);
  const items = currentMenu?.items || [];

  // Group root items and children
  const rootItems = items.filter((i: any) => !i.parent_id);
  const getChildren = (parentId: string) => items.filter((i: any) => i.parent_id === parentId);

  const openCreateModal = (parentId: string = "") => {
    setEditingItem(null);
    setFormData({
      label: "",
      parent_id: parentId,
      item_type: "internal_page",
      target_url: "",
      icon: "",
      target_blank: false,
      desktop_visible: true,
      mobile_visible: true,
      sort_order: items.length + 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      parent_id: item.parent_id || "",
      item_type: item.item_type || "internal_page",
      target_url: item.target_url,
      icon: item.icon || "",
      target_blank: item.target_blank ?? false,
      desktop_visible: item.desktop_visible ?? true,
      mobile_visible: item.mobile_visible ?? true,
      sort_order: item.sort_order || 1
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMenuId) return;
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/admin/cms/navigation/items/${editingItem.id}`, formData);
      } else {
        await api.post(`/admin/cms/navigation/${activeMenuId}/items`, formData);
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save menu item");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string, label: string) => {
    if (!confirm(`Delete menu item "${label}" and all its sub-links?`)) return;
    try {
      await api.delete(`/admin/cms/navigation/items/${id}`);
      fetchMenus();
    } catch (err) {
      alert("Failed to delete menu item");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MenuIcon className="w-4 h-4 text-purple-600" />
            Navigation Menus & Nested Link Hierarchy
          </h2>
          <p className="text-xs text-slate-500">
            Configure header menus, mobile drawers, and hierarchical sub-menus across the marketplace.
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Menu Item
        </button>
      </div>

      {/* Menu Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {menus.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMenuId(m.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeMenuId === m.id
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            {m.title} <span className="opacity-60 text-[10px]">({m.items?.length || 0})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading navigation menus...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-3">
            {rootItems.map((item: any) => {
              const children = getChildren(item.id);
              return (
                <div key={item.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {item.target_url}
                      </span>
                      <span className="text-[10px] text-purple-600 font-semibold">{item.item_type}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openCreateModal(item.id)}
                        className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 text-[11px] font-semibold flex items-center gap-1"
                        title="Add Child Link"
                      >
                        <Plus className="w-3 h-3" />
                        Sub-link
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.label)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Children / Sub-items */}
                  {children.length > 0 && (
                    <div className="ml-6 pl-3 border-l-2 border-purple-200 dark:border-purple-800 space-y-2 pt-1">
                      {children.map((child: any) => (
                        <div key={child.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{child.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{child.target_url}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(child)}
                              className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(child.id, child.label)}
                              className="p-1 rounded-md text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingItem ? `Edit Menu Item: ${editingItem.label}` : "Create New Menu Item"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Menu Label *
                </label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. Design Systems"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target URL / Route *
                </label>
                <input
                  type="text"
                  required
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  placeholder="e.g. /browse?category=design-systems"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Item Type
                  </label>
                  <select
                    value={formData.item_type}
                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  >
                    <option value="internal_page">Internal Page</option>
                    <option value="category">Category</option>
                    <option value="service">Service</option>
                    <option value="product">Product</option>
                    <option value="external_url">External URL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Item
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  >
                    <option value="">(None - Top Level)</option>
                    {rootItems
                      .filter((r: any) => r.id !== editingItem?.id)
                      .map((r: any) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.target_blank}
                    onChange={(e) => setFormData({ ...formData, target_blank: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">Open in New Tab</span>
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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingItem ? "Update Item" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
