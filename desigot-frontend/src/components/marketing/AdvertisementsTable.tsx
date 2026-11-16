"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Tv,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Eye,
  MousePointer,
  DollarSign,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export const AdvertisementsTable: React.FC = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    headline: "",
    ad_type: "homepage_banner",
    placement: "homepage_top",
    bid_cents: 80,
    total_budget_dollars: 500,
    daily_budget_dollars: 50,
    destination_url: "/browse",
    creative_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80"
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/marketing/ads", {
        params: { page, limit: 15, search, status }
      });
      if (res.data?.success) {
        setAds(res.data.data);
        setTotal(res.data.meta?.total || res.data.total || 0);
      }
    } catch (err) {
      console.error("Error loading advertisements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [page, search, status]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/marketing/ads/${id}/status`, { status: newStatus });
      fetchAds();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update ad status");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/admin/marketing/ads", {
        name: createForm.name,
        headline: createForm.headline,
        ad_type: createForm.ad_type,
        placement: createForm.placement,
        bid_amount_cents: createForm.bid_cents,
        total_budget_cents: Math.round(createForm.total_budget_dollars * 100),
        daily_budget_cents: Math.round(createForm.daily_budget_dollars * 100),
        destination_url: createForm.destination_url,
        creative_url: createForm.creative_url,
        status: "active"
      });
      setShowCreate(false);
      fetchAds();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create ad campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search ad campaign or headline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Ad Campaign
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
              <th className="py-3 px-3">Ad Campaign / Headline</th>
              <th className="py-3 px-3">Placement</th>
              <th className="py-3 px-3">CPC Bid</th>
              <th className="py-3 px-3">Spend / Budget</th>
              <th className="py-3 px-3">Impressions</th>
              <th className="py-3 px-3">Clicks</th>
              <th className="py-3 px-3">CTR</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={9} className="py-4 px-3"><div className="h-4 bg-slate-200 rounded w-full" /></td>
                </tr>
              ))
            ) : ads.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">No advertisements found.</td>
              </tr>
            ) : (
              ads.map((a) => {
                const spend = (a.current_spend_cents || 0) / 100;
                const budget = (a.total_budget_cents || 1) / 100;
                const pct = Math.min(100, Math.round((spend / budget) * 100));
                const imps = a.impressions || 0;
                const clicks = a.clicks || 0;
                const ctr = imps > 0 ? ((clicks / imps) * 100).toFixed(2) : "0.00";

                return (
                  <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 max-w-xs truncate">
                      <div className="font-semibold text-slate-900 dark:text-white">{a.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{a.headline}</div>
                    </td>
                    <td className="py-3 px-3 uppercase text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {a.placement?.replace("_", " ")}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-purple-600 dark:text-purple-400">
                      ${((a.bid_amount_cents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 min-w-[120px]">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>${spend.toFixed(0)}</span>
                        <span>${budget.toFixed(0)}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {imps.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {clicks.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {ctr}%
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          a.status === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : a.status === "pending_approval"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                            : a.status === "completed"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {a.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === "pending_approval" && (
                          <button
                            onClick={() => handleStatusChange(a.id, "active")}
                            title="Approve Campaign"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {a.status === "active" ? (
                          <button
                            onClick={() => handleStatusChange(a.id, "paused")}
                            title="Pause Campaign"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(a.id, "active")}
                            title="Activate Campaign"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Advertisement Campaign</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sponsored SaaS Landing Page Kit"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build Modern Dashboards in Minutes"
                  value={createForm.headline}
                  onChange={(e) => setCreateForm({ ...createForm, headline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Ad Placement</label>
                  <select
                    value={createForm.placement}
                    onChange={(e) => setCreateForm({ ...createForm, placement: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="homepage_top">Homepage Top</option>
                    <option value="sidebar_top">Sidebar Top</option>
                    <option value="browse_grid">Browse Grid</option>
                    <option value="search_top">Search Top</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">CPC Bid (Cents)</label>
                  <input
                    type="number"
                    min="10"
                    value={createForm.bid_cents}
                    onChange={(e) => setCreateForm({ ...createForm, bid_cents: parseInt(e.target.value, 10) || 50 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Total Budget ($)</label>
                  <input
                    type="number"
                    min="10"
                    value={createForm.total_budget_dollars}
                    onChange={(e) => setCreateForm({ ...createForm, total_budget_dollars: parseFloat(e.target.value) || 100 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Daily Cap ($)</label>
                  <input
                    type="number"
                    min="5"
                    value={createForm.daily_budget_dollars}
                    onChange={(e) => setCreateForm({ ...createForm, daily_budget_dollars: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold">
                  {submitting ? "Launching..." : "Launch Ad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
