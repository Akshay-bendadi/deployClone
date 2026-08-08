import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import { listTestRuns } from "../../services/deployments";

export function useTestRunsQuery(releaseId: string, isActive: boolean) {
  return useQuery({
    queryKey: queryKeys.testRuns(releaseId),
    queryFn: () => listTestRuns(releaseId),
    refetchInterval: isActive ? 2000 : false,
  });
}
