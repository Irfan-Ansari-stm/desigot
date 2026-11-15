"use client";
import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import {
  Cpu,
  Key,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Globe,
  FileCode,
  Shield,
  RefreshCw,
} from "lucide-react";
import type { ApiKey } from "@/types/rbac";

export default function ApiManagementPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    environment: "live",
    rateLimitRpm: 100,
    scopes: "read:all,write:orders",
  });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const loadKeys = async () => {
    try {
      setLoading(true);
      const res = await apiGet<ApiKey[]>("/rbac/api-keys");
      if (Array.isArray(res)) setKeys(res);
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    setNewlyCreatedKey(null);
    try {
      const res = await apiPost<ApiKey>("/rbac/api-keys", {
        name: formData.name,
        environment: formData.environment,
        rateLimitRpm: Number(formData.rateLimitRpm),
        scopes: formData.scopes.split(",").map((s) => s.trim()),
      });
      setNewlyCreatedKey(res.apiKey || "Key created successfully");
      setActionSuccess("API key generated successfully.");
      loadKeys();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to create API key");
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key?")) return;
    try {
      await apiDelete(`/rbac/api-keys/${id}`);
      setActionSuccess("API Key revoked.");
      loadKeys();
    } catch (err: any) {
      alert("Failed to revoke API key: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            API Gateway & Access Keys
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Provision machine-to-machine credentials, configure rate limits, and inspect programmatic integrations.
          </p>
        </div>

        <button
          onClick={() => {
            setNewlyCreatedKey(null);
            setIsModalOpen(true);
          }}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Generate New API Key
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

      {/* Keys Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Key Name & Prefix</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4">Rate Limit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading keys...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No active API keys found.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{k.name}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{k.key_prefix}...</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {k.owner_name || "Platform Admin"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {k.environment}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{k.rate_limit_rpm} req/min</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          k.is_active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {k.is_active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {k.is_active && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                          title="Revoke Key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE API KEY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-600" /> Generate New API Key
            </h2>

            {actionError && (
              <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {actionError}
              </div>
            )}

            {newlyCreatedKey ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Save your secret API Key now
                  </div>
                  Please copy and store this key securely. You will not be able to view it again.
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-xs break-all text-indigo-600 dark:text-indigo-400 font-bold select-all flex items-center justify-between">
                  <span>{newlyCreatedKey}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(newlyCreatedKey)}
                    className="p-1 text-slate-500 hover:text-slate-800 ml-2 shrink-0"
                    title="Copy Key"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Key Identifier / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CI/CD Integration Service"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Environment
                    </label>
                    <select
                      value={formData.environment}
                      onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="live">Live (Production)</option>
                      <option value="test">Test (Sandbox)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rate Limit (RPM)
                    </label>
                    <input
                      type="number"
                      value={formData.rateLimitRpm}
                      onChange={(e) => setFormData({ ...formData, rateLimitRpm: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scopes (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.scopes}
                    onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
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
                    Generate Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
