import { useState } from "react";

import { DeploymentStepRow } from "../components/deployment/deploymentStepRow";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useDeploymentStepsQuery, useTeardownCandidateMutation } from "../hooks/queries/useDeployments";
import { useEnvironmentsQuery } from "../hooks/queries/useEnvironments";
import { useProjectContext } from "../hooks/useProjectContext";

export function DeploymentPage() {
  const { latestRelease } = useProjectContext();
  const isActive = latestRelease.status === "DEPLOYING" || latestRelease.status === "TESTING";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const twinLabel = `${latestRelease.version} twin`;

  const environmentsQuery = useEnvironmentsQuery(latestRelease.id, isActive);
  // A release can be retried multiple times, each creating a new twin environment
  // (ordered oldest-first by the API) — always show the latest attempt, not the first.
  const candidates = environmentsQuery.data?.filter((environment) => environment.kind === "candidate");
  const candidate = candidates?.[candidates.length - 1];
  const deploymentsQuery = useDeploymentStepsQuery(candidate?.id, isActive);
  const teardownMutation = useTeardownCandidateMutation(latestRelease.id);

  const canBrowse = !!candidate?.api_url && !candidate.candidate_torn_down;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{twinLabel} deployment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live steps from the twin environment lifecycle.
        </p>
      </div>

      {!candidate ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            {isActive
              ? `Waiting for the ${twinLabel} to be created...`
              : "No twin deployed yet — click Test Release on the Dashboard to start one."}
          </p>
        </Card>
      ) : (
        <>
          {canBrowse ? (
            <Card className="flex flex-wrap items-center justify-between gap-3 p-6">
              <div>
                <p className="text-sm font-medium">{twinLabel} is live</p>
                <a
                  href={candidate.api_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline underline-offset-2"
                >
                  {candidate.api_url}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  Left running so you can inspect it. Delete it when you&rsquo;re done to stop
                  billing on Zerops.
                </p>
              </div>
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Delete twin</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete the {twinLabel}?</DialogTitle>
                    <DialogDescription>
                      Permanently deletes the running Zerops service for this twin. The
                      deployment history and test results stay intact &mdash; only the live app
                      is removed. This can&rsquo;t be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      className="bg-block text-block-foreground hover:opacity-90"
                      disabled={teardownMutation.isPending}
                      onClick={() =>
                        teardownMutation.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })
                      }
                    >
                      {teardownMutation.isPending ? "Deleting..." : "Delete twin"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          ) : candidate.candidate_torn_down ? (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                The {twinLabel}&rsquo;s service has been deleted. The steps below are kept for
                history.
              </p>
            </Card>
          ) : null}

          <Card className="grid gap-3 p-6">
            {deploymentsQuery.data?.map((step) => (
              <DeploymentStepRow key={step.id} step={step} />
            ))}
            {deploymentsQuery.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No steps recorded yet.</p>
            ) : null}
          </Card>
        </>
      )}
    </div>
  );
}
