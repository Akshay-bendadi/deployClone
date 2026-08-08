import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import { listEnvironments } from "../../services/deployments";

export function useEnvironmentsQuery(releaseId: string, isActive: boolean) {
  return useQuery({
    queryKey: queryKeys.environments(releaseId),
    queryFn: () => listEnvironments(releaseId),
    refetchInterval: isActive ? 2000 : false,
  });
}
