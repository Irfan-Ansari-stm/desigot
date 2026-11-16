"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Edit2, Trash2, Sliders, CheckCircle, X, ExternalLink } from "lucide-react";

export const HeroEditor: React.FC = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    subtitle: "",
    description: "",
    desktop_image_url: "",
    tablet_image_url: "",
    mobile_image_url: "",
    primary_cta_text: "Explore Marketplace",
    primary_cta_url: "/browse",
    secondary_cta_text: "Hire Designers",
    secondary_cta_url: "/browse?listing_type=service",
    text_align: "center",
    text_color: "#FFFFFF",
    overlay_color: "#0B0F19",
    overlay_opacity: 0.55,
    priority: 1,
    is_active: true
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/hero");
      if (res.data?.data) {
        setSlides(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load hero slides:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingSlide(null);
    setFormData({
      name: "",
      title: "",
      subtitle: "",
      description: "",
      desktop_image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920",
      tablet_image_url: "",
      mobile_image_url: "",
      primary_cta_text: "Explore Marketplace",
      primary_cta_url: "/browse",
      secondary_cta_text: "Hire Designers",
      secondary_cta_url: "/browse?listing_type=service",
      text_align: "center",
      text_color: "#FFFFFF",
      overlay_color: "#0B0F19",
      overlay_opacity: 0.55,
      priority: slides.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slide: any) => {
    setEditingSlide(slide);
    setFormData({
      name: slide.name,
      title: slide.title,
      subtitle: slide.subtitle || "",
      description: slide.description || "",
      desktop_image_url: slide.desktop_image_url,
      tablet_image_url: slide.tablet_image_url || "",
      mobile_image_url: slide.mobile_image_url || "",
      primary_cta_text: slide.primary_cta_text || "",
      primary_cta_url: slide.primary_cta_url || "",
      secondary_cta_text: slide.secondary_cta_text || "",
      secondary_cta_url: slide.secondary_cta_url || "",
      text_align: slide.text_align || "center",
      text_color: slide.text_color || "#FFFFFF",
      overlay_color: slide.overlay_color || "#0B0F19",
      overlay_opacity: parseFloat(slide.overlay_opacity || "0.55"),
      priority: slide.priority || 1,
      is_active: slide.is_active ?? true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSlide) {
        await api.put(`/admin/cms/hero/${editingSlide.id}`, formData);
      } else {
        await api.post("/admin/cms/hero", formData);
      }
      setIsModalOpen(false);
      fetchSlides();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save hero slide");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/admin/cms/hero/${id}`);
      setSlides(slides.filter((s) => s.id !== id));
    } catch (err) {
      alert("Failed to delete slide");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await api.patch(`/admin/cms/hero/${id}/toggle-status`);
      setSlides(slides.map((s) => (s.id === id ? { ...s, is_active: res.data.data.is_active } : s)));
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            Hero Slides Showcase ({slides.length} Slides)
          </h2>
          <p className="text-xs text-slate-500">
            High-impact carousel hero slides shown at the top of the Desigot marketplace.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Hero Slide
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading hero slides...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="relative h-40 bg-slate-800">
                <img
                  src={slide.desktop_image_url}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: slide.overlay_color || "#0B0F19",
                    opacity: slide.overlay_opacity || 0.55
                  }}
                />
                <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md">
                      Priority #{slide.priority}
                    </span>
                    <button
                      onClick={() => handleToggle(slide.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md transition ${
                        slide.is_active ? "bg-emerald-500/80 text-white" : "bg-slate-500/80 text-white"
                      }`}
                    >
                      {slide.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">
                      {slide.subtitle || slide.name}
                    </span>
                    <h3 className="text-sm font-bold line-clamp-2 leading-snug">{slide.title}</h3>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {slide.description || "No description"}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={slide.primary_cta_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    {slide.primary_cta_text}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {slide.secondary_cta_text && (
                    <span className="text-[11px] text-slate-400">| {slide.secondary_cta_text}</span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openEditModal(slide)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id, slide.name)}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingSlide ? `Edit Hero Slide: ${editingSlide.name}` : "Create New Hero Slide"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Internal Slide Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Priority (Order)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Headline Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Eyebrow / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Overlay Opacity (0.0 to 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={formData.overlay_opacity}
                    onChange={(e) => setFormData({ ...formData, overlay_opacity: parseFloat(e.target.value) || 0.55 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description Body
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Desktop Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.desktop_image_url}
                    onChange={(e) => setFormData({ ...formData, desktop_image_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary CTA Label
                  </label>
                  <input
                    type="text"
                    value={formData.primary_cta_text}
                    onChange={(e) => setFormData({ ...formData, primary_cta_text: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary CTA URL
                  </label>
                  <input
                    type="text"
                    value={formData.primary_cta_url}
                    onChange={(e) => setFormData({ ...formData, primary_cta_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Secondary CTA Label
                  </label>
                  <input
                    type="text"
                    value={formData.secondary_cta_text}
                    onChange={(e) => setFormData({ ...formData, secondary_cta_text: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Secondary CTA URL
                  </label>
                  <input
                    type="text"
                    value={formData.secondary_cta_url}
                    onChange={(e) => setFormData({ ...formData, secondary_cta_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingSlide ? "Update Slide" : "Create Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
