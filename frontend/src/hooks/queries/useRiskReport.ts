import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import { getRiskReport } from "../../services/releases";

export function useRiskReportQuery(releaseId: string, isActive: boolean) {
  return useQuery({
    queryKey: queryKeys.riskReport(releaseId),
    queryFn: () => getRiskReport(releaseId),
    retry: false,
    refetchInterval: isActive ? 2000 : false,
    // A 404 here just means "not tested yet" — DashboardPage already shows a dedicated
    // empty state for it, so the global error-toast handler shouldn't fire too.
    meta: { silent: true },
  });
}
