import api from "../lib/api";
import type { Workflow } from "../types/domain";

export function listWorkflows(projectId: string) {
  return api.get<Workflow[]>(`/api/v1/projects/${projectId}/workflows`).then((res) => res.data);
}
