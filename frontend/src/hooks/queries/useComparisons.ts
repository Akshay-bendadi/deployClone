import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import { getComparisons } from "../../services/releases";

export function useComparisonsQuery(releaseId: string, isActive: boolean) {
  return useQuery({
    queryKey: queryKeys.comparisons(releaseId),
    queryFn: () => getComparisons(releaseId),
    refetchInterval: isActive ? 2000 : false,
  });
}
