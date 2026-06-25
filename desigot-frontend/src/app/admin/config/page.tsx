"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { Settings, ToggleLeft, ToggleRight, Save, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminConfigPage() {
  const qc = useQueryClient();
  const [editingKey, setEditingKey]   = useState<string | null>(null);
  const [editingVal, setEditingVal]   = useState("");
  const [activeTab, setActiveTab]     = useState<"config" | "flags" | "jobs">("config");

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["platform-config"],
    queryFn: () => apiGet<{ key: string; value: unknown; description?: string; is_sensitive: boolean }[]>("/admin/config"),
  });

  const { data: flags, isLoading: flagsLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: () => apiGet<{ key: string; description: string; is_enabled: boolean; rollout_percentage: number }[]>("/admin/feature-flags"),
  });

  const updateConfig = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      apiPut(`/admin/config/${key}`, { value }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform-config"] }); setEditingKey(null); toast.success("Config updated"); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateFlag = useMutation({
    mutationFn: ({ key, is_enabled, rollout_percentage }: { key: string; is_enabled: boolean; rollout_percentage: number }) =>
      apiPut(`/admin/feature-flags/${key}`, { is_enabled, rollout_percentage }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feature-flags"] }); toast.success("Feature flag updated"); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const runJob = useMutation({
    mutationFn: (job: string) => apiPut(`/admin/jobs/${job}`, {}),
    onSuccess: (data) => toast.success(`Job complete: ${JSON.stringify((data as { result: unknown })?.result || "done")}`),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const configList = config as { key: string; value: unknown; description?: string; is_sensitive: boolean }[] | undefined || [];
  const flagsList  = flags  as { key: string; description: string; is_enabled: boolean; rollout_percentage: number }[] | undefined || [];

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-ink-primary">Platform Configuration</h1><p className="text-sm text-ink-secondary">Manage platform settings, feature flags, and maintenance jobs</p></div>

      <div className="flex gap-1 bg-white border border-border rounded-xl p-1 w-fit">
        {[{ key: "config", label: "Config" }, { key: "flags", label: "Feature Flags" }, { key: "jobs", label: "Jobs" }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", activeTab === tab.key ? "bg-brand text-white" : "text-ink-secondary hover:text-ink-primary")}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Config */}
      {activeTab === "config" && (
        <Card padding="none">
          {configLoading ? <div className="h-48 animate-pulse" /> : (
            <div className="divide-y divide-border">
              {configList.map((item) => (
                <div key={item.key} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium text-ink-primary">{item.key}</p>
                    {item.description && <p className="text-xs text-ink-secondary mt-0.5">{item.description}</p>}
                  </div>
                  {editingKey === item.key ? (
                    <div className="flex items-center gap-2">
                      <Input value={editingVal} onChange={(e) => setEditingVal(e.target.value)} wrapperClassName="w-40" />
                      <Button size="sm" variant="accent" loading={updateConfig.isPending}
                        onClick={() => updateConfig.mutate({ key: item.key, value: editingVal })}><Save className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>✕</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-ink-60 max-w-[120px] truncate">{item.is_sensitive ? "•••••" : String(item.value)}</span>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100"
                        onClick={() => { setEditingKey(item.key); setEditingVal(item.is_sensitive ? "" : String(item.value)); }}>
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Feature flags */}
      {activeTab === "flags" && (
        <Card padding="none">
          {flagsLoading ? <div className="h-48 animate-pulse" /> : (
            <div className="divide-y divide-border">
              {flagsList.map((flag) => (
                <div key={flag.key} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium text-ink-primary">{flag.key}</p>
                    <p className="text-xs text-ink-secondary mt-0.5">{flag.description}</p>
                    {flag.is_enabled && flag.rollout_percentage < 100 && (
                      <p className="text-xs text-warning mt-0.5">{flag.rollout_percentage}% rollout</p>
                    )}
                  </div>
                  <button
                    onClick={() => updateFlag.mutate({ key: flag.key, is_enabled: !flag.is_enabled, rollout_percentage: flag.rollout_percentage })}
                    className="shrink-0">
                    {flag.is_enabled
                      ? <ToggleRight className="h-7 w-7 text-success" />
                      : <ToggleLeft className="h-7 w-7 text-ink-secondary/40" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Jobs */}
      {activeTab === "jobs" && (
        <Card>
          <h3 className="text-base font-semibold text-ink-primary mb-4">Maintenance Jobs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { job: "release_escrow",    label: "Release Expired Escrow", desc: "Releases held escrow past 7-day inspection window" },
              { job: "archive_projects",  label: "Archive Old Projects",   desc: "Archives completed projects older than 12 months" },
              { job: "purge_notifications",label:"Purge Notifications",    desc: "Removes read notifications older than 90 days" },
              { job: "purge_sessions",    label: "Purge Expired Sessions", desc: "Cleans up expired JWT refresh tokens" },
              { job: "refresh_categories",label: "Refresh Category Counts",desc: "Recalculates listing counts per category" },
            ].map((j) => (
              <div key={j.job} className="flex items-start justify-between gap-3 p-4 bg-surface-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-ink-primary">{j.label}</p>
                  <p className="text-xs text-ink-secondary mt-0.5">{j.desc}</p>
                </div>
                <Button variant="secondary" size="sm" loading={runJob.isPending} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={() => runJob.mutate(j.job)}>
                  Run
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
