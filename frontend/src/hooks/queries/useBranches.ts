import { useMutation, useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryKeys";
import { listProjectBranches, listRepositoryBranches } from "../../services/projects";

/** For an existing project — auto-fetches using its stored GitHub token. */
export function useProjectBranchesQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projectBranches(projectId ?? ""),
    queryFn: () => listProjectBranches(projectId!),
    enabled: !!projectId,
  });
}

/** For a repository the user just typed (new project, or editing repository/token) —
 * triggered manually (e.g. on blur) rather than on every keystroke. */
export function useRepositoryBranchesMutation() {
  return useMutation({
    mutationFn: ({ repository, githubToken }: { repository: string; githubToken?: string }) =>
      listRepositoryBranches(repository, githubToken),
  });
}
