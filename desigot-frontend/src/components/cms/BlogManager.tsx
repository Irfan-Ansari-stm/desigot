"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { BookOpen, Plus, Edit2, Trash2, Eye, Tag, Search, X, CheckCircle } from "lucide-react";

export const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content_html: "",
    category_id: "",
    featured_image_url: "",
    reading_time_mins: 5,
    tag_ids: [] as string[],
    status: "published"
  });

  useEffect(() => {
    fetchPosts();
  }, [search, categoryFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cms/blog/posts", {
        params: { search: search || undefined, category_id: categoryFilter || undefined, limit: 30 }
      });
      if (res.data?.data) {
        setPosts(res.data.data);
        setTotal(res.data.total || 0);
      }
      const catRes = await api.get("/admin/cms/blog/categories");
      if (catRes.data?.data) setCategories(catRes.data.data);

      const tagRes = await api.get("/admin/cms/blog/tags");
      if (tagRes.data?.data) setTags(tagRes.data.data);
    } catch (err) {
      console.error("Failed to load blog posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content_html: "<h2>Article Overview</h2><p>Article body content...</p>",
      category_id: categories.length > 0 ? categories[0].id : "",
      featured_image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200",
      reading_time_mins: 6,
      tag_ids: [],
      status: "published"
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (post: any) => {
    try {
      const res = await api.get(`/admin/cms/blog/posts/${post.id}`);
      const p = res.data.data;
      setEditingPost(p);
      setFormData({
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || "",
        content_html: p.content_html,
        category_id: p.category_id || "",
        featured_image_url: p.featured_image_url || "",
        reading_time_mins: p.reading_time_mins || 5,
        tag_ids: (p.tags || []).map((t: any) => t.id),
        status: p.status || "published"
      });
      setIsModalOpen(true);
    } catch (err) {
      alert("Failed to load post details");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      if (editingPost) {
        await api.put(`/admin/cms/blog/posts/${editingPost.id}`, formData);
        setSuccessMsg(`Article "${formData.title}" updated successfully!`);
      } else {
        await api.post("/admin/cms/blog/posts", formData);
        setSuccessMsg(`Article "${formData.title}" published successfully!`);
      }
      setIsModalOpen(false);
      fetchPosts();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save blog post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete blog post "${title}"?`)) return;
    try {
      await api.delete(`/admin/cms/blog/posts/${id}`);
      fetchPosts();
    } catch (err) {
      alert("Failed to delete post");
    }
  };

  const toggleTag = (id: string) => {
    if (formData.tag_ids.includes(id)) {
      setFormData({ ...formData, tag_ids: formData.tag_ids.filter((t) => t !== id) });
    } else {
      setFormData({ ...formData, tag_ids: [...formData.tag_ids, id] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            Blog & Editorial Insights ({total} Articles across {categories.length} Categories)
          </h2>
          <p className="text-xs text-slate-500">
            Publish thought leadership, design system architecture guides, and platform updates.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Write Article
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title, keywords or excerpt..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Article Title</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tags</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stats</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">{post.title}</span>
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-purple-600 hover:text-purple-700 font-mono"
                    >
                      /blog/{post.slug}
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300">
                      {post.category_name || "General"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {post.tags?.slice(0, 3).map((t: any) => (
                        <span key={t.id} className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span>{post.reading_time_mins} min read</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-purple-600 font-semibold">
                        <Eye className="w-3 h-3" />
                        {post.views_count?.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(post.published_at || post.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(post)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        title="Edit Article"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingPost ? `Edit Article: ${editingPost.title}` : "Write New Editorial Article"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Article Title *
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
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
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

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Excerpt / Teaser
                  </label>
                  <textarea
                    rows={2}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.featured_image_url}
                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Content Body (HTML) *
                  </label>
                  <textarea
                    rows={10}
                    required
                    value={formData.content_html}
                    onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Associate Tags ({formData.tag_ids.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    {tags.map((t) => {
                      const isSel = formData.tag_ids.includes(t.id);
                      return (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => toggleTag(t.id)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                            isSel
                              ? "bg-purple-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          #{t.name}
                        </button>
                      );
                    })}
                  </div>
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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {saving ? "Publishing..." : editingPost ? "Update Article" : "Publish Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
