"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Gift,
  Plus,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";

export const ReferralProgramsTable: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    referrer_reward_dollars: 15,
    referred_reward_dollars: 10,
    min_order_dollars: 30,
    budget_dollars: 5000
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/marketing/referrals");
      if (res.data?.success) {
        setPrograms(res.data.data);
        setTotal(res.data.meta?.total || res.data.total || 0);
      }
    } catch (err) {
      console.error("Error loading referral programs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/admin/marketing/referrals", {
        name: createForm.name,
        description: createForm.description,
        referrer_reward_value: Math.round(createForm.referrer_reward_dollars * 100),
        referred_reward_value: Math.round(createForm.referred_reward_dollars * 100),
        min_order_cents: Math.round(createForm.min_order_dollars * 100),
        budget_cents: Math.round(createForm.budget_dollars * 100)
      });
      setShowCreate(false);
      fetchPrograms();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create referral program");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer & Seller Referral Programs</h3>
          <p className="text-xs text-slate-500">Configure viral reward incentives for referrers and referees</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Referral Program
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
              <th className="py-3 px-3">Program Name</th>
              <th className="py-3 px-3">Referrer Reward</th>
              <th className="py-3 px-3">Referee Reward</th>
              <th className="py-3 px-3">Min Order</th>
              <th className="py-3 px-3">Participants</th>
              <th className="py-3 px-3">Conversions</th>
              <th className="py-3 px-3">Budget Progress</th>
              <th className="py-3 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-3"><div className="h-4 bg-slate-200 rounded w-full" /></td>
                </tr>
              ))
            ) : programs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">No referral programs configured.</td>
              </tr>
            ) : (
              programs.map((p) => {
                const spend = p.current_spend_cents || 0;
                const budget = p.budget_cents || 1;
                const pct = Math.min(100, Math.round((spend / budget) * 100));

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white max-w-xs">
                      <div>{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal line-clamp-1">{p.description}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">
                      ${((p.referrer_reward_value || 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      ${((p.referred_reward_value || 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      ${((p.min_order_cents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {(p.total_participants ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {(p.total_conversions ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 min-w-[130px]">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>${(spend / 100).toFixed(0)} spent</span>
                        <span>${(budget / 100).toFixed(0)}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        {p.status}
                      </span>
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Referral Program</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Program Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Give $20, Get $20 Design Boost"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Referrer Reward ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.referrer_reward_dollars}
                    onChange={(e) => setCreateForm({ ...createForm, referrer_reward_dollars: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Referee Reward ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.referred_reward_dollars}
                    onChange={(e) => setCreateForm({ ...createForm, referred_reward_dollars: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Min Order Threshold ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.min_order_dollars}
                    onChange={(e) => setCreateForm({ ...createForm, min_order_dollars: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Total Budget ($)</label>
                  <input
                    type="number"
                    min="100"
                    value={createForm.budget_dollars}
                    onChange={(e) => setCreateForm({ ...createForm, budget_dollars: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold">
                  {submitting ? "Creating..." : "Save Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
