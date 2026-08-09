// Domain types mirrored exactly from the backend's Pydantic response schemas
// (backend/app/schemas/*.py) — field names match the real JSON wire format
// (snake_case), since nothing on either side converts casing.

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
