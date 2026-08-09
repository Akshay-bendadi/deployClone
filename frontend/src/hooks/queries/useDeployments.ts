import { toast } from "sonner";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import { listDeploymentSteps, teardownCandidate } from "../../services/deployments";

export function useDeploymentStepsQuery(environmentId: string | undefined, isActive: boolean) {
  return useQuery({
    queryKey: queryKeys.deployments(environmentId ?? ""),
    queryFn: () => listDeploymentSteps(environmentId!),
    enabled: !!environmentId,
    refetchInterval: isActive ? 2000 : false,
  });
}

export function useTeardownCandidateMutation(releaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => teardownCandidate(releaseId),
    onSuccess: () => {
      toast.success("Twin service deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.environments(releaseId) });
    },
  });
}
