import api from "../lib/api";
import type { Project } from "../types/domain";

export function listProjects() {
  return api.get<Project[]>("/api/v1/projects").then((res) => res.data);
}

export function getProject(projectId: string) {
  return api.get<Project>(`/api/v1/projects/${projectId}`).then((res) => res.data);
}
