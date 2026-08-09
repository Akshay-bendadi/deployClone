import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BranchDiffCard } from "../components/dashboard/branchDiffCard";
import { RiskVerdictBadge } from "../components/status/riskVerdictBadge";
import { TwinGlyph } from "../components/twinGlyph";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useBranchDiffQuery, useTestReleaseMutation } from "../hooks/queries/useReleases";
import { useRiskReportQuery } from "../hooks/queries/useRiskReport";
import { useProjectContext } from "../hooks/useProjectContext";
import { cn } from "../lib/utils";

const TESTABLE_STATUSES = new Set(["CREATED", "SAFE", "REVIEW", "BLOCKED", "FAILED"]);

const VERDICT_METER_CLASS: Record<string, string> = {
  SAFE: "bg-safe",
  REVIEW: "bg-review",
  HIGH_RISK: "bg-block",
  BLOCK: "bg-block",
};

function ComparisonPane({
  dashed,
  eyebrow,
  branch,
  sha,
  href,
}: {
  dashed?: boolean;
  eyebrow: string;
  branch: string;
  sha: string;
  href?: string;
}) {
  return (
    <div className="grid gap-2 bg-card p-5">
      <p className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        <TwinGlyph
          className={cn("h-3 w-3", dashed ? "text-muted-foreground opacity-70" : "text-primary")}
        />
        {eyebrow}
      </p>
      <p className="font-mono text-sm">
        {branch}
        <span className="text-muted-foreground">@{sha.slice(0, 7)}</span>
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Open live
          <ArrowUpRight className="h-3 w-3" />
        </a>
      ) : null}
    </div>
  );
}

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
      <Card className="flex flex-wrap items-center justify-between gap-4 border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent p-6">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Release
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
            {latestRelease.version}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deploys an isolated twin from this branch and compares it against production before it
            ships.
          </p>
        </div>
        <Button size="lg" onClick={handleTestRelease} disabled={!canTest}>
          {testMutation.isPending ? "Starting..." : "Test Release"}
        </Button>
      </Card>

      <div className="grid overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 sm:gap-px">
        <ComparisonPane
          eyebrow="Production"
          branch={project.production_branch}
          sha={project.production_commit_sha}
          href={project.production_url}
        />
        <ComparisonPane
          dashed
          eyebrow={`Twin · ${latestRelease.version}`}
          branch={latestRelease.branch}
          sha={latestRelease.commit_sha}
        />
      </div>

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
          <div className="grid gap-2">
            <div className="flex items-baseline gap-2">
              <p className="font-mono text-3xl font-semibold tracking-[-0.03em]">
                {riskReport.risk_score}
              </p>
              <p className="text-sm text-muted-foreground">/ 100</p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width]",
                  VERDICT_METER_CLASS[riskReport.verdict],
                )}
                style={{ width: `${Math.min(100, Math.max(0, riskReport.risk_score))}%` }}
              />
            </div>
          </div>
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
