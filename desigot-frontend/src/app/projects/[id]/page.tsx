"use client";
import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { useProject, useUpdateProjectStatus, useSendMessage, useProjectMessages, useApproveMilestone, useSubmitMilestone, useUploadProjectFile, useProjectFiles } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/auth.store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { formatPrice, formatDate, timeAgo, cn } from "@/lib/utils";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { Send, Upload, CheckCircle, Clock, DollarSign, FileText, MessageSquare, Paperclip, Pin } from "lucide-react";
import type { Milestone } from "@/types";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data: project, isLoading } = useProject(id);
  const { data: msgData } = useProjectMessages(id);
  const { data: filesData } = useProjectFiles(id);
  const updateStatus    = useUpdateProjectStatus();
  const sendMessage     = useSendMessage();
  const approveMilestone = useApproveMilestone();
  const submitMilestone  = useSubmitMilestone();
  const uploadFile       = useUploadProjectFile();

  const [msg, setMsg]       = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "files" | "milestones">("messages");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = (msgData as { data: import("@/types").ProjectMessage[] } | undefined)?.data || [];
  const files    = (filesData as import("@/types").ProjectFile[] | undefined) || [];

  const isBuyer  = project?.buyer_id  === user?.id;
  const isSeller = project?.seller_id === user?.id;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    try {
      await sendMessage.mutateAsync({ projectId: id, content: msg });
      setMsg("");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadFile.mutateAsync({ projectId: id, file });
      toast.success("File uploaded");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    try {
      await approveMilestone.mutateAsync({ projectId: id, milestoneId });
      toast.success("Milestone approved! Payment released to seller.");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleSubmitMilestone = async (milestoneId: string) => {
    try {
      await submitMilestone.mutateAsync({ projectId: id, milestoneId });
      toast.success("Milestone submitted for buyer review.");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (isLoading || !project) return (
    <div className="min-h-screen bg-white"><Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-surface-50 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  const paidMilestones = project.milestones?.filter((m) => m.status === "paid").length || 0;
  const totalMilestones = project.milestones?.length || 0;

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <NotificationsPanel />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-ink-primary">{project.title}</h1>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-sm text-ink-secondary mt-1 line-clamp-2">{project.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-ink-secondary flex-wrap">
                {project.deadline && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Deadline: {formatDate(project.deadline)}</span>}
                <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />Budget: {formatPrice(project.total_budget_cents)}</span>
                <span>Revisions: {project.revisions_used}/{project.revision_limit}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Avatar src={isBuyer ? project.seller_avatar : project.buyer_avatar}
                name={isBuyer ? project.seller_name : project.buyer_name} size="md" />
              <div>
                <p className="text-xs text-ink-secondary">{isBuyer ? "Seller" : "Buyer"}</p>
                <p className="text-sm font-medium text-ink-primary">{isBuyer ? project.seller_name : project.buyer_name}</p>
              </div>
            </div>
          </div>
          {totalMilestones > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <ProgressBar value={paidMilestones} max={totalMilestones} label={`${paidMilestones}/${totalMilestones} milestones complete`} showValue size="md" color="success" />
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content (tabs) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 bg-white border border-border rounded-xl p-1">
              {[
                { key: "messages", label: "Messages", icon: <MessageSquare className="h-4 w-4" />, count: messages.length },
                { key: "files",    label: "Files",    icon: <Paperclip className="h-4 w-4" />,    count: files.length },
                { key: "milestones",label:"Milestones",icon:<CheckCircle className="h-4 w-4" />,  count: totalMilestones },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as "messages"|"files"|"milestones")}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors",
                    activeTab === tab.key ? "bg-brand text-white" : "text-ink-secondary hover:text-ink-primary")}>
                  {tab.icon} {tab.label}
                  {tab.count > 0 && <span className={cn("text-xs px-1.5 py-0.5 rounded-full", activeTab === tab.key ? "bg-white/20" : "bg-surface-100")}>{tab.count}</span>}
                </button>
              ))}
            </div>

            {/* Messages tab */}
            {activeTab === "messages" && (
              <Card padding="none">
                <div className="h-[400px] overflow-y-auto p-4 space-y-4 flex flex-col-reverse">
                  {messages.length === 0 ? (
                    <div className="text-center text-sm text-ink-secondary py-8">No messages yet. Start the conversation!</div>
                  ) : [...messages].reverse().map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={cn("flex gap-2.5", isMe && "flex-row-reverse")}>
                        <Avatar src={m.sender_avatar} name={m.sender_name || "User"} size="xs" className="shrink-0 mt-1" />
                        <div className={cn("max-w-[75%] space-y-1", isMe && "items-end flex flex-col")}>
                          <div className={cn("px-3 py-2 rounded-2xl text-sm leading-relaxed",
                            isMe ? "bg-brand text-white rounded-tr-sm" : "bg-surface-100 text-ink-primary rounded-tl-sm",
                            m.is_pinned && "ring-1 ring-accent/40")}>
                            {m.is_pinned && <span className="flex items-center gap-1 text-xs text-accent mb-1"><Pin className="h-3 w-3" />Pinned</span>}
                            {m.content}
                          </div>
                          <span className="text-[10px] text-ink-secondary/60">{timeAgo(m.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-border p-3">
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input type="hidden" ref={fileInputRef as React.RefObject<HTMLInputElement>} onChange={handleFileUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-surface-50 text-ink-secondary">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message…"
                      className="flex-1 text-sm bg-surface-50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30 border border-border" />
                    <Button type="submit" variant="accent" size="icon" loading={sendMessage.isPending}><Send className="h-4 w-4" /></Button>
                  </form>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
              </Card>
            )}

            {/* Files tab */}
            {activeTab === "files" && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-ink-primary">Project Files</h3>
                  {isSeller && (
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                      <Button variant="secondary" size="sm" leftIcon={<Upload className="h-3.5 w-3.5" />} loading={uploadFile.isPending}>Upload File</Button>
                    </label>
                  )}
                </div>
                {files.length === 0 ? (
                  <div className="text-center py-8 text-sm text-ink-secondary">No files uploaded yet</div>
                ) : (
                  <div className="space-y-2">
                    {files.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors">
                        <FileText className="h-5 w-5 text-accent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-primary truncate">{f.file_name}</p>
                          <p className="text-xs text-ink-secondary">{f.version_label} · {(f.file_size_bytes / 1024 / 1024).toFixed(1)}MB · by {f.uploaded_by_name}</p>
                          {f.version_notes && <p className="text-xs text-ink-secondary/60 mt-0.5">{f.version_notes}</p>}
                        </div>
                        <span className="text-xs text-ink-secondary">{timeAgo(f.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Milestones tab */}
            {activeTab === "milestones" && (
              <div className="space-y-3">
                {project.milestones?.length === 0 ? (
                  <Card className="text-center py-8"><p className="text-sm text-ink-secondary">No milestones defined yet.</p></Card>
                ) : project.milestones?.map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} isBuyer={isBuyer} isSeller={isSeller}
                    onApprove={() => handleApproveMilestone(milestone.id)}
                    onSubmit={() => handleSubmitMilestone(milestone.id)}
                    loading={approveMilestone.isPending || submitMilestone.isPending} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-ink-primary mb-3">Project Status</h3>
              <StatusBadge status={project.status} />
              <div className="mt-4 space-y-2">
                {isBuyer && project.status === "active" && (
                  <Button variant="secondary" size="sm" fullWidth onClick={() => updateStatus.mutate({ id, status: "in_revision" })}>Request Revision</Button>
                )}
                {isBuyer && ["active", "in_revision"].includes(project.status) && (
                  <Button variant="primary" size="sm" fullWidth onClick={() => { if (confirm("Mark this project as complete?")) updateStatus.mutate({ id, status: "complete" }); }}>
                    Mark Complete
                  </Button>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-ink-primary mb-3">Budget Overview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-secondary">Total Budget</span><span className="font-semibold text-ink-primary">{formatPrice(project.total_budget_cents)}</span></div>
                <div className="flex justify-between"><span className="text-ink-secondary">Milestones</span><span>{paidMilestones}/{totalMilestones} paid</span></div>
                <div className="flex justify-between"><span className="text-ink-secondary">Revisions</span><span>{project.revisions_used}/{project.revision_limit} used</span></div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function MilestoneCard({ milestone, isBuyer, isSeller, onApprove, onSubmit, loading }: {
  milestone: Milestone; isBuyer: boolean; isSeller: boolean;
  onApprove: () => void; onSubmit: () => void; loading: boolean;
}) {
  return (
    <Card padding="sm" className={cn(milestone.status === "paid" && "opacity-80")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-ink-primary">{milestone.title}</p>
            <StatusBadge status={milestone.status} />
          </div>
          {milestone.description && <p className="text-xs text-ink-secondary mt-1">{milestone.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-ink-secondary">
            <span className="font-semibold text-ink-primary">{formatPrice(milestone.amount_cents)}</span>
            {milestone.due_date && <span>Due: {formatDate(milestone.due_date)}</span>}
          </div>
        </div>
        <div className="shrink-0 flex flex-col gap-1.5">
          {isSeller && milestone.status === "in_progress" && (
            <Button variant="secondary" size="sm" onClick={onSubmit} loading={loading}>Submit</Button>
          )}
          {isBuyer && milestone.status === "submitted" && (
            <Button variant="accent" size="sm" onClick={onApprove} loading={loading}>Approve & Pay</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
