// Core domain types for deployClone, mirrored from plan.txt (sections 12-27).

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

export type Project = {
  id: string;
  name: string;
  repository: string;
  productionUrl: string;
  productionVersion: string;
};

export type Release = {
  id: string;
  projectId: string;
  version: string;
  commitSha: string;
  status: ReleaseStatus;
  createdAt: string;
};

export type Environment = {
  id: string;
  releaseId: string;
  kind: "production" | "candidate";
  apiUrl: string;
};

export type Deployment = {
  id: string;
  environmentId: string;
  step: string;
  status: "pending" | "in_progress" | "complete" | "failed";
};

export type Workflow = {
  id: string;
  name: string;
  steps: string[];
};

export type TestRun = {
  id: string;
  releaseId: string;
  workflowId: string;
  environmentId: string;
  status: "pending" | "running" | "passed" | "failed";
};

export type TestResult = {
  id: string;
  testRunId: string;
  httpStatus: number;
  latencyMs: number;
  responseBody: unknown;
};

export type Comparison = {
  id: string;
  releaseId: string;
  category: "functional" | "performance" | "worker";
  productionValue: unknown;
  candidateValue: unknown;
};

export type Regression = {
  id: string;
  comparisonId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
};

export type RiskReport = {
  id: string;
  releaseId: string;
  riskScore: number;
  verdict: RiskVerdict;
  aiExplanation?: string;
};
