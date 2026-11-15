"use client";
import React, { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";
import {
  FileText,
  Search,
  Filter,
  Download,
  Clock,
  Eye,
  Shield,
  RefreshCw,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { AuditLog } from "@/types/rbac";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSearch, setActionSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await apiGet<any>("/rbac/audit-logs", {
        action: actionSearch || undefined,
        entityType: entityFilter || undefined,
        page,
        limit: 15,
      });

      if (Array.isArray(res)) {
        setLogs(res);
        setTotalPages(1);
      } else if (res && res.data) {
        setLogs(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionSearch, entityFilter, page]);

  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ["Event ID", "Action", "Actor", "Entity Type", "Entity ID", "IP Address", "Timestamp"];
    const rows = logs.map((l) => [
      l.id,
      l.action,
      `"${l.actor_name || "System"}"`,
      l.entity_type,
      l.entity_id,
      l.ip_address || "127.0.0.1",
      l.created_at,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Immutable Audit & Activity Logs
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 uppercase">
              Append-Only Protection
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete, tamper-evident regulatory trail of administrative actions, permission mutations, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
          >
            <Download className="h-3.5 w-3.5" /> Export Audit Report (CSV)
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action name (e.g. role.create)..."
            value={actionSearch}
            onChange={(e) => {
              setActionSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Entity Types</option>
            <option value="user">User</option>
            <option value="role">Role</option>
            <option value="permission">Permission</option>
            <option value="permission_matrix">Permission Matrix</option>
            <option value="system">System / SuperAdmin</option>
            <option value="department">Department</option>
            <option value="api_key">API Key</option>
          </select>

          <button
            onClick={() => loadLogs()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No audit records match your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.actor_name || "System"}
                      </div>
                      <div className="text-[10px] text-slate-400">{log.actor_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="View Audit Diff"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUDIT DIFF MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {selectedLog.action}
                </h2>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Event ID: {selectedLog.id}
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Actor</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedLog.actor_name || "System"}
                </div>
                <div className="text-[10px] text-slate-400">{selectedLog.actor_email}</div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Target Entity</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 capitalize">
                  {selectedLog.entity_type}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">{selectedLog.entity_id}</div>
              </div>
            </div>

            {selectedLog.old_values && (
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  Previous State (Old Values)
                </h3>
                <pre className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[10px] overflow-x-auto text-slate-800 dark:text-slate-200">
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.new_values && (
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  Applied Mutation (New Values)
                </h3>
                <pre className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[10px] overflow-x-auto text-indigo-600 dark:text-indigo-400">
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
