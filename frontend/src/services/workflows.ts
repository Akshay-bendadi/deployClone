import api from "../lib/api";
import type { Workflow, WorkflowStep } from "../types/domain";

export type WorkflowPayload = {
  name: string;
  steps: WorkflowStep[];
};

export function listWorkflows(projectId: string) {
  return api.get<Workflow[]>(`/api/v1/projects/${projectId}/workflows`).then((res) => res.data);
}

export function createWorkflow(projectId: string, payload: WorkflowPayload) {
  return api
    .post<Workflow>(`/api/v1/projects/${projectId}/workflows`, payload)
    .then((res) => res.data);
}

export function updateWorkflow(workflowId: string, payload: WorkflowPayload) {
  return api.patch<Workflow>(`/api/v1/workflows/${workflowId}`, payload).then((res) => res.data);
}

export function deleteWorkflow(workflowId: string) {
  return api.delete<void>(`/api/v1/workflows/${workflowId}`).then((res) => res.data);
}
