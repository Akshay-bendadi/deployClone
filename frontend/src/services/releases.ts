import api from "../lib/api";
import type { Comparison, Release, RiskReport } from "../types/domain";

export type CreateReleasePayload = {
  version: string;
  branch: string;
};

export function listReleases(projectId: string) {
  return api.get<Release[]>(`/api/v1/projects/${projectId}/releases`).then((res) => res.data);
}

export function createRelease(projectId: string, payload: CreateReleasePayload) {
  return api
    .post<Release>(`/api/v1/projects/${projectId}/releases`, payload)
    .then((res) => res.data);
}

export function getRelease(releaseId: string) {
  return api.get<Release>(`/api/v1/releases/${releaseId}`).then((res) => res.data);
}

export function getRiskReport(releaseId: string) {
  return api.get<RiskReport>(`/api/v1/releases/${releaseId}/risk-report`).then((res) => res.data);
}

export function getComparisons(releaseId: string) {
  return api.get<Comparison[]>(`/api/v1/releases/${releaseId}/comparisons`).then((res) => res.data);
}

export function triggerTestRelease(releaseId: string) {
  return api.post<Release>(`/api/v1/releases/${releaseId}/test`).then((res) => res.data);
}
