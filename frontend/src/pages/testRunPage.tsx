import { useNavigate } from "react-router-dom";

import { WorkflowResultRow } from "../components/testRun/workflowResultRow";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useEnvironmentsQuery } from "../hooks/queries/useEnvironments";
import { useTestRunsQuery } from "../hooks/queries/useTestRuns";
import { useWorkflowsQuery } from "../hooks/queries/useWorkflows";
import { useProjectContext } from "../hooks/useProjectContext";

export function TestRunPage() {
  const { project, latestRelease } = useProjectContext();
  const navigate = useNavigate();
  const isActive = latestRelease.status === "DEPLOYING" || latestRelease.status === "TESTING";

  const workflowsQuery = useWorkflowsQuery(project.id);
  const environmentsQuery = useEnvironmentsQuery(latestRelease.id, isActive);
  const testRunsQuery = useTestRunsQuery(latestRelease.id, isActive);

  // A release can be retried multiple times, each creating a fresh production AND
  // candidate environment (ordered oldest-first by the API) — always use the latest
  // attempt's pair, not the first.
  const productionEnvs = environmentsQuery.data?.filter((e) => e.kind === "production");
  const candidateEnvs = environmentsQuery.data?.filter((e) => e.kind === "candidate");
  const productionEnv = productionEnvs?.[productionEnvs.length - 1];
  const candidateEnv = candidateEnvs?.[candidateEnvs.length - 1];
  const workflows = workflowsQuery.data ?? [];
  const testRuns = testRunsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Test Run</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each workflow run against production and the {latestRelease.version} twin.
        </p>
      </div>

      {workflowsQuery.isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : workflows.length === 0 ? (
        <Card className="grid gap-3 p-6">
          <div>
            <p className="text-sm font-medium">No workflows defined yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Test Run and Evidence stay empty until at least one workflow exists to actually
              compare production against the twin.
            </p>
          </div>
          <Button className="justify-self-start" onClick={() => navigate("../workflows")}>
            Add a workflow
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {workflows.map((workflow) => (
            <WorkflowResultRow
              key={workflow.id}
              workflow={workflow}
              productionRun={testRuns.find(
                (run) =>
                  run.workflow_id === workflow.id && run.environment_id === productionEnv?.id,
              )}
              candidateRun={testRuns.find(
                (run) => run.workflow_id === workflow.id && run.environment_id === candidateEnv?.id,
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
