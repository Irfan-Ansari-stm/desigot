"use strict";
import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Sliders,
  History,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";

export const ReviewModerationPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"rules" | "settings" | "audit">("rules");

  // Rules state
  const [rules, setRules] = useState<any[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [addRuleModalOpen, setAddRuleModalOpen] = useState(false);
  const [newRuleData, setNewRuleData] = useState({
    rule_name: "",
    rule_code: "",
    category: "keywords",
    condition_type: "contains_keywords",
    action: "flag_for_review",
    severity: "medium",
    keywordsText: ""
  });
  const [ruleActionLoading, setRuleActionLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<any>({
    profanity_filter_enabled: true,
    verified_purchase_required: true,
    seller_response_moderation: true,
    report_auto_investigation_threshold: 3
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit, setAuditLimit] = useState(20);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");

  const fetchRules = async () => {
    try {
      setRulesLoading(true);
      const res = await api.get("/admin/reviews/moderation/rules");
      if (res.data?.success) setRules(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRulesLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await api.get("/admin/reviews/moderation/settings");
      if (res.data?.success) {
        const raw = res.data.data;
        setSettings({
          profanity_filter_enabled: raw.profanity_filter_enabled?.value ?? true,
          verified_purchase_required: raw.verified_purchase_required?.value ?? true,
          seller_response_moderation: raw.seller_response_moderation?.value ?? true,
          report_auto_investigation_threshold: raw.report_auto_investigation_threshold?.value ?? 3
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchAudit = async () => {
    try {
      setAuditLoading(true);
      const params = new URLSearchParams({
        page: String(auditPage),
        limit: String(auditLimit)
      });
      if (auditSearch) params.append("search", auditSearch);

      const res = await api.get(`/admin/reviews/moderation/audit-trail?${params.toString()}`);
      if (res.data?.success) {
        setAuditLogs(res.data.data || []);
        setAuditTotal(res.data.pagination?.total || 0);
        setAuditTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "rules") fetchRules();
    else if (activeTab === "settings") fetchSettings();
    else if (activeTab === "audit") fetchAudit();
  }, [activeTab, auditPage]);

  const handleToggleRule = async (id: string) => {
    try {
      await api.patch(`/admin/reviews/moderation/rules/${id}/toggle`);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm("Delete this moderation rule?")) return;
    try {
      await api.delete(`/admin/reviews/moderation/rules/${id}`);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleData.rule_name || !newRuleData.rule_code) return;
    try {
      setRuleActionLoading(true);
      const params: any = {};
      if (newRuleData.condition_type === "contains_keywords") {
        params.keywords = newRuleData.keywordsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const res = await api.post("/admin/reviews/moderation/rules", {
        rule_name: newRuleData.rule_name,
        rule_code: newRuleData.rule_code,
        category: newRuleData.category,
        condition_type: newRuleData.condition_type,
        action: newRuleData.action,
        severity: newRuleData.severity,
        parameters: params
      });

      if (res.data?.success) {
        setAddRuleModalOpen(false);
        setNewRuleData({
          rule_name: "",
          rule_code: "",
          category: "keywords",
          condition_type: "contains_keywords",
          action: "flag_for_review",
          severity: "medium",
          keywordsText: ""
        });
        await fetchRules();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRuleActionLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsLoading(true);
      await api.put("/admin/reviews/moderation/settings", settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Tab Navigation */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "rules"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Moderation Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "settings"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Sliders className="w-4 h-4" />
            System Review Policies
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "audit"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <History className="w-4 h-4" />
            Audit Trail
          </button>
        </div>

        {activeTab === "rules" && (
          <button
            onClick={() => setAddRuleModalOpen(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Moderation Rule
          </button>
        )}
      </div>

      {/* Tab 1: Rules */}
      {activeTab === "rules" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Rule Code & Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Condition Type</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Matches</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {rulesLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No moderation rules defined.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                        {rule.rule_code}
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                        {rule.rule_name}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        {rule.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {rule.condition_type}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="capitalize font-semibold text-purple-700 dark:text-purple-400">
                        {rule.action.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {rule.severity === "critical" ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          CRITICAL
                        </span>
                      ) : rule.severity === "high" ? (
                        <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                          HIGH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-medium text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          MEDIUM
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      {rule.matches_count || 0}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          rule.is_active ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            rule.is_active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Settings */}
      {activeTab === "settings" && (
        <div className="p-6 max-w-2xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Automated Profanity & Abuse Filter
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automatically flags reviews containing abusive or vulgar language for manual audit.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.profanity_filter_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, profanity_filter_enabled: e.target.checked })
                }
                className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Verified Purchase Requirement
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Only customers who have completed an order or booking can submit marketplace reviews.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.verified_purchase_required}
                onChange={(e) =>
                  setSettings({ ...settings, verified_purchase_required: e.target.checked })
                }
                className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Seller Response Moderation
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Require administrator review and approval before seller replies become publicly visible.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.seller_response_moderation}
                onChange={(e) =>
                  setSettings({ ...settings, seller_response_moderation: e.target.checked })
                }
                className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <label className="text-sm font-semibold text-slate-900 dark:text-white block mb-1">
                Report Auto-Investigation Threshold
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Number of unique customer reports required to automatically escalate a review to the high-priority investigation queue.
              </p>
              <input
                type="number"
                min={1}
                max={20}
                value={settings.report_auto_investigation_threshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    report_auto_investigation_threshold: parseInt(e.target.value, 10) || 1
                  })
                }
                className="w-32 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              disabled={settingsLoading}
              onClick={handleSaveSettings}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Moderation Policies
            </button>
            {settingsSaved && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Policies updated successfully!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Audit Trail */}
      {activeTab === "audit" && (
        <div>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuditPage(1);
                fetchAudit();
              }}
              className="relative w-64"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </form>
            <span className="text-xs text-slate-500 font-medium">
              {auditTotal} Recorded Moderation Actions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Review Ref</th>
                  <th className="py-3 px-4">Status Transition</th>
                  <th className="py-3 px-4">Moderator Rationale</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {auditLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={6} className="py-4 px-4">
                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="capitalize font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {log.action_type.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-purple-600 dark:text-purple-400 font-semibold">
                        {log.review_reference || "-"}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {log.previous_status || "none"} → {log.new_status || "updated"}
                      </td>

                      <td className="py-3.5 px-4 max-w-[260px]">
                        <p className="text-slate-700 dark:text-slate-300 truncate">
                          {log.reason || "Action confirmed by administrator"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {log.mod_first_name} {log.mod_last_name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {log.mod_email}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page {auditPage} of {auditTotalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={auditPage <= 1}
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={auditPage >= auditTotalPages}
                onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {addRuleModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Create Moderation Rule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Configure an automated rule to evaluate incoming review submissions.
            </p>

            <form onSubmit={handleCreateRule} className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRuleData.rule_name}
                  onChange={(e) => setNewRuleData({ ...newRuleData, rule_name: e.target.value })}
                  placeholder="e.g. Off-Platform Solicitations Filter"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Rule Code (Unique) *
                </label>
                <input
                  type="text"
                  required
                  value={newRuleData.rule_code}
                  onChange={(e) =>
                    setNewRuleData({ ...newRuleData, rule_code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. RULE-OFF-PLATFORM-01"
                  className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={newRuleData.category}
                    onChange={(e) => setNewRuleData({ ...newRuleData, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="keywords">Keywords / Blacklist</option>
                    <option value="profanity">Profanity</option>
                    <option value="links">External Links</option>
                    <option value="pii">PII / Contact Info</option>
                    <option value="suspicious_activity">Suspicious Activity</option>
                    <option value="rating_anomaly">Rating Anomaly</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Condition Type
                  </label>
                  <select
                    value={newRuleData.condition_type}
                    onChange={(e) => setNewRuleData({ ...newRuleData, condition_type: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="contains_keywords">Contains Keywords</option>
                    <option value="contains_phone_email">Contains Phone / Email</option>
                    <option value="contains_urls">Contains External Links</option>
                    <option value="text_length_below">Text Length Below</option>
                    <option value="rating_below">Rating Below</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Enforcement Action
                  </label>
                  <select
                    value={newRuleData.action}
                    onChange={(e) => setNewRuleData({ ...newRuleData, action: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="flag_for_review">Flag for Moderator Review</option>
                    <option value="auto_reject">Auto-Reject</option>
                    <option value="auto_approve">Auto-Approve</option>
                    <option value="require_manager_audit">Require Manager Audit</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Severity
                  </label>
                  <select
                    value={newRuleData.severity}
                    onChange={(e) => setNewRuleData({ ...newRuleData, severity: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {newRuleData.condition_type === "contains_keywords" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newRuleData.keywordsText}
                    onChange={(e) => setNewRuleData({ ...newRuleData, keywordsText: e.target.value })}
                    placeholder="keyword1, keyword2, scam, refund"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddRuleModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ruleActionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
