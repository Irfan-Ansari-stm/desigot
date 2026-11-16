"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { HelpCircle, Plus, Edit2, Trash2, Search, X } from "lucide-react";

export const FAQManager: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    category_id: "",
    question: "",
    answer_html: "",
    page_association: "all",
    display_position: 1,
    is_published: true
  });

  useEffect(() => {
    fetchFaqs();
  }, [selectedCatId, searchQuery]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const catRes = await api.get("/admin/cms/faqs/categories");
      if (catRes.data?.data) {
        setCategories(catRes.data.data);
      }
      const res = await api.get("/admin/cms/faqs", {
        params: { category_id: selectedCatId || undefined, search: searchQuery || undefined }
      });
      if (res.data?.data) {
        setFaqs(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingFaq(null);
    setFormData({
      category_id: selectedCatId || (categories.length > 0 ? categories[0].id : ""),
      question: "",
      answer_html: "",
      page_association: "all",
      display_position: faqs.length + 1,
      is_published: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (faq: any) => {
    setEditingFaq(faq);
    setFormData({
      category_id: faq.category_id || "",
      question: faq.question,
      answer_html: faq.answer_html || "",
      page_association: faq.page_association || "all",
      display_position: faq.display_position || 1,
      is_published: faq.is_published ?? true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await api.put(`/admin/cms/faqs/${editingFaq.id}`, formData);
      } else {
        await api.post("/admin/cms/faqs", formData);
      }
      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      alert("Failed to save FAQ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await api.delete(`/admin/cms/faqs/${id}`);
      fetchFaqs();
    } catch (err) {
      alert("Failed to delete FAQ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-600" />
            Knowledge Base & FAQ Management ({faqs.length} FAQs across {categories.length} Categories)
          </h2>
          <p className="text-xs text-slate-500">
            Publish interactive FAQs across homepage, checkout, services, and the global /faq portal.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add FAQ Question
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs by question keywords..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={selectedCatId}
          onChange={(e) => setSelectedCatId(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.faqs_count})</option>
          ))}
        </select>
      </div>

      {/* FAQs List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading FAQs...</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {faqs.map((faq) => (
              <div key={faq.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {faq.category_name || "General"}
                    </span>
                    <span className="text-[10px] text-slate-400">Position #{faq.display_position}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Applies to: {faq.page_association}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{faq.question}</h3>
                  <div
                    className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: faq.answer_html }}
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(faq)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {faqs.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500">No FAQ entries found.</div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingFaq ? "Edit FAQ Entry" : "Create New FAQ"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  FAQ Category *
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. How does milestone escrow work?"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Answer (HTML Rich Text) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.answer_html}
                  onChange={(e) => setFormData({ ...formData, answer_html: e.target.value })}
                  placeholder="<p>Detailed explanation...</p>"
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Page Association
                  </label>
                  <select
                    value={formData.page_association}
                    onChange={(e) => setFormData({ ...formData, page_association: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  >
                    <option value="all">All Pages</option>
                    <option value="homepage">Homepage</option>
                    <option value="services">Services Page</option>
                    <option value="products">Product Pages</option>
                    <option value="orders">Orders & Checkout</option>
                    <option value="refunds">Refunds & Disputes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Position
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.display_position}
                    onChange={(e) => setFormData({ ...formData, display_position: parseInt(e.target.value, 10) || 1 })}
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
                  {editingFaq ? "Update FAQ" : "Create FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
