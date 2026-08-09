import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import type { CreateReleasePayload } from "../../services/releases";
import {
  createRelease,
  getBranchDiff,
  getDiffAnalysis,
  listReleases,
  triggerTestRelease,
} from "../../services/releases";

const ACTIVE_POLL_MS = 2000;

export function useReleasesQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.releases(projectId ?? ""),
    queryFn: () => listReleases(projectId!),
    enabled: !!projectId,
    refetchInterval: (query) => {
      const latest = query.state.data?.[0];
      const isActive = latest?.status === "DEPLOYING" || latest?.status === "TESTING";
      return isActive ? ACTIVE_POLL_MS : false;
    },
  });
}

export function useCreateReleaseMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReleasePayload) => createRelease(projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.releases(projectId) }),
  });
}

export function useTestReleaseMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (releaseId: string) => triggerTestRelease(releaseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.releases(projectId) }),
  });
}

export function useBranchDiffQuery(releaseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.branchDiff(releaseId ?? ""),
    queryFn: () => getBranchDiff(releaseId!),
    enabled: !!releaseId,
  });
}

export function useDiffAnalysisQuery(releaseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.diffAnalysis(releaseId ?? ""),
    queryFn: () => getDiffAnalysis(releaseId!),
    enabled: !!releaseId,
    retry: false,
  });
}
