// Centralized TanStack Query key factory — every hook in src/hooks/queries
// builds its keys from here so cache invalidation stays consistent.

export const queryKeys = {
  currentUser: ["auth", "me"] as const,
  projects: ["projects"] as const,
  project: (projectId: string) => ["project", projectId] as const,
  releases: (projectId: string) => ["releases", projectId] as const,
  release: (releaseId: string) => ["release", releaseId] as const,
  riskReport: (releaseId: string) => ["risk-report", releaseId] as const,
  comparisons: (releaseId: string) => ["comparisons", releaseId] as const,
  environments: (releaseId: string) => ["environments", releaseId] as const,
  deployments: (environmentId: string) => ["deployments", environmentId] as const,
  testRuns: (releaseId: string) => ["test-runs", releaseId] as const,
  workflows: (projectId: string) => ["workflows", projectId] as const,
  branchDiff: (releaseId: string) => ["branch-diff", releaseId] as const,
  repositoryBranches: (repository: string) => ["repository-branches", repository] as const,
  projectBranches: (projectId: string) => ["project-branches", projectId] as const,
};
