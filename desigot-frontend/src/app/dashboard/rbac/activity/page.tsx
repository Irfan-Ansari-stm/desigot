"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Shield,
  Layers,
  Eye,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import type { AdminActivityLog } from "@/types/rbac";

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AdminActivityLog | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await apiGet<any>("/rbac/activity", {
        action: search || undefined,
        module: selectedModule || undefined,
        page,
        limit: 20,
      });

      if (Array.isArray(res)) {
        setLogs(res);
        setTotalPages(1);
      } else if (res && res.data) {
        setLogs(Array.isArray(res.data) ? res.data : res.data.activity || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load admin activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedModule, page]);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      l.display_name?.toLowerCase().includes(query) ||
      l.email?.toLowerCase().includes(query) ||
      l.action?.toLowerCase().includes(query) ||
      l.details?.toLowerCase().includes(query)
    );
  });

  const getActionColor = (action: string) => {
    if (action.includes("DELETE") || action.includes("REVOKE") || action.includes("SUSPEND")) {
      return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    }
    if (action.includes("CREATE") || action.includes("APPROVE") || action.includes("RELEASE")) {
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    }
    if (action.includes("UPDATE") || action.includes("ASSIGN") || action.includes("PUBLISH")) {
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    }
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider mb-1">
            <Activity className="h-4 w-4" />
            Audit & Administrative Oversight
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            Admin Activity Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time audit records of configuration changes, role updates, financial transactions, and moderation actions.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Activity
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by admin, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Application Modules</option>
            <option value="roles">Roles & Permissions</option>
            <option value="users">User Operations</option>
            <option value="services">Services Catalog</option>
            <option value="finance">Finance & Escrow</option>
            <option value="marketing">Marketing & Deals</option>
            <option value="cms">CMS & Pages</option>
            <option value="communication">Support & Disputes</option>
            <option value="security">Security & Sessions</option>
            <option value="audit">Compliance Audit</option>
          </select>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            Querying administrative activity stream...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            No administrative activities found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                          {log.display_name?.charAt(0) || "A"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {log.display_name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {log.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 capitalize">
                      {log.module}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-sm truncate">
                      {log.details || "—"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {log.ip_address || "127.0.0.1"}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                        title="View Metadata"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Activity Metadata */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Activity Audit Inspection
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <span className="text-slate-400 font-semibold">Administrator:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedLog.display_name} ({selectedLog.email})
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Action:</span>
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedLog.action}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Module & Resource:</span>
                  <div className="text-slate-800 dark:text-slate-200">
                    {selectedLog.module} / {selectedLog.resource_type || "Entity"} (
                    {selectedLog.resource_id || "—"})
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">IP Address:</span>
                  <div className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedLog.ip_address}
                  </div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Details:
                </span>
                <p className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200">
                  {selectedLog.details}
                </p>
              </div>

              {selectedLog.metadata && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Event Metadata Payload:
                  </span>
                  <pre className="p-3 bg-slate-900 text-indigo-300 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
