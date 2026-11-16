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
import { MessageSquare, ArrowRight, User, Send } from "lucide-react";

export default function AccountMessagesPage() {
  const { data: projectsData, isLoading } = useMyProjects("buyer");
  const projects = projectsData?.data || [];

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Navbar />
      <AccountNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-2xl font-black text-ink-primary">Messages & Inquiries</h1>
            <p className="text-sm text-ink-secondary mt-1">
              Direct communication channels with authors, creative sellers, and service leads.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-ink-primary text-base mb-1">No active conversations</h3>
            <p className="text-xs text-ink-secondary mb-6">
              When you book a service or message an author, your direct conversation threads will appear here.
            </p>
            <Link href="/services">
              <Button variant="outline" size="sm">Explore Services</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((proj) => (
              <Card key={proj.id} className="p-5 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-bold">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink-primary text-sm">{proj.title}</h3>
                      <p className="text-xs text-ink-secondary">
                        Project room #{proj.id.slice(0, 8)} • Last updated {formatDate(proj.created_at)}
                      </p>
                    </div>
                  </div>

                  <Link href={`/projects/${proj.id}`}>
                    <Button variant="secondary" size="sm" className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
                      <Send className="h-3.5 w-3.5" />
                      Open Chat Thread
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
