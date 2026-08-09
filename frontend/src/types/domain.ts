export type ReleaseStatus =
  | "CREATED"
  | "DEPLOYING"
  | "READY"
  | "TESTING"
  | "SAFE"
  | "REVIEW"
  | "BLOCKED"
  | "FAILED";

export type RiskVerdict = "SAFE" | "REVIEW" | "HIGH_RISK" | "BLOCK";
export type EnvironmentKind = "production" | "candidate";
export type DeploymentStatus = "pending" | "in_progress" | "complete" | "failed";
export type TestRunStatus = "pending" | "running" | "passed" | "failed";
export type ComparisonCategory = "functional" | "performance" | "worker";
export type RegressionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EnvVar = {
  key: string;
  value: string;
};

export type Project = {
  id: string;
  name: string;
  repository: string;
  production_url: string;
  zerops_runtime: string;
  production_branch: string;
  production_commit_sha: string;
  env_vars: EnvVar[];
  build_command: string | null;
  start_command: string | null;
  root_directory: string | null;
  latest_release_status: ReleaseStatus | null;
};

export type Release = {
  id: string;
  project_id: string;
  version: string;
  branch: string;
  commit_sha: string;
  status: ReleaseStatus;
  created_at: string;
};

export type Environment = {
  id: string;
  release_id: string;
  kind: EnvironmentKind;
  api_url: string;
  candidate_torn_down: boolean;
  auto_teardown_at: string | null;
};

export type BranchDiffFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
};

export type BranchDiff = {
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  files: BranchDiffFile[];
};

export type Deployment = {
  id: string;
  environment_id: string;
  step: string;
  status: DeploymentStatus;
  reason: string | null;
};

export type WorkflowStep = {
  name: string;
  method: string;
  path: string;
  body?: Record<string, unknown> | null;
};

export type Workflow = {
  id: string;
  project_id: string;
  name: string;
  steps: WorkflowStep[];
};

export type TestRun = {
  id: string;
  release_id: string;
  workflow_id: string;
  environment_id: string;
  status: TestRunStatus;
};

export type Regression = {
  id: string;
  comparison_id: string;
  severity: RegressionSeverity;
  summary: string;
};

export type Comparison = {
  id: string;
  release_id: string;
  category: ComparisonCategory;
  production_value: Record<string, unknown> | null;
  candidate_value: Record<string, unknown> | null;
  regressions: Regression[];
};

export type RiskReport = {
  id: string;
  release_id: string;
  risk_score: number;
  verdict: RiskVerdict;
  ai_explanation: string | null;
};
