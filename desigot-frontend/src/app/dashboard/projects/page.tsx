"use client";
import { useState } from "react";
import Link from "next/link";
import { useMyProjects } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/auth.store";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatPrice, formatDate } from "@/lib/utils";
import { FolderOpen, Clock } from "lucide-react";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const [role, setRole] = useState<"buyer" | "seller">(user?.role === "seller" ? "seller" : "buyer");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useMyProjects(role, status || undefined);
  const projects = (data as { data: Project[] } | undefined)?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-ink-primary">Projects</h1><p className="text-sm text-ink-secondary">Your service project workspaces</p></div>
        <div className="flex items-center gap-2">
          <Select options={[{ value: "buyer", label: "As Buyer" }, { value: "seller", label: "As Seller" }]}
            value={role} onChange={(v) => setRole(v as "buyer" | "seller")} className="w-32" />
          <Select options={[
            { value: "", label: "All" }, { value: "active", label: "Active" },
            { value: "in_revision", label: "In Revision" }, { value: "complete", label: "Complete" },
            { value: "disputed", label: "Disputed" },
          ]} value={status} onChange={setStatus} className="w-36" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState icon={<FolderOpen className="h-8 w-8" />} title="No projects yet"
          description="Projects are created when you purchase a service listing." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card hover>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-ink-primary line-clamp-1 flex-1 mr-2">{p.title}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-ink-secondary mb-3">{(p as unknown as { counterpart_name?: string })?.counterpart_name}</p>
                {(p.milestones?.length || 0) > 0 && (
                  <ProgressBar
                    value={p.milestones?.filter((m) => m.status === "paid").length || 0}
                    max={p.milestones?.length || 1}
                    label="Milestones" showValue size="sm" color="success" className="mb-3" />
                )}
                <div className="flex items-center justify-between text-xs text-ink-secondary">
                  <span className="font-medium text-ink-primary">{formatPrice(p.total_budget_cents)}</span>
                  {p.deadline ? <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(p.deadline)}</span> : <span>{formatDate(p.created_at)}</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
