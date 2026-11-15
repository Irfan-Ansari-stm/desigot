"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api";
import {
  Clock,
  Search,
  Filter,
  RefreshCw,
  FileText,
  User,
  Shield,
  CreditCard,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
  Download,
} from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address?: string;
  user_agent?: string;
  metadata: {
    description?: string;
    module?: string;
    severity?: string;
  } | null;
  created_at: string;
  actor_name: string;
  actor_email: string;
  actor_role: string;
}

interface ActivitiesResponse {
  data: ActivityLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const MODULES = [
  { id: "all", label: "All Modules" },
  { id: "auth", label: "Authentication" },
  { id: "orders", label: "Orders" },
  { id: "payments", label: "Payments" },
  { id: "sellers", label: "Sellers" },
  { id: "services", label: "Services" },
  { id: "products", label: "Products" },
  { id: "payouts", label: "Payouts" },
  { id: "disputes", label: "Disputes" },
  { id: "rbac", label: "RBAC & Roles" },
  { id: "system", label: "System Config" },
];

export default function RecentActivitiesPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedModule, setSelectedModule] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 15 };
      if (selectedModule !== "all") params.module = selectedModule;
      if (searchTerm) params.search = searchTerm;

      const res = await apiGet<ActivitiesResponse>("/admin/activities", params);
      if (res && res.data) {
        setActivities(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error("Activities load error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedModule, searchTerm]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Optional auto-refresh polling every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadActivities();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadActivities]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activities, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `desigot-activities-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
            Centralized Activity Timeline & Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system audit trail combining administrative actions, marketplace transactions, and governance events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              autoRefresh
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
            <span>{autoRefresh ? "Live Polling On" : "Auto-Refresh Off"}</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-indigo-500" /> Export JSON
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, actor name, or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={loadActivities}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Module Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
          {MODULES.map((m) => {
            const isSelected = selectedModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedModule(m.id);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg shrink-0 transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Activity Stream ({total} Total Records)
          </h2>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No activity records match your current filter.
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs">
                        {act.action}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {act.entity_type}
                      </span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-400 mt-1">
                      {act.metadata?.description || "Administrative audit action recorded."}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <User className="h-3 w-3 text-slate-400" />
                        {act.actor_name || "System"} ({act.actor_role || "service"})
                      </span>
                      {act.ip_address && (
                        <span>IP: {act.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(act.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    onClick={() => setSelectedActivity(act)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Eye className="h-3 w-3" /> Inspect JSON
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Inspector Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {selectedActivity.action}
                </h3>
                <p className="text-xs text-slate-500">
                  Event ID: {selectedActivity.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Actor</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedActivity.actor_name || "System"} ({selectedActivity.actor_email || "system@desigot.com"})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Entity & Resource</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedActivity.entity_type} ({selectedActivity.entity_id || "global"})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Timestamp</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedActivity.created_at}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">IP Address</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedActivity.ip_address || "127.0.0.1"}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                  Metadata & Event Context
                </h4>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(selectedActivity.metadata, null, 2)}
                </pre>
              </div>

              {selectedActivity.new_values && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                    State Values & Mutation
                  </h4>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(selectedActivity.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
