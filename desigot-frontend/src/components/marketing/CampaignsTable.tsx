"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Search,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  Percent,
  Layers,
  AlertCircle
} from "lucide-react";

export const CampaignsTable: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    campaign_type: "flash_sale",
    discount_percentage: 20,
    budget_dollars: 1000,
    status: "published"
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/marketing/campaigns", {
        params: { page, limit: 15, search, status }
      });
      if (res.data?.success) {
        setCampaigns(res.data.data);
        setTotal(res.data.meta?.total || res.data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, search, status]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/marketing/campaigns/${id}/status`, { status: newStatus });
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return;
    try {
      await api.delete(`/admin/marketing/campaigns/${id}`);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete campaign");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post("/admin/marketing/campaigns", {
        name: createForm.name,
        description: createForm.description,
        campaign_type: createForm.campaign_type,
        discount_percentage: createForm.discount_percentage,
        budget_cents: Math.round((createForm.budget_dollars || 0) * 100),
        status: createForm.status
      });
      setShowCreate(false);
      setCreateForm({
        name: "",
        description: "",
        campaign_type: "flash_sale",
        discount_percentage: 20,
        budget_dollars: 1000,
        status: "published"
      });
      fetchCampaigns();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Campaign
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <th className="py-3 px-3">Campaign Name</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Discount</th>
              <th className="py-3 px-3">Budget / Spend</th>
              <th className="py-3 px-3">Revenue Driven</th>
              <th className="py-3 px-3">Items</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No promotional campaigns found.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => {
                const spend = c.current_spend_cents || 0;
                const budget = c.budget_cents || 1;
                const pct = Math.min(100, Math.round((spend / budget) * 100));

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      <div>{c.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal line-clamp-1">{c.description || "No description"}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                      {c.campaign_type?.replace("_", " ")}
                    </td>
                    <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">
                      {c.discount_percentage ?? c.discount_value}% OFF
                    </td>
                    <td className="py-3 px-3 min-w-[120px]">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>${(spend / 100).toFixed(0)}</span>
                        <span>${(budget / 100).toFixed(0)}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      ${((c.total_revenue_cents || 0) / 100).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {c.items_count ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === "active" || c.status === "published"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : c.status === "paused"
                            ? "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-400"
                            : "bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === "active" || c.status === "published" ? (
                          <button
                            onClick={() => handleStatusChange(c.id, "paused")}
                            title="Pause Campaign"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 transition"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(c.id, "active")}
                            title="Activate Campaign"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 transition"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          title="Delete Campaign"
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span>Showing {campaigns.length} of {total} campaigns</span>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-2 font-medium text-slate-800 dark:text-slate-200">{page}</span>
          <button
            disabled={campaigns.length < 15}
            onClick={() => setPage((p) => p + 1)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Discount Campaign</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Black Friday 2026 Mega Sale"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Campaign Type</label>
                  <select
                    value={createForm.campaign_type}
                    onChange={(e) => setCreateForm({ ...createForm, campaign_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="flash_sale">Flash Sale</option>
                    <option value="seasonal_sale">Seasonal Sale</option>
                    <option value="weekend_sale">Weekend Sale</option>
                    <option value="product_discount">Product Discount</option>
                    <option value="service_discount">Service Discount</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Discount (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={createForm.discount_percentage}
                    onChange={(e) => setCreateForm({ ...createForm, discount_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Promotional Budget ($)</label>
                <input
                  type="number"
                  min="0"
                  value={createForm.budget_dollars}
                  onChange={(e) => setCreateForm({ ...createForm, budget_dollars: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  {submitting ? "Publishing..." : "Launch Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
