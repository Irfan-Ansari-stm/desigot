"use client";
import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import {
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Shield,
  Layers,
} from "lucide-react";
import type { AccessPolicy } from "@/types/rbac";

export default function AccessPoliciesPage() {
  const [policies, setPolicies] = useState<AccessPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    effect: "allow",
    subject_type: "role",
    resource: "*",
    action: "*",
    priority: 10,
  });
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const res = await apiGet<AccessPolicy[]>("/access-control/policies");
      if (Array.isArray(res)) setPolicies(res);
    } catch (err) {
      console.error("Failed to load access policies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    try {
      await apiPost("/access-control/policies", formData);
      setActionSuccess(`Policy "${formData.name}" created successfully.`);
      setIsModalOpen(false);
      loadPolicies();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to create policy");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this access policy?")) return;
    try {
      await apiDelete(`/access-control/policies/${id}`);
      setActionSuccess("Policy deleted.");
      loadPolicies();
    } catch (err: any) {
      alert("Failed to delete policy: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Access Control & Attribute Policies
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define fine-grained ABAC and contextual security policies that evaluate alongside RBAC roles.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: "",
              slug: "",
              description: "",
              effect: "allow",
              subject_type: "role",
              resource: "*",
              action: "*",
              priority: 10,
            });
            setIsModalOpen(true);
          }}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Create Access Policy
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Policies Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Policy Name & Slug</th>
                <th className="py-3 px-4">Effect</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading policies...
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No access policies defined.
                  </td>
                </tr>
              ) : (
                policies.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{p.name}</div>
                      <div className="font-mono text-slate-400 text-[11px]">{p.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.effect === "allow"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {p.effect}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-300">
                      {p.subject_type}
                    </td>
                    <td className="py-3 px-4 font-mono">{p.resource}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600">{p.action}</td>
                    <td className="py-3 px-4 text-center font-bold">{p.priority}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-600" /> Create Access Policy
            </h2>

            {actionError && (
              <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Policy Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deny Audit Log Export"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
                    setFormData({ ...formData, name, slug });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Effect
                  </label>
                  <select
                    value={formData.effect}
                    onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="allow">Allow</option>
                    <option value="deny">Deny (Override)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Resource
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. audit or *"
                    value={formData.resource}
                    onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Action
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EXPORT or *"
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Evaluation Priority (Higher overrides lower)
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Create Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
