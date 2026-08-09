import api from "../lib/api";
import type { Deployment, Environment, TestRun } from "../types/domain";

export function listEnvironments(releaseId: string) {
  return api
    .get<Environment[]>(`/api/v1/releases/${releaseId}/environments`)
    .then((res) => res.data);
}

export function listDeploymentSteps(environmentId: string) {
  return api
    .get<Deployment[]>(`/api/v1/environments/${environmentId}/deployments`)
    .then((res) => res.data);
}

export function listTestRuns(releaseId: string) {
  return api.get<TestRun[]>(`/api/v1/releases/${releaseId}/test-runs`).then((res) => res.data);
}

export function teardownTwin(releaseId: string) {
  return api
    .post<Environment>(`/api/v1/releases/${releaseId}/candidate/teardown`)
    .then((res) => res.data);
}
