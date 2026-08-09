import api from "../lib/api";
import type { EnvVar, Project } from "../types/domain";

export type CreateProjectPayload = {
  name: string;
  repository: string;
  production_url: string;
  zerops_runtime: string;
  production_branch: string;
  env_vars: EnvVar[];
  github_token?: string;
  build_command?: string;
  start_command: string;
  root_directory?: string;
};

export type UpdateProjectPayload = CreateProjectPayload;

export function listProjects() {
  return api.get<Project[]>("/api/v1/projects").then((res) => res.data);
}

export function getProject(projectId: string) {
  return api.get<Project>(`/api/v1/projects/${projectId}`).then((res) => res.data);
}

export function createProject(payload: CreateProjectPayload) {
  return api.post<Project>("/api/v1/projects", payload).then((res) => res.data);
}

export function updateProject(projectId: string, payload: UpdateProjectPayload) {
  return api.patch<Project>(`/api/v1/projects/${projectId}`, payload).then((res) => res.data);
}

export function deleteProject(projectId: string) {
  return api.delete<void>(`/api/v1/projects/${projectId}`).then((res) => res.data);
}

export function listRepositoryBranches(repository: string, githubToken?: string) {
  return api
    .post<{ branches: string[] }>("/api/v1/projects/branches", {
      repository,
      github_token: githubToken || undefined,
    })
    .then((res) => res.data.branches);
}

export function listProjectBranches(projectId: string) {
  return api
    .get<{ branches: string[] }>(`/api/v1/projects/${projectId}/branches`)
    .then((res) => res.data.branches);
}
