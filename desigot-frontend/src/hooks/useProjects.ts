"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from "@/lib/api";
import type { Project, Milestone, ProjectMessage, ProjectFile } from "@/types";

export const useMyProjects = (role: "buyer" | "seller" = "buyer", status?: string) =>
  useQuery({
    queryKey: ["my-projects", role, status],
    queryFn: () => apiGet<{ data: Project[] }>(`/projects/me?role=${role}${status ? `&status=${status}` : ""}`),
  });

export const useProject = (id: string) =>
  useQuery({
    queryKey: ["project", id],
    queryFn: () => apiGet<Project>(`/projects/${id}`),
    enabled: !!id,
    refetchInterval: 15_000,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { order_id: string; title: string; description: string; deadline?: string; revision_limit?: number }) =>
      apiPost<Project>("/projects", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-projects"] }),
  });
};

export const useUpdateProjectStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPatch(`/projects/${id}/status`, { status }),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ["project", id] }),
  });
};

export const useCreateMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, ...data }: Partial<Milestone> & { projectId: string }) =>
      apiPost<Milestone>(`/projects/${projectId}/milestones`, data),
    onSuccess: (_, { projectId }) => qc.invalidateQueries({ queryKey: ["project", projectId] }),
  });
};

export const useSubmitMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, milestoneId }: { projectId: string; milestoneId: string }) =>
      apiPost(`/projects/${projectId}/milestones/${milestoneId}/submit`),
    onSuccess: (_, { projectId }) => qc.invalidateQueries({ queryKey: ["project", projectId] }),
  });
};

export const useApproveMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, milestoneId }: { projectId: string; milestoneId: string }) =>
      apiPost(`/projects/${projectId}/milestones/${milestoneId}/approve`),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["seller-balance"] });
    },
  });
};

export const useProjectMessages = (projectId: string) =>
  useQuery({
    queryKey: ["project-messages", projectId],
    queryFn: () => apiGet<{ data: ProjectMessage[] }>(`/projects/${projectId}/messages?limit=100`),
    enabled: !!projectId,
    refetchInterval: 5_000,
  });

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, content, messageType = "text" }: { projectId: string; content: string; messageType?: string }) =>
      apiPost<ProjectMessage>(`/projects/${projectId}/messages`, { content, message_type: messageType }),
    onSuccess: (_, { projectId }) => qc.invalidateQueries({ queryKey: ["project-messages", projectId] }),
  });
};

export const useProjectFiles = (projectId: string) =>
  useQuery({
    queryKey: ["project-files", projectId],
    queryFn: () => apiGet<ProjectFile[]>(`/projects/${projectId}/files`),
    enabled: !!projectId,
  });

export const useUploadProjectFile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, file, milestoneId, versionNotes }: { projectId: string; file: File; milestoneId?: string; versionNotes?: string }) => {
      const fd = new FormData();
      fd.append("file", file);
      if (milestoneId) fd.append("milestone_id", milestoneId);
      if (versionNotes) fd.append("version_notes", versionNotes);
      return apiUpload<ProjectFile>(`/projects/${projectId}/files`, fd);
    },
    onSuccess: (_, { projectId }) => qc.invalidateQueries({ queryKey: ["project-files", projectId] }),
  });
};
