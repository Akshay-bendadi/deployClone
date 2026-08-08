import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import { listWorkflows } from "../../services/workflows";

export function useWorkflowsQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.workflows(projectId),
    queryFn: () => listWorkflows(projectId),
  });
}
