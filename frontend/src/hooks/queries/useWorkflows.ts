import { toast } from "sonner";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import type { WorkflowPayload } from "../../services/workflows";
import {
  createWorkflow,
  deleteWorkflow,
  listWorkflows,
  updateWorkflow,
} from "../../services/workflows";

export function useWorkflowsQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.workflows(projectId),
    queryFn: () => listWorkflows(projectId),
  });
}

export function useCreateWorkflowMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WorkflowPayload) => createWorkflow(projectId, payload),
    onSuccess: () => {
      toast.success("Workflow created");
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows(projectId) });
    },
  });
}

export function useUpdateWorkflowMutation(projectId: string, workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WorkflowPayload) => updateWorkflow(workflowId, payload),
    onSuccess: () => {
      toast.success("Workflow updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows(projectId) });
    },
  });
}

export function useDeleteWorkflowMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workflowId: string) => deleteWorkflow(workflowId),
    onSuccess: () => {
      toast.success("Workflow deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows(projectId) });
    },
  });
}
