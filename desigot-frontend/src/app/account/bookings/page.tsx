"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AccountNav } from "@/components/account/AccountNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useMyProjects } from "@/hooks/useProjects";
import { formatDate } from "@/lib/utils";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

export default function AccountBookingsPage() {
  const [filter, setFilter] = useState<string>("all");
  const { data: projectsData, isLoading } = useMyProjects("buyer");

  const projects = projectsData?.data || [];

  const filtered = projects.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <AccountNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-2xl font-black text-ink-primary">My Service Bookings</h1>
            <p className="text-sm text-ink-secondary mt-1">
              Track project milestones, seller deliverables, and revisions in progress.
            </p>
          </div>
          <Link href="/services">
            <Button variant="primary" size="sm" className="flex items-center gap-1.5">
              <CalendarCheck className="h-4 w-4" />
              Book New Service
            </Button>
          </Link>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {["all", "active", "in_revision", "complete", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider capitalize transition-colors ${
                filter === st
                  ? "bg-brand text-white"
                  : "bg-white border border-border text-ink-secondary hover:bg-surface-100"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-ink-primary text-base mb-1">No bookings found</h3>
            <p className="text-xs text-ink-secondary mb-6">
              You do not have any active service projects under this filter.
            </p>
            <Link href="/services">
              <Button variant="outline" size="sm">Explore Available Services</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((proj) => (
              <Card key={proj.id} className="p-6 hover:shadow-sm transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        color={
                          proj.status === "complete"
                            ? "success"
                            : proj.status === "active"
                            ? "warning"
                            : "info"
                        }
                        size="sm"
                      >
                        {proj.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-ink-tertiary">
                        Started {formatDate(proj.created_at)}
                      </span>
                    </div>

                    <h3 className="font-bold text-ink-primary text-base">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-ink-secondary line-clamp-2">
                      {proj.description || "Custom design and development engagement"}
                    </p>

                    {proj.deadline && (
                      <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
                        <Clock className="h-3.5 w-3.5 text-ink-tertiary" />
                        Target deadline: <span className="font-semibold">{formatDate(proj.deadline)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                    <Link href={`/projects/${proj.id}`}>
                      <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Project Room
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
