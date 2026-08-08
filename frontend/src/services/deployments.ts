import api from "../lib/api";
import type { Deployment, TestRun } from "../types/domain";

export function listDeploymentSteps(environmentId: string) {
  return api
    .get<Deployment[]>(`/api/v1/environments/${environmentId}/deployments`)
    .then((res) => res.data);
}

export function listTestRuns(releaseId: string) {
  return api.get<TestRun[]>(`/api/v1/releases/${releaseId}/test-runs`).then((res) => res.data);
}
