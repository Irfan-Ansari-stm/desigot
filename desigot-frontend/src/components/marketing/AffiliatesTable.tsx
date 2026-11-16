"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Users,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  MousePointer,
  CreditCard,
  Plus,
  AlertCircle
} from "lucide-react";

export const AffiliatesTable: React.FC = () => {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Payout Modal
  const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  // Create Affiliate Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    affiliate_name: "",
    email: "",
    affiliate_type: "creator",
    commission_rate: 10.0,
    status: "approved"
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/marketing/affiliates", {
        params: { page, limit: 15, search, status }
      });
      if (res.data?.success) {
        setAffiliates(res.data.data);
        setTotal(res.data.meta?.total || res.data.total || 0);
      }
    } catch (err) {
      console.error("Error loading affiliates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, [page, search, status]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(`https://desigot.com/ref/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/marketing/affiliates/${id}/status`, { status: newStatus });
      fetchAffiliates();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update affiliate status");
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffiliate) return;
    setPayoutSubmitting(true);
    try {
      await api.post(`/admin/marketing/affiliates/${selectedAffiliate.id}/payouts`, {
        amount_cents: Math.round(payoutAmount * 100),
        payout_method: "stripe",
        notes: payoutNotes
      });
      setSelectedAffiliate(null);
      fetchAffiliates();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process payout");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      await api.post("/admin/marketing/affiliates", createForm);
      setShowCreate(false);
      setCreateForm({
        affiliate_name: "",
        email: "",
        affiliate_type: "creator",
        commission_rate: 10.0,
        status: "approved"
      });
      fetchAffiliates();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to onboard affiliate");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search affiliate name, code, email..."
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
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Onboard Affiliate
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
              <th className="py-3 px-3">Affiliate Partner</th>
              <th className="py-3 px-3">Code / Tracking</th>
              <th className="py-3 px-3">Rate</th>
              <th className="py-3 px-3">Clicks</th>
              <th className="py-3 px-3">Conversions</th>
              <th className="py-3 px-3">Revenue Driven</th>
              <th className="py-3 px-3">Approved / Pending Comm</th>
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
            ) : affiliates.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">No affiliates found.</td>
              </tr>
            ) : (
              affiliates.map((a) => {
                const appComm = (a.approved_commission_cents || 0) / 100;
                const pendComm = (a.pending_commission_cents || 0) / 100;

                return (
                  <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{a.affiliate_name}</div>
                      <div className="text-[11px] text-slate-500">{a.email}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span>{a.affiliate_code}</span>
                        <button
                          onClick={() => handleCopy(a.affiliate_code)}
                          title="Copy Link"
                          className="p-1 hover:bg-slate-100 rounded text-slate-400"
                        >
                          {copiedCode === a.affiliate_code ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-purple-600 dark:text-purple-400">
                      {a.commission_rate}%
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {(a.total_clicks || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {(a.total_conversions || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      ${((a.total_revenue_cents || 0) / 100).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-emerald-600">${appComm.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">${pendComm.toFixed(2)} pending</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          a.status === "approved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : a.status === "pending"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {appComm > 0 && (
                          <button
                            onClick={() => {
                              setSelectedAffiliate(a);
                              setPayoutAmount(appComm);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                          >
                            Payout
                          </button>
                        )}
                        {a.status === "approved" ? (
                          <button
                            onClick={() => handleStatusChange(a.id, "suspended")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600"
                            title="Suspend"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(a.id, "approved")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600"
                            title="Approve"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
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

      {/* Payout Modal */}
      {selectedAffiliate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Process Affiliate Commission Payout</h3>
              <button onClick={() => setSelectedAffiliate(null)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-500 mb-0.5">Partner</label>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedAffiliate.affiliate_name}</div>
              </div>

              <div>
                <label className="block font-medium mb-1">Payout Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Processing Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly affiliate referral payout via Stripe"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setSelectedAffiliate(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={payoutSubmitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
                  {payoutSubmitting ? "Processing..." : "Confirm Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboard Affiliate Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Onboard New Affiliate</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Partner / Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Studio Vertex Media"
                  value={createForm.affiliate_name}
                  onChange={(e) => setCreateForm({ ...createForm, affiliate_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="partner@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Affiliate Type</label>
                  <select
                    value={createForm.affiliate_type}
                    onChange={(e) => setCreateForm({ ...createForm, affiliate_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="creator">Creator</option>
                    <option value="agency">Agency</option>
                    <option value="influencer">Influencer</option>
                    <option value="partner">Strategic Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="50"
                    value={createForm.commission_rate}
                    onChange={(e) => setCreateForm({ ...createForm, commission_rate: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={createSubmitting} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold">
                  {createSubmitting ? "Onboarding..." : "Onboard Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
