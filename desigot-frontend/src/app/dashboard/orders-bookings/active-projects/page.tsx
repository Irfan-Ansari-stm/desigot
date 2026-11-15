"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FolderGit2,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { OrdersKpiStats } from "@/components/orders-bookings/OrdersKpiStats";
import { OrderStatusBadge } from "@/components/orders-bookings/OrderStatusBadge";

interface Milestone {
  id: string;
  milestone_number: number;
  title: string;
  status: string;
  amount_cents: number;
  due_date?: string;
}

interface Project {
  id: string;
  order_id: string;
  title: string;
  brief: string;
  status: string;
  progress_percentage: number;
  start_date: string;
  target_end_date: string;
  figma_url?: string;
  repository_url?: string;
  order_title?: string;
  order_amount_cents?: number;
  customer?: {
    display_name: string;
    email: string;
  };
  seller?: {
    display_name: string;
    email: string;
  };
  milestones: Milestone[];
}

export default function ActiveProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/orders/projects/active");
      if (res.data?.success) {
        let list = res.data.data.projects || [];
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(
            (p: Project) =>
              p.title?.toLowerCase().includes(q) ||
              p.customer?.display_name?.toLowerCase().includes(q) ||
              p.seller?.display_name?.toLowerCase().includes(q)
          );
        }
        setProjects(list);
        setTotal(list.length);
      }
    } catch (err) {
      console.error("Failed to load active projects:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="space-y-6 pb-12">
      <OrdersKpiStats />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Active Design & Development Projects</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {total} Projects Active
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time milestone progress tracking, sprint delivery deadlines, and escrow escrow release checkpoints
          </p>
        </div>

        <button
          onClick={fetchProjects}
          className="p-2.5 self-start md:self-auto rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh Projects"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800/80 shadow-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active projects by title, client, or designer..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0f172a] border border-slate-800 text-slate-400">
          <Layers className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="font-semibold text-slate-200">No active projects found</p>
          <p className="text-xs text-slate-500 mt-1">All design sprints are either completed or pending kickoff</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800/80 hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/dashboard/orders-bookings/${project.order_id}`}
                      className="font-bold text-white text-base hover:text-amber-400 transition-colors line-clamp-1"
                    >
                      {project.title}
                    </Link>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Order #{project.order_id?.slice(0, 8)} • Client:{" "}
                      <span className="text-slate-200 font-medium">{project.customer?.display_name || "Enterprise"}</span>
                    </div>
                  </div>
                  <OrderStatusBadge status={project.status} />
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-400">Sprint Progress</span>
                    <span className="text-amber-400 font-mono">{project.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-purple-600 transition-all duration-500 rounded-full"
                      style={{ width: `${project.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Milestones list */}
                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Milestone Deliverables ({project.milestones?.length || 0})
                  </span>
                  <div className="space-y-1.5">
                    {(project.milestones || []).slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              m.status === "approved" || m.status === "completed"
                                ? "text-emerald-400"
                                : "text-slate-600"
                            }`}
                          />
                          <span className="text-slate-300 font-medium">
                            M{m.milestone_number}: {m.title}
                          </span>
                        </div>
                        <span className="font-mono text-slate-400">
                          ${((m.amount_cents || 0) / 100).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Links & Workspace Button */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {project.figma_url && (
                    <a
                      href={project.figma_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Open Figma Workspace"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Figma</span>
                    </a>
                  )}
                  {project.repository_url && (
                    <a
                      href={project.repository_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Open Code Repository"
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                      <span>Repo</span>
                    </a>
                  )}
                </div>

                <Link
                  href={`/dashboard/orders-bookings/${project.order_id}`}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-600/20"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
