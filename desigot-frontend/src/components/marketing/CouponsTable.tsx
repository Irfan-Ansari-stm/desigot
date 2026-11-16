"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Search,
  Plus,
  Copy,
  Check,
  Power,
  Trash2,
  Download,
  AlertCircle,
  Tag,
  Calendar,
  Percent,
  DollarSign
} from "lucide-react";

export const CouponsTable: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: "",
    name: "",
    coupon_type: "percentage",
    discount_type: "percentage",
    discount_value: 15,
    min_order_dollars: 30,
    max_discount_dollars: 50,
    max_uses: 500,
    is_new_customer_only: false,
    end_date: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/marketing/coupons", {
        params: { page, limit: 15, search, status }
      });
      if (res.data?.success) {
        setCoupons(res.data.data);
        setTotal(res.data.meta?.total || res.data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, search, status]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/admin/marketing/coupons/${id}/toggle-status`);
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete or disable coupon ${code}?`)) return;
    try {
      await api.delete(`/admin/marketing/coupons/${id}`);
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete coupon");
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/admin/marketing/coupons/export");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `desigot-coupons-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Failed to export coupons");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post("/admin/marketing/coupons", {
        code: createForm.code,
        name: createForm.name,
        coupon_type: createForm.coupon_type,
        discount_type: createForm.discount_type,
        discount_value: createForm.discount_type === "fixed" ? Math.round(createForm.discount_value * 100) : createForm.discount_value,
        min_order_cents: Math.round((createForm.min_order_dollars || 0) * 100),
        max_discount_cents: createForm.max_discount_dollars ? Math.round(createForm.max_discount_dollars * 100) : null,
        max_uses: createForm.max_uses ? parseInt(createForm.max_uses as any, 10) : null,
        is_new_customer_only: createForm.is_new_customer_only,
        end_date: createForm.end_date ? new Date(createForm.end_date).toISOString() : null,
        status: "active"
      });
      setShowCreate(false);
      setCreateForm({
        code: "",
        name: "",
        coupon_type: "percentage",
        discount_type: "percentage",
        discount_value: 15,
        min_order_dollars: 30,
        max_discount_dollars: 50,
        max_uses: 500,
        is_new_customer_only: false,
        end_date: ""
      });
      fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search coupon code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <th className="py-3 px-3">Code</th>
              <th className="py-3 px-3">Name / Type</th>
              <th className="py-3 px-3">Discount</th>
              <th className="py-3 px-3">Min Order</th>
              <th className="py-3 px-3">Usage Progress</th>
              <th className="py-3 px-3">Expiration</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No coupons found matching your criteria.
                </td>
              </tr>
            ) : (
              coupons.map((c) => {
                const isPercentage = c.discount_type === "percentage";
                const uses = c.current_uses ?? c.uses_count ?? 0;
                const max = c.max_uses;
                const progressPct = max ? Math.min(100, Math.round((uses / max) * 100)) : null;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>{c.code}</span>
                        <button
                          onClick={() => handleCopy(c.code, c.id)}
                          title="Copy Code"
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        >
                          {copiedId === c.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{c.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{c.coupon_type}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {isPercentage ? `${parseFloat(c.discount_value)}% OFF` : `$${(parseFloat(c.discount_value) / 100).toFixed(2)} OFF`}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {c.min_order_cents > 0 ? `$${(c.min_order_cents / 100).toFixed(2)}` : "None"}
                    </td>
                    <td className="py-3 px-3 min-w-[130px]">
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                        <span>{uses.toLocaleString()} uses</span>
                        <span>{max ? max.toLocaleString() : "∞"}</span>
                      </div>
                      {progressPct !== null && (
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progressPct > 80 ? "bg-amber-500" : "bg-purple-600"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {c.end_date || c.expiration_date ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(c.end_date || c.expiration_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">Never expires</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.status === "active"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(c.id)}
                          title={c.status === "active" ? "Deactivate Coupon" : "Activate Coupon"}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                        >
                          <Power className={`w-3.5 h-3.5 ${c.status === "active" ? "text-emerald-600" : "text-slate-400"}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          title="Delete Coupon"
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
        <span>Showing {coupons.length} of {total} coupons</span>
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
            disabled={coupons.length < 15}
            onClick={() => setPage((p) => p + 1)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600" />
                Create New Promotional Coupon
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLASH30"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold uppercase text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash 30% Off Sale"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Type</label>
                  <select
                    value={createForm.discount_type}
                    onChange={(e) => setCreateForm({ ...createForm, discount_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {createForm.discount_type === "percentage" ? "Discount Percentage (%)" : "Fixed Discount ($)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={createForm.discount_value}
                    onChange={(e) => setCreateForm({ ...createForm, discount_value: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Min Order ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={createForm.min_order_dollars}
                    onChange={(e) => setCreateForm({ ...createForm, min_order_dollars: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Max Total Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={createForm.max_uses || ""}
                    onChange={(e) => setCreateForm({ ...createForm, max_uses: parseInt(e.target.value, 10) || (null as any) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={createForm.end_date}
                  onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="new_cust_check"
                  checked={createForm.is_new_customer_only}
                  onChange={(e) => setCreateForm({ ...createForm, is_new_customer_only: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <label htmlFor="new_cust_check" className="text-slate-700 dark:text-slate-300 select-none">
                  First-time customers only
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
