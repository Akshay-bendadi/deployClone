import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BranchDiffCard } from "../components/dashboard/branchDiffCard";
import { ReleaseStatusBadge } from "../components/status/releaseStatusBadge";
import { RiskVerdictBadge } from "../components/status/riskVerdictBadge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useBranchDiffQuery, useTestReleaseMutation } from "../hooks/queries/useReleases";
import { useRiskReportQuery } from "../hooks/queries/useRiskReport";
import { useProjectContext } from "../hooks/useProjectContext";

const TESTABLE_STATUSES = new Set(["CREATED", "SAFE", "REVIEW", "BLOCKED", "FAILED"]);

export function DashboardPage() {
  const { project, latestRelease } = useProjectContext();
  const navigate = useNavigate();
  const isActivelyTesting =
    latestRelease.status === "DEPLOYING" || latestRelease.status === "TESTING";

  const riskReportQuery = useRiskReportQuery(latestRelease.id, isActivelyTesting);
  const branchDiffQuery = useBranchDiffQuery(latestRelease.id);
  const testMutation = useTestReleaseMutation(project.id);

  const canTest = TESTABLE_STATUSES.has(latestRelease.status) && !testMutation.isPending;
  const riskReport = riskReportQuery.data;

  function handleTestRelease() {
    testMutation.mutate(latestRelease.id, {
      onSuccess: () => {
        toast.success("Release test started");
        // The deployment is what's actually happening right now — send the user
        // there to watch it live instead of leaving them on an empty risk report.
        navigate("deployment");
      },
    });
  }

  return (
    <div className="space-y-6">
      <Card className="grid gap-4 border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                Release {latestRelease.version}
              </h2>
              <ReleaseStatusBadge status={latestRelease.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Production {project.production_branch}@{project.production_commit_sha.slice(0, 7)}{" "}
              &rarr; {latestRelease.version} twin &middot; {latestRelease.branch}@
              {latestRelease.commit_sha.slice(0, 7)}
            </p>
          </div>
          <Button onClick={handleTestRelease} disabled={!canTest}>
            {testMutation.isPending ? "Starting..." : "Test Release"}
          </Button>
        </div>
      </Card>

      <BranchDiffCard
        diff={branchDiffQuery.data}
        isLoading={branchDiffQuery.isLoading}
        isError={branchDiffQuery.isError}
        productionBranch={project.production_branch}
        releaseBranch={latestRelease.branch}
      />

      {riskReportQuery.isLoading ? (
        <Card className="grid gap-4 p-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ) : riskReport ? (
        <Card className="grid gap-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Risk Report
            </p>
            <RiskVerdictBadge verdict={riskReport.verdict} />
          </div>
          <p className="font-mono text-3xl font-semibold tracking-[-0.03em]">
            {riskReport.risk_score} / 100
          </p>
          {riskReport.ai_explanation ? (
            <p className="text-sm leading-6 text-muted-foreground">{riskReport.ai_explanation}</p>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              No AI explanation available for this release — the deterministic verdict above stands
              on its own.
            </p>
          )}
        </Card>
      ) : riskReportQuery.isError ? (
        <Card className="grid gap-2 p-6">
          <p className="text-sm font-medium">
            {isActivelyTesting
              ? "Testing is in progress"
              : latestRelease.status === "FAILED"
                ? "The last attempt failed before producing a verdict"
                : "No risk report yet"}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {isActivelyTesting
              ? "Check back shortly, or watch it live on the Deployment tab."
              : latestRelease.status === "FAILED"
                ? "The twin never became reachable, so nothing was compared. Check the Deployment tab for exactly which step failed and why."
                : "Click Test Release to deploy a twin and compare it against production."}
          </p>
          {!isActivelyTesting && latestRelease.status === "FAILED" ? (
            <Button
              variant="outline"
              className="mt-1 justify-self-start"
              onClick={() => navigate("deployment")}
            >
              View deployment details
            </Button>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
